const PLACEHOLDER_PREFIX = 'placeholder-';

/**
 * Replace all strings wrapped in {} with placeholder
 * @param {string} str
 * @returns {string} the processed string
 */
export const addPlaceholders = (str) => {
  const placeholderRegex = /{%\s*(.*)\s*%}/;
  let newString = str;
  let match = newString.match(placeholderRegex);

  while (match) {
    newString = newString.replace(
      match[0],
      `<!-- ${PLACEHOLDER_PREFIX}${match[1].trim()} -->`
    );

    match = newString.slice(match.index).match(placeholderRegex);
  }

  return newString;
};

/**
 * Replace all placeholder comments from whole subtree
 * with specified text
 * @param {HTMLElement} root
 */
export const replacePlaceholderComments = (root) => {
  const iterator = document.createNodeIterator(
    root,
    NodeFilter.SHOW_COMMENT,
    () => NodeFilter.FILTER_ACCEPT
  );

  let current;
  // eslint-disable-next-line
  while ((current = iterator.nextNode())) {
    const text = current.nodeValue.trim();
    const isPlaceholder = text.startsWith(PLACEHOLDER_PREFIX);

    if (isPlaceholder) {
      current.replaceWith(
        document.createTextNode(text.replace(PLACEHOLDER_PREFIX, ''))
      );
    }
  }
};
