import { addPreprocessor } from './preprocess';
import { getChildNodes } from './utils/dom';
import { camelize, getPlaceholderId, unescapeHTML } from './utils/general';
import {
  isArray,
  isFunction,
  isNode,
  isNumber,
  isPlaceholder,
  isString,
  isTemplate,
} from './utils/is';
import isPlainObject from './utils/is-plain-obj';

const CustomElements = new Map();
const VALID_COMPONENT_NAME = /^[\w-]+$/;

/**
 * Define one or more custom components.
 * @param  {...any} data
 */
export const define = (...data) => {
  if (data.length === 2 && isString(data[0]) && isFunction(data[1])) {
    register(data[0], data[1]);
  } else if (data.every(isPlainObject)) {
    for (const value of data) {
      Object.entries(value).forEach((x) => register(...x));
    }
  } else if (data.every(isArray)) {
    for (const value of data) register(...value);
  }
};

/**
 * Register a custom component
 * @param {string} name - the name of the component; must be a valid html tag
 * @param {Function} component - the component function
 */
const register = (name, component) => {
  if (VALID_COMPONENT_NAME.test(name)) {
    CustomElements.set(name, component);
  } else {
    throw new Error('`name` must be a valid html tag');
  }
};

/**
 * Remove a custom component
 * @param {...string} names - the names of the component to be removed
 * @returns
 */
export const remove = (...names) => {
  for (const name of names) CustomElements.delete(name);
};

export const replaceCustomComponents = (parent, values, create) => {
  const custom = [...parent.querySelectorAll('custom-component')];

  for (const element of custom) {
    const component = CustomElements.get(element.getAttribute(':is'));
    element.removeAttribute(':is');

    const children = processChildren(element);
    const props = attrsToProps([...element.attributes], values);
    const actual = component({ children, props });

    if (!isTemplate(actual) && !isNode(actual)) {
      throw new Error('Custom component must be a Template or a Node');
    }

    element.replaceWith(isTemplate(actual) ? create(actual) : actual);
  }
};

const stringToRaw = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (isNumber(+value)) return +value;
  return unescapeHTML(value);
};

const attrsToProps = (attrs, values) => {
  const props = {};

  for (const attr of attrs) {
    const name = camelize(attr.name);
    if (isPlaceholder(attr.value)) {
      props[name] = values[getPlaceholderId(attr.value)];
    } else {
      props[name] = stringToRaw(attr.value);
    }
  }

  return props;
};

const processChildren = (parent) => {
  const children = getChildNodes(parent);
  const named = [...parent.querySelectorAll('[name]')];

  for (const child of named) {
    const name = child.getAttribute('name');
    children[name] = child;
  }

  return children;
};

const replaceCustomTags = (template) => {
  let str = template;

  for (const name of CustomElements.keys()) {
    const openingTag = new RegExp(`(?<=<)${name}(?=[\\s\\S]*>)`, 'g');
    const closingTag = new RegExp(`(?<=<\/)${name}(?=>)`, 'g');

    str = str.replace(openingTag, `custom-component :is="$&"`);
    str = str.replace(closingTag, 'custom-component');
  }

  return str;
};

define('Fragment', ({ children }) => {
  const fragment = document.createDocumentFragment();
  fragment.append(...children);

  return fragment;
});

addPreprocessor(
  (template) =>
    template.replace('<>', '<Fragment>').replace('</>', '</Fragment>'),
  replaceCustomTags
);
