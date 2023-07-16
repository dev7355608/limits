import { Extension } from "../extension.mjs";

export class TileExtension extends Extension {
    /** @override */
    registerHooks() {
        Hooks.on("canvasReady", () => {
            for (const object of canvas.tiles.placeables) {
                if (object.isPreview) {
                    continue;
                }

                this.#updateVolume(object.document);
            }
        });

        Hooks.on("createTile", (document) => {
            if (!document.rendered) {
                return;
            }

            this.#updateVolume(document);
        });

        Hooks.on("updateTile", (document) => {
            if (!document.rendered) {
                return;
            }

            this.#updateVolume(document);
        });

        Hooks.on("deleteTile", (document) => {
            this.#updateVolume(document, true);
        });

        Hooks.on("renderTileConfig", (sheet) => {
            this.injectConfig(sheet, [`.tab[data-tab="basic"]`], "beforeend");
        });
    }

    /**
     * @param {Document} document
     * @param {boolean} [deleted=false]
     */
    async #updateVolume(document, deleted) {
        if (deleted || !document.texture.src || getTexture(document.texture.src)) {
            this.updateVolume(document, deleted);
        } else {
            loadTexture(document.texture.src).then(() => this.updateVolume(document));
        }
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
                        shape: {
                            type: "r",
                            width: document.width,
                            height: document.height
                        },
                        texture: {
                            src: document.texture.src,
                            scaleX: document.texture.scaleX,
                            scaleY: document.texture.scaleY,
                            rotation: document.texture.rotation,
                            offsetX: document.texture.offsetX,
                            offsetY: document.texture.offsetY
                        }
                    }],
                    bottom: document.elevation * document.parent.dimensions.distancePixels
                }
            }]
        });
    }
}
