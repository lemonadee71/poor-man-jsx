import { getChildNodes, getChildren } from './utils/dom';
import { venn } from './utils/general';
import { getKey, setMetadata } from './utils/meta';

/**
 * Transfers the changes in the updated element
 * to the original element
 * @param {HTMLElement} oldEl - the original element
 * @param {HTMLElement} newEl - the updated element
 * @returns
 */
export const patchElement = (oldEl, newEl) => {
  const meta = oldEl.__meta;

  if (meta?.skip?.all) return;
  if (!meta?.skip?.attr && !meta?.isNew) updateAttributes(oldEl, newEl);

  if (oldEl.innerHTML !== newEl.innerHTML) {
    rearrangeNodes(oldEl, getChildNodes(newEl));
    getChildren(oldEl).forEach((child, i) =>
      patchElement(child, newEl.children[i])
    );
  }

  setMetadata(oldEl, 'isNew', false);
};

// NOTE: There are some empty text nodes in between elements
//       which can cause additional mount/unmount
//       consider ignoring/removing them for block level elements
/**
 * Rearrange nodes if there is change. Relies on `key`.
 * @param {HTMLElement} parent - the original element
 * @param {Node[]} newNodes - the updated child nodes
 */
export const rearrangeNodes = (parent, newNodes) => {
  const oldNodes = getChildNodes(parent);
  const oldKeys = oldNodes.map(getKey);
  const newKeys = newNodes.map(getKey);

  if (oldKeys.join() === newKeys.join()) return;

  const { left: toRemove, right: toAdd, intersection } = venn(oldKeys, newKeys);
  // at this point, currentKeys should have the same items as newKeys
  // but with different order (if there was change)
  const currentKeys = [...intersection, ...toAdd];

  // to avoid unnecessary call of `updateAttribute` on first patch
  for (const key of toAdd) {
    setMetadata(newNodes.find(fromKey(key)), 'isNew', true);
  }

  for (const key of toRemove) {
    parent.removeChild(oldNodes.find(fromKey(key)));
  }

  let previousNode;
  newKeys.forEach((key, newIndex) => {
    const currentNode = toAdd.includes(key)
      ? newNodes[newIndex]
      : oldNodes.find(fromKey(key));

    const oldIndex = currentKeys.indexOf(key);

    // check if node is moved to a new place
    // or if it's a new one
    if (oldIndex !== newIndex || !parent.contains(currentNode)) {
      if (!previousNode) {
        parent.insertBefore(currentNode, parent.firstChild);
      } else if (currentNode.previousSibling !== previousNode) {
        parent.insertBefore(currentNode, previousNode.nextSibling);
      }
    }

    previousNode = currentNode;
  });
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
