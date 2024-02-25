import * as raycast from "../../raycast/_module.mjs";

export default class PointSourceRayCaster {
    /**
     * @param {raycast.Ray} [ray] - The ray.
     */
    constructor(ray) {
        /**
         * @type {raycast.Ray}
         * @readonly
         */
        this.ray = ray ?? raycast.Ray.create();
    }

    /**
     * @type {raycast.Space}
     * @readonly
     */
    space = raycast.Space.EMPTY;

    /**
     * @type {Readonly<[
     *     raycast.Space | null,
     *     raycast.Space | null,
     *     raycast.Space | null,
     *     raycast.Space | null,
     *     raycast.Space | null,
     *     raycast.Space | null,
     *     raycast.Space | null,
     *     raycast.Space | null
     * ]>}
     * @readonly
     */
    #octants = [null, null, null, null, null, null, null, null];

    /**
     * @type {boolean}
     * @readonly
     */
    initialized = false;

    /**
     * Initialize the caster.
     * @param {raycast.Space} space - The space.
     * @param {number} originX - The x-coordinate of the origin of the ray.
     * @param {number} originY - The y-coordinate of the origin of the ray.
     * @param {number} originZ - The z-coordinate of the origin of the ray.
     * @param {number} minRange - The minimum range of the ray.
     * @param {number} maxRange - The maximum range of the ray.
     */
    initialize(space, originX, originY, originZ, minRange, maxRange) {
        this.ray.setSpace(raycast.Space.EMPTY).setOrigin(originX, originY, originZ).setRange(minRange, maxRange);

        this.space = space;

        for (let i = 0; i < 8; i++) {
            this.#octants[i] = null;
        }

        this.initialized = true;
    }

    /**
     * Reset the caster.
     */
    reset() {
        this.ray.reset();
        this.space = raycast.Space.EMPTY;

        for (let i = 0; i < 8; i++) {
            this.#octants[i] = null;
        }

        this.initialized = false;
    }

    /**
     * Cast the ray.
     * @param {number} targetX - The x-coordinate of the target of the ray.
     * @param {number} targetY - The y-coordinate of the target of the ray.
     * @param {number} targetZ - The z-coordinate of the target of the ray.
     * @returns {raycast.Ray} The ray of this instance.
     */
    castRay(targetX, targetY, targetZ) {
        return this.ray.setSpace(this.#getOctant(targetX, targetY, targetZ)).setTarget(targetX, targetY, targetZ);
    }

    /**
     * Get the octant.
     * @param {number} targetX - The x-coordinate of the target of the ray.
     * @param {number} targetY - The y-coordinate of the target of the ray.
     * @param {number} targetZ - The z-coordinate of the target of the ray.
     * @returns {raycast.Space} The octant.
     */
    #getOctant(targetX, targetY, targetZ) {
        const { originX, originY, originZ } = this.ray;
        const index = (originX < targetX ? 1 : 0) | (originY < targetY ? 2 : 0) | (originZ < targetZ ? 4 : 0);
        let octant = this.#octants[index];

        if (!octant) {
            let minX = originX;
            let maxX = originX;
            let minY = originY;
            let maxY = originY;
            let minZ = originZ;
            let maxZ = originZ;

            switch (index) {
                case 0:
                    minX = -Infinity;
                    minY = -Infinity;
                    minZ = -Infinity;

                    break;
                case 1:
                    maxX = Infinity;
                    minY = -Infinity;
                    minZ = -Infinity;

                    break;
                case 2:
                    minX = -Infinity;
                    maxY = Infinity;
                    minZ = -Infinity;

                    break;
                case 3:
                    maxX = Infinity;
                    maxY = Infinity;
                    minZ = -Infinity;

                    break;
                case 4:
                    minX = -Infinity;
                    minY = -Infinity;
                    maxZ = Infinity;

                    break;
                case 5:
                    maxX = Infinity;
                    minY = -Infinity;
                    maxZ = Infinity;

                    break;
                case 6:
                    minX = -Infinity;
                    maxY = Infinity;
                    maxZ = Infinity;

                    break;
                case 7:
                    maxX = Infinity;
                    maxY = Infinity;
                    maxZ = Infinity;

                    break;
            }

            octant = this.space.crop(minX, minY, minZ, maxX, maxY, maxZ);
            this.#octants[index] = octant;
        }

        return octant;
    }
}
