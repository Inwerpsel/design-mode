# Design Mode

This repo contains several components that combine to create a design mode that can be added to any HTML page.

* A state management library with focus on undo/redo history
* Many editor UI elements
* A drag and drop library to make the UI fully customizable
* Dedicated CSS UI elements like an `oklch` color picker

Currently, only values in custom properties can be changed in the UI, support for editing any CSS is in progress.
This limitation can be used as a feature, it allows deciding in the code which values can be changed in a design variation.

The demo application is mostly a POC for the various components, where some parts are being kept as simple as possible to facilitate development.
You can save the result as a JSON or CSS file and use it in another application.

## Demo

> I used some open source page content that seemed ok to use.
If you're the owner of some of this content and would like to have it removed / updated,
please let me know in a [new issue](https://github.com/Inwerpsel/design-mode/issues/new) on this repo.

### Halfmoon ([source](https://github.com/halfmoonui/halfmoon))

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - Enormous amount of custom properties => able to edit almost every part of the design.
  - Mostly 1 selector per custom property => easy to understand info in the UI
  - Great demonstration of linking variables in various ways (chains of 3 or 4 variables that actually make sense)
  - Only defines values in the `:root` scope => easier to understand and less bugs in the editor
  #### What doesn't work well?
  - A very large portion (~1/3 of the ~1500) of variables are just a dark mode version of something that has a light
  mode version. Since the whole point of custom props is theming, dark mode should have been a theme
  consisting entirely of custom props. Since the editor only loads the light mode, it should only show
  the light mode variants. You can remove the annoying `lm` prefix from the displayed variables.
  - The approach is sometimes a bit contrived, with a lot of variables defined "just in case". This inflates
  the CSS if you never end up overriding. This is not a problem if the eventual production build filters these.
  E.g. `--lm-button-danger-bg-image-hover: none` (similar exists for every state of every variant of button, for both light and dark mode)
  - The documentation site still relies on a few overrides that don't use custom props, which kind of spoils the experience.
</details>

[🖌 Buttons](https://inwerpsel.github.io/design-mode/demo/halfmoon/docs/buttons)
[🖌 Forms](https://inwerpsel.github.io/design-mode/demo/halfmoon/docs/forms)
[🖌 Sidebar](https://inwerpsel.github.io/design-mode/demo/halfmoon/docs/sidebar)

### Bootstrap ([source](https://github.com/twbs/bootstrap/blob/main/site/content/docs/5.3/examples/cheatsheet/index.html))

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - Properties defined in non-root scope. While this approach has some drawbacks too, the result here is pretty good overall.
  - Mostly quite consistent in how similar things are implemented
  - Great for testing alias creation (but has issue in few cases, see below)
  #### What doesn't work well?
  - Quite a lot of custom properties are overridden with regular rules
  - Uses `!important` quite heavily.
  - Creating aliases has the wrong result sometimes, because the added CSS rules cannot yet properly respect
  order, and thus specificity. Specifically this happens if you change properties that should be overridden
  by a more specfic scope. For example: `.btn` and `.btn-primary`. This currently happens if you create an alias
  for a property on `.btn`.

  #### Loading an export of editor history
  You can import and editor session by saving this JSON file: https://github.com/Inwerpsel/design-mode/blob/main/data/histories/bs-crystal-buttons.json

  Then, use the "Import history JSON" in the "Import/export" panel to load the session from this file.

  It attempts to restore the scroll position, which may not fully work if the screen size is too small.

#### Smaller pages
[🖌 album](https://inwerpsel.github.io/design-mode/demo/bs/album)
[🖌 blog](https://inwerpsel.github.io/design-mode/demo/bs/blog)
[🖌 carousel](https://inwerpsel.github.io/design-mode/demo/bs/carousel)
[🖌 checkout](https://inwerpsel.github.io/design-mode/demo/bs/checkout)
[🖌 cover](https://inwerpsel.github.io/design-mode/demo/bs/cover)
[🖌 dashboard](https://inwerpsel.github.io/design-mode/demo/bs/dashboard)
[🖌 dropdowns](https://inwerpsel.github.io/design-mode/demo/bs/dropdowns)
[🖌 features](https://inwerpsel.github.io/design-mode/demo/bs/features)
[🖌 footers](https://inwerpsel.github.io/design-mode/demo/bs/footers)
[🖌 grid](https://inwerpsel.github.io/design-mode/demo/bs/grid)
[🖌 headers](https://inwerpsel.github.io/design-mode/demo/bs/headers)
[🖌 heroes](https://inwerpsel.github.io/design-mode/demo/bs/heroes)
[🖌 jumbotron](https://inwerpsel.github.io/design-mode/demo/bs/jumbotron)
[🖌 list-groups](https://inwerpsel.github.io/design-mode/demo/bs/list-groups)
[🖌 masonry](https://inwerpsel.github.io/design-mode/demo/bs/masonry)
[🖌 modals](https://inwerpsel.github.io/design-mode/demo/bs/modals)
[🖌 navbar-bottom](https://inwerpsel.github.io/design-mode/demo/bs/navbar-bottom)
[🖌 navbar-fixed](https://inwerpsel.github.io/design-mode/demo/bs/navbar-fixed)
[🖌 navbar-static](https://inwerpsel.github.io/design-mode/demo/bs/navbar-static)
[🖌 navbars](https://inwerpsel.github.io/design-mode/demo/bs/navbars)
[🖌 navbars-offcanvas](https://inwerpsel.github.io/design-mode/demo/bs/navbars-offcanvas)
[🖌 offcanvas-navbar (sic)](https://inwerpsel.github.io/design-mode/demo/bs/offcanvas-navbar)
[🖌 pricing](https://inwerpsel.github.io/design-mode/demo/bs/pricing)
[🖌 product](https://inwerpsel.github.io/design-mode/demo/bs/product)
[🖌 rtl](https://inwerpsel.github.io/design-mode/demo/bs/rtl)
[🖌 sidebars](https://inwerpsel.github.io/design-mode/demo/bs/sidebars)
[🖌 sign-in](https://inwerpsel.github.io/design-mode/demo/bs/sign-in)
[🖌 starter-template](https://inwerpsel.github.io/design-mode/demo/bs/starter-template)
[🖌 sticky-footer](https://inwerpsel.github.io/design-mode/demo/bs/sticky-footer)
[🖌 sticky-footer-navbar](https://inwerpsel.github.io/design-mode/demo/bs/sticky-footer-navbar)

</details>

#### Big page with most things
[🖌 Cheatsheet](https://inwerpsel.github.io/design-mode/demo/bs/cheatsheet/)
### Openprops ([source](https://open-props.style/))

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - Most complete palette of custom properties
  - Great design
  - Mostly short and readable selectors (I just love `small.green-badge` and `circle#sun`)
  - Modern CSS
  - A few pretty advanced use cases (gradients with noisefilters, > 4 border radii blobs, )
  #### What doesn't work well?
  - Special heading style applies also to editor headings. Looks a bit broken but also cute so I didn't intervene yet.
  - Over-usage of `:where()` (e.g. `:where(html)`), currently leading to a few bugs in the inspector (e.g. selector locator doesn't properly handle this)
  - Almost no semantic tokens (e.g. button-color), so adding aliases doesn't really make sense here. It also
  makes drag and dropping values pretty much useless: you'd get something like `--orange: var(--purple)`.
  - Some inline styles (e.g. border radius) not properly handled
</details>

[🖌 Home page](https://inwerpsel.github.io/design-mode/demo/openprops/home/)

### MDN web docs

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - A lot of real world complex markup and variants
  - Clean and semantic markup
  - Relatively successful mix of root and non-root scoped custom properties (doesn't seem inconsistent or confusing)
  #### What doesn't work well?
  - Specificity related bug prevents created aliases from being picked up in the editor in some cases.
  Possible related to the `:root:not(.light):not(.dark)` selector
</details>

[🖌 Using CSS custom properties](https://inwerpsel.github.io/design-mode/demo/mozilladocs/use-custom-properties/)
[🖌 Basic math in JavaScript — numbers and operators](https://inwerpsel.github.io/design-mode/demo/mozilladocs/jsmath/)
[🖌 @media hover](https://inwerpsel.github.io/design-mode/demo/mozilladocs/media-hover/)
[🖌 How CSS is structured](https://inwerpsel.github.io/design-mode/demo/mozilladocs/how-is-css-structured/)

### Pico CSS

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - Most semantic markup ever, makes for very short inspector titles (maybe even too short)
  #### What doesn't work well?
  - `--background-color` is defined in a few scopes. Because of how the inspector currently works,
  it will only show such variable on the topmost element. Unfortunately this affects buttons.
  - Some custom properties are defined in too hairy selectors. E.g. `[role="link"]:is([aria-current], :hover, :active, :focus), a:is([aria-current], :hover, :active, :focus)`
  - Some not so sensible defaults
 
</details>

[🖌 accordions](https://inwerpsel.github.io/design-mode/demo/pico/docs/accordions.html)
[🖌 buttons](https://inwerpsel.github.io/design-mode/demo/pico/docs/buttons.html)
[🖌 cards](https://inwerpsel.github.io/design-mode/demo/pico/docs/cards.html)
[🖌 classless](https://inwerpsel.github.io/design-mode/demo/pico/docs/classless.html)
[🖌 containers](https://inwerpsel.github.io/design-mode/demo/pico/docs/containers.html)
[🖌 customization](https://inwerpsel.github.io/design-mode/demo/pico/docs/customization.html)
[🖌 dropdowns](https://inwerpsel.github.io/design-mode/demo/pico/docs/dropdowns.html)
[🖌 forms](https://inwerpsel.github.io/design-mode/demo/pico/docs/forms.html)
[🖌 grid](https://inwerpsel.github.io/design-mode/demo/pico/docs/grid.html)
[🖌 home](https://inwerpsel.github.io/design-mode/demo/pico/docs/home.html)
[🖌 loading](https://inwerpsel.github.io/design-mode/demo/pico/docs/loading.html)
[🖌 modal](https://inwerpsel.github.io/design-mode/demo/pico/docs/modal.html)
[🖌 navs](https://inwerpsel.github.io/design-mode/demo/pico/docs/navs.html)
[🖌 progress](https://inwerpsel.github.io/design-mode/demo/pico/docs/progress.html)
[🖌 rtl](https://inwerpsel.github.io/design-mode/demo/pico/docs/rtl.html)
[🖌 scroller](https://inwerpsel.github.io/design-mode/demo/pico/docs/scroller.html)
[🖌 tables](https://inwerpsel.github.io/design-mode/demo/pico/docs/tables.html)
[🖌 themes](https://inwerpsel.github.io/design-mode/demo/pico/docs/themes.html)
[🖌 tooltips](https://inwerpsel.github.io/design-mode/demo/pico/docs/tooltips.html)
[🖌 typography](https://inwerpsel.github.io/design-mode/demo/pico/docs/typography.html)
[🖌 we-love-classes](https://inwerpsel.github.io/design-mode/demo/pico/docs/we-love-classes.html)

### Other sites

It should work for any site (even complex sites like GitHub, StackOverflow, YouTube), but you'll have to test those locally for now.
Only with the current selection of demo pages I was confident enough hosting this content on GitHub Pages
wouldn't be a problem (as the source HTML is on GitHub already).

I might in the future add a general purpose way to load other sites, though this has some obvious CORS
challenges. Luckily it's quite easy to run locally.

Just save any page as HTML in the browser, into the `/docs` folder, and inject the script and style 
tags you see in [other example HTML pages at the end of the body](https://github.com/Inwerpsel/design-mode/blob/a040386a18ab001b2add0e59610f4ae077128d36/docs/halfmoon/docs/buttons.html#L1091-L1092).

## Features
* Plug and play: can be added to any page of an app
* Good performance even on huge pages
* Detailed information
* Many editing options
* Easily locate all other elements affected by a change
* Screen switcher on variables with a media query
* Link variables to other variables to create a design system
* Reposition or hide any UI element with drag and drop
* Reliable undo/redo

### Unfinished business

Several important aspects are missing or partially complete, usually to reduce code footprint when 90% of functionality was achieved, or because focus is shifted.
Some others depend on a planned (partially done) rewrite of the inspection logic and will maintain most current limitations until that rewrite is done.

* Most common usage patterns for CSS custom properties are well supported, with a few exceptions:
  - If the same property name is used across multiple elements, it only is shown on the topmost (e.g. "--background" in pico demo)
  - Not able to change color if the variable is inside the color function (e.g. `color: hsl(var(--h), var(--s), var(--l))`). Unfortunately many sites do this.
* Usage of many media queries on the same custom properties is likely to lead to incomplete inspection results.
* The "link" UI lists all variables with no filtering on type.
* The editor has few own CSS styles, mostly to guarantee basic functionality. As an artifact of how the editor was initially implemented,
it loads the sheets on the inspected page before the editor styles. This can get a bit broken, but can also look good and consistent with the content.
* Drag and drop is the only way to reorder elements in an area, on touch screens you can only move to the end of an area.
* You can put any element in any area, but some combinations will lead to unusable or broken layouts, mostly in the top and bottom areas.

## Roadmap

Among the issues on this repo, the following are the current areas of focus.

* **History UI**:
The UI around history was expanded a lot recently, and there's still some
nuances to figure out, as well as some possible new capabilities.
* **Clean up CSS parsing and evaluation of inspection**:
Currently, the algorithm used for most of the inspection still dates to the 
initial implementation of this repo, and the assumptions have changed enough so
that it currently doesn't perform as well as it could (this is an understatement).
The new parsing algorithm is mostly ready, and can be put in place after (or while)
the inspector frame code is improved. This will allow for any CSS to be changed,
not only the contents of custom properties.

## Status and stability

While in general most functionality is quite stable, various parts are being worked on at the moment. If you'd like to
make use of this repo in any form, but can't find everything you need to set it up (be it documentation or
functionality), feel free to open a [new issue](https://github.com/Inwerpsel/design-mode/issues/new) describing your needs and they'll be prioritized.

## FAQ

### Where is the documentation?
A documentation site is planned, but postponed for now as there's too many things that are being developed
which would result in constant updating of texts and screenshots, delaying the work.

Some information is in readme files in this repository, but it could be better organized.

For the same efficiency reasons, some UI labels and descriptions are left out.

The UI is intended to be maximally intuitive, though. Almost all application state is also included in the history timeline.
This means that you can just experiment to get a hang of it, and easily undo your experiments.

### Which application state is included in history?

In general everything is included, except when it wouldn't be useful or practical (or even possible in some cases).

Some things that might seem weird to include in a history timeline have to be included,
because otherwise it wouldn't be possible to restore the UI state.

<details> <summary>What is not included in the timeline?</summary>


* Options related to history behavior and visualization
* The palette (it offers a stable place to put things)
* Options that change how names are displayed
* Options that change which information is displayed (source links, properties)
* Compact mode of dragable elements if present
* Visibility of element locators on non-root custom property scopes
* The currently focused element index of element locators
* Sporadic local state that is not needed when replaying (like when adding an alias it doesn't need the dialog)

Everything else is tracked, but can be opted out individually by keeping it locked.

</details>

### Why can I drag these seemingly too small pieces of UI around?
While this seems overkill, it's more useful than you'd think.
There's a lot of different ways in which a page can use CSS.
Sometimes you never need to touch a given option, sometimes you need to toggle it very often.
Personal preference can also mean one person constantly uses an option, while the other one rarely or never.

The same goes for combinations of UI elements. If you often inspect and need to switch the granularity or search filter,
it's a more pleasant UX if you can position those options right next to the inspector.
If you don't want this (or it's not relevant on the site), it's nice to be able to recover the screen real estate.

This is also the reason options are not grouped into something like an options menu, which would make it difficult
to offer this level of customization.

Lastly, it's implemented efficiently enough to not have to care about how many things are draggable.

### Why does the editor seem largely unstyled?
It's a bit contradictory for a theme editing application to use this many default browser styles.
Plenty of things could definitely look and behave better with a bit more CSS.

There's 2 main reasons for this.

The first is that, for now, it actually loads the styles of the inspected page. While it results in a bit of a mess from time to time,
it helps harden the CSS that is used, and can also help understand different kinds of CSS better while developing this app.
It often actually looks good and consistent with the inspected page.

The second reason is the existential crisis arising from working with all kinds of different CSS methodologies.
You'd think after some time this would show that one way of doing things is clearly better, but that's not the case.
As a result, it's now mostly developed with easy and robust styles to cut down on complexity until choices can be confidently made.

### Why is there no good overview of the changes I've made?
A lot of the data extraction and inspection logic is being rewritten at the moment.
The `CurrentTheme` component (by default in the drawer) used to fulfill the purpose of showing a list of all changes you made,
but it's not being updated until this refactor is done.

While this is obviously a crucial component in the eventual use case, for development of everything else it's not necessary
so it's much more efficient to postpone it.

For now you can still get an overview by exporting the current theme as JSON or CSS.

## Included packages*

\* Not fully set up as separate packages yet, but code should work as such.
These components should work with any React application.

### [Draggable elements](https://github.com/Inwerpsel/design-mode/tree/main/src/components/movable)
I have no good name for it yet (in code called MovablePanels). It makes drag and drop rearrangement in React very easy.

### [State management with history](https://github.com/Inwerpsel/design-mode/blob/main/src/hooks/useResumableReducer.tsx)
Using `useSyncExternalStore`, these hooks make it possible to put multiple pieces of state into a single history timeline,
while offering a similar function signature as `useState` and `useReducer`. Any code that uses either should just work
with history by replacing the function, and adding a string key.

* Capture any combination of separate states (simple or with reducers) into a single timeline.
* Only elements with changes are ever rerendered when jumping between any 2 states in history.
* Some (rough) components for timeline navigation and visualization.
* Register a custom component per action to visualize in the timeline.
* Debounces everything by default (you'd never want history without it).
* Store all history across page loads using IndexedDb.

## Known current issues and limitations
A few components are not (fully) working at the moment, mostly because they depend on future changes, but also some small bugs.

You should take the following into account when trying the demo.

- Current theme view not working properly (needs adaptation to selector scoped properties).
It can still be used for a general overview but is missing variable values and can't be filtered properly.
- Add alias for raw values not working (which you'd probably expect it to do, but currently it only substitues the value inside of `var()` statements).
- History needs to be cleared manually before it gets too big (how big depends on exact content, but should be fine below 200 entries, for reasonably optimized sites).
- All inspections are re-executed in one task, immediately when history is applied when loading the page,
causing a potentially long delay and increasing memory usage.
- When you create a history stash (by using undo and then continuing from an older state), if there are locks on the stashed entries,
the locked state will be included in both the new timeline and still in the stash. This is not ideal as it's confusing and might lead to bugs.

<details>
<summary>
  Here's a long list / braindump of some in progress work and ideas. I'll gradually convert some to issues.
</summary>

### IN PROGRESS
- Support "locally" scoped custom properties
  - Problem: Selector specificity when adding a rule after the existing rules
    - For now this is solved using `!important`, which surprisingly seems to work 100% of the time.
    - However, an even better solution is to take full control over the stylesheets on the page so
      that no overriding rules are needed.
      - No additional CSS rules
      - Recalculations affect (often much) less elements, because cascading no longer needed
      - No specificity challenges at all
      - Also supports regular CSS edits
- Determine / infer property types
  - examples + libs
    - https://github.com/mdn/yari/blob/main/kumascript/macros/CSSSyntax.ejs
    - https://github.com/w3c/webref/tree/main/packages/css
    - https://github.com/csstree/csstree
    - https://github.com/mdn/data/
  - "De facto" type system?
    - A variable gets its type from the intersection of all CSS properties it's used on.
      - Seems hard to parse from allowed syntaxes? Perhaps not a problem in most cases?
    - UI filters the actions it allows, so that the end result is always legal CSS.
    - e.g. you should be able to change a variable to a gradient if it's only used on the `background` property.
      You should not be able to assign a gradient variable to a non-background property.
    - Split up a single variable into multiple groups with the same value types? E.g. you start adding a color to a 
      bunch of backgrounds and text colors, then find you want to use a gradient on all these backgrounds, but preserve
      the regular text colors.
  - Additional constraints
    - Should be possible to force constraints beyond usage inference.
    - Or perhaps including a property access in code is a very simple way to achieve this?
  - Fix handling of multiple variables on a single rule
  - Support typing of variables surrounded by just 1 function
    - It's apparently a common thing for frameworks to hard code which color function to use, and have the variables only
      contain the arguments. (e.g. BS and derivatives, mostly in DaisyUI)
    - Even though this is a bad idea for multiple reasons, I don't expect common frameworks to change it soon.
    - Can be somewhat generalized. Perhaps check type of function arguments in CSS syntax?

### TODO
- Variable actions:
  - Convert a raw value to a variable
    - First search for existing vars with same value
    - Always show these options in case of raw values (unless they're not used in selectors)
  - Search all equal raw values and replace with variable
  - Split variable into multiple
- Visualize some math functions
- More tailored controls / group properties into single control?
- Make hotkeys configurable in the UI
- Use `ResponsiveFrame` to render multiple themes / screen sizes at the same time
- Expand the color usages quick menu to allow picking all kinds of values. Maybe a textual widget ordered by how
  frequently used?
- Hot reloading would be nice, as reloading the page to see your changes applied will reset the iframe's scroll
  position.
- Better organizing of themes.
- Personal editor theme that is applied separately from the theme that is being edited. (detect own stylesheets?)
- Use sourcemap location and edits to auto generate a PR.
- Improve elements with a hidden or hard to access state
- Show current changes compared to server (maybe integrate with "current theme" component?)
- As browser extension?
  - Address CORS (or detect + warn)
  - Address idle performance (lazy extract page variables / lazy include entire script)
- Visualize overridden scope values, so that you can see what happens when removed from a scope.
  - However, it shouldn't result in a devtools like experience, where over half of what's shown is overridden rules.
- Allow mapping hotkeys to any reducer action
  - Since reducers are already collected for history, it should be a small step to list this
    collection and allow setting a mapping.
  - Perhaps handle actions with a payload?
    - Some values can be entered manually (e.g. increment by a certain amount, choose a particular string like for panel layout)
    - Other values could come from some sort of context (e.g. the currently focused variable control)
    - Other approach is to tie it to event listeners. Might allow defining function once. Still need to check focus probably.
- History actions
  - Clear newer / older separately
  - Squash

## Future theme structure

Currently themes are just a list of selectors with lists of properties.
Eventually the theme should be a sort of "diff" compared to a current set of CSS files.
New files can then be generated if the diff format allows to locate the source declaration
for each item. It's unclear where the source code mapping should happen.

#### Declarations
Each item: selector + property (combined unique ID, this could be a single ID as well, anything that allows you to find the right source)
* Updated decls (including adding properties, order by convention within selector)
  * data: new value
* Removed decls
  * data: none

#### Other
* Added selectors
  * data: selector text, source position, media query
  * Translate to multiple source CSS dialects (where?)
  * Ideally a minimal description of the source position requirements. E.g. only say "after X". It's then up to
    the code generating for a particular source to deterministically figure out the exact position.
* Added media queries
  * data: condition text (maybe parsed a bit), source position
* Added animations
* Added resources (links, images, fonts)

</details>
