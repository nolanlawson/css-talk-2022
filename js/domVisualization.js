import { rough } from './rough.js'
import {slideshow} from './slideshow.js';

// 16.9 ratio
const WIDTH = 1920
const HEIGHT = 1080

const CIRCLE_WIDTH_RELATIVE = 0.6
const CIRCLE_HEIGHT_RELATIVE = 0.75

const TEXT_SIZE = 64

const STROKE_WIDTH = 2

const ANIMATION_DELAY = 250

const rafPromise = () => new Promise(resolve => requestAnimationFrame(resolve))

const timeoutPromise = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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
          parentWidth / (element.children.length),
        )
      )
    })
    return {
      depth,
      width,
      offset,
      label,
      parentOffset,
      parentWidth,
      element
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

function fillText({ roughCanvas, label, circleX, circleY }) {
  if (!label) {
    return
  }
  const { width: textWidth, actualBoundingBoxAscent } = roughCanvas.ctx.measureText(label)
  roughCanvas.ctx.fillText(label, circleX - (textWidth / 2), circleY + (actualBoundingBoxAscent / 2))
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
      roughCanvas.line(parentRightEdge.x, parentRightEdge.y, leftEdge.x, leftEdge.y, {
        strokeWidth: STROKE_WIDTH
      })
    }

    roughCanvas.ellipse(circleX, circleY, circleWidth, circleHeight, {
      strokeWidth: STROKE_WIDTH
    })

    Object.assign(node, {
      circleX,
      circleY,
      circleWidth,
      circleHeight
    })

    fillText({ roughCanvas, label, circleX, circleY })

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
          position: relative;
      }
      canvas {
        width: 100%;
        height: 100%
      }
      .selector {
        position: absolute;
        left: 20px;
        top: 20px;
        font-size: 36px;
      }
      .selector-text {
        font-family: 'Ubuntu Mono', monospace;
        background: rgba(30, 30, 30, 0.05);
      }
    </style>
    <slot></slot>
    <span class="selector"><span class="selector-text"></span></span>
    `
    this.shadowRoot.onslotchange = this._onSlotChange
    this._slot = this.shadowRoot.querySelector('slot')
    this._selectorText = this.shadowRoot.querySelector('.selector-text')
  }

  connectedCallback() {
    slideshow.on('afterShowSlide', this._onShowSlide)
  }

  disconnectedCallback() {
    slideshow.removeListener('afterShowSlide', this._onShowSlide)
  }

  _onShowSlide = async (slide) => {
    const animate = this.getAttribute('animate') === 'true'
    const slideNode = document.querySelector(`.remark-slide-container:nth-child(${slide.getSlideIndex() + 1})`)
    const isVisible = slideNode && slideNode.contains(this)

    if (isVisible) {
      await this._draw()
      if (animate) {
        requestAnimationFrame(() => this._animate())
      }
    }
  }

  _draw = async () => {
    const { _slot: slot, _selectorText: selectorText } = this

    const template = slot.assignedElements()[0]

    let canvas = this.shadowRoot.querySelector('canvas')
    if (canvas) {
      canvas.remove()
    }

    canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    this.shadowRoot.appendChild(canvas)

    const roughCanvas = rough.canvas(canvas, {
      disableMultiStroke: true,
    })

    const tree = calculateTree(template.content)

    await loadFontsPromise
    roughCanvas.ctx.font = `${TEXT_SIZE}px Yahfie`

    drawTree(tree, roughCanvas)

    selectorText.textContent = this.getAttribute('selector')
    this._tree = tree
    this._roughCanvas = roughCanvas
  }

  _animate = async () => {
    await rafPromise()
    const { _roughCanvas: roughCanvas, _tree: tree } = this
    const selector = this.getAttribute('selector')


    const checkNode = async node => {
      await timeoutPromise(ANIMATION_DELAY)
      await rafPromise()
      const { element, circleX, circleY, circleWidth, circleHeight, label } = node
      roughCanvas.ellipse(circleX, circleY, circleWidth, circleHeight, {
        strokeWidth: 0,
        fill: 'rgba(255, 255, 0, 0.4)',
        fillStyle: 'solid'
      })
      if (element.matches && element.matches(selector)) {
        roughCanvas.ellipse(circleX, circleY, circleWidth, circleHeight, {
          strokeWidth: STROKE_WIDTH * 4,
          stroke: 'rgba(255, 15, 80, 1)'
        })
      }
      // have to redraw the text to put it on top
      fillText({roughCanvas, label, circleX, circleY})
    }

    const walk = async node => {
      await checkNode(node)

      if (node.children) {
        for (const child of node.children) {
          await walk(child)
        }
      }
    }

    await walk(tree)
  }

})