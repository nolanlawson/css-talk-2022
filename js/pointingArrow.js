import {slideshow} from './slideshow.js';


customElements.define('pointing-arrow', class extends HTMLElement {
  constructor() {
    super()
  }

  get showPrevious () {
    return this.hasAttribute('show-previous') ? parseInt(this.getAttribute('show-previous'), 10) : 0
  }

  _onShowSlide = (slide) => {
    const slideNode = document.querySelector(`.remark-slide-container:nth-child(${slide.getSlideIndex() + 1})`)
    const isVisible = slideNode && slideNode.contains(this)

    if (isVisible) {
      requestAnimationFrame(() => {

        const index = [...slideNode.querySelectorAll('pointing-arrow')].indexOf(this)
        const tds = [...slideNode.querySelectorAll('tbody tr td:last-child')]
        tds.forEach((td, i) => {
          // safari doesn't like relative positioning on table rows, but table cells are fine
          // https://bugs.webkit.org/show_bug.cgi?id=240961
          td.classList.toggle('arrowed', i <=index && i >= (index - this.showPrevious))
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