---
url: "https://wavesurfer.xyz/docs/types/wavesurfer.WaveSurferOptions"
title: "WaveSurferOptions | wavesurfer.js"
---

- [wavesurfer.js](https://wavesurfer.xyz/docs/index.html)
- [wavesurfer](https://wavesurfer.xyz/docs/modules/wavesurfer.html)
- [WaveSurferOptions](https://wavesurfer.xyz/docs/types/wavesurfer.WaveSurferOptions.html)

# Type alias WaveSurferOptions

WaveSurferOptions:{

audioRate?: number;

autoCenter?: boolean;

autoScroll?: boolean;

autoplay?: boolean;

backend?: "WebAudio" \| "MediaElement";

barAlign?: "top" \| "bottom";

barGap?: number;

barHeight?: number;

barRadius?: number;

barWidth?: number;

blobMimeType?: string;

container: HTMLElement \| string;

cspNonce?: string;

cursorColor?: string;

cursorWidth?: number;

dragToSeek?: boolean \| {

debounceTime: number;

};

duration?: number;

fetchParams?: RequestInit;

fillParent?: boolean;

height?: number \| "auto";

hideScrollbar?: boolean;

interact?: boolean;

media?: HTMLMediaElement;

mediaControls?: boolean;

minPxPerSec?: number;

normalize?: boolean;

peaks?: (Float32Array \| number\[\])\[\];

plugins?: GenericPlugin\[\];

progressColor?: string \| string\[\] \| CanvasGradient;

renderFunction?: ((peaks, ctx) =\> void);

sampleRate?: number;

splitChannels?: (Partial< [WaveSurferOptions](https://wavesurfer.xyz/docs/types/wavesurfer.WaveSurferOptions.html) > & {

overlay?: boolean;

})\[\];

url?: string;

waveColor?: string \| string\[\] \| CanvasGradient;

width?: number \| string;

}

#### Type declaration

- ##### `Optional` audioRate?: number




Audio rate, i.e. the playback speed

- ##### `Optional` autoCenter?: boolean




If autoScroll is enabled, keep the cursor in the center of the waveform during playback

- ##### `Optional` autoScroll?: boolean




Automatically scroll the container to keep the current position in viewport

- ##### `Optional` autoplay?: boolean




Play the audio on load

- ##### `Optional` backend?: "WebAudio" \| "MediaElement"




Playback "backend" to use, defaults to MediaElement

- ##### `Optional` barAlign?: "top" \| "bottom"




Vertical bar alignment

- ##### `Optional` barGap?: number




Spacing between bars in pixels

- ##### `Optional` barHeight?: number




A vertical scaling factor for the waveform

- ##### `Optional` barRadius?: number




Rounded borders for bars

- ##### `Optional` barWidth?: number




If set, the waveform will be rendered with bars like this: ▁ ▂ ▇ ▃ ▅ ▂

- ##### `Optional` blobMimeType?: string




Override the Blob MIME type

- ##### container: HTMLElement \| string




Required: an HTML element or selector where the waveform will be rendered

- ##### `Optional` cspNonce?: string




Nonce for CSP if necessary

- ##### `Optional` cursorColor?: string




The color of the playback cursor

- ##### `Optional` cursorWidth?: number




The cursor width

- ##### `Optional` dragToSeek?: boolean \| {   debounceTime: number;   }




Allow to drag the cursor to seek to a new position. If an object with `debounceTime` is provided instead
then `dragToSeek` will also be true. If `true` the default is 200ms

- ##### `Optional` duration?: number




Pre-computed audio duration in seconds

- ##### `Optional` fetchParams?: RequestInit




Options to pass to the fetch method

- ##### `Optional` fillParent?: boolean




Stretch the waveform to fill the container, true by default

- ##### `Optional` height?: number \| "auto"




The height of the waveform in pixels, or "auto" to fill the container height

- ##### `Optional` hideScrollbar?: boolean




Hide the scrollbar

- ##### `Optional` interact?: boolean




Pass false to disable clicks on the waveform

- ##### `Optional` media?: HTMLMediaElement




Use an existing media element instead of creating one

- ##### `Optional` mediaControls?: boolean




Whether to show default audio element controls

- ##### `Optional` minPxPerSec?: number




Minimum pixels per second of audio (i.e. the zoom level)

- ##### `Optional` normalize?: boolean




Stretch the waveform to the full height

- ##### `Optional` peaks?: (Float32Array \| number\[\])\[\]




Pre-computed audio data, arrays of floats for each channel

- ##### `Optional` plugins?: GenericPlugin\[\]




The list of plugins to initialize on start

- ##### `Optional` progressColor?: string \| string\[\] \| CanvasGradient




The color of the progress mask

- ##### `Optional` renderFunction?: ((peaks, ctx) =\> void)

  - (peaks, ctx): void
  - Custom render function





    #### Parameters



- ##### peaks: (Float32Array \| number\[\])\[\]

- ##### ctx: CanvasRenderingContext2D


#### Returns void
- ##### `Optional` sampleRate?: number




Decoding sample rate. Doesn't affect the playback. Defaults to 8000

- ##### `Optional` splitChannels?: (Partial< [WaveSurferOptions](https://wavesurfer.xyz/docs/types/wavesurfer.WaveSurferOptions.html) > & {   overlay?: boolean;   })\[\]




Render each audio channel as a separate waveform

- ##### `Optional` url?: string




Audio URL

- ##### `Optional` waveColor?: string \| string\[\] \| CanvasGradient




The color of the waveform

- ##### `Optional` width?: number \| string




The width of the waveform in pixels or any CSS value; defaults to 100%


### Settings

#### Member Visibility

- Protected
- Private
- Inherited
- External

#### Theme

OSLightDark

Generated using [TypeDoc](https://typedoc.org/)