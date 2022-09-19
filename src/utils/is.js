import { PLACEHOLDER_REGEX } from '../../rewrite/constants';
import { HOOK_REF } from '../constants';
import Template from './Template';

export const isNullOrUndefined = (value) =>
  value === null || value === undefined;

export const isObject = (value) => typeof value === 'object';

export const isFunction = (value) => typeof value === 'function';

export const isString = (value) => typeof value === 'string';

export const isNumber = (value) =>
  typeof value === 'number' && !Number.isNaN(value);

export const isArray = (value) => Array.isArray(value);

export const isNode = (value) => value instanceof Node;

export const isTextNode = (value) => value instanceof Text;

export const isElement = (value) => value instanceof HTMLElement;

export const isFragment = (value) => value instanceof DocumentFragment;

export const isTemplate = (value) => value instanceof Template;

export const isPlaceholder = (string) => PLACEHOLDER_REGEX.test(string);

export const isTruthy = (value) =>
  value &&
  // handles strings
  !['0', 'false', 'null', 'undefined', 'NaN'].includes(value);

export const isHook = (value) => {
  if (isObject(value) || isFunction(value)) return !!value[HOOK_REF];
  return false;
};
