import { ELEMENTS_TO_ALWAYS_RERENDER } from './constants';
import { getChildren } from './utils/util';

const IGNORE_UPDATE_GLOBAL = ['data-proxyid'];

// Diffing utils

const getKeyString = (node) => node.getAttribute('keystring') || 'key';

const getKey = (node, keyString) =>
  node.getAttribute(keyString) ||
  node.getAttribute('key') ||
  node.getAttribute('data-key');

const hasNoKey = (nodes, keyString) =>
  nodes.some((node) => !getKey(node, keyString));

const getBehavior = (node, type) =>
  node.getAttribute(`is-${type}`) !== null ||
  node.getAttribute('behavior') === type;

/**
 * Checks if element will be treated as 'text' element
 * @param {HTMLElement} node
 * @returns {Boolean}
 */
const isText = (node) => getBehavior(node, 'text');

/**
 * Checks if element needs to be diffed
 * @param {HTMLElement} node
 * @returns {Boolean}
 */
const shouldDiffNode = (node) => getBehavior(node, 'list');

/**
 * Check if element should ignore updates
 * @param {HTMLElement} node
 * @returns {Boolean}
 */
const shouldSkip = (node) => node.getAttribute('ignore-all') !== null;

/**
 * Check if element should only update attributes and not content
 * @param {HTMLElement} node
 * @returns {Boolean}
 */
const shouldIgnoreContent = (node) =>
  node.getAttribute('ignore-content') !== null;

/**
 * Add an attribute to be ignored by diffing. This will be applied to all elements.
 * Use attribute `ignore` for localized ignored attributes.
 * @param  {...string} attr - the attribute to be ignored
 * @returns
 */
const addIgnoredAttribute = (...attr) => IGNORE_UPDATE_GLOBAL.push(...attr);

// Main

const rearrangeNodes = (parent, newNodes, keyString) => {
  const oldNodes = getChildren(parent);
  const oldKeys = oldNodes.map((node) => getKey(node, keyString));
  const newKeys = newNodes.map((node) => getKey(node, keyString));
  const toAdd = newKeys.filter((key) => !oldKeys.includes(key));

  // remove nodes
  oldKeys
    .filter((key) => !newKeys.includes(key))
    .forEach((key) =>
      oldNodes.find((node) => getKey(node, keyString) === key).remove()
    );

  // at this point, currentKeys should have the same items as newKeys
  // but with differing order (if there was change)
  const currentKeys = oldKeys.filter((key) => newKeys.includes(key));
  currentKeys.push(...toAdd);

  let prevElement;

  newKeys.forEach((key, newIndex) => {
    const oldIndex = currentKeys.indexOf(key);

    // if adding for the first time, get the new element
    // otherwise get the current element from parent
    const currentElement = toAdd.includes(key)
      ? newNodes[newIndex]
      : getChildren(parent).find((node) => getKey(node, keyString) === key);

    // check if node is moved to a new place
    // or if it's a new one
    if (oldIndex !== newIndex || !parent.contains(currentElement)) {
      if (!prevElement) {
        parent.prepend(currentElement);
      } else if (currentElement.previousElementSibling !== prevElement) {
        prevElement.after(currentElement);
      }
    }

    prevElement = currentElement;
  });
};

const updateAttributes = (oldNode, newNode) => {
  const oldAttributes = [...oldNode.attributes];
  const newAttributes = [...newNode.attributes];

  const attributesToIgnore = [
    ...(oldNode.getAttribute('ignore') || '').split(','),
    ...IGNORE_UPDATE_GLOBAL,
  ];
  const attributesToRemove = oldAttributes
    .filter((attr) => !newAttributes.map((a) => a.name).includes(attr.name))
    .filter((attr) => !attributesToIgnore.includes(attr.name));

  // remove attrs
  attributesToRemove.forEach((attr) => oldNode.removeAttribute(attr.name));

  // add new and update existing
  newAttributes
    .filter((attr) => !attributesToIgnore.includes(attr.name))
    .forEach((attr) => oldNode.setAttribute(attr.name, attr.value));
};

const patchNodes = (oldNode, newNode) => {
  if (shouldSkip(oldNode)) return;

  updateAttributes(oldNode, newNode);

  // we assume that the number of children is still the same
  // and that changes are limited to "content"
  // and are enclosed in an inline text element (see ELEMENT_TO_ALWAYS_RERENDER)
  if (
    !shouldIgnoreContent(oldNode) &&
    (isText(oldNode) ||
      ELEMENTS_TO_ALWAYS_RERENDER.includes(oldNode.nodeName.toLowerCase()))
  ) {
    if (oldNode.innerHTML !== newNode.innerHTML) {
      oldNode.innerHTML = newNode.innerHTML;
    }

    // diff
  } else if (shouldDiffNode(oldNode)) {
    // this won't check for items that don't have a key
    // since we're not using naiveDiff to avoid circular dependency
    const nodes = getChildren(newNode);
    rearrangeNodes(oldNode, nodes, getKeyString(oldNode));
    getChildren(oldNode).forEach((child, i) => patchNodes(child, nodes[i]));

    // recursively update
  } else if (oldNode.children.length) {
    getChildren(oldNode).forEach((child, i) =>
      patchNodes(child, newNode.children[i])
    );
  }
};

/**
 * Applies naive diffing to an element
 * @param {HTMLElement} parent
 * @param {Array.<HTMLElement>} newNodes
 */
const naiveDiff = (parent, newNodes) => {
  const keyString = getKeyString(parent);

  // every item should have a key
  if (hasNoKey(newNodes, keyString)) {
    throw new Error(
      'every children should have a key if parent is of type list'
    );
  }

  // rearrange first
  rearrangeNodes(parent, newNodes, keyString);
  // then update each element
  getChildren(parent).forEach((child, i) => patchNodes(child, newNodes[i]));
};

export { addIgnoredAttribute, shouldDiffNode, naiveDiff };
