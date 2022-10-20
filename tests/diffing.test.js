import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import { html, createHook } from '../src';
import { getChildren } from '../src/utils/dom';
import { getKey } from '../src/utils/meta';
import {
  defer,
  getTarget as target,
  renderToBody as render,
  setup,
  teardown,
} from './utils';

const getIds = (list) => list.map((item) => item.id).join();

const getText = (list) => list.map((item) => item.text).join();

const getKeys = (parent) => getChildren(parent).map(getKey).join();

const getContent = (parent) =>
  getChildren(parent)
    .map((child) => child.textContent.trim())
    .join();

const ListItem = (data, props = {}) => html`
  <li :key="${data.id}" data-testid="${data.id}" ${props}>${data.text}</li>
`;

const List = (children) => html`
  <ul :diff data-target>
    ${children}
  </ul>
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

  beforeEach(setup);
  afterEach(teardown);

  it('is not the default behavior', (done) => {
    const hook = createHook({ list: defaultData });
    render(
      html`<ul data-target>
        ${hook.$list.map((data) =>
          ListItem(data, { onDestroy, onMount, onUnmount })
        )}
      </ul>`
    );

    hook.list = [
      { id: '2', text: 'shower' },
      { id: '4', text: 'exercise' },
      { id: '1', text: 'eating' },
    ];

    defer(() => {
      expect(onDestroy).toBeCalledTimes(3);
      expect(onMount).toBeCalledTimes(6);
      expect(onUnmount).toBeCalledTimes(3);
      expect(getKeys(target())).toBe(getIds(hook.list));
      expect(getContent(target())).toBe(getText(hook.list));
    }, done);
  });

  it('reflect changes in order', () => {
    const hook = createHook({ list: defaultData });
    render(List(hook.$list.map((data) => ListItem(data))));

    hook.list = [
      { id: '2', text: 'shower' },
      { id: '1', text: 'eat' },
      { id: '3', text: 'sleep' },
    ];

    expect(getKeys(target())).toBe(getIds(hook.list));
  });

  it('adds/removes items', () => {
    const hook = createHook({ list: defaultData });
    render(List(hook.$list.map((data) => ListItem(data))));

    hook.list = [
      { id: '4', text: 'exercise' },
      { id: '2', text: 'shower' },
      { id: '3', text: 'sleep' },
      { id: '5', text: 'read' },
    ];

    expect(getKeys(target())).toBe(getIds(hook.list));
  });

  it('only updates what was changed', (done) => {
    const hook = createHook({ list: defaultData });
    render(
      List(
        hook.$list.map((data) =>
          ListItem(data, { onDestroy, onMount, onUnmount })
        )
      )
    );

    hook.list = [
      { id: '2', text: 'shower' },
      { id: '4', text: 'exercise' },
      { id: '1', text: 'eating' },
    ];

    defer(() => {
      expect(onDestroy).toBeCalledTimes(1);
      expect(onMount).toBeCalledTimes(5); // 3 (first mount) + 2 (move)
      expect(onUnmount).toBeCalledTimes(2);
      expect(getKeys(target())).toBe(getIds(hook.list));
      expect(getContent(target())).toBe(getText(hook.list));
    }, done);
  });

  it('updates non-keyed nodes', () => {
    const hook = createHook({ list: defaultData });
    render(
      html`<ul :diff data-target>
        ${hook.$list.map((data) => html`<li>${data.text}</li>`)}
      </ul>`
    );

    hook.list = [{ text: 'shower' }, { text: 'eat' }, { text: 'sleep' }];

    expect(getContent(target())).toBe(getText(hook.list));
  });

  it('handles text only content', () => {
    const hook = createHook({ list: defaultData.map((item) => item.text) });
    render(html`<div data-target>${hook.$list}</div>`);

    hook.list = ['shower', 'eat', 'sleep'];

    expect(target()).toHaveTextContent(hook.list.join(''));
  });

  it('applied recursively', (done) => {
    const tasklists = [
      { name: 'today', items: defaultData },
      { name: 'week', items: [...defaultData].reverse() },
    ];
    const project = createHook({ lists: tasklists });

    render(
      html`
        <main :diff>
          ${project.$lists.map(
            (list) => html`
              <section>
                <h2>${list.name}</h2>
                <ul :key="$data-testid" data-testid="${list.name}">
                  ${list.items.map((task) =>
                    ListItem(task, {
                      'data-testid': `${list.name}_${task.id}`,
                      onMount,
                      onUnmount,
                    })
                  )}
                </ul>
              </section>
            `
          )}
        </main>
      `
    );

    tasklists[1].items = JSON.parse(JSON.stringify(defaultData));
    tasklists[1].items[0].text = 'eating';
    project.lists = tasklists;

    defer(() => {
      expect(getKeys(screen.getByTestId('week'))).toBe('1,2,3');
      expect(screen.getByTestId('week_1')).toHaveTextContent('eating');
      expect(onMount).toBeCalledTimes(6 + 2);
      expect(onUnmount).toBeCalledTimes(2);
    }, done);
  });

  it('restore focus to previous active element', () => {
    const hook = createHook({ list: defaultData });
    render(
      html`
        <div :diff>
          ${hook.$list.map(
            (data) =>
              html`<button id="btn-${data.id}" :key=${data.id}>
                ${data.text}
              </button>`
          )}
        </div>
      `
    );

    document.getElementById('btn-2').focus();
    const previousActiveElement = document.activeElement;

    hook.list = [
      { id: '2', text: 'showering' },
      { id: '1', text: 'eat' },
      { id: '3', text: 'sleep' },
    ];

    expect(previousActiveElement).toHaveFocus();
  });

  it('key value can be another attribute with `:key="$attr"` syntax', () => {
    const hook = createHook({ list: defaultData });
    render(
      List(
        hook.$list.map(
          (data) => html` <li :key="$id" id=${data.id}>${data.text}</li> `
        )
      )
    );

    hook.list = [...defaultData].reverse();

    expect(getKeys(target())).toBe(getIds(hook.list));
  });

  it(':skip="attr" - does not update ignored attributes', () => {
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
      <div :diff>${hook.$value((n) => new Array(n).fill().map(child))}</div>
    `;
    render(component);

    const el = screen.getByTestId('test-child-0');
    const proxyId = el.dataset.proxyid;
    const dataId = el.dataset.id;

    hook.value = 2;

    expect(el.getAttribute('data-proxyid')).toBe(proxyId);
    expect(el.getAttribute('data-id')).toBe(dataId);
    expect(el.textContent).not.toBe(dataId);
  });

  it(':skip="attr" - does not remove ignored attributes', () => {
    const hook = createHook(true);

    const child = (bool) => html`
      <p :key="test" :skip="data-state" data-target toggle:data-state=${bool}>
        Test
      </p>
    `;
    const component = html`<div :diff>${hook.$value(child)}</div>`;
    render(component);

    hook.value = false;

    expect(target()).toHaveAttribute('data-state');
  });

  it(':skip | :skip="all" - will skip update of the element', () => {
    const hook = createHook({ list: defaultData });
    render(
      html`<ul :diff>
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
      </ul>`
    );
    const rand = screen.getByTestId('skip').dataset.num;

    hook.list = [
      { id: '1', text: 'read' }, // read <-- eat
      { id: '2', text: 'shower' },
      { id: '3', text: 'sleep' },
    ];

    expect(screen.getByTestId('skip')).toHaveTextContent('eat');
    expect(screen.getByTestId('skip')).toHaveAttribute('data-num', rand);
  });
});
