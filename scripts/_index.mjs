import LimitRangeRegionBehaviorConfig from "./apps/region-behavior.mjs";
import { DetectionModeMixin } from "./canvas/perception/detection-mode.mjs";
import { PointDarknessSourceMixin, PointLightSourceMixin, PointSoundSourceMixin, PointVisionSourceMixin } from "./canvas/sources/_module.mjs";
import LimitRangeRegionBehaviorType from "./data/region-behavior.mjs";

const TYPE = "limits.limitRange";

Hooks.once("init", () => {
    CONFIG.RegionBehavior.dataModels[TYPE] = LimitRangeRegionBehaviorType;
    CONFIG.RegionBehavior.typeIcons[TYPE] = "fa-solid fa-eye-low-vision";
    CONFIG.RegionBehavior.typeLabels[TYPE] = "LIMITS.label";

    Hooks.once("setup", () => {
        Hooks.once("canvasInit", () => {
            mixinDetectionModes();
            mixinPointSources();
        });
    });

    if (game.release.generation < 13) {
        Hooks.once("ready", () => {
            CONFIG.RegionBehavior.sheetClasses[TYPE]["core.RegionBehaviorConfig"].cls = LimitRangeRegionBehaviorConfig;
        });
    }
});

function mixinDetectionModes() {
    const cache = new Map();

    for (const mode of Object.values(CONFIG.Canvas.detectionModes)) {
        let prototype = cache.get(mode.constructor);

        if (!prototype) {
            prototype = DetectionModeMixin(mode.constructor).prototype;
            cache.set(mode.constructor, prototype);
        }

        Object.setPrototypeOf(mode, prototype);
    }
}

function mixinPointSources() {
    CONFIG.Canvas.visionSourceClass = PointVisionSourceMixin(CONFIG.Canvas.visionSourceClass);
    CONFIG.Canvas.lightSourceClass = PointLightSourceMixin(CONFIG.Canvas.lightSourceClass);
    CONFIG.Canvas.darknessSourceClass = PointDarknessSourceMixin(CONFIG.Canvas.darknessSourceClass);
    CONFIG.Canvas.soundSourceClass = PointSoundSourceMixin(CONFIG.Canvas.soundSourceClass);
}
