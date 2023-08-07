import { MODULE_ID } from "../const.mjs";
import { VolumeCollection } from "../volume.mjs";
import { Constraint } from "./../constraint.mjs";

Hooks.once("libWrapper.Ready", () => {
    libWrapper.register(
        MODULE_ID,
        "LightSource.prototype._createPolygon",
        function (wrapped, ...args) {
            return Constraint.apply(wrapped(...args), "light", { scalingFactor: 100 });
        },
        libWrapper.WRAPPER,
        { perf_mode: libWrapper.PERF_FAST }
    );

    libWrapper.register(
        MODULE_ID,
        "GlobalLightSource.prototype._createPolygon",
        function (wrapped, ...args) {
            return new GlobalLightSourcePolygon(wrapped(...args).points);
        },
        libWrapper.WRAPPER,
        { perf_mode: libWrapper.PERF_FAST }
    );
});

class GlobalLightSourcePolygon extends PIXI.Polygon {
    contains(x, y) {
        if (!super.contains(x, y)) {
            return false;
        }

        return VolumeCollection.instance.castRay(
            "light",
            0,
            x, y, 1000000,
            x, y, -1000000
        ).targetHit;
    }
}
