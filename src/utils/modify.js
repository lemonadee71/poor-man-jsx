import { naiveDiff, shouldDiffNode } from '../diffing';
import { isBooleanAttribute, isNode } from './is';
import { removeChildren } from './util';

/**
 * Modify an element
 * @param {string|HTMLElement} target - an element or a selector
 * @param {string} type - the modification type
 * @param {Object} data - the data to be hydrated
 * @param {string} data.name - property name
 * @param {any} data.value - property value
 * @param {HTMLElement} context - the context where querySelector will be called
 * @returns
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
      const callback = options.includes('prevent')
        ? (e) => {
            data.value(e);
            e.preventDefault();
          }
        : data.value;

      node.addEventListener(eventName, callback, {
        once: options.includes('once'),
        capture: options.includes('capture'),
      });

      break;
    }
    case 'node':
      node.replaceWith(data.value);
      break;
    case 'children': {
      const children = [data.value].flat();

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
      } else {
        removeChildren(node);

        const fragment = document.createDocumentFragment();

        fragment.append(...children);
        node.append(fragment);
      }

      break;
    }

    default:
      throw new Error('Invalid type.');
  }

  return node;
};
