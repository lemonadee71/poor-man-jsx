// This is to hide the ref property an invoked state returns
// which is a reference to the original object
// to make sure we won't be able to access it outside of its intended use
const REF = Symbol('ref');

class Template {
  /**
   * Create a template
   * @param {String} str - an html string
   * @param {Array} handlers - an array of handlers
   */
  constructor(str, handlers) {
    this.str = str;
    this.handlers = handlers;
  }
}

const mockEl = document.createElement('div');
const defaultProps = [
  'textContent',
  'innerHTML',
  'outerHTML',
  'innerText',
  'style',
];
const booleanAttributes = [
  'checked',
  'selected',
  'disabled',
  'readonly',
  'multiple',
  'ismap',
  'noresize',
  'reversed',
  'autocomplete',
];

const settings = {
  addDefaultProp: (...prop) => defaultProps.push(...prop),
  addBooleanAttr: (...attr) => booleanAttributes.push(...attr),
};

/**
 * is functions used for type checking
 */
const isObject = (val) => typeof val === 'object';

const isArray = (val) => Array.isArray(val);

const isTemplate = (val) => val instanceof Template;

const isHTML = (val) => val instanceof HTMLElement;

const isState = (key) => key.startsWith('$');

const isEventListener = (key) => key.toLowerCase().startsWith('on');

const isDefaultProp = (key) => defaultProps.includes(key);

const isStyleAttribute = (key) =>
  key in mockEl.style || key.startsWith('style_');

const isBooleanAttribute = (attr) => booleanAttributes.includes(attr);

/**
 * utility functions
 */
const uniqid = (length = 8) => Math.random().toString(36).substr(2, length);

const pipe = (args, ...fns) =>
  fns.reduce((prevResult, fn) => fn(prevResult), args);

const reduceValue = (value, fn = null) => (fn ? fn.call(null, value) : value);

const reduceNode = (node) => (isTemplate(node) ? render(node) : node);

const reduceHandlerArray = (arr) =>
  arr.reduce(
    (acc, item) => {
      acc.str.push(item.str);
      acc.handlers.push(item.handlers);

      return acc;
    },
    { str: [], handlers: [] }
  );

const determineType = (key) => {
  // Any unrecognizable key will be treated as attr
  let type = 'attr';
  let k = key;

  if (isState(key)) {
    type = 'state';
  } else if (isEventListener(key)) {
    type = 'listener';
  } else if (isDefaultProp(key)) {
    type = 'prop';
  } else if (isStyleAttribute(key)) {
    type = 'style';
  } else if (key === 'children') {
    type = 'children';
  }

  if (type === 'listener') {
    k = key.toLowerCase();
  }

  return [k.replace(/^(\$|on|style_)/gi, ''), type];
};

const batchSameTypes = (obj) => {
  const batched = Object.entries(obj).reduce((acc, [rawKey, value]) => {
    const [key, type] = determineType(rawKey);

    if (!acc[type]) {
      acc[type] = {};
    }

    acc[type][key] = value;

    return acc;
  }, {});

  if (batched.state) {
    batched.state = batchSameTypes(batched.state);
  }

  return batched;
};

function generateHandler(type, obj) {
  const id = uniqid();
  const seed = uniqid(4);
  const attrName = `data-${type}-${seed}`;
  const dataAttr = `${attrName}="${id}"`;
  const handlers = [];

  Object.entries(obj).forEach(([name, value]) => {
    handlers.push({
      type,
      query: `[${dataAttr}]`,
      attr: attrName,
      data: { name, value },
      remove: false,
    });
  });

  handlers[handlers.length - 1].remove = true;

  return { str: dataAttr, handlers };
}

const generateHandlerAll = (obj) =>
  pipe(
    Object.entries(obj),
    (items) => items.map((args) => generateHandler(...args)),
    reduceHandlerArray
  );

/**
 * The parser
 * @param {*} val
 * @param {Array} handlers
 * @returns
 */
const parse = (val, handlers = []) => {
  if (isHTML(val)) {
    const id = uniqid();

    return {
      str: `<marker id="html-${id}" />`,
      handlers: [
        ...handlers.flat(),
        { type: 'html', query: `#html-${id}`, data: { value: val } },
      ],
    };
  }

  if (isTemplate(val)) {
    // Just add its string and handlers
    return {
      str: val.str,
      handlers: [...handlers, ...val.handlers],
    };
  }

  if (isArray(val)) {
    // Will be parsed as an array of object { str, handlers }
    // And will be reduced to a single { str, handlers }
    const final = reduceHandlerArray(val.map((item) => parse(item, handlers)));

    return {
      str: final.str.join(' '),
      handlers: [...handlers, ...final.handlers].flat(),
    };
  }

  if (isObject(val)) {
    const { state, ...otherTypes } = batchSameTypes(val);

    // Will be parsed to { str: [], handlers: [] }
    const a = generateHandlerAll(otherTypes);
    const b = state ? generateStateHandler(state) : { str: [], handlers: [] };

    return {
      str: [...a.str, ...b.str].join(' '),
      handlers: [...handlers, ...a.handlers, ...b.handlers].flat(),
    };
  }

  return {
    handlers,
    str: `${val}`,
  };
};

const addPlaceholders = (str) => {
  const placeholderRegex = /{%\s*(.*)\s*%}/;
  let newString = str;
  let match = newString.match(placeholderRegex);

  while (match) {
    newString = newString.replace(
      match[0],
      `<!-- placeholder-${match[1].trim()} -->`
    );

    match = newString.slice(match.index).match(placeholderRegex);
  }

  return newString;
};

/**
 * Creates a `Template` from a template literal. Must be used as a tag.
 * @param {Array.<String>} fragments
 * @param  {...(String|Object|Array|Template)} values
 * @returns {Template}
 */
const html = (fragments, ...values) => {
  const result = reduceHandlerArray(values.map((value) => parse(value)));

  const htmlString = addPlaceholders(
    result.str.reduce(
      (acc, str, i) => `${acc}${str}${fragments[i + 1]}`,
      fragments[0]
    )
  );

  return new Template(htmlString, result.handlers.flat());
};

function removeChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function modifyElement(query, type, data, context = document) {
  const node = context.querySelector(query);

  if (!node) {
    console.error(`Can't find node using selector ${query}`);
    return;
  }

  switch (type) {
    case 'prop':
      node[data.name] = data.value;
      break;
    case 'attr':
      if (isBooleanAttribute(data.name)) {
        if (data.value) {
          node.setAttribute(data.name, '');
        } else {
          node.removeAttribute(data.name);
        }
      } else {
        node.setAttribute(data.name, data.value);
      }

      break;
    case 'listener':
      node.addEventListener(data.name, data.value);
      break;
    case 'style':
      node.style[data.name] = data.value;
      break;
    case 'children': {
      removeChildren(node);

      const fragment = document.createDocumentFragment();

      if (isArray(data.value)) {
        fragment.append(...data.value.map(reduceNode));
      } else {
        fragment.append(reduceNode(data.value));
      }

      node.append(fragment);

      break;
    }
    case 'html':
      node.replaceWith(data.value);
      break;
    default:
      throw new Error('Invalid type.');
  }
}

// Taken from https://stackoverflow.com/questions/13363946/how-do-i-get-an-html-comment-with-javascript
function replacePlaceholderComments(root) {
  // Fourth argument, which is actually obsolete according to the DOM4 standard, is required in IE 11
  const iterator = document.createNodeIterator(
    root,
    NodeFilter.SHOW_COMMENT,
    () => NodeFilter.FILTER_ACCEPT,
    false
  );

  let current = iterator.nextNode();
  while (current) {
    const isPlaceholder = current.nodeValue.trim().startsWith('placeholder-');

    if (isPlaceholder) {
      current.replaceWith(
        document.createTextNode(
          current.nodeValue.trim().replace('placeholder-', '')
        )
      );
    }

    current = iterator.nextNode();
  }
}

/**
 * Creates an element from string with `createContextualFragment`
 * @param {String} str - the html string to be rendered
 * @param {Array} handlers - array of handlers
 * @returns {DocumentFragment}
 */
function createElementFromString(str, handlers = []) {
  const fragment = document.createRange().createContextualFragment(str);

  handlers.forEach((handler) => {
    const el = fragment.querySelector(handler.query);

    modifyElement(handler.query, handler.type, handler.data, fragment);

    if (handler.remove) {
      el.removeAttribute(handler.attr);
    }
  });

  // Replace all placeholder comments
  [...fragment.children].forEach(replacePlaceholderComments);

  return fragment;
}

/**
 * Creates element from a `Template` and appends it to `element` if provided
 * @param {Template} template - a `Template` returned by `html`
 * @param {String|HTMLElement} element - the element to append to
 * @returns {DocumentFragment}
 */
function render(template, element) {
  const el = createElementFromString(...Object.values(template));

  if (element) {
    if (typeof element === 'string') {
      document.querySelector(element).append(el);
    } else {
      element.append(el);
    }
  }

  return el;
}

// State
const StateStore = new WeakMap();

/**
 * Creates a state
 * @param {any} value - the initial value of state
 * @param {Boolean} [seal=true] - seal the object with Object.seal
 * @returns {[Object, function]}
 */
const createState = (value, seal = true) => {
  const obj = isObject(value) ? value : { value };
  StateStore.set(obj, new Map());

  const { proxy, revoke } = Proxy.revocable(seal ? Object.seal(obj) : obj, {
    get: getter(obj),
    set: setter(obj),
  });

  /**
   * Delete the state and returns the original value
   * @returns {any}
   */
  const deleteState = () => {
    revoke();
    StateStore.delete(obj);

    return value;
  };

  return [proxy, deleteState];
};

const setter = (ref) => (target, prop, value, receiver) => {
  const bindedElements = StateStore.get(ref);

  bindedElements.forEach((handlers, id) => {
    const query = `[data-proxyid="${id}"]`;
    const el = document.querySelector(query);

    if (el) {
      handlers.forEach((handler) => {
        if (prop !== handler.prop) return;

        const finalValue = reduceValue(value, handler.trap);

        modifyElement(query, handler.type, {
          name: handler.target,
          value: finalValue,
        });
      });
    } else {
      // delete handler when the target is unreachable (most likely deleted)
      bindedElements.delete(id);
    }
  });

  return Reflect.set(target, prop, value, receiver);
};

const getter = (ref) => (target, rawProp, receiver) => {
  const [prop, type] = determineType(rawProp);

  const $ =
    (value) =>
    (trap = null) => ({
      [REF]: ref,
      data: {
        prop,
        trap,
        value,
      },
    });

  if (type === 'state' && prop in target) {
    return Object.assign($(target[prop]), $(target[prop])());
  }

  return Reflect.get(target, prop, receiver);
};

function generateStateHandler(state = {}) {
  const id = uniqid();
  const proxyId = `data-proxyid="${id}"`;
  const batchedObj = {};

  Object.entries(state).forEach(([type, batch]) => {
    Object.entries(batch).forEach(([key, info]) => {
      const bindedElements = StateStore.get(info[REF]);
      const existingHandlers = bindedElements.get(id) || [];

      const finalValue = reduceValue(info.data.value, info.data.trap);

      if (!batchedObj[type]) {
        batchedObj[type] = {};
      }

      batchedObj[type][key] = finalValue;

      bindedElements.set(id, [
        ...existingHandlers,
        {
          type,
          target: key,
          prop: info.data.prop,
          trap: info.data.trap,
        },
      ]);
    });
  });

  const { str, handlers } = generateHandlerAll(batchedObj);

  return { handlers, str: [...str, proxyId] };
}

export { settings, html, createElementFromString, render, createState };
