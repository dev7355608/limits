import { getSpace } from "../../limits/_module.mjs";
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

        const scene = this.level.parent;
        let space = getSpace(scene, this.level.id, "light");

        PointSourcePolygonConstraint.apply(this.shape, space);

        const { x, y, elevation, radius } = this.data;
        const z = elevation * scene.dimensions.distancePixels;
        const { left: minX, right: maxX, top: minY, bottom: maxY } = this.shape.bounds;

        space = space.crop(minX, minY, z - radius, maxX, maxY, z + radius);
        this.#caster.initialize(space, x, y, z, 0.0, Infinity);
    }

    /** @override */
    testPoint(point) {
        if (!super.testPoint(point)) {
            return false;
        }

        const scene = this.level.parent;
        const z = point.elevation * scene.dimensions.distancePixels;

        return this.#caster.castRay(point.x, point.y, z).targetHit;
    }
};

export default PointLightSourceMixin;
