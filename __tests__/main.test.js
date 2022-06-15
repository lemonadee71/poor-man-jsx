import '@testing-library/jest-dom/extend-expect';
import { fireEvent, screen } from '@testing-library/dom';
import PoorManJSX, { html, render } from '../src';

describe('html and render', () => {
  const mockCallback = jest.fn(() => true);

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    PoorManJSX.removeBeforeCreation();
    PoorManJSX.removeAfterCreation();
  });

  it('creates an element', () => {
    render(html`<div>Test</div>`, 'body');

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  describe('attaches event listeners', () => {
    it('without options', () => {
      render(html`<button onClick=${mockCallback}>Click</button>`, 'body');
      fireEvent.click(screen.getByText('Click'));

      expect(mockCallback).toBeCalledTimes(1);
    });

    it('with options', () => {
      render(html`<button onClick.once=${mockCallback}>Click</button>`, 'body');
      fireEvent.click(screen.getByText('Click'));
      fireEvent.click(screen.getByText('Click'));

      expect(mockCallback).toBeCalledTimes(1);
    });
  });

  describe('accepts', () => {
    it('Template', () => {
      const div = html`<div></div>`;
      render(html`<main data-testid="main">${div}</main>`, 'body');

      expect(screen.getByTestId('main')).toContainHTML('<div></div>');
    });

    it('HTMLElement', () => {
      render(
        html`<div data-testid="html">${document.createElement('div')}</div>`,
        'body'
      );

      expect(screen.getByTestId('html')).toContainHTML('<div></div>');
    });

    it('Text Node', () => {
      render(html`<div>${document.createTextNode('Text')}</div>`, 'body');

      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('DocumentFragment', () => {
      const fragment = new DocumentFragment();
      fragment.append(document.createElement('div'));
      fragment.append(document.createElement('div'));

      render(html`<div data-testid="fragment">${fragment}</div>`, 'body');

      expect(screen.getByTestId('fragment')).toContainHTML(
        '<div></div><div></div>'
      );
    });

    it('arrays', () => {
      render(
        html`
          <ul data-testid="list">
            ${new Array(3).fill('test').map((str) => html`<li>${str}</li>`)}
          </ul>
        `,
        'body'
      );

      expect(screen.getByTestId('list').children.length).toBe(3);
    });
  });

  it('process attributes prefixed with `style_`', () => {
    render(
      html`<div
        data-testid="style"
        style_display="none"
        style_color="blue"
      ></div>`,
      'body'
    );

    expect(screen.getByTestId('style')).toHaveStyle({
      color: 'blue',
      display: 'none',
    });
  });

  it('process props like textContent', () => {
    render(html`<div textContent="textContent"></div>`, 'body');

    expect(screen.getByText('textContent')).toBeInTheDocument();
  });

  it('process shortened attributes e.g. `html`, `text`', () => {
    render(html`<div text="text"></div>`, 'body');

    expect(screen.getByText('text')).toBeInTheDocument();
  });

  it('process objects with attribute-value pairs', () => {
    const props = {
      'data-testid': 'attr-object',
      class: 'my-class',
      onClick: mockCallback,
      innerHTML: '<p data-testid="child">Hello, World!</p>',
    };
    render(html`<div ${props}></div>`, 'body');
    fireEvent.click(screen.getByTestId('attr-object'));

    expect(mockCallback).toBeCalled();
    expect(screen.getByTestId('attr-object')).toHaveClass('my-class');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('style attributes needs to be prefixed with `style_` when used in objects', () => {
    const style = {
      style_height: '20px',
      style_width: '300px',
      border: '1px solid black',
    };
    render(html`<div data-testid="style-object" ${style}></div>`, 'body');

    expect(screen.getByTestId('style-object')).not.toHaveStyle({
      border: '1px solid black',
    });
    expect(screen.getByTestId('style-object')).toHaveStyle({
      height: style.style_height,
      width: style.style_width,
    });
  });

  it('process special prop `children`', () => {
    const items = new Array(3)
      .fill('test')
      .map((str) => html`<li>${str}</li>`)
      .map((item) => render(item));

    render(html`<ul data-testid="list" ${{ children: items }}></ul>`, 'body');

    expect(screen.getByTestId('list').children.length).toBe(3);
  });

  describe('multiple attr-value objects can be passed', () => {
    const attr = {
      'data-testid': 'multiple',
      id: 'test',
    };
    const child = html`<div data-testid="child"></div>`;

    it('directly', () => {
      render(html`<div ${attr} ${{ children: render(child) }}></div>`, 'body');

      expect(screen.getByTestId('multiple').id).toBe('test');
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('with an array', () => {
      render(html`<div ${[attr, { children: render(child) }]}></div>`, 'body');

      expect(screen.getByTestId('multiple').id).toBe('test');
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it("won't render strings as html if enclosed with `{%%}`", () => {
    const select = html`
      <select name="test">
        <option value="1st" data-testid="option-1">
          <!-- placeholder- This will render too -->
        </option>
        <option value="2nd" data-testid="option-2">
          {%
          <p>This won't render</p>
          %}
        </option>
        <option value="3rd" data-testid="option-3">
          <!-- I Should not be rendered -->
        </option>
      </select>
    `;
    render(select, 'body');

    expect(screen.getByTestId('option-1')).toHaveTextContent(
      'This will render too'
    );
    expect(screen.getByTestId('option-2')).toHaveTextContent(
      "<p>This won't render</p>"
    );
    expect(screen.getByTestId('option-3')).not.toHaveTextContent();
  });

  it('supports preprocessors', () => {
    const preprocessor = (str) => str.replace(/x-/g, 'data-');

    PoorManJSX.onBeforeCreation(preprocessor);
    render(html`<div x-testid="preprocessed"></div>`, 'body');

    expect(screen.getByTestId('preprocessed')).toBeInTheDocument();
  });

  it('supports postprocessors', () => {
    const postprocessor = (el) => {
      el.textContent = 'Hello, World!';
    };

    PoorManJSX.onAfterCreation(postprocessor);
    render(html`<div data-testid="postprocessed"></div>`, 'body');

    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });
});
