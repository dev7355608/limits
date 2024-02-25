import Limits from "../../limits.mjs";
import PointSourcePolygonConstraint from "../geometry/constraint.mjs";

/**
 * @param {typeof foundry.canvas.sources.PointLightSource} PointLightSource
 * @returns {typeof foundry.canvas.sources.PointLightSource}
 */
export const PointLightSourceMixin = (PointLightSource) => class extends PointLightSource {
    /** @override */
    _createShapes() {
        super._createShapes();

        PointSourcePolygonConstraint.apply(this.shape, Limits.light);
    }
};

export default PointLightSourceMixin;
