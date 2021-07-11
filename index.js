// Classes
class Template {
  constructor(str, handlers) {
    this.str = str;
    this.handlers = handlers;
  }
}

const el = document.createElement('div');
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

// is functions
const isObject = (val) => typeof val === 'object';

const isArray = (val) => Array.isArray(val);

const isTemplate = (val) => val instanceof Template;

const isState = (key) => key.startsWith('$');

const isEventListener = (key) => key.toLowerCase().startsWith('on');

const isDefaultProp = (key) => defaultProps.includes(key);

const isStyleAttribute = (key) => key in el.style;

const isBooleanAttribute = (attr) => booleanAttributes.includes(attr);

// utils
const uuid = (length = 8) => Math.random().toString(36).substr(2, length);

const _reduceValue = (value, trap = null) =>
  trap ? trap.call(null, value) : value;

const _reduceArray = (arr) =>
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
  const newObj = Object.entries(obj).reduce((batchedObj, [dirtyKey, value]) => {
    const [key, type] = determineType(dirtyKey);

    if (!batchedObj[type]) {
      batchedObj[type] = {};
    }

    batchedObj[type][key] = value;

    return batchedObj;
  }, {});

  if (newObj.state) {
    newObj.state = batchSameTypes(newObj.state);
  }

  return newObj;
};

function generateHandler(type, obj) {
  const id = uuid();
  const seed = uuid(4);
  const attrName = `data-${type}-${seed}`;
  const dataAttr = `${attrName}="${id}"`;
  const arr = [];

  Object.entries(obj).forEach(([name, value]) => {
    arr.push({
      type,
      query: `[${dataAttr}]`,
      attr: attrName,
      data: { name, value },
      remove: false,
    });
  });

  arr[arr.length - 1].remove = true;

  return { str: dataAttr, handlers: arr };
}

const generateHandlerAll = (obj) =>
  Object.entries(obj).reduce(
    (acc, [type, obj]) => {
      const result = generateHandler(type, obj);
      acc.str.push(result.str);
      acc.handlers.push(result.handlers);

      return acc;
    },
    { str: [], handlers: [] }
  );

const parse = (val, handlers = []) => {
  // isArray
  if (isArray(val)) {
    // Will be parsed as an array of object { str, handlers }
    const final = _reduceArray(val.map((item) => parse(item, handlers)));

    return {
      str: final.str.join(' '),
      handlers: [...handlers, ...final.handlers].flat(),
    };
  }

  // isTemplate
  if (isTemplate(val)) {
    return {
      str: val.str,
      handlers: [...handlers, ...val.handlers],
    };
  }

  // isObject --> batchSameTypes
  if (isObject(val)) {
    const { state, ...batchedObj } = batchSameTypes(val);

    // This will be an array of arrays
    // Where each item is [str, handlers]
    const a = generateHandlerAll(batchedObj);
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
  let newString = str;
  let match = newString.match(/{%\s*(.*)\s*%}/);

  while (match) {
    newString = newString.replace(
      match[0],
      `<!-- placeholder-${match[1].trim()} -->`
    );

    match = newString.slice(match.index).match(/{%\s*(.*)\s*%}/);
  }

  return newString;
};

const parseString = (fragments, ...values) => {
  const result = _reduceArray(values.map((value) => parse(value)));

  const htmlString = result.str.reduce(
    (acc, str, i) => `${acc}${str}${fragments[i + 1]}`,
    fragments[0]
  );

  const finalHTMLString = addPlaceholders(htmlString);

  return new Template(finalHTMLString, result.handlers.flat());
};

const modifyElement = ({ query, type, data, context = document }) => {
  const node = context.querySelector(query);

  if (!node) return;

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

      node.appendChild(
        data.value instanceof HTMLElement
          ? data.value
          : render(parseString`${data.value}`)
      );

      break;
    default:
      throw new Error('Invalid type.');
  }
};

// Taken from https://stackoverflow.com/questions/13363946/how-do-i-get-an-html-comment-with-javascript
const replacePlaceholderComments = (root) => {
  // Fourth argument, which is actually obsolete according to the DOM4 standard, is required in IE 11
  const iterator = document.createNodeIterator(
    root,
    NodeFilter.SHOW_COMMENT,
    () => NodeFilter.FILTER_ACCEPT,
    false
  );

  let current;
  while ((current = iterator.nextNode())) {
    const isPlaceholder = current.nodeValue.trim().startsWith('placeholder-');

    if (isPlaceholder) {
      current.replaceWith(
        document.createTextNode(
          current.nodeValue.trim().replace('placeholder-', '')
        )
      );
    }
  }
};

function createElementFromString(str, handlers = []) {
  const createdElement = document.createRange().createContextualFragment(str);

  handlers.forEach((handler) => {
    const el = createdElement.querySelector(handler.query);

    modifyElement({
      query: handler.query,
      type: handler.type,
      data: handler.data,
      context: createdElement,
    });

    if (handler.remove) {
      el.removeAttribute(handler.attr);
    }
  });

  // Replace all placeholder comments
  [...createdElement.children].forEach(replacePlaceholderComments);

  return createdElement;
}

function render(template) {
  return createElementFromString(...Object.values(template));
}

// State
const StateStore = new Map();

function generateStateHandler(state = {}) {
  const id = uuid();
  const proxyId = `data-proxy-id="${id}"`;
  const batchedObj = {};

  Object.entries(state).forEach(([type, batch]) => {
    Object.entries(batch).forEach(([key, { id: _id, data }]) => {
      const bindedElements = StateStore.get(_id);
      const existingHandlers = bindedElements.get(id) || [];

      const finalValue = _reduceValue(data.value, data.trap);

      if (!batchedObj[type]) {
        batchedObj[type] = {};
      }

      batchedObj[type][key] = finalValue;

      bindedElements.set(id, [
        ...existingHandlers,
        {
          type,
          target: key,
          prop: data.prop,
          trap: data.trap,
        },
      ]);
    });
  });

  const { str, handlers } = generateHandlerAll(batchedObj);

  return { handlers, str: [...str, proxyId] };
}

const _setter = (_id) => (target, prop, value, receiver) => {
  const bindedElements = StateStore.get(_id);

  bindedElements.forEach((handlers, id) => {
    const query = `[data-proxy-id="${id}"]`;
    const el = document.querySelector(query);

    if (el) {
      handlers.forEach((handler) => {
        if (prop !== handler.prop) return;

        const finalValue = _reduceValue(value, handler.trap);

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
  (id, prop, value) =>
  (trap = null) => ({
    id,
    data: {
      prop,
      trap,
      value,
    },
  });

const _getter = (_id) => (target, rawProp, receiver) => {
  const [prop, type] = determineType(rawProp);

  if (type === 'state' && prop in target) {
    return Object.assign(
      _bind(_id, prop, target[prop]),
      _bind(_id, prop, target[prop])()
    );
  }

  return Reflect.get(target, prop, receiver);
};

const createState = (obj) => {
  const _id = uuid();
  StateStore.set(_id, new Map());

  const { proxy, revoke } = Proxy.revocable(obj, {
    get: _getter(_id),
    set: _setter(_id),
  });

  return [proxy, revoke];
};

const createPrimitiveState = (value) => createState({ value });
const createObjectState = createState; // alias

export { parseString as html, render, createPrimitiveState, createObjectState };
