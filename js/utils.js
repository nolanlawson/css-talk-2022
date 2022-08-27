export const makeDom = str => {
  const template = document.createElement('template')
  template.innerHTML = str
  return template.content.children[0]
}

export const uniq = array => {
  const result = []
  const set = new Set()
  for (const item of array) {
    if (!set.has(item)) {
      set.add(item)
      result.push(item)
    }
  }
  return result
}

export const drawCenteredSvgText = ({ x, y, width, height, className, label }) => {
  const svg = makeDom(`<svg>
    <g>
      <rect x=${x} y=${y} width=${width} height=${height} style="stroke: none; fill: none;" />
      <text class="${className || ''}" 
            x="${x + width / 2}" 
            y="${y + height / 2}" 
            dominant-baseline="middle" 
            text-anchor="middle"
      >${label}</text>
    </g>
  </svg>`)

  return svg.querySelector('g')
}

export const loadFontsPromise = (async () => {
  const fontFace = new FontFace('Yahfie', "url('./fonts/yahfie/Yahfie-Heavy.ttf')");
  const font = await fontFace.load()
  document.fonts.add(font)
})()