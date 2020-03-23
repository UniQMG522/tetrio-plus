# Tetr.io+
Tetr.io block skin and music customizer

## Warnings
**This software is not associated with or created by Tetr.io or osk**

**This is provided AS-IS, it's not terribly polished, its not particularly
extensively tested, and it's not packaged into a proper extension.**

Chromium-based browsers are not supported as [they lack](https://bugs.chromium.org/p/chromium/issues/detail?id=487422)
an [important API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData)
used by this project.

### Custom block skins
Tetr.io+ allows you to use a custom block skin. It's client side only and
applies to all players. Currently, only SVGs are supported, and they must match
the format of [minos.svg](https://tetr.io/res/minos.svg) used by Tetr.io.
Other image formats may be supported in the future

### Custom music
Tetr.io+ allows you to add custom music to the game, and optionally disable the
game's existing soundtrack. Only MP3s are supported.

## Installing
Installing as a temporary addon for firefox:
- Download zip and extract, or git clone
- Go to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
- Click 'Load Temporary Addon' and select the manifest.json file

Note that temporary addons disappear when you completely close firefox.

I'll get around to making a proper signed addon that stays installed eventually
