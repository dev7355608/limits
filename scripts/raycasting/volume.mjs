/**
 * The volume used by {@link RayCaster}.
 */
export class Volume {
    /**
     * @param {Boundary[]} boundaries - The boundaries.
     * @param {number} priority - The priority.
     * @param {Operation} operation - The operation used in the energy calculation.
     * @param {number} cost - The energy cost.
     */
    constructor(boundaries, priority, operation, cost) {
        /**
         * The boundaries.
         * @type {Boundary[]}
         * @readonly
         */
        this.boundaries = boundaries;
        /**
         * The priority.
         * @type {number}
         * @readonly
         */
        this.priority = priority;
        /**
         * The operation.
         * @type {Operation}
         * @readonly
         */
        this.operation = operation;
        /**
         * The energy cost.
         * @type {number}
         * @readonly
         */
        this.cost = cost;
        /**
         * The current state of the ray relative to this volume.
         * If zero, the ray is currently inside the volume.
         * @type {number}
         */
        this.state = 0;
        /**
         * Skip hits computation? True if rays cannot leave this volume.
         * @type {boolean}
         * @readonly
         */
        this.envelops = false;
    }

    /** @type {number} */
    #state = -1;

    /**
     * Clone this volume.
     * @returns {Volume}
     */
    clone() {
        const volume = new this.constructor(this.boundaries.map((o) => o.clone()), this.priority, this.operation, this.cost);

        volume.#state = this.#state;

        return volume;
    }

    /**
     * Initialize this volume given the bounding box of the ray caster.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {boolean} Returns false if the volume can be discarded.
     */
    initialize(minX, minY, minZ, maxX, maxY, maxZ) {
        const boundaries = this.boundaries;

        for (let boundaryIndex = boundaries.length - 1; boundaryIndex >= 0; boundaryIndex--) {
            const boundary = boundaries[boundaryIndex];

            if (!boundary.initialize(minX, minY, minZ, maxX, maxY, maxZ)) {
                boundaries[boundaryIndex] = boundaries[boundaries.length - 1];
                boundaries.length--;
            }
        }

        let state = this.#state;

        for (let boundaryIndex = boundaries.length - 1; boundaryIndex >= 0; boundaryIndex--) {
            const boundary = boundaries[boundaryIndex];

            if (boundary.envelops) {
                boundaries[boundaryIndex] = boundaries[boundaries.length - 1];
                boundaries.length--;
                state ^= boundary.mask;
            }
        }

        this.#state = state;

        if (state !== 0 && boundaries.length === 0) {
            return false;
        }

        if (state === 0 && boundaries.length === 0) {
            this.envelops = true;
        }

        const operation = this.operation;

        if (operation === 1 || operation === 2) {
            if (this.cost === 0) {
                return false;
            }
        } else if (operation === 3) {
            if (this.cost === Infinity) {
                return false;
            }
        } else if (operation === 4) {
            if (this.cost === 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Compute the hits of the volume with the ray.
     * @param {number} originX - The x-origin of the ray.
     * @param {number} originY - The y-origin of the ray.
     * @param {number} originZ - The y-origin of the ray.
     * @param {number} velocityX - The x-velocity of the ray.
     * @param {number} velocityY - The y-velocity of the ray.
     * @param {number} velocityZ - The y-velocity of the ray.
     * @param {Hit[]|null} hitQueue - The hit queue.
     * @param {number} volumeIndex - The index of the volume.
     * @returns {number} The state that encodes whether the ray originates in the volume.
     */
    computeHits(originX, originY, originZ, velocityX, velocityY, velocityZ, hitQueue, volumeIndex) {
        let state = this.#state;
        const boundaries = this.boundaries;
        const numBoundaries = boundaries.length;

        for (let boundaryIndex = 0; boundaryIndex < numBoundaries; boundaryIndex++) {
            const boundary = boundaries[boundaryIndex];

            state ^= boundary.computeHits(originX, originY, originZ, velocityX, velocityY, velocityZ, hitQueue, volumeIndex, boundaryIndex);
        }

        this.state = state;

        return state;
    }
}
