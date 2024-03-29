import { PLACEHOLDER_REGEX, WRAPPING_QUOTES } from './constants';
import { registerIfHook } from './hooks';
import { triggerLifecycle } from './lifecycle';
import { modifyElement } from './modify';
import { lifecycle } from './plugin';
import {
  getChildNodes,
  getChildren,
  getPlaceholders,
  traverse,
  createMarkers,
} from './utils/dom';
import {
  compose,
  escapeHTML,
  getPlaceholderId,
  resolve,
} from './utils/general';
import { uid } from './utils/id';
import {
  isArray,
  isFragment,
  isFunction,
  isHook,
  isNullOrUndefined,
  isNumber,
  isObject,
  isPlaceholder,
  isString,
  isTemplate,
} from './utils/is';
import isPlainObject from './utils/is-plain-obj';
import { addKeyRecursive, setMetadata } from './utils/meta';
import Template from './utils/Template';
import { getTypeOfAttrName, getTypeOfKey } from './utils/type';

/**
 * Creates a {@link Template} from a template literal. Must be used as a tag.
 * Allows you to write in a jsx-like way.
 *
 * @example
 * html`<button onClick=${callback}>Click me!</button>`
 *
 * @param {string[]} fragments
 * @param  {...any} values
 * @returns {Template}
 */
const html = (fragments, ...values) => {
  const mappedValues = {};
  const replacedValues = values.map((value) => {
    if (isNullOrUndefined(value)) return '';

    if (isObject(value) || isFunction(value)) {
      const id = uid();
      mappedValues[id] = value;
      return `__${id}__`;
    }

    return escapeHTML(`${value}`);
  });
  const templateString = replacedValues
    .reduce((full, str, i) => `${full}${str}${fragments[i + 1]}`, fragments[0])
    .trim();

  return new Template(templateString, mappedValues);
};

/**
 * Creates element from a `Template` and appends it to `target` if provided.
 * If target is not provided, it'll return the created document fragment.
 * Otherwise, it'll return the `target`
 * @param {Template} template - a `Template` returned by `html`
 * @param {string|HTMLElement} target - the element to append to.
 * @returns
 */
const render = (template, target) => {
  const fragment = createElementFromTemplate(template);

  if (target) {
    const parent = isString(target) ? document.querySelector(target) : target;
    parent.append(fragment);

    /** @type {HTMLElement} */
    return parent;
  }

  /** @type {DocumentFragment} */
  return fragment;
};

/**
 * Create element from a `Template` returned by `html`
 * @param {Template} template
 * @returns {DocumentFragment}
 */
const createElementFromTemplate = (template) => {
  const str = lifecycle.runBeforeCreate(template.template);
  const fragment = document.createRange().createContextualFragment(str);

  lifecycle.runAfterCreate(fragment, template.values);
  processDirectives(fragment, template.values);

  for (const child of getChildren(fragment)) {
    // child.normalize();
    triggerLifecycle('create', child);
  }

  return fragment;
};

/**
 * Processes all directives of all elements under the given root
 * @param {HTMLElement|DocumentFragment} root - the root element
 * @param {any} context - key-value pairs that corresponds to a placeholder
 */
const processDirectives = (root, context) => {
  const fns = [
    resolveBody,
    lifecycle.runBeforeHydrate,
    resolveAttributes,
    lifecycle.runAfterHydrate,
  ];

  for (const fn of fns) fn.call(null, root, context);
};

const resolveBody = (root, values) => {
  for (const node of getPlaceholders(root)) {
    const text = node.textContent.trim();
    const value = values[getPlaceholderId(text)];
    const options = { element: node.parentElement, type: 'children' };

    if (isHook(value)) {
      const [head, tail, marker] = createMarkers();
      options.target = marker;
      node.before(head);
      node.after(tail);
    }

    node.replaceWith(...resolveValue(value, options));
  }
};

const resolveAttributes = (root, values) => {
  for (const child of getChildren(root)) {
    traverse(child, (element) => {
      if (element.__meta?.hydrated) return;

      for (const attr of [...element.attributes]) {
        const rawName = attr.name;
        const rawValue = attr.value.trim();

        // 1: If passed as an attribute
        if (isPlaceholder(rawName)) {
          const id = getPlaceholderId(rawName);
          const value = values[id];

          if (isArray(value)) {
            for (const item of value) {
              if (isPlainObject(item)) {
                applyProps(element, item);
              } else if (isString(item)) {
                const [n, v] = item.split('=');
                element.setAttribute(n, (v || '').replace(WRAPPING_QUOTES, ''));
              } else {
                throw new TypeError(
                  'Arrays passed inside the opening tag can only contain strings and plain objects'
                );
              }
            }
          } else if (isPlainObject(value)) {
            applyProps(element, value);
          } else {
            throw new Error('You can only pass plain objects or arrays');
          }

          element.removeAttribute(rawName);
        }
        // 2: If passed as a value
        else {
          const [type, attrName] = getTypeOfAttrName(rawName);
          const match = rawValue.match(PLACEHOLDER_REGEX);
          const value = match ? values[getPlaceholderId(match[0])] : rawValue;

          if (type !== 'attr') {
            element.removeAttribute(rawName);

            modifyElement(element, type, {
              key: attrName,
              value: resolveValue(value, {
                element,
                type,
                target: attrName,
              }),
            });
          }
        }
      }

      setMetadata(element, 'hydrated', true);
    });
  }
};

const addTrap = (hook, callback) => {
  const previousTrap = hook.data.trap;
  hook.data.trap = compose((value) => resolve(value, previousTrap), callback);

  return hook;
};

// NOTE: Creates a circular reference
const normalizeChildren = (items) => {
  const normalized = [items]
    .flat()
    .filter(
      (item) => item !== true && item !== false && !isNullOrUndefined(item)
    )
    .map((item) => {
      if (isString(item) || isNumber(item))
        return document.createTextNode(item);
      if (isTemplate(item)) return createElementFromTemplate(item);
      return item;
    })
    .flatMap((item) => (isFragment(item) ? getChildNodes(item) : item));

  addKeyRecursive(normalized);

  return normalized;
};

const resolveValue = (value, options) => {
  let final = value;

  if (options.type === 'children') {
    final = isHook(final)
      ? addTrap(
          final,
          compose(normalizeChildren, (items) =>
            items.map((item) => setMetadata(item, 'ignore', true))
          )
        )
      : normalizeChildren(final);
  }

  return registerIfHook(final, options);
};

/**
 * Apply props/attrs from object to element
 * @param {HTMLElement} element - the element to modify
 * @param {Object} changes - changes to be made
 * @returns {HTMLElement}
 */
const applyProps = (element, changes) => {
  for (const [rawKey, value] of Object.entries(changes)) {
    const [type, key] = getTypeOfKey(rawKey);

    modifyElement(element, type, {
      key,
      value: resolveValue(value, { element, type, target: key }),
    });
  }

  return element;
};

export {
  createElementFromTemplate,
  html,
  render,
  applyProps,
  processDirectives,
};
