import Cast from "./cast.mjs";
import { max, min } from "./math.mjs";
import Space from "./space.mjs";

/**
 * @import { int32 } from  "./_types.mjs";
 */

/**
 * @sealed
 * @hideconstructor
 */
export default class Ray {
    /**
     * @returns {Ray}
     */
    static create() {
        return new Ray();
    }

    /**
     * The space.
     * @type {Space}
     * @readonly
     */
    space = Space.EMPTY;

    /**
     * The minimum range.
     * @type {number}
     * @readonly
     */
    minRange = 0.0;

    /**
     * The maximum range.
     * @type {number}
     * @readonly
     */
    maxRange = Infinity;

    /**
     * The x-coordinate of the current origin.
     * @type {number}
     * @readonly
     */
    originX = 0.0;

    /**
     * The y-coordinate of the current origin.
     * @type {number}
     * @readonly
     */
    originY = 0.0;

    /**
     * The z-coordinate of the current origin.
     * @type {number}
     * @readonly
     */
    originZ = 0.0;

    /**
     * The x-coordinate of the current target.
     * @type {number}
     * @readonly
     */
    targetX = 0.0;

    /**
     * The y-coordinate of the current target.
     * @type {number}
     * @readonly
     */
    targetY = 0.0;

    /**
     * The z-coordinate of the current target.
     * @type {number}
     * @readonly
     */
    targetZ = 0.0;

    /**
     * The x-coordinate of the direction of the ray.
     * @type {number}
     */
    get directionX() {
        return this.targetX - this.originX;
    }

    /**
     * The y-coordinate of the direction of the ray.
     * @type {number}
     */
    get directionY() {
        return this.targetY - this.originY;
    }

    /**
     * The z-coordinate of the direction of the ray.
     * @type {number}
     */
    get directionZ() {
        return this.targetZ - this.originZ;
    }

    /**
     * The distance from the origin to the target.
     * @type {number}
     */
    get targetDistance() {
        let targetDistance = this._targetDistance;

        if (targetDistance < 0.0) {
            targetDistance = this._targetDistance = Math.hypot(this.directionX, this.directionY, this.directionZ);
        }

        return targetDistance;
    }

    /**
     * @type {number}
     * @private
     * @ignore
     */
    _targetDistance = 0.0;

    /**
     * Did the ray hit the target?
     * @type {boolean}
     */
    get targetHit() {
        if (this._targetHit === 0) {
            this._cast(false, false);
        }

        return this._targetHit > 0;
    }

    /**
     * @type {-1|0|1}
     * @private
     * @ignore
     */
    _targetHit = 0;

    /**
     * The time that elapsed before the ray reached its destination.
     * @type {number}
     */
    get elapsedTime() {
        if (this._elapsedTime < 0.0) {
            this._cast(true, false);
        }

        return this._elapsedTime;
    }

    /**
     * @type {number}
     * @private
     * @ignore
     */
    _elapsedTime = -1.0;

    /**
     * The remaining energy of the ray when it reached its destination.
     * @type {number}
     */
    get remainingEnergy() {
        if (this._remainingEnergy < 0.0) {
            this._cast(false, true);
        }

        return this._remainingEnergy;
    }

    /**
     * @type {number}
     * @private
     * @ignore
     */
    _remainingEnergy = -1.0;

    /**
     * The distance that the ray travelled before it reached its destination.
     * @type {number}
     */
    get distanceTravelled() {
        return this.targetDistance * this.elapsedTime;
    }

    /**
     * The x-coordinate of the destination of the curreny ray.
     * @type {number}
     */
    get destinationX() {
        return this.originX + this.directionX * this.elapsedTime;
    }

    /**
     * The y-coordinate of the destination of the curreny ray.
     * @type {number}
     */
    get destinationY() {
        return this.originY + this.directionY * this.elapsedTime;
    }

    /**
     * The z-coordinate of the destination of the curreny ray.
     * @type {number}
     */
    get destinationZ() {
        return this.originZ + this.directionZ * this.elapsedTime;
    }

    /**
     * Set the space of the ray.
     * @param {Space} space - The space.
     * @returns {this}
     */
    setSpace(space) {
        if (this.space !== space) {
            this.space = space;

            this._targetDistance = -1.0;
            this._targetHit = 0;
            this._elapsedTime = -1.0;
            this._remainingEnergy = -1.0;
        }

        return this;
    }

    /**
     * Set the ranges of the ray.
     * @param {number} minRange - The minimum range within no energy is consumed.
     * @param {number} maxRange - The maximum range that the ray can travel.
     * @returns {this}
     */
    setRange(minRange, maxRange) {
        this.minRange = minRange;
        this.maxRange = max(maxRange, minRange);

        this._targetDistance = -1.0;
        this._targetHit = 0;
        this._elapsedTime = -1.0;
        this._remainingEnergy = -1.0;

        return this;
    }

    /**
     * Set the origin for the ray.
     * @param {number} originX - The x-coordinate of the origin.
     * @param {number} originY - The y-coordinate of the origin.
     * @param {number} originZ - The z-coordinate of the origin.
     * @returns {this}
     */
    setOrigin(originX, originY, originZ) {
        this.originX = originX;
        this.originY = originY;
        this.originZ = originZ;

        this._targetDistance = -1.0;
        this._targetHit = 0;
        this._elapsedTime = -1.0;
        this._remainingEnergy = -1.0;

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

        this._targetDistance = -1.0;
        this._targetHit = 0;
        this._elapsedTime = -1.0;
        this._remainingEnergy = -1.0;

        return this;
    }

    /**
     * Reset the ray.
     */
    reset() {
        this.space = Space.EMPTY;
        this.minRange = 0.0;
        this.maxRange = Infinity;
        this.targetX = 0.0;
        this.targetY = 0.0;
        this.targetZ = 0.0;
        this.originX = 0.0;
        this.originY = 0.0;
        this.originZ = 0.0;

        this._targetDistance = -1.0;
        this._targetHit = 0;
        this._elapsedTime = -1.0;
        this._remainingEnergy = -1.0;
    }

    /**
     * Cast the ray from the origin to the target point.
     * @param {boolean} computeElapsedTime - Compute the elapsed time of the ray.
     * @param {boolean} computeRemainingEnergy - Compute the remaining energy of the ray.
     * @private
     * @ignore
     */
    _cast(computeElapsedTime, computeRemainingEnergy) {
        const { space, minRange, targetDistance } = this;

        if (targetDistance - minRange < space.minDistance + 0.5 / 256.0) {
            this._targetHit = 1;
            this._elapsedTime = 1.0;

            if (targetDistance <= minRange) {
                this._remainingEnergy = 1.0;

                return;
            }

            if (!computeRemainingEnergy) {
                return;
            }
        }

        if (!computeElapsedTime && targetDistance > space.maxDistance + 0.5 / 256.0) {
            this._targetHit = -1;
            this._remainingEnergy = 0.0;

            return;
        }

        CAST.computeHits(this);

        let stage = 0;
        let currentTime = 0.0;
        let currentCost = 0.0;
        let remainingEnergy = 1.0 / targetDistance;
        const almostZeroEnergy = remainingEnergy * 1e-12;

        for (; ;) {
            const hit = CAST.nextHit();

            if (!hit) {
                break;
            }

            const hitGeometry = hit.geometry;

            if (hitGeometry) {
                const hitBoundary = hit.boundary;
                const hitBoundaryState = hitBoundary._state;

                if ((hitBoundary._state = hitBoundaryState ^ hit.mask) !== 0 && hitBoundaryState !== 0) {
                    continue;
                }

                const hitGeometryState = hitGeometry._state;

                if ((hitGeometry._state = hitGeometryState ^ hitBoundary.mask) !== 0 && hitGeometryState !== 0) {
                    continue;
                }
            } else {
                stage++;
            }

            const hitTime = hit.time;
            const deltaTime = hitTime - currentTime;
            const requiredEnergy = deltaTime > 0.0 ? deltaTime * min(currentCost, 256.0) : 0.0;

            if (remainingEnergy <= requiredEnergy) {
                break;
            }

            remainingEnergy -= requiredEnergy;

            currentTime = hitTime;

            if (stage === 0) {
                currentCost = 0.0;
            } else if (stage === 1) {
                currentCost = calculateCost(this.space);
            } else {
                currentCost = 0.0;

                if (remainingEnergy <= almostZeroEnergy) {
                    remainingEnergy = 0.0;
                }

                break;
            }

            if (remainingEnergy <= almostZeroEnergy) {
                remainingEnergy = 0.0;

                break;
            }
        }

        if (currentCost !== 0) {
            const requiredEnergy = currentTime < 1.0 ? (1.0 - currentTime) * currentCost : 0.0;

            currentTime = min(currentTime + remainingEnergy / currentCost, 1.0);
            remainingEnergy -= requiredEnergy;

            if (remainingEnergy <= almostZeroEnergy) {
                remainingEnergy = 0.0;
            }
        } else if (remainingEnergy !== 0.0) {
            currentTime = 1.0;
        }

        if (currentTime * targetDistance > targetDistance - 0.5 / 256.0) {
            currentTime = 1.0;
        }

        this._targetHit = currentTime === 1.0 ? 1 : -1;
        this._elapsedTime = currentTime;
        this._remainingEnergy = min(remainingEnergy * targetDistance, 1.0);

        CAST.reset();
    }
}

/**
 * @type {Cast}
 * @internal
 * @ignore
 */
const CAST = new Cast(1024);

/**
 * Calculate the current energy cost.
 * @param {Space} space - The space.
 * @returns {number} The current energy cost.
 */
function calculateCost(space) {
    let calculatedCost = 0.0;
    const volumes = space.volumes;
    const numVolumes = volumes.length;

    for (let volumeIndex = 0; volumeIndex < numVolumes; volumeIndex++) {
        const volume = volumes[volumeIndex];

        if (volume.geometry._state !== 0) {
            continue;
        }

        const cost = volume.cost;

        switch (volume.mode) {
            case 0:
                calculatedCost = max(calculatedCost + cost, 0.0);

                break;
            case 1:
                calculatedCost = min(calculatedCost, cost);

                break;
            case 2:
                calculatedCost = max(calculatedCost, cost);

                break;
            case 3:
                calculatedCost = cost;

                break;
        }
    }

    return calculatedCost;
}
