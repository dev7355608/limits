import { max, min } from "./math.mjs";
import Volume from "./volume.mjs";

/**
 * @import Geometry from "./geometry.mjs";
 */

/**
 * @sealed
 */
export default class Space {
    /**
     * An empty space.
     * @type {Space}
     * @readonly
     */
    static EMPTY = new Space([]);

    /**
     * @param {object} args
     * @param {Volume[]} args.volumes - The volumes.
     * @param {number} [args.minX=-Infinity] - The minimum x-coordinate.
     * @param {number} [args.minY=-Infinity] - The minimum y-coordinate.
     * @param {number} [args.minZ=-Infinity] - The minimum z-coordinate.
     * @param {number} [args.maxX=Infinity] - The maximum x-coordinate.
     * @param {number} [args.maxY=Infinity] - The maximum y-coordinate.
     * @param {number} [args.maxZ=Infinity] - The maximum z-coordinate.
     * @returns {Space} The space.
     */
    static create({ volumes, minX = -Infinity, minY = -Infinity, minZ = -Infinity, maxX = Infinity, maxY = Infinity, maxZ = Infinity }) {
        console.assert(Array.isArray(volumes));
        console.assert(volumes.every((volume) => volume instanceof Volume));
        console.assert(typeof minX === "number");
        console.assert(typeof minY === "number");
        console.assert(typeof minZ === "number");
        console.assert(typeof maxX === "number");
        console.assert(typeof maxY === "number");
        console.assert(typeof maxZ === "number");
        console.assert(minX <= maxX);
        console.assert(minY <= maxY);
        console.assert(minZ <= maxZ);

        return new Space(initializeVolumes(volumes.toSorted(compareVolumesByPriority), minX, minY, minZ, maxX, maxY, maxZ));
    }

    /**
     * @param {Volume[]} volumes - The volumes.
     * @private
     * @ignore
     */
    constructor(volumes) {
        const [minCost, maxCost] = calculateCostEstimates(volumes);

        /**
         * The volumes.
         * @type {ReadonlyArray<Volume>}
         * @readonly
         */
        this.volumes = volumes;

        /**
         * The estimated minimum energy cost anywhere in the space.
         * @type {number}
         * @readonly
         */
        this.minCost = minCost;

        /**
         * The estimated maximum energy cost anywhere in the space.
         * @type {number}
         * @readonly
         */
        this.maxCost = maxCost;

        /**
         * The estimated minimum distance a ray can travel anywhere in the space.
         * @type {number}
         * @readonly
         */
        this.minDistance = 1.0 / maxCost;

        /**
         * The estimated maximum distance a ray can travel anywhere in the space.
         * @type {number}
         * @readonly
         */
        this.maxDistance = 1.0 / minCost;
    }

    /**
     * Crop the space w.r.t. the given bounding box.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {Space} The cropped space.
     */
    crop(minX, minY, minZ, maxX, maxY, maxZ) {
        const volumes = initializeVolumes(this.volumes, minX, minY, minZ, maxX, maxY, maxZ);

        if (volumes.length === 0) {
            return Space.EMPTY;
        }

        if (volumes === this.volumes) {
            return this;
        }

        return new Space(volumes);
    }
}

/**
 * The array for cropped volumes.
 * @type {Volume[]}
 */
const CROPPED_VOLUMES = [];

/**
 * The array for cropped geometries.
 * @type {Geometry[]}
 */
const CROPPED_GEOMETRIES = [];

/**
 * Compare two volumes by priority.
 * @param {Volume} volume1 - The first volume.
 * @param {Volume} volume2 - The second volume.
 * @returns {number}
 */
function compareVolumesByPriority(volume1, volume2) {
    return volume1.priority - volume2.priority || volume1.geometry._id - volume2.geometry._id;
}

/**
 * Initialize this volumes by cropping them to the given the bounding box of the space.
 * Discard unnecessary volumes and identify volumes that envelop the bounding box of the space,
 * which are marked to be skipped by the ray intersection test.
 * @param {Volume[]} volumes - The volumes.
 * @param {number} minX - The minimum x-coordinate.
 * @param {number} minY - The minimum y-coordinate.
 * @param {number} minZ - The minimum z-coordinate.
 * @param {number} maxX - The maximum x-coordinate.
 * @param {number} maxY - The maximum y-coordinate.
 * @param {number} maxZ - The maximum z-coordinate.
 * @returns {Volume[]} The cropped volumes that haven't been discarded.
 */
function initializeVolumes(volumes, minX, minY, minZ, maxX, maxY, maxZ) {
    const numVolumes = volumes.length;

    for (let volumeIndex = 0; volumeIndex < numVolumes; volumeIndex++) {
        const volume = volumes[volumeIndex];

        volume.geometry._castId = 0;
    }

    for (let volumeIndex = 0; volumeIndex < numVolumes; volumeIndex++) {
        const volume = volumes[volumeIndex];

        switch (volume.mode) {
            case 0:
                if (volume.cost === 0.0) {
                    continue;
                }

                break;
            case 1:
                if (volume.cost === Infinity) {
                    continue;
                }

                break;
            case 2:
                if (volume.cost === 0.0) {
                    continue;
                }

                break;
        }

        const geometry = volume.geometry;
        let croppedGeometry;

        if (geometry._castId === 0) {
            croppedGeometry = geometry.crop(minX, minY, minZ, maxX, maxY, maxZ);
            geometry._castId = ~CROPPED_VOLUMES.length;
            CROPPED_GEOMETRIES.push(croppedGeometry);
        } else {
            croppedGeometry = CROPPED_GEOMETRIES[~geometry._castId];
        }

        if (croppedGeometry.isEmpty) {
            continue;
        }

        const croppedVolume = croppedGeometry === geometry ? volume : new Volume(croppedGeometry, volume.priority, volume.mode, volume.cost);

        CROPPED_VOLUMES.push(croppedVolume);
    }

    CROPPED_GEOMETRIES.length = 0;

    if (CROPPED_VOLUMES.length === volumes.length) {
        let cropped = false;

        for (let volumeIndex = 0; volumeIndex < numVolumes; volumeIndex++) {
            if (CROPPED_VOLUMES[volumeIndex] !== volumes[volumeIndex]) {
                cropped = true;

                break;
            }

            if (!cropped) {
                CROPPED_VOLUMES.length = 0;

                return volumes;
            }
        }
    }

    for (let volumeIndex = CROPPED_VOLUMES.length - 1; volumeIndex >= 0; volumeIndex--) {
        const croppedVolume = CROPPED_VOLUMES[volumeIndex];

        if (!croppedVolume.geometry.isUnbounded) {
            continue;
        }

        const mode = croppedVolume.mode;

        if (mode === 0) {
            if (!Number.isFinite(croppedVolume.cost)) {
                const croppedVolumes = CROPPED_VOLUMES.slice(0, volumeIndex + (croppedVolume.cost <= 0 ? 1 : 0));

                CROPPED_VOLUMES.length = 0;

                return croppedVolumes;
            }
        } else if (mode === 1) {
            if (croppedVolume.cost === 0.0) {
                const croppedVolumes = CROPPED_VOLUMES.slice(volumeIndex + 1);

                CROPPED_VOLUMES.length = 0;

                return croppedVolumes;
            }
        } else if (mode === 2) {
            if (croppedVolume.cost === Infinity) {
                const croppedVolumes = CROPPED_VOLUMES.slice(volumeIndex);

                CROPPED_VOLUMES.length = 0;

                return croppedVolumes;
            }
        } else if (mode === 3) {
            const croppedVolumes = CROPPED_VOLUMES.slice(volumeIndex + (croppedVolume.cost === 0.0 ? 1 : 0));

            CROPPED_VOLUMES.length = 0;

            return croppedVolumes;
        }
    }

    const croppedVolumes = CROPPED_VOLUMES.slice(0);

    CROPPED_VOLUMES.length = 0;

    return croppedVolumes;
}

/**
 * Estimate the minimum and maximum energy cost and distance travelled anywhere in the space.
 * @param {Volume[]} volumes - The volumes.
 * @returns {[minCost: number, maxCost: number]} The estimates of the minimum and maximum cost.
 */
function calculateCostEstimates(volumes) {
    let minCost = 0.0;
    let maxCost = 0.0;
    const numVolumes = volumes.length;

    for (let volumeIndex = 0; volumeIndex < numVolumes; volumeIndex++) {
        const volume = volumes[volumeIndex];
        const cost = volume.cost;

        if (volume.geometry.isUnbounded) {
            switch (volume.mode) {
                case 0:
                    minCost = max(minCost + cost, 0.0);
                    maxCost = max(maxCost + cost, 0.0);

                    break;
                case 1:
                    minCost = min(minCost, cost);
                    maxCost = min(maxCost, cost);

                    break;
                case 2:
                    minCost = max(minCost, cost);
                    maxCost = max(maxCost, cost);

                    break;
                case 3:
                    minCost = maxCost = cost;

                    break;
            }
        } else {
            switch (volume.mode) {
                case 0:
                    if (cost >= 0.0) {
                        maxCost += cost;
                    } else {
                        minCost = max(minCost + cost, 0.0);
                    }

                    break;
                case 1:
                    minCost = min(minCost, cost);

                    break;
                case 2:
                    maxCost = max(maxCost, cost);

                    break;
                case 3:
                    minCost = min(minCost, cost);
                    maxCost = max(maxCost, cost);

                    break;
            }
        }
    }

    return [minCost, maxCost];
}
