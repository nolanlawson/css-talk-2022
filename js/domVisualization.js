customElements.define('dom-visualization', class extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open'}).innerHTML = `
    <style>
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }
    ::slotted(*) {
      display: none;
    }
    .root, .root * {
      display: flex;
      border-radius: 100%;
      flex: 1;
      border: 2px solid black;
      flex-direction: column;
      height: 100%;
      width: calc(var(--root-width) / var(--max-tree-depth));
      transform: translateX(100%);
    }
    .root {
      --tree-depth: 0;
      transform: translateX(0);
    }
    </style>
    <div class="root">
    </div>
    <slot></slot>
    `
    this.shadowRoot.onslotchange = this.onSlotChange
  }

  onSlotChange = (e) => {
    const nodes = e.target.assignedNodes()
    const root = this.shadowRoot.querySelector('.root')
    root.innerHTML = ''
    for (const node of nodes) {
      root.appendChild(node.cloneNode(true))
    }

    let maxDepth = 0

    const setDepth = (element, depth) => {
      maxDepth = Math.max(depth, maxDepth)
      element.style.setProperty('--tree-depth', depth)
      for (const child of element.children) {
        setDepth(child, depth + 1)
      }
    }

    for (const element of root.children) {
      setDepth(element, 1)
    }
    this.style.setProperty('--max-tree-depth', maxDepth + 1)
  }

  connectedCallback() {
    requestAnimationFrame(() => {
      const rect = this.getBoundingClientRect()

      console.log('width', rect.width)
      requestAnimationFrame(() => {
        this.style.setProperty('--root-width', rect.width + 'px')
      })
    })
  }
})