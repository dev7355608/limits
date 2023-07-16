import { Extension } from "../extension.mjs";

export class SceneExtension extends Extension {
    /** @override */
    registerHooks() {
        Hooks.on("canvasReady", () => {
            this.updateVolume(canvas.scene);
        });

        Hooks.on("updateScene", (scene) => {
            if (!scene.isView) {
                return;
            }

            this.updateVolume(scene);
        });

        Hooks.on("canvasTearDown", () => {
            this.updateVolume(canvas.scene, true);
        });

        Hooks.on("renderSceneConfig", (sheet) => {
            this.injectConfig(sheet, [`.tab[data-tab="lighting"]`], "beforeend", (html) => `<hr>${html}`);
        });
    }

    /** @override */
    prepareVolumeData(scene, data) {
        data.updateSource({
            mode: 4,
            boundaries: [{
                type: "cylinder",
                data: {
                    base: [{
                        x: 0,
                        y: 0,
                        shape: {
                            type: "r",
                            width: scene.dimensions.width,
                            height: scene.dimensions.height
                        }
                    }]
                }
            }]
        });
    }
}
