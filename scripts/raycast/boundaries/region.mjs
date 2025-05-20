import Boundary from "../boundary.mjs";
import { max, min } from "../math.mjs";
import Shape from "../shape.mjs";
import Universe from "./universe.mjs";

/**
 * @import { int32 } from "../_types.mjs";
 * @import Cast from "../cast.mjs";
 */

/**
 * @sealed
 */
export default class Region extends Boundary {
    /**
     * @param {object} args
     * @param {Shape[]} args.shapes - The shapes (nonempty).
     * @param {number} [args.bottom=-Infinity] - The bottom (minimum z-coordinate).
     * @param {number} [args.top=Infinity] - The top (maximum z-coordinate).
     * @param {int32} [args.mask=-1] - The bit mask (nonzero 32-bit).
     * @param {int32} [args.state=-1] - The bit state (32-bit).
     * @returns {Region} The region.
     */
    static create({ shapes, bottom = -Infinity, top = Infinity, mask = -1, state = -1 }) {
        console.assert(Array.isArray(shapes));
        console.assert(shapes.every((shape) => shape instanceof Shape && shape.mask !== 0));
        console.assert(shapes.length !== 0);
        console.assert(typeof bottom === "number");
        console.assert(typeof top === "number");
        console.assert(bottom <= top);
        console.assert(mask === (mask | 0) && mask !== 0);
        console.assert(state === (state | 0));

        return new Region(shapes.toSorted(compareShapesByType), bottom + 0.0, top + 0.0, mask | 0, state | 0);
    }

    /**
     * @param {Shape[]} shapes - The shapes (nonempty).
     * @param {number} bottom - The bottom (minimum z-coordinate).
     * @param {number} top - The top (maximum z-coordinate).
     * @param {int32} mask - The bit mask (nonzero 32-bit integer).
     * @param {int32} state - The bit state (32-bit integer).
     * @private
     * @ignore
     */
    constructor(shapes, bottom, top, mask, state) {
        super(mask, state);

        /**
         * The shapes.
         * @type {ReadonlyArray<Shape>}
         * @readonly
         */
        this.shapes = shapes;

        /**
         * The bottom (minimum z-coordinate).
         * @type {number}
         * @readonly
         */
        this.bottom = bottom;

        /**
         * The top (maximum z-coordinate).
         * @type {number}
         * @readonly
         */
        this.top = top;
    }

    /** @inheritDoc */
    get isUnbounded() {
        return this.state === 0 && this.shapes.length === 0;
    }

    /**
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {Boundary} The cropped boundary.
     * @inheritDoc
     */
    crop(minX, minY, minZ, maxX, maxY, maxZ) {
        if (max(this.bottom, minZ) > min(this.top, maxZ)) {
            return Universe.EMPTY;
        }

        const shapes = this.shapes;
        const numShapes = shapes.length;
        let croppedState = this.state;

        for (let shapeIndex = 0; shapeIndex < numShapes; shapeIndex++) {
            const shape = shapes[shapeIndex];
            const result = shape.testBounds(minX, minY, maxX, maxY);

            if (result < 0) {
                continue;
            }

            if (result > 0) {
                croppedState ^= shape.mask;

                continue;
            }

            CROPPED_SHAPES.push(shape);
        }

        if (CROPPED_SHAPES.length === numShapes) {
            CROPPED_SHAPES.length = 0;

            return this;
        }

        const { bottom, top } = this;

        if (CROPPED_SHAPES.length === 0) {
            if (bottom <= minZ && maxZ <= top) {
                croppedState ^= 1 << 31;
            }

            return croppedState === 0 ? Universe.get(this.mask) : Universe.EMPTY;
        }

        const croppedShapes = CROPPED_SHAPES.slice(0);

        CROPPED_SHAPES.length = 0;

        return new Region(croppedShapes, bottom, top, this.mask, croppedState);
    }

    /**
     * @param {Cast} cast - The cast.
     * @inheritDoc
     */
    computeHits(cast) {
        const { originZ, invDirectionZ } = cast;

        if (invDirectionZ !== Infinity) {
            const time1 = (this.bottom - originZ) * invDirectionZ;

            if (time1 > 0.0) {
                cast.addHit(time1, 1 << 31);
            }

            const time2 = (this.top - originZ) * invDirectionZ;

            if (time2 > 0.0) {
                cast.addHit(time2, 1 << 31);
            }
        } else if (this.bottom <= originZ && originZ <= this.top) {
            cast.addHit(Infinity, 1 << 31);
        }

        const shapes = this.shapes;
        const numShapes = shapes.length;
        const { directionX, directionY } = cast;

        if (directionX !== 0.0 || directionY !== 0.0) {
            for (let shapeIndex = 0; shapeIndex < numShapes; shapeIndex++) {
                const shape = shapes[shapeIndex];

                shape.computeHits(cast);
            }
        } else {
            const { originX, originY } = cast;

            for (let shapeIndex = 0; shapeIndex < numShapes; shapeIndex++) {
                const shape = shapes[shapeIndex];

                if (shape.containsPoint(originX, originY)) {
                    cast.addHit(Infinity, shape.mask);
                }
            }
        }
    }
}

/**
 * The array for cropped shapes.
 * @type {Shape[]}
 */
const CROPPED_SHAPES = [];

/**
 * The shape type to ID map.
 * @type {Map<typeof Shape, int32>}
 */
const SHAPE_TYPE_IDS = new Map();

/**
 * Get the ID of the shape's type.
 * @param {Shape} shape - The shape.
 * @returns {int32} The shape type ID.
 */
function getShapeTypeID(shape) {
    const shapeType = shape.constructor;
    let id = SHAPE_TYPE_IDS.get(shapeType);

    if (id === undefined) {
        id = SHAPE_TYPE_IDS.size;
        SHAPE_TYPE_IDS.set(shapeType, id);
    }

    return id;
}

/**
 * Compare two shapes by type.
 * @param {Shape} shape1 - The first shape.
 * @param {Shape} shape2 - The second shape.
 * @returns {number}
 */
function compareShapesByType(shape1, shape2) {
    return getShapeTypeID(shape1) - getShapeTypeID(shape2);
}
