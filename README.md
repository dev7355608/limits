[![Latest Version](https://img.shields.io/github/v/release/dev7355608/limits?display_name=tag&sort=semver&label=Latest%20Version)](https://github.com/dev7355608/limits/releases/latest)
![Foundry Version](https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https%3A%2F%2Fraw.githubusercontent.com%2Fdev7355608%2Flimits%2Fmain%2Fmodule.json)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Flimits&colorB=blueviolet)](https://forge-vtt.com/bazaar#package=limits)
[![License](https://img.shields.io/github/license/dev7355608/limits?label=License)](LICENSE)

# Limits (Foundry VTT Module)

This module allows you to define the maximum range of light, sight, and sound within the scene, drawings, templates, and tiles.

![config](images/config.png)

```js
token.document.setFlag("limits", {
  light: {
    enabled: true,
    range: 0,
  },
  sight: {
    basicSight: {
      enabled: true,
      range: 0,
    },
    seeAll: {
      enabled: true,
      range: 30,
    },
    // ...
  },
  sound: {
    enabled: false,
    range: null, // Infinity
  },
});
```
