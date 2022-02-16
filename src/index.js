import Template from './Template';
import { BOOLEAN_ATTRS, IGNORE_UPDATE, OBSERVER_CONFIG } from './constants';
import { createHook, addHooks, text, generateHookHandler } from './hooks';
import { mutationCallback, triggerLifecycle } from './lifecycle';
import { generateHandlerAll } from './utils/handler';
import { hydrate } from './utils/hydrate';
import {
  isArray,
  isFunction,
  isHook,
  isNode,
  isNullOrUndefined,
  isObject,
  isTemplate,
} from './utils/is';
import {
  addPlaceholders,
  replacePlaceholderComments,
  replacePlaceholderIds,
} from './utils/placeholder';
import {
  uid,
  compose,
  getChildren,
  rebuildString,
  reduceTemplates,
} from './utils/util';
import { batchTypes } from './utils/type';

let preprocessors = [];

// enable lifecycle
const observer = new MutationObserver(mutationCallback);
observer.observe(document.body, OBSERVER_CONFIG);

const parse = (value) => {
  if (isNullOrUndefined(value)) return { str: '', handlers: [], dict: {} };

  if (isTemplate(value)) return value;

  if (isFunction(value) || isHook(value)) {
    const id = uid();

    return { str: `$$id:${id}`, handlers: [], dict: { [id]: value } };
  }

  if (isNode(value)) {
    const id = uid();

    return {
      str: `<my-marker id="node-${id}"></my-marker>`,
      handlers: [{ type: 'node', selector: `#node-${id}`, data: { value } }],
      dict: {},
    };
  }

  if (isArray(value)) {
    const final = reduceTemplates(value.map(parse));

    return {
      str: final.str.join(' '),
      handlers: final.handlers,
      dict: final.dict,
    };
  }

  if (isObject(value)) {
    const { hook, ...otherTypes } = batchTypes(value);
    const blank = { str: [], handlers: [] };

    const a = generateHandlerAll(otherTypes);
    const b = hook ? generateHookHandler(hook) : blank;

    return {
      str: [...a.str, ...b.str].join(' '),
      handlers: [a.handlers, b.handlers].flat(2),
      dict: {},
    };
  }

  return { str: `${value}`, handlers: [], dict: {} };
};

/**
 * Creates a {@link Template} from a template literal. Must be used as a tag.
 * @example
 * html`<div>This is a div</div>`
 *
 * @param {Array.<string>} fragments
 * @param  {...any} values
 * @returns {Template}
 */
const html = (fragments, ...values) => {
  const result = reduceTemplates(values.map(parse));
  const htmlString = addPlaceholders(rebuildString(fragments, result.str));

  return new Template(htmlString, result.handlers, result.dict);
};

/**
 * Process an html string
 * @param {string} str
 * @returns {[string, Array.<Handler>]}
 */
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

/**
 * Creates an element from string with `createContextualFragment`
 * @param {String} str - the html string to be rendered
 * @param {Array.<Handler>} handlers - array of handlers
 * @returns {DocumentFragment}
 */
const createElementFromString = (str, handlers = [], dict = {}) => {
  const [final, extraHandlers] = preprocess(str);
  const allHandlers = [...handlers, ...extraHandlers];
  const fragment = document.createRange().createContextualFragment(final);

  hydrate(fragment, allHandlers);
  getChildren(fragment).forEach((node) => {
    replacePlaceholderComments(node);
    replacePlaceholderIds(node, dict);
    triggerLifecycle('create', node);
  });

  return fragment;
};

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

// Settings

/**
 * Add an attribute to be ignored by diffing. This will be applied to all elements.
 * Use attribute `ignore` for localized ignored attributes.
 * @param  {...string} attr - the attribute to be ignored
 * @returns
 */
const addIgnoredAttribute = (...prop) => IGNORE_UPDATE.push(...prop);

/**
 * Add a boolean attribute to the list.
 * Making an attribute a boolean means you can just pass a boolean
 * value to it instead of a string
 * @param  {...string} attr - the boolean attribute to be added
 * @returns
 */
const addBooleanAttribute = (...attr) => BOOLEAN_ATTRS.push(...attr);

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
  addIgnoredAttribute,
  addBooleanAttribute,
  addPreprocessor,
  removePreprocessor,
  disableObserver,
};

export { html, render, createHook, addHooks, text };
export default settings;
