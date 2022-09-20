import { addPreprocessor } from './preprocess';
import { getChildNodes, splitTextNodes } from './utils/dom';
import { camelize, getPlaceholderId, unescapeHTML } from './utils/general';
import { isNode, isNumber, isPlaceholder, isTemplate } from './utils/is';

const CustomElements = new Map();
const VALID_COMPONENT_NAME = /^[\w-]+$/;

/**
 * Define a custom component
 * @param {string} name - the name of the component; must be a valid html tag
 * @param {Function} component - the component function
 */
export const define = (name, component) => {
  if (VALID_COMPONENT_NAME.test(name)) {
    CustomElements.set(name, component);
  } else {
    throw new Error('`name` must be a valid html tag');
  }
};

/**
 * Remove a custom component
 * @param {string} name - the name of the component to be removed
 * @returns
 */
export const remove = (name) => CustomElements.delete(name);

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
  splitTextNodes(parent);

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
