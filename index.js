// This is to hide the ref property an invoked state returns
// which is a reference to the original object
// to make sure we won't be able to access it outside of its intended use
const REF = Symbol('ref');

// classes
class Template {
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

// is functions
const isObject = (val) => typeof val === 'object';

const isArray = (val) => Array.isArray(val);

const isTemplate = (val) => val instanceof Template;

const isState = (key) => key.startsWith('$');

const isEventListener = (key) => key.toLowerCase().startsWith('on');

const isDefaultProp = (key) => defaultProps.includes(key);

const isStyleAttribute = (key) => key in mockEl.style;

const isBooleanAttribute = (attr) => booleanAttributes.includes(attr);

// utils
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

  return [k.replace(/^(\$|on)/gi, ''), type];
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
    obj,
    Object.entries,
    (items) => items.map((args) => generateHandler(...args)),
    reduceHandlerArray
  );

// parser
const parse = (val, handlers = []) => {
  if (isArray(val)) {
    // Will be parsed as an array of object { str, handlers }
    // And will be reduced to a single { str, handlers }
    const final = reduceHandlerArray(val.map((item) => parse(item, handlers)));

    return {
      str: final.str.join(' '),
      handlers: [...handlers, ...final.handlers].flat(),
    };
  }

  if (isTemplate(val)) {
    // Just add its string and handlers
    return {
      str: val.str,
      handlers: [...handlers, ...val.handlers],
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

const parseString = (fragments, ...values) => {
  const result = reduceHandlerArray(values.map((value) => parse(value)));

  const htmlString = addPlaceholders(
    result.str.reduce(
      (acc, str, i) => `${acc}${str}${fragments[i + 1]}`,
      fragments[0]
    )
  );

  return new Template(htmlString, result.handlers.flat());
};

function modifyElement({ query, type, data, context = document }) {
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
    case 'children':
      [...node.children].map((child) => child.remove());

      if (isArray(data.value)) {
        node.append(...data.value.map(reduceNode));
      } else {
        node.append(reduceNode(data.value));
      }

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

function createElementFromString(str, handlers = []) {
  const fragment = document.createRange().createContextualFragment(str);

  handlers.forEach((handler) => {
    const el = fragment.querySelector(handler.query);

    modifyElement({
      query: handler.query,
      type: handler.type,
      data: handler.data,
      context: fragment,
    });

    if (handler.remove) {
      el.removeAttribute(handler.attr);
    }
  });

  // Replace all placeholder comments
  [...fragment.children].forEach(replacePlaceholderComments);

  return fragment;
}

function render(template) {
  return createElementFromString(...Object.values(template));
}

// State
const StateStore = new WeakMap();

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

const setter = (ref) => (target, prop, value, receiver) => {
  const bindedElements = StateStore.get(ref);

  bindedElements.forEach((handlers, id) => {
    const query = `[data-proxyid="${id}"]`;
    const el = document.querySelector(query);

    if (el) {
      handlers.forEach((handler) => {
        if (prop !== handler.prop) return;

        const finalValue = reduceValue(value, handler.trap);

        modifyElement({
          query,
          type: handler.type,
          data: { name: handler.target, value: finalValue },
        });
      });
    } else {
      // delete handler when the target is unreachable (most likely deleted)
      bindedElements.delete(id);
    }
  });

  return Reflect.set(target, prop, value, receiver);
};

const _bind =
  (ref, prop, value) =>
  (trap = null) => ({
    [REF]: ref,
    data: {
      prop,
      trap,
      value,
    },
  });

const getter = (ref) => (target, rawProp, receiver) => {
  const [prop, type] = determineType(rawProp);

  if (type === 'state' && prop in target) {
    return Object.assign(
      _bind(ref, prop, target[prop]),
      _bind(ref, prop, target[prop])()
    );
  }

  return Reflect.get(target, prop, receiver);
};

const createState = (value, seal = true) => {
  const obj = isObject(value) ? value : { value };
  StateStore.set(obj, new Map());

  const { proxy, revoke } = Proxy.revocable(seal ? Object.seal(obj) : obj, {
    get: getter(obj),
    set: setter(obj),
  });

  // To make sure state gets deleted from memory
  const _deleteState = () => {
    revoke();
    StateStore.delete(obj);

    return obj;
  };

  return [proxy, _deleteState];
};

export {
  settings,
  parseString as html,
  createElementFromString,
  render,
  createState,
};
