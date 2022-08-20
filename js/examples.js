customElements.define('example-1', class extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = `
<dom-visualization selector=".foo" animate="${this.getAttribute('animate') ?? false}">
  <template>
    <div>
      <div>
        <div>
          <div></div>
        </div>
      </div>
      <div>
        <div class="foo"></div>
      </div>
    </div>
    <div>
      <div>
        <div class="foo">
        </div>
        <div>
          <div></div>
        </div>
      </div>
    </div>
  </template>
</dom-visualization>    
    `
  }
})

customElements.define('example-2', class extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = `
<dom-visualization selector=".foo .bar" animate="${this.getAttribute('animate') ?? false}>
  <template>
    <div class="foo">
      <div>
        <div>
          <div></div>
        </div>
      </div>
      <div>
        <div class="bar"></div>
      </div>
    </div>
    <div>
      <div>
        <div>
        </div>
        <div>
          <div class="bar"></div>
        </div>
      </div>
    </div>
    <div class="foo">
      <div>
        <div>
          <div></div>
        </div>
        <div>
          <div></div>
        </div>
      </div>
    </div>
  </template>
</dom-visualization>    
    `
  }
})