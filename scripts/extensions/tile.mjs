import { Extension } from "../extension.mjs";

export class TileExtension extends Extension {
    /** @override */
    registerHooks() {
        Hooks.on("drawTile", (object) => {
            if (object.isPreview) {
                return;
            }

            this.updateVolume(object.document);
        });

        Hooks.on("updateTile", (document) => {
            if (!document.rendered) {
                return;
            }

            this.#updateVolume(document);
        });

        Hooks.on("destroyTile", (object) => {
            if (object.isPreview) {
                return;
            }

            this.updateVolume(object.document, true);
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
        let bottom = null;
        let top = null;

        if (document.overhead && game.modules.get("levels")?.active) {
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
                    bottom,
                    top
                }
            }]
        });
    }
}
