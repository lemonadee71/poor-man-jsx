# Poor Man's JSX

Create DOM elements painlessly with tagged template literals.

## Installation

```shell
npm i poor-man-jsx
```

Then import

```js
import { html, render } from 'poor-man-jsx';
```

## Creating html elements

Use the `html` function and prefix your template literals with it (use it as a tag).

```js
// event listeners must be prefixed with 'on'
const button = html`
  <button ${{ onClick: () => alert('Button clicked') }}>Click me!</button>
`;
```

`html` returns a `Template`. Use the `render` function that takes in a `Template` to create an element (or specifically, creates a `DocumentFragment`)

To create an element, we use the `render` function. `render` takes in a second argument which is either a selector string or a node. The created element will be appended to this if provided.

```js
// Let's append the button we created before to the body
render(button, document.body);
//or
render(button, 'body');
// and now you have a button that shows an alert when clicked
```

> `render` returns the created element if second argument is not provided otherwise it'll return the parent

And now that you know the basics, you could do this too. You can add class, style attributes, and some props like innerHTML or textContent.

```js
const props = {
  class: 'my-header',
  height: '30px',
  width: '100%',
  borderBottom: '1px solid black',
  display: 'flex',
  innerHTML: '<h1>Title</h1>',
};
const header = html`<header ${props}></header>`;
render(header, document.body);
```

You can use the style attribute directly as a key or prefix it with the `style_`. So the example above could be,

```js
const props = {
  class: 'my-header',
  style_height: '30px',
  style_width: '100%',
  style_borderBottom: '1px solid black',
  style_display: 'flex',
  innerHTML: '<h1>Title</h1>',
};
```

and we'll get the same result.

> Use camelCase for style attributes

By default, any string you passed in will be rendered as element (slightly the same behavior as `innerHTML`). If you don't want to render user injected html strings, just wrap it in `{% string here $}`. Now this behaves more like `textContent`.

```js
const str = '<strong>This will render as a text</strong>';
const p = html`<p id="test">{% ${str} %}</p>`;

render(p, 'body');
console.log(document.getElementById('test').textContent); // <strong>This will render as a text</strong>
```

or you could just pass a text node to achieve the same result

```js
...
const p = html`<p id="test">${document.createTextNode(str)}</p>`;
...
console.log(document.getElementById('test').textContent); // <strong>This will render as a text</strong>
```

And you could pass arrays too

```js
const list = html`
  <ul>
    ${new Array(3).fill('test').map((str, i) => `<li>${str} ${i}</li>`)}
  </ul>
`;
```

You could also pass in a `Template` which was returned by `html`. This allows for better composition.

```js
// add the list we created above to our nav
const nav = html`<nav>${list}</nav>`;
render(nav, 'body');
```

Among what was mentioned already, you could also pass `HTMLElement`, `DocumentFragment`, or anything of type `Node`.

> Important: Props should be inside the opening tag. Anything passed that are between the opening and closing tags will be treated as children.

## Lifecycle Methods

Poor Man's JSX also allows you to have lifecycle methods in your elements. The lifecycle methods available are: `create`, `destroy`, `mount`, and `unmount`. To add a lifecycle method, you declare it like an event listener (see example).

Here's a modified example from the [React docs](https://reactjs.org/docs/state-and-lifecycle.html) written with Poor Man's JSX. See it in action [here](https://codesandbox.io/s/poor-man-jsx-lifecycle-n0u3f?file=/src/index.js)

```js
const Clock = () => {
  let date = new Date();
  let timerID;

  const onMount = (e) => {
    timerID = setInterval(tick, 1000, e.target);
  };

  const onUnmount = () => {
    clearInterval(timerID);
  };

  const tick = (el) => {
    date = new Date();
    el.textContent = `It is ${date.toLocaleTimeString()}.`;
  };

  return html`
    <div>
      <h1>Hello, world!</h1>
      <h2 ${{ onMount, onUnmount }}>It is ${date.toLocaleTimeString()}.</h2>
    </div>
  `;
};

render(Clock(), document.body);
```

Any callbacks passed as a lifecycle method are event listeners so you can access the node it was attached to via `event.target` and also as `this`.

Since lifecycle methods are essentially event listeners, you can also add them manually. Just prefix the lifecycle method name with `@`.

```js
const arrowFunction = (e) => {
  console.log(e.target);
};

const div = document.createElement('div');
div.addEventListener('@destroy', arrowFunction);
document.body.append(div);
div.remove();

// arrowFunction should log
// <div></div>
```

Doing it this way though means you can not use the `create` lifecycle. You have to manually trigger it since internally, we call the `create` lifecycle methods on element creation from `Template`.

> `create` and `destroy` will only be called once unlike `mount` and `unmount` which can be called multiple times if the node is removed or moved (appended elsewhere). This behavior is similar to `connectedCallback` and `disconnectedCallback` of custom elements.

## Data Binding

Poor Man's JSX also allows you to bind an object to an element so that changes in the object is reflected to the elements it was binded to. We call it a `hook`.

To create one, just use `createHook` which returns an array `[proxy, revoke]`. It accepts a primitive or an object. Since under the hood we're using `Proxy`, we need the `hook` to be an object. By default, the object key will be `value` if a primitive is passed.

```js
import { createHook } from 'poor-man-jsx';

const [hook1] = createHook('test');
console.log(hook1); // Proxy { value: 'test' }

const [hook2, revoke] = createHook({ num: 1 });
console.log(hook2); // Proxy { num: 1 }

// and use revoke to revoke the Proxy and delete the hook from memory
// this will also return the original unproxied object
revoke(); // returns { num: 1 }
```

> Under the hood, we're using `WeakMap` to store data so it's not really necessary to use revoke but use it when you can in a `destroy` or `unmount` callback.

### Example

Let's take our Clock example and rewrite it using a hook,

```js
const Clock = () => {
  const [current, revoke] = createHook({ date: new Date(), timerID: null });

  const onMount = () => {
    current.timerID = setInterval(tick, 1000);
  };

  const onUnmount = () => {
    clearInterval(current.timerID);
  };

  const tick = () => {
    current.date = new Date();
  };

  return html`
    <div
      ${{
        onMount,
        onUnmount,
        onDestroy: revoke, // delete hook
      }}
    >
      <h1>Hello, world!</h1>
      <h2
        ${{
          $textContent: current.$date(
            (date) => `It is ${date.toLocaleTimeString()}.`
          ),
        }}
      ></h2>
    </div>
  `;
};

render(Clock(), document.body);
```

Let's take a look at the code more closely. _Hooking_ an object to element happens in this line

```js
$textContent: current.$date(
  (date) => `It is ${date.toLocaleTimeString()}.`
),
```

What this does is that whenever current's `date` changes, the `h2`'s textContent will be updated. As you can see, we're passing a function. This function will have the current value as argument which in this case the current value of `date` and anything we return from this will be what the `textContent` will be. So if we just do,

```js
$textContent: current.$date;
```

it will just set the `textContent` to an unformatted complete date.

In React, this is like the difference between

```js
<h2>It is {date.toLocaleTimeString()}.</h2>
// and
<h2>{date}</h2>
```

Also, as you can see, we just need to set `current.date` to the new date. No need to target the `h2` unlike in our previous example. See it working [here](https://codesandbox.io/s/poor-man-jsx-hook-92e9y?file=/src/index.js).

Also note that we prefixed both `textContent` and `date` with `$`. This is required. It tells the code that we want `textContent` to be _hooked_ to `date`.

```js
// This will just set the element's textContent to current.date
// But won't change when date changes
textContent: current.date;

// And this will probably throw an error
$textContent: current.date;
textContent: current.$date;

// Do this
$textContent: current.$date;

// Or more generally
$prop: object.$key;
```

### Text Tag

We use template strings a lot so it's a lot better if we can write our previous example to be more concise.

```js
$textContent: current.$date(
  (date) => `It is ${date.toLocaleTimeString()}.`
),
```

That's where the `text` tag is used for. Just use it as a template tag like we use `html` and it allows you to pass a hook to a template literal which makes for a more concise code. Our previous example can now be written like this,

```js
$textContent: text`It is ${current.$date.toLocaleTimeString()}.`;
```

and it'll still work the same.
