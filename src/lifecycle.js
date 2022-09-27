import { inTheDocument, traverse } from './utils/dom';

let observer;
const OBSERVER_CONFIG = { childList: true, subtree: true };

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

        if (!inTheDocument(node)) {
          triggerLifecycle('destroy', node);
        }
      });
    }
  });
};

export const enableLifecycle = () => {
  observer = new MutationObserver(mutationCallback);
  observer.observe(document.body, OBSERVER_CONFIG);
};

/**
 * Disconnect the MutationObserver. This will stop watching for added/removed nodes.
 * This means that `@mount`, `@unmount`, and `@destroy` will no longer work.
 * @returns
 */
export const disableLifecycle = () => observer.disconnect();
