/** @type {"limits.limitRange"} */
export const TYPE = "limits.limitRange";

/** @enum {number & {}} */
export const MODES = Object.freeze({
    /**
    * Stack.
    */
    STACK: 0,

    /**
     * Upgrade.
     */
    UPGRADE: 1,

    /**
     * Downgrade.
     */
    DOWNGRADE: 2,

    /**
     * Override.
     */
    OVERRIDE: 3,
});
