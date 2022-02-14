import { traverse } from './utils/util';

/**
 * Trigger lifecycle from root to all elements in the subtree
 * @param {string} type - the type of lifecycle
 * @param {HTMLElement} root - the root element
 */
export const triggerLifecycle = (type, root) => {
  traverse(root, (node) => node.dispatchEvent(new Event(`@${type}`)));
};

export const mutationCallback = (mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        triggerLifecycle('mount', node);
      });

      mutation.removedNodes.forEach((node) => {
        triggerLifecycle('unmount', node);

        if (!document.body.contains(node)) {
          triggerLifecycle('destroy', node);
        }
      });
    }
  });
};
