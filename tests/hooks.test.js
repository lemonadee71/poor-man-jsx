import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import { apply, html, render, createHook } from '../src';

describe('hook', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is sealed', () => {
    const state = createHook({ test: 1 });

    expect(() => {
      state.prop = 'test';
    }).toThrowError();
  });

  it('turns primitive to object', () => {
    const state = createHook('test');
    expect(state.value).toBe('test');
  });

  it('updates elements when watched value changed', () => {
    const state = createHook('');
    render(html`<div data-testid="foo" :text=${state.$value}></div>`, 'body');
    state.value = 'Hello, World!';

    expect(screen.getByTestId('foo')).toHaveTextContent('Hello, World!');
  });

  it('can be passed a callback', () => {
    const state = createHook('');
    const mockTrap = jest.fn((str) => str.split('').reverse().join(''));
    render(html`<div :text=${state.$value(mockTrap)}></div>`, 'body');
    state.value = 'test';

    expect(screen.getByText('tset')).toBeInTheDocument();
  });

  it('allows calling of method directly', () => {
    const state = createHook({ tags: [] });
    const onCreate = jest.fn();

    render(
      html`
        <ul data-testid="tags">
          ${state.$tags
            .reverse()
            .map((tag) => `tag: ${tag}`)
            .map((tag) => html`<li onCreate=${onCreate}>${tag}</li>`)}
        </ul>
      `,
      'body'
    );

    state.tags = ['bug', 'enhancement'];

    expect(onCreate).toBeCalledTimes(2);
    expect(screen.getByTestId('tags').children.length).toBe(2);
    expect(screen.getByTestId('tags')).toContainHTML(
      '<li>tag: enhancement</li><li>tag: bug</li>'
    );
  });

  it('can be added using `apply`', () => {
    const hook = createHook('test');
    const div = document.createElement('div');
    apply(div, { textContent: hook.$value });

    document.body.append(div);
    hook.value = 'another test';

    expect(div).toHaveTextContent('another test');
  });

  it('can be passed to body', () => {
    const state = createHook('world');
    render(html`<div data-testid="body">Hello, ${state.$value}!</div>`, 'body');

    state.value = 'Shin';

    expect(screen.getByTestId('body')).toHaveTextContent('Hello, Shin!');
  });

  it('multiple can be passed to body', () => {
    const name = createHook('Michael:');
    const greeting = createHook('Howdy');
    const subject = createHook('world');
    render(
      html`<div data-testid="multiple">
        ${name.$value} ${greeting.$value}, ${subject.$value}!
      </div>`,
      'body'
    );

    subject.value = 'Shin';
    greeting.value = 'Hello';
    name.value = html`<i>Pam:</i>`;

    expect(screen.getByTestId('multiple')).toHaveTextContent(
      'Pam: Hello, Shin!'
    );
  });

  it('can be passed as an attribute value', () => {
    const classes = createHook({ foo: false, bar: true });
    render(
      html`<div
        data-testid="class"
        class="myclass"
        class:bar=${classes.$bar}
        class:foo=${classes.$foo}
      ></div>`,
      'body'
    );
    classes.bar = false;
    classes.foo = true;

    expect(screen.getByTestId('class')).toHaveClass('myclass', 'foo');
    expect(screen.getByTestId('class')).not.toHaveClass('bar');
  });

  it('can only be passed as sole value for attributes', () => {
    const state = createHook({ classes: 'bar' });
    render(
      html`<div data-testid="sole-class" class="foo ${state.$classes}"></div>`,
      'body'
    );

    expect(screen.getByTestId('sole-class')).not.toHaveClass('foo');
    expect(screen.getByTestId('sole-class')).toHaveClass('bar');
  });
});
