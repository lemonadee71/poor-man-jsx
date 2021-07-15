import { fireEvent, screen } from '@testing-library/dom';
import '@testing-library/jest-dom/extend-expect';
import { createState, html, render } from '..';

/**
 * @jest-environment jsdom
 */

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
    const [state, revoke] = createState(value);
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
    const [state] = createState({ test: 1 });

    expect(state.$test.ref).toBe(undefined);
    expect(() => {
      state.prop = 'test';
    }).toThrowError();
  });

  describe('primitive', () => {
    const state = {};
    beforeEach(setup('test', state));
    afterEach(teardown(state));

    it('works', () => {
      const input = html`
        ${createInput('state input', (e) => {
          mockCallback();
          state.state.value = e.target.value;
        })}
        <p data-testid="state text" ${{ $textContent: state.state.$value }}></p>
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
    const state = {};
    beforeEach(setup({ name: 'Shin', age: 0 }, state));
    afterEach(teardown(state));

    it('works', () => {
      const el = html`${createInput('name input', (e) => {
          state.state.name = e.target.value;
        })}
        <p data-testid="name text" ${{ $textContent: state.state.$name }}></p>
        <p
          data-testid="age text"
          ${{
            $textContent: state.state.$age((age) => {
              mockCallback();
              return `Your age is an ${age % 2 === 0 ? 'even' : 'odd'} number`;
            }),
          }}
        ></p> `;
      root.append(render(el));

      state.state.age = 21;
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
