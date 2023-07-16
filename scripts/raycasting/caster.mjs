import { Hit } from "./hit.mjs";
import { max, min } from "./math.mjs";
import { Volume } from "./volume.mjs";

/**
 * The ray caster.
 */
export class Caster {
    /**
     * The x-coordinate of the current origin.
     * @type {number}
     * @readonly
     */
    originX = 0;

    /**
     * The y-coordinate of the current origin.
     * @type {number}
     * @readonly
     */
    originY = 0;

    /**
     * The z-coordinate of the current origin.
     * @type {number}
     * @readonly
     */
    originZ = 0;

    /**
     * The x-coordinate of the current target.
     * @type {number}
     * @readonly
     */
    targetX = 0;

    /**
     * The y-coordinate of the current target.
     * @type {number}
     * @readonly
     */
    targetY = 0;

    /**
     * The z-coordinate of the current target.
     * @type {number}
     * @readonly
     */
    targetZ = 0;

    /**
     * The hits.
     * @type {Hit[]}
     */
    #hits = [];

    /**
     * @param {Volume[]} volumes - The volumes.
     * @param {number} [minR] - The minimum range.
     * @param {number} [maxR] - The maximum range.
     * @param {number} [minX] - The minimum x-coordinate.
     * @param {number} [minY] - The minimum y-coordinate.
     * @param {number} [minZ] - The minimum z-coordinate.
     * @param {number} [maxX] - The maximum x-coordinate.
     * @param {number} [maxY] - The maximum y-coordinate.
     * @param {number} [maxZ] - The maximum z-coordinate.
     */
    constructor(volumes, minR, maxR, minX, minY, minZ, maxX, maxY, maxZ) {
        /**
         * The minimum range.
         * @type {number}
         * @readonly
         */
        this.minR = minR ??= 0;
        /**
         * The maximum range.
         * @type {number}
         * @readonly
         */
        this.maxR = maxR = max(maxR ?? Infinity, minR);
        /**
         * The minimum x-coordinate.
         * @type {number}
         * @readonly
         */
        this.minX = minX ??= -Infinity;
        /**
         * The minimum y-coordinate.
         * @type {number}
         * @readonly
         */
        this.minY = minY ??= -Infinity;
        /**
         * The minimum z-coordinate.
         * @type {number}
         * @readonly
         */
        this.minZ = minZ ??= -Infinity;
        /**
         * The maximum x-coordinate.
         * @type {number}
         * @readonly
         */
        this.maxX = maxX ??= +Infinity;
        /**
         * The maximum y-coordinate.
         * @type {number}
         * @readonly
         */
        this.maxY = maxY ??= +Infinity;
        /**
         * The maximum z-coordinate.
         * @type {number}
         * @readonly
         */
        this.maxZ = maxZ ??= +Infinity;
        /**
         * The volumes.
         * @type {Volume[]}
         * @readonly
         */
        this.volumes = Caster.#initializeVolumes(volumes, minX, minY, minZ, maxX, maxY, maxZ);

        this.#estimateDistances();
    }

    /**
     * Create an optimized ray caster restricted to the specified bounds.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {Caster} The new ray caster restricted to the bounds.
     */
    crop(minX, minY, minZ, maxX, maxY, maxZ) {
        minX = max(minX ?? -Infinity, this.minX);
        minY = max(minY ?? -Infinity, this.minY);
        minZ = max(minZ ?? -Infinity, this.minZ);
        maxX = min(maxX ?? +Infinity, this.maxX);
        maxY = min(maxY ?? +Infinity, this.maxY);
        maxZ = min(maxZ ?? +Infinity, this.maxZ);

        return new Caster(this.volumes.map((v) => v.clone()), this.minR, this.maxR, minX, minY, minZ, maxX, maxY, maxZ);
    }

    /**
     * Initialize this volumes given the bounding box of the ray caster.
     * Remove unnecessary volumes and identify volumes that contain the bounds of the ray caster,
     * which are marked to be skipped by the ray intersection test. Sort volumes by priority.
     * @param {Volume[]} volumes - The volumes.
     * @param {number} minX - The minimum x-coordinate.
     * @param {number} minY - The minimum y-coordinate.
     * @param {number} minZ - The minimum z-coordinate.
     * @param {number} maxX - The maximum x-coordinate.
     * @param {number} maxY - The maximum y-coordinate.
     * @param {number} maxZ - The maximum z-coordinate.
     * @returns {Volume[]}
     */
    static #initializeVolumes(volumes, minX, minY, minZ, maxX, maxY, maxZ) {
         // TODO
        for (let volumeIndex = volumes.length - 1; volumeIndex >= 0; volumeIndex--) {
            const volume = volumes[volumeIndex];

            if (!volume.initialize(minX, minY, minZ, maxX, maxY, maxZ)) {
                volumes[volumeIndex] = volumes[volumes.length - 1];
                volumes.length--;
            }
        }

        volumes.sort((v1, v2) => v1.priority - v2.priority);

        for (let volumeIndex = volumes.length - 1; volumeIndex >= 0; volumeIndex--) {
            const volume = volumes[volumeIndex];

            if (volume.envelops) {
                const operation = volume.operation;

                if (operation === 0
                    || (operation === 1 || operation === 2 || operation === 4) && volume.cost === Infinity
                    || operation === 3 && volume.cost === 0) {
                    volumes.splice(0, volumeIndex); // TODO

                    break;
                }
            }
        }

        return volumes;
    }

    /**
     * Estimate the minimum and maximum ranges that rays can travel.
     */
    #estimateDistances() {
        const maxR = this.maxR;
        let maxD = Math.min(
            maxR,
            Math.hypot(
                this.maxX - this.minX,
                this.maxY - this.minY,
                this.maxZ - this.minZ
            )
        );

        const volumes = this.volumes;

        if (maxD === 0 || volumes.length === 0) {
            this.minD = this.maxD = maxD;

            return;
        }

        let minEnergyCost = 0;
        let maxEnergyCost = 0;

        for (const volume of volumes) {
            const energyCost = volume.cost;

            if (volume.envelops) {
                switch (volume.operation) {
                    case 0:
                        minEnergyCost = maxEnergyCost = energyCost;
                        break;
                    case 1:
                        minEnergyCost += energyCost;
                        maxEnergyCost += energyCost;
                        break;
                    case 2:
                        minEnergyCost = max(minEnergyCost - energyCost, 0);
                        maxEnergyCost = max(maxEnergyCost - energyCost, 0);
                        break;
                    case 3:
                        minEnergyCost = min(minEnergyCost, energyCost);
                        maxEnergyCost = min(maxEnergyCost, energyCost);
                        break;
                    case 4:
                        minEnergyCost = max(minEnergyCost, energyCost);
                        maxEnergyCost = max(maxEnergyCost, energyCost);
                        break;
                }
            } else {
                switch (volume.operation) {
                    case 0:
                        minEnergyCost = min(minEnergyCost, energyCost);
                        maxEnergyCost = max(maxEnergyCost, energyCost);
                        break;
                    case 1:
                        maxEnergyCost += energyCost;
                        break;
                    case 2:
                        minEnergyCost = max(minEnergyCost - energyCost, 0);
                        break;
                    case 3:
                        minEnergyCost = min(minEnergyCost, energyCost);
                        break;
                    case 4:
                        maxEnergyCost = max(maxEnergyCost, energyCost);
                        break;
                }
            }
        }

        /**
         * The maximum distance a ray can travel.
         * @type {number}
         * @readonly
         */
        this.maxD = maxD = min(this.minR + 1 / minEnergyCost, maxD);
        /**
         * The minimum distance a ray can travel.
         * @type {number}
         * @readonly
         */
        this.minD = min(this.minR + 1 / maxEnergyCost, maxD);
    }

    /**
     * Set the origin for the next ray casts.
     * @param {number} originX - The x-coordinate of the origin.
     * @param {number} originY - The y-coordinate of the origin.
     * @param {number} originZ - The z-coordinate of the origin.
     * @returns {this}
     */
    setOrigin(originX, originY, originZ) {
        this.originX = Math.round(originX * 256) / 256;
        this.originY = Math.round(originY * 256) / 256;
        this.originZ = Math.round(originZ * 256) / 256;

        return this;
    }

    /**
     * Set the target for the next ray casts.
     * @param {number} targetX - The x-coordinate of the target.
     * @param {number} targetY - The y-coordinate of the target.
     * @param {number} targetZ - The z-coordinate of the target.
     * @returns {this}
     */
    setTarget(targetX, targetY, targetZ) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.targetZ = targetZ;

        return this;
    }

    /** @type {number} */
    #originX = 0;

    /** @type {number} */
    #originY = 0;

    /** @type {number} */
    #originZ = 0;

    /** @type {number} */
    #velocityX = 0;

    /** @type {number} */
    #velocityY = 0;

    /** @type {number} */
    #velocityZ = 0;

    /** @type {number} */
    #targetDistance = 0;

    /**
     * Cast a ray from the origin to the target point.
     * @returns {this}
     */
    castRay() {
        const originX = this.#originX = this.originX;
        const originY = this.#originY = this.originY;
        const originZ = this.#originZ = this.originZ;
        const targetX = this.targetX;
        const targetY = this.targetY;
        const targetZ = this.targetZ;
        const velocityX = this.#velocityX = Math.trunc((targetX - originX) * 256) / 256;
        const velocityY = this.#velocityY = Math.trunc((targetY - originY) * 256) / 256;
        const velocityZ = this.#velocityZ = Math.trunc((targetZ - originZ) * 256) / 256;

        this.#targetDistance = Math.sqrt(
            velocityX * velocityX +
            velocityY * velocityY +
            velocityZ * velocityZ
        );

        this.#targetHit = undefined;
        this.#elapsedTime = undefined;
        this.#distanceTravelled = undefined;
        this.#remainingEnergy = undefined;
        this.#destinationX = undefined;
        this.#destinationY = undefined;
        this.#destinationZ = undefined;

        return this;
    }

    /**
     * Cast a ray from the origin to the target point.
     * @param {boolean} computeElapsedTime - Compute the elapsed time of the ray.
     * @param {boolean} computeRemainingEnergy - Compute the remaining energy of the ray.
     */
    #castRay(computeElapsedTime, computeRemainingEnergy) {
        const targetDistance = this.#targetDistance;

        if (targetDistance <= this.minD) {
            this.#targetHit = true;
            this.#elapsedTime = 1;
            this.#distanceTravelled = targetDistance;

            if (targetDistance <= this.minR) {
                this.#remainingEnergy = 1;

                return;
            }

            if (!computeRemainingEnergy) {
                return;
            }
        }

        if (!computeElapsedTime && targetDistance > this.maxD) {
            this.#targetHit = false;
            this.#remainingEnergy = 0;

            return;
        }

        this.#initializeHits(targetDistance);

        const originX = this.#originX;
        const originY = this.#originY;
        const originZ = this.#originZ;
        const velocityX = this.#velocityX;
        const velocityY = this.#velocityY;
        const velocityZ = this.#velocityZ;

        this.#computeHits(originX, originY, originZ, velocityX, velocityY, velocityZ);
        this.#heapifyHits();

        const volumes = this.volumes;
        let travelStage = 0;
        let currentTime = 0;
        let currentEnergyCost = 0;
        let remainingEnergy = 1 / targetDistance;
        const almostZeroEnergy = remainingEnergy * 1e-12;

        for (let hit; hit = this.#nextHit();) {
            const hitTime = hit.time;
            const hitVolumeIndex = hit.volumeIndex;

            if (hitVolumeIndex >= 0) {
                const hitVolume = volumes[hitVolumeIndex];
                const hitBoundary = hitVolume.boundaries[hit.boundaryIndex];
                const hitBoundaryState = hitBoundary.state;

                if ((hitBoundary.state ^= hit.boundaryMask) !== 0 && hitBoundaryState !== 0) {
                    continue;
                }

                const hitVolumeState = hitVolume.state;

                if ((hitVolume.state ^= hitBoundary.mask) !== 0 && hitVolumeState !== 0) {
                    continue;
                }
            } else {
                travelStage++;
            }

            const deltaTime = hitTime - currentTime;
            const requiredEnergy = deltaTime > 0 ? deltaTime * min(currentEnergyCost, 256) : 0;

            if (remainingEnergy <= requiredEnergy) {
                this.#hits.length = 0;

                break;
            }

            currentTime = hitTime;
            currentEnergyCost = this.#calculateEnergyCost(travelStage);
            remainingEnergy -= requiredEnergy;

            if (remainingEnergy <= almostZeroEnergy) {
                remainingEnergy = 0;
                this.#hits.length = 0;

                break;
            }
        }

        if (currentEnergyCost !== 0) {
            const requiredEnergy = currentTime < 1 ? (1 - currentTime) * currentEnergyCost : 0;

            currentTime = min(currentTime + remainingEnergy / currentEnergyCost, 1);
            remainingEnergy -= requiredEnergy;

            if (remainingEnergy <= almostZeroEnergy) {
                remainingEnergy = 0;
            }
        } else if (remainingEnergy !== 0) {
            currentTime = 1;
        }

        if (currentTime * targetDistance > targetDistance - 0.5 / 256) { // TODO
            currentTime = 1;
        }

        this.#targetHit = currentTime === 1;
        this.#elapsedTime = currentTime;
        this.#remainingEnergy = min(remainingEnergy * targetDistance, 1);
    }

    /** @type {boolean|undefined} */
    #targetHit;

    /**
     * Did the ray hit the target?
     * @type {boolean}
     * @readonly
     */
    get targetHit() {
        if (this.#targetHit === undefined) {
            this.#castRay(false, false);
        }

        return this.#targetHit;
    }

    /** @type {number|undefined} */
    #elapsedTime;

    /**
     * The time that elapsed before the ray reached its destination.
     * @type {number}
     * @readonly
     */
    get elapsedTime() {
        if (this.#elapsedTime === undefined) {
            this.#castRay(true, false);
        }

        return this.#elapsedTime;
    }

    /** @type {number|undefined} */
    #distanceTravelled;

    /**
     * The distance that the ray travelled before it reached its destination.
     * @type {number}
     * @readonly
     */
    get distanceTravelled() {
        return this.#distanceTravelled ??= this.elapsedTime * Math.hypot(
            this.targetX - this.originX,
            this.targetY - this.originY,
            this.targetZ - this.originZ
        );
    }

    /** @type {number|undefined} */
    #remainingEnergy;

    /**
     * The remaining energy of the ray when it reached its destination.
     * @type {number}
     * @readonly
     */
    get remainingEnergy() {
        if (this.#remainingEnergy === undefined) {
            this.#castRay(false, true);
        }

        return this.#remainingEnergy;
    }

    #computeDestination() {
        const originX = this.originX;
        const originY = this.originY;
        const originZ = this.originZ;
        const targetX = this.targetX;
        const targetY = this.targetY;
        const targetZ = this.targetZ;
        const velocityX = targetX - originX;
        const velocityY = targetY - originY;
        const velocityZ = targetZ - originZ;
        const elapsedTime = this.elapsedTime;

        this.#destinationX = originX + velocityX * elapsedTime;
        this.#destinationY = originY + velocityY * elapsedTime;
        this.#destinationZ = originZ + velocityZ * elapsedTime;
    }

    /** @type {number|undefined} */
    #destinationX;

    /**
     * The x-coordinate of the destination of the curreny ray.
     * @type {number}
     * @readonly
     */
    get destinationX() {
        if (this.#destinationX === undefined) {
            this.#computeDestination();
        }

        return this.#destinationX;
    }

    /** @type {number|undefined} */
    #destinationY;

    /**
     * The y-coordinate of the destination of the curreny ray.
     * @type {number}
     * @readonly
     */
    get destinationY() {
        if (this.#destinationY === undefined) {
            this.#computeDestination();
        }

        return this.#destinationY;
    }

    /** @type {number|undefined} */
    #destinationZ;

    /**
     * The z-coordinate of the destination of the curreny ray.
     * @type {number}
     * @readonly
     */
    get destinationZ() {
        if (this.#destinationZ === undefined) {
            this.#computeDestination();
        }

        return this.#destinationZ;
    }

    /**
     * Initialize the hits.
     * @param {number} targetDistance - The distance from the origin of the ray to the target.
     */
    #initializeHits(targetDistance) {
        if (this.minR < targetDistance) {
            this.#hits.push(new Hit(this.minR / targetDistance, -1, -1, 0));
        }

        if (this.maxR < targetDistance) {
            this.#hits.push(new Hit(this.maxR / targetDistance, -1, -1, 0));
        }
    }

    /**
     * Compute the hits of all volumes with the ray.
     * @param {number} originX - The x-origin of the ray.
     * @param {number} originY - The y-origin of the ray.
     * @param {number} originZ - The z-origin of the ray.
     * @param {number} velocityX - The x-velocity of the ray.
     * @param {number} velocityY - The y-velocity of the ray.
     * @param {number} velocityZ - The z-velocity of the ray.
     */
    #computeHits(originX, originY, originZ, velocityX, velocityY, velocityZ) {
        const volumes = this.volumes;
        const numVolumes = volumes.length;
        const hitQueue = this.#hits;

        for (let volumeIndex = 0; volumeIndex < numVolumes; volumeIndex++) {
            const volume = volumes[volumeIndex];

            if (volume.envelops) {
                continue;
            }

            volume.computeHits(originX, originY, originZ, velocityX, velocityY, velocityZ, hitQueue, volumeIndex);
        }
    }

    /**
     * Heapify hits.
     */
    #heapifyHits() {
        const hits = this.#hits;

        for (let i = hits.length >> 1; i--;) {
            this.#siftDownHit(hits[i], i);
        }
    }

    /**
     * Get the next this that needs to be processed.
     * @returns {Hit} The next hit.
     */
    #nextHit() {
        const hits = this.#hits;
        const numHits = hits.length;

        if (!numHits) {
            return;
        }

        const nextHit = hits[0];
        const lastHit = hits.pop();

        if (numHits > 1) {
            this.#siftDownHit(lastHit, 0);
        }

        return nextHit;
    }

    /**
     * Sift down the hit.
     * @param {Hit} hit - The hit.
     * @param {number} i - The current index of the hit.
     * @returns {number} The new index of the hit.
     */
    #siftDownHit(hit, i) {
        const hits = this.#hits;
        const numHits = hits.length;

        for (; ;) {
            const r = i + 1 << 1;
            const l = r - 1;
            let j = i;
            let h = hit
            let tmp;

            if (l < numHits && (tmp = hits[l]).time < h.time) {
                j = l;
                h = tmp;
            }

            if (r < numHits && (tmp = hits[r]).time < h.time) {
                j = r;
                h = tmp;
            }

            if (j === i) {
                break;
            }

            hits[i] = h;
            i = j;
        }

        hits[i] = hit;

        return i;
    }

    /**
     * Compute the current energy cost based on the active senses.
     * @param {number} travelStage - The travel stage: 0 for <=minR, 1 for >minR and <=maxR, 2 otherwise.
     * @returns {number} The current energy cost.
     */
    #calculateEnergyCost(travelStage) {
        if (travelStage === 0) {
            return 0;
        }

        if (travelStage === 2) {
            return Infinity;
        }

        let computedEnergyCost = 0;
        const volumes = this.volumes;

        for (let volumeIndex = 0, numVolumes = volumes.length; volumeIndex < numVolumes; volumeIndex++) {
            const volume = volumes[volumeIndex];

            if (volume.state !== 0) {
                continue;
            }

            const energyCost = volume.cost;

            switch (volume.operation) {
                case 0: computedEnergyCost = energyCost; break;
                case 1: computedEnergyCost += energyCost; break;
                case 2: computedEnergyCost = max(computedEnergyCost - energyCost, 0); break;
                case 3: computedEnergyCost = min(computedEnergyCost, energyCost); break;
                case 4: computedEnergyCost = max(computedEnergyCost, energyCost); break;
            }
        }

        return computedEnergyCost;
    }
}
