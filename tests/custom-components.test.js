import '@testing-library/jest-dom/extend-expect';
import { fireEvent, screen } from '@testing-library/dom';
import PoorManJSX, { html, render } from '../src';

describe('custom components', () => {
  const mockCallback = jest.fn(() => true);

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('define - registers a custom component', () => {
    PoorManJSX.customComponents.define(
      'HelloWorld',
      () => html`<div data-testid="custom"><p>Hello, World!</p></div>`
    );
    render(html`<HelloWorld />`, 'body');

    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.getByTestId('custom')).toHaveTextContent('Hello, World!');
  });

  it('define - only accepts valid html tag', () => {
    expect(() => {
      PoorManJSX.customComponents.define('custom item', () => {});
    }).toThrowError();
  });

  it('define - component function must return a Template or Element', () => {
    PoorManJSX.customComponents.define('HelloWorld', () => 'Hello, World!');

    expect(() => {
      render(html`<HelloWorld />`, 'body');
    }).toThrowError();
  });

  it('remove - removes a custom component', () => {
    PoorManJSX.customComponents.define(
      'hello-world',
      () => html`<p>Hello, World!</p>`
    );
    PoorManJSX.customComponents.remove('hello-world');
    render(html`<hello-world />`, 'body');

    expect(document.body.querySelector('hello-world')).toBeInTheDocument();
  });

  it('all attributes in custom component is passed as props', () => {
    let data;
    PoorManJSX.customComponents.define('Task', ({ props }) => {
      data = props;
      return html`<div data-testid=${props.id}>This is a task</div>`;
    });

    render(
      html`<Task id="task" due="2022-01-01" notes="This is an example task" />`,
      'body'
    );

    expect(data).toStrictEqual({
      id: 'task',
      due: '2022-01-01',
      notes: 'This is an example task',
    });
  });

  it('object/array passed inside the opening tags are treated as props', () => {
    PoorManJSX.customComponents.define(
      'Foo',
      ({ props }) => html`<div data-testid="foo" ${{ ...props }}>Test</div>`
    );

    render(
      html`<Foo ${{ onClick: mockCallback, 'data-div': true }} />`,
      'body'
    );
    fireEvent.click(screen.getByTestId('foo'));

    expect(screen.getByTestId('foo')).toHaveAttribute('data-div');
    expect(mockCallback).toBeCalledTimes(1);
  });

  it('all attributes names (kebab and snake case) are converted to camelCase', () => {
    let data;
    PoorManJSX.customComponents.define('Task', ({ props }) => {
      data = props;
      return html`<div>This is a task</div>`;
    });

    render(
      html`<Task is-completed="false" on_complete=${mockCallback} />`,
      'body'
    );

    expect(data).toStrictEqual({
      isCompleted: false,
      onComplete: mockCallback,
    });
  });

  it('all attribute values are converted to primitives', () => {
    let data;
    const date = new Date();

    PoorManJSX.customComponents.define('Task', ({ props }) => {
      data = props;
      return html`<div data-testid=${props.id}>This is a task</div>`;
    });

    render(html`<Task id=${1} is-completed=${false} due=${date} />`, 'body');

    expect(data).toStrictEqual({
      id: 1,
      isCompleted: false,
      due: date,
    });
  });

  it('anything passed between tags is passed as children', () => {
    PoorManJSX.customComponents.define(
      'PlaceholderText',
      ({ children }) => html`<p data-testid="placeholder">${children}</p>`
    );

    render(
      html`<PlaceholderText><span>Pam: </span>Hello, World!</PlaceholderText>`,
      'body'
    );

    expect(screen.getByTestId('placeholder')).toContainHTML(
      '<span>Pam: </span>Hello, World!'
    );
  });

  it('elements with :slot attribute can be accessed through children[slot]', () => {
    let data;
    PoorManJSX.customComponents.define('Router', ({ children }) => {
      data = {
        home: children.home,
        about: children.about,
      };

      return html`<div>${children}</div>`;
    });

    render(
      html`<Router>
        <div>Test</div>
        <div :slot="home" data-testid="home">Home</div>
        <div :slot="about" data-testid="about">About</div>
      </Router>`,
      'body'
    );

    expect(data).toStrictEqual({
      home: screen.getByTestId('home'),
      about: screen.getByTestId('about'),
    });
  });
});
