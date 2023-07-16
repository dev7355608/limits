/**
 * @abstract
 */
export class Boundary {
    /**
     * @param {number} [mask=-1] - The bit mask (32-bit).
     */
    constructor(mask) {
        /**
         * The bit mask of the boundary (32-bit).
         * @type {number}
         * @readonly
         */
        this.mask = mask ?? -1;
        /**
         * The current state of the ray relative to the interior of the boundary.
         * If zero, the ray is currently inside the interior enclosed by the boundary.
         * @type {number}
         */
        this.state = 0;
        /**
         * Skip hits computation? True if rays cannot leave the interior enclosed by this boundary.
         * @type {boolean}
         * @readonly
         */
        this.envelops = false;
    }

    /**
     * Clone this volume.
     * @returns {Volume}
     * @abstract
     */
    clone() {
        throw new Error("Not implemented");
    }

    /**
     * Initialize this boundary given the bounding box of the ray caster.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {boolean} Returns false if the boundary can be discarded.
     * @abstract
     */
    initialize(minX, minY, minZ, maxX, maxY, maxZ) {
        throw new Error("Not implemented");
    }

    /**
     * Compute the hits of the boundary with the ray.
     * @param {number} originX - The x-origin of the ray.
     * @param {number} originY - The y-origin of the ray.
     * @param {number} originZ - The y-origin of the ray.
     * @param {number} velocityX - The x-velocity of the ray.
     * @param {number} velocityY - The y-velocity of the ray.
     * @param {number} velocityZ - The y-velocity of the ray.
     * @param {Hit[]|null} hitQueue - The hit queue.
     * @param {number} volumeIndex - The index of the volume.
     * @param {number} boundaryIndex - The index of the boundary.
     * @returns {number} The mask that encodes whether the ray originates in the interior enclosed by the boundary.
     * @abstract
     */
    computeHits(originX, originY, originZ, velocityX, velocityY, velocityZ, hitQueue, volumeIndex, boundaryIndex) {
        throw new Error("Not implemented");
    }
}
