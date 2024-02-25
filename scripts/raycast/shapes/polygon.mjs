import Shape from "../shape.mjs";
import { max, min } from "../math.mjs";

/**
 * @import { int31 } from "../_types.mjs";
 * @import Cast from "../cast.mjs";
 */

/**
 * @sealed
 */
export default class Polygon extends Shape {
    /**
     * @param {object} args
     * @param {number} args.points - The points of the polygon (`[x0, y0, x1, y1, x2, y2, ...]`).
     * @param {int31} [args.mask=0x7FFFFFFF] - The mask (nonzero 31-bit integer).
     * @returns {Polygon} The polygon.
     */
    static create({ points, mask = 0x7FFFFFFF }) {
        console.assert(Array.isArray(points));
        console.assert(points.every((v) => typeof v === "number" && Number.isFinite(v)));
        console.assert(points.length >= 6);
        console.assert(points.length % 2 === 0);
        console.assert(points.some((v, i) => i % 2 === 0 && v !== points[0]));
        console.assert(points.some((v, i) => i % 2 === 1 && v !== points[1]));
        console.assert(mask === (mask & 0x7FFFFFFF) && mask !== 0);

        const n = points.length;
        const roundedPoints = new Float64Array(n);

        for (let i = 0; i < n; i++) {
            roundedPoints[i] = (points[i] + 6755399441055744.0) - 6755399441055744.0;
        }

        return new Polygon(mask | 0, roundedPoints);
    }

    /**
     * @param {int31} mask - The mask (nonzero 31-bit integer).
     * @param {Float64Array} points - The points of the polygon (`[x0, y0, x1, y1, x2, y2, ...]`).
     * @private
     * @ignore
     */
    constructor(mask, points) {
        super(mask);

        const n = points.length;
        let minX = points[0];
        let minY = points[1];
        let maxX = minX;
        let maxY = minY;

        for (let i = 2; i < n; i += 2) {
            const x = points[i];
            const y = points[i + 1];

            minX = min(minX, x);
            minY = min(minY, y);
            maxX = max(maxX, x);
            maxY = max(maxY, y);
        }

        /**
         * The points of the polygon.
         * @type {Float64Array}
         * @readonly
         * @private
         * @ignore
         */
        this._points = points;

        /**
         * The minimum x-coordinate.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._minX = minX;

        /**
         * The minimum y-coordinate.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._minY = minY;

        /**
         * The maximum x-coordinate.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._maxX = maxX;

        /**
         * The maximum y-coordinate.
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

        const centerX = (minX + maxX) * 0.5;
        const centerY = (minY + maxY) * 0.5;
        const points = this._points;
        const n = points.length;
        let centerInside = false;

        for (let i = 0, x0 = points[n - 2], y0 = points[n - 1]; i < n; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];

            if ((y1 > centerY) !== (y0 > centerY) && centerX < (x0 - x1) * ((centerY - y1) / (y0 - y1)) + x1) {
                centerInside = !centerInside;
            }

            x0 = x1;
            y0 = y1;
        }

        if (!centerInside) {
            return 0;
        }

        for (let i = 0, x0 = points[n - 2], y0 = points[n - 1]; i < n; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];
            const px = 1.0 / (x1 - x0);
            const py = 1.0 / (y1 - y0);

            let t1 = (minX - x0) * px;
            let t2 = (maxX - x0) * px;
            let time1 = min(max(t1, 0.0), max(t2, 0.0));
            let time2 = max(min(t1, Infinity), min(t2, Infinity));

            t1 = (minY - y0) * py;
            t2 = (maxY - y0) * py;
            time1 = min(max(t1, time1), max(t2, time1));
            time2 = max(min(t1, time2), min(t2, time2));

            if (time1 <= min(time2, 1.0)) {
                return 0;
            }

            x0 = x1;
            y0 = y1;
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
        if (x < this._minX || x > this._maxX || y < this._minY || y > this._maxY) {
            return false;
        }

        const points = this._points;
        const n = points.length;
        let inside = false;

        for (let i = 0, x0 = points[n - 2], y0 = points[n - 1]; i < n; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];

            if ((y1 > y) !== (y0 > y) && x < (x0 - x1) * ((y - y1) / (y0 - y1)) + x1) {
                inside = !inside;
            }

            x0 = x1;
            y0 = y1;
        }

        return inside;
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

        if (time1 > min(time2, 1.0)) {
            return;
        }

        const { directionX, directionY } = cast;
        const points = this._points;
        const n = points.length;
        let i = 0;
        let x0 = points[n - 2];
        let y0 = points[n - 1];

        do {
            const x1 = points[i++];
            const y1 = points[i++];
            const dx = x1 - x0;
            const dy = y1 - y0;
            const q = directionX * dy - directionY * dx;

            while (q !== 0.0) {
                const ox = x0 - originX;
                const oy = y0 - originY;
                const u = (ox * directionY - oy * directionX) / q;

                if (u < 0.0 || u > 1.0 || u === 0.0 && q > 0.0 || u === 1.0 && q < 0.0) {
                    break;
                }

                const time = (ox * dy - oy * dx) / q;

                if (time <= 0.0) {
                    break;
                }

                cast.addHit(time, this.mask);

                break;
            }

            x0 = x1;
            y0 = y1;
        } while (i !== n);
    }
}
