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
      flex: 1;
      flex-direction: column;
      height: 100%;
      width: calc(var(--root-width) / var(--max-tree-depth));
      transform: translateX(100%);
      position: relative;
      font-size: 36px;
    }
    .root {
      --tree-depth: 0;
      transform: translateX(0);
    }
    .root::after, .root *::after {
       content: attr(data-content);
       border: 2px solid black;
       border-radius: 100%;
       position: absolute;
       left: 20px;
       right: 20px;
       --height: calc(var(--root-height) / var(--max-tree-width));
       height: var(--height);
       top: calc(50% - (var(--height) / 2));
       display: flex;
       justify-content: center;
       align-items: center;
    }
    </style>
    <div class="root" data-content="body">
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
    let maxWidth = 0

    const setDepth = (element, depth, width) => {
      maxDepth = Math.max(depth, maxDepth)
      maxWidth = Math.max(width, maxWidth)
      element.style.setProperty('--tree-depth', depth)
      for (const child of element.children) {
        setDepth(child, depth + 1, element.children.length * width)
      }
    }

    for (const element of root.children) {
      setDepth(element, 2, root.children.length)
    }

    for (const element of root.querySelectorAll('*')) {
      if (element.className) {
        element.setAttribute('data-content', '.' + element.className)
      }
    }

    this.style.setProperty('--max-tree-depth', maxDepth)
    this.style.setProperty('--max-tree-width', maxWidth)
  }

  connectedCallback() {
    requestAnimationFrame(() => {
      const rect = this.getBoundingClientRect()

      requestAnimationFrame(() => {
        this.style.setProperty('--root-width', rect.width + 'px')
        this.style.setProperty('--root-height', rect.height + 'px')
      })
    })
  }
})