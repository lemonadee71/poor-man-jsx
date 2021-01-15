import Component from '../component.js';

document.body.appendChild(
  Component.createElementFromObject({
    type: 'div',
    id: 'test',
    text: 'test',
    children: [
      {
        type: 'div#text',
        text: 'foo bar',
        className: 'foo bar',
      },
    ],
  })
);
