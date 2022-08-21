class: center, middle

# CSS runtime performance

## Nolan Lawson, 2022

.muted[Press <kbd>P</kbd> for speaker notes]

???

Hi, my name is Nolan Lawson and today I'd like to talk to you about CSS runtime performance.

---

.center[![TODO](./images/devtools1.png)]

--
.left[
JavaScript
<br/>
(yellow part)
]

--
.right[
<br/>
Style/Layout
(purple part)
]

???

If you're like me, you've spent a lot of time looking at performance traces like this one (in the Chrome DevTools).

And there are two main parts here: the yellow (JavaScript) part, and the purple (style/layout) part.

I think a lot of us look at the JavaScript side of this equation and feel pretty comfortable with it. In there there
are function names we recognize. We see our JavaScript framework doing work, we see our state library crunching data.


But a lot of us probably look at the purple part and think, "Well, that's just the browser doing browser things." I
couldn't possibly understand what that's about.

But the thing is, sometimes that purple part is pretty big. And as it turns out, there _are_ ways to understand what's
going on in there. In this talk, I'd like to shed some light about the "purple part," and give you some tools for
understanding what the browser is doing in there.

---

# Target audience

--
- Performance engineers

--
- Framework authors

--
- Folks working on large web apps

--
- Anyone interested in how browsers work

???

Now first off, I should mention who this talk is for. I'm going to go into a lot of details, and these details aren't
going to be relevant to anyone. What I'm going to cover is mostly going to be interesting to people who deal with
performance all the time, so they're responsible for every part of the performance of their app, including style and layout.
I'm also targeting authors of frameworks and design systems, since their decisions may be multiplied several times, so
it's important to get all the details right. I'm also speaking to people working on large web apps – static content sites
usually don't have performance problems iwth style/layout. I'm also speaking to anyone interested in how browsers work;
some of this stuff is just plain interesting!

---

# How browsers render

.center[![TODO](./images/pixel-pipeline.png)]

???


To understand the purple part, we first need to start with how browsers render content. This process is called
["updating the rendering"](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering) in the HTML spec.

This graphic is taken from a blog post on web dot dev where they call it "the pixel pipeline."

You can see that the main steps described here are JavaScript, style/layout, and paint/composite. Helpfully, these
are color-coded in the same way they would be in the Chrome DevTools.

The first step, JavaScript, is where we run some JavaScript that modifies the DOM. Typically this will be your JavaScript
framework rendering, such as React doing its virtual DOM diffing and then eventually putting elements into the DOM.

The next two steps, style and layout, involve applying your CSS to those DOM elements.This is the main thing I want to focus on in this talk.

The last two steps, paint and composite, are about actually writing pixels to the screen and doing animations. I don't want to focus much on these steps (the green part), but I will mention them briefly just to separate them from the purple part.

---

# How browsers render

.center[![TODO](./images/pixel-pipeline-style-layout.png)]

???

Let's focus on the style/layout part

---

.center[![TODO](./images/pixel-pipeline-style-layout.png)]

--
- Style
  - Figuring out which CSS rules apply to which elements

--
- Layout
  - Figuring out how to lay those elements out on the page

???

So let's break down style and layout calculation first. These are two separate steps.

The input of these steps is the state of the DOM – all the CSS rules and DOM nodes.

The output of these steps is the "layout tree" (or "render tree"), and that's the thing
that is passed to the paint (green) step that actually lays out pixels on the screen.

If you take nothing else from my talk, I want you to understand that these are two separate steps, and they
can be slow for two completely different reasons. If your style is slow but you're focused on layout, then
you're chasing ghosts, and vice versa.

---

.center[![TODO](./images/pixel-pipeline-style.png)]

```css
h1 {
  padding: 5px;
}
h2 {
  padding: 10px;
}
```

```html
<h1>Hello</h1>
<h2>World</h2>
```

???

So style calculation is about figuring out which elements have which CSS rules. So let's take a simple example.

In this case, we have a 5px-padding h1 and a 10px-padding h2. So style calculation is the process of figuring out that

---

.center[![TODO](./images/pixel-pipeline-style.png)]

```css
h1 {
* padding: 5px;
}
h2 {
  padding: 10px;
}
```

```html
*<h1>Hello</h1>
<h2>World</h2>
```

???

this h1 is red and 

---

.center[![TODO](./images/pixel-pipeline-style.png)]

```css
h1 {
  padding: 5px;
}
h2 {
* padding: 10px;
}
```

```html
<h1>Hello</h1>
*<h2>World</h2>
```

???

this h2 is blue. I'm simplifying some stuff, but this is mostly what style calculation is about.

In this case, it's about applying the CSS selectors, and figuring out that `h1` refers to the `<h1>` element,
and `h2` refers to the `<h2>` element.

So in a sense, it's almost as if the browser is taking this page, and turning it into this one:

---

.center[![TODO](./images/pixel-pipeline-style.png)]

```html
<h1 style="padding: 5px;" >Hello</h1>
<h2 style="padding: 10px;">World</h2>
```

???

Conceptually, this is what style calculation is: it's giving us the same page we would have had if we had used
inline styles.

---

# Inline styles == no style cost?

--
```html
<div style="padding: 5px; margin: 10px; display: flex">
  <div style="flex: 1; color: blue">
    Inline all the things?
  </div>
</div>
```

???

Now if you're really clever, you may look at this and think, wait, is he saying that, if I use inline styles all over
the place, my style costs go to zero?

And actually yeah, that's basically what I'm saying. Now there are other parts of style calculation that come into play
here, like inheritance, custom properties, counters, etc., but 99% of your style costs go away if you only use inline styles.

So you may be tempted to "inline all the things."

However, if you did this, you would probably end up with a lot of repeated styles all over the place, so you would pay
for it in terms of extra HTML parsing. And it would be harder to maintain. So I'm not advocating this. CSS is pretty good.

---

.center[![TODO](./images/pixel-pipeline-layout.png)]

--
```html
<h1 style="padding: 5px;" >Hello</h1>
<h2 style="padding: 10px;">World</h2>
```

???

Now let's move on to layout. Note that, with style, at no point were we talking about the geometry of the page.
Style calculation has nothing to do with where things actually go geometrically on the page; that's the job of layout
calculation.

So recall we have our h1 and h2 where the browser has (somehow) figured out that one has 5px padding and the other
has 10px padding (either because our styles are inline or because it ran style calcuation).

---

class: contain-vertical

.center[![TODO](./images/helloworld1.png)]


???

Now we finally get to the geometry of the page. Layout calculation is where the styles, which have been associated with
each element, actually get applied. In this case, the browser figures takes the margin, padding, font size, and
figures out where to actually place things within the given browser window, with text wrapping and all that good stuff.

---

class: contain-vertical

.center[![TODO](./images/helloworld2.png)]

---

class: contain-vertical

.center[![TODO](./images/helloworld3.png)]

???

Again, note that here we're actually talking about the geometry of the page. That's what layout is about.

---

# What slows down style/layout

|                                 | Style | Layout |
|---------------------------------|:-----:|:------:|
| Complexity of CSS selectors     |   ✅   |   ❌    |
| Complexity of layout            |   ❌   |   ✅    |
| Size/depth of DOM               |   ✅   |   ✅    |
| Repeated re-renders (thrashing) |   ✅   |   ✅    |

???

At a high level, if you're seeing a large amount of time spent in style or layout, it usually comes down to one of these four things.

Either your CSS selectors are too complex, or there are a lot of them, which slows down style calculation. Note this has no effect on layout calculation.

Or your layout itself, i.e. the geometry of the page, is very large or complex, which slows down layout calculation. Note this has no effect on style calculation.

Or your DOM is very large, or you are doing repeated re-renders, which slows down both style and layout.

This is a lot to unpack, so let's go over each of these points.

---

# Style vs layout performance

These are not the same!

.center[![TODO](./images/style-layout-1.png)]

.center[![TODO](./images/style-layout-2.png)]

???

Now first off, when you're looking at a perf trace, it's important to understand whether you primarily have a
problem with style calculation, layout calculation, or both. Because these two traces are not the same!

These two look the same on the surface because they're both purple. But in one trace, we have massive style costs and
very little layout cost, and in the other, we have small style costs but large layout costs. The causes of slowness
in these two cases is very different, and if you confuse them, then you can very easily go down the wrong track.

# Style vs layout performance

```css
h1 {
  padding: 5px;
}
h2 {
  padding: 10px;
}
```

???

So conceptually, how can we think about the performance implications of style versus layout? What makes one slow
versus the other?

---

# Style vs layout performance

```css
*h1 {
  padding: 5px;
}
*h2 {
  padding: 10px;
}
```

???

Well, speaking in generalities, we can say that style calculation is about the part outside of the braces (i.e. selectors that locate elemenets on the page)

---

# Style vs layout performance

```css
h1 {
* padding: 5px;
}
h2 {
* padding: 10px;
}
```

???

Whereas layout calculation is about the part inside of the braces (i.e. the rules that actually place things geometrically on the page).

---

# Style performance

```css
*h1 {
  padding: 5px;
}
*h2 {
  padding: 10px;
}
```

???

To understand style vs layout performance a bit more, we need to go into detail on how each one works. Let's start with style. Remember: this
is the part outside of the braces.

---

# Style performance

> "For most websites I would posit that selector performance is not the best area to spend your time trying to find performance optimizations."

.muted.right[– Greg Whitworth, via [Enduring CSS](https://ecss.benfrain.com/) by Ben Frain (2016)] 

???

Now first off, I want to clear a bit of a misunderstanding. There's a very common refrain in the web development community that CSS selector performance "doesn't matter" or you shouldn't worry about it. Here is one representative quote from my colleague Greg Whitworth, but there are others.

Now to be clear, this is probably true for most sites. However, sometimes you have a large webapp with a lot of CSS, or sometimes your framework or design system may have a flaw that repeats some unperformant CSS selectors all over the place.

The proof is in the pudding: if you profile your site and you see large style costs, like in the trace I showed above, then you have a CSS selector problem, full stop. So sure, don't prematurely overoptimize, but if you recognize you have a problem, then it's time to solve it.

- https://calendar.perfplanet.com/2011/css-selector-performance-has-changed-for-the-better/
- https://calibreapp.com/blog/css-performance
- https://ecss.benfrain.com/appendix2.html

---

# Style performance

```js
for (const element of page) {
  for (const rule of cssRules) {
    if (matches(element, rule)) {
      applyStyles(element, rule)
    }
  }
}
```

--
.center[_O(n * m)_]

???

To understand style performance, first it's important to note how browsers actually implement their style engines, so you can understand the kinds of optimizations they have in place so that we don't have to worry about style performance most of the time.

To illustrate, let's imagine we're building a browser. Here is a naive implementation of style calculation that we might have. Raise your hand if you think this is what browsers actually do? 

Of course not, this is an `O(n * m)` operation, where `n` is the number of elements and `m` is the number of CSS rules. On any reasonably-sized page,
the browser would slow to a crawl.

---

class: fill-custom

<example-1></example-1>

???

For example, let's look at a simple DOM tree. In this case, the selector is `.foo` and we want to find all the nodes
whose class is `foo`.

---


class: fill-custom

<example-1 animate="true"></example-1>

???


If we were doing the naive approach, then the browser would have to walk through the entire DOM just to find the `foo` nodes.

You can see how this would be inefficient, especially given it has to be run for every rule on the page, and every time
the DOM changes!

---

# Style optimization 1: hash maps

- Tag name (`div`, `button`)
- ID (`#foo`, `#bar`)
- Class (`.foo`, `.bar`)

???

So let's look at the first optimization browsers have, which is pretty straightforward. Rather than looking for
every DOM element that has a class, or an ID, or a given tag name, let's keep a lookup of tag names, IDs, and classes
to elements.

If you're not familiar with a hashmap, think of it as a Map of strings to some list of DOM elements.

This is pretty reasonable, because tag names for an element never change, and IDs and classes are pretty small and simple most of the time.

---

class: fill-custom

<example-1 animate="true" strategy="instant"></example-1>

???

As you can see, this has a big impact of the efficiency of our algorithm. Rather than checking all nodes, we can
find the two `foo` nodes in constant time, thanks to the hashmap.

---

class: fill-custom

<example-2></example-2>

???

Now, there's still a problem with our algorithm. What about descendant selectors? In this case, we have `.foo .bar`, so
we're trying to find all the `.bar` elements inside of a `.foo` element.

---

class: fill-custom

<example-2 animate="true" strategy="naive-descendant"></example-2>

???

Thanks to the hashmap, we can instantly find the `.foo` elements. But we still need to walk to find all the `.bar`
elements inside of those `.foo` elements. This involves walking a lot of DOM nodes!

---

# Style optimization 2: right-to-left

```css
.foo .bar {}
```

???

So here's another optimization we can do. How about instead of walking from the left to the right, we evaluate the
selector from _right to left_?

---

class: fill-custom

<example-2></example-2>

???

Here is our same DOM tree from before.

---

class: fill-custom

<example-2 animate="true" strategy="naive-ancestor"></example-2>

???

It turns out we check a lot fewer DOM nodes this way.

You may have heard that browser engines evaluate CSS selectors from right to left. If you've ever wondered why,
this is the reason! Any given node in the DOM tree tends to have fewer ancestors than descendants, so this optimization
works out really well for most DOM trees.

---

# Problem: generic descendants

```css
.foo div {}
```

???

This right-to-left technique works out pretty well. But we have another problem. What about selectors like this one?

---

class: fill-custom

<example-3 show-tags="true"></example-3>

???

Consider this DOM tree, where we have a lot of divs and want to find `.foo div`.

---

class: fill-custom

<example-3 show-tags="true" animate="true" strategy="naive-ancestor"></example-3>

???

With the right-to-left technique, we're able to instantly find every `div` (thanks to the hashmap), but we have
to crawl up the entire ancestor chain every time just to find `.foo`. So this is one of those cases where it would
have been faster for us to go left-to-right.

But we just established that left-to-right is pretty slow most of the time, since DOM nodes tend to have more
descendants than ancestors, just due to the shape of the tree. So how can we solve this?

---

# Style optimization 3: Bloom filter

> "We stole the Bloom filter from [WebKit]. The idea is to optimize cases where the page author writes a descendant combinator and the thing to the [right-hand side] matches a lot, e.g. `.foo div`."

.muted.right[– Boris Zbarsky (Mozilla), via [Servo meeting notes](https://github.com/servo/servo/wiki/Css-selector-matching-meeting-2013-07-19) (2013)] 

---

# Bloom filter

.center[![TODO](./images/bloom-filter.svg)]

???

So how does the Bloom filter work? Basically, you can think of it as a Hash Set that may give false positives, but never gives false negatives. The main thing is, it's very fast, so it can be used widely.

In this example, we have x, y, and z, which (let's say) are CSS classes. Each of those strings is hashed and then bits are flipped in the Bloom filter from 0 to 1. If we want to check if the Bloom filter contains x, we hash x again and check up the 1s. Now, because we're spraying 1s all over the place, this might also match some other string. So that's a false positive. But it's a tradeoff we're willing to make since this data structure is so fast.

Taken from https://commons.wikimedia.org/wiki/File:Bloom_filter.svg

---

class: fill-custom

<example-3 show-tags="true" show-bloom-filter="true"></example-3>

???

How does this work in the DOM tree? Well basically, the browser keeps a little Bloom filter hash on each node of its parents'
tag name, IDs, and classes.

This means that if we're on `div`, and we want to figure out if `.foo` is an ancestor, then we don't have to walk up the tree – we know
instantly, because `.foo` is in the Bloom filter.

---

class: fill-custom

<example-3 show-tags="true" show-bloom-filter="true" animate="true" strategy="instant"></example-3>

???

So now we can basically instantly find the `.foo div`s, assuming we don't get false positives in the Bloom filter.

And hey, if we do get false positives, then we just fall back to crawling up the DOM tree. Assuming the Bloom filter is
tuned correctly, this shouldn't happen too frequently, so it won't dramatically affect page performance.

---

# Browser style optimizations

- WebKit CSS JIT Compiler (2014)
- Firefox Stylo (2017)
- WebKit making `:has` happen (2022)

???

Now, there are many more browser style optimizations than what I've mentioned here. Here are a few more (and I have links in my slide nodes).

My goal in telling you all this is not to tell you to use this CSS selector or this other one. That information could quickly become outdated.
My goal instead is to give you an appreciation for all the work a browser has to do to do style calculation. So when you see high style
calculation costs, you understand that a browser is doing something like this.

So now, knowing a bit more about how browsers work under the hood, what can we as web developers do if we see high style
calculation costs?

Notes:

- https://webkit.org/blog/3271/webkit-css-selector-jit-compiler/
- https://hacks.mozilla.org/2017/08/inside-a-super-fast-css-engine-quantum-css-aka-stylo/
- https://webkit.org/blog/13096/css-has-pseudo-class/

---

# Remove unused CSS

.center[![TODO](./images/unused-css.png)]

???

Well, one thing you can do to reduce style calculation costs is to remove unused CSS.

This is a really important point, because it's an area where unused CSS is actually different from unused JavaScript. Both cost you
in terms of transfer time, and JavaScript costs you in terms of parse and compile time, but unused CSS costs you in terms of parse, compile, _and_
in making all of your style calculations slower. After all, the browser doesn't _know_ your selectors are unused until it runs the algorithm! This can actually end up costing you multiple times over the lifetime of your page for every style recalculation, or in cases of layout thrashing (which I'll get to later).

So trim that unused CSS!

---

# Avoid excessive complexity in selectors

```css
:not([foo^="bar"]) div:nth-of-type(2n) :nth-child(3) > * ~ * {}
```

???

Now, I don't want to get too deep into this, because again, it's hard to predict these kinds of things. But just don't use selectors like these.
And if you think I'm exaggerating, the thing is that it's pretty easy to generate stuff like this if you're not careful. Using tools like SASS
and LESS, it's really easy to deeply nest things, or to have zany for-loops that generate all sorts of `:nth-child()` selectors. One or two
of these will probably not wreck your page's performance, but in aggregate, these can do a lot of damage.

---

## Rough selector cost estimate

| ~Cost | Type            | Example                                    |
|--|-----------------|--------------------------------------------|
| ✅ | ID, class, tag  | `#id`, `.cls`, `a`                         |
| ⚠️| Descendant      | `.foo .bar`, `.foo > .bar`                 |
| ⚠️| Attribute       | `[foo]`                      |
| 🌶️️| Attribute value | `[foo="bar"]`, `[foo~="bar"]`              |
| 🌶️ | Sibling         | `.foo ~ bar`, `.foo + .bar`                |
| 🌶️ | Pseudo-class    | `:nth-of-type()`, `:not()`, `:nth-child()` |

???

In general, browsers have optimized for things like tag names, IDs, and classes. Attributes are also fairly optimized, although less so.
Excessive combinators can cost you. Sibling selectors are also less optimized. And fancier stuff like `:nth-child()` and `:nth-of-type()` is less optimized.

Again, I can't provide hard-and-fast rules, but the intuition you should have is that IDs, classes, and tag names will always be fast, and other stuff you should be cautious with. And again, most of this stuff doesn't matter in isolation, but it does matter if you're building a framework
where rules might be repeated multiple times on the page.

More details (although I quibble with some of the rankings): https://www.sitepoint.com/optimizing-css-id-selectors-and-other-myths/

---

# Use Shadow DOM

```html
<my-component>
  #shadow-root
    <style>
      div { color: red }
    </style>
    <div>Hello!</div>
</my-component>
```

???

Shadow DOM is interesting because it encapsulates styles. They don't bleed in and out of the shadow root.

So this actually means that any expensive selectors you may have outside of this component don't need to be calculated for
elements inside of the shadow root. And any expensive selectors _inside_ of this component also don't need to be calculated
for elements outside of it.

Effectively, this cuts down the number of elements and rules that a browser needs to check against each other.

---

.center[![TODO](./images/style-perf-chart.png)]

???

I have a whole blog post going into the details on this. Basically you should just observe that shadow DOM (the yellow one)
is always much smaller than the other ones.

Firefox is incredibly fast because of their Stylo engine. If every browser were like Firefox, then I wouldn't have much
material for this part of the talk! This is what makes me optimistic that, someday, we'll be able to use whatever zany
selectors we want, and it won't matter much for web performance, even on web apps with tons of CSS.

https://nolanlawson.com/2022/06/22/style-scoping-versus-shadow-dom-which-is-fastest/

---

# Style/layout performance

```html
<div>
  <div>
    <div>
      <div>
        !-- Big DOM tree! -->
      </div>
    </div>
  </div>
</div>
```

???

Both of them are also going to be affected by the number of DOM elements on the page. A larger DOM means more for the browser
to do, in terms of both style and layout. This is why techniques such as virtualization are good at improving both style
and layout performance.

---

# Layout thrashing

```js 
for (const el of elements) {
  const width = el.parentElement.offsetWidth
  el.style.width = width + 'px'
}
```

???

Another important topic is layout thrashing, which affects both style and layout costs.

Layout thrashing is a situation where, in a loop, you're both reading from the DOM's style and writing to the DOM's styles. This
forces the browser to re-run style and layout repeatedly.

---

# Layout thrashing

```js
for (const el of elements) {
* const width = el.parentElement.offsetWidth
  el.style.width = width + 'px'
}
```

???

So in this case here we are reading from the DOM

---

# Layout thrashing

```js
for (const el of elements) {
  const width = el.parentElement.offsetWidth
* el.style.width = width + 'px'
}
```

???

And here we are writing to the DOM

---

.center[![TODO](./images/thrashing.png)]

???

The telltale sign that this is happening is this kind of thing in the Dev Tools. Note the repeated sections of purple
style and layout, and the warning about "forced reflow." (Reflow is another name for layout.)

---

# Solving layout thrashing

```js
// All the reads
const widths = elements.map(el => el.parentElement.offsetWidth)

// All the writes
elements.forEach((element, i) => {
  element = widths[i] + 'px'
})
```

???

In these cases, it's better to batch your reads and writes together, so that you do all the reads at once, followed
by all the writes. This ensures you only at most pay for style calculation twice – once during the reads, and again during
the writes.

---

# Solving layout thrashing

.center[![TODO](./images/no-thrashie.png)]

???

If you do this correctly, then you should see one big style/layout cost (or at most two) rather than multiple. This allows
the browser to be more efficient because it's doing all the calculations at once rather than piece by piece.

Or in many cases, you should probably do your layout in CSS rather than JavaScript! This will avoid this cost entirely.

[Demo](https://bl.ocks.org/nolanlawson/raw/6a4e514d16331594bef2d4b9ee91f150/)

---

# Don't be misled

.center[![TODO](./images/not-thrashing1.png)]

???

Now note that the DevTools can be misleading. They warn you about "forced reflow" _anytime_ you use one of [the APIs that force style/layout](https://gist.github.com/paulirish/5d52fb081b3570c81e3a), such as `getBoundingClientRect` or `offsetWidth`. But if you're only reading from the DOM once,
then it's almost useless to eliminate that call; you're just moving the costs later to when the browser would normally
run its style/layout loop.

---

# Don't be misled

.center[![TODO](./images/not-thrashing2.png)]

???

See look, here we've gone through a lot of effort to remove that `getBoundingClientRect` call. And the Chrome DevTools
have rewarded us! Our "Recalculate style" doesn't have a little red triangle with a warning anymore.

But the result is exactly the same. All we did was move the style/layout costs from the `getBoundingClientRect` to
the browser's rendering loop. The total time spent is the same. So this DevTools warning can be very misleading.

[Demo](https://nolanlawson.github.io/measure-style-and-layout/)