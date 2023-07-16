import { max, min } from "./math.mjs";

/**
 * @abstract
 */
export class Figure {
    /**
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} [mask] - The mask (31-bit integer).
     */
    constructor(minX, minY, maxX, maxY, mask) {
        /**
         * The minimum x-coordinate.
         * @type {number}
         * @readonly
         */
        this.minX = minX;
        /**
         * The minimum y-coordinate.
         * @type {number}
         * @readonly
         */
        this.minY = minY;
        /**
         * The maximum x-coordinate.
         * @type {number}
         * @readonly
         */
        this.maxX = maxX;
        /**
         * The maximum y-coordinate.
         * @type {number}
         * @readonly
         */
        this.maxY = maxY;
        /**
         * The bit mask of the figure (31-bit).
         * @type {number}
         * @readonly
         */
        this.mask = (mask ?? -1) & 0x7FFFFFFF;
    }

    /**
     * Test whether this figure intersects the bounding box.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @returns {boolean} False if the bounding box does not intersect with the figure.
     */
    intersectsBounds(minX, minY, maxX, maxY) {
        return max(minX, this.minX) <= min(maxX, this.maxX)
            && max(minY, this.minY) <= min(maxY, this.maxY);
    }

    /**
     * Test whether the figure contains the bounding box.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @returns {boolean} True if the bounding box to contains the figure.
     * @abstract
     */
    containsBounds(minX, minY, maxX, maxY) {
        return false;
    }

    /**
     * Compute the hits of the figure with the ray.
     * @param {number} originX - The x-origin of the ray.
     * @param {number} originY - The y-origin of the ray.
     * @param {number} velocityX - The x-velocity of the ray.
     * @param {number} velocityY - The y-velocity of the ray.
     * @param {Hit[]|null} hitQueue - The hit queue.
     * @param {number} volumeIndex - The index of the volume.
     * @param {number} boundaryIndex - The index of the boundary.
     * @returns {number} The state that encodes whether the ray originates in the figure.
     * @abstract
     */
    computeHits(originX, originY, velocityX, velocityY, hitQueue, volumeIndex, boundaryIndex) {
        throw new Error("Not implemented");
    }
}
