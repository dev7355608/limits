import Limits from "../../limits.mjs";
import PointSourcePolygonConstraint from "../geometry/constraint.mjs";

/**
 * @param {typeof foundry.canvas.sources.PointDarknessSource} PointDarknessSource
 * @returns {typeof foundry.canvas.sources.PointDarknessSource}
 */
export const PointDarknessSourceMixin = (PointDarknessSource) => class extends PointDarknessSource {
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
    }
};

export default PointDarknessSourceMixin;
