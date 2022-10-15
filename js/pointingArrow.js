import {slideshow} from './slideshow.js';
import './popper.js'

const elementsToPoppers = new Map()

customElements.define('pointing-arrow', class extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        .arrow {
            font-size: 3rem;
            margin-left: 1rem;
        }
        .hidden {
            display: none;
        }
      </style>
      <div class="arrow">
        ⬅️
      </div>  
    `
  }

  get showPrevious () {
    return this.hasAttribute('show-previous') ? parseInt(this.getAttribute('show-previous'), 10) : 0
  }

  _onShowSlide = (slide) => {
    const slideNode = document.querySelector(`.remark-slide-container:nth-child(${slide.getSlideIndex() + 1})`)
    const isVisible = slideNode && slideNode.contains(this)

    if (isVisible) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const allArrows = [...slideNode.querySelectorAll('pointing-arrow')]
          const index = allArrows.indexOf(this)
          const tr = slideNode.querySelector(`tbody tr:nth-child(${index + 1})`)

          if (!this._popper) {
            this._popper = Popper.createPopper(tr, this, {
              placement: 'right'
            })
          }

          const showArrow = index === allArrows.length - 1
          this.shadowRoot.querySelector('.arrow').classList.toggle('hidden', !showArrow)
        })
      })
    }
  }

  connectedCallback() {
    slideshow.on('afterShowSlide', this._onShowSlide)
  }

  disconnectedCallback() {
    slideshow.removeListener('afterShowSlide', this._onShowSlide)
  }

})