import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import PoorManJSX, { apply, html, render } from '../src';

describe('preprocessor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('process template string before creation', () => {
    const preprocessor = jest.fn((str) => str.replace(/x-/g, 'data-'));

    PoorManJSX.plugins.addPreprocessor(preprocessor);
    render(html`<div x-testid="preprocessed"></div>`, 'body');

    expect(preprocessor).toBeCalledTimes(1);
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

  const runAssertions = () => {
    expect(screen.getByTestId('autosize')).not.toHaveAttribute(':autosize');
    expect(screen.getByTestId('autosize')).toHaveAttribute(
      'data-autosize',
      'true'
    );
  };

  afterEach(() => {
    PoorManJSX.plugins.removeDirective('autosize');
    document.body.innerHTML = '';
  });

  it('allow users to add their own directive', () => {
    const getType = (str) => (str === ':autosize' ? ['autosize'] : null);
    PoorManJSX.plugins.addDirective({ ...directive, getType });

    render(html`<div :autosize data-testid="autosize"></div>`, 'body');

    runAssertions();
  });

  it('allow different keys for attrName and objKey with array', () => {
    const getTypeFromAttr = (str) =>
      str === ':autosize' ? ['autosize'] : null;
    const getTypeFromKey = (str) => (str === 'autosize' ? ['autosize'] : null);

    PoorManJSX.plugins.addDirective({
      ...directive,
      getType: [getTypeFromAttr, getTypeFromKey],
    });

    render(html`<div data-testid="autosize"></div>`, 'body');
    apply(screen.getByTestId('autosize'), { autosize: true });

    runAssertions();
  });

  it('allow different keys for attrName and objKey with object', () => {
    const attrName = (str) => (str === ':autosize' ? ['autosize'] : null);
    const objKey = (str) => (str === 'autosize' ? ['autosize'] : null);

    PoorManJSX.plugins.addDirective({
      ...directive,
      getType: { attrName, objKey },
    });

    render(html`<div data-testid="autosize"></div>`, 'body');
    apply(screen.getByTestId('autosize'), { autosize: true });

    runAssertions();
  });

  it('uses strict equality if `getType` is not provided', () => {
    PoorManJSX.plugins.addDirective(directive);

    render(html`<div autosize data-testid="autosize"></div>`, 'body');

    runAssertions();
  });
});
