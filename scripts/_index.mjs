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

            if (game.release.generation >= 13) {
                if (game.modules.get("lib-wrapper")?.active) {
                    libWrapper.register(
                        "limits",
                        "foundry.canvas.perception.DetectionMode.prototype._testPoint",
                        function (wrapped, visionSource, mode, target, test) {
                            return wrapped(visionSource, mode, target, test)
                                && visionSource._testLimit(mode, test.point);
                        },
                        libWrapper.WRAPPER,
                        { perf_mode: libWrapper.PERF_FAST },
                    );
                } else {
                    const DetectionMode = foundry.canvas.perception.DetectionMode;
                    const testPoint = DetectionMode.prototype._testPoint;

                    DetectionMode.prototype._testPoint = function (visionSource, mode, target, test) {
                        return testPoint.call(this, visionSource, mode, target, test)
                            && visionSource._testLimit(mode, test.point);
                    };
                }
            } else {
                const TEST_POINT = { x: 0.0, y: 0.0, elevation: 0.0 };

                if (game.modules.get("lib-wrapper")?.active) {
                    libWrapper.register(
                        "limits",
                        "DetectionMode.prototype._testPoint",
                        function (wrapped, visionSource, mode, target, test) {
                            if (!wrapped(visionSource, mode, target, test)) {
                                return false;
                            }

                            const { x, y } = test.point;

                            TEST_POINT.x = x;
                            TEST_POINT.y = y;
                            TEST_POINT.elevation = test.elevation;

                            return visionSource._testLimit(mode, TEST_POINT);
                        },
                        libWrapper.WRAPPER,
                        { perf_mode: libWrapper.PERF_FAST },
                    );
                } else {
                    const testPoint = DetectionMode.prototype._testPoint;

                    DetectionMode.prototype._testPoint = function (visionSource, mode, target, test) {
                        if (!testPoint.call(this, visionSource, mode, target, test)) {
                            return false;
                        }

                        const { x, y } = test.point;

                        TEST_POINT.x = x;
                        TEST_POINT.y = y;
                        TEST_POINT.elevation = test.elevation;

                        return visionSource._testLimit(mode, TEST_POINT);
                    };
                }
            }
        });
    });
});

Hooks.once("ready", () => {
    if (game.release.generation < 13) {
        CONFIG.RegionBehavior.sheetClasses[TYPE]["core.RegionBehaviorConfig"].cls = LimitRangeRegionBehaviorConfig;
    }
});
