import { invalidateGeometry } from "../limits/_module.mjs";

/**
 * @param {typeof foundry.canvas.placeables.Region} Region
 * @returns {typeof foundry.canvas.placeables.Region}
 */
export const RegionMixin = (Region) => class extends Region {
    /** @override */
    _onAnimationStateChange() {
        super._onAnimationStateChange();

        invalidateGeometry(this.document);
    }

    /**
     * @param {object} [options]
     * @override
     */
    _destroy(options) {
        super._destroy(options);

        invalidateGeometry(this.document, { animatedOnly: true });
    }
};

export default RegionMixin;
