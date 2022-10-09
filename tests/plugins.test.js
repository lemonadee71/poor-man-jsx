import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import PoorManJSX, { apply, html, render } from '../src';

describe('preprocessor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('process template string before creation', () => {
    const fn = jest.fn((str) => str.replace(/x-/g, 'data-'));

    PoorManJSX.onBeforeCreate(fn);
    render(html`<div x-testid="preprocessed"></div>`, 'body');

    expect(fn).toBeCalledTimes(1);
    expect(screen.getByTestId('preprocessed')).toBeInTheDocument();
  });

  it('interprets `<></>` as fragments', () => {
    const children = new Array(3)
      .fill()
      .map(() => document.createElement('div'));

    render(html`<>${children}</>`, 'body');

    expect(document.body.children.length).toBe(3);
  });
});

describe('addDirective', () => {
  const directive = {
    name: 'autosize',
    type: 'autosize',
    callback: (element, _, modify) => {
      modify(element, 'attr', { key: 'data-autosize', value: 'true' });
      element.removeAttribute(':autosize');
    },
  };
  const attrName = (str) => str === ':autosize';
  const objKey = (str) => str === 'autosize';

  const runAssertions = (id = '') => {
    expect(screen.getByTestId(`autosize${id}`)).not.toHaveAttribute(
      ':autosize'
    );
    expect(screen.getByTestId(`autosize${id}`)).toHaveAttribute(
      'data-autosize',
      'true'
    );
  };

  afterEach(() => {
    PoorManJSX.removeDirective('autosize');
    document.body.innerHTML = '';
  });

  it('allow users to add their own directive', () => {
    PoorManJSX.addDirective({
      ...directive,
      predicate: attrName,
    });

    render(html`<div :autosize data-testid="autosize"></div>`, 'body');

    runAssertions();
  });

  it('allow different keys for attrName and objKey with array', () => {
    PoorManJSX.addDirective({
      ...directive,
      predicate: [attrName, objKey],
    });

    render(
      html`<div data-testid="autosize1"></div>
        <div :autosize data-testid="autosize2"></div>`,
      'body'
    );
    apply(screen.getByTestId('autosize1'), { autosize: true });

    runAssertions(1);
    runAssertions(2);
  });

  it('allow different keys for attrName and objKey with object', () => {
    PoorManJSX.addDirective({
      ...directive,
      predicate: { attrName, objKey },
    });

    render(
      html`<div data-testid="autosize1"></div>
        <div :autosize data-testid="autosize2"></div>`,
      'body'
    );
    apply(screen.getByTestId('autosize1'), { autosize: true });

    runAssertions(1);
    runAssertions(2);
  });

  it('uses strict equality if `getType` is not provided', () => {
    PoorManJSX.addDirective(directive);

    render(html`<div autosize data-testid="autosize"></div>`, 'body');

    runAssertions();
  });
});
