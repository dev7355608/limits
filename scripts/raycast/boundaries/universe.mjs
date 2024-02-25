import Boundary from "../boundary.mjs";

/**
 * @import { int32 } from "../_types.mjs";
 */

/**
 * @sealed
 */
export default class Universe extends Boundary {
    /**
     * The empty boundless boundary.
     * @type {Universe}
     * @readonly
     */
    static EMPTY = new Universe(0);

    /**
     * Get the boundless boundary for the given mask.
     * @param {int32} mask - The bit mask (32-bit integer).
     * @returns {Universe} The boundless boundary.
     */
    static get(mask) {
        let boundary = CACHE.get(mask);

        if (!boundary) {
            console.assert(mask === (mask | 0));

            boundary = new Universe(mask);
            CACHE.set(mask, boundary);
        }

        return boundary;
    }

    /**
     * @param {int32} mask - The bit mask (32-bit integer).
     * @private
     * @ignore
     */
    constructor(mask) {
        super(mask, 0);
    }

    /** @inheritDoc */
    get isUnbounded() {
        return true;
    }

    /** @inheritDoc */
    get isEmpty() {
        return this.mask === 0;
    }

    /**
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {Boundary} The cropped boundary.
     * @inheritDoc
     */
    crop(minX, minY, minZ, maxX, maxY, maxZ) {
        return this;
    }

    /**
     * @param {Cast} cast - The cast.
     * @inheritDoc
     */
    computeHits(cast) { }
}

/** @type {Map<int32, Universe>} */
const CACHE = new Map([[0, Universe.EMPTY]]);
