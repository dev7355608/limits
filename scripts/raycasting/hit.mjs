/**
 * The hit of a ray with a volume.
 */
export class Hit {
    /**
     * @param {number} time - The time the ray hits the volume.
     * @param {number} volumeIndex - The index of the volume that was hit.
     * @param {number} boundaryIndex - The index of the boundary that was hit.
     * @param {number} boundaryMask - The bit mask indicating which part of the boundary were hit.
     */
    constructor(time, volumeIndex, boundaryIndex, boundaryMask) {
        /**
         * The time the ray hits the volume.
         * @type {number}
         * @readonly
         */
        this.time = time;
        /**
         * The index of the volume that was hit.
         * @type {number}
         * @readonly
         */
        this.volumeIndex = volumeIndex;
        /**
         * The index of the boundary that was hit.
         * @type {number}
         * @readonly
         */
        this.boundaryIndex = boundaryIndex;
        /**
         * The bit mask indicating which part of the boundary were hit.
         * @type {number}
         * @readonly
         */
        this.boundaryMask = boundaryMask;
    }
}
