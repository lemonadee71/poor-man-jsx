import { isArray } from './utils/is';
import { compose } from './utils/util';

const beforeCreate = [];
const afterCreate = [];

/**
 * Add a callback that will process the html string before creation
 * @param  {...Function|Array.<Function>} callback
 * @returns
 */
export const onBeforeCreation = (...callback) => beforeCreate.push(...callback);

/**
 * Add a callback that will be called after `template` is turned to an element.
 * Callback will be called only for the direct children of the created DocumentFragment
 * @param  {...Function|Array.<Function>} callback
 * @returns
 */
export const onAfterCreation = (...callback) => afterCreate.push(...callback);

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
 * Run after-creation callbacks on an element
 * @param {HTMLElement} element
 */
export const postprocess = (element) => {
  afterCreate.forEach((fn) => {
    if (isArray(fn)) compose(...fn)(element);
    else fn(element);
  });
};
