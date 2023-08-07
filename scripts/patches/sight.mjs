import { MODULE_ID } from "../const.mjs";
import { Constraint } from "./../constraint.mjs";
import { VolumeCollection } from "./../volume.mjs";

function _testPoint(wrapped, visionSource, mode, target, test) {
    if (!wrapped(visionSource, mode, target, test)) {
        return false;
    }

    const visionSourceZ = visionSource.elevation * canvas.dimensions.distancePixels;
    const point = test.point;

    return VolumeCollection.instance.castRay(
        `sight.${mode.id}`,
        visionSource.object.externalRadius,
        visionSource.x, visionSource.y, visionSourceZ,
        point.x, point.y, point.z ?? visionSourceZ
    ).targetHit;
}

Hooks.once("libWrapper.Ready", () => {
    libWrapper.register(
        MODULE_ID,
        "DetectionMode.prototype._testPoint",
        _testPoint,
        libWrapper.WRAPPER,
        { perf_mode: libWrapper.PERF_FAST }
    );

    if (VisionSource.prototype._createLightPolygon) {
        libWrapper.register(
            MODULE_ID,
            "VisionSource.prototype._createRestrictedPolygon",
            function (wrapped, ...args) {
                return Constraint.apply(
                    wrapped(...args),
                    `sight.${this.detectionMode?.id ?? DetectionMode.BASIC_MODE_ID}`,
                    { scalingFactor: 100 }
                );
            },
            libWrapper.WRAPPER,
            { perf_mode: libWrapper.PERF_FAST }
        );

        libWrapper.register(
            MODULE_ID,
            "VisionSource.prototype._createLightPolygon",
            function (wrapped, ...args) {
                return Constraint.apply(
                    wrapped(...args),
                    `sight.${DetectionMode.LIGHT_MODE_ID}`,
                    { scalingFactor: 100 }
                );
            },
            libWrapper.WRAPPER,
            { perf_mode: libWrapper.PERF_FAST }
        );
    } else {
        libWrapper.register(
            MODULE_ID,
            "DetectionModeBasicSight.prototype._testPoint",
            _testPoint,
            libWrapper.WRAPPER,
            { perf_mode: libWrapper.PERF_FAST }
        );

        const los = Symbol("los");

        libWrapper.register(
            MODULE_ID,
            "VisionSource.prototype._createRestrictedPolygon",
            function (wrapped, ...args) {
                [this.los, this[los]] = [Constraint.apply(
                    this.los,
                    `sight.${DetectionMode.BASIC_MODE_ID}`,
                    { scalingFactor: 100 }
                ), this.los];

                const fov = wrapped(...args);

                [this.los, this[los]] = [this[los], this.los];

                return fov;
            },
            libWrapper.WRAPPER,
            { perf_mode: libWrapper.PERF_FAST }
        );

        libWrapper.register(
            MODULE_ID,
            "CanvasVisibility.prototype.refreshVisibility",
            function (wrapped, ...args) {
                for (const visionSource of canvas.effects.visionSources) {
                    [visionSource.los, visionSource[los]] = [visionSource[los], visionSource.los];
                }

                wrapped(...args);

                for (const visionSource of canvas.effects.visionSources) {
                    [visionSource.los, visionSource[los]] = [visionSource[los], visionSource.los];
                }
            },
            libWrapper.WRAPPER,
            { perf_mode: libWrapper.PERF_FAST }
        );
    }
});
