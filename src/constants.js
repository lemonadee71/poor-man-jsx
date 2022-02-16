// This is to hide the ref property an invoked hook returns
// which is a reference to the original object
// to make sure we won't be able to access it outside of its intended use
const REF = Symbol('ref');

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
const LIFECYCLE_METHODS = ['create', 'destroy', 'mount', 'unmount'];
const OBSERVER_CONFIG = { childList: true, subtree: true };

const VALUE_MAP = {
  textcontent: 'textContent',
  text: 'textContent',
  innerhtml: 'innerHTML',
  html: 'innerHTML',
  innertext: 'innerText',
  style: 'style',
  children: 'children',
};

export {
  BOOLEAN_ATTRS,
  DEFAULT_PROPS,
  ELEMENTS_TO_ALWAYS_RERENDER,
  LIFECYCLE_METHODS,
  OBSERVER_CONFIG,
  REF,
  VALUE_MAP,
};
