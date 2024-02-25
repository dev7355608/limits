import Hit from "./hit.mjs";

/**
 * @import { int32 } from "./_types.mjs";
 * @import Boundary from "./boundary.mjs";
 * @import Geometry from "./geometry.mjs";
 * @import Ray from "./ray.mjs";
 */

/**
 * @sealed
 */
export default class Cast {
    /**
     * @returns {Cast} The cast.
     */
    static create() {
        return new Cast(64);
    }

    /**
     * @param {number} numHits - Initial number of allocated hits.
     * @internal
     * @ignore
     */
    constructor(numHits) {
        const hits = this._hits;

        for (let j = 0; j < numHits; j++) {
            hits.push(new Hit());
        }
    }

    /**
     * The x-coordinate of the origin of the ray.
     * @type {number}
     * @readonly
     */
    originX = 0.0;

    /**
     * The y-coordinate of the origin of the ray.
     * @type {number}
     * @readonly
     */
    originY = 0.0;

    /**
     * The z-coordinate of the origin of the ray.
     * @type {number}
     * @readonly
     */
    originZ = 0.0;

    /**
     * The x-coordinate of the direction of the ray.
     * @type {number}
     * @readonly
     */
    directionX = 0.0;

    /**
     * The y-coordinate of the direction of the ray.
     * @type {number}
     * @readonly
     */
    directionY = 0.0;

    /**
     * The z-coordinate of the direction of the ray.
     * @type {number}
     * @readonly
     */
    directionZ = 0.0;

    /**
     * The inverse x-coordinate of the direction of the ray.
     * @type {number}
     * @readonly
     */
    invDirectionX = Infinity;

    /**
     * The inverse y-coordinate of the direction of the ray.
     * @type {number}
     * @readonly
     */
    invDirectionY = Infinity;

    /**
     * The inverse z-coordinate of the direction of the ray.
     * @type {number}
     * @readonly
     */
    invDirectionZ = Infinity;

    /**
     * The pool of hits.
     * @type {Hit[]}
     * @readonly
     * @private
     * @ignore
     */
    _hits = [];

    /**
     * The number of hits of the pool that are currently used.
     * @type {number}
     * @private
     * @ignore
     */
    _hitsUsed = 0;

    /**
     * The number of hits remaining in the heap.
     * @type {number}
     * @private
     * @ignore
     */
    _hitsRemaining = 0;

    /**
     * The current geometry instance.
     * @type {Geometry | null}
     * @private
     * @ignore
     */
    _geometry = null;

    /**
     * The current boundary instance.
     * @type {Boundary | null}
     * @private
     * @ignore
     */
    _boundary = null;

    /**
     * Record a hit with the boundary of the geometry.
     * This function can be called only during {@link Cast#computeHits}.
     * @param {number} time - The time the ray hits the boundary of the geometry (nonnegative).
     * @param {int32} mask - The bit mask indicating which parts of the boundary were hit (nonzero 32-bit integer).
     */
    addHit(time, mask) {
        const boundary = this._boundary;

        boundary._state ^= mask;

        if (time > 1.0) {
            return;
        }

        const hits = this._hits;
        const i = this._hitsUsed++;

        if (i === hits.length) {
            for (let j = i; j > 0; j--) {
                hits.push(new Hit());
            }
        }

        const hit = hits[i];

        hit.geometry = this._geometry;
        hit.boundary = boundary;
        hit.time = time;
        hit.mask = mask;
    }

    /**
     * Compute the hits of the ray.
     * Resets the cast before computing the hits.
     * @param {Ray} ray - The ray.
     */
    computeHits(ray) {
        this.reset();

        CAST_ID++;

        const originX = (ray.originX + 6755399441055744.0) - 6755399441055744.0;
        const originY = (ray.originY + 6755399441055744.0) - 6755399441055744.0;
        const originZ = (ray.originZ + 6755399441055744.0) - 6755399441055744.0;
        const targetX = (ray.targetX + 6755399441055744.0) - 6755399441055744.0;
        const targetY = (ray.targetY + 6755399441055744.0) - 6755399441055744.0;
        const targetZ = (ray.targetZ + 6755399441055744.0) - 6755399441055744.0;
        const directionX = targetX - originX;
        const directionY = targetY - originY;
        const directionZ = targetZ - originZ;

        this.originX = originX;
        this.originY = originY;
        this.originZ = originZ;
        this.directionX = directionX;
        this.directionY = directionY;
        this.directionZ = directionZ;
        this.invDirectionX = 1.0 / directionX;
        this.invDirectionY = 1.0 / directionY;
        this.invDirectionZ = 1.0 / directionZ;

        const { minRange, maxRange, targetDistance } = ray;

        if (minRange < targetDistance) {
            this._hits[this._hitsUsed++].time = minRange / targetDistance;
        }

        if (maxRange < targetDistance) {
            this._hits[this._hitsUsed++].time = maxRange / targetDistance;
        }

        const volumes = ray.space.volumes;
        const numVolumes = volumes.length;

        for (let volumeIndex = 0; volumeIndex < numVolumes; volumeIndex++) {
            const geometry = volumes[volumeIndex].geometry;

            if (geometry._castId === CAST_ID) {
                continue;
            }

            geometry._castId = CAST_ID;

            this._geometry = geometry;

            const boundaries = geometry.boundaries;
            const numBoundaries = boundaries.length;
            let state = geometry.state;

            for (let boundaryIndex = 0; boundaryIndex < numBoundaries; boundaryIndex++) {
                const boundary = boundaries[boundaryIndex];

                this._boundary = boundary;

                boundary._state = boundary.state;
                boundary.computeHits(this);

                if (boundary._state === 0) {
                    state ^= boundary.mask;
                }
            }

            geometry._state = state;
        }

        this._geometry = null;
        this._boundary = null;

        const hits = this._hits;
        const numHits = this._hitsUsed;

        this._hitsRemaining = numHits;

        for (let i = numHits >> 1; i--;) {
            siftDown(hits, numHits, hits[i], i);
        }
    }

    /**
     * Get the next this that needs to be processed.
     * @returns {Hit} The next hit if there is still one. The returned hit is owned by the cast and becomes invalid once the cast is reset.
     */
    nextHit() {
        const hits = this._hits;
        let numHits = this._hitsRemaining;

        if (numHits === 0) {
            return;
        }

        numHits--;
        this._hitsRemaining = numHits;

        const nextHit = hits[0];

        if (numHits !== 0) {
            const lastHit = hits[numHits];

            hits[numHits] = nextHit;
            siftDown(hits, numHits, lastHit, 0);
        }

        return nextHit;
    }

    /**
     * Reset the cast.
     * Invalidates all hit instances.
     */
    reset() {
        const hits = this._hits;
        const numHits = this._hitsUsed;

        this._hitsUsed = 0;
        this._hitsRemaining = 0;

        for (let i = 0; i < numHits; i++) {
            const hit = hits[i];

            hit.geometry = null;
            hit.boundary = null;
        }
    }
}

/**
 * The last cast ID.
 * @type {int32}
 */
let CAST_ID = 0;

/**
 * Sift down the hit.
 * @param {Hit[]} hits - The hits.
 * @param {number} n - The number of hits.
 * @param {Hit} hit - The hit.
 * @param {number} i - The current index of the hit.
 */
function siftDown(hits, n, hit, i) {
    for (; ;) {
        const r = i + 1 << 1;
        const l = r - 1;
        let j = i;
        let h = hit;
        let temp;

        if (l < n && (temp = hits[l]).time < h.time) {
            h = temp;
            j = l;
        }

        if (r < n && (temp = hits[r]).time < h.time) {
            h = temp;
            j = r;
        }

        if (j === i) {
            break;
        }

        hits[i] = h;
        i = j;
    }

    hits[i] = hit;
}
