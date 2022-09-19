import '@testing-library/jest-dom/extend-expect';
import { html, render } from '../src';

/**
 * Notes:
 * - With the exception of `create`, the rest needs to be tested asynchronously
 * - Due to the asynchronous nature of mutation observer, each test div has to be localized
 *   to avoid messing with other tests
 */

describe('lifecycle methods', () => {
  const onCreate = jest.fn((e) => e);
  const onDestroy = jest.fn((e) => e);
  const onMount = jest.fn((e) => e);
  const onUnmount = jest.fn((e) => e);

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('@create', () => {
    const div = html`<div onCreate=${onCreate}>Hello, World!</div>`;

    it('runs on element creation', () => {
      render(div);
      expect(onCreate).toHaveBeenCalledTimes(1);
    });

    it('runs only once', () => {
      const el = render(div);
      el.dispatchEvent(new Event('@create'));
      el.dispatchEvent(new Event('@create'));

      expect(onCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('@destroy', () => {
    const div = html`<div onDestroy=${onDestroy}>Hello, World!</div>`;

    it('runs when element is destroyed', (done) => {
      render(div, 'body').firstElementChild.remove();

      setTimeout(() => {
        try {
          expect(onDestroy).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('does not run when node is moved', (done) => {
      const el = render(div, 'body').firstElementChild;
      const extraEl = render(html`<div></div>`).firstElementChild;
      document.body.append(extraEl);
      extraEl.append(el);

      setTimeout(() => {
        try {
          expect(onDestroy).not.toHaveBeenCalled();
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });
  });

  describe('@mount', () => {
    const div = html`<div onMount=${onMount}>Hello, World!</div>`;

    it('runs on mount', (done) => {
      render(div, 'body');

      setTimeout(() => {
        try {
          expect(onMount).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('runs when node is moved', (done) => {
      const el = render(div, 'body').firstElementChild;
      render(html`<div id="test"></div>`, 'body');

      setTimeout(() => document.getElementById('test').append(el), 0);

      setTimeout(() => {
        try {
          expect(onMount).toHaveBeenCalledTimes(2);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });
  });

  describe('@unmount', () => {
    const div = html`<div onUnmount=${onUnmount}>Hello, World!</div>`;

    it('runs when element is destroyed', (done) => {
      render(div, 'body').firstElementChild.remove();

      setTimeout(() => {
        try {
          expect(onUnmount).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('runs when node is moved', (done) => {
      const el = render(div, 'body').firstElementChild;
      const extraEl = render(html`<div></div>`).firstElementChild;
      document.body.append(extraEl);
      extraEl.append(el);

      setTimeout(() => {
        try {
          expect(onUnmount).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });
  });

  it('run recursively', () => {
    render(html`<div><div onCreate=${onCreate}>Hello, World!</div></div>`);

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('pass the element as e.target to the callback', () => {
    const fragment = render(
      html`<div onCreate=${onCreate}>Hello, World!</div>`
    );

    expect(onCreate.mock.results[0].value.target).toBe(
      fragment.firstElementChild
    );
  });

  it('can have multiple callbacks for a type', (done) => {
    const mock = jest.fn();
    const div = html`<div onDestroy=${[onDestroy, mock]}>Hello, World!</div>`;

    render(div, 'body');
    document.body.innerHTML = '';

    setTimeout(() => {
      try {
        expect(mock).toHaveBeenCalledTimes(1);
        expect(onDestroy).toHaveBeenCalledTimes(1);
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });
});
