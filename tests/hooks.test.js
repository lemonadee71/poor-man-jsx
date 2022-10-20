import '@testing-library/jest-dom/extend-expect';
import { applyProps, html, createHook, watch, unwatch } from '../src';
import { setup, teardown, renderToBody as render, getTarget } from './utils';

beforeEach(setup);
afterEach(teardown);

describe('createHook', () => {
  it('returned Proxy is sealed', () => {
    expect(() => {
      const state = createHook({ test: 1 });
      state.prop = 'test';
    }).toThrowError();
  });

  it('turns primitive argument to object', () => {
    const state = createHook('test');
    expect(state.value).toBe('test');
  });

  it('does not proxify an array', () => {
    const state = createHook([1, 2, 3]);
    expect(state.value.join()).toBe('1,2,3');
  });
});

describe('hook', () => {
  it('updates `hooked` elements when watched value changed', () => {
    const state = createHook('');
    render(html`<div data-target :text=${state.$value}></div>`);
    state.value = 'Hello, World!';

    expect(getTarget()).toHaveTextContent('Hello, World!');
  });

  it('can be passed a callback', () => {
    const state = createHook('');
    const reverse = jest.fn((str) => str.split('').reverse().join(''));
    render(html`<div data-target :text=${state.$value(reverse)}></div>`);
    state.value = 'test';

    expect(getTarget()).toHaveTextContent('tset');
  });

  it('allows calling of method directly', () => {
    const state = createHook({ tags: [] });

    render(
      html`
        <ul data-target>
          ${state.$tags
            .reverse()
            .map((tag) => `tag: ${tag}`)
            .map((tag) => html`<li>${tag}</li>`)}
        </ul>
      `
    );

    state.tags = ['bug', 'enhancement'];

    expect(getTarget().childElementCount).toBe(2);
    expect(getTarget()).toContainHTML(
      '<li>tag: enhancement</li><li>tag: bug</li>'
    );
  });

  it("can be `hooked` to an element's attr/prop using `applyProps`", () => {
    const hook = createHook('test');
    const div = document.createElement('div');
    applyProps(div, { textContent: hook.$value });

    document.body.append(div);
    hook.value = 'another test';

    expect(div).toHaveTextContent('another test');
  });

  it("can be passed to a template's body directly", () => {
    const state = createHook('world');
    render(html`<div data-target>Hello, ${state.$value}!</div>`);

    state.value = 'Shin';

    expect(getTarget()).toHaveTextContent('Hello, Shin!');
  });

  it("multiple hooks can be passed to a template's body ", () => {
    const name = createHook('Michael:');
    const greeting = createHook('Howdy');
    const subject = createHook('world');

    render(
      html`<div data-target>
        ${name.$value} ${greeting.$value}, ${subject.$value}!
      </div>`
    );

    subject.value = 'Shin';
    greeting.value = 'Hello';
    name.value = html`<i>Pam:</i>`;

    expect(getTarget()).toHaveTextContent('Pam: Hello, Shin!');
  });

  it('can be passed as an attribute value', () => {
    const classes = createHook({ foo: false, bar: true });
    render(
      html`<div
        data-target
        class="myclass"
        class:bar=${classes.$bar}
        class:foo=${classes.$foo}
      ></div>`
    );
    classes.bar = false;
    classes.foo = true;

    expect(getTarget()).toHaveClass('myclass', 'foo');
    expect(getTarget()).not.toHaveClass('bar');
  });

  it('can only be passed as sole value for attributes', () => {
    const state = createHook({ classes: 'bar' });
    render(html`<div data-target class="foo ${state.$classes}"></div>`);

    expect(getTarget()).not.toHaveClass('foo');
    expect(getTarget()).toHaveClass('bar');
  });
});

describe('observers', () => {
  it('can observe hook changes with `watch`', () => {
    const mock = jest.fn();
    const count = createHook(1);
    watch(count.$value, mock);

    count.value = 5;

    expect(mock).toBeCalledTimes(1);
    expect(mock).toBeCalledWith(5);
  });

  it('can be removed with `unwatch`', () => {
    const mock = jest.fn();
    const count = createHook(1);

    watch(count.$value, mock);
    count.value = 5;
    unwatch(count.$value, mock);
    count.value = 10;

    expect(mock).toBeCalledTimes(1);
    expect(mock).toBeCalledWith(5);
  });

  it('can be removed with unsubscribe function returned by `watch`', () => {
    const mock = jest.fn();
    const count = createHook(1);

    const cleanup = watch(count.$value, mock);
    count.value = 5;
    cleanup();
    count.value = 10;

    expect(mock).toBeCalledTimes(1);
    expect(mock).toBeCalledWith(5);
  });
});
