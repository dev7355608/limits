import { getSpace } from "../../limits/_module.mjs";
import PointSourcePolygonConstraint from "../geometry/constraint.mjs";
import PointSourceRayCaster from "./caster.mjs";

/**
 * @param {typeof foundry.canvas.sources.PointSoundSource} PointSoundSource
 * @returns {typeof foundry.canvas.sources.PointSoundSource}
 */
export const PointSoundSourceMixin = (PointSoundSource) => class extends PointSoundSource {
    /**
     * @type {PointSourceRayCaster}
     * @readonly
     */
    #caster = new PointSourceRayCaster();

    /** @override */
    _createShapes() {
        super._createShapes();

        const scene = this.level.parent;
        let space = getSpace(scene, this.level.id, "sound");

        PointSourcePolygonConstraint.apply(this.shape, space);

        const { x, y, elevation, radius } = this.data;
        const z = elevation * scene.dimensions.distancePixels;
        const { left: minX, right: maxX, top: minY, bottom: maxY } = this.shape.bounds;
        const minZ = z - radius;
        const maxZ = z + radius;

        space = space.crop(minX, minY, minZ, maxX, maxY, maxZ);
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

    /** @override */
    getVolumeMultiplier(listener, options) {
        let volume = super.getVolumeMultiplier(listener, options);

        if (volume > 0.0) {
            const scene = this.level.parent;
            const z = listener.elevation * scene.dimensions.distancePixels;

            volume *= this.#caster.castRay(listener.x, listener.y, z).remainingEnergy;
        }

        return volume;
    }
};

export default PointSoundSourceMixin;
