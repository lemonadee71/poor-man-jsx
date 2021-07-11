import { html, render } from '../index.js';

const root = document.createElement('div');
document.body.append(root);

const htmlString = '<h1>This is my div</h1>';

// Should render element with an event listener
const test1 = html`
  <button ${{ onClick: () => alert('Hello') }}>This is my button</button>
`;
root.append(render(test1));

// Should be rendered with all the props and attr
const obj = {
  class: 'myclass',
  id: 'test',
  height: '20x',
  width: '300px',
  border: '1px solid black',
  innerHTML: htmlString,
  onClick: () => {
    console.log('I am clicked');
  },
};
const test2 = html`<div ${obj}></div>`;
root.append(render(test2));

// Special tag children should work
const test3 = html`<div ${{ children: test2 }}></div>`;
root.append(render(test3));

// Arrays should work
const test4 = html`<ul>
  ${new Array(3).fill('test').map((str) => `<li>${str}</li>`)}
</ul>`;
root.append(render(test4));

// Arrays with template should work
const test5 = html`<div
  style="height: 300px; width: 500px; border: 1px solid red"
>
  ${[test1, test2, test3, test4]}
</div>`;
root.append(render(test5));

// Arrays of objects should work
const arr = [
  {
    onClick: () => alert('Test'),
  },
  {
    textContent: 'Click me',
  },
];
const test6 = html`<button ${arr}></button>`;
root.append(render(test6));

// Multiple objects should work
const test7 = html`<button
  ${{
    onClick: () => alert('Test again'),
    height: '30px',
    borderRadius: '15px',
  }}
  ${{
    border: '1px solid red',
    textContent: 'Click me again',
  }}
></button>`;
root.append(render(test7));

// Should not render html strings if enclosed with {% %}
// And retain actual comments
const test8 = html`
  <select name="test" id="test8">
    <option value="test8">
      <!-- I Should not be rendered -->
      {% ${htmlString} %}
    </option>
  </select>
`;
root.append(render(test8));
