import Boundary from "./boundary.mjs";

/**
 * @import { int32 } from "./_types.mjs";
 * @import Volume from "./volume.mjs";
 */

/**
 * The next geometry ID.
 * @type {int32}
 */
let ID = 0;

/**
 * The geometry of a {@link Volume}.
 * @sealed
 */
export default class Geometry {
    /**
     * An empty geometry.
     * @type {Geometry}
     * @readonly
     */
    static EMPTY = new Geometry([], -1);

    /**
     * An unbounded geometry.
     * @type {Geometry}
     * @readonly
     */
    static UNBOUNDED = new Geometry([], 0);

    /**
     * @param {object} args
     * @param {Boundary[]} args.boundaries - The boundaries.
     * @param {int32} [args.state=-1] - The bit state (32-bit integer).
     * @returns {Geometry} The geometry.
     */
    static create({ boundaries, state = -1 }) {
        console.assert(Array.isArray(boundaries));
        console.assert(boundaries.every((boundary) => boundary instanceof Boundary && boundary.mask !== 0));
        console.assert(state === (state | 0));

        return new Geometry(boundaries.toSorted(compareBoundariesByType), state);
    }

    /**
     * @param {Boundary[]} boundaries - The boundaries.
     * @param {int32} state - The bit state (32-bit integer).
     * @private
     * @ignore
     */
    constructor(boundaries, state) {
        /**
         * The boundaries.
         * @type {ReadonlyArray<Boundary>}
         * @readonly
         */
        this.boundaries = boundaries;

        /**
         * The initial state of the ray relative to this geometry.
         * @type {int32}
         * @readonly
         */
        this.state = state;

        /**
         * The current state of the ray relative to this geometry.
         * If zero, the ray is currently inside the geometry.
         * @type {int32}
         * @internal
         * @ignore
         */
        this._state = 0;

        /**
         * The ID of the geometry.
         * @type {int32}
         * @readonly
         * @internal
         * @ignore
         */
        this._id = ID++;

        /**
         * The ray cast ID, which used to track whether hits were already computed for this geometry.
         * Also used to determine whether the cropped geometry of this geometry was already created;
         * in this case negative number are used.
         * @type {int32}
         * @internal
         * @ignore
         */
        this._castId = 0;
    }

    /**
     * Is this geometry unbounded w.r.t. the space?
     * @type {boolean}
     */
    get isUnbounded() {
        return this.state === 0 && this.boundaries.length === 0;
    }

    /**
     * Can this geometry be discarded as it wouldn't affect rays at all?
     * @type {boolean}
     */
    get isEmpty() {
        return this.state !== 0 && this.boundaries.length === 0;
    }

    /**
     * Crop the geometry w.r.t. to the bounding box of the space.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {Geometry} The cropped geometry.
     */
    crop(minX, minY, minZ, maxX, maxY, maxZ) {
        const boundaries = this.boundaries;
        const numBoundaries = boundaries.length;
        let croppedState = this.state;

        for (let boundaryIndex = 0; boundaryIndex < numBoundaries; boundaryIndex++) {
            const boundary = boundaries[boundaryIndex];
            const croppedBoundary = boundary.crop(minX, minY, minZ, maxX, maxY, maxZ);

            if (croppedBoundary.isUnbounded) {
                if (croppedBoundary.state === 0) {
                    croppedState ^= croppedBoundary.mask;
                }

                continue;
            }

            CROPPED_BOUNDARIES.push(croppedBoundary);
        }

        if (CROPPED_BOUNDARIES.length === 0) {
            return croppedState === 0 ? Geometry.UNBOUNDED : Geometry.EMPTY;
        }

        if (CROPPED_BOUNDARIES.length === numBoundaries) {
            let cropped = false;

            for (let boundaryIndex = 0; boundaryIndex < numBoundaries; boundaryIndex++) {
                if (CROPPED_BOUNDARIES[boundaryIndex] !== boundaries[boundaryIndex]) {
                    cropped = true;

                    break;
                }
            }

            if (!cropped) {
                CROPPED_BOUNDARIES.length = 0;

                return this;
            }
        }

        const croppedBoundaries = CROPPED_BOUNDARIES.slice(0);

        CROPPED_BOUNDARIES.length = 0;

        return new Geometry(croppedBoundaries, croppedState);
    }
}

/**
 * The array for cropped boundaries.
 * @type {Boundary[]}
 */
const CROPPED_BOUNDARIES = [];

/**
 * The boundary type ID map.
 * @type {Map<typeof Boundary, int32>}
 */
const BOUNDARY_TYPE_IDS = new Map();

/**
 * Get the ID of the boundary's type.
 * @param {Boundary} boundary - The boundary.
 * @returns {int32} The boundary type ID.
 */
function getBoundaryTypeID(boundary) {
    const boundaryType = boundary.constructor;
    let id = BOUNDARY_TYPE_IDS.get(boundaryType);

    if (id === undefined) {
        id = BOUNDARY_TYPE_IDS.size;
        BOUNDARY_TYPE_IDS.set(boundaryType, id);
    }

    return id;
}

/**
 * Compare two boundaries by type.
 * @param {Boundary} boundary1 - The first boundary.
 * @param {Boundary} boundary2 - The second boundary.
 * @returns {number}
 */
function compareBoundariesByType(boundary1, boundary2) {
    return getBoundaryTypeID(boundary1) - getBoundaryTypeID(boundary2);
}
