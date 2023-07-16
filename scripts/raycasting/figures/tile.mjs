import { Hit } from "../hit.mjs";
import { max, min } from "../math.mjs";
import { Figure } from "../figure.mjs";

export class Tile extends Figure {
    /**
     * The transform matrix.
     * @type {Float64Array}
     */
    #matrix = new Float64Array(6);

    /**
     * The width.
     * @type {number}
     */
    #width;

    /**
     * The height.
     * @type {number}
     */
    #height;

    /**
     * The signed distance field.
     * @type {Float64Array}
     */
    #field;

    /**
     * @param {object} args
     * @param {number} args.centerX
     * @param {number} args.centerY
     * @param {number} args.width
     * @param {number} args.height
     * @param {number} [args.rotation=0]
     * @param {{
     *     pixels: (number|boolean)[],
     *     offset: number,
     *     stride: number,
     *     width: number,
     *     height: number,
     *     minX: number,
     *     minY: number,
     *     maxX: number,
     *     maxY: number,
     *     threshold: number
     * }} args.texture
     * @param {number} [args.mask]
     */
    constructor({ centerX, centerY, width, height, rotation = 0, texture, mask }) {
        const textureWidth = texture.width;
        const textureHeight = texture.height;
        const textureMinX = texture.minX ?? 0;
        const textureMinY = texture.minY ?? 0;
        const textureMaxX = texture.maxX ?? textureWidth;
        const textureMaxY = texture.maxY ?? textureHeight;
        const textureScaleX = textureWidth / width;
        const textureScaleY = textureHeight / height;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const l = textureMinX / textureScaleX - halfWidth;
        const r = textureMaxX / textureScaleX - halfWidth;
        const t = textureMinY / textureScaleY - halfHeight;
        const b = textureMaxY / textureScaleY - halfHeight;
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

        this.#width = textureMaxX - textureMinX + 2;
        this.#height = textureMaxY - textureMinY + 2;

        const matrix = this.#matrix;
        const m0 = matrix[0] = cos;
        const m1 = matrix[1] = -sin;
        const m2 = matrix[2] = sin;
        const m3 = matrix[3] = cos;

        matrix[4] = halfWidth - (centerX * m0 + centerY * m2);
        matrix[5] = halfHeight - (centerX * m1 + centerY * m3);

        matrix[0] *= textureScaleX;
        matrix[1] *= textureScaleY;
        matrix[2] *= textureScaleX;
        matrix[3] *= textureScaleY;
        matrix[4] *= textureScaleX;
        matrix[5] *= textureScaleY;
        matrix[4] += 1 - textureMinX;
        matrix[5] += 1 - textureMinY;

        const textureStrideX = texture.stride ?? 1;
        const textureStrideY = textureWidth * textureStrideX;
        const signedDistanceField = this.#field = sdf(
            texture.pixels,
            texture.offset ?? 0,
            textureStrideX,
            textureStrideY,
            textureMinX,
            textureMinY,
            textureMaxX,
            textureMaxY,
            texture.threshold ?? 0
        );

        for (let i = 0, n = signedDistanceField.length; i < n; i++) {
            const signedDistance = signedDistanceField[i];

            signedDistanceField[i] = Math.sign(signedDistance)
                * max(Math.abs(signedDistance) - 1, 0.5);
        }
    }

    /** @override */
    computeHits(originX, originY, velocityX, velocityY, hitQueue, volumeIndex, boundaryIndex) {
        const [ta, tb, tc, td, tx, ty] = this.#matrix;
        const w = this.#width;
        const h = this.#height;
        let x = ta * originX + tc * originY + tx;
        let y = tb * originX + td * originY + ty;
        const dx = ta * velocityX + tc * velocityY;
        const dy = tb * velocityX + td * velocityY;
        const px = 1 / dx;
        const py = 1 / dy;

        let t1 = (1 - x) * px;
        let t2 = (w - 1 - x) * px;
        let time1 = min(max(t1, 0), max(t2, 0));
        let time2 = max(min(t1, Infinity), min(t2, Infinity));

        t1 = (1 - y) * py;
        t2 = (h - 1 - y) * py;
        time1 = min(max(t1, time1), max(t2, time1));
        time2 = max(min(t1, time2), min(t2, time2));

        let state = 0;

        if (time1 <= time2 && time1 < 1 && time2 > 0) {
            const f = this.#field;
            let inside;

            if (time1 <= 0) {
                time1 = 0;
                inside = f[(y | 0) * w + (x | 0)] < 0;

                if (inside) {
                    state = this.mask;
                }
            } else {
                inside = false;
            }

            if (hitQueue) {
                const invTravelDistance = 1 / Math.sqrt(dx * dx + dy * dy);

                do {
                    const signedDistance = f[(y + dy * time1 | 0) * w + (x + dx * time1 | 0)]
                        * invTravelDistance;

                    if (inside !== signedDistance < 0) {
                        inside = !inside;

                        if (time1 < 1) {
                            hitQueue.push(new Hit(time1, volumeIndex, boundaryIndex, this.mask));
                        }
                    }

                    time1 += Math.abs(signedDistance);
                } while (time1 <= time2);

                if (inside && time2 <= 1) {
                    hitQueue.push(new Hit(time2, volumeIndex, boundaryIndex, this.mask));
                }
            }
        }

        return state;
    }
}

/**
 * The value representing infinity. Used by {@link edt}.
 * @type {number}
 */
const EDT_INF = 1e20;

/**
 * Generate the 2D Euclidean signed distance field.
 * @param {(number|boolean)[]} data - The elements.
 * @param {number} offset - The offset of the first element in `data`.
 * @param {number} strideX - The distance between consecutive elements in a row of `data`.
 * @param {number} strideY - The distance between consecutive elements in a column of `data`.
 * @param {number} minX - The minimum x-coordinate of the rectangle.
 * @param {number} minY - The minimum y-coordinate of the rectangle.
 * @param {number} maxX - The maximum x-coordinate of the rectangle.
 * @param {number} maxY - The maximum x-coordinate of the rectangle.
 * @param {number} [threshold=0] - The threshold that needs to be exceeded for a pixel to be inner.
 * @returns {Float64Array} - The signed distance field with a 1 pixel padding.
 */
function sdf(data, offset, strideX, strideY, minX, minY, maxX, maxY, threshold = 0) {
    const width = maxX - minX + 2;
    const height = maxY - minY + 2;
    const size = width * height;
    const capacity = Math.max(width, height);
    const temp = new ArrayBuffer(8 * size + 20 * capacity + 8);
    const inner = new Float64Array(temp, 0, size);
    const outer = new Float64Array(size).fill(EDT_INF);

    for (let y = minY, j = width + 1; y < maxY; y++, j += 2) {
        for (let x = minX; x < maxX; x++, j++) {
            const a = data[offset + x * strideX + y * strideY];

            if (a > threshold) {
                inner[j] = EDT_INF;
                outer[j] = 0;
            }
        }
    }

    const f = new Float64Array(temp, inner.byteLength, capacity);
    const z = new Float64Array(temp, f.byteOffset + f.byteLength, capacity + 1);
    const v = new Int32Array(temp, z.byteOffset + z.byteLength, capacity);

    edt(inner, width, height, f, v, z);
    edt(outer, width, height, f, v, z);

    for (let i = 0; i < size; i++) {
        outer[i] = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
    }

    return outer;
}

/**
 * 2D Euclidean squared distance transform by Felzenszwalb & Huttenlocher.
 * @param {Float64Array} grid - The grid.
 * @param {number} width - The width of the grid.
 * @param {number} height - The height of the grid.
 * @param {Float64Array} f - The temporary source data, which returns the y of the parabola vertex at x.
 * @param {Int32Array} v - The temporary used to store x-coordinates of parabola vertices.
 * @param {Float64Array} z - The temporary used to store x-coordinates of parabola intersections.
 */
function edt(grid, width, height, f, v, z) {
    for (let x = 0; x < width; x++) {
        edt1d(grid, x, width, height, f, v, z);
    }

    for (let y = 0; y < height; y++) {
        edt1d(grid, y * width, 1, width, f, v, z);
    }
}

/**
 * 1D squared distance transform. Used by {@link edt}.
 * @param {Float64Array} grid - The grid.
 * @param {number} offset - The offset.
 * @param {number} stride - The stride.
 * @param {number} length - The length.
 * @param {Float64Array} f - The temporary source data, which returns the y of the parabola vertex at x.
 * @param {Int32Array} v - The temporary used to store x-coordinates of parabola vertices.
 * @param {Float64Array} z - The temporary used to store x-coordinates of parabola intersections.
 */
function edt1d(grid, offset, stride, length, f, v, z) {
    f[0] = grid[offset];
    v[0] = 0;
    z[0] = -EDT_INF;
    z[1] = EDT_INF;

    for (let q = 1, k = 0, s = 0; q < length; q++) {
        f[q] = grid[offset + q * stride];

        const q2 = q * q;

        do {
            const r = v[k];

            s = (f[q] - f[r] + q2 - r * r) / (q - r) * 0.5;
        } while (s <= z[k] && k--);

        k++;
        v[k] = q;
        z[k] = s;
        z[k + 1] = EDT_INF;
    }

    for (let q = 0, k = 0; q < length; q++) {
        while (z[k + 1] < q) {
            k++;
        }

        const r = v[k];
        const qr = q - r;

        grid[offset + q * stride] = f[r] + qr * qr;
    }
}
