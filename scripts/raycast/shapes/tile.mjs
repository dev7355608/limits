import Shape from "../shape.mjs";
import { max, min } from "../math.mjs";

/**
 * @import { int31 } from "../_types.mjs";
 * @import Cast from "../cast.mjs";
 */

/**
 * @sealed
 */
export default class Tile extends Shape {
    /**
     * @param {object} args
     * @param {number} args.centerX - The x-coordinate of the center.
     * @param {number} args.centerY - The y-coordinate of the center.
     * @param {number} args.width - The width (finite, positive).
     * @param {number} args.height - The height (finite, positive).
     * @param {number} [args.rotation=0.0] - The rotation in radians.
     * @param {{
     *     data: (number | boolean)[],
     *     offset?: number,
     *     stride?: number,
     *     width: number,
     *     height: number,
     *     minX?: number,
     *     minY?: number,
     *     maxX?: number,
     *     maxY?: number,
     *     threshold?: number
     * }} args.texture - The texture.
     * @param {int31} [args.mask=0x7FFFFFFF] - The mask (nonzero 31-bit integer).
     * @returns {Tile} The tile.
     */
    static create({ centerX, centerY, width, height, rotation = 0.0, texture, mask = 0x7FFFFFFF }) {
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
        console.assert(texture !== null && typeof texture === "object");
        console.assert(Array.isArray(texture.data) || ArrayBuffer.isView(texture.data) && !(texture.data instanceof DataView));
        console.assert(texture.data.every((v) => (typeof v === "number" || typeof v === "boolean") && v >= 0));
        console.assert(texture.offset === undefined || typeof texture.offset === "number" && Number.isInteger(texture.offset) && texture.offset >= 0);
        console.assert(texture.stride === undefined || typeof texture.stride === "number" && Number.isInteger(texture.stride) && texture.stride > 0);
        console.assert(typeof texture.width === "number" && Number.isInteger(texture.width) && texture.width > 0);
        console.assert(typeof texture.height === "number" && Number.isInteger(texture.height) && texture.height > 0);
        console.assert(texture.minX === undefined || typeof texture.minX === "number" && Number.isInteger(texture.minX) && texture.minX >= 0);
        console.assert(texture.minY === undefined || typeof texture.minY === "number" && Number.isInteger(texture.minY) && texture.minY >= 0);
        console.assert(texture.maxX === undefined || typeof texture.maxX === "number" && Number.isInteger(texture.maxX) && texture.maxX > (texture.minX ?? 0));
        console.assert(texture.maxY === undefined || typeof texture.maxY === "number" && Number.isInteger(texture.maxY) && texture.maxY > (texture.minY ?? 0));
        console.assert(texture.threshold === undefined || typeof texture.threshold === "number");
        console.assert(mask === (mask & 0x7FFFFFFF) && mask !== 0);

        return new Tile(mask | 0, centerX + 0.0, centerY + 0.0, width + 0.0, height + 0.0, rotation + 0.0, texture);
    }

    /**
     * @param {int31} mask - The mask (nonzero 31-bit integer).
     * @param {number} centerX - The x-coordinate of the center.
     * @param {number} centerY - The y-coordinate of the center.
     * @param {number} width - The width (finite, positive).
     * @param {number} height - The height (finite, positive).
     * @param {number} rotation - The rotation in radians.
     * @param {{
     *     data: (number | boolean)[],
     *     offset?: number,
     *     stride?: number,
     *     width: number,
     *     height: number,
     *     minX?: number,
     *     minY?: number,
     *     maxX?: number,
     *     maxY?: number,
     *     threshold?: number
     * }} texture - The texture.
     * @private
     * @ignore
     */
    constructor(mask, centerX, centerY, width, height, rotation, texture) {
        super(mask);

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
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
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
        let scaleX = cos;
        let skewX = -sin;
        let skewY = sin;
        let scaleY = cos;
        let translationX = halfWidth - (centerX * scaleX + centerY * skewY);
        let translationY = halfHeight - (centerX * skewX + centerY * scaleY);

        scaleX *= textureScaleX;
        skewX *= textureScaleY;
        skewY *= textureScaleX;
        scaleY *= textureScaleY;
        translationX *= textureScaleX;
        translationY *= textureScaleY;
        translationX += 1.0 - textureMinX;
        translationY += 1.0 - textureMinY;

        const textureStrideX = texture.stride ?? 1;
        const textureStrideY = textureWidth * textureStrideX;
        const field = sdf(
            texture.data,
            texture.offset ?? 0,
            textureStrideX,
            textureStrideY,
            textureMinX,
            textureMinY,
            textureMaxX,
            textureMaxY,
            texture.threshold ?? Number.MIN_VALUE,
        );

        for (let i = 0, n = field.length; i < n; i++) {
            const signedDistance = field[i];

            field[i] = Math.sign(signedDistance) * max(Math.abs(signedDistance) - 1.0, 0.5);
        }

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
         * The width.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._width = (textureMaxX - textureMinX + 2) | 0;

        /**
         * The height.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._height = (textureMaxY - textureMinY + 2) | 0;

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
        this._translationX = translationX;

        /**
         * The y-translation of the matrix.
         * @type {number}
         * @readonly
         * @private
         * @ignore
         */
        this._translationY = translationY;

        /**
         * The signed distance field.
         * @type {Float64Array}
         * @readonly
         * @private
         * @ignore
         */
        this._field = field;
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
        return max(this._minX, minX) > min(this._maxX, maxX) || max(this._minY, minY) > min(this._maxY, maxY) ? -1 : 0;
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

        if (x0 < 0.0) {
            return false;
        }

        const w = this._width;

        if (x0 >= w) {
            return false;
        }

        const mb = this._skewX;
        const md = this._scaleY;
        const my = this._translationY;
        const y0 = mb * x + md * y + my;

        if (y0 < 0.0 || y0 >= this._height) {
            return false;
        }

        return this._field[(y0 | 0) * w + (x0 | 0)] < 0.0;
    }

    /**
     * @param {Cast} cast - The cast.
     * @inheritDoc
     */
    computeHits(cast) {
        const { originX, originY, directionX, directionY } = cast;
        const w = this._width;
        const h = this._height;
        const ma = this._scaleX;
        const mb = this._skewX;
        const mc = this._skewY;
        const md = this._scaleY;
        const mx = this._translationX;
        const my = this._translationY;
        let x = ma * originX + mc * originY + mx;
        let y = mb * originX + md * originY + my;
        const dx = ma * directionX + mc * directionY;
        const dy = mb * directionX + md * directionY;
        const px = 1.0 / dx;
        const py = 1.0 / dy;

        let t1 = (1.0 - x) * px;
        let t2 = (w - 1.0 - x) * px;
        let time1 = min(max(t1, 0.0), max(t2, 0.0));
        let time2 = max(min(t1, Infinity), min(t2, Infinity));

        t1 = (1.0 - y) * py;
        t2 = (h - 1.0 - y) * py;
        time1 = min(max(t1, time1), max(t2, time1));
        time2 = max(min(t1, time2), min(t2, time2));

        if (time1 <= min(time2, 1.0)) {
            const field = this._field;
            let inside = false;

            if (time1 <= 0.0) {
                time1 = 0.0;
                inside = field[(y | 0) * w + (x | 0)] < 0.0;
            }

            const invMagnitude = 1.0 / Math.sqrt(dx * dx + dy * dy);

            do {
                const signedDistance = field[(y + dy * time1 | 0) * w + (x + dx * time1 | 0)] * invMagnitude;

                if (inside !== signedDistance < 0.0) {
                    inside = !inside;

                    cast.addHit(time1, this.mask);
                }

                time1 += Math.abs(signedDistance);
            } while (time1 <= time2);

            if (inside) {
                cast.addHit(time2, this.mask);
            }
        }
    }
}

/**
 * The value representing infinity. Used by {@link edt}.
 * @type {number}
 */
const EDT_INF = 1e20;

/**
 * Generate the 2D Euclidean signed distance field.
 * @param {(number | boolean)[]} data - The elements.
 * @param {number} offset - The offset of the first element in `data`.
 * @param {number} strideX - The distance between consecutive elements in a row of `data`.
 * @param {number} strideY - The distance between consecutive elements in a column of `data`.
 * @param {number} minX - The minimum x-coordinate of the rectangle.
 * @param {number} minY - The minimum y-coordinate of the rectangle.
 * @param {number} maxX - The maximum x-coordinate of the rectangle.
 * @param {number} maxY - The maximum x-coordinate of the rectangle.
 * @param {number} threshold - The threshold that needs to be met or exceeded for a pixel to be inner.
 * @returns {Float64Array} - The signed distance field with a 1 pixel padding.
 */
function sdf(data, offset, strideX, strideY, minX, minY, maxX, maxY, threshold) {
    const width = maxX - minX + 2;
    const height = maxY - minY + 2;
    const size = width * height;
    const capacity = Math.max(width, height);
    const temp = new ArrayBuffer(8 * size + 20 * capacity + 8);
    const inner = new Float64Array(temp, 0.0, size);
    const outer = new Float64Array(size).fill(EDT_INF);

    for (let y = minY, j = width + 1; y < maxY; y++, j += 2) {
        for (let x = minX; x < maxX; x++, j++) {
            const a = data[offset + x * strideX + y * strideY];

            if (a >= threshold) {
                inner[j] = EDT_INF;
                outer[j] = 0.0;
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
