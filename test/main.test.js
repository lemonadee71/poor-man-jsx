import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { html, render } from '..';

/**
 * @jest-environment jsdom
 */

describe('html and render', () => {
  let root;
  let mockClickCallback;
  beforeEach(() => {
    mockClickCallback = jest.fn(() => 'I am clicked');
    root = document.createElement('div');
    document.body.append(root);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an element', () => {
    const div = html`<div data-testid="render">
      This element should render
    </div>`;
    root.append(render(div));

    expect(screen.getByTestId('render')).toBeInTheDocument();
    expect(screen.getByTestId('render')).toHaveTextContent(
      'This element should render'
    );
  });

  it('attaches event listeners', () => {
    const button = html`<button
      data-testid="button"
      ${{ onClick: mockClickCallback }}
    >
      Click me
    </button>`;
    root.append(render(button));

    userEvent.click(screen.getByTestId('button'));
    userEvent.click(screen.getByTestId('button'));

    expect(mockClickCallback.mock.calls.length).toBe(2);
    expect(mockClickCallback.mock.results[0].value).toBe('I am clicked');
  });

  it('attaches props and attr', () => {
    const props = {
      class: 'myclass',
      id: 'test',
      height: '20px',
      width: '300px',
      border: '1px solid black',
      innerHTML: '<p data-testid="child">Hello</p>',
      onClick: mockClickCallback,
    };
    const el = html`<div data-testid="props and attr" ${props}></div>`;
    root.append(render(el));

    const testEl = screen.getByTestId('props and attr');
    userEvent.click(testEl);

    expect(testEl).toHaveAttribute('id', 'test');
    expect(testEl).toHaveClass('myclass');
    expect(testEl).toHaveStyle({
      height: props.height,
      width: props.width,
      border: props.border,
    });
    expect(testEl).toContainElement(screen.getByTestId('child'));
    expect(mockClickCallback.mock.calls.length).toBe(1);
  });

  it('works with special prop children', () => {
    const child = html`<strong data-testid="my child"
      >This is my child</strong
    >`;
    const parent = html`<div
      data-testid="with children"
      ${{ children: child }}
    ></div>`;
    root.append(render(parent));

    expect(screen.getByTestId('with children')).toContainElement(
      screen.getByTestId('my child')
    );
  });

  it('works with arrays', () => {
    const list = html`<ul data-testid="list">
      ${new Array(3).fill('test').map((str) => html`<li>${str}</li>`)}
    </ul>`;
    root.append(render(list));

    expect(screen.getByTestId('list').children.length).toBe(3);
  });

  it('works with arrays of objects of props and attr', () => {
    const props = [
      {
        textContent: 'Click me',
      },
      {
        onClick: mockClickCallback,
      },
    ];
    const button = html`<button data-testid="obj array" ${props}></button>`;
    root.append(render(button));

    userEvent.click(screen.getByTestId('obj array'));

    expect(screen.getByTestId('obj array')).toHaveTextContent('Click me');
    expect(mockClickCallback.mock.calls.length).toBe(1);
  });

  it('batches multiple objects', () => {
    const header = html`<h1
      data-testid="multiple obj"
      ${{
        height: '30px',
        borderRadius: '15px',
      }}
      ${{
        border: '1px solid red',
        textContent: 'This is my header',
      }}
    ></h1>`;
    root.append(render(header));

    const testEl = screen.getByTestId('multiple obj');

    expect(testEl).toHaveTextContent('This is my header');
    expect(testEl).toHaveStyle({
      height: '30px',
      borderRadius: '15px',
      border: '1px solid red',
    });
  });

  it('should not render strings as html if enclosed with {%%}', () => {
    const select = html`
      <select name="test" data-testid="comments">
        <option value="1st" data-testid="comment1">
          <!-- placeholder- This will render too -->
        </option>
        <option value="2nd" data-testid="comment2">
          {%
          <p>This won't render</p>
          %}
        </option>
        <option value="3rd" data-testid="comment3">
          <!-- I Should not be rendered -->
        </option>
      </select>
    `;
    root.append(render(select));

    expect(screen.getByTestId('comment1')).toHaveTextContent(
      'This will render too'
    );
    expect(screen.getByTestId('comment2')).toHaveTextContent(
      "<p>This won't render</p>"
    );
    expect(screen.getByTestId('comment3')).not.toHaveTextContent();
  });
});
