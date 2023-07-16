import { Hit } from "../hit.mjs";
import { Figure } from "../figure.mjs";

export class Ellipse extends Figure {
    /**
     * The transform matrix.
     * @type {Float64Array}
     */
    #matrix = new Float64Array(6);

    /**
     * @param {object} args
     * @param {number} args.centerX
     * @param {number} args.centerY
     * @param {number} args.radiusX
     * @param {number} args.radiusY
     * @param {number} [args.rotation=0]
     * @param {number} [args.mask]
     */
    constructor({ centerX, centerY, radiusX, radiusY, rotation = 0, mask }) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const deltaX = Math.hypot(radiusX * cos, radiusY * sin);
        const deltaY = Math.hypot(radiusX * sin, radiusY * cos);
        const minX = centerX - deltaX;
        const minY = centerY - deltaY;
        const maxX = centerX + deltaX;
        const maxY = centerY + deltaY;

        super(minX, minY, maxX, maxY, mask);

        const matrix = this.#matrix;
        const m0 = matrix[0] = cos / radiusX;
        const m1 = matrix[1] = -sin / radiusY;
        const m2 = matrix[2] = sin / radiusX;
        const m3 = matrix[3] = cos / radiusY;

        matrix[4] = -(centerX * m0 + centerY * m2);
        matrix[5] = -(centerX * m1 + centerY * m3);
    }

    /** @override */
    containsBounds(minX, minY, maxX, maxY) {
        const [ta, tb, tc, td, tx, ty] = this.#matrix;
        let x, y;

        x = ta * minX + tc * minY + tx;
        y = tb * minX + td * minY + ty;

        if (x * x + y * y > 1) {
            return false;
        }

        x = ta * maxX + tc * minY + tx;
        y = tb * maxX + td * minY + ty;

        if (x * x + y * y > 1) {
            return false;
        }

        x = ta * maxX + tc * maxY + tx;
        y = tb * maxX + td * maxY + ty;

        if (x * x + y * y > 1) {
            return false;
        }

        x = ta * minX + tc * maxY + tx;
        y = tb * minX + td * maxY + ty;

        if (x * x + y * y > 1) {
            return false;
        }

        return true;
    }

    /** @override */
    computeHits(originX, originY, velocityX, velocityY, hitQueue, volumeIndex, boundaryIndex) {
        const [ta, tb, tc, td, tx, ty] = this.#matrix;
        const x = ta * originX + tc * originY + tx;
        const y = tb * originX + td * originY + ty;
        const dx = ta * velocityX + tc * velocityY;
        const dy = tb * velocityX + td * velocityY;
        const a = dx * dx + dy * dy;
        const b = dx * x + dy * y;
        const c = x * x + y * y - 1;
        let time1, time2;
        let state = 0;

        if (c !== 0) {
            const d = b * b - a * c;

            if (d <= 1e-6) {
                return state;
            }

            const f = Math.sqrt(d);

            if (b !== 0) {
                time1 = (-b - Math.sign(b) * f) / a;
                time2 = c / (a * time1);
            } else {
                time1 = f / a;
                time2 = -time1;
            }
        } else {
            time1 = 0;
            time2 = -b / a;
        }

        if (time1 > 0) {
            if (time1 < 1) {
                hitQueue?.push(new Hit(time1, volumeIndex, boundaryIndex, this.mask));
            }

            state ^= this.mask;
        }

        if (time2 > 0) {
            if (time2 < 1) {
                hitQueue?.push(new Hit(time2, volumeIndex, boundaryIndex, this.mask));
            }

            state ^= this.mask;
        }

        return state;
    }
}
