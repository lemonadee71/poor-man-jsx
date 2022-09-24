import {
  getAdditionalAttrDirectives,
  getAdditionalKeyDirectives,
  getAttrDirectives,
  getKeyDirectives,
} from '../directives';
import { isArray, isString } from './is';

const getType = (str, directives) => {
  for (const predicate of directives) {
    const result = predicate(str);
    if (isString(result)) return [result, str];
    if (isArray(result)) return result;
  }

  // Any unrecognizable key will be treated as attr
  return ['attr', str];
};

/**
 * Get the type based on attribute name
 * @param {string} attrName
 * @returns {[string,string]}
 */
export const getTypeOfAttrName = (attrName) => {
  const allDirectives = [
    ...getAttrDirectives(),
    ...getAdditionalAttrDirectives(),
  ];

  return getType(attrName, allDirectives);
};

/**
 * Get the type of object key
 * @param {string} objKey
 * @returns {[string,string]}
 */
export const getTypeOfKey = (objKey) => {
  const allDirectives = [
    ...getAttrDirectives(),
    ...getAdditionalAttrDirectives(),
    ...getKeyDirectives(),
    ...getAdditionalKeyDirectives(),
  ];

  return getType(objKey, allDirectives);
};
