import { Hit } from "../hit.mjs";
import { max, min } from "../math.mjs";
import { Boundary } from "../boundary.mjs"

export class Cylinder extends Boundary {
    /**
     * The figures of the base.
     * @type {Figure[]}
     * @readonly
     */
    #base;

    /**
     * The bottom (minimum z-coordinate).
     * @type {number}
     * @readonly
     */
    #bottom;

    /**
     * The top (maximum z-coordinate).
     * @type {number}
     * @readonly
     */
    #top;

    /**
     * @param {object} args
     * @param {Figure[]} args.base - The figures of the base.
     * @param {number|null} [args.bottom=-Infinity] - The bottom (minimum z-coordinate).
     * @param {number|null} [args.top=Infinity] - The top (maximum z-coordinate).
     * @param {number} [args.mask] - The bit mask (32-bit).
     */
    constructor({ base, bottom, top, mask }) {
        super(mask);

        this.#base = base;
        this.#bottom = bottom ?? -Infinity;
        this.#top = top ?? Infinity;
    }

    /** @type {number} */
    #state = -1;

    /** @override */
    clone() {
        const clone = new this.constructor({
            base: Array.from(this.#base),
            bottom: this.#bottom,
            top: this.#top,
            mask: this.mask
        });

        clone.#state = this.#state;

        return clone;
    }

    /** @override */
    initialize(minX, minY, minZ, maxX, maxY, maxZ) {
        const figures = this.#base;

        if (this.mask === 0 || !(max(this.#bottom, minZ) <= min(this.#top, maxZ))) {
            figures.length = 0;

            return false;
        }

        for (let figureIndex = figures.length - 1; figureIndex >= 0; figureIndex--) {
            const figure = figures[figureIndex];

            if (figure.mask === 0 || !figure.intersectsBounds(minX, minY, maxX, maxY)) {
                figures[figureIndex] = figures[figures.length - 1];
                figures.length--;
            }
        }

        let state = this.#state;

        if (this.#bottom <= minZ && this.#top >= maxZ) {
            state ^= 1 << 31;
        }

        if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
            for (let figureIndex = figures.length - 1; figureIndex >= 0; figureIndex--) {
                const figure = figures[figureIndex];

                if (figure.containsBounds(minX, minY, maxX, maxY)) {
                    figures[figureIndex] = figures[figures.length - 1];
                    figures.length--;
                    state ^= figure.mask;
                }
            }
        }

        this.#state = state;

        if ((state & 0x7FFFFFFF) !== 0 && figures.length === 0) {
            return false;
        }

        if (state === 0 && figures.length === 0) {
            this.envelops = true;
        }

        return true;
    }

    /** @override */
    computeHits(originX, originY, originZ, velocityX, velocityY, velocityZ, hitQueue, volumeIndex, boundaryIndex) {
        let state = this.#state;
        let computeFigureHits;
        const envelopsZ = (state & 1 << 31) === 0;

        if (!envelopsZ) {
            const invVelocityZ = 1 / velocityZ;

            const t1 = (this.#bottom - originZ) * invVelocityZ;
            const t2 = (this.#top - originZ) * invVelocityZ;
            const time1 = min(max(t1, 0), max(t2, 0));
            const time2 = max(min(t1, Infinity), min(t2, Infinity));

            if (time1 <= time2 && time2 > 0) {
                if (time1 >= 0) {
                    if (time1 < 1) {
                        hitQueue?.push(new Hit(time1, volumeIndex, boundaryIndex, 1 << 31));
                    }

                    state ^= 1 << 31;
                }

                if (time2 >= 0) {
                    if (time2 < 1) {
                        hitQueue?.push(new Hit(time2, volumeIndex, boundaryIndex, 1 << 31));
                    }

                    state ^= 1 << 31;
                }

                computeFigureHits = true;
            }
        } else {
            computeFigureHits = true;
        }

        if (computeFigureHits) {
            if (velocityX === 0 && velocityY === 0) {
                velocityX = velocityY = 1;
                hitQueue = null;
            }

            const invVelocityX = 1 / velocityX;
            const invVelocityY = 1 / velocityY;

            const figures = this.#base;
            const numFigures = figures.length;

            for (let figureIndex = 0; figureIndex < numFigures; figureIndex++) {
                const figure = figures[figureIndex];

                let t1 = (figure.minX - originX) * invVelocityX;
                let t2 = (figure.maxX - originX) * invVelocityX;
                let time1 = min(max(t1, 0), max(t2, 0));
                let time2 = max(min(t1, Infinity), min(t2, Infinity));

                t1 = (figure.minY - originY) * invVelocityY;
                t2 = (figure.maxY - originY) * invVelocityY;
                time1 = min(max(t1, time1), max(t2, time1));
                time2 = max(min(t1, time2), min(t2, time2));

                if (time1 > time2 || time2 <= 0) {
                    continue;
                }

                state ^= figure.computeHits(originX, originY, velocityX, velocityY, hitQueue, volumeIndex, boundaryIndex);
            }
        }

        this.state = state;

        return state === 0 ? this.mask : 0;
    }
}
