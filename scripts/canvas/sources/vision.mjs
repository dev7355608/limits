import Limits from "../../limits.mjs";
import * as raycast from "../../raycast/_module.mjs";
import PointSourcePolygonConstraint from "../geometry/constraint.mjs";
import PointSourceRayCaster from "./caster.mjs";

/**
 * @param {typeof foundry.canvas.sources.PointVisionSource} PointVisionSource
 * @returns {typeof foundry.canvas.sources.PointVisionSource}
 */
export const PointVisionSourceMixin = (PointVisionSource) => class extends PointVisionSource {
    /**
     * @type {{ [mode: string]: PointSourceRayCaster }}}
     * @readonly
     */
    #casters = ((ray) => Object.fromEntries(Object.keys(Limits.sight).map((mode) => [mode, new PointSourceRayCaster(ray)])))(raycast.Ray.create());

    /** @override */
    _createShapes() {
        super._createShapes();

        this.shape = PointSourcePolygonConstraint.apply(this.shape, Limits.sight[this.data.detectionMode ?? "basicSight"], this.shape === this.los);
        this.light = PointSourcePolygonConstraint.apply(this.light, Limits.sight.lightPerception, this.light === this.los);

        for (const mode in this.#casters) {
            this.#casters[mode].reset();
        }
    }

    /**
     * Test whether the ray hits the target.
     * @param {foundry.types.TokenDetectionMode} - The detection mode data.
     * @param {{ x: number, y: number }} point - The target point.
     * @param {number} elevation - The target elevation.
     * @returns {boolean} Does the ray hit the target?
     * @internal
     */
    _testLimit(mode, point, elevation) {
        const caster = this.#casters[mode.id];

        if (!caster.initialized) {
            const { x, y, elevation, externalRadius } = this.data;
            const z = elevation * canvas.dimensions.distancePixels;
            const radius = this.object.getLightRadius(mode.range);
            let minX = x - radius;
            let minY = y - radius;
            let maxX = x + radius;
            let maxY = y + radius;
            let bounds;

            if (mode.id === "lightPerception") {
                bounds = this.los.bounds;
            } else {
                bounds = this.los.config.useInnerBounds ? canvas.dimensions.sceneRect : canvas.dimensions.rect;
            }

            minX = Math.max(minX, bounds.left);
            minY = Math.max(minY, bounds.top);
            maxX = Math.min(maxX, bounds.right);
            maxY = Math.min(maxY, bounds.bottom);

            const space = Limits.sight[mode.id].crop(minX, minY, -Infinity, maxX, maxY, Infinity);

            caster.initialize(space, x, y, z, externalRadius, Infinity);
        }

        return caster.castRay(point.x, point.y, elevation * canvas.dimensions.distancePixels).targetHit;
    }
};

export default PointVisionSourceMixin;
