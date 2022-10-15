customElements.define('stamp-text', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
      :host {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        top: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        transform: rotate(-20deg);
        text-align: center;
      }
      .stamp {
        border-radius: 2rem;
        border: 1rem solid #e00909;
        text-shadow: 0.1em 0.1em #fff, -0.1em -0.1em #fff, 0.1em -0.1em #fff, -0.1em 0.1em #fff;
        display: flex;
        flex-direction: column;
        padding: 1rem 3rem;
        /* via https://codepen.io/555/pen/pdwvBP */
        -webkit-mask-image: url("../images/grunge.png");
                mask-image: url("../images/grunge.png");
        -webkit-mask-size: 944px 604px;
                mask-size: 944px 604px;
        mix-blend-mode: multiply;
      }
      .slot-wrapper {
        flex: 1;
        color: #e00909;
        font-size: 8rem;
        font-weight: bold;
        font-family: monospace;
      }
      </style>
      <div class="stamp">
        <div class="slot-wrapper">
          <slot></slot>
        </div>
      </div>
    `
  }
})