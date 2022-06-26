import { __DATA__ } from './constants';
import { isArray } from './utils/is';
import { compose, setData, traverse } from './utils/util';

let beforeCreate = [];
let afterCreate = [];

/**
 * Add a callback that will process the html string before creation
 * @param  {...Function|Array.<Function>} callback
 * @returns
 */
export const onBeforeCreation = (...callback) => beforeCreate.push(...callback);

/**
 * Remove a beforeCreation callback. If passed no arguments, all callback will be removed
 * @param {?Function} callback - the callback to be removed
 */
export const removeBeforeCreation = (callback = null) => {
  if (callback) beforeCreate = beforeCreate.filter((cb) => cb !== callback);
  else beforeCreate = [];
};

/**
 * Add a callback that will be called after `template` is turned to an element.
 * Callback will be called only for the direct children of the created DocumentFragment
 * @param  {...Function|Array.<Function>} callback
 * @returns
 */
export const onAfterCreation = (...callback) => afterCreate.push(...callback);

/**
 * Remove a afterCreation callback. If passed no arguments, all callback will be removed
 * @param {?Function} callback - the callback to be removed
 */
export const removeAfterCreation = (callback = null) => {
  if (callback) afterCreate = afterCreate.filter((cb) => cb !== callback);
  else afterCreate = [];
};

/**
 * Process an html string
 * @param {string} htmlString
 * @returns {string}
 */
export const preprocess = (htmlString) =>
  beforeCreate.reduce(
    (result, fn) => (isArray(fn) ? compose(...fn)(result) : fn(result)),
    htmlString
  );

/**
 * Run after-creation callbacks on an element and its children
 * @param {HTMLElement} element
 */
export const postprocess = (element) => {
  traverse(element, (node) => {
    if (node[__DATA__] && node[__DATA__].initialized) return;

    afterCreate.forEach((fn) => {
      if (isArray(fn)) compose(...fn)(node);
      else fn(node);
    });

    setData(node, 'initialized', true);
  });
};
