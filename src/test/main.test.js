import { fireEvent, screen } from '@testing-library/dom';
import '@testing-library/jest-dom/extend-expect';
import PoorManJSX, { html, render } from '..';

/**
 * @jest-environment jsdom
 */

describe('html and render', () => {
  // eslint-disable-next-line one-var
  let root, mockClickCallback;
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

    fireEvent.click(screen.getByTestId('button'));
    fireEvent.click(screen.getByTestId('button'));

    expect(mockClickCallback).toBeCalledTimes(2);
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
    fireEvent.click(testEl);

    expect(testEl).toHaveAttribute('id', 'test');
    expect(testEl).toHaveClass('myclass');
    expect(testEl).toHaveStyle({
      height: props.height,
      width: props.width,
      border: props.border,
    });
    expect(testEl).toContainElement(screen.getByTestId('child'));
    expect(mockClickCallback).toBeCalled();
  });

  it('style works with optional style_ prefix', () => {
    const props = {
      style_height: '20px',
      style_width: '300px',
      border: '1px solid black',
    };
    const el = html`<div data-testid="style" ${props}></div>`;
    render(el, root);

    expect(screen.getByTestId('style')).toHaveStyle({
      height: props.style_height,
      width: props.style_width,
      border: props.border,
    });
  });

  it('custom attribute is not considered as style', () => {
    PoorManJSX.addCustomAttribute('color');

    const props = { color: 'yellow' };
    const el = html`<div data-testid="style" ${props}></div>`;
    render(el, root);

    expect(screen.getByTestId('style')).not.toHaveStyle({
      color: props.color,
    });
    expect(screen.getByTestId('style')).toHaveAttribute('color', 'yellow');
  });

  it('works with special prop children', () => {
    const child = (testid) => html`<strong data-testid="${testid}"
      >This is my child</strong
    >`;
    const parent1 = html`<div
      data-testid="with children"
      ${{ children: child('my child') }}
    >
      <p>This should be deleted</p>
    </div>`;
    root.append(render(parent1));

    const parent2 = html`<div
      data-testid="with array children"
      ${{
        children: [
          child('another child'),
          'This is a string',
          document.createElement('h2'),
        ],
      }}
    ></div>`;
    root.append(render(parent2));

    expect(screen.getByTestId('with children')).not.toContainHTML(
      '<p>This should be deleted</p>'
    );
    expect(screen.getByTestId('with children')).toContainElement(
      screen.getByTestId('my child')
    );
    expect(screen.getByTestId('with array children')).toContainElement(
      screen.getByTestId('another child')
    );
    expect(screen.getByTestId('with array children')).toContainHTML(
      '<h2></h2>'
    );
    expect(screen.getByTestId('with array children').innerHTML).toContain(
      'This is a string'
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

    fireEvent.click(screen.getByTestId('obj array'));

    expect(screen.getByTestId('obj array')).toHaveTextContent('Click me');
    expect(mockClickCallback).toBeCalled();
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

  it('accepts HTMLElement', () => {
    render(
      html`<div data-testid="htmlElement">
        ${document.createElement('div')}
      </div>`,
      root
    );

    expect(screen.getByTestId('htmlElement')).toContainHTML('<div></div>');
  });

  it('accepts Text Node', () => {
    render(
      html`<div data-testid="text node">
        ${document.createTextNode('This is my text')}
      </div>`,
      root
    );

    expect(screen.getByTestId('text node')).toHaveTextContent(
      'This is my text'
    );
  });

  it('accepts DocumentFragment', () => {
    const fragment = new DocumentFragment();
    fragment.append(document.createElement('div'));
    fragment.append(document.createElement('div'));

    render(html`<div data-testid="fragment">${fragment}</div>`, root);

    expect(screen.getByTestId('fragment')).toContainHTML(
      '<div></div><div></div>'
    );
  });

  describe('supports preprocessors', () => {
    const preprocessor1 = (str) => str.replace(/x-/g, 'data-');
    const preprocessor2 = (str) => {
      const text = str.match(/data-text="(\w+)"/)[1];

      return [
        str,
        [
          {
            type: 'prop',
            selector: '[data-text]',
            data: { name: 'textContent', value: text },
          },
        ],
      ];
    };
    const preprocessor3 = (str) => str.replace(/div/g, 'main');

    it('that returns a string', () => {
      PoorManJSX.addPreprocessor(preprocessor1);
      render(html`<div x-testid="preprocessed1"></div>`, root);

      expect(screen.getByTestId('preprocessed1')).toMatchSnapshot();
    });

    it('with extra handlers', () => {
      PoorManJSX.addPreprocessor(preprocessor2);

      render(
        html`<div data-text="test" data-testid="preprocessed2"></div>`,
        root
      );

      expect(screen.getByTestId('preprocessed2')).toMatchSnapshot();
    });

    it('supports multiple preprocessors', () => {
      PoorManJSX.addPreprocessor([preprocessor1, preprocessor3], preprocessor2);

      render(html`<div x-text="test" x-testid="preprocessed3"></div>`, root);

      expect(screen.getByTestId('preprocessed3')).toMatchSnapshot();
    });
  });
});
