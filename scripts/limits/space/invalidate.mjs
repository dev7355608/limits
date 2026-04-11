import { isBehaviorRestricting, spacesByBehavior, spacesByScene } from "./state.mjs";

/**
 * Invalidate the spaces including or matching the RegionBehavior.
 * @param {foundry.documents.RegionBehavior} behavior
 */
export function invalidateSpaces(behavior) {
    invalidateIncludingSpaces(behavior);
    invalidateMatchingSpaces(behavior);
}

/**
 * Invalidate the spaces including the RegionBehavior.
 * @param {foundry.documents.RegionBehavior} behavior
 */
export function invalidateIncludingSpaces(behavior) {
    const spacesIncludingBehavior = spacesByBehavior.get(behavior);

    if (!spacesIncludingBehavior) {
        return;
    }

    spacesByBehavior.delete(behavior);

    for (const [spaceKey, { sceneRef, levelIds, restrictionType }] of spacesIncludingBehavior) {
        const scene = sceneRef.deref();

        if (!scene) {
            continue;
        }

        const spacesInScene = spacesByScene.get(scene);

        spacesInScene.delete(spaceKey);

        if (spacesInScene.size === 0) {
            spacesByScene.delete(scene);
        }

        updatePerception(scene, levelIds, restrictionType);
    }
}

/**
 * Invalidate the spaces matching the RegionBehavior.
 * @param {foundry.documents.RegionBehavior} behavior
 */
export function invalidateMatchingSpaces(behavior) {
    const region = behavior.parent;
    const scene = region.parent;
    const spacesInScene = spacesByScene.get(scene);

    if (!spacesInScene) {
        return;
    }

    for (const [spaceKey, { levelIds, restrictionType, modeId, behaviorRefs }] of spacesInScene) {
        if (!isBehaviorRestricting(behavior, restrictionType, modeId)) {
            continue;
        }

        if (!levelIds.some((id) => region.includedInLevel(id))) {
            continue;
        }

        spacesInScene.delete(spaceKey);

        for (const behaviorRef of behaviorRefs) {
            const behavior = behaviorRef.deref();

            if (!behavior) {
                continue;
            }

            const spacesIncludingBehavior = spacesByBehavior.get(behavior);

            spacesIncludingBehavior.delete(spaceKey);
        }

        updatePerception(scene, levelIds, restrictionType);
    }

    if (spacesInScene.size === 0) {
        spacesByScene.delete(scene);
    }
}

/**
 * Update perception and shape constraints.
 * @param {foundry.documents.Scene} scene
 * @param {string[]} levelIds
 * @param {foundry.documents.EdgeRestrictionType} restrictionType
 */
function updatePerception(scene, levelIds, restrictionType) {
    scene.updateRegionShapeConstraints([restrictionType]);

    if (!scene.isView || !levelIds.some((id) => scene.levels.get(id)?.isVisible)) {
        return;
    }

    let flags = {};

    switch (restrictionType) {
        case "sight":
            flags.initializeVision = true;

            break;
        case "light":
        case "darkness":
            flags.initializeLightSources = true;

            break;
        case "sound":
            flags.initializeSounds = true;

            break;
    }

    canvas.perception.update(flags);
}
