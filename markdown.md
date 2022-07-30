class: center, middle

# CSS runtime performance

## Nolan Lawson, 2022

???

Notes

---

# Target audience

- Performance engineers
- Framework authors
- Folks working on large apps
- Anyone interested in how browsers work

???

Notes

---

# Introduction

```css
div {
*  color: brown;
   background-color: red;
}
```

```js
console.log('foo')
*console.log('bar')
```

???
Notes