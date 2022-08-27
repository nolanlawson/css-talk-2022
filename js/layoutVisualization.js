// 16.9 ratio
import {drawCenteredSvgText, loadFontsPromise, makeDom} from './utils.js';
import {rough} from './rough.js';
import {PASTEL_BLUE, PASTEL_GREEN, PASTEL_RED} from './colors.js';
import {STROKE_WIDTH} from './constants.js';

const WIDTH = 1920
const HEIGHT = 1080

const MARGIN = 40

customElements.define('layout-visualization', class extends HTMLElement {
  constructor() {
    super()

    const svg = makeDom(`<svg viewBox="0 0 ${WIDTH} ${HEIGHT}"></svg>`)
    this.attachShadow({mode: 'open'}).innerHTML = `
      <style>
        svg text {
          font-size: 2em;
          font-family: Yahfie;
          fill: #000;
        }
      </style>
    `

    this.shadowRoot.appendChild(svg)

    this._draw()
  }

  async _draw () {

    await loadFontsPromise

    const version = parseInt(this.getAttribute('version') || '1', 10)
    const bigStroke = this.getAttribute('big-stroke') === 'true'

    const strokeWidth = bigStroke ? (STROKE_WIDTH * 8) : (STROKE_WIDTH * 2)

    const svg = this.shadowRoot.querySelector('svg')
    const roughSvg = rough.svg(svg)

    const calculateDrawSizes = ({ x, y, width, height}) => {
      const doubleMargin = MARGIN * 2
      const actualWidth = WIDTH - doubleMargin
      const actualHeight = HEIGHT - doubleMargin

      const drawX = (x * actualWidth) + MARGIN + (x === 0 ? 0 : (MARGIN / 2))
      const drawY = (y * actualHeight) + MARGIN + (y === 0 ? 0 : (MARGIN / 2))
      const drawWidth = (width * actualWidth) - (width === 1 ? 0 : (MARGIN / 2))
      const drawHeight = (height * actualHeight)- (height === 1 ? 0 : (MARGIN / 2))

      return {
        drawX,
        drawY,
        drawWidth,
        drawHeight
      }
    }

    const drawRect = (x, y, width, height, stroke) => {

      const {
        drawX,
        drawY,
        drawWidth,
        drawHeight
      } = calculateDrawSizes({ x, y, width, height })

      roughSvg.svg.appendChild(roughSvg.rectangle(drawX, drawY, drawWidth, drawHeight, {
        stroke,
        fill: stroke + '33',
        strokeWidth
      }))
    }

    const drawText = (x, y, width, height) => {
      const {
        drawX,
        drawY,
        drawWidth,
        drawHeight
      } = calculateDrawSizes({ x, y, width, height })

      roughSvg.svg.appendChild(
        drawCenteredSvgText({
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
          label: 'contain: content'
        })
      )
    }

    const sidebarWidth = version === 2 ? 0.2 : 0.4

    const rects = [
      [0, 0, 1, 0.2, PASTEL_RED],
      [0, 0.2, sidebarWidth, 0.8, PASTEL_GREEN],
      [sidebarWidth, 0.2, 1 - sidebarWidth, 0.8, PASTEL_BLUE]
    ]

    for (const rect of rects) {
      drawRect(...rect)
      if (version === 3) {
        drawText(...rect)
      }
    }

  }
})