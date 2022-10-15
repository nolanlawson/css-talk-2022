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
        transform: rotate(-25deg);
      }
      .stamp {
        border-radius: 2rem;
        border: 1rem solid #e00909;
        text-shadow: 0.1em 0.1em #fff, -0.1em -0.1em #fff, 0.1em -0.1em #fff, -0.1em 0.1em #fff;
        background: rgba(255, 255, 255, 0.3);
      }
      ::slotted(*) {
        color: #e00909;
        padding: 3rem;
        font-size: 8rem;
        font-weight: bold;
        font-family: monospace;
      }
      </style>
      <div class="stamp">
        <slot></slot>
      </div>
    `
  }
})