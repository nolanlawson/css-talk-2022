import './remark.min.js'

export const slideshow = remark.create({
  sourceUrl: './markdown.md',
  highlightLanguage: 'javascript',
  highlightLines: true,
  highlightStyle: 'solarized-light',
});