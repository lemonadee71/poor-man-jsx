import { BOOLEAN_ATTRS, DEFAULT_PROPS, LIFECYCLE_METHODS } from '../constants';
import Template from '../Template';

const mockEl = document.createElement('div');
const customAttributes = [];

export const isNullOrUndefined = (value) =>
  value === null || value === undefined;

export const isObject = (value) => typeof value === 'object';

export const isArray = (value) => Array.isArray(value);

export const isTemplate = (value) => value instanceof Template;

export const isNode = (value) => value instanceof Node;

export const isHook = (key) => key.startsWith('$');

export const isEventListener = (key) => key.toLowerCase().startsWith('on');

export const isLifecycleMethod = (key) => {
  const name = key.replace('on', '').toLowerCase();

  return isEventListener(key) && LIFECYCLE_METHODS.includes(name);
};

export const isDefaultProp = (key) => DEFAULT_PROPS.includes(key);

export const isStyleAttribute = (key) =>
  !customAttributes.includes(key) &&
  (key in mockEl.style || key.startsWith('style_'));

export const isBooleanAttribute = (attr) => BOOLEAN_ATTRS.includes(attr);
