import Geometry from "./geometry.mjs";
import Mode from "./mode.mjs";

/**
 * @import { int32 } from "./_types.mjs";
 */

/**
 * @sealed
 */
export default class Volume {
    /**
     * @param {object} args
     * @param {Geometry} args.geometry - The geometry.
     * @param {int32} [args.priority=0] - The priority.
     * @param {Mode} args.mode - The mode used in the energy calculation.
     * @param {number} args.cost - The energy cost.
     * @returns {Volume} The volume.
     */
    static create({ geometry, priority = 0, mode, cost }) {
        console.assert(geometry instanceof Geometry);
        console.assert(priority === (priority | 0));
        console.assert(mode === (mode | 0) && Object.values(Mode).includes(mode));
        console.assert(mode === Mode.ADD || cost >= 0.0);
        console.assert(typeof cost === "number");

        return new Volume(geometry, priority | 0, mode | 0, cost + 0.0);
    }

    /**
     * @param {Geometry} geometry - The geometry.
     * @param {int32} priority - The priority.
     * @param {Mode} mode - The mode used in the energy calculation.
     * @param {number} cost - The energy cost.
     * @private
     * @ignore
     */
    constructor(geometry, priority, mode, cost) {
        /**
         * The geometry.
         * @type {Geometry}
         * @readonly
         */
        this.geometry = geometry;

        /**
         * The priority.
         * @type {int32}
         * @readonly
         */
        this.priority = priority;

        /**
         * The mode.
         * @type {Mode}
         * @readonly
         */
        this.mode = mode;

        /**
         * The energy cost.
         * @type {number}
         * @readonly
         */
        this.cost = cost;
    }
}
