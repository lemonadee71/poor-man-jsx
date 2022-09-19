export const HOOK_REF = Symbol('ref_obj');

export const PLACEHOLDER_REGEX = /__\w+__/;
export const WRAPPING_BRACKETS = /^\[|\]$/g;
export const WRAPPING_QUOTES = /^['"]|['"]$/g;

// NOTE: Reserved words for event listener names
export const LIFECYCLE_METHODS = ['create', 'destroy', 'mount', 'unmount'];
export const BOOLEAN_ATTRS = [
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
