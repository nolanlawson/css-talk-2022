import './remark.min.js'

export const slideshow = remark.create({
  ratio: '16:9',
  sourceUrl: './markdown.md',
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