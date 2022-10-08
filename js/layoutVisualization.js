// 16.9 ratio
import {drawCenteredSvgText, makeDom} from './utils.js';
import rough from './rough.js';
import {PASTEL_BLUE, PASTEL_GREEN, PASTEL_RED} from './colors.js';
import {SEED, STROKE_WIDTH} from './constants.js';

const WIDTH = 1920
const HEIGHT = 1080

customElements.define('layout-visualization', class extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({mode: 'open'}).innerHTML = `
      <style>
        .container { 
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-areas: "nav     nav"
                               "sidebar main";
          grid-template-columns: 1fr 2fr;
          grid-template-rows: 1fr 5fr;
        }
        .nav {
          grid-area: nav
        }
        .sidebar {
          grid-area: sidebar
        }
        .main {
          grid-area: main
        }
        svg {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          z-index; 1;
        }
      </style>
      <div class="container">
         <div class="nav"></div>
         <div class="sidebar"></div>
         <div class="main"></div>
      </div>
    `

    const svg = makeDom(`<svg viewBox="0 0 ${WIDTH} ${HEIGHT}"></svg>`)
    this.shadowRoot.querySelector('.container').appendChild(svg)

    requestAnimationFrame(() => {
      const boxes = this.shadowRoot.querySelectorAll('.container *')
      const rects = boxes.map(_ => _.getBoundingClientRect())
      const containerRect = this.shadowRoot.querySelector('.container').getBoundingClientRect()
      const relativeRects = rects.map(({ width, height, x, y }) => ({
        width,
        height,
        x: x - containerRect.x,
        y: y - containerRect.y
      }))
      this._drawRough(relativeRects, svg)
    })
  }

  async _drawRough (rects, svg) {
    const version = parseInt(this.getAttribute('version') || '1', 10)
    const bigStroke = this.getAttribute('big-stroke') === 'true'

    const strokeWidth = bigStroke ? (STROKE_WIDTH * 8) : (STROKE_WIDTH * 2)

    const roughSvg = rough.svg(svg)

    const drawRect = ({x, y, width, height, stroke}) => {

      roughSvg.svg.appendChild(roughSvg.rectangle(x, y, width, height, {
        stroke,
        fill: stroke + '33',
        strokeWidth,
        seed: SEED
      }))
    }
    //
    // const drawText = (x, y, width, height) => {
    //   const {
    //     drawX,
    //     drawY,
    //     drawWidth,
    //     drawHeight
    //   } = calculateDrawSizes({ x, y, width, height })
    //
    //   roughSvg.svg.appendChild(
    //     drawCenteredSvgText({
    //       x: drawX,
    //       y: drawY,
    //       width: drawWidth,
    //       height: drawHeight,
    //       label: 'contain: strict'
    //     })
    //   )
    // }


    for (const rect of rects) {
      drawRect({...rect, stroke: strokeWidth})
    }

  }
})