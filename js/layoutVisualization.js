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
    this._drawText = this.getAttribute('draw-text')
    this._drawMoreBoxes = this.getAttribute('draw-more-boxes') === 'true'
    this._drawMoreBoxesText = this.getAttribute('draw-more-boxes-text') === 'true'
    this._textVersion = parseInt(this.getAttribute('text-version') || '1', 10)
    this._drawDropdown = this.getAttribute('draw-dropdown') === 'true'
    this._truncateDropdown = this.getAttribute('truncate-dropdown') === 'true'

    const {
      _version: version,
      _drawText: drawText,
      _drawMoreBoxes: drawMoreBoxes,
      _drawMoreBoxesText: drawMoreBoxesText,
      _textVersion: textVersion,
      _drawDropdown: drawDropdown,
      _truncateDropdown: truncateDropdown
    } = this

    const drawTexts = drawText ? drawText.split('|') : Array(3).fill().map(() => '')

    const navDropdown = `<div class="dropdown ${truncateDropdown ? 'truncated' : ''}">${truncateDropdown ? '' : '☰'}</div>`
    const navInner = (drawMoreBoxes
      ? Array(6).fill().map(() => `<div></div>`).join('')
      : drawTexts[0]) + (drawDropdown ? navDropdown : '')


    const sidebarInner = drawMoreBoxes
      ? Array(12).fill().map(() => `<div></div>`).join('')
      : drawTexts[1]

    const mainTextBoxes = !drawMoreBoxesText
    ?  `
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      `
      : (textVersion === 1
      ? `
        <div>lorem</div>
        <div>ipsum</div>
        <div>dolor</div>
        <div>sit</div>
        <div>amet</div>
      `
      : `
        <div><div class="long hidden">loremipsumdolorsitametconsecteturadipiscingelitseddoeiusmodtemporincididuntutlaboreetdoloremagnaaliquautenimadminimveniamquisnostrudexercitationullamcolaborisnisiutaliquipexeacommodoconsequatduisauteiruredolorinreprehenderitinvoluptatevelitessecillumdoloreeufugiatnullapariaturexcepteursintoccaecatcupidatatnonproidentsuntinculpaquiofficiadeseruntmollitanimidestlaborum</div></div>
        <div>ipsum</div>
        <div>dolor</div>
        <div>sit</div>
        <div>amet</div>
      `)

    const mainInner = drawMoreBoxes ? mainTextBoxes : drawTexts[2]

    const moreStyles = drawMoreBoxes ?  `
      .main {
        display: flex;
        flex-direction: column;
      }
      .main > * {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow-x: hidden;
      }
      .long {
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        text-overflow: ellipsis;
        width: 0;
        max-width: 100%;
        word-wrap: break-word;
        white-space: nowrap;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding: 0 20px;
      }
      .nav {
        display: flex;
      }
      .nav > * {
        flex: 1;
        height: 100%;
      }
      .sidebar {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
      }
      .sidebar > * {
        width: 100%;
        height: 100%;
      }
    ` : ''

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
        .nav {
          position: relative;
        }
        .dropdown {
          z-index: 1;
          position: absolute;
          top: 100%;
          right: 2.5%;
          width: 7.5%;
          height: 125%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2em;
        }
        .dropdown.truncated {
          height: 20px;
        }
        ${moreStyles}
      </style>
      <div class="container">
         <div class="nav">${navInner}</div>
         <div class="sidebar">${sidebarInner}</div>
         <div class="main">${mainInner}</div>
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
      const boxes = this.shadowRoot.querySelectorAll('.container :not(.hidden)')
      const rects = boxes.map(_ => _.getBoundingClientRect())
      const colors = boxes.map(_ => getComputedStyle(_).getPropertyValue('--color'))
      const zIndexes = boxes.map(_ => parseInt(getComputedStyle(_).zIndex, 10) || 0)
      const containerRect = this.shadowRoot.querySelector('.container').getBoundingClientRect()
      const relativeRects = rects.map(({ width, height, x, y }, i) => {
        return {
          width: width / containerRect.width,
          height: height / containerRect.height,
          x: (x - containerRect.x) / containerRect.width,
          y: (y - containerRect.y) / containerRect.height,
          stroke: colors[i],
          zIndex: zIndexes[i]
        }
      }).sort((a, b) => (a.zIndex < b.zIndex ? -1 : a.zIndex === b.zIndex ? 0 : 1))
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