import { compose } from './utils/general';
import { isArray } from './utils/is';

const templateStringProcessors = [];

/**
 * Add a callback that will process the html string before creation
 * @param  {...Function|Function[]} callback
 * @returns
 */
export const addPreprocessor = (...callback) =>
  templateStringProcessors.push(...callback);

export const preprocess = (htmlString) =>
  templateStringProcessors.reduce(
    (result, fn) => (isArray(fn) ? compose(...fn)(result) : fn(result)),
    htmlString
  );
