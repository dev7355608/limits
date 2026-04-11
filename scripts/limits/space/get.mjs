import { TYPE } from "../../const.mjs";
import * as raycast from "../../raycast/_module.mjs";
import { getVolume } from "../volume/get.mjs";
import { isBehaviorRestricting, spacesByBehavior, spacesByScene } from "./state.mjs";

/**
 * Get the space.
 * @param {foundry.documents.Scene} scene
 * @param {string[]} levelIds
 * @param {foundry.documents.EdgeRestrictionType} restrictionType
 * @param {string} modeId
 * @returns {raycast.Space}
 */
export function getSpace(scene, levelIds, restrictionType, modeId) {
    let spacesInScene = spacesByScene.get(scene);

    if (!spacesInScene) {
        spacesInScene = new Map();
        spacesByScene.set(scene, spacesInScene);
    }

    if (typeof levelIds === "string") {
        levelIds = [levelIds];
    } else {
        levelIds = levelIds.toSorted();
    }

    const spaceKey = `${modeId ? `${restrictionType}.${modeId}` : restrictionType}:${levelIds.join("+")}`;
    let spaceEntry = spacesInScene.get(spaceKey);

    if (spaceEntry) {
        return spaceEntry.space;
    }

    spaceEntry = {
        sceneRef: new WeakRef(scene),
        levelIds,
        restrictionType,
        modeId,
        behaviorRefs: [],
        space: null,
    };

    const volumes = [];

    for (const region of scene.regions) {
        if (region.levels.size !== 0 && !levelIds.some((id) => region.levels.has(id))) {
            continue;
        }

        for (const behavior of region.behaviors) {
            if (behavior.type !== TYPE || !behavior.active) {
                continue;
            }

            if (!isBehaviorRestricting(behavior, restrictionType, modeId)) {
                continue;
            }

            volumes.push(getVolume(behavior));
            spaceEntry.behaviorRefs.push(new WeakRef(behavior));

            let spacesIncludingBehavior = spacesByBehavior.get(behavior);

            if (!spacesIncludingBehavior) {
                spacesIncludingBehavior = new Map();
                spacesByBehavior.set(behavior, spacesIncludingBehavior);
            }

            spacesIncludingBehavior.set(spaceKey, spaceEntry);
        }
    }

    spaceEntry.space = raycast.Space.create({ volumes });
    spacesInScene.set(spaceKey, spaceEntry);

    return spaceEntry.space;
}
