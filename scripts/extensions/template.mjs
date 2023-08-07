import { Shape } from "../utils/shape.js";
import { Extension } from "../extension.mjs";

export class TemplateExtension extends Extension {
    /** @override */
    registerHooks() {
        Hooks.on("drawMeasuredTemplate", (object) => {
            if (object.isPreview) {
                return;
            }

            this.updateVolume(object.document);
        });

        Hooks.on("updateMeasuredTemplate", (document) => {
            if (!document.rendered) {
                return;
            }

            this.updateVolume(document);
        });

        Hooks.on("refreshMeasuredTemplate", (object, flags) => {
            if (object.isPreview || !flags.refreshShape) {
                return;
            }

            this.updateVolume(object.document);
        });

        Hooks.on("destroyMeasuredTemplate", (object) => {
            if (object.isPreview) {
                return;
            }

            this.updateVolume(object.document, true);
        });

        Hooks.on("renderMeasuredTemplateConfig", (sheet) => {
            this.injectConfig(sheet, [`button[type="submit"]`], "beforebegin");
        });
    }

    /** @override */
    prepareVolumeData(document, data) {
        const shape = document.object.shape;
        let base;

        if (shape instanceof PIXI.Rectangle) {
            base = {
                x: document.x,
                y: document.y,
                shape: {
                    type: "r",
                    width: shape.width,
                    height: shape.height
                }
            };
        } else if (shape instanceof PIXI.Circle) {
            base = {
                x: document.x - shape.radius,
                y: document.y - shape.radius,
                shape: {
                    type: "e",
                    width: shape.radius * 2,
                    height: shape.radius * 2
                }
            };
        } else if (shape instanceof PIXI.Ellipse) {
            base = {
                x: document.x - shape.width,
                y: document.y - shape.height,
                shape: {
                    type: "e",
                    width: shape.width * 2,
                    height: shape.height * 2,
                }
            };
        } else if (shape instanceof PIXI.Polygon) {
            base = {
                x: document.x,
                y: document.y,
                shape: {
                    type: "p",
                    points: shape.points
                }
            };
        } else if (shape instanceof PIXI.RoundedRectangle) {
            base = {
                x: document.x,
                y: document.y,
                shape: {
                    type: "p",
                    points: Shape.from(shape).contour
                }
            };
        }

        data.updateSource({
            hidden: document.hidden,
            mode: 4,
            boundaries: base ? [{
                type: "cylinder",
                data: { base: [base] }
            }] : []
        });
    }
}
