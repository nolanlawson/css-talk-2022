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

// via https://stackoverflow.com/a/8076436/680742
export const hashCode = (string) => {
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i);
    hash = ((hash<<5)-hash)+code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}