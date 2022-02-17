import { addHooks } from '../hooks';
import { VALUE_MAP } from '../constants';
import { isHook } from './is';
import { modifyElement } from './modify';
import { getType } from './type';
import { compose, rebuildString, resolve, traverse } from './util';

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
  const idPlaceholderRegex = /\$\$id:\w+/;

  traverse(root, (node) => {
    // check if hook or function is passed in the attrs
    [...node.attributes].forEach((attr) => {
      const match = attr.value.trim().match(idPlaceholderRegex);

      if (match) {
        const id = match[0].split(':')[1];
        const value = dict[id];

        if (isHook(value)) {
          const name = VALUE_MAP[attr.name] || attr.name;

          // preserve the position of the hook in the string
          if (match[0] !== attr.value.trim()) {
            const previousTrap = value.data.trap;

            value.data.trap = compose(
              (x) => resolve(x, previousTrap),
              (x) => rebuildString(attr.value.split(match[0]), [x])
            );
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
    // as a general rule, there should be no other child
    if (!node.children.length) {
      const text = node.textContent.trim();
      const match = text.match(idPlaceholderRegex);

      if (match) {
        const id = match[0].split(':')[1];
        const value = dict[id];

        if (!isHook(value)) {
          throw new TypeError('You can only pass a hook to body');
        }

        if (match[0] !== text) {
          const previousTrap = value.data.trap;

          value.data.trap = compose(
            (x) => resolve(x, previousTrap),
            (x) => rebuildString(text.split(match[0]), [x])
          );
        }

        // clear id
        node.textContent = '';
        addHooks(node, { children: value });
      }
    }
  });
};
