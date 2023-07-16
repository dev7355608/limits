import { Hit } from "../hit.mjs";
import { max, min } from "../math.mjs";
import { Figure } from "../figure.mjs";

export class Rectangle extends Figure {
    /**
     * The transform matrix.
     * @type {Float64Array}
     */
    #matrix = new Float64Array(6);

    /**
     * @param {object} args
     * @param {number} args.centerX
     * @param {number} args.centerY
     * @param {number} args.width
     * @param {number} args.height
     * @param {number} [args.rotation=0]
     * @param {number} [args.mask]
     */
    constructor({ centerX, centerY, width, height, rotation = 0, mask }) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const l = -width / 2;
        const r = -l;
        const t = -height / 2;
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

        super(minX, minY, maxX, maxY, mask);

        const matrix = this.#matrix;
        const m0 = matrix[0] = cos / width;
        const m1 = matrix[1] = -sin / height;
        const m2 = matrix[2] = sin / width;
        const m3 = matrix[3] = cos / height;

        matrix[4] = 0.5 - (centerX * m0 + centerY * m2);
        matrix[5] = 0.5 - (centerX * m1 + centerY * m3);
    }

    /** @override */
    containsBounds(minX, minY, maxX, maxY) {
        const [ta, tb, tc, td, tx, ty] = this.#matrix;
        let x, y;

        x = ta * minX + tc * minY + tx;

        if (x < 0 || x > 1) {
            return false;
        }

        x = ta * maxX + tc * minY + tx;

        if (x < 0 || x > 1) {
            return false;
        }

        x = ta * maxX + tc * maxY + tx;

        if (x < 0 || x > 1) {
            return false;
        }

        x = ta * minX + tc * maxY + tx;

        if (x < 0 || x > 1) {
            return false;
        }

        y = tb * minX + td * minY + ty;

        if (y < 0 || y > 1) {
            return false;
        }

        y = tb * maxX + td * minY + ty;

        if (y < 0 || y > 1) {
            return false;
        }

        y = tb * maxX + td * maxY + ty;

        if (y < 0 || y > 1) {
            return false;
        }

        y = tb * minX + td * maxY + ty;

        if (y < 0 || y > 1) {
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
        const px = -1 / dx;
        const py = -1 / dy;

        let t1 = x * px;
        let t2 = (x - 1) * px;
        let time1 = min(max(t1, 0), max(t2, 0));
        let time2 = max(min(t1, Infinity), min(t2, Infinity));

        t1 = y * py;
        t2 = (y - 1) * py;
        time1 = min(max(t1, time1), max(t2, time1));
        time2 = max(min(t1, time2), min(t2, time2));

        let state = 0;

        if (time1 <= time2 && time1 < 1 && time2 > 0) {
            if (time1 <= 0) {
                state = this.mask;
            }

            if (hitQueue) {
                if (time1 > 0) {
                    hitQueue.push(new Hit(time1, volumeIndex, boundaryIndex, this.mask));
                }

                if (time2 < 1) {
                    hitQueue.push(new Hit(time2, volumeIndex, boundaryIndex, this.mask));
                }
            }
        }

        return state;
    }
}
