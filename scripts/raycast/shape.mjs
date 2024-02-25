/**
 * @import { int31 } from "./_types.mjs";
 * @import Cast from "./cast.mjs";
 * @import Region from "./boundaries/region.mjs";
 */

/**
 * The shape of a {@link Region}.
 * @abstract
 */
export default class Shape {
    /**
     * @param {int31} mask - The mask (nonzero 31-bit integer).
     */
    constructor(mask) {
        /**
         * The bit mask of the shape (31-bit).
         * @type {int31}
         * @readonly
         */
        this.mask = mask;
    }

    /**
     * Test whether the shape contains (1) or not intersects (-1) the bounding box.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @returns {-1|0|1} If 1, then the bounding box is contained in the shape. If -1, if the bounding box does not intersect with the shape.
     */
    testBounds(minX, minY, maxX, maxY) {
        return 0;
    }

    /**
     * Test whether the shape contains the point.
     * @param {number} x - The x-coordinate of the point.
     * @param {number} y - The y-coordinate of the point.
     * @returns {boolean} True if the shape contains the point.
     * @abstract
     */
    containsPoint(x, y) {
        return false;
    }

    /**
     * Compute the hits of the shape with the ray.
     * This function is called only with nonzero x/y-direction.
     * @param {Cast} cast - The cast.
     * @abstract
     */
    computeHits(cast) { }
}
