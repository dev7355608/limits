import Limits from "../../limits.mjs";
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

        PointSourcePolygonConstraint.apply(this.shape, Limits.sound);

        const { x, y, elevation, radius } = this.data;
        const z = elevation * canvas.dimensions.distancePixels;
        const { left: minX, right: maxX, top: minY, bottom: maxY } = this.shape.bounds;

        let minZ;
        let maxZ;

        if (game.release.version >= 13) {
            minZ = z - radius;
            maxZ = z + radius;
        } else {
            minZ = z;
            maxZ = z;
        }

        const space = Limits.sound.crop(minX, minY, minZ, maxX, maxY, maxZ);

        this.#caster.initialize(space, x, y, z, 0.0, Infinity);
    }

    /** @override */
    testPoint(point) {
        return super.testPoint(point) && this.#caster.castRay(point.x, point.y, point.elevation * canvas.dimensions.distancePixels).targetHit;
    }

    /** @override */
    getVolumeMultiplier(listener, options) {
        let volume = super.getVolumeMultiplier(listener, options);

        if (volume > 0.0) {
            let z;

            if (game.release.version >= 13) {
                z = listener.elevation * canvas.dimensions.distancePixels;
            } else {
                z = this.#caster.ray.originZ;
            }

            volume *= this.#caster.castRay(listener.x, listener.y, z).remainingEnergy;
        }

        return volume;
    }
};

export default PointSoundSourceMixin;
