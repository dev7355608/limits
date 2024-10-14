import LimitRangeRegionBehaviorConfig from "./apps/region-behavior.mjs";
import { PointDarknessSourceMixin, PointLightSourceMixin, PointSoundSourceMixin, PointVisionSourceMixin } from "./canvas/sources/_module.mjs";
import LimitRangeRegionBehaviorType from "./data/region-behavior.mjs";

const TYPE = "limits.limitRange";

Hooks.once("init", () => {
    CONFIG.RegionBehavior.dataModels[TYPE] = LimitRangeRegionBehaviorType;
    CONFIG.RegionBehavior.typeIcons[TYPE] = "fa-solid fa-eye-low-vision";
    CONFIG.RegionBehavior.typeLabels[TYPE] = "LIMITS.label";

    Hooks.once("setup", () => {
        Hooks.once("canvasInit", () => {
            CONFIG.Canvas.visionSourceClass = PointVisionSourceMixin(CONFIG.Canvas.visionSourceClass);
            CONFIG.Canvas.lightSourceClass = PointLightSourceMixin(CONFIG.Canvas.lightSourceClass);
            CONFIG.Canvas.darknessSourceClass = PointDarknessSourceMixin(CONFIG.Canvas.darknessSourceClass);
            CONFIG.Canvas.soundSourceClass = PointSoundSourceMixin(CONFIG.Canvas.soundSourceClass);

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register(
                    "limits",
                    "DetectionMode.prototype._testPoint",
                    function (wrapped, visionSource, mode, target, test) {
                        return wrapped(visionSource, mode, target, test)
                            && visionSource._testLimit(mode, test.point, test.elevation);
                    },
                    libWrapper.WRAPPER,
                    { perf_mode: libWrapper.PERF_FAST },
                );
            } else {
                const testPoint = DetectionMode.prototype._testPoint;

                DetectionMode.prototype._testPoint = function (visionSource, mode, target, test) {
                    return testPoint.call(this, visionSource, mode, target, test)
                        && visionSource._testLimit(mode, test.point, test.elevation);
                };
            }
        });
    });
});

Hooks.once("ready", () => {
    CONFIG.RegionBehavior.sheetClasses[TYPE]["core.RegionBehaviorConfig"].cls = LimitRangeRegionBehaviorConfig;
});
