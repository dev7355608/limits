import { VolumeData } from "./data/models.mjs";
import * as raycasting from "./raycasting/_index.mjs";
import { Shape } from "./utils/shape.js";

export class Volume {
    /**
     * The ID.
     * @type {string}
     * @readonly
     */
    id;

    /**
     * The data.
     * @type {VolumeData}
     * @readonly
     */
    data = new VolumeData({ hidden: true });

    /** @type {raycasting.Boundary[]|null} */
    #boundaries = null;

    /** @type {{[sense: string]: number}} */
    #limits = {};

    /**
     * @param {string} id
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * @param {VolumeData} data
     * @returns {boolean}
     */
    update(data) {
        const changes = this.data.updateSource(data);

        if (foundry.utils.isEmpty(changes)) {
            return false;
        }

        const isActive = !this.data.hidden;
        const isOrWasActive = isActive || "hidden" in changes;
        let changedLimits;

        if ("light" in changes || "sight" in changes || "sound" in changes) {
            changedLimits = this.#updateLimits();
        } else {
            changedLimits = {};
        }

        if (isActive && !foundry.utils.isEmpty(this.#limits)) {
            if (!this.#boundaries || "boundaries" in changes) {
                this.#updateBoundaries();
            }
        } else if ("boundaries" in changes) {
            this.#boundaries = null;
        }

        if (!isOrWasActive) {
            return true;
        }

        const commonChanges = ["hidden", "boundaries", "priority", "mode"].some((key) => key in changes);
        const limits = foundry.utils.expandObject(this.#limits);

        changedLimits = foundry.utils.expandObject(changedLimits);

        canvas.perception.update({
            initializeLighting: commonChanges && "light" in limits || "light" in changedLimits,
            initializeVision: commonChanges && "sight" in limits || "sight" in changedLimits,
            initializeSounds: commonChanges && "sound" in limits || "sound" in changedLimits
        });

        return true;
    }

    destroy() {
        if (this.hidden) {
            return;
        }

        const limits = foundry.utils.expandObject(this.#limits);

        canvas.perception.update({
            initializeLighting: "light" in limits,
            initializeVision: "sight" in limits,
            initializeSounds: "sound" in limits
        });
    }

    /**
     * Returns a ray caster volume for the type and subtype.
     * @param {string} sense - The sense.
     * @returns {Volume|undefined} The ray caster volume.
     * @internal
     */
    _createRayVolume(sense) {
        if (this.data.hidden) {
            return;
        }

        const limit = this.#limits[sense];

        if (limit === undefined) {
            return;
        }

        const energyCost = 1 / limit;

        return new raycasting.Volume(this.#boundaries.map((o) => o.clone()), this.data.priority, this.data.mode, energyCost);
    }

    #updateBoundaries() {
        this.#boundaries = [];

        for (const boundaryData of this.data.boundaries) {
            if (boundaryData.mask === 0) {
                continue;
            }

            let boundary;

            switch (boundaryData.type) {
                case "cylinder":
                    boundary = Volume.#createCylinder(boundaryData);
                    break;
            }

            if (!boundary) {
                continue;
            }

            this.#boundaries.push(boundary);
        }
    }

    /**
     * @returns {{[sense: string]: number}}
     */
    #updateLimits() {
        const oldLimits = this.#limits;

        this.#limits = {};

        this.#updateLimit("light", this.data.light);

        for (const [mode, limit] of Object.entries(this.data.sight)) {
            this.#updateLimit(`sight.${mode}`, limit)
        }

        this.#updateLimit("sound", this.data.sound);

        const changedLimits = {};

        for (const [sense, oldLimit] of Object.entries(oldLimits)) {
            const limit = this.#limits[sense];

            if (oldLimit !== limit) {
                changedLimits[sense] = limit ?? null;
            }
        }

        for (const [sense, limit] of Object.entries(this.#limits)) {
            if (oldLimits[sense] !== limit) {
                changedLimits[sense] = limit;
            }
        }

        return changedLimits;
    }

    /**
     * @param {string} sense
     * @param {{enabled: boolean, range: number|null}|null|undefined} limit
     */
    #updateLimit(sense, limit) {
        if (!limit?.enabled) {
            return;
        }

        const distancePixels = canvas.dimensions.distancePixels;
        const range = Number.isFinite(limit.range) ? limit.range * distancePixels : Infinity;
        let skip = false;

        switch (this.data.mode) {
            case raycasting.Operation.ADD:
            case raycasting.Operation.SUB:
            case raycasting.Operation.MAX:
                skip = range === Infinity;
                break;
            case raycasting.Operation.MIN:
                skip = range === 0;
                break;
        }

        if (skip) {
            return;
        }

        this.#limits[sense] = range;
    }

    /**
     * @param {ObjectData} data
     * @returns {raycasting.boundaries.Cylinder|undefined}
     */
    static #createCylinder(data) {
        const cylinderData = data.data;
        const base = [];

        for (const figureData of cylinderData.base) {
            if ((figureData.mask & 0x7FFFFFFF) === 0) {
                continue;
            }

            let figure;

            switch (figureData.shape.type) {
                case "r":
                    figure = Volume.#createRectangle(figureData);
                    break;
                case "e":
                    figure = Volume.#createEllipse(figureData);
                    break;
                case "p":
                    figure = Volume.#createPolygon(figureData);
                    break;
            }

            if (!figure) {
                continue;
            }

            base.push(figure);
        }

        if (base.length === 0) {
            return;
        }

        const bottom = cylinderData.bottom ?? -Infinity;
        const top = cylinderData.top ?? Infinity;

        return new raycasting.boundaries.Cylinder({ base, bottom, top, mask: data.mask });
    }

    /**
     * @param {FigureData} data
     * @returns {raycasting.figures.Rectangle|raycasting.figures.Tile|undefined}
     */
    static #createRectangle(data) {
        let { x, y, rotation, shape: { width, height }, mask } = data;

        if (!(width > 0 && height > 0)) {
            return;
        }

        const centerX = x + width / 2;
        const centerY = y + height / 2;

        rotation = Math.toRadians(rotation ?? 0);

        const { src, scaleX, scaleY } = data.texture;

        if (!src) {
            return new raycasting.figures.Rectangle({ centerX, centerY, width, height, rotation, mask });
        }

        if (scaleX === 0 || scaleY === 0) {
            return;
        }

        width *= scaleX;
        height *= scaleY;

        const texture = getTexture(src);

        if (!texture) {
            return;
        }

        const { pixels, aw, ah, minX, minY, maxX, maxY } = new TileMesh(
            { occlusion: { mode: CONST.OCCLUSION_MODES.FADE } }, texture)._textureData;

        return new raycasting.figures.Tile({
            centerX, centerY, width, height, rotation, mask,
            texture: { pixels, width: aw, height: ah, minX, minY, maxX, maxY, threshold: 0.75 * 255 }
        });
    }

    /**
     * @param {FigureData} data
     * @returns {raycasting.figures.Circle|raycasting.figures.Ellipse|undefined}
     */
    static #createEllipse(data) {
        let { x, y, rotation, shape: { width, height }, mask } = data;

        if (!(width > 0 && height > 0)) {
            return;
        }

        const radiusX = width / 2;
        const radiusY = height / 2;
        const centerX = x + radiusX;
        const centerY = y + radiusY;

        if (radiusX === radiusY) {
            return new raycasting.figures.Circle({ centerX, centerY, radius: radiusX, mask });
        }

        rotation = Math.toRadians(rotation ?? 0);

        return new raycasting.figures.Ellipse({ centerX, centerY, radiusX, radiusY, rotation, mask });
    }

    /**
     * @param {FigureData} data
     * @returns {raycasting.figures.Polygon|undefined}
     */
    static #createPolygon(data) {
        const { x, y, rotation, shape: { width, height, points }, bezierFactor, mask } = data;

        if (points.length < 6) {
            return;
        }

        const polygon = new PIXI.Polygon(Array.from(points));

        Shape.dedupePolygon(polygon);
        Shape.smoothPolygon(polygon, bezierFactor ?? 0);

        const transform = new PIXI.Matrix()
            .translate(-(width ?? 0) / 2, -(height ?? 0) / 2)
            .rotate(Math.toRadians(rotation ?? 0))
            .translate(x + (width ?? 0) / 2, y + (height ?? 0) / 2);
        const shape = Shape.from(polygon, transform);

        if (shape.contour.length < 6) {
            return;
        }

        return new raycasting.figures.Polygon({ points: shape.contour, mask });
    }
}

export class VolumeCollection extends foundry.utils.Collection {
    /**
     * @type {VolumeCollection}
     * @readonly
     */
    static instance = new VolumeCollection();

    /**
     * Returns a ray caster for this type and subtype restricted to the specified bounds and range.
     * @param {string} sense - The sense.
     * @param {number} minR - The minimum range.
     * @param {number} maxR - The maximum range.
     * @param {number} [minX] - The minimum x-coordinate.
     * @param {number} [minY] - The minimum y-coordinate.
     * @param {number} [minZ] - The minimum z-coordinate.
     * @param {number} [maxX] - The maximum x-coordinate.
     * @param {number} [maxY] - The maximum y-coordinate.
     * @param {number} [maxZ] - The maximum z-coordinate.
     * @returns {raycasting.Caster} The new ray caster restricted to the bounds and range.
     */
    createRayCaster(sense, minR, maxR, minX, minY, minZ, maxX, maxY, maxZ) {
        const volumes = [];

        for (const value of this.values()) {
            const volume = value._createRayVolume(sense);

            if (volume) {
                volumes.push(volume);
            }
        }

        return new raycasting.Caster(volumes, minR, maxR, minX, minY, minZ, maxX, maxY, maxZ);
    }

    /**
     * Returns an optimized ray caster, which the ray from the origin to the target was cast with.
     * @param {string} sense
     * @param {number} minR - The minimum range of the ray.
     * @param {number} originX - The x-coordinate of the origin of the ray.
     * @param {number} originY - The y-coordinate of the origin of the ray.
     * @param {number} originZ - The z-coordinate of the origin of the ray.
     * @param {number} targetX - The x-coordinate of the target of the ray.
     * @param {number} targetY - The y-coordinate of the target of the ray.
     * @param {number} targetZ - The z-coordinate of the target of the ray.
     * @returns {raycasting.Caster} The ray caster that was used to cast the ray.
     */
    castRay(sense, minR, originX, originY, originZ, targetX, targetY, targetZ) {
        let minX, minY, minZ, maxX, maxY, maxZ;

        if (originX <= targetX) {
            minX = originX;
            maxX = targetX;
        } else {
            minX = targetX;
            maxX = originX;
        }

        if (originY <= targetY) {
            minY = originY;
            maxY = targetY;
        } else {
            minY = targetY;
            maxY = originY;
        }

        if (originZ <= targetZ) {
            minZ = originZ;
            maxZ = targetZ;
        } else {
            minZ = targetZ;
            maxZ = originZ;
        }

        return this.createRayCaster(sense, minR, Infinity, minX, minY, minZ, maxX, maxY, maxZ)
            .setOrigin(originX, originY, originZ)
            .setTarget(targetX, targetY, targetZ)
            .castRay();
    }
}
