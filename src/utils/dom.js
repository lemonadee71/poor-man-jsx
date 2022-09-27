import { PLACEHOLDER_REGEX } from '../constants';
import { uid } from './id';
import { isPlaceholder } from './is';
import { getKey, setMetadata } from './meta';

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

/**
 * Get the index of bounding comment markers
 * @param {string} id
 * @param {Node[]} nodes
 * @returns {[number, number]}
 */
export const getBoundary = (id, nodes) => {
  const start = nodes.findIndex((n) => getKey(n) === `start_${id}`);
  const end = nodes.findIndex((n) => getKey(n) === `end_${id}`);

  return [start + 1, end];
};

/**
 * Create marker comments to easily mark the start and end
 * of where the hook is passed in the body
 * @returns {[Comment,Comment,string]}
 */
export const createMarkers = () => {
  const id = uid();

  // Use comments to easily mark the start and end
  // of where we should insert our children
  const head = document.createComment('{poor-man-jsx-start}');
  const tail = document.createComment('{poor-man-jsx-end}');
  setMetadata(head, 'key', `start_${id}`);
  setMetadata(tail, 'key', `end_${id}`);

  return [head, tail, id];
};
