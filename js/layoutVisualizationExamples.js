import './layoutVisualization.js'

customElements.define('layout-example-1', class extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <layout-visualization version="${this.getAttribute('version') || '1'}"></layout-visualization>
    `
  }
})

customElements.define('layout-example-2', class extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        .flex {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }
        span {
          font-size: 3em;
          text-align: center;
        }
        .flex > layout-visualization {
          flex: 1
        }
      </style>
      <div class="flex">
        <layout-visualization version="1" big-stroke="true"></layout-visualization>
        <span>
          →
        </span>
        <layout-visualization version="2" big-stroke="true"></layout-visualization>
      </div>
    `
  }
})