/**
 * @import { int32 } from "./_types.mjs";
 * @import Boundary from "./boundary.mjs";
 * @import Geometry from "./geometry.mjs";
 */

/**
 * @sealed
 * @hideconstructor
 */
export default class Hit {
    /**
     * The geometry that was hit.
     * @type {Geometry | null}
     * @readonly
     */
    geometry = null;

    /**
     * The boundary that was hit.
     * @type {Boundary | null}
     * @readonly
     */
    boundary = null;

    /**
     * The time the ray hits the boundary of the geometry.
     * @type {number}
     * @readonly
     */
    time = 0.0;

    /**
     * The bit mask indicating which part of the boundary were hit (32-bit).
     * @type {int32}
     * @readonly
     */
    mask = 0;
}
