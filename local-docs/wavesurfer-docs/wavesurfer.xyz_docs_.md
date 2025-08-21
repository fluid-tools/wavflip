---
url: "https://wavesurfer.xyz/docs/"
title: "wavesurfer.js"
---

## wavesurfer.js

# [![logo](https://user-images.githubusercontent.com/381895/226091100-f5567a28-7736-4d37-8f84-e08f297b7e1a.png) wavesurfer.js](https://wavesurfer.xyz/docs/\#md:-wavesurferjs)

[![npm](https://img.shields.io/npm/v/wavesurfer.js)](https://www.npmjs.com/package/wavesurfer.js)[![sponsor](https://img.shields.io/badge/sponsor_us-%F0%9F%A4%8D-%23B14586)](https://github.com/sponsors/katspaugh)

**Wavesurfer.js** is an interactive waveform rendering and audio playback vault, perfect for web applications. It leverages modern web technologies to provide a robust and visually engaging audio experience.

![waveform screenshot](https://github.com/katspaugh/wavesurfer.js/assets/381895/05f03bed-800e-4fa1-b09a-82a39a1c62ce)

**Gold sponsor 💖** [Closed Caption Creator](https://www.closedcaptioncreator.com/)

# [Table of contents](https://wavesurfer.xyz/docs/\#md:table-of-contents)

1. [Getting started](https://wavesurfer.xyz/docs/#getting-started)
2. [API reference](https://wavesurfer.xyz/docs/#api-reference)
3. [Plugins](https://wavesurfer.xyz/docs/#plugins)
4. [CSS styling](https://wavesurfer.xyz/docs/#css-styling)
5. [Frequent questions](https://wavesurfer.xyz/docs/#questions)
6. [Upgrading from v6 to v7](https://wavesurfer.xyz/docs/#upgrading-from-v6-to-v7)
7. [Development](https://wavesurfer.xyz/docs/#development)
8. [Tests](https://wavesurfer.xyz/docs/#tests)
9. [Feedback](https://wavesurfer.xyz/docs/#feedback)

## [Getting started](https://wavesurfer.xyz/docs/\#md:getting-started)

Install and import the package:

```bash
npm install --save wavesurfer.js
Copy
```

```js
import WaveSurfer from 'wavesurfer.js'
Copy
```

Alternatively, insert a UMD script tag which exports the vault as a global `WaveSurfer` variable:

```html
<script src="https://unpkg.com/wavesurfer.js@7"></script>
Copy
```

Create a wavesurfer instance and pass various [options](https://wavesurfer.xyz/docs/options):

```js
const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: '#4F4A85',
  progressColor: '#383351',
  url: '/audio.mp3',
})
Copy
```

To import one of the plugins, e.g. the [Regions plugin](https://wavesurfer.xyz/examples/?regions.js):

```js
import Regions from 'wavesurfer.js/dist/plugins/regions.esm.js'
Copy
```

Or as a script tag that will export `WaveSurfer.Regions`:

```html
<script src="https://unpkg.com/wavesurfer.js@7/dist/plugins/regions.min.js"></script>
Copy
```

TypeScript types are included in the package, so there's no need to install `@types/wavesurfer.js`.

See more [examples](https://wavesurfer.xyz/examples).

## [API reference](https://wavesurfer.xyz/docs/\#md:api-reference)

See the wavesurfer.js documentation on our website:

- [methods](https://wavesurfer.xyz/docs/methods)
- [options](https://wavesurfer.xyz/docs/options)
- [events](https://wavesurfer.xyz/docs/events)

## [Plugins](https://wavesurfer.xyz/docs/\#md:plugins)

We maintain a number of official plugins that add various extra features:

- [Regions](https://wavesurfer.xyz/examples/?regions.js) – visual overlays and markers for regions of audio
- [Timeline](https://wavesurfer.xyz/examples/?timeline.js) – displays notches and time labels below the waveform
- [Minimap](https://wavesurfer.xyz/examples/?minimap.js) – a small waveform that serves as a scrollbar for the main waveform
- [Envelope](https://wavesurfer.xyz/examples/?envelope.js) – a graphical interface to add fade-in and -out effects and control volume
- [Record](https://wavesurfer.xyz/examples/?record.js) – records audio from the microphone and renders a waveform
- [Spectrogram](https://wavesurfer.xyz/examples/?spectrogram.js) – visualization of an audio frequency spectrum (written by @akreal)
- [Hover](https://wavesurfer.xyz/examples/?hover.js) – shows a vertical line and timestmap on waveform hover

## [CSS styling](https://wavesurfer.xyz/docs/\#md:css-styling)

wavesurfer.js v7 is rendered into a Shadow DOM tree. This isolates its CSS from the rest of the web page.
However, it's still possible to style various wavesurfer.js elements with CSS via the `::part()` pseudo-selector.
For example:

```css
#waveform ::part(cursor):before {
  content: '🏄';
}
#waveform ::part(region) {
  font-family: fantasy;
}
Copy
```

You can see which elements you can style in the DOM inspector – they will have a `part` attribute.
See [this example](https://wavesurfer.xyz/examples/?styling.js) to play around with styling.

## [Questions](https://wavesurfer.xyz/docs/\#md:questions)

Have a question about integrating wavesurfer.js on your website? Feel free to ask in our [Discussions forum](https://github.com/wavesurfer-js/wavesurfer.js/discussions/categories/q-a).

However, please keep in mind that this forum is dedicated to wavesurfer-specific questions. If you're new to JavaScript and need help with the general basics like importing NPM modules, please consider asking ChatGPT or StackOverflow first.

### [FAQ](https://wavesurfer.xyz/docs/\#md:faq)

I'm having CORS issues
Wavesurfer fetches audio from the URL you specify in order to decode it. Make sure this URL allows fetching data from your domain. In browser JavaScript, you can only fetch data eithetr from **the same domain** or another domain if and only if that domain enables [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). So if your audio file is on an external domain, make sure that domain sends the right Access-Control-Allow-Origin headers. There's nothing you can do about it from the requesting side (i.e. your JS code).
Does wavesurfer support large files?
Since wavesurfer decodes audio entirely in the browser using Web Audio, large clips may fail to decode due to memory constraints. We recommend using pre-decoded peaks for large files (see [this example](https://wavesurfer.xyz/examples/?predecoded.js)). You can use a tool like [bbc/audiowaveform](https://github.com/bbc/audiowaveform) to generate peaks.
What about streaming audio?
Streaming audio is supported only with [pre-decoded peaks and duration](https://wavesurfer.xyz/examples/?predecoded.js).
There is a mismatch between my audio and the waveform. How do I fix it?
If you're using a VBR (variable bit rate) audio file, there might be a mismatch between the audio and the waveform. This can be fixed by converting your file to CBR (constant bit rate).


Alternatively, you can use the [Web Audio shim](https://wavesurfer.xyz/examples/?webaudio-shim.js) which is more accurate.

How do I connect wavesurfer.js to Web Audio effects?
Generally, wavesurfer.js doesn't aim to be a wrapper for all things Web Audio. It's just a player with a waveform visualization. It does allow connecting itself to a Web Audio graph by exporting its audio element (see [this example](https://wavesurfer.xyz/examples/?4436ec40a2ab943243755e659ae32196)) but nothign more than that. Please don't expect wavesurfer to be able to cut, add effects, or process your audio in any way.

## [Upgrading from v6 to v7](https://wavesurfer.xyz/docs/\#md:upgrading-from-v6-to-v7)

Wavesurfer.js v7 is a TypeScript rewrite of wavesurfer.js that brings several improvements:

- Typed API for better development experience
- Enhanced decoding and rendering performance
- New and improved plugins

Most options, events, and methods are similar to those in previous versions.

### [Notable differences](https://wavesurfer.xyz/docs/\#md:notable-differences)

- HTML audio playback by default (used to be an opt-in via `backend: "MediaElement"`)
- The Markers plugin is removed – you should use the Regions plugin with just a `startTime`.
- No Microphone plugin – superseded by the new Record plugin with more features.
- The Cursor plugin is replaced by the Hover plugin.

### [Removed options](https://wavesurfer.xyz/docs/\#md:removed-options)

- `audioContext`, `closeAudioContext`, `audioScriptProcessor`
- `autoCenterImmediately` – `autoCenter` is now always immediate unless the audio is playing
- `backgroundColor`, `hideCursor` – this can be easily set via CSS
- `mediaType` – you should instead pass an entire media element in the `media` option. [Example](https://wavesurfer.xyz/examples/?video.js).
- `partialRender` – done by default
- `pixelRatio` – `window.devicePixelRatio` is used by default
- `renderer` – there's just one renderer for now, so no need for this option
- `responsive` – responsiveness is enabled by default
- `scrollParent` – the container will scroll if `minPxPerSec` is set to a higher value
- `skipLength` – there's no `skipForward` and `skipBackward` methods anymore
- `splitChannelsOptions` – you should now use `splitChannels` to pass the channel options. Pass `height: 0` to hide a channel. See [this example](https://wavesurfer.xyz/examples/?split-channels.js).
- `drawingContextAttributes`, `maxCanvasWidth`, `forceDecode` – removed to reduce code complexity
- `xhr` \- please use `fetchParams` instead
- `barMinHeight` \- the minimum bar height is now 1 pixel by default

### [Removed methods](https://wavesurfer.xyz/docs/\#md:removed-methods)

- `getFilters`, `setFilter` – see the [Web Audio example](https://wavesurfer.xyz/examples/?webaudio.js)
- `drawBuffer` – to redraw the waveform, use `setOptions` instead and pass new rendering options
- `cancelAjax` – you can pass an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) in `fetchParams`
- `skipForward`, `skipBackward`, `setPlayEnd` – can be implemented using `setTime(time)`
- `exportPCM` is replaced with `exportPeaks` which returns arrays of floats
- `toggleMute` is now called `setMuted(true | false)`
- `setHeight`, `setWaveColor`, `setCursorColor`, etc. – use `setOptions` with the corresponding params instead. E.g., `wavesurfer.setOptions({ height: 300, waveColor: '#abc' })`

See the complete [documentation of the new API](https://wavesurfer.xyz/docs).

## [Development](https://wavesurfer.xyz/docs/\#md:development)

To get started with development, follow these steps:

1. Install dev dependencies:

```
yarn
Copy
```

2. Start the TypeScript compiler in watch mode and launch an HTTP server:

```
yarn start
Copy
```

This command will open [http://localhost:9090](http://localhost:9090/) in your browser with live reload, allowing you to see the changes as you develop.

## [Tests](https://wavesurfer.xyz/docs/\#md:tests)

The tests are written in the Cypress framework. They are a mix of e2e and visual regression tests.

To run the test suite locally, first build the project:

```
yarn build
Copy
```

Then launch the tests:

```
yarn cypress
Copy
```

## [Feedback](https://wavesurfer.xyz/docs/\#md:feedback)

We appreciate your feedback and contributions!

If you encounter any issues or have suggestions for improvements, please don't hesitate to post in our [forum](https://github.com/wavesurfer-js/wavesurfer.js/discussions/categories/q-a).

We hope you enjoy using wavesurfer.js and look forward to hearing about your experiences with the vault!

### Settings

#### Member Visibility

- Protected
- Private
- Inherited
- External

#### Theme

OSLightDark

### On This Page

- [wavesurfer.js](https://wavesurfer.xyz/docs/#md:-wavesurferjs)
- [Table of contents](https://wavesurfer.xyz/docs/#md:table-of-contents)
  - [Getting started](https://wavesurfer.xyz/docs/#md:getting-started)
  - [API reference](https://wavesurfer.xyz/docs/#md:api-reference)
  - [Plugins](https://wavesurfer.xyz/docs/#md:plugins)
  - [CSS styling](https://wavesurfer.xyz/docs/#md:css-styling)
  - [Questions](https://wavesurfer.xyz/docs/#md:questions)
    - [FAQ](https://wavesurfer.xyz/docs/#md:faq)
  - [Upgrading from v6 to v7](https://wavesurfer.xyz/docs/#md:upgrading-from-v6-to-v7)
    - [Notable differences](https://wavesurfer.xyz/docs/#md:notable-differences)
    - [Removed options](https://wavesurfer.xyz/docs/#md:removed-options)
    - [Removed methods](https://wavesurfer.xyz/docs/#md:removed-methods)
  - [Development](https://wavesurfer.xyz/docs/#md:development)
  - [Tests](https://wavesurfer.xyz/docs/#md:tests)
  - [Feedback](https://wavesurfer.xyz/docs/#md:feedback)

Generated using [TypeDoc](https://typedoc.org/)