import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import PoorManJSX, { applyProps, html, render } from '../src';

describe('runBeforeCreate', () => {
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
});

describe('addDirective', () => {
  const directive = {
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
    applyProps(screen.getByTestId('autosize1'), { autosize: true });

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
    applyProps(screen.getByTestId('autosize1'), { autosize: true });

    runAssertions(1);
    runAssertions(2);
  });

  it('uses strict equality if `predicate` is not provided', () => {
    PoorManJSX.addDirective(directive);

    render(html`<div autosize data-testid="autosize"></div>`, 'body');

    runAssertions();
  });
});
