import Shape from "../shape.mjs";
import { max, min } from "../math.mjs";

/**
 * @import { int31 } from "../_types.mjs";
 * @import Cast from "../cast.mjs";
 */

/**
 * @sealed
 * @hideconstructor
 */
export default class Bounds extends Shape {
    /**
     * @param {object} args
     * @param {number} args.minX - The minimum x-coordinate (finite).
     * @param {number} args.minY - The minimum y-coordinate (finite).
     * @param {number} args.maxX - The maximum x-coordinate (finite).
     * @param {number} args.maxY - The maximum y-coordinate (finite).
     * @param {int31} [args.mask=0x7FFFFFFF] - The mask (nonzero 31-bit integer).
     * @returns {Bounds} The bounds.
     */
    static create({ minX, minY, maxX, maxY, mask = 0x7FFFFFFF }) {
        console.assert(typeof minX === "number");
        console.assert(typeof minY === "number");
        console.assert(typeof maxX === "number");
        console.assert(typeof maxY === "number");
        console.assert(Number.isFinite(minX));
        console.assert(Number.isFinite(minY));
        console.assert(Number.isFinite(maxX));
        console.assert(Number.isFinite(maxY));
        console.assert(minX < maxX);
        console.assert(minY < maxY);
        console.assert(mask === (mask & 0x7FFFFFFF) && mask !== 0);

        return new Bounds(mask | 0, minX + 0.0, minY + 0.0, maxX + 0.0, maxY + 0.0);
    }

    /**
     * @param {int31} mask - The mask (nonzero 31-bit integer).
     * @param {number} minX - The minimum x-coordinate (finite).
     * @param {number} minY - The minimum y-coordinate (finite).
     * @param {number} maxX - The maximum x-coordinate (finite).
     * @param {number} maxY - The maximum y-coordinate (finite).
     * @private
     * @ignore
     */
    constructor(mask, minX, minY, maxX, maxY) {
        super(mask);

        /**
         * The minimum x-coordinate (finite).
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._minX = minX;

        /**
         * The minimum y-coordinate (finite).
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._minY = minY;

        /**
         * The maximum x-coordinate (finite).
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._maxX = maxX;

        /**
         * The maximum y-coordinate (finite).
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._maxY = maxY;
    }

    /**
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @returns {-1|0|1} If 1, then the bounding box is contained in the shape. If -1, if the bounding box does not intersect with the shape.
     * @inheritDoc
     */
    testBounds(minX, minY, maxX, maxY) {
        const x0 = this._minX;
        const x1 = this._maxX;

        if (max(x0, minX) > min(x1, maxX)) {
            return -1;
        }

        const y0 = this._minY;
        const y1 = this._maxY;

        if (max(y0, minY) > min(y1, maxY)) {
            return -1;
        }

        if (x0 > minX || maxX > x1 || y0 > minY || maxY > y1) {
            return 0;
        }

        return 1;
    }

    /**
     * @param {number} x - The x-coordinate of the point.
     * @param {number} y - The y-coordinate of the point.
     * @returns {boolean} True if the shape contains the point.
     * @inheritDoc
     */
    containsPoint(x, y) {
        return this._minX <= x && x <= this._maxX && this._minY <= y && y <= this._maxY;
    }

    /**
     * @param {Cast} cast - The cast.
     * @inheritDoc
     */
    computeHits(cast) {
        const { originX, originY, invDirectionX, invDirectionY } = cast;

        let t1 = (this._minX - originX) * invDirectionX;
        let t2 = (this._maxX - originX) * invDirectionX;
        let time1 = min(max(t1, 0.0), max(t2, 0.0));
        let time2 = max(min(t1, Infinity), min(t2, Infinity));

        t1 = (this._minY - originY) * invDirectionY;
        t2 = (this._maxY - originY) * invDirectionY;
        time1 = min(max(t1, time1), max(t2, time1));
        time2 = max(min(t1, time2), min(t2, time2));

        if (time1 <= min(time2, 1.0)) {
            const mask = this.mask;

            if (time1 > 0) {
                cast.addHit(time1, mask);
            }

            cast.addHit(time2, mask);
        }
    }
}
