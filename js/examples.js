customElements.define('example-1', class extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = `
<dom-visualization 
  selector=".foo" 
  animate="${this.getAttribute('animate') ?? false}"
  strategy="${this.getAttribute('strategy') ?? 'naive'}"
>
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
<dom-visualization 
  selector=".foo .bar" 
  animate="${this.getAttribute('animate') ?? false}"
  strategy="${this.getAttribute('strategy') ?? 'naive'}"
>
  <template>
    <div class="foo">
      <div>
        <div>
          <div class="bar"></div>
        </div>
      </div>
      <div>
        <div>
          <div></div>
        </div>
      </div>
    </div>
    <div>
      <div class="foo">
        <div>
          <div class="bar"></div>
        </div>
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

customElements.define('example-3', class extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = `
<dom-visualization 
  selector=".foo div" 
  animate="${this.getAttribute('animate') ?? false}"
  strategy="${this.getAttribute('strategy') ?? 'naive'}"
  show-tags="${this.getAttribute('show-tags') ?? false}"
  show-bloom-filter="${this.getAttribute('show-bloom-filter') ?? false}"
>
  <template>
    <div>
      <div class="foo">
        <div>
          <div></div>
        </div>
      </div>
      <div>
        <div>
          <div></div>
        </div>
      </div>
    </div>
    <div>
      <div>
        <div>
          <div></div>
        </div>
        <div class="foo">
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