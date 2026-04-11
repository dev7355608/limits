import { DetectionModeMixin } from "./canvas/perception/detection-mode.mjs";
import { TYPE } from "./const.mjs";
import RegionMixin from "./canvas/region.mjs";
import { PointDarknessSourceMixin, PointLightSourceMixin, PointSoundSourceMixin, PointVisionSourceMixin } from "./canvas/sources/_module.mjs";
import RegionDocumentMixin from "./data/region.mjs";
import LimitRangeRegionBehaviorType from "./data/region-behavior-type.mjs";
import { applyMixin } from "./utils.mjs";

Hooks.once("init", () => {
    CONFIG.RegionBehavior.dataModels[TYPE] = LimitRangeRegionBehaviorType;
    CONFIG.RegionBehavior.typeIcons[TYPE] = "fa-solid fa-eye-low-vision";
    CONFIG.RegionBehavior.typeLabels[TYPE] = "LIMITS.label";
    CONFIG.RegionBehavior.typeHints[TYPE] = "LIMITS.hint";

    Hooks.once("i18nInit", () => {
        CONFIG.Region.documentClass = RegionDocumentMixin(CONFIG.Region.documentClass);

        Hooks.once("setup", () => {
            CONFIG.Region.objectClass = RegionMixin(CONFIG.Region.objectClass);

            Hooks.on("canvasInit", () => {
                mixinDetectionModes();
                mixinPointSources();
            });
        });
    });
});

function mixinDetectionModes() {
    for (const mode of Object.values(CONFIG.Canvas.detectionModes)) {
        const modeClass = applyMixin(mode.constructor, DetectionModeMixin);

        Object.setPrototypeOf(mode, modeClass.prototype);
    }
}

function mixinPointSources() {
    CONFIG.Canvas.visionSourceClass = applyMixin(CONFIG.Canvas.visionSourceClass, PointVisionSourceMixin);
    CONFIG.Canvas.lightSourceClass = applyMixin(CONFIG.Canvas.lightSourceClass, PointLightSourceMixin);
    CONFIG.Canvas.darknessSourceClass = applyMixin(CONFIG.Canvas.darknessSourceClass, PointDarknessSourceMixin);
    CONFIG.Canvas.soundSourceClass = applyMixin(CONFIG.Canvas.soundSourceClass, PointSoundSourceMixin);
}
