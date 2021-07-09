import Template from './Template.js';

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

const isObject = (val) => typeof val === 'object';

const isArray = (val) => Array.isArray(val);

const isTemplate = (val) => val instanceof Template;

const isState = (key) => key.startsWith('$');

const isEventListener = (key) => key.toLowerCase().startsWith('on');

const isDefaultProp = (key) => defaultProps.includes(key);

const isStyleAttribute = (key) => key in el.style;

const isBooleanAttribute = (attr) => booleanAttributes.includes(attr);

export {
  isObject,
  isArray,
  isTemplate,
  isState,
  isEventListener,
  isDefaultProp,
  isStyleAttribute,
  isBooleanAttribute,
};
