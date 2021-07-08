import { html, render, createState } from '../component.js';

let example = html`
  <div>
    ${{
      type: 'p',
      id: 'test2',
      text: '<h1>Testing this shit</h1>',
      children: [
        {
          type: 'button',
          text: 'alert me',
          listeners: {
            click: () => alert("It's working"),
          },
        },
        html`<button
          ${{
            onClick: () => alert('Another alert'),
          }}
        >
          Another button
        </button>`,
      ],
    }}
  </div>
`;

const state = createState({
  name: 'red',
  text: 'test2',
  length: '1px',
});
const anotherState = createState('test3');
const arrayState = createState(['1', '2', '3']);
arrayState.value = arrayState.value.map((num) => +num);

const changeHandler = (e) => {
  console.log('fafafa');
  state.value.name = e.currentTarget.value;
  state.value.length = e.currentTarget.value.split('').length + 'px';
  anotherState.value = e.currentTarget.value;

  arrayState.value = [...arrayState.value];
  arrayState.value.push(1);
};

document.body.prepend(
  render(html`
    <input type="text" placeholder="Text" ${{ onInput: changeHandler }} />
    <li>${html`<h1>TEST ${'test'}</h1>`}</li>
    <p ${{ '$style:fontSize': state.bind('length') }}>Hello</p>
    <div>
      {%
      <h1>SHIT IS REAL</h1>
      %}
    </div>
    <ol
      ${{
        $content: arrayState.bindValue((val) => {
          return html`${val.map((num) => html`<li>${num}</li>`)}`;
        }),
      }}
    ></ol>
    <p ${{ $id: anotherState.bindValue() }}>Test</p>
    <div
      ${{
        $content: state.bind('name', (val) =>
          val.split('').length % 2 === 0
            ? html`<h1>TEST</h1>`
            : html`<h1>Hello</h1>`
        ),
      }}
    ></div>
    <p
      ${{
        $innerHTML: state.bind('name', (val) =>
          val ? `<strong>${val}</strong>` : 'Hello'
        ),
      }}
    ></p>
    <div ${{ innerHTML: '<h3>TSET</h3>' }}></div>
    ${example} {% ${'<h3>TSET</h3>'} %}
  `)
);

state.$value;
state.$name((val) => (val ? `<strong>${val}</strong>` : 'Hello'));
