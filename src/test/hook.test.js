import { fireEvent, screen } from '@testing-library/dom';
import '@testing-library/jest-dom/extend-expect';
import { addHooks, createHook, html, render, text } from '..';

/**
 * @jest-environment jsdom
 */

// TODO: Refactor this for v3.0.0
describe('state', () => {
  // eslint-disable-next-line one-var
  let root, mockCallback;
  beforeEach(() => {
    mockCallback = jest.fn(() => 'I am called');
    root = document.createElement('div');
    document.body.append(root);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const setup = (value, obj) => () => {
    const [state, revoke] = createHook(value);
    obj.state = state;
    obj.revoke = revoke;
  };

  const teardown = (obj) => () => {
    obj.revoke();
    obj.state = null;
    obj.revoke = null;
  };

  const createInput = (testid, callback) =>
    html`
      <input
        type="text"
        name="test"
        data-testid="${testid}"
        ${{
          onInput: callback,
        }}
      />
    `;

  it('is sealed', () => {
    const [state] = createHook({ test: 1 });

    expect(state.$test.ref).toBe(undefined);
    expect(() => {
      state.prop = 'test';
    }).toThrowError();
  });

  it('forwards first level methods', () => {
    const [state] = createHook({ tags: [] });
    const list = html`
      <ul
        data-testid="list"
        ${{
          $children: state.$tags.map((tag) => render(html`<li>${tag}</li>`)),
        }}
      ></ul>
      <p data-testid="paragraph" ${{ $textContent: state.$tags.join(' ') }}></p>
    `;
    render(list, 'body');
    state.tags = ['bug', 'enhancement'];

    expect(screen.getByTestId('list')).toContainHTML(
      '<li>bug</li><li>enhancement</li>'
    );
    expect(screen.getByTestId('paragraph')).toHaveTextContent(
      'bug enhancement'
    );
  });

  it('forwards method chains', () => {
    const [state] = createHook({ tags: [] });
    const list = html`
      <ul
        data-testid="list"
        ${{
          $children: state.$tags
            .filter((tag) => tag.length < 5)
            .map((tag) => `tag: ${tag}`)
            .map((tag) => render(html`<li>${tag}</li>`)),
        }}
      ></ul>
      <p
        data-testid="paragraph"
        ${{
          $textContent: state.$tags
            .reverse()
            .join(' ')
            .replace('enhancement', 'feature'),
        }}
      ></p>
    `;
    render(list, 'body');
    state.tags = ['bug', 'enhancement'];

    expect(screen.getByTestId('paragraph')).toHaveTextContent('feature bug');
    expect(screen.getByTestId('list')).toContainHTML('<li>tag: bug</li>');
  });

  describe('text tag works', () => {
    const [hook] = createHook({ date: new Date() });
    const date = html`<h1
      data-testid="date"
      ${{ $textContent: text`The time is ${hook.$date.toLocaleTimeString()}` }}
    ></h1>`;

    render(date, document.body);
    expect(screen.getByTestId('date')).toHaveTextContent(
      `The time is ${hook.date.toLocaleTimeString()}`
    );
  });

  describe('`addHooks` works', () => {
    const [hook] = createHook('Test');
    const div = document.createElement('div');
    addHooks(div, { textContent: hook.$value });

    document.body.append(div);
    hook.value = 'Another test';

    expect(div).toHaveTextContent('Another test');
  });

  describe('primitive', () => {
    const obj = {};
    beforeEach(setup('test', obj));
    afterEach(teardown(obj));

    it('works', () => {
      const input = html`
        ${createInput('state input', (e) => {
          mockCallback();
          obj.state.value = e.target.value;
        })}
        <p data-testid="state text" ${{ $textContent: obj.state.$value }}></p>
      `;
      root.append(render(input));

      fireEvent.input(screen.getByTestId('state input'), {
        target: { value: 'Hello, World!' },
      });

      expect(screen.getByTestId('state text')).toHaveAttribute('data-proxyid');
      expect(screen.getByTestId('state input')).toHaveValue('Hello, World!');
      expect(mockCallback).toHaveBeenCalled();
      expect(screen.getByTestId('state text')).toHaveTextContent(
        'Hello, World!'
      );
    });
  });

  describe('object', () => {
    const obj = {};
    beforeEach(setup({ name: 'Shin', age: 0 }, obj));
    afterEach(teardown(obj));

    it('works', () => {
      const el = html`${createInput('name input', (e) => {
          obj.state.name = e.target.value;
        })}
        <p data-testid="name text" ${{ $textContent: obj.state.$name }}></p>
        <p
          data-testid="age text"
          ${{
            $textContent: obj.state.$age((age) => {
              mockCallback();
              return `Your age is an ${age % 2 === 0 ? 'even' : 'odd'} number`;
            }),
          }}
        ></p> `;
      root.append(render(el));

      obj.state.age = 21;
      fireEvent.input(screen.getByTestId('name input'), {
        target: { value: 'Andrei' },
      });

      expect(mockCallback).toHaveBeenCalled();
      expect(screen.getByTestId('age text')).toHaveTextContent(
        'Your age is an odd number'
      );
      expect(screen.getByTestId('name text')).toHaveTextContent('Andrei');
    });
  });
});
