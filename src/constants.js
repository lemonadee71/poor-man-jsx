const DEFAULT_PROPS = [
  'textContent',
  'innerHTML',
  'outerHTML',
  'innerText',
  'style',
];
const BOOLEAN_ATTRS = [
  'checked',
  'selected',
  'disabled',
  'readonly',
  'multiple',
  'ismap',
  'noresize',
  'reversed',
  'autocomplete',
];
const ELEMENTS_TO_ALWAYS_RERENDER = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'span',
  'em',
  'i',
  'small',
  'strong',
  'sub',
  'sup',
  'ins',
  'del',
  'mark',
  'pre',
  'b',
  'code',
  'abbr',
  'kbd',
  'cite',
];
const IGNORE_UPDATE = ['data-proxyid'];
const LIFECYCLE_METHODS = ['create', 'destroy', 'mount', 'unmount'];
const OBSERVER_CONFIG = { childList: true, subtree: true };

export {
  BOOLEAN_ATTRS,
  DEFAULT_PROPS,
  ELEMENTS_TO_ALWAYS_RERENDER,
  IGNORE_UPDATE,
  LIFECYCLE_METHODS,
  OBSERVER_CONFIG,
};
