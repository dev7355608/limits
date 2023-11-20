import { MODULE_ID } from "../const.mjs";
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
});
