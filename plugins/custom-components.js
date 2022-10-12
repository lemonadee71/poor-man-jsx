import PoorManJSX, { createElementFromTemplate } from '../src';

const _ = PoorManJSX.utils;
const CustomElements = new Map();
const VALID_COMPONENT_NAME = /^[\w-]+$/;

/**
 * Define one or more custom components.
 * @param  {...any} data
 */
const define = (...data) => {
  if (data.length === 2 && _.isString(data[0]) && _.isFunction(data[1])) {
    register(data[0], data[1]);
  } else if (data.every(_.isPlainObject)) {
    for (const value of data) {
      Object.entries(value).forEach((x) => register(...x));
    }
  } else if (data.every(_.isArray)) {
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
const remove = (...names) => {
  for (const name of names) CustomElements.delete(name);
};

const replaceCustomComponents = (parent, values) => {
  const custom = [...parent.querySelectorAll('custom-component')];

  for (const element of custom) {
    const component = CustomElements.get(element.getAttribute(':is'));
    const defaultProps = component.defaultProps || {};

    element.removeAttribute(':is');

    const children = processChildren(element);
    const props = attrsToProps([...element.attributes], values);
    const actual = component({
      children,
      props: Object.assign(defaultProps, props),
    });

    if (!_.isTemplate(actual) && !_.isNode(actual)) {
      throw new Error('Custom component must be a Template or a Node');
    }

    element.replaceWith(
      _.isTemplate(actual)
        ? createElementFromTemplate({
            ...actual,
            values: { ...actual.values, ...values },
          })
        : actual
    );
  }
};

const camelize = (str) => str.replace(/[-_]./g, (x) => x[1].toUpperCase());

const stringToRaw = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (_.isNumber(+value)) return +value;
  return _.unescapeHTML(value);
};

const attrsToProps = (attrs, values) => {
  const props = {};

  for (const attr of attrs) {
    if (_.isPlaceholder(attr.name)) {
      let value = values[_.getPlaceholderId(attr.name)];
      value = [value].flat();

      for (const o of value) Object.assign(props, o);
    } else {
      const name = camelize(attr.name);

      if (_.isPlaceholder(attr.value)) {
        props[name] = values[_.getPlaceholderId(attr.value)];
      } else {
        props[name] = stringToRaw(attr.value);
      }
    }
  }

  return props;
};

const processChildren = (parent) => {
  const children = [...parent.childNodes];
  children.named = [];
  children.unnamed = [];

  for (const child of children.filter(_.isElement)) {
    const name = child.getAttribute(':slot');

    if (name) {
      children[name] = child;
      children.named.push(child);
    } else {
      children.unnamed.push(child);
    }
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

export default [
  'customComponents',
  {
    _init: function () {
      define('Fragment', ({ children }) => {
        const fragment = document.createDocumentFragment();
        fragment.append(...children);

        return fragment;
      });

      PoorManJSX.onBeforeCreate(
        (template) =>
          template.replace('<>', '<Fragment>').replace('</>', '</Fragment>'),
        replaceCustomTags
      );

      PoorManJSX.onBeforeHydrate(replaceCustomComponents);
    },
    define,
    remove,
  },
];
