import * as raycast from "./raycast/_module.mjs";

/**
 * @sealed
 */
export default class Limits {
    /**
     * @type {Readonly<{ [mode: string]: raycast.Space }>}
     * @readonly
     */
    static sight = {};

    /** @type {Limits} */
    static #light;

    /**
     * @type {raycast.Space}
     */
    static get light() {
        return this.#light.#getSpace();
    }

    /** @type {Limits} */
    static #darkness;

    /**
     * @type {raycast.Space}
     */
    static get darkness() {
        return this.#darkness.#getSpace();
    }

    /** @type {Limits} */
    static #sound;

    /**
     * @type {raycast.Space}
     */
    static get sound() {
        return this.#sound.#getSpace();
    }

    static {
        Hooks.once("init", () => {
            Hooks.once("setup", () => {
                Hooks.once("canvasInit", () => {
                    this.sight = {};

                    for (const id in CONFIG.Canvas.detectionModes) {
                        const limit = new SightLimits(id);

                        Object.defineProperty(this.sight, id, {
                            get: limit.#getSpace.bind(limit),
                            enumerable: true,
                        });
                    }

                    Object.freeze(this.sight);

                    this.#light = new LightLimits();
                    this.#darkness = new DarknessLimits();
                    this.#sound = new SoundLimits();
                });
            });
        });
    }

    /** @type {Map<foundry.documents.RegionDocument, raycast.Geometry>} */
    static #geometries = new Map();

    /**
     * Get the geometry of the RegionDocument.
     * @param {foundry.documents.RegionDocument} region - The RegionDocument.
     * @returns {raycast.Geometry} The geometry.
     */
    static #getGeometry(region) {
        let geometry = this.#geometries.get(region);

        if (!geometry) {
            const distancePixels = canvas.dimensions.distancePixels;
            let shape;

            if (region.shapes.length === 1) {
                const data = region.shapes[0];

                switch (data.type) {
                    case "rectangle":
                        if (data.rotation === 0) {
                            shape = raycast.shapes.Bounds.create({
                                minX: data.x,
                                minY: data.y,
                                maxX: data.x + data.width,
                                maxY: data.y + data.height,
                            });
                        } else {
                            shape = raycast.shapes.Rectangle.create({
                                centerX: data.x + data.width / 2,
                                centerY: data.y + data.height / 2,
                                width: data.width / 2,
                                height: data.height / 2,
                                rotation: Math.toRadians(data.rotation),
                            });
                        }

                        break;
                    case "circle":
                        shape = raycast.shapes.Circle.create({
                            centerX: data.x,
                            centerY: data.y,
                            radius: data.radius,
                        });

                        break;
                    case "ellipse":
                        if (data.radiusX === data.radiusY) {
                            shape = raycast.shapes.Circle.create({
                                centerX: data.x,
                                centerY: data.y,
                                radius: data.radiusX,
                            });
                        } else {
                            shape = raycast.shapes.Ellipse.create({
                                centerX: data.x,
                                centerY: data.y,
                                radiusX: data.radiusX,
                                radiusY: data.radiusY,
                                rotation: Math.toRadians(data.rotation),
                            });
                        }

                        break;
                    case "polygon":
                        shape = raycast.shapes.Polygon.create({ points: data.points });

                        break;
                }
            }

            let polygons;
            let bottom;
            let top;

            if (game.release.version >= 13) {
                if (!shape) {
                    polygons = region.polygons;
                }

                bottom = region.elevation.bottom;
                top = region.elevation.top;
            } else {
                if (!shape) {
                    polygons = region.object.polygons;
                }

                bottom = region.object.bottom;
                top = region.object.top;
            }

            geometry = raycast.Geometry.create({
                boundaries: [raycast.boundaries.Region.create({
                    shapes: shape ? [shape] : polygons.map((polygon) => raycast.shapes.Polygon.create({ points: polygon.points })),
                    bottom: bottom * distancePixels - 1e-8,
                    top: top * distancePixels + 1e-8,
                })],
            });
            this.#geometries.set(region, geometry);
        }

        return geometry;
    }

    /**
     * Destroy the geometry of the RegionDocument.
     * @param {foundry.documents.RegionDocument} region - The RegionDocument.
     */
    static #destroyGeometry(region) {
        if (this.#geometries.delete(region)) {
            for (const behavior of region.behaviors) {
                if (this.#volumes.delete(behavior)) {
                    for (const instance of this.#instances) {
                        if (instance.#behaviors.has(behavior)) {
                            instance.#space = null;
                            instance._updatePerception();
                        }
                    }
                }
            }
        }
    }

    static {
        Hooks.on("updateRegion", (document, changed) => {
            if (document.rendered && ("shapes" in changed || "elevation" in changed)) {
                this.#destroyGeometry(document);
            }
        });

        Hooks.on("destroyRegion", (region) => {
            this.#destroyGeometry(region.document);
        });
    }

    /** @type {Map<foundry.documents.RegionBehavior, raycast.Volume>} */
    static #volumes = new Map();

    /**
     * Get the volume of the RegionBehavior.
     * @param {foundry.documents.RegionBehavior} behavior - The RegionBehavior.
     * @returns {raycast.Volume} The volume.
     */
    static #getVolume(behavior) {
        let volume = this.#volumes.get(behavior);

        if (!volume) {
            const geometry = this.#getGeometry(behavior.parent);
            const { priority, mode, range } = behavior.system;
            const cost = 1.0 / ((range ?? Infinity) * canvas.dimensions.distancePixels);

            volume = raycast.Volume.create({ geometry, priority, mode, cost });
            this.#volumes.set(behavior, volume);
        }

        return volume;
    }

    /** @type {Limits[]} */
    static #instances = [];

    /**
     * @internal
     * @ignore
     */
    constructor() {
        Limits.#instances.push(this);
    }

    /** @type {Set<foundry.documents.RegionBehavior>} */
    #behaviors = new Set();

    /** @type {raycast.Space | null} */
    #space = null;

    /**
     * Get the space.
     * @returns {raycast.Space}
     */
    #getSpace() {
        let space = this.#space;

        if (!space) {
            const volumes = [];

            for (const behavior of this.#behaviors) {
                volumes.push(Limits.#getVolume(behavior));
            }

            space = raycast.Space.create({ volumes });
            this.#space = space;
        }

        return space;
    }

    /**
     * Called when the RegionBehavior is viewed.
     * @param {foundry.documents.RegionBehavior} behavior - The RegionBehavior.
     * @internal
     * @ignore
     */
    static _onBehaviorViewed(behavior) {
        for (const instance of this.#instances) {
            if (instance.#behaviors.has(behavior)) {
                continue;
            }

            if (instance._hasBehavior(behavior)) {
                instance.#behaviors.add(behavior);
                instance.#space = null;
                instance._updatePerception();
            }
        }
    }

    /**
     * Called when the RegionBehavior is unviewed.
     * @param {foundry.documents.RegionBehavior} behavior - The RegionBehavior.
     * @internal
     * @ignore
     */
    static _onBehaviorUnviewed(behavior) {
        this.#volumes.delete(behavior);

        for (const instance of this.#instances) {
            if (instance.#behaviors.delete(behavior)) {
                instance.#space = null;
                instance._updatePerception();
            }
        }
    }

    /**
     * Called when the RegionBehavior's Region shape is changed and the RegionBehavior is viewed.
     * @param {foundry.documents.RegionBehavior} behavior - The RegionBehavior.
     * @internal
     * @ignore
     */
    static _onBehaviorBoundaryChanged(behavior) {
        this.#volumes.delete(behavior);

        for (const instance of this.#instances) {
            if (instance.#behaviors.has(behavior)) {
                instance.#space = null;
                instance._updatePerception();
            }
        }
    }

    /**
     * Called when the RegionBehavior's system data changed and the RegionBehavior is viewed.
     * @param {foundry.documents.RegionBehavior} behavior - The RegionBehavior.
     * @internal
     * @ignore
     */
    static _onBehaviorSystemChanged(behavior) {
        this.#volumes.delete(behavior);

        for (const instance of this.#instances) {
            if (instance._hasBehavior(behavior)) {
                instance.#behaviors.add(behavior);
                instance.#space = null;
                instance._updatePerception();
            } else if (instance.#behaviors.has(behavior)) {
                instance.#behaviors.delete(behavior);
                instance.#space = null;
                instance._updatePerception();
            }
        }
    }

    /**
     * @param {foundry.documents.RegionBehavior} behavior - The RegionBehavior.
     * @returns {boolean}
     * @protected
     * @abstract
     */
    _hasBehavior(behavior) {
        return false;
    }

    /**
     * Update perception.
     * @protected
     * @abstract
     */
    _updatePerception() { }
}

/**
 * @internal
 * @ignore
 */
class SightLimits extends Limits {
    /**
     * @param {string} id - The detection mode ID.
     */
    constructor(id) {
        super();

        /**
         * The detection mode ID.
         * @type {string}
         * @readonly
         */
        this.id = id;
    }

    /** @override */
    _hasBehavior(behavior) {
        return behavior.system.sight.has(this.id);
    }

    /** @override */
    _updatePerception() {
        canvas.perception.update({ initializeVision: true });
    }
}

/**
 * @internal
 * @ignore
 */
class LightLimits extends Limits {
    /** @override */
    _hasBehavior(behavior) {
        return behavior.system.light;
    }

    /** @override */
    _updatePerception() {
        canvas.perception.update({ initializeLightSources: true });
    }
}

/**
 * @internal
 * @ignore
 */
class DarknessLimits extends Limits {
    /** @override */
    _hasBehavior(behavior) {
        return behavior.system.darkness;
    }

    /** @override */
    _updatePerception() {
        canvas.perception.update({ initializeDarknessSources: true, initializeLightSources: true });
    }
}

/**
 * @internal
 * @ignore
 */
class SoundLimits extends Limits {
    /** @override */
    _hasBehavior(behavior) {
        return behavior.system.sound;
    }

    /** @override */
    _updatePerception() {
        canvas.perception.update({ initializeSounds: true });
    }
}
