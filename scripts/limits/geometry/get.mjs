import * as raycast from "../../raycast/_module.mjs";
import { geometriesByRegion } from "./state.mjs";

/**
 * Get the geometry of the RegionDocument.
 * @param {foundry.documents.RegionDocument} region
 * @returns {raycast.Geometry}
 */
export function getGeometry(region) {
    let geometry = geometriesByRegion.get(region)?.geometry;

    if (geometry) {
        return geometry;
    }

    const distancePixels = region.parent.dimensions.distancePixels;
    const animated = region.rendered && region.object.isAnimating;
    const { elevation } = animated ? region.object.animationState : region;

    geometry = raycast.Geometry.create({
        boundaries: [
            raycast.boundaries.Region.create({
                shapes: createShapes(region),
                bottom: elevation.bottom * distancePixels - 1e-8,
                top: elevation.top * distancePixels + 1e-8,
            }),
        ],
    });
    geometriesByRegion.set(region, { geometry, animated });

    return geometry;
}

/**
 * Create the shapes of the RegionDocument.
 * @param {foundry.documents.RegionDocument} region
 */
function createShapes(region) {
    const { shapes, polygonTree } = region.rendered ? region.object.animationState : region;

    if (shapes.length === 1 && (!shapes[0].isAffectedByGrid || shapes[0].grid.isGridless) && !region.restriction.enabled) {
        const shape = shapes[0];

        switch (shape.type) {
            case "rectangle":
                if (shape.rotation === 0 || shape.rotation === 90 || shape.rotation === 180 || shape.rotation === 270) {
                    const { left: minX, top: minY, right: maxX, bottom: maxY } = shape.bounds;

                    return [raycast.shapes.Bounds.create({ minX, minY, maxX, maxY })];
                }

                return [
                    raycast.shapes.Rectangle.create({
                        x: shape.x,
                        y: shape.y,
                        width: shape.width,
                        height: shape.height,
                        anchorX: shape.anchorX,
                        anchorY: shape.anchorY,
                        rotation: Math.toRadians(shape.rotation),
                    }),
                ];
            case "circle":
                return [
                    raycast.shapes.Circle.create({
                        x: shape.x,
                        y: shape.y,
                        radius: shape.radius,
                    }),
                ];
            case "ellipse":
                if (shape.radiusX === shape.radiusY) {
                    return [
                        raycast.shapes.Circle.create({
                            x: shape.x,
                            y: shape.y,
                            radius: shape.radiusX,
                        }),
                    ];
                }

                return [
                    raycast.shapes.Ellipse.create({
                        x: shape.x,
                        y: shape.y,
                        radiusX: shape.radiusX,
                        radiusY: shape.radiusY,
                        rotation: Math.toRadians(shape.rotation),
                    }),
                ];
            case "cone":
                if (shape.angle === 360) {
                    return [
                        raycast.shapes.Circle.create({
                            x: shape.x,
                            y: shape.y,
                            radius: shape.radius,
                        }),
                    ];
                }

                break;
            case "line":
                if (shape.rotation === 0 || shape.rotation === 90 || shape.rotation === 180 || shape.rotation === 270) {
                    const { left: minX, top: minY, right: maxX, bottom: maxY } = shape.bounds;

                    return [raycast.shapes.Bounds.create({ minX, minY, maxX, maxY })];
                }

                return [
                    raycast.shapes.Rectangle.create({
                        x: shape.x,
                        y: shape.y,
                        width: shape.length,
                        height: shape.width,
                        anchorX: 0.0,
                        anchorY: 0.5,
                        rotation: Math.toRadians(shape.rotation),
                    }),
                ];
        }
    }

    return polygonTree.polygons.map((polygon) => raycast.shapes.Polygon.create({ points: polygon.points }));
}
