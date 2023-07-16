import { Hit } from "../hit.mjs";
import { Figure } from "../figure.mjs";

export class Circle extends Figure {
    /**
     * The x-coordinate of the center.
     * @type {number}
     */
    #centerX;

    /**
     * The y-coordinate of the center.
     * @type {number}
     */
    #centerY;

    /**
     * The radius.
     * @type {number}
     */
    #radius;

    /**
     * @param {object} args
     * @param {number} args.centerX
     * @param {number} args.centerY
     * @param {number} args.radius
     * @param {number} [args.mask]
     */
    constructor({ centerX, centerY, radius, mask }) {
        const minX = centerX - radius;
        const minY = centerY - radius;
        const maxX = centerX + radius;
        const maxY = centerY + radius;

        super(minX, minY, maxX, maxY, mask);

        this.#centerX = centerX;
        this.#centerY = centerY;
        this.#radius = radius;
    }

    /** @override */
    containsBounds(minX, minY, maxX, maxY) {
        const cx = this.#centerX;
        const cy = this.#centerY;
        const r = this.#radius;
        const rr = r * r;
        let x, y;

        x = minX - cx;
        y = minY - cy;

        if (x * x + y * y > rr) {
            return false;
        }

        x = maxX - cx;
        y = minY - cy;

        if (x * x + y * y > rr) {
            return false;
        }

        x = maxX - cx;
        y = maxY - cy;

        if (x * x + y * y > rr) {
            return false;
        }

        x = minX - cx;
        y = maxY - cy;

        if (x * x + y * y > rr) {
            return false;
        }

        return true;
    }

    /** @override */
    computeHits(originX, originY, velocityX, velocityY, hitQueue, volumeIndex, boundaryIndex) {
        const ir = 1 / this.#radius;
        const x = (originX - this.#centerX) * ir;
        const y = (originY - this.#centerY) * ir;
        const dx = velocityX * ir;
        const dy = velocityY * ir;
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
