import { invalidateIncludingSpaces } from "../space/invalidate.mjs";
import { volumesByBehavior } from "./state.mjs";

/**
 * Invalidate the volume of the RegionBehavior.
 * @param {foundry.documents.RegionBehavior} behavior
 */
export function invalidateVolume(behavior) {
    if (!volumesByBehavior.delete(behavior)) {
        return;
    }

    invalidateIncludingSpaces(behavior);
}
