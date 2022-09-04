import rough from './rough.js'
import {slideshow} from './slideshow.js';
import {drawCenteredSvgText, hashCode, loadFontsPromise, makeDom, uniq} from './utils.js';
import {DARK_RED, DARK_YELLOW, LIGHT_YELLOW} from './colors.js';
import {HEIGHT, WIDTH, STROKE_WIDTH} from './constants.js';

const CIRCLE_WIDTH_RELATIVE = 0.6
const CIRCLE_HEIGHT_RELATIVE = 0.75

const ANIMATION_DELAY = 250

const rafPromise = () => new Promise(resolve => requestAnimationFrame(resolve))

const timeoutPromise = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const generateLabel = (element, showTags) => {
  let label = (element.className && ('.' + element.className))
  if (!label && showTags && element.tagName) {
    label = element.tagName.toLowerCase()
  }
  return label
}

const generateBloomFilterLabel = (leafElement, showTags) => {
  let labels = []
  let element = leafElement.parentElement
  while (element) {
    labels.push(generateLabel(element, showTags))
    element = element.parentElement
  }
  if (leafElement.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) { // not root
    labels.push('body')
  }
  labels = labels.reverse()
  return `{${uniq(labels).join(',')}}`
}

// Use a different seed for each individual shape, but make sure that from slide to slide they're the same
const consistentShape = (roughSvg, shape, ...args) => {
  const seed = hashCode(JSON.stringify(args))
  args[args.length - 1] = { ...args[args.length - 1], seed }
  roughSvg.svg.appendChild(roughSvg[shape](...args))
}

const calculateTree = (root, showTags, showBloomFilter) => {
  const tree = {
    children: []
  }
  let maxDepth = 0
  let maxWidth = 0

  const calculateProperties = (element, treeNode, width, depth, offset, parentOffset, parentWidth) => {
    maxDepth = Math.max(depth, maxDepth)
    maxWidth = Math.max(width, maxWidth)

    const label = generateLabel(element, showTags)

    const subLabel = showBloomFilter && generateBloomFilterLabel(element, showTags)

    Array.from(element.children).forEach((child, i) => {
      const childNode = {
        parent: treeNode
      }
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
      element,
      subLabel
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

function drawText({ roughSvg, label, circleX, circleY, circleWidth, circleHeight, subText = false }) {
  if (!label) {
    return
  }

  let x
  let y
  let textHeight
  let textWidth

  if (subText) {
    textWidth = circleWidth
    textHeight = circleHeight / 2
    x = circleX - (circleWidth / 2)
    y = circleY + 10 // padding
  } else {
    textHeight = circleHeight
    textWidth = circleWidth
    x = circleX - (circleWidth / 2)
    y = circleY - (circleHeight / 2)
  }

  const text = drawCenteredSvgText({
    x,
    y,
    width: textWidth,
    height: textHeight,
    className: subText ? 'sub-text' : '',
    label
  })

  roughSvg.svg.appendChild(text)
}

function drawTree(root, roughSvg) {

  const { maxWidth, maxDepth } = root

  const columnWidth = WIDTH / maxDepth
  const rowHeight = HEIGHT / maxWidth

  const circleWidth = columnWidth * CIRCLE_WIDTH_RELATIVE
  const circleHeight = rowHeight * CIRCLE_HEIGHT_RELATIVE


  const walk = (node, parentRightEdge) => {
    const { depth, width, label, parentOffset, subLabel } = node

    const availableCircleHeight = (HEIGHT / width)
    const circleX = (columnWidth * depth) - (columnWidth / 2)
    const circleY = (HEIGHT * parentOffset) + availableCircleHeight - (availableCircleHeight / 2)

    if (parentRightEdge) {
      const leftEdge = {
        x: circleX - (circleWidth / 2),
        y: circleY
      }
      consistentShape(roughSvg, 'line', parentRightEdge.x, parentRightEdge.y, leftEdge.x, leftEdge.y, {
        strokeWidth: STROKE_WIDTH,
      })
    }

    consistentShape(roughSvg, 'ellipse', circleX, circleY, circleWidth, circleHeight, {
      strokeWidth: STROKE_WIDTH,
    })

    Object.assign(node, {
      circleX,
      circleY,
      circleWidth,
      circleHeight
    })

    drawText({ roughSvg, label, circleX, circleY, circleWidth, circleHeight })
    drawText({ roughSvg, label: subLabel, circleX, circleY, circleWidth, circleHeight, subText: true })

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
      svg {
        width: 100%;
        height: 100%;
      }
      svg text {
        font-size: 2em;
        font-family: Yahfie;
        fill: #000;
      }
      svg text.sub-text {
        font-size: 0.8em;
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
      .fade {
        will-change: opacity;
        opacity: 1;
        transition: 0.75s opacity linear;
      }
      .fade.fade-out {
        opacity: 0;
      }
    </style>
    <slot></slot>
    <span class="selector"><span class="selector-text"></span></span>
    `
    this.shadowRoot.onslotchange = this._onSlotChange
    this._slot = this.shadowRoot.querySelector('slot')
    this._selectorText = this.shadowRoot.querySelector('.selector-text')

    this._draw()
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

    if (isVisible && animate) {
      await this._draw() // redraw to refresh canvas
      await this._animate()
    }
  }

  _draw = async () => {
    const { _slot: slot, _selectorText: selectorText } = this

    const template = slot.assignedElements()[0]

    let svg = this.shadowRoot.querySelector('svg')

    if (svg) {
      svg.remove()
    }
    svg = makeDom(`
      <svg viewBox="0 0 ${WIDTH} ${HEIGHT}"></svg>
    `)

    this.shadowRoot.appendChild(svg)

    const roughSvg = rough.svg(svg)

    const showTags = this.getAttribute('show-tags') === 'true'
    const showBloomFilter = this.getAttribute('show-bloom-filter') === 'true'
    const tree = calculateTree(template.content, showTags, showBloomFilter)

    await loadFontsPromise

    drawTree(tree, roughSvg)

    selectorText.textContent = this.getAttribute('selector')
    this._tree = tree
    this._roughSvg = roughSvg
  }

  _animate = async () => {
    await rafPromise()
    const { _roughSvg: roughSvg, _tree: tree } = this
    const selector = this.getAttribute('selector')
    const strategy = this.getAttribute('strategy')

    const instant = strategy === 'instant'

    const touchedNodes = new Set()
    const matchedNodes = new Set()

    const matches = (element, sel = selector) => element.matches && element.matches(sel)

    const drawingQueue = []

    const flushDrawingQueue = () => {
      for (const func of drawingQueue) {
        func()
      }
      drawingQueue.length = 0
    }

    const checkNode = async (node, { bottomToTop } = {}) => {
      const { element, circleX, circleY, circleWidth, circleHeight } = node

      const match = matches(element)

      const drawTouchedNode = () => {
        if (!touchedNodes.has(node)) {
          roughSvg.svg.prepend(roughSvg.ellipse(circleX, circleY, circleWidth, circleHeight, {
            strokeWidth: 0,
            fill: LIGHT_YELLOW,
            fillStyle: 'solid'
          }))
          touchedNodes.add(node)
        }
        const animatedBorder = roughSvg.ellipse(circleX, circleY, circleWidth + (STROKE_WIDTH * 8), circleHeight + (STROKE_WIDTH * 8), {
          strokeWidth: STROKE_WIDTH * 8,
          stroke: DARK_YELLOW
        })
        animatedBorder.classList.add('fade')
        requestAnimationFrame(() => {
          animatedBorder.classList.add('fade-out')
        })
        roughSvg.svg.appendChild(animatedBorder)
      }

      if (!instant || match) {
        drawTouchedNode()
      }
      if (match) {
        const drawMatch = () => {
          if (!matchedNodes.has(node)) {
            const matchBorder = roughSvg.ellipse(circleX, circleY, circleWidth, circleHeight, {
              strokeWidth: STROKE_WIDTH * 4,
              stroke: DARK_RED,
            })
            matchBorder.classList.add('matched')
            roughSvg.svg.appendChild(matchBorder)
            matchedNodes.add(node)
          }
        }
        if (bottomToTop) {
          drawingQueue.push(drawMatch)
        } else {
          drawMatch()
        }
      }
    }

    const walk = async (node, { bottomToTop, stopAtSelector } = { bottomToTop: false }) => {
      if (!instant || node === tree) {
        await timeoutPromise(ANIMATION_DELAY)
        await rafPromise()
      }
      await checkNode(node, { bottomToTop })

      if (bottomToTop) {
        if (node.parent) {
          if (matches(node.element, stopAtSelector)) {
            flushDrawingQueue()
          } else {
            await walk(node.parent, {bottomToTop, stopAtSelector})
          }
        }
      } else {
        if (node.children) {
          for (const child of node.children) {
            await walk(child)
          }
        }
      }
      
    }

    const querySelectorAll = (node, selector) => {
      let res = []

      if (matches(node.element, selector)) {
        res.push(node)
      }

      if (node.children) {
        for (const child of node.children) {
          res = res.concat(querySelectorAll(child, selector))
        }
      }

      return res
    }

    const walkNaiveDescendant = async node => {
      const [ ancestor ] = selector.split(' ')
      const elementsMatchingAncestor = querySelectorAll(node, ancestor)
      for (const element of elementsMatchingAncestor) {
        await walk(element)
      }
    }

    const walkAncestor = async (node, { bloomFilter } = {}) => {
      const [ ancestor, descendant ] = selector.split(' ')
      const elementsMatchingDescendant = bloomFilter
        ? querySelectorAll(node, selector)
        : querySelectorAll(node, descendant)
      for (const element of elementsMatchingDescendant) {
        await walk(element, { bottomToTop: true, stopAtSelector: ancestor })
      }
    }

    switch (strategy) {
      case 'naive':
      case 'instant':
        await walk(tree)
        break
      case 'naive-descendant':
        await walkNaiveDescendant(tree)
        break
      case 'naive-ancestor':
        await walkAncestor(tree, { bloomFilter: false })
        break
      case 'bloom-filter':
        await walkAncestor(tree, { bloomFilter: true })
        break
    }
  }

})