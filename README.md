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

## Macros

### D&D 5e

Recommended modules:

- [Vision 5e](https://foundryvtt.com/packages/vision-5e)
- [Walled Templates](https://foundryvtt.com/packages/walledtemplates)

#### Darkness spell

```js
// Darkness spell template
await new dnd5e.canvas.AbilityTemplate(
  new CONFIG.MeasuredTemplate.documentClass(
    {
      t: CONST.MEASURED_TEMPLATE_TYPES.CIRCLE,
      distance: 15,
      fillColor: game.user.color,
      flags: {
        limits: {
          sight: {
            basicSight: { enabled: true, range: 0 }, // Darkvision
            ghostlyGaze: { enabled: true, range: 0 }, // Ghostly Gaze
            lightPerception: { enabled: true, range: 0 }, // Light Perception
          },
          light: { enabled: true, range: 0 },
        },
        walledtemplates: {
          wallRestriction: "move",
          wallsBlock: "recurse",
        },
      },
    },
    { parent: canvas.scene }
  )
).drawPreview();
```

#### Fog Cloud spell

```js
// Fog Cloud spell (level 1) template
await new dnd5e.canvas.AbilityTemplate(
  new CONFIG.MeasuredTemplate.documentClass(
    {
      t: CONST.MEASURED_TEMPLATE_TYPES.CIRCLE,
      distance: 20,
      fillColor: game.user.color,
      flags: {
        limits: {
          sight: {
            blindsight: { enabled: true, range: 0 }, // Blindsight
            basicSight: { enabled: true, range: 0 }, // Darkvision
            devilsSight: { enabled: true, range: 0 }, // Devil's Sight
            lightPerception: { enabled: true, range: 0 }, // Light Perception
            seeAll: { enabled: true, range: 0 }, // Truesight
          },
        },
        walledtemplates: {
          wallRestriction: "move",
          wallsBlock: "recurse",
        },
      },
    },
    { parent: canvas.scene }
  )
).drawPreview();
```

#### Silence spell

```js
// Silence spell template
await new dnd5e.canvas.AbilityTemplate(
  new CONFIG.MeasuredTemplate.documentClass(
    {
      t: CONST.MEASURED_TEMPLATE_TYPES.CIRCLE,
      distance: 20,
      fillColor: game.user.color,
      flags: {
        limits: {
          sight: {
            hearing: { enabled: true, range: 0 }, // Hearing
          },
          sound: { enabled: true, range: 0 },
        },
        walledtemplates: {
          wallRestriction: "move",
          wallsBlock: "walled",
        },
      },
    },
    { parent: canvas.scene }
  )
).drawPreview();
```
