import { getChildNodes } from './dom';
import { hash } from './id';
import { isElement, isTextNode } from './is';

/**
 * Set a node's metadata.
 * @param {Node} node - the target node
 * @param {string} key - the prop to be set; can be nested
 * @param {any} value - the value
 * @returns {Object}
 */
export const setMetadata = (node, key, value) => {
  if (!node.__meta) node.__meta = {};

  const keys = key.split('.');
  const path = keys.slice(0, keys.length - 1);
  const _key = keys[keys.length - 1];

  let prev = node.__meta;
  for (const k of path) prev = prev[k];
  prev[_key] = value;

  return node.__meta;
};

/**
 * Get a node's key
 * @param {Node} node
 * @returns {string}
 */
export const getKey = (node) => {
  const data = node.__meta;
  if (data?.keystring && isElement(node))
    return node.getAttribute(data?.keystring);
  return data?.key;
};

/**
 * Add key to nodes if they don't have one.
 * @param {Node[]} nodes
 */
export const addKeyRecursive = (nodes) => {
  const idMap = {};

  for (const item of nodes) {
    if (!item?.__meta?.key) {
      if (isTextNode(item)) {
        const id = hash(item.textContent);

        if (!idMap[id]) idMap[id] = 0;

        setMetadata(item, 'key', `${id}_${++idMap[id]}`);
      }
      // for elements
      else if (isElement(item)) {
        const tag = item.tagName;

        if (!idMap[tag]) idMap[tag] = 0;

        setMetadata(item, 'key', `${tag}_${++idMap[tag]}`);
      }
    }

    if (isElement(item)) addKeyRecursive(getChildNodes(item));
  }
};
