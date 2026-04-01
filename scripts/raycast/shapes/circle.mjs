import Shape from "../shape.mjs";

/**
 * @import { int31 } from "../_types.mjs";
 * @import Cast from "../cast.mjs";
 */

/**
 * @sealed
 */
export default class Circle extends Shape {
    /**
     * @param {object} args
     * @param {number} args.x - The x-coordinate of the center.
     * @param {number} args.y - The y-coordinate of the center.
     * @param {number} args.radius - The radius (positive).
     * @param {int31} [args.mask=0x7FFFFFFF] - The mask (nonzero 31-bit integer).
     * @returns {Circle} The circle.
     */
    static create({ x, y, radius, mask = 0x7FFFFFFF }) {
        console.assert(typeof x === "number");
        console.assert(typeof y === "number");
        console.assert(typeof radius === "number");
        console.assert(Number.isFinite(x));
        console.assert(Number.isFinite(y));
        console.assert(Number.isFinite(radius));
        console.assert(radius > 0);
        console.assert(mask === (mask & 0x7FFFFFFF) && mask !== 0);

        return new Circle(mask | 0, x + 0.0, y + 0.0, radius + 0.0);
    }

    /**
     * @param {int31} mask - The mask (nonzero 31-bit integer).
     * @param {number} x - The x-coordinate of the center.
     * @param {number} y - The y-coordinate of the center.
     * @param {number} radius - The radius (finite, positive).
     * @private
     * @ignore
     */
    constructor(mask, x, y, radius) {
        super(mask);

        /**
         * The x-coordinate of the center.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._x = x;

        /**
         * The y-coordinate of the center.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._y = y;

        /**
         * The radius.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._radius = radius;
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
        const radius = this._radius;
        const x = this._x;

        if (x + radius < minX || maxX < x - radius) {
            return -1;
        }

        const y = this._y;

        if (y + radius < minY || maxY < y - radius) {
            return -1;
        }

        if (x - radius > minX || maxX > x + radius || y - radius > minY || maxY > y + radius) {
            return 0;
        }

        const radiusSquared = radius * radius;

        let x0 = minX - x;
        let y0 = minY - y;

        if (x0 * x0 + y0 * y0 > radiusSquared) {
            return 0;
        }

        x0 = maxX - x;
        y0 = minY - y;

        if (x0 * x0 + y0 * y0 > radiusSquared) {
            return 0;
        }

        x0 = maxX - x;
        y0 = maxY - y;

        if (x0 * x0 + y0 * y0 > radiusSquared) {
            return 0;
        }

        x0 = minX - x;
        y0 = maxY - y;

        if (x0 * x0 + y0 * y0 > radiusSquared) {
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
        x -= this._x;
        y -= this._y;

        const radius = this._radius;

        return x * x + y * y <= radius * radius;
    }

    /**
     * @param {Cast} cast - The cast.
     * @inheritDoc
     */
    computeHits(cast) {
        const { originX, originY, directionX, directionY } = cast;
        const invRadius = 1.0 / this._radius;
        const x = (originX - this._x) * invRadius;
        const y = (originY - this._y) * invRadius;
        const dx = directionX * invRadius;
        const dy = directionY * invRadius;
        const a = dx * dx + dy * dy;
        const b = dx * x + dy * y;
        const c = x * x + y * y - 1;

        let time1 = 0.0;
        let time2;

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
