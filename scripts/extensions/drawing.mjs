import { Extension } from "../extension.mjs";

export class DrawingExtension extends Extension {
    /** @override */
    registerHooks() {
        Hooks.on("canvasReady", () => {
            for (const object of canvas.drawings.placeables) {
                if (object.isPreview) {
                    continue;
                }

                this.updateVolume(object.document);
            }
        });

        Hooks.on("createDrawing", (document) => {
            if (!document.rendered) {
                return;
            }

            this.updateVolume(document);
        });

        Hooks.on("updateDrawing", (document) => {
            if (!document.rendered) {
                return;
            }

            this.updateVolume(document);
        });

        Hooks.on("deleteDrawing", (document) => {
            this.updateVolume(document, true);
        });

        Hooks.on("renderDrawingConfig", (sheet) => {
            this.injectConfig(sheet, [`.tab[data-tab="position"]`], "beforeend");
        });
    }

    /** @override */
    prepareVolumeData(document, data) {
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
                    bottom: document.elevation * document.parent.dimensions.distancePixels
                }
            }]
        });
    }
}
