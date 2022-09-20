import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import PoorManJSX, { html, render } from '../src';

describe('preprocessor', () => {
  beforeEach(() => jest.clearAllMocks());

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('process template string before creation', () => {
    const preprocessor = jest.fn((str) => str.replace(/x-/g, 'data-'));

    PoorManJSX.plugins.addPreprocessor(preprocessor);
    render(html`<div x-testid="preprocessed"></div>`, 'body');

    expect(preprocessor).toBeCalledTimes(1);
    expect(screen.getByTestId('preprocessed')).toBeInTheDocument();
  });

  it('interprets `<></>` as fragments', () => {
    const children = new Array(3)
      .fill()
      .map(() => document.createElement('div'));

    render(html`<>${children}</>`, 'body');

    expect(document.body.children.length).toBe(3);
  });
});
