class: center, middle

# CSS runtime performance

## Nolan Lawson, 2022

.muted[Press <kbd>P</kbd> or <toggle-presenter-mode>click here</toggle-presenter-mode> for speaker notes]

???

Hi, my name is Nolan Lawson and today I'd like to talk to you about CSS runtime performance.

---

class: contain-vertical

.center[![TODO](./images/nolanlawson.png)]

???

First off, who am I?

Most likely if you've seen me on the internet, it's from [my blog](https://nolanlawson.com) where I talk about performance, accessibility, and
various web development topics.

I was on the Microsoft Edge performance team for a couple years, then moved to the performance team at Salesforce,
and now I work on Lightning Web Components at Salesforce, which is our JavaScript framework.

---

class: contain-vertical

.center[![TODO](./images/stickshift.jpg)]

???

I'd like to start off with a story. When I was learning to drive as a teenager, my car was a stick shift (manual transmission).
These are much more common in Europe than in the U.S., but growing up in the Seattle area, this is what I had.

It was really difficult! But one thing I like about manual transmissions is that you feel more in tune with what the car
is doing. Based on the sounds of the engine and how the car reacted to my actions, I developed a "feel" for when to shift
from one gear to another, or how to do things like "engine braking," which can
actually be a [more efficient way to use fuel](https://jalopnik.com/here-is-when-engine-braking-can-save-more-gas-than-coas-1819484925).

[Image source: Flickr](https://www.flickr.com/photos/154073030@N05/28577829138)

---

class: contain-vertical

.center[![TODO](./images/internal-combustion-engine.jpg)]

???

Now of course, I have no idea how an internal combustion engine actually works. All I know is that it's a hugely complicated thing.
But I learned how to shift gears or do "engine braking" just based on my observations about how the engine was working.

This is sort of how I feel about web performance and the browser. It's an enormously complicated engine, it's written in languages I'm not really
handy with (C, C++, Rust), and I don't understand everything about how it works. But through observation of how it responds
to my inputs, I can try to be a better web developer, and write more efficient web apps.

And of course, if I actually knew how an internal combustion engined worked, I could probably be a better driver! But I wouldn't
have to know all the little details – I only need to know just enough to improve how I write web sites.

[Image source: Flickr](https://www.flickr.com/photos/ell-r-brown/3824067984/)

---

.center[![TODO](./images/devtools1.png)]

???

So to take it back to browsers, let's look at a performance trace like this one (from the Chrome DevTools).

If you've worked in performance for a while, you've probably spent a lot of time looking at traces like these.

And there are two main parts here: the yellow (JavaScript) part, and the purple (style/layout) part.

If you're an experienced web developer, you might look at the JavaScript side of this equation and feel pretty comfortable with it. It has
function names we recognize. We see our JavaScript framework doing work, we see our state library crunching data, we see the names of methods we wrote ourselves.

But a lot of us probably look at the purple part and think, "Well, that's just the browser doing browser things." I
couldn't possibly understand what that's about. It's like the big complicated engine I showed earlier.

But the thing is, sometimes that purple part is pretty big. So it has a real impact on the performance of our web site.
And as it turns out, there _are_ ways to understand what's
going on in there, and even to reduce the time spent. In this talk, I'd like to shed some light about the "purple part," 
talk a little bit about how the browser works under the hood, and give you some tools for making the browser spend
less time here.

--
.float-left[
JavaScript (yellow part)
]

--
.float-right[
Style/Layout (purple part)
]

---

# Target audience

???

Now first off, I should mention who this talk is for. I'm going to go into a lot of details, and these details aren't
going to be relevant to everyone. For your average website, the "purple part" is just not usually the biggest bottleneck – I will readily admit that.

What I'm going to cover is mostly going to be interesting to people who really focus on performance, so they're interested in everything that can impact it, including somewhat unusual things like style/layout.

I'm also targeting authors of frameworks and design systems, since their decisions may be multiplied several times, so
it's important to get all the details right.

I'm also speaking to people working on large web apps – static content sites
usually don't have performance problems with style/layout, but big web apps often do.

I'm also speaking to anyone interested in how browsers work. Some of this stuff is just plain interesting!

--
- Performance engineers

--
- Framework authors

--
- Folks working on large web apps

--
- Anyone interested in how browsers work

---

# How browsers render

.center[![TODO](./images/pixel-pipeline.png)]

???


To understand the purple part, we first need to start with how browsers render content. This process is called
["updating the rendering"](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering) in the HTML spec.

This graphic is taken from [a blog post on web dot dev](https://web.dev/rendering-performance/#the-pixel-pipeline) where they call it "the pixel pipeline."

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

???

So let's break down style and layout calculation first. These are two separate steps.

The input of these steps is the state of the DOM – all the CSS rules and DOM nodes.

The output of these steps is the ["layout tree" (or "render tree")](https://browser.engineering/layout.html#the-layout-tree),
and that's the thing
that is passed to the paint (green) step that actually lays out pixels on the screen.

--
- Style
  - Figuring out which CSS rules apply to which elements

--
- Layout
  - Figuring out how to lay those elements out on the page
  
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

this h1 is 5px padding and 

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

this h2 is 10px padding.

In this case, style calculation is (basically) about applying the CSS selectors, and figuring out that `h1` refers to the `<h1>` element,
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
for it in terms of extra HTML parsing. And it would be harder to maintain. So I'm not advocating this. CSS is good. Use it!

However, this is a good fact about style calculation to internalize: it's mostly about CSS selectors.

---

.center[![TODO](./images/pixel-pipeline-layout.png)]

???

Now let's move on to layout. Note that, with style, at no point were we talking about the geometry of the page.
Style calculation has nothing to do with where things actually go geometrically on the page; that's the job of layout
calculation.

So recall we have our h1 and h2 where the browser has figured out that one has 5px padding and the other
has 10px padding.

--
```html
<h1 style="padding: 5px;" >Hello</h1>
<h2 style="padding: 10px;">World</h2>
```

---

class: contain-vertical

.center[![TODO](./images/helloworld2.png)]


???

Now we finally get to the geometry of the page. Layout calculation is where the styles, which have been associated with
each element, actually get applied. In this case, the browser figures takes the margin, padding, font size, and
figures out where to actually place things within the given browser window, with text wrapping and all that good stuff.

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

Or your DOM is very large. A bigger DOM just means more work for the browser to do. This affects both style and layout.

Or you are doing repeated re-renders over time, also called thrashing, which slows down both style and layout.

This is a lot to unpack, so let's go over each of these points in the rest of the talk.

--
<pointing-arrow></pointing-arrow>

--
<pointing-arrow></pointing-arrow>

--
<pointing-arrow></pointing-arrow>

--
<pointing-arrow></pointing-arrow>

---

# Style vs layout performance

.center[![TODO](./images/style-layout.png)]

???

Now first off, when you're looking at a perf trace, it's important to understand whether you primarily have a
problem with style calculation, layout calculation, or both. Because these two traces are not the same!

---

# Style vs layout performance

.center[![TODO](./images/style-layout-annotated.png)]

???

These two look the same on the surface because they're both purple. But in one trace, we have huge style costs and
very little layout cost, and in the other, we have small style costs but large layout costs. The causes of slowness
in these two cases is very different, and if you confuse them, then you can very easily go down the wrong track.

If you don't remember anything else from my talk, please remember this: style and layout are not the same thing! And you
can actually reason about why one is expensive versus the other.

---

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

Well, speaking in generalities, we can say that style calculation is about the part outside of the braces (i.e. selectors that locate elements on the page)

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

???

To understand style performance, first it's important to note how browsers actually implement their style engines, so you can understand the kinds of optimizations they have in place so that we don't have to worry about style performance most of the time.

To illustrate, let's imagine we're building a browser. Here is a naive implementation of style calculation that we might have. Raise your hand if you think this is what browsers actually do? 

Of course not, this is an `O(n * m)` operation, where `n` is the number of elements and `m` is the number of CSS rules. On any reasonably-sized page, the browser would slow to a crawl.

--
.center[`O(n * m)`]

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

Now, there's still a problem with our algorithm. What about descendant selectors? In this case, we can find `.foo` instantly,
but that doesn't help us much with `.bar`, because what we care about is the relationship between the two nodes.

---

class: fill-custom

<example-2 animate="true" strategy="naive-descendant"></example-2>

???

So we still have to traverse the descendants of `.foo` to try to find all the `.bar` elements.

Thanks to the hashmap, we can instantly find the `.foo` elements, but this is still pretty inefficient. We're walking a
lot of DOM nodes just to find the `.bar` elements.

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

You may have heard that [browser engines evaluate CSS selectors from right to left](ttps://css-tricks.com/why-browsers-read-selectors-right-to-left/).
If you've ever wondered why,
this is the reason! Any given node in the DOM tree tends to have fewer ancestors than descendants, so this optimization
works out really well for most DOM trees.

---

# Problem: generic descendants

```css
.foo div {}
```

???

This right-to-left technique works out pretty well. But we have another problem. What about selectors like this one?

The right-hand-side (i.e. the descendant) is pretty generic. Most DOM trees have a lot of `div`s.

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
to crawl up the entire ancestor chain every time just to find `.foo`. So this is a case where it would
have been faster for us to go left-to-right.

But we just established that left-to-right is pretty slow most of the time, since DOM nodes tend to have more
descendants than ancestors, just due to the shape of the tree. So how can we solve this?

---

# Style optimization 3: Bloom filter

.center[![TODO](./images/bloom-filter.svg)]

???

Enter the Bloom filter. WebKit came up with the optimization first, and now it exists in all browsers.

> "We stole the Bloom filter from [WebKit]. The idea is to optimize cases where the page author writes a descendant combinator and the thing to the [right-hand side] matches a lot, e.g. `.foo div`."
 
– Boris Zbarsky (Mozilla), via [Servo meeting notes](https://github.com/servo/servo/wiki/Css-selector-matching-meeting-2013-07-19) (2013)

So how does the Bloom filter work? Basically, you can think of it as a Hash Set that may give false positives, but never gives false negatives. The main thing is, it's very fast with low memory overhead, so it can be used widely.

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

<example-3 show-tags="true" show-bloom-filter="true" animate="true" strategy="bloom-filter"></example-3>

???

So now we can quickly filter all the `divs` based on the Bloom filter, "fast rejecting" any
that couldn't possibly have `.foo` as an ancestor. Note that, because we could have false positives, we still
need to walk the ancestor chain to check that it really has `.foo` as an ancestor, but we are still eliminating a lot
of work.

Bloom filters can also be tuned to minimize the number of false positives. It's basically a memory vs CPU tradeoff.

---

<h1 class="smaller">What's in the Bloom filter?</h1>

| Supported? | Type                | Example                                       |
|------------|---------------------|-----------------------------------------------|
| ✅          | ID                  | `#id div`                                     |
| ✅          | Class️              | `.foo div`                                    |
| ✅          | Tag️                | `main div`                                    |
| ✅          | Attribute 🆕        | `[foo] div`                                   |
| ⚠️| Attribute value 🆕  | `[foo="bar"] div`                             |
| ❌️        | Other stuff         | `:nth-child(2) div` |

???

So what's in the Bloom filter? Well, originally it was only IDs, classes, and tags. In 2018 WebKit added attributes, and
Firefox and Chrome added them in 2021 when I filed bugs on them (you're welcome). Note that the attribute optimization
only applies to attribute names, not values, but attribute value selectors can kind of piggyback off of them because
the browser will quickly check if any ancestors even have the attribute name, before checking the value.

Other stuff could be optimized in theory, but as far as I know no browsers have expanded the Bloom filter to anything else.

- https://trac.webkit.org/changeset/229090/webkit
- https://bugs.chromium.org/p/chromium/issues/detail?id=1196474
- https://bugzilla.mozilla.org/show_bug.cgi?id=1704551

Source:

Bloom filter source:

- https://github.com/WebKit/WebKit/blob/596fdf7c2cec599f8c826787363c54c4b008a7fe/Source/WebCore/css/SelectorFilter.h#L57-L60
- https://chromium.googlesource.com/chromium/src/+/refs/tags/107.0.5258.1/third_party/blink/renderer/core/css/selector_filter.cc#43
- https://phabricator.services.mozilla.com/source/mozilla-central/browse/default/servo/components/style/bloom.rs$114

--
<pointing-arrow></pointing-arrow>
<pointing-arrow show-previous="1"></pointing-arrow>
<pointing-arrow show-previous="2"></pointing-arrow>

--
<pointing-arrow></pointing-arrow>
<pointing-arrow show-previous="1"></pointing-arrow>

--
<pointing-arrow></pointing-arrow>

---

# Browser style optimizations

- WebKit CSS JIT Compiler (2014)
- Firefox Stylo (2017)
- WebKit `:has` (2022)
- etc.

???

Now, there are many more browser style optimizations than what I've mentioned here. Here are a few more.

WebKit has an interesting post from a few years ago about how they compile their selector matchers. Firefox brought their Stylo
engine over from Servo, which is a very fast multithreaded style calculation engine. And recently both Webkit and Chromium
implemented `:has()`, which can be thought of as an ancestor selector. (How did they make this fast? You guessed it... another
Bloom filter. Like the other one, this one has classes, IDs, tags, and attributes, but it also adds `:hover`, and they hint
that they may add other pseudo classes later.)

My goal in telling you all this is not to tell you to use this CSS selector or this other one. That information could quickly become outdated.
My goal instead is to give you an appreciation for all the work a browser has to do to do style calculation. So when you see high style
calculation costs, you understand that a browser is doing some non-trivial work.

Notes:

- [WebKit CSS JIT Compiler](https://webkit.org/blog/3271/webkit-css-selector-jit-compiler/)
- [Firefox Stylo](https://hacks.mozilla.org/2017/08/inside-a-super-fast-css-engine-quantum-css-aka-stylo/)
- [Webkit `has()` pseudo-class](https://webkit.org/blog/13096/css-has-pseudo-class/)
- [WebKit `has()` optimization](https://github.com/WebKit/WebKit/commit/596fdf7c2cec599f8c826787363c54c4b008a7fe)
- [Chromium `:has()` optimization](https://bugs.chromium.org/p/chromium/issues/detail?id=1341893)

---

# Improving style calculation

???

So now, knowing a bit more about how browsers work under the hood, what can we as web developers do if we see high style
calculation costs?

---

# Remove unused CSS

.center[![TODO](./images/unused-css.png)]

???

Well, one thing you can do to reduce style calculation costs is to remove unused CSS. (The example shows a screenshot from Chrome Dev Tools "Coverage" tool.)

This is a really important point, because it's an area where unused CSS is actually different from unused JavaScript. Both cost you
in terms of transfer time, and JavaScript costs you in terms of parse and compile time, but unused CSS costs you in terms of parse, compile, _and_
in making all of your style calculations slower. After all, the browser doesn't _know_ your selectors are unused until it runs the style calculation algorithm! This can actually end up costing you multiple times over the lifetime of your page for every style recalculation, or in cases of layout thrashing (which I'll get to later).

So trim that unused CSS!

---

# Avoid excessive complexity in selectors

```css
:not([foo^="bar"]) div:nth-of-type(2n) :nth-child(3) > * ~ * {}
```

???

Now, I don't want to get too deep into this, because again, it's hard to predict these kinds of things. But just don't use zany selectors like these.

And if you think I'm exaggerating, the thing is that it's pretty easy to generate stuff like this if you're not careful. Using tools like SASS
and LESS, it's really easy to deeply nest things, or to have for-loops that generate all sorts of `:nth-child()` selectors.

One or two
of these will probably not wreck your page's performance, but in aggregate, these can do a lot of damage.

---

<h1 class="smaller">Rough selector cost estimate</h1>

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

Again, I can't provide hard-and-fast rules, and all of this could become outdated tomorrow. But the intuition you should have is that IDs, classes, and tag names will always be fast, and other stuff you should be cautious with. And again, most of this stuff doesn't matter in isolation, but it does matter if you're building a framework or a design system
where rules might be repeated multiple times on the page.

More details (although I quibble with some of the rankings): https://www.sitepoint.com/optimizing-css-id-selectors-and-other-myths/

--
<pointing-arrow></pointing-arrow>

--
<pointing-arrow></pointing-arrow>
<pointing-arrow show-previous="1"></pointing-arrow>

--
<pointing-arrow></pointing-arrow>
<pointing-arrow show-previous="1"></pointing-arrow>
<pointing-arrow show-previous="2"></pointing-arrow>

---

# Use shadow DOM

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

If you're not familiar with Shadow DOM, it works very similarly to "scoped styles" you may have used in frameworks like Vue or Svelte, or with systems like CSS modules. Shadow DOM can be recursively nested, so there isn't just "the" shadow DOM – you can have shadow within shadows, one for each component.

So this actually means that any expensive selectors you may have outside of this component don't need to be calculated for
elements inside of the shadow root. And any expensive selectors _inside_ of this component also don't need to be calculated
for elements outside of it.

If you recall our naive algorithm from earlier, where we check every DOM element against every CSS rule, this effectively
cuts down the number of elements and rules that need to be checked against each other.

---

# Use scoped styles

```css
/* Input */
:nth-child(2) div

/* Vue */
:nth-child(2) div[xxx]

/* Svelte */
.xxx:nth-child(2) div.xxx
```

???

An alternative to shadow DOM is to use style scoping from frameworks like Vue, Svelte, or CSS Modules.
These provide some of the same benefits as shadow DOM, although some systems are more performant than others.

In this example, you can see that Svelte adds classes (where `xxx` is autogenerated) to both the descendant and ancestor
selector. Vue, on the other hand, uses attributes and doesn't add any selector to the ancestor. Since CSS selectors
are matched right-to-left, these are both pretty fast, although Svelte is slightly faster because 1) classes tend to
be slightly faster than attributes, and 2) the browser can use the Bloom filter for the ancestor. I have
[a blog post](https://nolanlawson.com/2022/06/22/style-scoping-versus-shadow-dom-which-is-fastest/) about
this if you want to see the exact numbers in different browsers.

And in case you're wondering, yes, if a selector has both a fast (e.g. class) and slow (e.g. `:nth-child()`) part, the
browser will use the fast selector to fast-reject before moving on to the slow selector.

---

.center[![TODO](./images/shadow-dom-6.png)]

???

I have [a whole blog post](https://nolanlawson.com/2022/06/22/style-scoping-versus-shadow-dom-which-is-fastest/)
going into the details on this. Basically you should just observe that shadow DOM (the yellow one)
is always much smaller than the other ones. Although scoping with classes is quite good too.

Now of course, it's easier said than done to say "just convert your entire app to use shadow DOM." But it is an interesting
fact that shadow DOM gives us this kind of style encapsulation. Effectively, you can use whatever selectors you want, and
it's extremely unlikely to affect performance.

Firefox is incredibly fast in this chart because of their Stylo engine. If every browser were like Firefox, then I wouldn't have much
material for this part of the talk! This is what makes me optimistic that, someday, we'll be able to use whatever zany
selectors we want, and it won't matter much for web performance, even on web apps with tons of CSS.

---

# Layout performance

???

OK, so now that I've covered all the bases on style performance, I want to move on to layout performance.

Now remember, I've been trying to convince you that style and layout are not the same thing! Up until
this point, I haven't talked about layout at all – I haven't talked about the geometry of the page, or how text flows,
or anything like that. So if you see high style calculation costs, remember that it's all about your CSS selectors, not your page layout.

Going back to our example from earlier, layout performance is the part inside of the curly braces, whereas style performance is the
part outside of it.

Now when it comes to layout, I'm going to admit that I'm not a huge expert on this topic, so I'm not going to spend a lot of time on it. But I do have some tricks I can share.

--
```css
h1 {
* padding: 5px;
}
h2 {
* padding: 10px;
}
```

---

class: fill-custom

<layout-example-1></layout-example-1>

???

So let's say we have a simple layout like this. We've got a header, a sidebar, and the main content.

Each of these boxes contains other boxes, but the browser already knows which elements have which styles, so it's just
a matter of laying them out. This can get very complicated, because some of these boxes may have absolute/relative positioning,
others may use flexbox, others may use grid, etc.

---

class: fill-custom

<layout-example-1 version="2"></layout-example-1>

???

But let's say our main content suddenly takes up a bit more space, so now the sidebar has to shrink. If that happens,
then the browser might have to recalculate the layout for everything inside the sidebar.

Now sometimes, this can never actually happen in our layout. For instance, we never have text that will overflow inside
of the main content. But the _browser_ doesn't know that in advance. So it has to assume that changes to the blue box
may affect the green box, and vice versa.

---

# CSS containment

???

Is there a way we can reassure the browser that a change in one box won't affect the other boxes? Yes, it's called
CSS containment.

---

class: fill-custom

<layout-example-1 version="3"></layout-example-1>

???

If we apply the CSS `contain: content` to each of these boxes, then the browser can calculate their sizes independently
of each other. This has the potential to speed up layout performance.

Now, this has some downsides. If there's a dropdown or something that might peek out of one box and into the other one,
then it'll get cut off because we promised the browser that one box wouldn't bleed into another.

---

# CSS containment

- `contain: content`
- `contain: strict`

???

My recommendation would be to try applying `contain: content` to logically separate parts of your page
(sidebars, modals, individual items in a list, etc.), and then measure
and see if it improves layout performance.

There is also `contain: strict`, but it's a bit more aggressive and in my experience `contain: content` already gets
you most of the performance wins. But you can try this one out too.

---

# Encapsulation

|           | Encapsulates |
|-----------------|-----------------|
| Shadow DOM      | Style           |
| CSS containment | Layout          |

???

So, just to make a point of clarification here: there are two ways you can use encapsulation to improve style/layout
performance. There's shadow DOM, which we already mentioned, which encapsulates your _styles_ and improves style
calculation. And then this is CSS containment, which encapsulates your _layout_ and improves layout performance.

So if you have high style costs, don't go thinking that CSS containment will help you! And if you have high layout costs,
shadow DOM won't help there either.

---

# Principles of layout performance

- Explicit is better than implicit
- Use fewer DOM nodes (e.g. virtualization)
- Use `display:none` and `content-visibility`

???

Other than CSS containment, I can only share a few general tips on improving layout performance. First off, explicitly
telling the browser the sizes of things will always be less work than asking it to run its layout algorithm. If you
know the exact width/height of something, you can set the explicit size rather than letting the browser calculate it.
Absolute/relative positioninng is always fast.

Also, of course, use fewer DOM nodes. If you have an infinite-scrolling list, use virtualization so that you're not
rendering a bunch of DOM nodes that are off-screen.

If you use something like `display:none`, it will also avoid paying the layout cost for everything that is currently being hidden.

There is also a new property that you can use called `content-visibility`, that allows the browser to skip rendering
large portions of the page while still allowing them to be searchable with Cmd-F/Ctrl-F.

So I'd say if you have high layout costs, try CSS containment first, then try these techniques.

---

# Invalidation

???

OK, so now that I've covered the principles of style and layout, and how they're different, I want to move on to
topics that affect both style and layout calculation.

Up to now, we've mostly talked about what happens to a page that calculates style/layout once. But of course, a lot of
us are building very dynamic pages that are constantly changing, so the browser calculates style/layout more than once.
This process is called "invalidation."

---

# Invalidation

<layout-example-2></layout-example-2>

???

Basically it means we are going from one layout state to another state.

This can happen for two different reasons: either 1) the DOM changed, and/or 2) the CSS rules changed.

---

# Invalidation

.center[![TODO](./images/pixel-pipeline-raf.png)]

???

When the browser
detects this, it will automatically redraw the new layout during the next style/layout pass, which typically happens
one frame later.

That's why, when you call `requestAnimationFrame`, you get the point in time right before the next
style/layout operation.

---

# Forcing style/layout calculation


```js
element.style.margin = '20px';   // Invalidate

element.getBoundingClientRect(); // Force style/layout
```


???

Now, normally this is fine. But it gets dangerous if you're explicitly telling the browser that you want style
and layout to be calculated immediately, rather than waiting for the next frame.

In the example above, we're _invalidating_ by setting the margin on the element to 20px. This doesn't actually
cause the browser to do any style/layout work yet. Normally it would happen in the next frame.

But instead, we immediately call `element.getBoundingClientRect()`. This forces the browser to immediately
and synchronously calculate both style and layout.

---

# APIs that force style/layout recalc

- `getBoundingClientRect`
- `offsetWidth`
- `getComputedStyle`
- `innerText` 🤯
- etc.

???

Now if you're interested in the full list of browser APIs that force style/layout recalculation, Paul Irish has 
[a complete list]((https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
that is very useful. It contains some APIs that seem obvious (like `getBoundingClientRect`) and others that
are a bit suprising (like `innerText`). Some force style _and_ layout, whereas others only force style.

---

# Layout thrashing

```js 
for (const el of elements) {
  const width = el.parentElement.offsetWidth;
  el.style.width = width + 'px';
}
```

???

This leads us to another important topic, which is layout thrashing.

Layout thrashing is a situation where, in a loop, you're both reading from the DOM's style and writing to the DOM's styles. This
forces the browser to re-run style and layout repeatedly.

---

# Layout thrashing

```js
for (const el of elements) {
* const width = el.parentElement.offsetWidth;
  el.style.width = width + 'px';
}
```

???

So in this case here we are reading from the DOM

---

# Layout thrashing

```js
for (const el of elements) {
  const width = el.parentElement.offsetWidth;
* el.style.width = width + 'px';
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
const widths = elements.map(el => el.parentElement.offsetWidth);

// All the writes
elements.forEach((element, i) => {
  element.style.width = widths[i] + 'px';
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

---

# Invalidation optimizations

???

Invalidation is another area where it's good to be aware of browser optimizations. Imagine if, every time a single
element were invalidated, the browser had to recalculate all the styles and layout for the entire DOM! Building a complex
web app would be impossible.

So browsers take lots of shortcuts. We already mentioned some ways we can help give the browser shortcuts, such as
shadow DOM and CSS containment, but there are some other ones to be aware of.

---

# Invalidation optimizations

```js
for (let i = 0; i < 1000; i++) {
  el.style.width = '1px'
  el.getBoundingClientRect()
}
```

???

For instance, this is a fun one. This is layout thrashing, right? In fact this should be awful, right?

Well actually it's not, because browsers have optimized this. Notice that the `1px` never actually changes. (And if you
think this is unrealistic, I've seen a real-world case like this.)

---

# Invalidation optimizations

.center[![TODO](./images/browser-optimization-demo.png)]

???

If you look at [a demo](https://gist.github.com/nolanlawson/2d70b4f01d1d77ca47f069ad51177ff4) of this code and trace it,
you'll see a very curious thing. We pay the cost of the `getBoundingClientRect`s, sure, but we're only paying yellow
cost, not purple cost. Style and layout is only calculated once. We're just paying the cost of creating the rectangle
objects – the browser has optimized everything else.

---

class: fill-custom

<layout-example-1></layout-example-1>

???

Now imagine applying that to the entire page. And think of all the ways that a browser might have optimized to make
sure that it doesn't redo work that it's already done. If something changes in one small part of the page,
the browser wants to avoid having to redo work elsewhere.

The browser has heuristics to skip both style calculation and layout calculation. In Chromium this is called
[invalidation sets](https://chromium.googlesource.com/chromium/src/+/HEAD/third_party/blink/renderer/core/css/style-invalidation.md)
if you want to read up on it.

---

# Typical page flow

.center[![TODO](./images/typical-flow.png)]

???

This is why, in the typical flow for a web app, we have a lot of high upfront style/layout costs, and very small
residual style/layout costs on every interaction. This is a good thing – this is what we want.

Sometimes though, these residual costs are surprisingly high. And it can be really tricky to figure out exactly
why something was invalidated and is causing these high residual costs.

---

class: contain-vertical

.center[![TODO](./images/invalidation-tracking-1.png)]

???

One tool you can use to inspect this is "invalidation tracking" in the Chrome DevTools. This is an experimental
feature, so use at your own risk!

Also note that this only really works for Chrome – other browsers have different
heuristics and different performance characteristics when it comes to invalidation.

---

class: contain-vertical

.center[![TODO](./images/invalidation-tracking-2.png)]

???

If you do this, and then you click on the "Recalculate style" or "Recalculate Layout" slice in Dev Tools, then
it will show you which CSS rules were invalidated for which elements (in the case of style recalc), or which elements
needed layout (in "recalculate layout"). This can be really invaluable in debugging high invalidation costs!

---

class: contain-vertical

.center[![TODO](./images/chrome-tracing.png)]

???

Another tool you can use is `chrome:tracing`. This provides more low-level details into what Chrome is doing,
albeit it's a bit more inaccessible than the DevTools.

[A good guide on `chrome:tracing`, albeit for V8 debugging](https://v8.dev/docs/rcs))

---

class: contain-vertical

.center[![TODO](./images/style-chrome-tracing.png)]


???

If you take a trace of a website and then find the "update style" slice, you can get lots of information here.

Some of these are very Chromium-specific. "Matched property cache" is a cache Chromium uses of styles that
are identical between different elements, to save memory.

The really interesting ones are:

- rules fast rejected
- rules matched
- rules rejected

This tells us how many CSS rules matched, and how many were rejected using the "fast reject" method (i.e. the Bloom
filter) and how many were rejected more slowly (using e.g. DOM traversal).

---

class: contain-vertical

.center[![TODO](./images/blink-debug.png)]

???

To get even more detail, a [cool new feature](https://bugs.chromium.org/p/chromium/issues/detail?id=1316060) was
added recently in Chromium this year. If you enable `blink.debug` when using Chrome tracing...

---

class: contain-vertical

.center[![TODO](./images/selector-stats-3.png)]

???

Then you can get this view of the "selector stats." If you sort by elapsed time, you can actually see your
most expensive CSS rules ranked from most to least expensive. This is a really cool tool, and I hope it makes
its way into the DevTools eventually! But for now, you can use Chrome tracing.

# Conclusion

---

# New CSS features

- Container queries
- `:has` selector
- Cascade layers
- Scoping
- Nesting

???

CSS has been getting a lot of new features recently. Here are some new and draft specs.

---

# New layout features

- Subgrid
- Masonry
- Multi-column layout

???

Layout has been getting new features too.

All of this is cool, and you should be using it. I don't want anyone to take away from my talk that they shouldn't
be using CSS or layout features. These are all really cool! They should be used!

But the more complex that CSS and layout becomes, and the bigger and more ambitious apps we're trying to build, the
more likely we are to run into high style and layout calculation costs. And right now, it's really hard to debug.
You kind of just have to know how the browser works, and also do a lot of guesswork.

---

.center[![TODO](./images/devtools1.png)]

.float-left[
JavaScript (yellow part)
]

.float-right[
Style/Layout (purple part)
]

???

Going back to the performance trace I showed at the beginning, I think part of the reason it can be so much
harder to understand the "purple part" than the yellow part is that JavaScript is imperative, whereas CSS is declarative.
With JavaScript, we procedurally tell the browser exactly what to do, and the performance trace is a one-to-one
mapping of what we wrote.

With CSS, we give a big declarative blob to the browser and tell the browser to implement the algorithm. And every
browser does it differently. So when something goes wrong, it's really hard to tell what we did to cause the problem.
And the browser Dev Tools, in all three browsers, are frankly not very good at debugging this.

---

# SQL

```sql

SELECT Order.id, Customer.name, Order.date
FROM Order
INNER JOIN Customer ON Order.customerId = Customer.id;
```

???

You know, another declarative language with performance considerations is SQL. But one thing I like about SQL is that
most databases have a way to ask the database why your query is slow. After all, you implemented this thing, but you
have no idea how exactly the SQL engine does an `INNER JOIN`.

---

# SQL EXPLAIN

```sql
EXPLAIN
SELECT Order.id, Customer.name, Order.date
FROM Order
INNER JOIN Customer ON Order.customerId = Customer.id;
```

???

But it can tell you, with `EXPLAIN`.

---

class: contain-vertical

.center[![TODO](./images/sql-explain.png)]

???

If you ask Postgres to explain itself, it'll tell you exactly what algorithm it implemented, and how much time it
spent in each part of the algorithm. So now you can map this back to the declarative query you wrote.

(Image courtesy of [StackOverflow](https://stackoverflow.com/questions/42459572/how-to-export-explain-data-output-from-pgadmin-4).)

---

class: contain-vertical

.center[![TODO](./images/car-dashboard.jpg)]

???

So wouldn't it be cool if browsers could give us the same thing? Something like "invalidation tracking," but with
even more details. The "selector stats" is a great start, but I'd really like to know everything that's going on
in the style/layout engine.

Going back to my original metaphor of the stick shift and the car, I'd really like to have a dashboard to give me
more insights into what the browser is doing. It's great to listen to the engine and rely on intuition, but
the browser vendors know a lot more than me about how their engine is implemented, so they could provide more details.

A full "SQL EXPLAIN," but for CSS, would be amazing!

[Image source: Flickr](https://www.flickr.com/photos/lex-photographic/26665512361)

---

<h1 class="center">Thank you</h1>

## 📃 nolanlawson.github.io/style-talk-2022

## 🌎 nolanlawson.com

???

So that's my talk on style/layout performance. I hope you enjoyed it and learned something about how browsers work
and how to optimize style/layout calculation.

If you'd like to follow my work online, I'd recommend going to my website and following the RSS feed. Thanks a lot!
