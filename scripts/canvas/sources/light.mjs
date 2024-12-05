import Limits from "../../limits.mjs";
import PointSourcePolygonConstraint from "../geometry/constraint.mjs";
import PointSourceRayCaster from "./caster.mjs";

/**
 * @param {typeof foundry.canvas.sources.PointLightSource} PointLightSource
 * @returns {typeof foundry.canvas.sources.PointLightSource}
 */
export const PointLightSourceMixin = (PointLightSource) => class extends PointLightSource {
    /**
     * @type {PointSourceRayCaster}
     * @readonly
     */
    #caster = new PointSourceRayCaster();

    /** @override */
    _createShapes() {
        super._createShapes();

        PointSourcePolygonConstraint.apply(this.shape, Limits.light);

        if (game.release.generation >= 13) {
            const { x, y, elevation, radius } = this.data;
            const z = elevation * canvas.dimensions.distancePixels;
            const { left: minX, right: maxX, top: minY, bottom: maxY } = this.shape.bounds;
            const space = Limits.light.crop(minX, minY, z - radius, maxX, maxY, z + radius);

            this.#caster.initialize(space, x, y, z, 0.0, Infinity);
        }
    }

    /** @override */
    testPoint(point) {
        return super.testPoint(point) && this.#caster.castRay(point.x, point.y, point.elevation * canvas.dimensions.distancePixels).targetHit;
    }
};

export default PointLightSourceMixin;
