# Tetr.io+
Tetr.io block skin, music, and sfx customizer

## Warnings
* **This software is not associated with or created by Tetr.io or osk**
* **This is provided AS-IS, it's not terribly polished, its not particularly
extensively tested, and it's not packaged into a proper extension.**
* **This can break your game. If your game fails to load or you encounter other
bugs, remove the extension and try again *before* reporting it**
* Chromium-based browsers are not supported as [they lack](https://bugs.chromium.org/p/chromium/issues/detail?id=487422) an [important API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData) used by this project.

## Custom block skins
Tetr.io+ allows you to use a custom block skin. It's client side only and
applies to all players. Currently, only SVGs are supported, and they must match
the format of [minos.svg](https://tetr.io/res/minos.svg) used by Tetr.io.
Other image formats may be supported in the future

### How-to
1. Extension menu -> Click "Change skin"
2. Click "Browse" in popup
3. Select the skin you'd like to use

## Custom music
Tetr.io+ allows you to add custom music to the game, and optionally disable the
game's existing soundtrack. Only MP3s are supported.

### How-to
1. Extension menu -> Click "Add new music"
2. Click "Browse" in popup
3. Select as many files as you'd like
4. In the extension menu, for each song, click "edit"
5. Configure looping by seeking the song and clicking "Set loop end"
6. Make any other edits you'd like
7. Click "Save changes"

## Custom sfx
Tetr.io+ allows you to use custom sound effects.

### How-to
1. Extension menu -> Click "Open sfx editor"
2. Click "Decode sfx atlas" and wait a few moments
3. Replace any sound effects you want by clicking one of the "Browse" buttons
4. Click "Re-encode and save changes" and wait a few moments
5. Make sure "Enable custom sfx" is checked in the extension menu

## Installing
Installing as a temporary addon for firefox:
* Download zip and extract, or git clone
* Go to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
* Click 'Load Temporary Addon' and select the manifest.json file

**Note that temporary addons disappear when you completely close firefox.**

I'll get around to making a proper signed addon that stays installed eventually
