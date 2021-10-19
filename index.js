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
const elementsToAlwaysRerender = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'span',
  'em',
  'i',
  'small',
  'strong',
  'sub',
  'sup',
  'ins',
  'del',
  'mark',
  'pre',
  'b',
  'code',
  'abbr',
  'kbd',
  'cite',
];
const ignoreUpdate = ['data-proxyid'];
const lifecycleMethods = ['create', 'destroy', 'mount', 'unmount'];
const customAttributes = [];
let preprocessors = [];

/**
 * Is functions used for type checking
 */
const isNullOrUndefined = (value) => value === null || value === undefined;

const isObject = (value) => typeof value === 'object';

const isArray = (value) => Array.isArray(value);

const isTemplate = (value) => value instanceof Template;

const isNode = (value) => value instanceof Node;

const isHook = (key) => key.startsWith('$');

const isEventListener = (key) => key.toLowerCase().startsWith('on');

const isLifecycleMethod = (key) => {
  const name = key.replace('on', '').toLowerCase();

  return isEventListener(key) && lifecycleMethods.includes(name);
};

const isDefaultProp = (key) => defaultProps.includes(key);

const isStyleAttribute = (key) =>
  !customAttributes.includes(key) &&
  (key in mockEl.style || key.startsWith('style_'));

const isBooleanAttribute = (attr) => booleanAttributes.includes(attr);

/**
 * Utility functions
 */
const randomId = (length = 8) => Math.random().toString(36).substr(2, length);

const compose = (...fns) => {
  if (fns.some((fn) => typeof fn !== 'function')) {
    throw new Error('Argument must be a function');
  }

  return fns.reduce(
    (f, g) =>
      (...args) =>
        g(f(...args))
  );
};

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

const getChildren = (parent) => [...parent.children];

const generateDataAttribute = (type) => {
  const id = randomId();
  const seed = randomId(4);
  const attrName = `data-${type}-${seed}`;
  const dataAttr = `${attrName}="${id}"`;

  return [dataAttr, attrName];
};

const determineType = (key) => {
  // Any unrecognizable key will be treated as attr
  let type = 'attr';
  let k = key;

  if (isHook(key)) {
    type = 'hook';
  } else if (isLifecycleMethod(key)) {
    type = 'lifecycle';
  } else if (isEventListener(key)) {
    type = 'listener';
  } else if (isDefaultProp(key)) {
    type = 'prop';
  } else if (isStyleAttribute(key)) {
    type = 'style';
  } else if (key === 'children') {
    type = 'children';
  }

  if (type === 'listener' || type === 'lifecycle') {
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

  if (batched.hook) {
    batched.hook = batchSameTypes(batched.hook);
  }

  return batched;
};

const generateHandler = (type, obj) => {
  const [dataAttr, attrName] = generateDataAttribute(type);
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
  compose(
    (items) => items.map((args) => generateHandler(...args)),
    reduceHandlerArray
  )(Object.entries(obj));

const traverseNode = (node, callback) => {
  callback.call(null, node);

  if (node.children && node.children.length) {
    getChildren(node).forEach((child) => traverseNode(child, callback));
  }
};

const createLifecycleCallback = (type) => (node) => {
  node.dispatchEvent(new Event(`@${type}`));
};

const mutationCallback = (mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        traverseNode(node, createLifecycleCallback('mount'));
      });

      mutation.removedNodes.forEach((node) => {
        if (!document.body.contains(node)) {
          traverseNode(node, createLifecycleCallback('destroy'));
        }

        traverseNode(node, createLifecycleCallback('unmount'));
      });
    }
  });
};

const observer = new MutationObserver(mutationCallback);
const config = { childList: true, subtree: true };
observer.observe(document.body, config);

/**
 * Parser
 */
const parse = (value, handlers = []) => {
  if (isNullOrUndefined(value)) return { handlers, str: '' };

  if (isNode(value)) {
    const id = randomId();

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
    const { hook, ...otherTypes } = batchSameTypes(value);
    const blank = { str: [], handlers: [] };

    // Will be parsed to { str: [], handlers: [] }
    const a = generateHandlerAll(otherTypes);
    const b = hook ? generateHookHandler(hook) : blank;

    return {
      str: [...a.str, ...b.str].join(' '),
      handlers: [handlers, a.handlers, b.handlers].flat(2),
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
 * @param  {...any} values
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

/**
 * Hydrate helpers
 */
const removeChildren = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.lastChild);
  }
};

// Diffing utils
const getBehavior = (node, type) =>
  node.getAttribute(`is-${type}`) !== null ||
  node.getAttribute('behavior') === type;

const isText = (node) => getBehavior(node, 'text');

const shouldDiffNode = (node) => getBehavior(node, 'list');

const getKeyString = (node) => node.getAttribute('keystring') || 'key';

const getKey = (node, keyString) =>
  node.getAttribute(keyString) ||
  node.getAttribute('key') ||
  node.getAttribute('data-key');

const hasNoKey = (nodes, keyString) =>
  nodes.some((node) => !getKey(node, keyString));

const patchNodes = (oldNode, newNode) => {
  // we assume that the number of children is still the same
  // and that changes are limited to "content"
  // and are enclosed in an inline text element (see elementsToAlwaysRerender)
  if (
    isText(oldNode) ||
    elementsToAlwaysRerender.includes(oldNode.nodeName.toLowerCase())
  ) {
    oldNode.innerHTML = newNode.innerHTML;
  } else if (shouldDiffNode(oldNode)) {
    naiveDiff(oldNode, getChildren(newNode), getKeyString(oldNode));
  } else if (oldNode.children.length) {
    getChildren(oldNode).forEach((child, i) =>
      patchNodes(child, newNode.children[i])
    );
  }

  // update all attributes
  const oldAttributes = [...oldNode.attributes];
  const newAttributes = [...newNode.attributes];
  const toRemove = oldAttributes.filter(
    (attr) => !newAttributes.map((a) => a.name).includes(attr.name)
  );

  toRemove.forEach((attr) => {
    oldNode.removeAttribute(attr.name);
  });

  newAttributes.forEach((attr) => {
    if (ignoreUpdate.includes(attr.name)) return;

    oldNode.setAttribute(attr.name, attr.value);
  });
};

// * currently not checking for unkeyed nodes
const naiveDiff = (parent, newNodes, keyString) => {
  const _findNode = (key) => (node) => getKey(node, keyString) === key;

  const oldNodes = getChildren(parent);
  const oldKeys = oldNodes.map((node) => getKey(node, keyString));
  const newKeys = newNodes.map((node) => getKey(node, keyString));
  const toAdd = newKeys.filter((key) => !oldKeys.includes(key));

  // remove nodes
  oldKeys
    .filter((key) => !newKeys.includes(key))
    .forEach((key) => oldNodes.find(_findNode(key)).remove());

  // at this point, currentKeys should have the same items as newKeys
  // but with differing order (if there was change)
  const currentKeys = oldKeys.filter((key) => newKeys.includes(key));
  currentKeys.push(...toAdd);

  let prevElement;
  newKeys.forEach((key, newIndex) => {
    const oldIndex = currentKeys.indexOf(key);
    const currentElement = toAdd.includes(key)
      ? newNodes[newIndex]
      : getChildren(parent).find(_findNode(key));

    // check if node is moved to a new place
    // or if it's a new one
    if (oldIndex !== newIndex || !parent.contains(currentElement)) {
      if (!prevElement) {
        parent.prepend(currentElement);
      } else if (currentElement.previousElementSibling !== prevElement) {
        prevElement.after(currentElement);
      }
    }

    prevElement = currentElement;
  });

  // update nodes
  getChildren(parent).forEach((child, i) => patchNodes(child, newNodes[i]));
};

const modifyElement = (selector, type, data, context = document) => {
  const node = context.querySelector(selector);

  if (!node) {
    throw new Error(`Can't find node using selector ${selector}.`);
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
    case 'lifecycle':
      node.addEventListener(`@${data.name}`, data.value, {
        once: data.name === 'create',
      });
      break;
    case 'listener':
      node.addEventListener(data.name, data.value);
      break;
    case 'style':
      node.style[data.name] = data.value;
      break;
    case 'children': {
      if (shouldDiffNode(node)) {
        if (!isArray(data.value)) {
          throw new Error(
            'children should be an Array if parent is of type list'
          );
        }

        // if there's no children, it means we're adding them for the first time
        // so just ignore diffing for now
        if (!node.children.length) {
          node.append(...data.value.map(reduceNode));
          return;
        }

        const newNodes = data.value.map((n) => {
          const el = reduceNode(n);

          if (el instanceof DocumentFragment) {
            if (el.children.length > 1) {
              throw new Error('List item should have a parent');
            }
            return el.firstElementChild;
          }

          return el;
        });
        const keyString = getKeyString(node);

        // * no support for unkeyed elements for now
        // * and will also throw if "keystring" is not found in any of the new nodes
        if (hasNoKey(newNodes, keyString)) {
          throw new Error(
            'every children should have a key if parent is of type list'
          );
        }

        naiveDiff(node, newNodes, keyString);
      } else {
        removeChildren(node);

        const fragment = document.createDocumentFragment();

        if (isArray(data.value)) {
          fragment.append(...data.value.map(reduceNode));
        } else {
          fragment.append(reduceNode(data.value));
        }

        node.append(fragment);
      }

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

const preprocess = (str) => {
  const handlers = [];
  let htmlString = str;

  preprocessors.forEach((processor) => {
    let result;
    if (isArray(processor)) {
      result = compose(...processor)(htmlString);
    } else {
      result = processor(htmlString);
    }

    if (isArray(result)) {
      htmlString = result[0];
      handlers.push(...(result[1] || []));
    } else if (typeof result === 'string') {
      htmlString = result;
    } else {
      throw new Error('Preprocessor must return a string or an array');
    }
  });

  return [htmlString, handlers];
};

const hydrate = (context, handlers = []) =>
  handlers.forEach((handler) => {
    const el = context.querySelector(handler.selector);

    if (!el) {
      throw new Error(`Can't find node using selector ${handler.selector}.`);
    }

    modifyElement(handler.selector, handler.type, handler.data, context);

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
  const [final, extraHandlers] = preprocess(str);
  const allHandlers = [...handlers, ...extraHandlers];
  const fragment = document.createRange().createContextualFragment(final);

  hydrate(fragment, allHandlers);
  getChildren(fragment).forEach(replacePlaceholderComments);
  getChildren(fragment).forEach((node) =>
    traverseNode(node, createLifecycleCallback('create'))
  );

  return fragment;
}

/**
 * Creates element from a `Template` and appends it to `element` if provided.
 * If element is not provided, it'll return the created document fragment.
 * Otherwise, it'll return the `element`
 * @param {Template} template - a `Template` returned by `html`
 * @param {String|HTMLElement} element - the element to append to.
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
 * Hook
 */
const Hooks = new WeakMap();

// This is to hide the ref property an invoked hook returns
// which is a reference to the original object
// to make sure we won't be able to access it outside of its intended use
const REF = Symbol('ref');

/**
 * Creates a hook
 * @param {any} value - the initial value of the hook
 * @param {Boolean} [seal=true] - seal the object with Object.seal
 * @returns {[Object, function]}
 */
const createHook = (value, seal = true) => {
  const obj = isObject(value) ? value : { value };
  Hooks.set(obj, new Map());

  const { proxy, revoke } = Proxy.revocable(seal ? Object.seal(obj) : obj, {
    get: getter(obj),
    set: setter(obj),
  });

  /**
   * Delete the hook object and returns the original value
   * @returns {any}
   */
  const deleteHook = () => {
    revoke();
    Hooks.delete(obj);

    return value;
  };

  return [proxy, deleteHook];
};

const createHookFunction =
  (ref, prop, value) =>
  (trap = null) => ({
    [REF]: ref,
    data: {
      prop,
      trap,
      value,
    },
  });

const methodForwarder = (target, prop) => {
  const dummyFn = (value) => value;
  const previousTrap = target.data.trap || dummyFn;
  const previousValue = target.data.value;

  const callback = (...args) => {
    const copy = {
      [REF]: target[REF],
      data: {
        ...target.data,
        value: previousValue,
        // stack callbacks on top of one another to chain them
        trap: compose(previousTrap, (value) => value[prop](...args)),
      },
    };

    return new Proxy(copy, { get: methodForwarder });
  };

  // run previousTrap against previousValue to determine
  // what the latest value should be
  // This can cause weird behaviors if methods mutates the value
  // like `reverse` in array
  // in general, mutations should be discouraged inside traps
  if (typeof previousTrap(previousValue)[prop] === 'function') return callback;
  return Reflect.get(target, prop);
};

const getter = (ref) => (target, rawProp, receiver) => {
  const [prop, type] = determineType(rawProp);
  const hook = createHookFunction(ref, prop, target[prop]);

  if (type === 'hook' && prop in target) {
    return Object.assign(new Proxy(hook, { get: methodForwarder }), hook());
  }

  return Reflect.get(target, prop, receiver);
};

const setter = (ref) => (target, prop, value, receiver) => {
  const bindedElements = Hooks.get(ref);

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

const generateHookHandler = (hook = {}) => {
  const id = randomId();
  const proxyId = `data-proxyid="${id}"`;
  const batchedObj = {};

  Object.entries(hook).forEach(([type, batch]) => {
    Object.entries(batch).forEach(([key, info]) => {
      const bindedElements = Hooks.get(info[REF]);
      const handlers = bindedElements.get(id) || [];

      if (!batchedObj[type]) {
        batchedObj[type] = {};
      }

      batchedObj[type][key] = reduceValue(info.data.value, info.data.trap);

      bindedElements.set(id, [
        ...handlers,
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
 * Add a default property (anything that can be called directly from the element)
 * @param  {...string} prop - the default prop that will be added
 * @returns
 */
const addDefaultProperty = (...prop) => defaultProps.push(...prop);

/**
 * Add a boolean attribute to the list.
 * Making an attribute a boolean means you can just pass a boolean
 * value to it instead of a string
 * @param  {...string} attr - the boolean attribute to be added
 * @returns
 */
const addBooleanAttribute = (...attr) => booleanAttributes.push(...attr);

/**
 * Add a custom attribute to the list. This is to avoid conflict with custom elements
 * if their custom attributes coincide with some style attributes
 * since by default, any string that's a valid style attribute is considered as "style" first
 * @param  {...string} attr - the custom attribute to be added
 * @returns
 */
const addCustomAttribute = (...attr) => customAttributes.push(...attr);

/**
 * Adds a preprocessor. Preprocessors are used to process the html string
 * before rendering it.
 * @param  {...Function|Array.<Function>} processors
 * @returns
 */
const addPreprocessor = (...processors) => preprocessors.push(...processors);

/**
 * Removes a preprocessor
 * @param {Function} processor - the function to remove
 */
const removePreprocessor = (processor) => {
  preprocessors = preprocessors.filter((fn) => fn !== processor);
};

/**
 * Disconnect the MutationObserver. This will stop watching for added/removed nodes.
 * This means that `@mount`, `@unmount`, and `@destroy` will no longer work.
 * @returns
 */
const disableObserver = () => observer.disconnect();

const settings = {
  addDefaultProperty,
  addBooleanAttribute,
  addCustomAttribute,
  addPreprocessor,
  removePreprocessor,
  disableObserver,
};

export { html, createElementFromString, render, createHook };
export default settings;
