import './remark.min.js'
import { getLinkUrl } from './utils.js';

let text = await (await fetch(getLinkUrl('markdown'))).text()
text = text.replace(/\.\/images\/(.*?\.)(png|svg)/g, (match, p1) => {
  return getLinkUrl(p1)
})

const modifiedUrl = URL.createObjectURL(new Blob([text], {
  type: 'text/plain;charset=UTF-8'
}))

export const slideshow = remark.create({
  ratio: '16:9',
  sourceUrl: modifiedUrl,
  highlightLanguage: 'javascript',
  highlightLines: true,
  highlightStyle: 'solarized-light',
});


export function togglePresenterMode() {
  const event = new CustomEvent('keypress')
  Object.assign(event, {
    which: 112,
    keyCode: 112,
    key: 'p',
  })
  window.dispatchEvent(event)
}

customElements.define('toggle-presenter-mode', class extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        button {
          font-size: 1em;
          cursor: pointer;
        }
      </style>
      <button><slot></slot></button>
    `
    this.shadowRoot.querySelector('button').addEventListener('click', togglePresenterMode)
  }
})