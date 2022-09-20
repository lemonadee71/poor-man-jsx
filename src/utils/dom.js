import { PLACEHOLDER_REGEX } from '../constants';
import { isPlaceholder, isTextNode } from './is';

/**
 * Returns children of element as array
 * @param {HTMLElement} parent
 * @returns {Array.<Node>}
 */
export const getChildNodes = (parent) => [...parent.childNodes];

/**
 * Returns all child node of element as array
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
 * @param {HTMLElement} element
 * @param {Function} callback
 */
export const traverse = (element, callback) => {
  callback(element);

  if (element.children && element.children.length) {
    getChildren(element).forEach((child) => traverse(child, callback));
  }
};

/**
 * Clone a node and its metadata
 * @param {Node} node
 * @returns {Node}
 */
export const cloneNode = (node) => {
  const clone = node.cloneNode(true);
  clone.__meta = { ...(node.__meta || {}) };
  return clone;
};

/**
 * Get all elements with placeholder texts in their body
 * @param {HTMLElement|DocumentFragment} root
 * @returns {HTMLElement[]}
 */
export const getElementsWithPlaceholder = (root) => {
  const elementsWithPlaceholder = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, (node) =>
    isPlaceholder(node.textContent)
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_REJECT
  );

  let current;
  // eslint-disable-next-line
  while ((current = walker.nextNode())) {
    const parent = current.parentElement;
    if (!elementsWithPlaceholder.includes(parent)) {
      elementsWithPlaceholder.push(parent);
    }
  }

  return elementsWithPlaceholder;
};

/**
 * Split all placeholder texts into their own nodes
 * @param {HTMLElement} element
 */
export const splitTextNodes = (element) => {
  getChildNodes(element)
    .filter(isTextNode)
    .forEach((node) => {
      const text = node.textContent;
      const matches = text.match(new RegExp(PLACEHOLDER_REGEX, 'g')) || [];
      const fragments = text.split(PLACEHOLDER_REGEX);
      const strings = matches.reduce(
        (arr, value, i) => [...arr, value, fragments[i + 1]],
        [fragments[0]]
      );

      node.replaceWith(...strings);
    });
};
