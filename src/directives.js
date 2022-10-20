import { BOOLEAN_ATTRS, LIFECYCLE_METHODS } from './constants';

const attrNameDirectives = [
  (key) => ['on', 'class', 'style'].includes(key) && key,
  (key) =>
    key.startsWith('style:') && ['style:prop', key.replace('style:', '')],
  (key) =>
    key.startsWith('class:') && ['class:name', key.replace('class:', '')],
  (key) => {
    const k = key.toLowerCase().trim();
    const name = k.replace('on', '');
    return k.startsWith('on') && LIFECYCLE_METHODS.includes(name)
      ? ['lifecycle', name]
      : null;
  },
  (key) =>
    key.toLowerCase().startsWith('on') && key !== 'on'
      ? ['listener', key.replace('on', '').toLowerCase()]
      : null,
  (key) => {
    // remove modifiers
    const [k] = key.split('.');

    return BOOLEAN_ATTRS.includes(k) || k.startsWith('toggle:')
      ? ['toggle', key.replace('toggle:', '')]
      : null;
  },
  (key) => key === ':key' && 'key',
  (key) => key === ':skip' && 'skip',
  (key) => key === ':text' && 'text',
  (key) => key === ':html' && 'html',
  (key) => key === ':children' && 'children',
  (key) => key === ':ref' && 'ref',
  (key) => key === ':show' && 'show',
  (key) => key === ':visible' && 'visible',
  (key) => key === ':diff' && 'diff',
];

// Reserved object keys
const objKeyDirectives = [
  (key) => key === 'textContent' && 'text',
  (key) => key === 'innerHTML' && 'html',
  (key) => key === 'html' && 'html',
  (key) => key === 'children' && 'children',
  (key) => key === '_key' && 'key',
  (key) => key === '_skip' && 'skip',
  (key) => key === '_ref' && 'ref',
  (key) => key === '_show' && 'show',
  (key) => key === '_visible' && 'visible',
  (key) => key === '_diff' && 'diff',
];

export const getAttrDirectives = () => [...attrNameDirectives];

export const getKeyDirectives = () => [...objKeyDirectives];
