import { Extension } from "../extension.mjs";

export class DrawingExtension extends Extension {
    /** @override */
    registerHooks() {
        Hooks.on("drawDrawing", (object) => {
            if (object.isPreview) {
                return;
            }

            this.updateVolume(object.document);
        });

        Hooks.on("updateDrawing", (document) => {
            if (!document.rendered) {
                return;
            }

            this.updateVolume(document);
        });

        Hooks.on("destroyDrawing", (object) => {
            if (object.isPreview) {
                return;
            }

            this.updateVolume(object.document, true);
        });

        Hooks.on("renderDrawingConfig", (sheet) => {
            if (sheet.options.configureDefault) {
                return;
            }

            this.injectConfig(sheet, [`.tab[data-tab="position"]`], "beforeend");
        });
    }

    /** @override */
    prepareVolumeData(document, data) {
        let bottom = null;
        let top = null;

        if (game.modules.get("levels")?.active) {
            bottom = document.flags.levels?.rangeBottom ?? null;
            top = document.flags.levels?.rangeTop ?? null;
        }

        data.updateSource({
            hidden: document.hidden,
            mode: 4,
            boundaries: [{
                type: "cylinder",
                data: {
                    base: [{
                        x: document.x,
                        y: document.y,
                        rotation: document.rotation,
                        shape: document.shape,
                        bezierFactor: document.bezierFactor,
                    }],
                    bottom,
                    top
                }
            }]
        });
    }
}
