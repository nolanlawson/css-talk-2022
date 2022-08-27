function generateHslaColors (saturation, lightness, alpha, amount) {
  let colors = []
  let huedelta = Math.trunc(360 / amount)

  for (let i = 0; i < amount; i++) {
    let hue = i * huedelta
    colors.push(`hsla(${hue},${saturation}%,${lightness}%,${alpha})`)
  }

  return colors
}



export const LIGHT_YELLOW = 'rgba(255, 255, 0, 0.4)'

export const DARK_YELLOW = 'rgb(187,187,13)'

export const DARK_RED = 'rgba(255, 15, 80, 1)'

export const PASTEL_RED = '#ff9d92'
export const PASTEL_GREEN = '#c3d88b'
export const PASTEL_BLUE = '#95b7e8'

export const DARK_GRAY = '#666666'