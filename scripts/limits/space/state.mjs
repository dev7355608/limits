/**
 * @import { SpaceEntry } from "./_types.mjs";
 */

/** @type {WeakMap<foundry.documents.Scene, Map<string, SpaceEntry>>} */
export const spacesByScene = new WeakMap();

/** @type {WeakMap<foundry.documents.RegionBehavior, Map<string, SpaceEntry>>} */
export const spacesByBehavior = new WeakMap();

/**
 * Is the Region included in a space?
 * @param {foundry.documents.Region} region
 * @returns {boolean}
 */
export function isRegionIncludedInSpace(region) {
    return region.behaviors.some((behavior) => spacesByBehavior.has(behavior));
}

/**
 * Is the RegionBehavior restricting the given type?
 * @param {foundry.documents.RegionBehavior} behavior
 * @param {foundry.documents.EdgeRestrictionType} restrictionType
 * @param {string} modeId
 */
export function isBehaviorRestricting(behavior, restrictionType, modeId) {
    const restriction = behavior.parent.restriction;

    switch (restrictionType) {
        case "sight":
            return behavior.system.sight.has(modeId);
        case "light":
            return behavior.system.light && (!restriction.enabled || restriction.type !== "darkness");
        case "darkness":
            return behavior.system.darkness && (!restriction.enabled || restriction.type !== "light");
        case "sound":
            return behavior.system.sound;
    }
}
