customElements.define('example-1', class extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).innerHTML = `
<style>
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
<dom-visualization>
  <div class="foo">
    <div></div>
    <div>
      <div class="bar"></div>
    </div>
  </div>
  <div>
    <div>
    </div>
  </div>
</dom-visualization>    
    `
  }
})