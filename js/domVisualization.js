import { rough } from './rough.js'

// 16.9 ratio
const WIDTH = 1920
const HEIGHT = 1080

const CIRCLE_WIDTH_RELATIVE = 0.6
const CIRCLE_HEIGHT_RELATIVE = 0.75

const TEXT_SIZE = 64

const loadFontsPromise = (async () => {
  const fontFace = new FontFace('Yahfie', "url('./fonts/yahfie/Yahfie-Heavy.ttf')");
  const font = await fontFace.load()
  document.fonts.add(font)
})()

const calculateTree = (root) => {
  const tree = {
    children: []
  }
  let maxDepth = 0
  let maxWidth = 0

  const calculateProperties = (element, treeNode, width, depth, offset, parentOffset, parentWidth) => {
    maxDepth = Math.max(depth, maxDepth)
    maxWidth = Math.max(width, maxWidth)

    const label = element.className && ('.' + element.className)

    Array.from(element.children).forEach((child, i) => {
      const childNode = {}
      if (!treeNode.children) {
        treeNode.children = []
      }
      treeNode.children.push(childNode)
      Object.assign(
        childNode,
        calculateProperties(
          child,
          childNode,
          element.children.length * width,
          depth + 1,
          i,
          parentOffset + (i * (parentWidth / (element.children.length))),
          parentWidth / (element.children.length)
        )
      )
    })
    return {
      depth,
      width,
      offset,
      label,
      parentOffset,
      parentWidth
    }
  }

  Object.assign(tree, calculateProperties(root, tree, 1, 1, 0, 0, 1))

  Object.assign(tree, {
    maxDepth,
    maxWidth,
    label: 'body'
  })
  return tree
}

function drawTree(root, roughCanvas) {

  const { maxWidth, maxDepth } = root

  const columnWidth = WIDTH / maxDepth
  const rowHeight = HEIGHT / maxWidth

  const circleWidth = columnWidth * CIRCLE_WIDTH_RELATIVE
  const circleHeight = rowHeight * CIRCLE_HEIGHT_RELATIVE


  const walk = (node, parentRightEdge) => {
    const { depth, width, label, parentOffset } = node

    const availableCircleHeight = (HEIGHT / width)
    const circleX = (columnWidth * depth) - (columnWidth / 2)
    const circleY = (HEIGHT * parentOffset) + availableCircleHeight - (availableCircleHeight / 2)

    if (parentRightEdge) {
      const leftEdge = {
        x: circleX - (circleWidth / 2),
        y: circleY
      }
      roughCanvas.line(parentRightEdge.x, parentRightEdge.y, leftEdge.x, leftEdge.y)
    }

    roughCanvas.ellipse(circleX, circleY, circleWidth, circleHeight)

    if (label) {
      const { width: textWidth, actualBoundingBoxAscent } = roughCanvas.ctx.measureText(label)
      roughCanvas.ctx.fillText(label, circleX - (textWidth / 2), circleY + (actualBoundingBoxAscent / 2))
    }

    if (node.children) {
      const rightEdge = {
        x: circleX + (circleWidth / 2),
        y: circleY
      }
      for (const child of node.children) {
        walk(child, rightEdge)
      }
    }

  }

  walk(root)

}

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
      canvas {
        width: 100%;
        height: 100%
      }
    </style>
    <slot></slot>
    `
    this.shadowRoot.onslotchange = this._onSlotChange
    this._slot = this.shadowRoot.querySelector('slot')
  }

  _onSlotChange = async () => {
    const { _slot: slot } = this

    const template = slot.assignedElements()[0]

    let canvas = this.shadowRoot.querySelector('canvas')
    if (canvas) {
      canvas.remove()
    }

    canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    this.shadowRoot.appendChild(canvas)

    const roughCanvas = rough.canvas(canvas)

    const tree = calculateTree(template.content)

    await loadFontsPromise
    roughCanvas.ctx.font = `${TEXT_SIZE}px Yahfie`

    drawTree(tree, roughCanvas)
  }

})