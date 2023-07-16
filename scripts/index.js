import { DrawingExtension } from "./extensions/drawing.mjs";
import { SceneExtension } from "./extensions/scene.mjs";
import { TemplateExtension } from "./extensions/template.mjs";
import { TileExtension } from "./extensions/tile.mjs";

const extensions = [
    new DrawingExtension(),
    new TemplateExtension(),
    new SceneExtension(),
    new TileExtension()
];

Hooks.once("init", () => {
    for (const extension of extensions) {
        extension.registerHooks();
    }
});

import "./patches/light.mjs";
import "./patches/sight.mjs";
import "./patches/sound.mjs";

