import { addHooks, text as textHook } from '../hooks';
import { VALUE_MAP } from '../constants';
import { isHook } from './is';
import { modifyElement } from './modify';
import { getType } from './type';
import { traverse } from './util';

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

/**
 * Process all attributes with placeholder ids
 * @param {HTMLElement} root - the element
 * @param {Object} dict - key-value pair
 */
export const replacePlaceholderIds = (root, dict) => {
  const idPlaceholderRegex = /\s*(\$\$id:\w+)\s*/;

  traverse(root, (node) => {
    // check if hook or function is passed in the attrs
    [...node.attributes].forEach((attr) => {
      const match = attr.value.match(idPlaceholderRegex);

      if (match && match[1]) {
        const id = match[1].split(':')[1];
        let value = dict[id];

        if (isHook(value)) {
          const [left, right] = attr.value.split(match[1]);
          let name = attr.name;

          if (attr in VALUE_MAP) {
            name = VALUE_MAP[attr.name];
          }

          // preserve the position of the hook in the string
          if (left || right) {
            value = textHook([left, right], value);
          }

          addHooks(node, { [name]: value });
        } else {
          const [name, type] = getType(attr.name);
          modifyElement(node, type, { name, value });
        }

        node.removeAttribute(attr.name);
      }
    });

    // check if hook is passed in the body
    const match = node.innerHTML.match(idPlaceholderRegex);

    if (match && match[1]) {
      const [left, right] = node.innerHTML.split(match[1]);
      const id = match[1].split(':')[1];
      let value = dict[id];

      if (!isHook(value))
        throw new TypeError('You can only pass a hook to body');

      if (left.trim() || right.trim()) {
        value = textHook([left, right], value);
      }

      addHooks(node, { children: value });
    }
  });
};
