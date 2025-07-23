---
url: "https://wavesurfer.xyz/docs/types/wavesurfer.WaveSurferEvents"
title: "WaveSurferEvents | wavesurfer.js"
---

- [wavesurfer.js](https://wavesurfer.xyz/docs/index.html)
- [wavesurfer](https://wavesurfer.xyz/docs/modules/wavesurfer.html)
- [WaveSurferEvents](https://wavesurfer.xyz/docs/types/wavesurfer.WaveSurferEvents.html)

# Type alias WaveSurferEvents

WaveSurferEvents:{

audioprocess: \[currentTime: number\];

click: \[relativeX: number, relativeY: number\];

dblclick: \[relativeX: number, relativeY: number\];

decode: \[duration: number\];

destroy: \[\];

drag: \[relativeX: number\];

dragend: \[relativeX: number\];

dragstart: \[relativeX: number\];

error: \[error: Error\];

finish: \[\];

init: \[\];

interaction: \[newTime: number\];

load: \[url: string\];

loading: \[percent: number\];

pause: \[\];

play: \[\];

ready: \[duration: number\];

redraw: \[\];

redrawcomplete: \[\];

scroll: \[visibleStartTime: number, visibleEndTime: number, scrollLeft: number, scrollRight: number\];

seeking: \[currentTime: number\];

timeupdate: \[currentTime: number\];

zoom: \[minPxPerSec: number\];

}

#### Type declaration

- ##### audioprocess: \[currentTime: number\]




An alias of timeupdate but only when the audio is playing

- ##### click: \[relativeX: number, relativeY: number\]




When the user clicks on the waveform

- ##### dblclick: \[relativeX: number, relativeY: number\]




When the user double-clicks on the waveform

- ##### decode: \[duration: number\]




When the audio has been decoded

- ##### destroy: \[\]




Just before the waveform is destroyed so you can clean up your events

- ##### drag: \[relativeX: number\]




When the user drags the cursor

- ##### dragend: \[relativeX: number\]




When the user ends dragging the cursor

- ##### dragstart: \[relativeX: number\]




When the user starts dragging the cursor

- ##### error: \[error: Error\]




When source file is unable to be fetched, decoded, or an error is thrown by media element

- ##### finish: \[\]




When the audio finishes playing

- ##### init: \[\]




After wavesurfer is created

- ##### interaction: \[newTime: number\]




When the user interacts with the waveform (i.g. clicks or drags on it)

- ##### load: \[url: string\]




When audio starts loading

- ##### loading: \[percent: number\]




During audio loading

- ##### pause: \[\]




When the audio pauses

- ##### play: \[\]




When the audio starts playing

- ##### ready: \[duration: number\]




When the audio is both decoded and can play

- ##### redraw: \[\]




When visible waveform is drawn

- ##### redrawcomplete: \[\]




When all audio channel chunks of the waveform have drawn

- ##### scroll: \[visibleStartTime: number, visibleEndTime: number, scrollLeft: number, scrollRight: number\]




When the waveform is scrolled (panned)

- ##### seeking: \[currentTime: number\]




When the user seeks to a new position

- ##### timeupdate: \[currentTime: number\]




On audio position change, fires continuously during playback

- ##### zoom: \[minPxPerSec: number\]




When the zoom level changes


### Settings

#### Member Visibility

- Protected
- Private
- Inherited
- External

#### Theme

OSLightDark

Generated using [TypeDoc](https://typedoc.org/)