/**
 * Creates a unique id
 * @param {number} length
 * @returns {string}
 */
export const uid = (length = 8) => Math.random().toString(36).slice(2, length);

/**
 * Create a hash string. Taken from https://stackoverflow.com/questions/6122571
 * @param {string} string
 * @returns {string}
 */
export const hash = (string) => {
  /* eslint-disable */
  let hash = 0;
  for (let i = 0, len = string.length; i < len; i++) {
    hash = (hash << 5) - hash + string.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  /* eslint-enable */

  return hash.toString(36);
};
