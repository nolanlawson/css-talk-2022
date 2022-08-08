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
      flex-direction: column;
      flex: 1;
      --width: calc(var(--root-width) / var(--max-tree-depth));
      width: var(--width);
      position: absolute;
      left: 0;
      font-size: 36px;
    }
    .tree {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .root {
      --tree-depth: 0;
      transform: translateX(0);
      --num-siblings: 1;
    }
    .root::after, .root *::after {
       content: attr(data-content);
       border: 2px solid black;
       border-radius: 100%;
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
    <div class="tree">
      <div class="root" data-content="body">
    </div>
    </div>
    <slot></slot>
    `
    this.shadowRoot.onslotchange = this._onSlotChange
    this._root = this.shadowRoot.querySelector('.root')
    this._slot = this.shadowRoot.querySelector('slot')
  }

  _onSlotChange = () => {
    const { _root: root, _slot: slot } = this

    const clear = () => {
      root.innerHTML = ''
    }
    const copySlotContent = () => {
      const nodes = slot.assignedNodes()
      for (const node of nodes) {
        root.appendChild(node.cloneNode(true))
      }
    }

    const calculateWidthAndDepth = () => {
      let maxDepth = 0
      let maxWidth = 0

      const setDepth = (element, depth, width, i) => {
        maxDepth = Math.max(depth, maxDepth)
        maxWidth = Math.max(width, maxWidth)
        element.style.setProperty('--tree-depth', depth)
        element.style.setProperty('--num-siblings', width)
        element.style.setProperty('--sibling-order', i)
        Array.from(element.children).forEach((child, i) => {
          setDepth(child, depth + 1, element.children.length * width, i)
        })
      }

      for (const element of root.children) {
        setDepth(element, 1, root.children.length, 0)
      }
      this.style.setProperty('--max-tree-depth', maxDepth + 1)
      this.style.setProperty('--max-tree-width', maxWidth)
    }

    const updateStyles = () => {
      const drawLine = (element) => {
        const { parentElement } = element
        requestAnimationFrame(() => {
          const parentRect = parentElement.getBoundingClientRect()
          const rect = element.getBoundingClientRect()

        })
      }
      for (const element of root.querySelectorAll('*')) {
        drawLine(element)
        if (element.className) {
          element.setAttribute('data-content', '.' + element.className)
        }
      }
    }

    clear()
    copySlotContent()
    calculateWidthAndDepth()
    updateStyles()
  }

  connectedCallback() {
    window.addEventListener('resize', this._onResize)
    this._onResize()
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._onResize)
  }

  _onResize = () => {
    requestAnimationFrame(() => {
      const rect = this.getBoundingClientRect()

      requestAnimationFrame(() => {
        this.style.setProperty('--root-width', rect.width + 'px')
        this.style.setProperty('--root-height', rect.height + 'px')
      })
    })
  }
})