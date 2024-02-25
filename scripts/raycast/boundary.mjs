/**
 * @import { int32 } from "./_types.mjs";
 * @import Geometry from "./geometry.mjs";
 * @import Cast from "./cast.mjs";
 */

/**
 * The boundary of a {@link Geometry}.
 * @abstract
 */
export default class Boundary {
    /**
     * @param {int32} mask - The bit mask (32-bit).
     * @param {int32} state - The bit state (32-bit).
     */
    constructor(mask, state) {
        /**
         * The bit mask of the boundary (32-bit).
         * @type {int32}
         * @readonly
         */
        this.mask = mask;

        /**
         * The initial state of the ray relative to the interior of the boundary.
         * @type {int32}
         * @readonly
         */
        this.state = state;

        /**
         * The current state of the ray relative to the interior of the boundary.
         * If zero, the ray is currently inside the interior enclosed by the boundary.
         * @type {int32}
         * @internal
         */
        this._state = 0;
    }

    /**
     * Is this boundary unbounded w.r.t. to the bounding box of the space?
     * @type {boolean}
     */
    get isUnbounded() {
        return false;
    }

    /**
     * Can this boundary be discarded as it wouldn't affect rays at all?
     * @type {boolean}
     * @sealed
     */
    get isEmpty() {
        return this.mask === 0 || this.state !== 0 && this.isUnbounded;
    }

    /**
     * Crop the boundary w.r.t. to the bounding box of the space.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {Boundary} The cropped boundary.
     * @abstract
     */
    crop(minX, minY, minZ, maxX, maxY, maxZ) {
        return this;
    }

    /**
     * Compute the hits of the boundary with the ray.
     * @param {Cast} cast - The cast.
     * @abstract
     */
    computeHits(cast) { }
}
