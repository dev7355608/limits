import * as raycast from "../../raycast/_module.mjs";
import { getGeometry } from "../geometry/get.mjs";
import { volumesByBehavior } from "./state.mjs";

/**
 * Get the volume of the RegionBehavior.
 * @param {foundry.documents.RegionBehavior} behavior
 * @returns {raycast.Volume}
 */
export function getVolume(behavior) {
    let volume = volumesByBehavior.get(behavior);

    if (!volume) {
        const geometry = getGeometry(behavior.region);
        const { priority, mode, range } = behavior.system;
        const cost = 1.0 / (range * behavior.scene.dimensions.distancePixels);

        volume = raycast.Volume.create({ geometry, priority, mode, cost });
        volumesByBehavior.set(behavior, volume);
    }

    return volume;
}
