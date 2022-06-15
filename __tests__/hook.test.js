import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import { addHooks, createHook, html, render } from '../src';

describe('hook', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is sealed', () => {
    const [state] = createHook({ test: 1 });

    expect(() => {
      state.prop = 'test';
    }).toThrowError();
  });

  it('turns primitive to object', () => {
    const [state] = createHook('test');

    expect(state.value).toBe('test');
  });

  it('updates elements when watched value changed', () => {
    const [state] = createHook('');
    render(
      html`<div data-testid="foo" ${{ textContent: state.$value }}></div>`,
      'body'
    );
    state.value = 'Hello, World!';

    expect(screen.getByTestId('foo')).toHaveTextContent('Hello, World!');
  });

  it('can be passed a callback', () => {
    const [state] = createHook('');
    const mockTrap = jest.fn((str) => str.split('').reverse().join(''));
    render(
      html`<div ${{ textContent: state.$value(mockTrap) }}></div>`,
      'body'
    );
    state.value = 'test';

    expect(screen.getByText('tset')).toBeInTheDocument();
  });

  it('allows calling of method directly', () => {
    const [state] = createHook({ tags: '' });

    render(
      html`
        <ul
          data-testid="list"
          ${{
            children: state.$tags
              .split(' ')
              .map((tag) => `tag: ${tag}`)
              .map((tag) => render(html`<li>${tag}</li>`))
              .reverse(),
          }}
        ></ul>
      `,
      'body'
    );
    state.tags = ['bug', 'enhancement'].join(' ');

    expect(screen.getByTestId('list').children.length).toBe(2);
    expect(screen.getByTestId('list')).toContainHTML(
      '<li>tag: enhancement</li><li>tag: bug</li>'
    );
  });

  it('can be added using `addHooks`', () => {
    const [hook] = createHook('test');
    const div = document.createElement('div');
    addHooks(div, { textContent: hook.$value });

    document.body.append(div);
    hook.value = 'another test';

    expect(div).toHaveTextContent('another test');
  });

  describe('can be passed directly', () => {
    it('to body', () => {
      const [state] = createHook('world');
      render(
        html`<div data-testid="bar">Hello, ${state.$value}!</div>`,
        'body'
      );
      state.value = 'Shin';

      expect(screen.getByTestId('bar')).toHaveTextContent('Hello, Shin!');
    });

    it('as attribute value', () => {
      const [state] = createHook({ class: 'foo' });
      render(
        html`<div data-testid="test" class="myclass ${state.$class}"></div>`,
        'body'
      );
      state.class = 'bar';

      expect(screen.getByTestId('test')).toHaveClass('myclass', 'bar');
    });

    it('as value for special attributes', () => {
      const [state] = createHook({ child: [] });
      render(
        html`<div data-testid="parent" children=${state.$child}></div>`,
        'body'
      );
      state.child = render(html`<div data-testid="child"></div>`);

      expect(screen.getByTestId('parent').children.length).toBe(1);
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });
});
