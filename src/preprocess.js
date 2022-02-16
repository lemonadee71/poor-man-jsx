import { isArray } from './utils/is';
import { compose } from './utils/util';

let preprocessors = [];

/**
 * Adds a preprocessor. Preprocessors are used to process the html string
 * before rendering it.
 * @param  {...Function|Array.<Function>} processors
 * @returns
 */
export const addPreprocessor = (...processors) =>
  preprocessors.push(...processors);

/**
 * Removes a preprocessor
 * @param {Function} processor - the function to remove
 */
export const removePreprocessor = (processor) => {
  preprocessors = preprocessors.filter((fn) => fn !== processor);
};

/**
 * Process an html string
 * @param {string} str
 * @returns {[string, Array.<Handler>]}
 */
export const preprocess = (str) => {
  const handlers = [];
  let htmlString = str;

  preprocessors.forEach((processor) => {
    let result;
    if (isArray(processor)) {
      result = compose(...processor)(htmlString);
    } else {
      result = processor(htmlString);
    }

    if (isArray(result)) {
      htmlString = result[0];
      handlers.push(...(result[1] || []));
    } else if (typeof result === 'string') {
      htmlString = result;
    } else {
      throw new Error('Preprocessor must return a string or an array');
    }
  });

  return [htmlString, handlers];
};
