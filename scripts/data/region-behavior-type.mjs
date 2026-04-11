import { invalidateMatchingSpaces, invalidateVolume } from "../limits/_module.mjs";
import ModeField from "./fields/mode.mjs";
import PriorityField from "./fields/priority.mjs";
import RangeField from "./fields/range.mjs";
import SightField from "./fields/sight.mjs";

/**
 * The "Limit Range" Region Behavior.
 * @extends {foundry.data.regionBehaviors.RegionBehaviorType}
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
        [CONST.REGION_EVENTS.BEHAVIOR_ACTIVATED]: this.#onBehaviorActivated,
        [CONST.REGION_EVENTS.BEHAVIOR_DEACTIVATED]: this.#onBehaviorDeactivated,
    };

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        this.range ??= Infinity;
    }

    /**
     * @param {object} changed
     * @param {object} options
     * @param {string} userId
     * @override
     */
    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        if ("system" in changed) {
            invalidateVolume(this.behavior);
            invalidateMatchingSpaces(this.behavior);
        }

        if ("disabled" in changed) {
            this.region.updateShapeConstraints();
        }
    }

    /**
     * @this {RegionBehaviorType}
     * @param {foundry.types.RegionEvent} event
     */
    static #onBehaviorActivated(event) {
        invalidateMatchingSpaces(this.behavior);
    }

    /**
     * @this {RegionBehaviorType}
     * @param {foundry.types.RegionEvent} event
     */
    static #onBehaviorDeactivated(event) {
        invalidateVolume(this.behavior);
    }
}
