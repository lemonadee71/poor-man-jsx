import {
  BOOLEAN_ATTRS,
  DEFAULT_PROPS,
  LIFECYCLE_METHODS,
  REF,
} from '../constants';
import Template from '../Template';

export const isNullOrUndefined = (value) =>
  value === null || value === undefined;

export const isObject = (value) => typeof value === 'object';

export const isFunction = (value) => typeof value === 'function';

export const isString = (value) => typeof value === 'string';

export const isArray = (value) => Array.isArray(value);

export const isTemplate = (value) => value instanceof Template;

export const isNode = (value) => value instanceof Node;

export const isHook = (value) => {
  if (isString(value)) return value.startsWith('$');
  if (isObject(value) || isFunction(value)) return !!value[REF];
  return false;
};

export const isEventListener = (key) => key.toLowerCase().startsWith('on');

export const isLifecycleMethod = (key) => {
  const name = key.replace('on', '').toLowerCase();

  return isEventListener(key) && LIFECYCLE_METHODS.includes(name);
};

export const isDefaultProp = (key) => DEFAULT_PROPS.includes(key);

// all names prefixed with `style_` will be assumed as style attr
// this is to avoid naming conflicts
export const isStyleAttribute = (key) => key.startsWith('style_');

export const isBooleanAttribute = (attr) => BOOLEAN_ATTRS.includes(attr);
