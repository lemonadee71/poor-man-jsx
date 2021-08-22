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
const lifecycleMethods = ['create', 'destroy', 'mount', 'unmount'];

/**
 * Is functions used for type checking
 */
const isObject = (value) => typeof value === 'object';

const isArray = (value) => Array.isArray(value);

const isTemplate = (value) => value instanceof Template;

const isNode = (value) => value instanceof Node;

const isState = (key) => key.startsWith('$');

const isLifecycleMethod = (key) => key.startsWith('@');

const isEventListener = (key) => key.toLowerCase().startsWith('on');

const isDefaultProp = (key) => defaultProps.includes(key);

const isStyleAttribute = (key) =>
  key in mockEl.style || key.startsWith('style_');

const isBooleanAttribute = (attr) => booleanAttributes.includes(attr);

/**
 * Utility functions
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

const generateAttribute = (type) => {
  const id = uniqid();
  const seed = uniqid(4);
  const attrName = `data-${type}-${seed}`;
  const dataAttr = `${attrName}="${id}"`;

  return [dataAttr, attrName];
};

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
  } else if (isLifecycleMethod(key)) {
    if (!lifecycleMethods.includes(key.replace('@', ''))) {
      throw new Error(`${key} is not a lifecycle method`);
    }

    type = 'lifecycle';
  }

  if (type === 'listener') {
    k = key.toLowerCase();
  }

  return [k.replace(/^(\$|@|on|style_)/gi, ''), type];
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

const generateHandler = (type, obj) => {
  const [dataAttr, attrName] = generateAttribute(type);
  const handlers = [];

  Object.entries(obj).forEach(([name, value]) => {
    handlers.push({
      type,
      selector: `[${dataAttr}]`,
      attr: attrName,
      data: { name, value },
      remove: false,
    });
  });

  handlers[handlers.length - 1].remove = true;

  return { str: dataAttr, handlers };
};

const generateHandlerAll = (obj) =>
  pipe(
    Object.entries(obj),
    (items) => items.map((args) => generateHandler(...args)),
    reduceHandlerArray
  );

/**
 * Lifecycle
 */
const generateLifecycleHandler = (obj) => {
  const str = [];
  const handlers = [];

  Object.entries(obj).forEach(([type, fn]) => {
    const [dataAttr, attrName] = generateAttribute(type);

    str.push(dataAttr);
    handlers.push({
      type,
      fn,
      selector: `[${dataAttr}]`,
      attr: attrName,
      remove: true,
    });
  });

  return { str, handlers };
};

const LIFECYCLE_SYMBOLS = {
  destroy: Symbol('@destroy'),
  mount: Symbol('@mount'),
  unmount: Symbol('@unmount'),
};
const config = { childList: true, subtree: true };

const traverseNode = (node, callback) => {
  callback.call(null, node);

  if (node.children && node.children.length) {
    [...node.children].forEach((child) => traverseNode(child, callback));
  }
};

const mutationCallback = (mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        traverseNode(node, (n) => {
          const cb = n[LIFECYCLE_SYMBOLS.mount];

          if (cb) cb.call(n);
        });
      });

      mutation.removedNodes.forEach((node) => {
        if (!document.body.contains(node)) {
          traverseNode(node, (n) => {
            const cb = n[LIFECYCLE_SYMBOLS.destroy];

            if (cb) cb.call(n);
          });
        }

        traverseNode(node, (n) => {
          const cb = n[LIFECYCLE_SYMBOLS.unmount];

          if (cb) cb.call(n);
        });
      });
    }
  });
};

const observer = new MutationObserver(mutationCallback);
observer.observe(document.body, config);

/**
 * The parser
 * @param {*} value
 * @param {Array} handlers
 * @returns
 */
const parse = (value, handlers = []) => {
  if (isNode(value)) {
    const id = uniqid();

    return {
      str: `<marker id="node-${id}" />`,
      handlers: [
        ...handlers.flat(),
        { type: 'node', selector: `#node-${id}`, data: { value } },
      ],
    };
  }

  if (isTemplate(value)) {
    // Just add its string and handlers
    return {
      str: value.str,
      handlers: [...handlers, ...value.handlers],
    };
  }

  if (isArray(value)) {
    // Will be parsed as an array of object { str, handlers }
    // And will be reduced to a single { str, handlers }
    const final = reduceHandlerArray(
      value.map((item) => parse(item, handlers))
    );

    return {
      str: final.str.join(' '),
      handlers: [handlers, final.handlers].flat(2),
    };
  }

  if (isObject(value)) {
    const { state, lifecycle, ...otherTypes } = batchSameTypes(value);
    const blank = { str: [], handlers: [] };

    // Will be parsed to { str: [], handlers: [] }
    const a = generateHandlerAll(otherTypes);
    const b = state ? generateStateHandler(state) : blank;
    const c = lifecycle ? generateLifecycleHandler(lifecycle) : blank;

    return {
      str: [...a.str, ...b.str, ...c.str].join(' '),
      handlers: [handlers, a.handlers, b.handlers, c.handlers].flat(2),
    };
  }

  return {
    handlers,
    str: `${value}`,
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

  const htmlString = pipe(
    result.str.reduce(
      (acc, str, i) => `${acc}${str}${fragments[i + 1]}`,
      fragments[0]
    ),
    addPlaceholders
  );

  return new Template(htmlString, result.handlers.flat());
};

/**
 * Hydrate helpers
 */
const removeChildren = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.lastChild);
  }
};

const modifyElement = (selector, type, data, context = document) => {
  const node = context.querySelector(selector);

  if (!node) {
    console.error(`Can't find node using selector ${selector}`);
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
    case 'node':
      node.replaceWith(data.value);
      break;
    default:
      throw new Error('Invalid type.');
  }
};

const replacePlaceholderComments = (root) => {
  const iterator = document.createNodeIterator(
    root,
    NodeFilter.SHOW_COMMENT,
    () => NodeFilter.FILTER_ACCEPT
  );

  let current;
  // eslint-disable-next-line
  while ((current = iterator.nextNode())) {
    const text = current.nodeValue.trim();
    const isPlaceholder = text.startsWith('placeholder-');

    if (isPlaceholder) {
      current.replaceWith(
        document.createTextNode(text.replace('placeholder-', ''))
      );
    }
  }
};

const createHydrateFn =
  (handlers = []) =>
  (context) =>
    handlers.forEach((handler) => {
      const el = context.querySelector(handler.selector);

      switch (handler.type) {
        case 'create':
          handler.fn.call(el);
          break;
        case 'destroy':
        case 'mount':
        case 'unmount':
          el[LIFECYCLE_SYMBOLS[handler.type]] = handler.fn;
          break;
        default:
          modifyElement(handler.selector, handler.type, handler.data, context);
          break;
      }

      if (handler.remove) {
        el.removeAttribute(handler.attr);
      }
    });

/**
 * Creates an element from string with `createContextualFragment`
 * @param {String} str - the html string to be rendered
 * @param {Array} handlers - array of handlers
 * @returns {DocumentFragment}
 */
function createElementFromString(str, handlers = []) {
  const fragment = document.createRange().createContextualFragment(str);
  const [createHandlers, otherHandlers] = handlers.reduce(
    (acc, current) => {
      if (current.type === 'create') acc[0].push(current);
      else acc[1].push(current);

      return acc;
    },
    [[], []]
  );

  createHydrateFn(otherHandlers)(fragment);
  [...fragment.children].forEach(replacePlaceholderComments);

  createHydrateFn(createHandlers)(fragment);

  return fragment;
}

/**
 * Creates element from a `Template` and appends it to `element` if provided.
 * If element is not provided, it'll return the created document fragment.
 * Otherwise, it'll return the `element`
 * @param {Template} template - a `Template` returned by `html`
 * @param {String|HTMLElement} element - the element to append to
 * @returns
 */
const render = (template, element) => {
  const fragment = createElementFromString(...Object.values(template));

  if (element) {
    const parent =
      typeof element === 'string' ? document.querySelector(element) : element;

    parent.append(fragment);

    /** @type {HTMLElement} */
    return parent;
  }

  /** @type {DocumentFragment} */
  return fragment;
};

/**
 * State
 */
const StateStore = new WeakMap();

// This is to hide the ref property an invoked state returns
// which is a reference to the original object
// to make sure we won't be able to access it outside of its intended use
const REF = Symbol('ref');

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

const setter = (ref) => (target, prop, value, receiver) => {
  const bindedElements = StateStore.get(ref);

  bindedElements.forEach((handlers, id) => {
    const selector = `[data-proxyid="${id}"]`;
    const el = document.querySelector(selector);

    if (el) {
      handlers.forEach((handler) => {
        if (prop !== handler.prop) return;

        modifyElement(selector, handler.type, {
          name: handler.target,
          value: reduceValue(value, handler.trap),
        });
      });
    } else {
      // delete handler when the target is unreachable (most likely deleted)
      bindedElements.delete(id);
    }
  });

  return Reflect.set(target, prop, value, receiver);
};

const generateStateHandler = (state = {}) => {
  const id = uniqid();
  const proxyId = `data-proxyid="${id}"`;
  const batchedObj = {};

  Object.entries(state).forEach(([type, batch]) => {
    Object.entries(batch).forEach(([key, info]) => {
      const bindedElements = StateStore.get(info[REF]);
      const existingHandlers = bindedElements.get(id) || [];

      if (!batchedObj[type]) {
        batchedObj[type] = {};
      }

      batchedObj[type][key] = reduceValue(info.data.value, info.data.trap);

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
};

/**
 * Settings
 */

/**
 * Add a defaul property (anything that can be called directly from the element)
 * @param  {...string} prop - the default prop that will be added
 * @returns
 */
const addDefaultProp = (...prop) => defaultProps.push(...prop);

/**
 * Add a boolean attribute to the list.
 * @param  {...string} attr - the boolean attribute to be added
 * @returns
 */
const addBooleanAttr = (...attr) => booleanAttributes.push(...attr);

/**
 * Disconnect the MutationObserver. This will stop watching for added/removed nodes.
 * This means that `@mount` and `@unmount` will no longer work.
 * @returns
 */
const disableObserver = () => observer.disconnect();

const settings = {
  addDefaultProp,
  addBooleanAttr,
  disableObserver,
};

export { settings, html, createElementFromString, render, createState };
export default settings;
