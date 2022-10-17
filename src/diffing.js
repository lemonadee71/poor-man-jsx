import { getChildNodes } from './utils/dom';
import { venn } from './utils/general';
import { isElement } from './utils/is';
import { getKey } from './utils/meta';

/**
 * Transfers the changes in the updated element
 * to the original element
 * @param {HTMLElement} oldEl - the original element
 * @param {HTMLElement} newEl - the updated element
 * @returns
 */
export const patchElement = (oldEl, newEl) => {
  if (willSkip(oldEl)) return;
  if (!willSkipAttribute(oldEl)) updateAttributes(oldEl, newEl);

  if (oldEl.innerHTML !== newEl.innerHTML) {
    // ignore nodes between markers
    // since hooks are the ones responsible for any changes in them
    const oldNodes = getChildNodes(oldEl).filter(isNotIgnored);
    const newNodes = getChildNodes(newEl).filter(isNotIgnored);
    const newChildren = newNodes.filter(isElement);
    const currentNodes = rearrangeNodes(oldEl, oldNodes, newNodes);

    currentNodes
      .filter(isElement)
      .forEach((child, i) => patchElement(child, newChildren[i]));
  }
};

/**
 * Rearrange nodes if there is change. Relies on `key`.
 * @param {HTMLElement} parent - the original element
 * @param {Node[]} oldNodes - the current child nodes
 * @param {Node[]} newNodes - the updated child nodes
 * @returns {Node[]} the rearranged nodes (added new, removed old)
 */
export const rearrangeNodes = (parent, oldNodes, newNodes) => {
  const oldKeys = oldNodes.map(getKey);
  const newKeys = newNodes.map(getKey);

  if (oldKeys.join() === newKeys.join()) return oldNodes;

  // eslint-disable-next-line prefer-const
  let { left: toRemove, right: toAdd, intersection } = venn(oldKeys, newKeys);
  // do not touch markers since they are constant
  toRemove = toRemove.filter(isNotMarker);
  toAdd = toAdd.filter(isNotMarker);

  // at this point, currentKeys should have the same items as newKeys
  // but with different order (if there was change)
  const currentKeys = [...intersection, ...toAdd];
  const currentNodes = [];

  let previousNode;
  const resolve = (key, newIndex) => {
    const currentNode = toAdd.includes(key)
      ? newNodes[newIndex]
      : oldNodes.find(fromKey(key));

    const oldIndex = currentKeys.indexOf(key);

    // check if node is moved to a new place or if it's a new one
    if (oldIndex !== newIndex || !parent.contains(currentNode)) {
      if (!previousNode) {
        parent.insertBefore(currentNode, oldNodes[0]);
      } else if (currentNode.previousSibling !== previousNode) {
        parent.insertBefore(currentNode, previousNode.nextSibling);
      }
    }

    currentNodes.push(currentNode);
    previousNode = currentNode;
  };

  // This hack is to avoid "child not in parent" error
  // for cases where all original nodes are removed
  // What this does is add the first node to the parent
  // before removing what needs to be removed so that we have a valid anchor
  resolve(newKeys[0], 0);
  for (const key of toRemove) {
    parent.removeChild(oldNodes.find(fromKey(key)));
  }
  newKeys.slice(1).forEach((key, i) => resolve(key, i + 1));

  return currentNodes;
};

/**
 * Update attributes of element by comparing changes
 * between the old and updated element
 * @param {HTMLElement} oldEl - the original element
 * @param {HTMLElement} newEl - the updated element
 */
const updateAttributes = (oldEl, newEl) => {
  const data = oldEl.__meta;
  const attrsToIgnore = ['data-proxyid'];

  if (data?.skip?.others) {
    attrsToIgnore.push(...data.skip.others);
  }

  const oldAttrs = [...oldEl.attributes].filter(
    (attr) => !attrsToIgnore.includes(attr.name)
  );
  const newAttrs = [...newEl.attributes].filter(
    (attr) => !attrsToIgnore.includes(attr.name)
  );

  const {
    left: toRemove,
    intersection,
    right: toAdd,
  } = venn(oldAttrs, newAttrs, (attr) => attr.name);

  for (const attr of toRemove) {
    oldEl.removeAttribute(attr.name);
  }

  for (const attr of toAdd) {
    oldEl.setAttribute(attr.name, attr.value);
  }

  for (const attr of intersection) {
    const old = oldAttrs.find((a) => a.name === attr.name);

    if (old.value !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
  }
};

const fromKey = (key) => (node) => getKey(node) === key;

const isNotIgnored = (node) => !node.__meta?.ignore;

const isNotMarker = (node) =>
  !(
    node.nodeName === '#comment' &&
    /poor-man-jsx-(start|end)/.test(node.textContent)
  );

const willSkip = (el) => el.__meta?.skip?.all;

const willSkipAttribute = (el) => el.__meta?.skip?.attr;
