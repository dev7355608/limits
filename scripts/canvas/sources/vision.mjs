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
    #casters = ((ray) => Object.fromEntries(["", ...Object.keys(Limits.sight)].map((mode) => [mode, new PointSourceRayCaster(ray)])))(raycast.Ray.create());

    /** @override */
    _createShapes() {
        super._createShapes();

        this.shape = PointSourcePolygonConstraint.apply(this.shape, Limits.sight[this.data.detectionMode ?? "basicSight"], this.shape === this.los);
        this.light = PointSourcePolygonConstraint.apply(this.light, Limits.sight.lightPerception, this.light === this.los);

        for (const mode in this.#casters) {
            this.#casters[mode].reset();
        }
    }

    /** @override */
    testPoint(point) {
        return super.testPoint(point) && this.#getCaster().castRay(point.x, point.y, point.elevation * canvas.dimensions.distancePixels).targetHit;
    }

    /**
     * Test whether the ray hits the target.
     * @param {string} id - The ID of the detection mode.
     * @param {number} range - The range of the detection mode.
     * @param {foundry.types.ElevatedPoint} point - The target point.
     * @returns {boolean} Does the ray hit the target?
     * @internal
     */
    _testLimit(id, range, point) {
        return this.#getCaster(id, range).castRay(point.x, point.y, point.elevation * canvas.dimensions.distancePixels).targetHit;
    }

    /**
     * Get the ray caster for this source.
     * @overload
     * @returns {PointSourceRayCaster} The ray caster.
     */
    /**
     * Get the ray caster for the given detection mode.
     * @overload
     * @param {string} id - The ID of the detection mode.
     * @param {number} range - The range of the detection mode.
     * @returns {PointSourceRayCaster} The ray caster.
     */
    #getCaster(id, range) {
        const caster = this.#casters[id ?? ""];

        if (!caster.initialized) {
            const { x, y, elevation, externalRadius } = this.data;
            const z = elevation * canvas.dimensions.distancePixels;
            const radius = id ? this.object.getLightRadius(range ?? /* V12 */ Infinity) : this.data.radius;
            let bounds;

            if (!id) {
                bounds = this.shape.bounds;
            } else if (id === "lightPerception") {
                bounds = this.los.bounds;
            } else {
                bounds = this.los.config.useInnerBounds ? canvas.dimensions.sceneRect : canvas.dimensions.rect;
            }

            let { left: minX, right: maxX, top: minY, bottom: maxY } = bounds;

            minX = Math.max(minX, x - radius);
            minY = Math.max(minY, y - radius);
            maxX = Math.min(maxX, x + radius);
            maxY = Math.min(maxY, y + radius);

            let minZ;
            let maxZ;

            if (game.release.generation >= 13) {
                minZ = z - radius;
                maxZ = z + radius;
            } else {
                minZ = -Infinity;
                maxZ = Infinity;
            }

            const space = Limits.sight[id ?? this.data.detectionMode ?? "basicSight"].crop(minX, minY, minZ, maxX, maxY, maxZ);

            caster.initialize(space, x, y, z, externalRadius, Infinity);
        }

        return caster;
    }
};

export default PointVisionSourceMixin;
