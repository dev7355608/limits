import * as raycast from "../../raycast/_module.mjs";
import { getSpace } from "../../limits/_module.mjs";
import PointSourcePolygonConstraint from "../geometry/constraint.mjs";
import PointSourceRayCaster from "./caster.mjs";

/**
 * @param {typeof foundry.canvas.sources.PointVisionSource} PointVisionSource
 * @returns {typeof foundry.canvas.sources.PointVisionSource}
 */
export const PointVisionSourceMixin = (PointVisionSource) => class extends PointVisionSource {
    /**
     * @type {{ [key: string]: PointSourceRayCaster }}}
     * @readonly
     */
    #casters = {};

    /**
     * @type {raycast.Ray}
     * @readonly
     */
    #ray = raycast.Ray.create();

    /** @override */
    _createShapes() {
        super._createShapes();

        const scene = this.level.parent;

        this.shape = PointSourcePolygonConstraint.apply(
            this.shape,
            getSpace(scene, this.level.id, "sight", this.data.detectionMode ?? "basicSight"),
            this.shape === this.los,
        );
        this.light = PointSourcePolygonConstraint.apply(
            this.light,
            getSpace(scene, this.level.id, "sight", "lightPerception"),
            this.light === this.los,
        );

        for (const key in this.#casters) {
            this.#casters[key].reset();
        }
    }

    /** @override */
    testPoint(point) {
        if (!super.testPoint(point)) {
            return false;
        }

        const scene = this.level.parent;
        const z = point.elevation * scene.dimensions.distancePixels;

        return this.#getCaster().castRay(point.x, point.y, z).targetHit;
    }

    /**
     * Test whether the ray hits the target.
     * @param {string} modeId - The ID of the detection mode.
     * @param {number} range - The range of the detection mode.
     * @param {foundry.types.ElevatedPoint} point - The target point.
     * @param {foundry.documents.Level} level - The target level.
     * @returns {boolean} Does the ray hit the target?
     * @internal
     */
    _testLimit(modeId, range, point, level) {
        const scene = this.level.parent;
        const z = point.elevation * scene.dimensions.distancePixels;

        return this.#getCaster(modeId, range, level).castRay(point.x, point.y, z).targetHit;
    }

    /**
     * Get the ray caster for this source.
     * @overload
     * @returns {PointSourceRayCaster} The ray caster.
     */
    /**
     * Get the ray caster for the given detection mode and level.
     * @overload
     * @param {string} id - The ID of the detection mode.
     * @param {number} range - The range of the detection mode.
     * @param {foundry.documents.Level} level - The target level.
     * @returns {PointSourceRayCaster} The ray caster.
     */
    #getCaster(modeId, range, level) {
        const sameLevel = !modeId || level === this.level;
        const caster = this.#casters[sameLevel ? modeId ?? "" : `${modeId}.${level.id}`] ??= new PointSourceRayCaster(this.#ray);

        if (!caster.initialized) {
            const { x, y, elevation, externalRadius } = this.data;
            const scene = this.level.parent;
            const z = elevation * scene.dimensions.distancePixels;
            const radius = modeId ? this.object.getLightRadius(range) : this.data.radius;
            let bounds;

            if (!modeId) {
                bounds = this.shape.bounds;
            } else if (modeId === "lightPerception" && sameLevel) {
                bounds = this.los.bounds;
            } else {
                bounds = this.los.useInnerBounds ? scene.dimensions.sceneRect : scene.dimensions.rect;
            }

            let { left: minX, right: maxX, top: minY, bottom: maxY } = bounds;

            minX = Math.max(minX, x - radius);
            minY = Math.max(minY, y - radius);
            maxX = Math.min(maxX, x + radius);
            maxY = Math.min(maxY, y + radius);

            const minZ = z - radius;
            const maxZ = z + radius;
            const space = getSpace(
                scene,
                sameLevel ? this.level.id : [this.level.id, level.id],
                "sight",
                modeId ?? this.data.detectionMode ?? "basicSight",
            ).crop(minX, minY, minZ, maxX, maxY, maxZ);

            caster.initialize(space, x, y, z, externalRadius, Infinity);
        }

        return caster;
    }
};

export default PointVisionSourceMixin;
