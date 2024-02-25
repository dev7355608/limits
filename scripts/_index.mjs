import { PointDarknessSourceMixin, PointLightSourceMixin, PointSoundSourceMixin, PointVisionSourceMixin } from "./canvas/sources/_module.mjs";
import LimitRangeRegionBehaviorType from "./data/region-behavior.mjs";

Hooks.once("init", () => {
    const type = "limits.limitRange";

    CONFIG.RegionBehavior.dataModels[type] = LimitRangeRegionBehaviorType;
    CONFIG.RegionBehavior.typeIcons[type] = "fa-solid fa-eye-low-vision";
    CONFIG.RegionBehavior.typeLabels[type] = "LIMITS.label";

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
