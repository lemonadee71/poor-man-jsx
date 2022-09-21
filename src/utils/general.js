/**
 * Get the id of placeholder
 * @param {string} str
 * @returns {string}
 */
export const getPlaceholderId = (str) => str.replaceAll('__', '');

/**
 * Convert kebab-case to camelCase.
 * Taken from https://stackoverflow.com/questions/57556471
 * @param {string} str
 * @returns {string}
 */
export const camelize = (str) =>
  str.replace(/[-_]./g, (x) => x[1].toUpperCase());

/**
 * Escape unsafe html entities from a string.
 * Taken from: https://stackoverflow.com/questions/6234773
 * @param {string} unsafe - string to escape
 * @returns {string}
 */
export const escapeHTML = (unsafe) =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/**
 * Unescape html entities from a string
 * @param {string} safe
 * @returns {string}
 */
export const unescapeHTML = (safe) =>
  safe
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

/**
 * Compose functions. Executes from left to right.
 * @param  {...Function} fns
 * @returns
 */
export const compose = (...fns) => {
  if (fns.some((fn) => typeof fn !== 'function')) {
    throw new Error('Argument must be a function');
  }

  return fns.reduce(
    (f, g) =>
      (...args) =>
        g(f(...args))
  );
};

/**
 * Executes a function if available
 * @param {*} value
 * @param {?Function} fn
 * @returns {any}
 */
export const resolve = (value, fn = null) => (fn ? fn(value) : value);

/**
 * @typedef {Object} Venn
 * @property {Array} left - items that are unique to the first array
 * @property {Array} intersection - items that are present in both arrays
 * @property {Array} right - items that are unique to the second array
 */

/**
 * Get the venn diagram of the two arrays
 * @param {Array} first - the first array
 * @param {Array} second - the second array
 * @param {?Function} transform - the function to run on an item
 * @returns {Venn}
 */
export const venn = (first, second, transform = null) => {
  const [left, intersection] = first.reduce(
    (arr, item) => {
      if (!second.includes(resolve(item, transform))) {
        arr[0].push(item);
      } else {
        arr[1].push(item);
      }

      return arr;
    },
    [[], []]
  );
  const right = second.filter(
    (item) => !intersection.includes(resolve(item, transform))
  );

  return {
    left,
    intersection,
    right,
  };
};
