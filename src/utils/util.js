/**
 * Creates a unique id
 * @param {number} length
 * @returns {string}
 */
export const uid = (length = 8) => Math.random().toString(36).slice(2, length);

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
 * Returns children of element as array
 * @param {HTMLElement} parent
 * @returns {Array.<HTMLElement>}
 */
export const getChildren = (parent) => [...parent.children];

/**
 * Removes all children of an element
 * @param {HTMLElement} parent
 */
export const removeChildren = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.lastChild);
  }
};

/**
 * Recursively traverse an element and its children
 * and calls a function for each
 * @param {HTMLElement} node
 * @param {Function} callback
 */
export const traverse = (node, callback) => {
  callback(node);

  if (node.children && node.children.length) {
    getChildren(node).forEach((child) => traverse(child, callback));
  }
};

/**
 * Rebuild fragments from template tag
 * @param {Array.<string>} fragments
 * @param {Array} values
 * @returns
 */
export const rebuildString = (fragments, values) =>
  values.reduce(
    (full, str, i) => `${full}${str}${fragments[i + 1]}`,
    fragments[0]
  );

export const reduceTemplates = (arr) =>
  arr.reduce(
    (acc, item) => {
      acc.str.push(item.str);
      acc.handlers.push(...item.handlers);
      acc.dict = { ...acc.dict, ...item.dict };

      return acc;
    },
    { str: [], handlers: [], dict: {} }
  );
