import { naiveDiff, shouldDiffNode } from '../diffing';
import { isBooleanAttribute, isNode } from './is';
import { getChildren, removeChildren } from './util';

/**
 * Modify an element
 * @param {string|HTMLElement} target - an element or a selector
 * @param {string} type - the modification type
 * @param {Object} data - the data to be hydrated
 * @param {string} data.name - property name
 * @param {any} data.value - property value
 * @param {HTMLElement} context - the context where querySelector will be called
 * @returns {HTMLElement}
 */
export const modifyElement = (target, type, data, context = document) => {
  const node = isNode(target) ? target : context.querySelector(target);

  if (!node) throw new Error(`Can't find node using selector ${target}.`);

  switch (type) {
    case 'prop':
      node[data.name] = data.value;
      break;
    case 'style':
      node.style[data.name] = data.value;
      break;
    case 'attr':
      if (isBooleanAttribute(data.name)) {
        if (data.value) {
          node.setAttribute(data.name, '');
        } else {
          node.removeAttribute(data.name);
        }
      } else {
        node.setAttribute(data.name, data.value);
      }

      break;
    case 'lifecycle':
      node.addEventListener(`@${data.name}`, data.value, {
        once: data.name === 'create',
      });
      break;
    case 'listener': {
      const [eventName, ...options] = data.name.split('.');
      const callback = (e) => {
        if (options.includes('self') && e.target !== e.currentTarget) return;
        data.value(e);
        if (options.includes('prevent')) e.preventDefault();
        if (options.includes('only')) e.stopImmediatePropagation();
        else if (options.includes('stop')) e.stopPropagation();
      };

      node.addEventListener(eventName, callback, {
        once: options.includes('once'),
        capture: options.includes('capture'),
        passive: options.includes('passive'),
      });

      break;
    }
    case 'node':
      node.replaceWith(data.value);
      break;
    case 'children': {
      const children = [data.value].flat();
      const previousActiveElement = document.activeElement;

      if (shouldDiffNode(node)) {
        const newNodes = children.map((el) => {
          if (el instanceof DocumentFragment) {
            if (el.children.length > 1) {
              throw new Error('List item should have a parent');
            }
            return el.firstElementChild;
          }

          return el;
        });

        naiveDiff(node, newNodes);
        // after diffing, simply restore focus
        // since we simply updated the existing elements
        previousActiveElement.focus();
      } else {
        removeChildren(node);

        const fragment = document.createDocumentFragment();

        fragment.append(...children);
        node.append(fragment);

        // since all children are rerendered
        // we look for the 'equal' node instead and restore focus to it
        // so if there's any change to previous active, we will lose focus
        const matchingElement = getChildren(node).find((child) =>
          child.isEqualNode(previousActiveElement)
        );
        if (matchingElement) matchingElement.focus();
      }

      break;
    }

    default:
      throw new Error('Invalid type.');
  }

  return node;
};
