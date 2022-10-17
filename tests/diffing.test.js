import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import { html, render, createHook } from '../src';
import { getChildren } from '../src/utils/dom';
import { getKey } from '../src/utils/meta';

const getIds = (list) => list.map((item) => item.id).join();

const getText = (list) => list.map((item) => item.text).join();

const getKeys = (parent) => getChildren(parent).map(getKey).join();

const getContent = (parent) =>
  getChildren(parent)
    .map((child) => child.textContent.trim())
    .join();

const ListItem = (data, props = {}) => html`
  <li :key="${data.id}" ${props}>${data.text}</li>
`;

// TODO: Add more test cases that involves texts
describe('diffing', () => {
  const onDestroy = jest.fn();
  const onMount = jest.fn();
  const onUnmount = jest.fn();

  const defaultData = [
    { id: '1', text: 'eat' },
    { id: '2', text: 'shower' },
    { id: '3', text: 'sleep' },
  ];

  beforeEach(() => {
    // to make sure mocks are cleared before each test
    // since mutation observer batches changes
    // and might trigger lifecycle even if the test was finished
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('reflect changes in order', (done) => {
    const hook = createHook({ list: defaultData });
    render(
      html`<ul data-testid="shuffled">
        ${hook.$list.map((data) => ListItem(data))}
      </ul>`,
      'body'
    );

    hook.list = [
      { id: '2', text: 'shower' },
      { id: '1', text: 'eat' },
      { id: '3', text: 'sleep' },
    ];

    setTimeout(() => {
      try {
        expect(getKeys(screen.getByTestId('shuffled'))).toBe(getIds(hook.list));
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('adds/removes items', (done) => {
    const hook = createHook({ list: defaultData });
    render(
      html`<ul data-testid="added">
        ${hook.$list.map((data) => ListItem(data))}
      </ul>`,
      'body'
    );

    hook.list = [
      { id: '4', text: 'exercise' },
      { id: '2', text: 'shower' },
      { id: '3', text: 'sleep' },
      { id: '5', text: 'read' },
    ];

    setTimeout(() => {
      try {
        expect(getKeys(screen.getByTestId('added'))).toBe(getIds(hook.list));
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('only updates what was changed', (done) => {
    const hook = createHook({ list: defaultData });
    render(
      html`<div data-testid="update">
        ${hook.$list.map((data) =>
          ListItem(data, { onDestroy, onMount, onUnmount })
        )}
      </div>`,
      'body'
    );

    hook.list = [
      { id: '2', text: 'shower' },
      { id: '4', text: 'exercise' },
      { id: '1', text: 'eating' },
    ];

    setTimeout(() => {
      try {
        expect(onDestroy).toBeCalledTimes(1);
        expect(onMount).toBeCalledTimes(5); // 3 (first mount) + 2 (move)
        expect(onUnmount).toBeCalledTimes(2);
        expect(getKeys(screen.getByTestId('update'))).toBe(getIds(hook.list));
        expect(getContent(screen.getByTestId('update'))).toBe(
          getText(hook.list)
        );
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('updates non-keyed nodes', (done) => {
    const hook = createHook({ list: defaultData });
    render(
      html`<ul data-testid="shuffled">
        ${hook.$list.map((data) => html`<li>${data.text}</li>`)}
      </ul>`,
      'body'
    );

    hook.list = [{ text: 'shower' }, { text: 'eat' }, { text: 'sleep' }];

    setTimeout(() => {
      try {
        expect(getContent(screen.getByTestId('shuffled'))).toBe(
          getText(hook.list)
        );
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('applied recursively', (done) => {
    const tags = new Array(3).fill().map((_, i) => `Tag ${i + 1}`);
    const hook = createHook({ list: [{ id: '1', text: 'eat', tags }] });

    const content = (data) => html`
      <ul data-testid="nested-list">
        ${data.tags.map(
          (item) =>
            html`<li :key="${item}" onMount=${onMount} onUnmount=${onUnmount}>
              ${item}
            </li>`
        )}
      </ul>
      <p>${data.text}</p>
    `;

    render(
      html`<ul>
        ${hook.$list.map((data) =>
          ListItem(data, {
            onMount,
            onUnmount,
            children: content(data),
          })
        )}
      </ul>`,
      'body'
    );

    setTimeout(() => {
      hook.list = [{ id: '1', text: 'eating', tags: tags.slice(1) }];
    });

    setTimeout(() => {
      try {
        expect(getContent(screen.getByTestId('nested-list'))).toBe(
          hook.list[0].tags.join()
        );
        expect(onMount).toBeCalledTimes(4);
        expect(onUnmount).toBeCalledTimes(1);
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('restore focus to previous active element', () => {
    const hook = createHook({ list: defaultData });
    render(
      html`<div data-testid="focus">
        ${hook.$list.map(
          (data) =>
            html`<button id=${data.id} :key=${data.id}>${data.text}</button>`
        )}
      </div>`,
      'body'
    );

    document.getElementById('2').focus();
    const previousActiveElement = document.activeElement;

    hook.list = [
      { id: '2', text: 'showering' },
      { id: '1', text: 'eat' },
      { id: '3', text: 'sleep' },
    ];

    expect(previousActiveElement).toHaveFocus();
  });

  it(':key - value can be other attribute using $attr syntax', () => {
    const hook = createHook({ list: defaultData });
    render(
      html`<ul data-testid="keystring">
        ${hook.$list.map(
          (data) => html` <li :key="$id" id=${data.id}>${data.text}</li> `
        )}
      </ul>`,
      'body'
    );

    hook.list = [...defaultData].reverse();

    expect(getKeys(screen.getByTestId('keystring'))).toBe(getIds(hook.list));
  });

  it(':skip="attrName" - does not update ignored attributes', () => {
    const hook = createHook(1);
    const child = (_, i) => {
      const current = createHook(Math.random());

      return html`
        <div
          :key="${i}"
          :skip="data-id"
          data-id="${current.value}"
          data-testid="test-child-${i}"
        >
          ${current.$value}
        </div>
      `;
    };
    const component = html`
      <div>${hook.$value((n) => new Array(n).fill().map(child))}</div>
    `;
    render(component, 'body');

    const el = screen.getByTestId('test-child-0');
    const proxyId = el.dataset.proxyid;
    const dataId = el.dataset.id;

    hook.value = 2;

    expect(el.getAttribute('data-proxyid')).toBe(proxyId);
    expect(el.getAttribute('data-id')).toBe(dataId);
    expect(el.textContent).not.toBe(dataId);
  });

  it(':skip="attrName" - does not remove ignored attributes', () => {
    const hook = createHook(true);

    const child = (bool) => html`
      <p
        :key="test"
        :skip="data-state"
        data-testid="foo"
        toggle:data-state=${bool}
      >
        Test
      </p>
    `;
    const component = html`<div>${hook.$value(child)}</div>`;
    render(component, 'body');

    hook.value = false;

    expect(screen.getByTestId('foo')).toHaveAttribute('data-state');
  });

  it(':skip | :skip="all" - will skip update of the element', () => {
    const hook = createHook({ list: defaultData });
    render(
      html`<ul>
        ${hook.$list.map((data) =>
          ListItem(
            data,
            data.id === '1'
              ? {
                  _skip: 'all',
                  'data-testid': 'skip',
                  'data-num': Math.random(),
                }
              : {}
          )
        )}
      </ul>`,
      'body'
    );
    const rand = screen.getByTestId('skip').dataset.num;

    hook.list = [
      { id: '1', text: 'read' }, // eat --> read
      { id: '2', text: 'shower' },
      { id: '3', text: 'sleep' },
    ];

    expect(screen.getByTestId('skip')).toHaveTextContent('eat');
    expect(screen.getByTestId('skip')).toHaveAttribute('data-num', rand);
  });

  it('can be opt out of with `no-diff` attribute on parent', (done) => {
    const hook = createHook({ list: defaultData });
    render(
      html`<div no-diff data-testid="no-diff">
        ${hook.$list.map((data) =>
          ListItem(data, { onDestroy, onMount, onUnmount })
        )}
      </div>`,
      'body'
    );

    hook.list = [
      { id: '2', text: 'shower' },
      { id: '4', text: 'exercise' },
      { id: '1', text: 'eating' },
    ];

    setTimeout(() => {
      try {
        expect(onDestroy).toBeCalledTimes(3);
        expect(onMount).toBeCalledTimes(6);
        expect(onUnmount).toBeCalledTimes(3);
        expect(getKeys(screen.getByTestId('no-diff'))).toBe(
          hook.list.map((item) => item.id).join()
        );
        expect(getContent(screen.getByTestId('no-diff'))).toBe(
          hook.list.map((item) => item.text).join()
        );
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });
});
