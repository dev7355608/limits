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
     * @param {number} args.centerX - The x-coordinate of the center.
     * @param {number} args.centerY - The y-coordinate of the center.
     * @param {number} args.radius - The radius (positive).
     * @param {int31} [args.mask=0x7FFFFFFF] - The mask (nonzero 31-bit integer).
     * @returns {Circle} The circle.
     */
    static create({ centerX, centerY, radius, mask = 0x7FFFFFFF }) {
        console.assert(typeof centerX === "number");
        console.assert(typeof centerY === "number");
        console.assert(typeof radius === "number");
        console.assert(Number.isFinite(centerX));
        console.assert(Number.isFinite(centerY));
        console.assert(Number.isFinite(radius));
        console.assert(radius > 0);
        console.assert(mask === (mask & 0x7FFFFFFF) && mask !== 0);

        return new Circle(mask | 0, centerX + 0.0, centerY + 0.0, radius + 0.0);
    }

    /**
     * @param {int31} mask - The mask (nonzero 31-bit integer).
     * @param {number} centerX - The x-coordinate of the center.
     * @param {number} centerY - The y-coordinate of the center.
     * @param {number} radius - The radius (finite, positive).
     * @private
     * @ignore
     */
    constructor(mask, centerX, centerY, radius) {
        super(mask);

        /**
         * The x-coordinate of the center.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._centerX = centerX;

        /**
         * The y-coordinate of the center.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._centerY = centerY;

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
        const centerX = this._centerX;

        if (centerX + radius < minX || maxX < centerX - radius) {
            return -1;
        }

        const centerY = this._centerY;

        if (centerY + radius < minY || maxY < centerY - radius) {
            return -1;
        }

        if (centerX - radius > minX || maxX > centerX + radius || centerY - radius > minY || maxY > centerY + radius) {
            return 0;
        }

        const radiusSquared = radius * radius;

        let x = minX - centerX;
        let y = minY - centerY;

        if (x * x + y * y > radiusSquared) {
            return 0;
        }

        x = maxX - centerX;
        y = minY - centerY;

        if (x * x + y * y > radiusSquared) {
            return 0;
        }

        x = maxX - centerX;
        y = maxY - centerY;

        if (x * x + y * y > radiusSquared) {
            return 0;
        }

        x = minX - centerX;
        y = maxY - centerY;

        if (x * x + y * y > radiusSquared) {
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
        x -= this._centerX;
        y -= this._centerY;

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
        const x = (originX - this._centerX) * invRadius;
        const y = (originY - this._centerY) * invRadius;
        const dx = directionX * invRadius;
        const dy = directionY * invRadius;
        const a = dx * dx + dy * dy;
        const b = dx * x + dy * y;
        const c = x * x + y * y - 1;

        let time1 = 0.0;
        let time2 = 0.0;

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
