import Limits from "../limits.mjs";
import ModeField from "./fields/mode.mjs";
import PriorityField from "./fields/priority.mjs";
import RangeField from "./fields/range.mjs";
import SightField from "./fields/sight.mjs";

/**
 * The "Limit Range" Region Behavior.
 * @sealed
 */
export default class LimitRangeRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {
    /**
     * @type {string[]}
     * @override
     */
    static LOCALIZATION_PREFIXES = ["LIMITS"];

    /**
     * @returns {Record<string, foundry.data.fields.DataField>}}
     * @override
     */
    static defineSchema() {
        return {
            sight: new SightField(),
            light: new foundry.data.fields.BooleanField(),
            darkness: new foundry.data.fields.BooleanField(),
            sound: new foundry.data.fields.BooleanField(),
            range: new RangeField(),
            mode: new ModeField(),
            priority: new PriorityField(),
        };
    }

    /**
     * @type {Record<string, (this: LimitRangeRegionBehaviorType, event: foundry.types.RegionEvent) => Promise<void>>}
     * @override
     */
    static events = {
        [CONST.REGION_EVENTS.BEHAVIOR_STATUS]: onBehaviorStatus,
        [CONST.REGION_EVENTS.REGION_BOUNDARY]: onRegionBoundary,
    };

    /**
     * @param {object} changed
     * @param {object} options
     * @param {string} userId
     * @override
     */
    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        if ("system" in changed && this.parent.viewed) {
            Limits._onBehaviorSystemChanged(this.parent);
        }
    }
}

/**
 * @this LimitRangeRegionBehaviorType
 * @param {foundry.types.RegionEvent} event - The Region event.
 */
function onBehaviorStatus(event) {
    if (event.data.viewed === true) {
        Limits._onBehaviorViewed(this.parent);
    } else if (event.data.viewed === false) {
        Limits._onBehaviorUnviewed(this.parent);
    }
}

/**
 * @this LimitRangeRegionBehaviorType
 * @param {foundry.types.RegionEvent} event - The Region event.
 */
function onRegionBoundary(event) {
    if (this.parent.viewed) {
        Limits._onBehaviorBoundaryChanged(this.parent);
    }
}
