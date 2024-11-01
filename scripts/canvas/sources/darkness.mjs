import Limits from "../../limits.mjs";
import PointSourcePolygonConstraint from "../geometry/constraint.mjs";
import PointSourceRayCaster from "./caster.mjs";

/**
 * @param {typeof foundry.canvas.sources.PointDarknessSource} PointDarknessSource
 * @returns {typeof foundry.canvas.sources.PointDarknessSource}
 */
export const PointDarknessSourceMixin = (PointDarknessSource) => class extends PointDarknessSource {
    /**
     * @type {PointSourceRayCaster}
     * @readonly
     */
    #caster = new PointSourceRayCaster();

    /** @override */
    _createShapes() {
        super._createShapes();

        if (this._visualShape) {
            if (PointSourcePolygonConstraint.apply(this._visualShape, Limits.darkness)) {
                const { x, y, radius } = this.data;
                const circle = new PIXI.Circle(x, y, radius);
                const density = PIXI.Circle.approximateVertexDensity(radius);

                this.shape = this._visualShape.applyConstraint(circle, { density, scalingFactor: 100 });
            }
        } else {
            PointSourcePolygonConstraint.apply(this.shape, Limits.darkness);
        }

        if (game.release.version >= 13) {
            const { x, y, elevation, radius } = this.data;
            const z = elevation * canvas.dimensions.distancePixels;
            const { left: minX, right: maxX, top: minY, bottom: maxY } = this.shape.bounds;
            const space = Limits.darkness.crop(minX, minY, z - radius, maxX, maxY, z + radius);

            this.#caster.initialize(space, x, y, z, 0.0, Infinity);
        }
    }

    /** @override */
    testPoint(point) {
        return super.testPoint(point) && this.#caster.castRay(point.x, point.y, point.elevation * canvas.dimensions.distancePixels).targetHit;
    }
};

export default PointDarknessSourceMixin;
