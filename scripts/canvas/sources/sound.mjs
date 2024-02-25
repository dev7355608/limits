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

        const { x, y, elevation } = this.data;
        const z = elevation * canvas.dimensions.distancePixels;
        const { left: minX, right: maxX, top: minY, bottom: maxY } = this.shape.bounds;
        const space = Limits.sound.crop(minX, minY, z, maxX, maxY, z);

        this.#caster.initialize(space, x, y, z, 0.0, Infinity);
    }

    /** @override */
    getVolumeMultiplier(listener, options) {
        let volume = super.getVolumeMultiplier(listener, options);

        if (volume > 0.0) {
            volume *= this.#caster.castRay(listener.x, listener.y, this.#caster.ray.originZ).remainingEnergy;
        }

        return volume;
    }
};

export default PointSoundSourceMixin;
