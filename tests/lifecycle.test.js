import '@testing-library/jest-dom/extend-expect';
import { html, render } from '../src';
import { defer, setup, teardown } from './utils';

/**
 * Notes:
 * - With the exception of `create`, the rest needs to be tested asynchronously
 * - Due to the asynchronous nature of mutation observer, each test div has to be localized
 *   to avoid messing with other tests
 */

describe('lifecycle methods', () => {
  const onCreate = jest.fn((e) => e);
  const onDestroy = jest.fn((e) => e);
  const onLoad = jest.fn((e) => e);
  const onMount = jest.fn((e) => e);
  const onUnmount = jest.fn((e) => e);

  beforeEach(setup);
  afterEach(teardown);

  describe('@create', () => {
    const div = html`<div onCreate=${onCreate}>Hello, World!</div>`;

    it('runs on element creation', () => {
      render(div);
      expect(onCreate).toBeCalledTimes(1);
    });

    it('runs only once', () => {
      const el = render(div);
      el.dispatchEvent(new Event('@create'));
      el.dispatchEvent(new Event('@create'));

      expect(onCreate).toBeCalledTimes(1);
    });
  });

  describe('@destroy', () => {
    const div = html`<div onDestroy=${onDestroy}>Hello, World!</div>`;

    it('runs when element is destroyed', (done) => {
      render(div, 'body').firstElementChild.remove();
      defer(() => expect(onDestroy).toBeCalledTimes(1), done);
    });

    it('does not run when node is moved', (done) => {
      const el = render(div, 'body').firstElementChild;
      const extraEl = render(html`<div></div>`).firstElementChild;
      document.body.append(extraEl);
      extraEl.append(el);

      defer(() => expect(onDestroy).not.toBeCalled(), done);
    });
  });

  describe('@load', () => {
    const div = html`<div onLoad=${onLoad}>Hello, World!</div>`;

    it('runs on mount', (done) => {
      render(div, 'body');
      defer(() => expect(onLoad).toBeCalledTimes(1), done);
    });

    it('does not run when node is moved', (done) => {
      const el = render(div, 'body').firstElementChild;
      render(html`<div id="target"></div>`, 'body');

      defer(() => document.getElementById('target').append(el));
      defer(() => expect(onLoad).toBeCalledTimes(1), done);
    });
  });

  describe('@mount', () => {
    const div = html`<div onMount=${onMount}>Hello, World!</div>`;

    it('runs on mount', (done) => {
      render(div, 'body');
      defer(() => expect(onMount).toBeCalledTimes(1), done);
    });

    it('runs when node is moved', (done) => {
      const el = render(div, 'body').firstElementChild;
      render(html`<div id="target"></div>`, 'body');

      defer(() => document.getElementById('target').append(el));
      defer(() => expect(onMount).toBeCalledTimes(2), done);
    });
  });

  describe('@unmount', () => {
    const div = html`<div onUnmount=${onUnmount}>Hello, World!</div>`;

    it('runs when element is destroyed', (done) => {
      render(div, 'body').firstElementChild.remove();
      defer(() => expect(onUnmount).toBeCalledTimes(1), done);
    });

    it('runs when node is moved', (done) => {
      const el = render(div, 'body').firstElementChild;
      const extraEl = render(html`<div></div>`).firstElementChild;
      document.body.append(extraEl);
      extraEl.append(el);

      defer(() => expect(onUnmount).toBeCalledTimes(1), done);
    });
  });

  it('run recursively', () => {
    render(html`<div><div onCreate=${onCreate}>Hello, World!</div></div>`);

    expect(onCreate).toBeCalledTimes(1);
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

    defer(() => {
      expect(mock).toBeCalledTimes(1);
      expect(onDestroy).toBeCalledTimes(1);
    }, done);
  });
});
