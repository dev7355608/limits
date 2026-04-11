import { invalidateVolume } from "../volume/invalidate.mjs";
import { geometriesByRegion } from "./state.mjs";

/**
 * Invalidate the geometry of the RegionDocument.
 * @param {foundry.documents.RegionDocument} region
 * @param {object} [options]
 * @param {boolean} [options.animatedOnly]
 */
export function invalidateGeometry(region, { animatedOnly = false } = {}) {
    const geometryEntry = geometriesByRegion.get(region);

    if (!geometryEntry || animatedOnly && !geometryEntry.animated) {
        return;
    }

    geometriesByRegion.delete(region);

    for (const behavior of region.behaviors) {
        invalidateVolume(behavior);
    }
}
