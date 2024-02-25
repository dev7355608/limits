import Shape from "../shape.mjs";
import { max, min } from "../math.mjs";

/**
 * @import { int31 } from "../_types.mjs";
 * @import Cast from "../cast.mjs";
 */

/**
 * @sealed
 */
export default class Ellipse extends Shape {
    /**
     * @param {object} args
     * @param {number} args.centerX - The x-coordinate of the center.
     * @param {number} args.centerY - The y-coordinate of the center.
     * @param {number} args.radiusX - The x-radius (finite, positive).
     * @param {number} args.radiusY - The y-radius (finite, positive).
     * @param {number} [args.rotation=0.0] - The rotation in radians.
     * @param {int31} [args.mask=0x7FFFFFFF] - The mask (nonzero 31-bit integer).
     * @returns {Ellipse} The ellipse.
     */
    static create({ centerX, centerY, radiusX, radiusY, rotation = 0.0, mask = 0x7FFFFFFF }) {
        console.assert(typeof centerX === "number");
        console.assert(typeof centerY === "number");
        console.assert(typeof radiusX === "number");
        console.assert(typeof radiusY === "number");
        console.assert(typeof rotation === "number");
        console.assert(Number.isFinite(centerX));
        console.assert(Number.isFinite(centerY));
        console.assert(Number.isFinite(radiusX));
        console.assert(Number.isFinite(radiusY));
        console.assert(Number.isFinite(rotation));
        console.assert(radiusX > 0);
        console.assert(radiusY > 0);
        console.assert(mask === (mask & 0x7FFFFFFF) && mask !== 0);

        return new Ellipse(mask | 0, centerX + 0.0, centerY + 0.0, radiusX + 0.0, radiusY + 0.0, rotation + 0.0);
    }

    /**
     * @param {int31} mask - The mask (nonzero 31-bit integer).
     * @param {number} centerX - The x-coordinate of the center.
     * @param {number} centerY - The y-coordinate of the center.
     * @param {number} radiusX - The x-radius (positive).
     * @param {number} radiusY - The y-radius (positive).
     * @param {number} rotation - The rotation in radians.
     * @private
     * @ignore
     */
    constructor(mask, centerX, centerY, radiusX, radiusY, rotation) {
        super(mask);

        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const deltaX = Math.hypot(radiusX * cos, radiusY * sin);
        const deltaY = Math.hypot(radiusX * sin, radiusY * cos);
        const scaleX = cos / radiusX;
        const skewX = -sin / radiusY;
        const skewY = sin / radiusX;
        const scaleY = cos / radiusY;

        /**
         * The minimum x-coordinate.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._minX = centerX - deltaX;

        /**
         * The minimum y-coordinate.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._minY = centerY - deltaY;

        /**
         * The maximum x-coordinate.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._maxX = centerX + deltaX;

        /**
         * The maximum y-coordinate.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._maxY = centerY + deltaY;

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
        this._translationX = -(centerX * scaleX + centerY * skewY);

        /**
         * The y-translation of the matrix.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._translationY = -(centerX * skewX + centerY * scaleY);
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
        const mb = this._skewX;
        const mc = this._skewY;
        const md = this._scaleY;
        const mx = this._translationX;
        const my = this._translationY;

        let x = ma * minX + mc * minY + mx;
        let y = mb * minX + md * minY + my;

        if (x * x + y * y > 1.0) {
            return 0;
        }

        x = ma * maxX + mc * minY + mx;
        y = mb * maxX + md * minY + my;

        if (x * x + y * y > 1.0) {
            return 0;
        }

        x = ma * maxX + mc * maxY + mx;
        y = mb * maxX + md * maxY + my;

        if (x * x + y * y > 1.0) {
            return 0;
        }

        x = ma * minX + mc * maxY + mx;
        y = mb * minX + md * maxY + my;

        if (x * x + y * y > 1.0) {
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
        const mb = this._skewX;
        const mc = this._skewY;
        const md = this._scaleY;
        const mx = this._translationX;
        const my = this._translationY;
        const x0 = ma * x + mc * y + mx;
        const y0 = mb * x + md * y + my;

        return x0 * x0 + y0 * y0 <= 1.0;
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
        const a = dx * dx + dy * dy;
        const b = dx * x + dy * y;
        const c = x * x + y * y - 1.0;
        let time1, time2;

        if (c !== 0.0) {
            const d = b * b - a * c;

            if (d <= 1e-6) {
                return;
            }

            const f = Math.sqrt(d);

            if (b !== 0.0) {
                time1 = (-b - Math.sign(b) * f) / a;
                time2 = c / (a * time1);
            } else {
                time1 = f / a;
                time2 = -time1;
            }
        } else {
            time1 = 0.0;
            time2 = -b / a;
        }

        if (time1 > 0.0) {
            cast.addHit(time1, this.mask);
        }

        if (time2 > 0.0) {
            cast.addHit(time2, this.mask);
        }
    }
}
