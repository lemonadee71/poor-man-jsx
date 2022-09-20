import { compose } from './utils/general';
import { isArray } from './utils/is';

let processors = [];

/**
 * Add a callback that will process the html string before creation
 * @param  {...Function|Function[]} callback
 * @returns
 */
export const addPreprocessor = (...callback) => processors.push(...callback);

/**
 * Remove a processor callback. If callback is omitted,
 * all processors are removed
 * @param {?Function} callback
 */
export const removePreprocessor = (callback = null) => {
  if (callback) processors = processors.filter((fn) => fn !== callback);
  else processors = [];
};

export const preprocess = (htmlString) =>
  processors.reduce(
    (result, fn) => (isArray(fn) ? compose(...fn)(result) : fn(result)),
    htmlString
  );
