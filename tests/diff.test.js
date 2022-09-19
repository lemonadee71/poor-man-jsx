import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import { createHook, html, render } from '../src';

const getKeys = (node) =>
  [...node.children]
    .map((child) => child.getAttribute(node.getAttribute('keystring') || 'key'))
    .join();

const getInnerText = (node) =>
  [...node.children].map((child) => child.textContent.trim()).join();

const ListItem = (data, props = {}) =>
  render(html`
    <li id="${data.id}" ${{ [props.keyString || 'key']: data.id, ...props }}>
      ${data.text}
    </li>
  `);

describe('diffing', () => {
  const onCreate = jest.fn();
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
    const [hook] = createHook({ list: defaultData });
    render(
      html`<ul
        is-list
        data-testid="shuffled"
        ${{
          children: hook.$list.map((data) =>
            ListItem(data, { onCreate, onDestroy, onMount, onUnmount })
          ),
        }}
      ></ul>`,
      'body'
    );

    setTimeout(() => {
      hook.list = [
        { id: '2', text: 'shower' },
        { id: '1', text: 'eat' },
        { id: '3', text: 'sleep' },
      ];
    });

    setTimeout(() => {
      try {
        expect(getKeys(screen.getByTestId('shuffled'))).toBe(
          hook.list.map((item) => item.id).join()
        );
        expect(onCreate).toBeCalledTimes(6);
        expect(onDestroy).not.toBeCalled();
        expect(onMount).toBeCalledTimes(4);
        expect(onUnmount).toBeCalledTimes(1);
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('adds new items', (done) => {
    const [hook] = createHook({ list: defaultData });
    render(
      html`<ul is-list data-testid="added">
        ${hook.$list.map((data) =>
          ListItem(data, { onCreate, onMount, onUnmount })
        )}
      </ul>`,
      'body'
    );

    setTimeout(() => {
      hook.list = [
        { id: '1', text: 'eat' },
        { id: '4', text: 'exercise' },
        { id: '2', text: 'shower' },
        { id: '3', text: 'sleep' },
        { id: '5', text: 'read' },
      ];
    });

    setTimeout(() => {
      try {
        expect(getKeys(screen.getByTestId('added'))).toBe(
          hook.list.map((item) => item.id).join()
        );
        expect(onCreate).toBeCalledTimes(8);
        expect(onMount).toBeCalledTimes(5);
        expect(onUnmount).not.toBeCalled();
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('only updates what was changed', () => {
    const [hook] = createHook({ list: defaultData });
    render(
      html`<div is-list data-testid="update">
        ${hook.$list.map((data) =>
          render(html`<p key="${data.id}">${data.text}</p>`)
        )}
      </div>`,
      'body'
    );

    hook.list = [
      { id: '1', text: 'eating' },
      { id: '2', text: 'shower' },
      { id: '3', text: 'sleep' },
    ];

    expect(getInnerText(screen.getByTestId('update'))).toBe(
      hook.list.map((item) => item.text).join()
    );
  });

  it('restore focus to previous active element', () => {
    const [hook] = createHook({ list: defaultData });
    render(
      html`<div is-list data-testid="focus">
        ${hook.$list.map((data) =>
          render(html`<button key="${data.id}">${data.text}</button>`)
        )}
      </div>`,
      'body'
    );

    document.querySelector('[key="2"]').focus();
    const previousActiveElement = document.activeElement;

    // for some reason focus is lost when item is moved upwards
    // so use this case for testing and for good measure, edit the text too
    hook.list = [
      { id: '2', text: 'showering' },
      { id: '1', text: 'eat' },
      { id: '3', text: 'sleep' },
    ];

    expect(document.activeElement).toEqual(previousActiveElement);
  });

  it('updates "non-text" elements if it has attribute `is-text`', () => {
    const [hook] = createHook({ list: defaultData });
    render(
      html`<ul is-list data-testid="is-text">
        ${hook.$list.map((data) => ListItem(data, { 'is-text': '' }))}
      </ul>`,
      'body'
    );

    hook.list = [
      { id: '1', text: 'eating' },
      { id: '2', text: 'shower' },
      { id: '3', text: 'sleep' },
    ];

    expect(getInnerText(screen.getByTestId('is-text'))).toBe(
      hook.list.map((item) => item.text).join()
    );
  });

  it('it is applied recursively', (done) => {
    const tags = new Array(3).fill().map((_, i) => `Tag ${i + 1}`);
    const [hook] = createHook({ list: [{ id: '1', text: 'eat', tags }] });
    const createContent = (data) =>
      render(html`
        <ul is-list data-testid="nested-list">
          ${(data.tags || []).map(
            (item) =>
              html`<li
                key="${item}"
                onCreate=${onCreate}
                onMount=${onMount}
                onUnmount=${onUnmount}
              >
                ${item}
              </li>`
          )}
        </ul>
        <p>${data.text}</p>
      `);

    render(
      html`<ul is-list>
        ${hook.$list.map((data) =>
          ListItem(data, {
            onCreate,
            onMount,
            onUnmount,
            children: createContent(data),
          })
        )}
      </ul>`,
      'body'
    );

    setTimeout(() => {
      hook.list = [{ id: '1', text: 'eat', tags: tags.slice(1) }];
    });

    setTimeout(() => {
      try {
        expect(getInnerText(screen.getByTestId('nested-list'))).toBe(
          hook.list[0].tags.join()
        );
        // called twice for ListItem; thrice on first tags render, twice on second
        expect(onCreate).toBeCalledTimes(7);
        expect(onMount).toBeCalledTimes(4);
        expect(onUnmount).toBeCalledTimes(1);
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('throws an error if a child has no key', () => {
    const [hook] = createHook({ list: defaultData });
    render(
      html`<ul is-list>
        ${hook.$list.map((data) => ListItem(data))}
      </ul>`,
      'body'
    );

    expect(() => {
      hook.list = [
        { id: '1', text: 'eat' },
        { id: '4', text: 'exercise' },
        { id: '', text: 'shower' },
      ];
    }).toThrow();
  });

  it('accepts other key string', () => {
    const [hook] = createHook({ list: defaultData });
    render(
      html`<ul is-list keystring="id" data-testid="keystring">
        ${hook.$list.map((data) => ListItem(data, { keyString: 'id' }))}
      </ul>`,
      'body'
    );

    hook.list = [...defaultData].reverse();

    expect(getKeys(screen.getByTestId('keystring'))).toBe(
      hook.list.map((item) => item.id).join()
    );
  });

  it('does not update ignored attributes', () => {
    const [hook] = createHook(1);
    const child = (i) => {
      const [current] = createHook(Math.random());

      return html`
        <div
          is-text
          key="${i}"
          ignore="data-id"
          data-id="${current.value}"
          data-testid="test-child-${i}"
        >
          ${current.$value}
        </div>
      `;
    };
    const component = html`
      <div is-list>
        ${hook.$value((n) =>
          new Array(n).fill().map((_, i) => render(child(i)))
        )}
      </div>
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

  it('does not remove ignored attributes', () => {
    const [hook] = createHook(true);

    const child = (bool) =>
      render(html`<i
        key="test"
        ignore="data-state"
        data-testid="foo"
        ${bool ? 'data-state="test"' : ''}
      ></i>`);
    const component = html`<div is-list>${hook.$value(child)}</div>`;
    render(component, 'body');

    const { state } = screen.getByTestId('foo').dataset;
    hook.value = false;

    expect(screen.getByTestId('foo')).toHaveAttribute('data-state');
    expect(screen.getByTestId('foo').dataset.state).toBe(state);
  });

  it('will skip update if child has attribute `ignore-all`', () => {
    const [hook] = createHook({ list: defaultData });
    render(
      html`<ul is-list>
        ${hook.$list.map((data) =>
          ListItem(
            data,
            data.id === '1'
              ? {
                  'is-text': '',
                  'ignore-all': '',
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
      { id: '1', text: 'read' },
      { id: '2', text: 'shower' },
      { id: '3', text: 'sleep' },
    ];

    expect(screen.getByTestId('skip')).toHaveTextContent('eat');
    expect(screen.getByTestId('skip')).toHaveAttribute('data-num', rand);
  });
});
