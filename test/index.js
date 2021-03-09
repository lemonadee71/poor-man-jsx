import Component from '../component.js';
const { parseString: html } = Component;

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

const state = Component.createState({
  name: 'red',
  text: 'test2',
  length: '1px',
});
const anotherState = Component.createState('test3');

const changeHandler = (e) => {
  state.value.name = e.currentTarget.value;
  state.value.length = e.currentTarget.value.split('').length + 'px';
  anotherState.value = `<h1>${e.currentTarget.value}</h1>`;
};

document.body.prepend(
  Component.render(html`
    <p
      ${{
        $innerHTML: state.bind('name', (val) =>
          val ? `<strong>${val}</strong>` : 'Hello'
        ),
      }}
    ></p>
    <p ${{ '$style:font-size': state.bind('length') }}>Hello</p>
    <p ${{ $id: anotherState.bind() }}></p>
    <div
      ${{
        $content: state.bind('name', (val) =>
          val.split('').length % 2 === 0 ? example : html`<h1>Hello</h1>`
        ),
      }}
    ></div>
    <input type="text" placeholder="Text" ${{ onInput: changeHandler }} />
  `)
);

document.body.prepend(Component.render(example));

// document
//   .querySelector('.delete')
//   .addEventListener('click', (e) => e.target.parentElement.remove());

// obj = Component.bind(
//   {
//     target: obj,
//     prop: 'name',
//   },
//   {
//     target: '#test1',
//     prop: 'textContent',
//   }
// );

// obj = Component.bind(
//   {
//     target: obj,
//     prop: 'name',
//   },
//   {
//     target: '#test2',
//     prop: 'innerHTML',
//     func(val) {
//       return `<strong>Testing this ${val}</strong>`;
//     },
//   }
// );

// obj = Component.bind(
//   {
//     target: obj,
//     prop: 'name',
//     func(val) {
//       return `${Math.random()} + ${val}`;
//     },
//   },
//   {
//     target: '#test3',
//     prop: 'textContent',
//   }
// );

// create state
//
