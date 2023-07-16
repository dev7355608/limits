import { Hit } from "../hit.mjs";
import { max, min } from "../math.mjs";
import { Figure } from "../figure.mjs";

export class Polygon extends Figure {
    /**
     * The points of the polygon.
     * @type {Float64Array}
     */
    #points;

    /**
     * @param {object} args
     * @param {number[]} args.points
     * @param {number} [args.mask]
     */
    constructor({ points, mask }) {
        const n = points.length;
        const p = new Float64Array(n);
        let minX;
        let minY;
        let maxX;
        let maxY;

        if (n > 0) {
            minX = p[0] = Math.round(points[0] * 256) / 256;
            minY = p[1] = Math.round(points[1] * 256) / 256;
            maxX = minX;
            maxY = minY;

            for (let i = 2; i < n; i += 2) {
                const x = p[i] = Math.round(points[i] * 256) / 256;
                const y = p[i + 1] = Math.round(points[i + 1] * 256) / 256;

                minX = min(minX, x);
                minY = min(minY, y);
                maxX = max(maxX, x);
                maxY = max(maxY, y);
            }
        } else {
            minX = minY = maxX = maxY = 0;
        }

        super(minX, minY, maxX, maxY, mask);

        /**
         * The points of the polygon.
         * @type {Float64Array}
         * @readonly
         */
        this.#points = p;
    }

    /** @override */
    containsBounds(minX, minY, maxX, maxY) {
        const points = this.#points;
        const n = points.length;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        let centerInside = false;

        for (let i = 0, x0 = points[n - 2], y0 = points[n - 1]; i < n; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];

            if ((y1 > centerY) !== (y0 > centerY)
                && centerX < (x0 - x1) * ((centerY - y1) / (y0 - y1)) + x1) {
                centerInside = !centerInside;
            }

            x0 = x1;
            y0 = y1;
        }

        if (!centerInside) {
            return false;
        }

        for (let i = 0, x0 = points[n - 2], y0 = points[n - 1]; i < n; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];
            const px = 1 / (x1 - x0);
            const py = 1 / (y1 - y0);

            let t1 = (minX - x0) * px;
            let t2 = (maxX - x0) * px;
            let time1 = min(max(t1, 0), max(t2, 0));
            let time2 = max(min(t1, Infinity), min(t2, Infinity));

            t1 = (minY - y0) * py;
            t2 = (maxY - y0) * py;
            time1 = min(max(t1, time1), max(t2, time1));
            time2 = max(min(t1, time2), min(t2, time2));

            if (time1 <= time2 && time1 < 1 && time2 > 0) {
                return false;
            }

            x0 = x1;
            y0 = y1;
        }

        return true;
    }

    /** @override */
    computeHits(originX, originY, velocityX, velocityY, hitQueue, volumeIndex, boundaryIndex) {
        const points = this.#points;
        const m = points.length;
        let i = 0;
        let x0 = points[m - 2];
        let y0 = points[m - 1];
        let state = 0;

        do {
            const x1 = points[i++];
            const y1 = points[i++];
            const dx = x1 - x0;
            const dy = y1 - y0;
            const q = velocityX * dy - velocityY * dx;

            while (q !== 0) {
                const ox = x0 - originX;
                const oy = y0 - originY;
                const u = (ox * velocityY - oy * velocityX) / q;

                if (u < 0 || u > 1 || u === 0 && q > 0 || u === 1 && q < 0) {
                    break;
                }

                const time = (ox * dy - oy * dx) / q;

                if (time <= 0) {
                    break;
                }

                if (time < 1) {
                    hitQueue?.push(new Hit(time, volumeIndex, boundaryIndex, this.mask));
                }

                state ^= this.mask;

                break;
            }

            x0 = x1;
            y0 = y1;
        } while (i !== m);

        return state;
    }
}
