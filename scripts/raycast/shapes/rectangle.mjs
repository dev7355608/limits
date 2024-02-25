import Shape from "../shape.mjs";
import { max, min } from "../math.mjs";

/**
 * @import { int31 } from "../_types.mjs";
 * @import Cast from "../cast.mjs";
 */

/**
 * @sealed
 */
export default class Rectangle extends Shape {
    /**
     * @param {object} args
     * @param {number} args.centerX - The x-coordinate of the center.
     * @param {number} args.centerY - The y-coordinate of the center.
     * @param {number} args.width - The width (finite, positive).
     * @param {number} args.height - The height (finite, positive).
     * @param {number} [args.rotation=0.0] - The rotation in radians.
     * @param {int31} [args.mask=0x7FFFFFFF] - The mask (nonzero 31-bit integer).
     * @returns {Rectangle} The rectangle.
     */
    static create({ centerX, centerY, width, height, rotation = 0.0, mask = 0x7FFFFFFF }) {
        console.assert(typeof centerX === "number");
        console.assert(typeof centerY === "number");
        console.assert(typeof width === "number");
        console.assert(typeof height === "number");
        console.assert(typeof rotation === "number");
        console.assert(Number.isFinite(centerX));
        console.assert(Number.isFinite(centerY));
        console.assert(Number.isFinite(width));
        console.assert(Number.isFinite(height));
        console.assert(Number.isFinite(rotation));
        console.assert(width > 0);
        console.assert(height > 0);
        console.assert(mask === (mask & 0x7FFFFFFF) && mask !== 0);

        return new Rectangle(mask | 0, centerX + 0.0, centerY + 0.0, width + 0.0, height + 0.0, rotation + 0.0);
    }

    /**
     * @param {int31} mask - The mask (nonzero 31-bit integer).
     * @param {number} centerX - The x-coordinate of the center.
     * @param {number} centerY - The y-coordinate of the center.
     * @param {number} width - The width (finite, positive).
     * @param {number} height - The height (finite, positive).
     * @param {number} rotation - The rotation in radians.
     * @private
     * @ignore
     */
    constructor(mask, centerX, centerY, width, height, rotation) {
        super(mask);

        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const l = -width * 0.5;
        const r = -l;
        const t = -height * 0.5;
        const b = -t;
        const x0 = cos * l - sin * t;
        const x1 = cos * r - sin * t;
        const x2 = cos * r - sin * b;
        const x3 = cos * l - sin * b;
        const minX = Math.min(x0, x1, x2, x3) + centerX;
        const maxX = Math.max(x0, x1, x2, x3) + centerX;
        const y0 = sin * l + cos * t;
        const y1 = sin * r + cos * t;
        const y2 = sin * r + cos * b;
        const y3 = sin * l + cos * b;
        const minY = Math.min(y0, y1, y2, y3) + centerY;
        const maxY = Math.max(y0, y1, y2, y3) + centerY;
        const scaleX = cos / width;
        const skewX = -sin / height;
        const skewY = sin / width;
        const scaleY = cos / height;

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

        /**
         * The x-scale of the matrix.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._scaleX = scaleX;

        /**
         * The x-skew of the matrix.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._skewX = skewX;

        /**
         * The y-skew of the matrix.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._skewY = skewY;

        /**
         * The y-scale of the matrix.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._scaleY = scaleY;

        /**
         * The x-translation of the matrix.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._translationX = 0.5 - (centerX * scaleX + centerY * skewY);

        /**
         * The y-translation of the matrix.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._translationY = 0.5 - (centerX * skewX + centerY * scaleY);
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

        const ma = this._scaleX;
        const mc = this._skewY;
        const mx = this._translationX;
        let x = ma * minX + mc * minY + mx;

        if (x < 0 || x > 1) {
            return 0;
        }

        x = ma * maxX + mc * minY + mx;

        if (x < 0 || x > 1) {
            return 0;
        }

        x = ma * maxX + mc * maxY + mx;

        if (x < 0 || x > 1) {
            return 0;
        }

        x = ma * minX + mc * maxY + mx;

        if (x < 0 || x > 1) {
            return 0;
        }

        const mb = this._skewX;
        const md = this._scaleY;
        const my = this._translationY;
        let y = mb * minX + md * minY + my;

        if (y < 0 || y > 1) {
            return 0;
        }

        y = mb * maxX + md * minY + my;

        if (y < 0 || y > 1) {
            return 0;
        }

        y = mb * maxX + md * maxY + my;

        if (y < 0 || y > 1) {
            return 0;
        }

        y = mb * minX + md * maxY + my;

        if (y < 0 || y > 1) {
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
        const ma = this._scaleX;
        const mc = this._skewY;
        const mx = this._translationX;
        const x0 = ma * x + mc * y + mx;

        if (x0 < 0 || x0 > 1) {
            return false;
        }

        const mb = this._skewX;
        const md = this._scaleY;
        const my = this._translationY;
        const y0 = mb * x + md * y + my;

        if (y0 < 0 || y0 > 1) {
            return false;
        }

        return true;
    }

    /**
     * @param {Cast} cast - The cast.
     * @inheritDoc
     */
    computeHits(cast) {
        const { originX, originY, directionX, directionY } = cast;
        const ma = this._scaleX;
        const mb = this._skewX;
        const mc = this._skewY;
        const md = this._scaleY;
        const mx = this._translationX;
        const my = this._translationY;
        const x = ma * originX + mc * originY + mx;
        const y = mb * originX + md * originY + my;
        const dx = ma * directionX + mc * directionY;
        const dy = mb * directionX + md * directionY;
        const px = -1.0 / dx;
        const py = -1.0 / dy;

        let t1 = x * px;
        let t2 = (x - 1.0) * px;
        let time1 = min(max(t1, 0.0), max(t2, 0.0));
        let time2 = max(min(t1, Infinity), min(t2, Infinity));

        t1 = y * py;
        t2 = (y - 1.0) * py;
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
