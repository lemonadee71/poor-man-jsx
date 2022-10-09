import { LIFECYCLE_METHODS, WRAPPING_BRACKETS } from './constants';
import { patchElement, rearrangeNodes } from './diffing';
import { getPlugins } from './plugin';
import {
  cloneNode,
  getChildNodes,
  getChildren,
  removeChildren,
} from './utils/dom';
import { unescapeHTML } from './utils/general';
import {
  isArray,
  isElement,
  isFunction,
  isNullOrUndefined,
  isString,
  isSVG,
  isTruthy,
} from './utils/is';
import isPlainObject from './utils/is-plain-obj';
import { addKeyRecursive, setMetadata } from './utils/meta';

/**
 * Modify an element based on a directive
 * @param {string|HTMLElement} target - an element or a selector
 * @param {string} type - the modification type
 * @param {Object} data - the data to be hydrated
 * @param {string} data.key - property name
 * @param {any} data.value - property value
 * @param {?HTMLElement} context - the context where querySelector will be called
 * @returns {HTMLElement}
 */
export const modifyElement = (target, type, data, context = document) => {
  const plugins = getPlugins();
  const element =
    isElement(target) || isSVG(target) ? target : context.querySelector(target);

  switch (type) {
    case 'text':
      element.textContent = data.value;
      break;
    case 'html':
      element.innerHTML = unescapeHTML(data.value);
      break;
    case 'attr':
      element.setAttribute(data.key, data.value);
      break;
    case 'toggle': {
      const [arg, option] = data.key.split('.');
      const attrs = arg.replace(WRAPPING_BRACKETS, '').split(',');

      for (const name of attrs) {
        if (isTruthy(data.value)) {
          let value = '';
          if (option === 'mirror') value = name;
          else if (option === 'preserve') value = data.value;

          element.setAttribute(name, value);
        } else {
          element.removeAttribute(name);
        }
      }

      break;
    }
    case 'class:name': {
      const [ifTrue, ifFalse] = data.key
        .replace(WRAPPING_BRACKETS, '')
        .split('|')
        .map((str) => str.split(','));

      if (isTruthy(data.value)) {
        element.classList.remove(...(ifFalse || []));
        element.classList.add(...ifTrue);
      } else {
        element.classList.remove(...ifTrue);
        element.classList.add(...(ifFalse || []));
      }
      break;
    }
    case 'class':
      if (isString(data.value)) {
        element.classList.add(...data.value.split(' ').filter(isTruthy));
      } else if (isArray(data.value)) {
        for (const value of data.value) {
          modifyElement(element, 'class', { value });
        }
      } else if (isPlainObject(data.value)) {
        for (const [n, v] of Object.entries(data.value)) {
          modifyElement(element, 'class:name', { key: n, value: v });
        }
      } else {
        throw new TypeError(
          'You can only pass a string, an array, or a plain object to class.'
        );
      }
      break;
    case 'style:prop':
      element.style[data.key] = data.value;
      break;
    case 'style':
      if (isString(data.value)) {
        element.setAttribute('style', data.value);
      } else if (isPlainObject(data.value)) {
        for (const [n, v] of Object.entries(data.value)) {
          modifyElement(element, 'style:prop', { key: n, value: v });
        }
      } else {
        throw new TypeError(
          'You can only pass a string or a plain object to style.'
        );
      }
      break;
    case 'lifecycle': {
      const fns = [data.value].flat();
      const key = data.key === 'load' ? 'mount' : data.key;
      const once = data.key === 'create' || data.key === 'load';

      for (const fn of fns) {
        element.addEventListener(`@${key}`, fn, { once });
      }
      break;
    }
    case 'listener': {
      const [eventName, ...options] = data.key.split('.');
      const fns = [data.value].flat();

      if (!fns.every(isFunction)) {
        throw new TypeError(
          'Event listener only accepts function | function[]'
        );
      }

      for (const fn of fns) {
        const callback = (e) => {
          if (options.includes('self') && e.target !== e.currentTarget) return;
          fn(e);
          if (options.includes('prevent')) e.preventDefault();
          if (options.includes('only')) e.stopImmediatePropagation();
          else if (options.includes('stop')) e.stopPropagation();
        };

        element.addEventListener(eventName, callback, {
          once: options.includes('once'),
          capture: options.includes('capture'),
          passive: options.includes('passive'),
        });
      }

      break;
    }
    case 'on':
      if (
        !isPlainObject(data.value) ||
        !Object.values(data.value).flat().every(isFunction)
      ) {
        throw new TypeError(
          'Event listener only accepts function | function[]'
        );
      }

      for (const [evt, fns] of Object.entries(data.value)) {
        const evtType = LIFECYCLE_METHODS.includes(evt)
          ? 'lifecycle'
          : 'listener';

        modifyElement(element, evtType, { key: evt, value: fns });
      }

      break;
    case 'children': {
      const previousActiveElement = document.activeElement;
      const fragment = document.createDocumentFragment();

      if (isNullOrUndefined(element.getAttribute('no-diff'))) {
        let nodes = data.value.map((node) =>
          document.body.contains(node) ? cloneNode(node) : node
        );

        fragment.append(...nodes);
        fragment.normalize();

        nodes = getChildNodes(fragment);

        // we do this since we only need to do this on first patch
        if (!element.__meta?.already_keyed) {
          addKeyRecursive(getChildNodes(element));
        }
        setMetadata(element, 'already_keyed', true);

        // add, remove, rearrange top-level first
        rearrangeNodes(element, nodes);

        // then update each element
        const children = nodes.filter(isElement);
        getChildren(element).forEach((child, i) =>
          patchElement(child, children[i])
        );

        // after diffing, simply restore focus
        // since we simply updated the existing elements
        previousActiveElement?.focus();
      } else {
        removeChildren(element);

        fragment.append(...[data.value].flat());
        element.append(fragment);

        // since all children are rerendered
        // we look for the 'equal' node instead and restore focus to it
        // so if there's any change to previous active, we will lose focus
        const matchingElement = getChildren(element).find((child) =>
          child.isEqualNode(previousActiveElement)
        );
        matchingElement?.focus();
      }

      break;
    }
    case 'key': {
      const key = data.value.startsWith('$')
        ? element.getAttribute(data.value.replace('$', ''))
        : data.value;
      setMetadata(element, 'key', key);
      break;
    }
    case 'skip': {
      if (!data.value) {
        setMetadata(element, 'skip', { all: true });
      } else {
        const options = data.value.split(',');
        const others = options.filter((str) => !['all', 'attr'].includes(str));

        setMetadata(element, 'skip', {
          all: options.includes('all'),
          attr: options.includes('attr'),
          others,
        });
      }

      break;
    }
    case 'ref': {
      const [key, o] = isArray(data.value)
        ? data.value
        : ['current', data.value];

      if (!isPlainObject(o)) {
        throw new TypeError('Ref only accepts plain object');
      }

      o[key] = element;

      break;
    }
    case 'show': {
      let display = element.__meta?.og_display;

      if (!display) {
        // NOTE: This might be an expensive operation
        display = window.getComputedStyle(element).display;
        setMetadata(element, 'og_display', display);
      }

      if (isTruthy(data.value)) element.style.display = display;
      else element.style.display = 'none';

      break;
    }
    case 'visible':
      if (isTruthy(data.value)) element.style.visibility = 'visible';
      else element.style.visibility = 'hidden';

      break;

    default:
      plugins[type]?.(element, data, modifyElement);
  }

  return element;
};
