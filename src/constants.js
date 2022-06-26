// special key where we hide data in the element itself
const __DATA__ = Symbol('pmj.data');

// This is to hide the REF_OBJ property an invoked hook returns
// which is a reference to the original object
// to make sure we won't be able to access it outside of its intended use
const REF_OBJ = Symbol('original-object');

const DEFAULT_PROPS = [
  'textContent',
  'innerHTML',
  'outerHTML',
  'innerText',
  'style',
];
const BOOLEAN_ATTRS = [
  'allowfullscreen',
  'allowpaymentrequest',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
  'truespeed',
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

const SPECIAL_ATTRS = {
  textcontent: 'textContent',
  text: 'textContent',
  innerhtml: 'innerHTML',
  html: 'innerHTML',
  innertext: 'innerText',
  style: 'style',
  children: 'children',
};

const addBooleanAttribute = (...attr) => BOOLEAN_ATTRS.push(...attr);

export {
  __DATA__,
  BOOLEAN_ATTRS,
  DEFAULT_PROPS,
  ELEMENTS_TO_ALWAYS_RERENDER,
  LIFECYCLE_METHODS,
  REF_OBJ,
  SPECIAL_ATTRS,
  addBooleanAttribute,
};
