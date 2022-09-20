import {
  getAdditionalAttrDirectives,
  getAdditionalKeyDirectives,
  getAttrDirectives,
  getKeyDirectives,
} from '../directives';

/**
 * Get the type based on attribute name
 * @param {string} attrName
 * @returns {[string,string|null]}
 */
export const getTypeOfAttrName = (attrName) => {
  const allDirectives = [
    ...getAttrDirectives(),
    ...getAdditionalAttrDirectives(),
  ];

  for (const predicate of allDirectives) {
    const result = predicate(attrName);
    if (result) return result;
  }

  // Any unrecognizable key will be treated as attr
  return ['attr', attrName];
};

/**
 * Get the type of object key
 * @param {string} objKey
 * @returns {[string,string|null]}
 */
export const getTypeOfKey = (objKey) => {
  const allDirectives = [
    ...getAttrDirectives(),
    ...getAdditionalAttrDirectives(),
    ...getKeyDirectives(),
    ...getAdditionalKeyDirectives(),
  ];

  for (const predicate of allDirectives) {
    const result = predicate(objKey);
    if (result) return result;
  }

  // Any unrecognizable key will be treated as attr
  return ['attr', objKey];
};
