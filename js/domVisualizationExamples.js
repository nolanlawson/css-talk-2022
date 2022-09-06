import './domVisualization.js'

customElements.define('example-1', class extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = `
<dom-visualization 
  selectors="span|.foo|#bar|a.baz" 
  show-tags="true"
  animate="${this.getAttribute('animate') ?? false}"
  strategy="naive"
  slow="${this.getAttribute('slow') ?? false}"
>
  <template>
    <div>
      <x-x class="baz">
        <x-x class="foo">
          <x-x id="bar"></x-x>
        </x-x>
      </x-x>
      <div>
        <span></span>
      </div>
    </div>
    <div>
      <x-x class="foo">
        <a class="baz">
        </a>
        <div>
          <span></span>
        </div>
      </x-x>
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
    <x-x class="foo">
      <div>
        <div>
          <x-x class="bar"></x-x>
        </div>
      </div>
      <div>
        <div>
          <div></div>
        </div>
      </div>
    </x-x>
    <div>
      <x-x class="foo">
        <div>
          <x-x class="bar"></x-x>
        </div>
        <div>
          <div></div>
        </div>
        <div>
          <div></div>
        </div>
      </x-x>
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
      <x-x class="foo">
        <div>
          <div></div>
        </div>
      </x-x>
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
        <x-x class="foo">
          <div></div>
        </x-x>
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