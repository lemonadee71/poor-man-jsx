import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import PoorManJSX, { createHook, html, render } from '../src';

describe('processors', () => {
  beforeEach(() => jest.clearAllMocks());

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    PoorManJSX.removeBeforeCreation();
    PoorManJSX.removeAfterCreation();
  });

  it('onBeforeCreation processes string', () => {
    const preprocessor = jest.fn((str) => str.replace(/x-/g, 'data-'));

    PoorManJSX.onBeforeCreation(preprocessor);
    render(html`<div x-testid="preprocessed"></div>`, 'body');

    expect(preprocessor).toBeCalledTimes(1);
    expect(screen.getByTestId('preprocessed')).toBeInTheDocument();
  });

  it('onAfterCreation processes elements', () => {
    const postprocessor = jest.fn((el) => {
      el.textContent = 'Hello, World!';
    });

    PoorManJSX.onAfterCreation(postprocessor);
    render(html`<div data-testid="postprocessed"></div>`, 'body');

    expect(postprocessor).toBeCalledTimes(1);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  describe('runs once per render only', () => {
    const [state] = createHook({ nums: [1, 2, 3] });
    const List = (keyString = 'key') => html`
      <ul is-list>
        ${state.$nums
          .map((n) => html`<li ${keyString}=${n}>${n}</li>`)
          .map((item) => render(item))}
      </ul>
    `;

    it('onBeforeCreation', () => {
      const onBeforeCreation = jest.fn((str) => str.replace('data-', ''));

      PoorManJSX.onBeforeCreation(onBeforeCreation);
      render(List('data-key'), 'body');

      state.nums = [3, 2, 1];

      expect(onBeforeCreation).toBeCalledTimes(7);
      expect(document.querySelectorAll('[key]').length).toBe(3);
    });

    it('onAfterCreation', () => {
      const onAfterCreation = jest.fn();

      PoorManJSX.onAfterCreation(onAfterCreation);
      render(List(), 'body');

      const ul = document.body.firstElementChild;
      const firstChildren = [...ul.children].map((item) =>
        item.cloneNode(true)
      );
      state.nums = [3, 2, 1];

      // called from inside to outside
      const elements = [...firstChildren, ul, ...ul.children];

      expect(onAfterCreation).toBeCalledTimes(7);
      expect(onAfterCreation.mock.calls.flat()).toEqual(elements);
    });
  });
});
