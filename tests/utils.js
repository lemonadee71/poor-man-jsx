/* eslint-disable */
import { screen } from '@testing-library/dom';
import PoorManJSX, { render } from '../src';

export const defer = (fn, done) => {
  setTimeout(() => {
    try {
      fn();
      done?.();
    } catch (error) {
      done?.(error);
    }
  }, 0);
};

export const renderToBody = (template) => render(template, 'body');

export const getTarget = () => screen.getByTestId('target');

export const getById = (testid) => screen.getByTestId(testid);

const defaultTestId = (str) =>
  str.replace(/data-target/g, 'data-testid="target"');

export const setup = () => {
  PoorManJSX.onBeforeCreate([defaultTestId]);
};

export const teardown = () => {
  PoorManJSX.removeBeforeCreate(defaultTestId);
  document.body.innerHTML = '';
  jest.clearAllMocks();
};
