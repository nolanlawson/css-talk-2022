// 16.9 ratio
import {drawCenteredSvgText, makeDom} from './utils.js';
import rough from './rough.js';
import {PASTEL_BLUE, PASTEL_GREEN, PASTEL_RED} from './colors.js';
import {SEED, STROKE_WIDTH} from './constants.js';
import {slideshow} from './slideshow.js';

customElements.define('layout-visualization', class extends HTMLElement {
  constructor() {
    super()

    this._version = parseInt(this.getAttribute('version') || '1', 10)
    this._drawText = this.getAttribute('draw-text') === 'true'

    const { _version: version, _drawText: drawText } = this

    this.attachShadow({mode: 'open'}).innerHTML = `
      <style>
        :host {
          position: relative;
          width: 100%;
          height: 100%;
          display: block;
        }
        .container, svg {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;
        }
        .container { 
          display: grid;
          grid-template-areas: "nav     nav"
                               "sidebar main";
          grid-template-columns: ${version === 1 ? '2fr 5fr' : '1fr 6fr'};
          grid-template-rows: 1fr 4fr;
          z-index: 2;
          padding: 20px;
          grid-gap: 20px;
        }
        svg {
          width: 100%;
          height: 100%
        }
        .nav {
          grid-area: nav;
          --color: ${PASTEL_RED};
        }
        .sidebar {
          grid-area: sidebar;
          --color: ${PASTEL_GREEN};
        }
        .main {
          grid-area: main;
          --color: ${PASTEL_BLUE};
        }
        .nav, .sidebar, .main {
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: Yahfie;
          color: var(--color);
        }
        svg {
          z-index: 1
        }
      </style>
      <div class="container">
         <div class="nav">${drawText ? 'contain: strict' : ''}</div>
         <div class="sidebar">${drawText ? 'contain: strict' : ''}</div>
         <div class="main">${drawText ? 'contain: strict' : ''}</div>
      </div>
    `
  }

  connectedCallback() {
    slideshow.on('afterShowSlide', this._onShowSlide)
  }

  disconnectedCallback() {
    slideshow.removeListener('afterShowSlide', this._onShowSlide)
  }

  _onShowSlide = (slide) => {
    const slideNode = document.querySelector(`.remark-slide-container:nth-child(${slide.getSlideIndex() + 1})`)
    const isVisible = slideNode && slideNode.contains(this.getRootNode().host)

    if (isVisible) {
      this._draw()
    }
  }

  _draw() {
    const svg = this.shadowRoot.querySelector('svg')
    if (svg) {
      svg.remove()
    }
    requestAnimationFrame(() => {
      const boxes = this.shadowRoot.querySelectorAll('.container *')
      const rects = boxes.map(_ => _.getBoundingClientRect())
      const colors = boxes.map(_ => getComputedStyle(_).getPropertyValue('--color'))
      const containerRect = this.shadowRoot.querySelector('.container').getBoundingClientRect()
      const relativeRects = rects.map(({ width, height, x, y }, i) => {
        return {
          width: width / containerRect.width,
          height: height / containerRect.height,
          x: (x - containerRect.x) / containerRect.width,
          y: (y - containerRect.y) / containerRect.height,
          stroke: colors[i]
        }
      })
      const svg = makeDom(`<svg viewBox="0 0 ${containerRect.width} ${containerRect.height}"></svg>`)
      this.shadowRoot.appendChild(svg)
      this._drawRough(relativeRects, svg, containerRect.width, containerRect.height)
    })
  }

  _drawRough (rects, svg, WIDTH, HEIGHT) {
    const bigStroke = this.getAttribute('big-stroke') === 'true'

    let strokeWidth = Math.round(HEIGHT / 250)
    if (bigStroke) {
      strokeWidth *= 2
    }

    const roughSvg = rough.svg(svg)

    const drawRect = ({x, y, width, height, stroke}) => {

      const drawX = x * WIDTH
      const drawY = y * HEIGHT
      const drawWidth = width * WIDTH
      const drawHeight = height * HEIGHT

      if (drawWidth && drawHeight) {
        roughSvg.svg.appendChild(roughSvg.rectangle(drawX, drawY, drawWidth, drawHeight, {
          stroke,
          fill: stroke.trim() + '33',
          strokeWidth,
          seed: SEED
        }))
      }
    }

    for (const rect of rects) {
      drawRect(rect)
    }

  }
})