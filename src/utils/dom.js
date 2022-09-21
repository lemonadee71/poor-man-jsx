import { PLACEHOLDER_REGEX } from '../constants';
import { isPlaceholder } from './is';

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
 * Get all placeholder text nodes
 * @param {HTMLElement|DocumentFragment} root
 * @returns {Text[]}
 */
export const getPlaceholders = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, (node) =>
    isPlaceholder(node.textContent)
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_REJECT
  );
  const oldNodes = [];
  const newNodes = [];

  let current;
  // eslint-disable-next-line
  while ((current = walker.nextNode())) oldNodes.push(current);

  for (const node of oldNodes) {
    const text = node.textContent;
    const matches = text.match(new RegExp(PLACEHOLDER_REGEX, 'g')) || [];
    const fragments = text.split(PLACEHOLDER_REGEX);
    const strings = matches
      .reduce(
        (arr, value, i) => [...arr, value, fragments[i + 1]],
        [fragments[0]]
      )
      .map((str) => document.createTextNode(str));

    newNodes.push(...strings);
    node.replaceWith(...strings);
  }

  return newNodes.filter((node) => isPlaceholder(node.textContent));
};
