import './remark.min.js'

export const slideshow = remark.create({
  ratio: '16:9',
  sourceUrl: './markdown.md',
  highlightLanguage: 'javascript',
  highlightLines: true,
  highlightStyle: 'solarized-light',
});