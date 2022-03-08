import Template from './Template';
import { addHooks } from './hooks';
import { triggerLifecycle } from './lifecycle';
import { postprocess, preprocess } from './preprocess';
import { generateHandler } from './utils/handler';
import {
  isArray,
  isFunction,
  isHook,
  isNode,
  isNullOrUndefined,
  isObject,
  isString,
  isTemplate,
} from './utils/is';
import {
  addPlaceholders,
  replacePlaceholderComments,
  replacePlaceholderIds,
} from './utils/placeholder';
import { uid, getChildren, rebuildString, reduceTemplates } from './utils/util';
import { batchTypes } from './utils/type';
import { modifyElement } from './utils/modify';

// the main parser
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
    const blank = { str: '', handlers: [] };

    const a = reduceTemplates(
      Object.entries(otherTypes).map((args) => generateHandler(...args))
    );

    const b = hook
      ? // add hooks at creation
        generateHandler('lifecycle', {
          create: (e) => addHooks(e.target, hook),
        })
      : blank;

    return {
      str: [...a.str, b.str].join(' '),
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

const createElementFromString = (str, handlers = [], dict = {}) => {
  const fragment = document
    .createRange()
    .createContextualFragment(preprocess(str));

  // hydrate the created element based on data from handlers
  handlers.forEach((handler) => {
    const node = modifyElement(
      handler.selector,
      handler.type,
      handler.data,
      fragment
    );

    if (handler.remove) node.removeAttribute(handler.attr);
  });

  getChildren(fragment).forEach((node) => {
    // remove placeholders and add actual text
    replacePlaceholderComments(node);
    // process all placeholder ids and hydrate with respective values
    replacePlaceholderIds(node, dict);
    // trigger `create`
    triggerLifecycle('create', node);
    // run afterCreation callbacks
    postprocess(node);
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
    const parent = isString(element)
      ? document.querySelector(element)
      : element;

    parent.append(fragment);

    /** @type {HTMLElement} */
    return parent;
  }

  /** @type {DocumentFragment} */
  return fragment;
};

export { html, render };
