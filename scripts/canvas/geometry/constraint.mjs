import * as raycast from "../../raycast/_module.mjs";
import computeQuadrantBounds from "./quadrants.mjs";

/** @type {typeof foundry.canvas.placeables.Token} */
const Token = foundry.canvas?.placeables?.Token ?? Token;

/**
 * The constraint for a polygon given a space.
 * @extends {PIXI.Polygon}
 */
export default class PointSourcePolygonConstraint extends PIXI.Polygon {
    /**
     * Apply the constraint given by the space to the polygon.
     * @overload
     * @param {foundry.canvas.geometry.PointSourcePolygon} polygon - The polygon that is to be constrained.
     * @param {raycast.Space} space - The space.
     * @returns {boolean} Was the polygon constrained?
     */
    /**
     * Apply the constraint given by the space to the polygon.
     * @overload
     * @param {foundry.canvas.geometry.PointSourcePolygon} polygon - The polygon that is to be constrained.
     * @param {raycast.Space} space - The space.
     * @param {boolean} clone - Clone before constraining?
     * @returns {foundry.canvas.geometry.PointSourcePolygon} The constrained polygon.
     */
    static apply(polygon, space, clone) {
        const constraint = new this(polygon, space);

        if (!constraint.isEnveloping) {
            const intersection = constraint.intersectPolygon(polygon, { scalingFactor: 100 });

            if (clone) {
                const origin = polygon.origin;
                const config = { ...polygon.config, boundaryShapes: [...polygon.config.boundaryShapes] };

                polygon = new polygon.constructor();
                polygon.origin = origin;
                polygon.config = config;
            }

            polygon.points = intersection.points;
            polygon.bounds = polygon.getBounds();
        }

        polygon.config.boundaryShapes.push(constraint);

        return clone === undefined ? !constraint.isEnveloping : polygon;
    }

    /**
     * @param {foundry.canvas.geometry.PointSourcePolygon} polygon - The polygon that the constraint is computed for.
     * @param {raycast.Space} space - The space.
     * @protected
     */
    constructor(polygon, space) {
        super();

        this.#origin = polygon.origin;

        const object = polygon.config.source?.object;

        if (object instanceof Token) {
            let center;

            if (game.release.generation >= 13) {
                center = object.document.getCenterPoint();
            } else {
                center = object.getCenterPoint();
            }

            if (Math.abs(this.#origin.x - Math.round(center.x)) <= 1 && Math.abs(this.#origin.y - Math.round(center.y)) <= 1) {
                if (game.release.generation >= 13) {
                    center.elevation = this.#origin.elevation;
                }

                this.#origin = center;
            }
        }

        let { x: originX, y: originY, elevation } = this.#origin;

        if (game.release.generation < 13) {
            elevation = polygon.config.source?.elevation ?? 0.0;
        }

        const originZ = elevation * canvas.dimensions.distancePixels;
        const externalRadius = this.#externalRadius = polygon.config.externalRadius;
        const { left: minX, right: maxX, top: minY, bottom: maxY } = this.#sourceBounds = polygon.bounds;
        const { minDistance, maxDistance } = this.#space0 = space.crop(minX, minY, originZ, maxX, maxY, originZ);

        if (minDistance === maxDistance) {
            const maxRadius = externalRadius + maxDistance;

            if (maxRadius < polygon.config.radius) {
                this.#addCircleSegment(maxRadius, 0.0);
                this.#addCircleSegment(maxRadius, Math.PI * 0.5);
                this.#addCircleSegment(maxRadius, Math.PI);
                this.#addCircleSegment(maxRadius, Math.PI * 1.5);
            }
        } else {
            this.#quadrantBounds = computeQuadrantBounds(originX, originY, polygon.points);

            const ray = raycast.Ray.create()
                .setOrigin(originX, originY, originZ)
                .setRange(externalRadius, polygon.config.radius);

            this.#computePoints(ray);
        }

        if (this.#enveloping) {
            this.points.length = 0;
            this.points.push(
                minX, minY,
                maxX, minY,
                maxX, maxY,
                minX, maxY,
            );
        } else {
            this.#closePoints();
        }
    }

    /** @type {foundry.types.ElevatedPoint} */
    #origin;

    /** @type {number} */
    #externalRadius;

    /** @type {PIXI.Rectangle} */
    #sourceBounds;

    /** @type {[x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number] | null} */
    #quadrantBounds = null;

    /** @type {raycast.Space | null} */
    #space0 = null;

    /** @type {raycast.Space | null} */
    #space1 = null;

    /** @type {raycast.Space | null} */
    #space2 = null;

    /** @type {raycast.Space | null} */
    #space3 = null;

    /** @type {raycast.Space | null} */
    #space4 = null;

    /** @type {boolean} */
    #enveloping = true;

    /**
     * Is the constraint enveloping the polygon it was computed for?
     * @type {boolean}
     */
    get isEnveloping() {
        return this.#enveloping;
    }

    /** @type {true} */
    get isPositive() {
        return true;
    }

    /**
     * Compute the constraint.
     * @param {raycast.Ray} ray
     */
    #computePoints(ray) {
        const { x, y } = this.#origin;
        let [x0, y0, x1, y1, x2, y2, x3, y3] = this.#quadrantBounds;

        if (x < x0 && y < y0) {
            const space1 = this.#space1 = this.#space0.crop(x, y, -Infinity, x0, y0, Infinity);
            const { minDistance, maxDistance } = space1;
            const maxRadius = this.#externalRadius + maxDistance;

            if (minDistance === maxDistance) {
                if (maxRadius < Math.hypot(x0 - x, y0 - y)) {
                    this.#addCircleSegment(maxRadius, 0.0);
                } else {
                    this.#addPoint(x0, y);
                    this.points.push(x0, y0, x, y0);
                }
            } else {
                x0 = Math.min(x0, x + maxRadius);
                y0 = Math.min(y0, y + maxRadius);

                ray.setSpace(space1);
                this.#castRays(ray, x0, y, x0, y0);
                this.#castRays(ray, x0, y0, x, y0);
            }
        } else {
            this.#addPoint(x0, y);
            this.#addPoint(x0, y0);
            this.#addPoint(x, y0);
        }

        if (x1 < x && y < y1) {
            const space2 = this.#space2 = this.#space0.crop(x1, y, -Infinity, x, y1, Infinity);
            const { minDistance, maxDistance } = space2;
            const maxRadius = this.#externalRadius + maxDistance;

            if (minDistance === maxDistance) {
                if (maxRadius < Math.hypot(x - x1, y1 - y)) {
                    this.#addCircleSegment(maxRadius, Math.PI * 0.5);
                } else {
                    this.#addPoint(x, y1);
                    this.points.push(x1, y1, x1, y);
                }
            } else {
                x1 = Math.max(x1, x - maxRadius);
                y1 = Math.min(y1, y + maxRadius);

                ray.setSpace(space2);
                this.#castRays(ray, x, y1, x1, y1);
                this.#castRays(ray, x1, y1, x1, y);
            }
        } else {
            this.#addPoint(x, y1);
            this.#addPoint(x1, y1);
            this.#addPoint(x1, y);
        }

        if (x2 < x && y2 < y) {
            const space3 = this.#space3 = this.#space0.crop(x2, y2, -Infinity, x, y, Infinity);
            const { minDistance, maxDistance } = space3;
            const maxRadius = this.#externalRadius + maxDistance;

            if (minDistance === maxDistance) {
                if (maxRadius < Math.hypot(x - x2, y - y2)) {
                    this.#addCircleSegment(maxRadius, Math.PI);
                } else {
                    this.#addPoint(x2, y);
                    this.points.push(x2, y2, x, y2);
                }
            } else {
                x2 = Math.max(x2, x - maxRadius);
                y2 = Math.max(y2, y - maxRadius);

                ray.setSpace(space3);
                this.#castRays(ray, x2, y, x2, y2);
                this.#castRays(ray, x2, y2, x, y2);
            }
        } else {
            this.#addPoint(x2, y);
            this.#addPoint(x2, y2);
            this.#addPoint(x, y2);
        }

        if (x < x3 && y3 < y) {
            const space4 = this.#space4 = this.#space0.crop(x, y3, -Infinity, x3, y, Infinity);
            const { minDistance, maxDistance } = space4;
            const maxRadius = this.#externalRadius + maxDistance;

            if (minDistance === maxDistance) {
                if (maxRadius < Math.hypot(x3 - x, y - y3)) {
                    this.#addCircleSegment(maxRadius, Math.PI * 1.5);
                } else {
                    this.#addPoint(x, y3);
                    this.points.push(x3, y3, x3, y);
                }
            } else {
                x3 = Math.min(x3, x + maxRadius);
                y3 = Math.max(y3, y - maxRadius);

                ray.setSpace(space4);
                this.#castRays(ray, x, y3, x3, y3);
                this.#castRays(ray, x3, y3, x3, y);
            }
        } else {
            this.#addPoint(x, y3);
            this.#addPoint(x3, y3);
            this.#addPoint(x3, y);
        }
    }

    /**
     * Add a circle segment to the constraint.
     * @param {number} centerX - The x-coordiante of the origin.
     * @param {number} originY - The y-coordinate of the origin.
     * @param {number} radius - The radius.
     * @param {number} startAngle - The start angle.
     */
    #addCircleSegment(radius, startAngle) {
        this.#enveloping = false;

        const { x: centerX, y: centerY } = this.#origin;

        if (radius === 0.0) {
            this.#addPoint(centerX, centerY);

            return;
        }

        this.#addPoint(
            centerX + Math.cos(startAngle) * radius,
            centerY + Math.sin(startAngle) * radius,
        );

        const deltaAngle = Math.PI * 0.5;
        const points = this.points;

        if (radius < canvas.dimensions.maxR) {
            const epsilon = 1.0; // PIXI.Circle.approximateVertexDensity
            const numSteps = Math.ceil(deltaAngle / Math.sqrt(2.0 * epsilon / radius) - 1e-3);
            const angleStep = deltaAngle / numSteps;

            for (let i = 1; i <= numSteps; i++) {
                const a = startAngle + angleStep * i;

                points.push(
                    centerX + Math.cos(a) * radius,
                    centerY + Math.sin(a) * radius,
                );
            }
        } else {
            const halfDeltaAngle = deltaAngle * 0.5;
            const midAngle = startAngle + halfDeltaAngle;
            const stopAngle = startAngle + deltaAngle;
            const radiusMid = radius / Math.cos(halfDeltaAngle);

            points.push(
                centerX + Math.cos(midAngle) * radiusMid,
                centerY + Math.sin(midAngle) * radiusMid,
                centerX + Math.cos(stopAngle) * radius,
                centerY + Math.sin(stopAngle) * radius,
            );
        }
    }

    /**
     * Cast rays in the given quadrant.
     * @param {raycast.Ray} ray
     * @param {number} c0x
     * @param {number} c0y
     * @param {number} c1x
     * @param {number} c1y
     */
    #castRays(ray, c0x, c0y, c1x, c1y) {
        const { originX: x, originY: y, originZ: z } = ray;
        const precision = canvas.dimensions.size * 0.0825;
        const precision2 = precision * precision;
        const c0dx = c0x - x;
        const c0dy = c0y - y;
        const t0 = ray.setTarget(c0x, c0y, z).elapsedTime;

        if (t0 < 1.0) {
            this.#enveloping = false;
        }

        const r0x = x + t0 * c0dx;
        const r0y = y + t0 * c0dy;

        this.#addPoint(r0x, r0y);

        const c1dx = c1x - x;
        const c1dy = c1y - y;
        const t1 = ray.setTarget(c1x, c1y, z).elapsedTime;
        const r1x = x + t1 * c1dx;
        const r1y = y + t1 * c1dy;
        let cdx = c1x - c0x;
        let cdy = c1y - c0y;
        const cdd = Math.sqrt(cdx * cdx + cdy * cdy);

        cdx /= cdd;
        cdy /= cdd;

        const u0n = cdx * c0dx + cdy * c0dy;
        const ndx = c0dx - u0n * cdx;
        const ndy = c0dy - u0n * cdy;
        let ndd = ndx * ndx + ndy * ndy;

        if (ndd > 1e-6) {
            ndd /= Math.sqrt(ndd);

            const pdx = cdx * ndd * 0.5;
            const pdy = cdy * ndd * 0.5;
            const u1n = cdx * c1dx + cdy * c1dy;
            const c0dd = Math.sqrt(c0dx * c0dx + c0dy * c0dy);
            const c1dd = Math.sqrt(c1dx * c1dx + c1dy * c1dy);
            const fu0 = Math.log((u0n + c0dd) / ndd); // Math.asinh(u0n / ndd)
            const fu1 = Math.log((u1n + c1dd) / ndd); // Math.asinh(u1n / ndd)
            const dfu = fu1 - fu0;
            const fuk = Math.ceil(Math.abs(dfu * (ndd / precision))); // Math.asinh(precision / ndd)
            const fud = dfu / fuk;

            const recur = (i0, x0, y0, i2, x2, y2) => {
                if (!(i2 - i0 > 1)) {
                    return;
                }

                const dx02 = x0 - x2;
                const dy02 = y0 - y2;
                const dd02 = dx02 * dx02 + dy02 * dy02;

                if (dd02 <= precision2) {
                    return;
                }

                const i1 = (i0 + i2) >> 1;
                let u = Math.exp(fu0 + i1 * fud) - 1.0;

                u += u / (u + 1.0); // Math.sinh(fu0 + i1 * fud)

                const dx = ndx + u * pdx;
                const dy = ndy + u * pdy;
                const t1 = ray.setTarget(x + dx, y + dy, z).elapsedTime;
                const x1 = x + t1 * dx;
                const y1 = y + t1 * dy;

                recur(i0, x0, y0, i1, x1, y1);

                if (t1 < 1.0) {
                    this.#enveloping = false;
                }

                this.#addPoint(x1, y1);

                recur(i1, x1, y1, i2, x2, y2);
            };

            recur(0, r0x, r0y, fuk, r1x, r1y);
        }

        if (t1 < 1.0) {
            this.#enveloping = false;
        }

        this.#addPoint(r1x, r1y);
    }

    /**
     * Add a point to the constraint.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     */
    #addPoint(x, y) {
        const points = this.points;
        const m = points.length;

        if (m >= 4) {
            let x3 = points[m - 4];
            let y3 = points[m - 3];
            let x2 = points[m - 2];
            let y2 = points[m - 1];
            let x1 = x;
            let y1 = y;

            if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
                if ((x1 > x2) !== (x1 < x3)) {
                    if ((x2 > x1) === (x2 < x3)) {
                        [x1, y1, x2, y2] = [x2, y2, x1, y1];
                    } else {
                        [x1, y1, x2, y2, x3, y3] = [x3, y3, x1, y1, x2, y2];
                    }
                }
            } else {
                if ((y1 > y2) !== (y1 < y3)) {
                    if ((y2 > y1) === (y2 < y3)) {
                        [x1, y1, x2, y2] = [x2, y2, x1, y1];
                    } else {
                        [x1, y1, x2, y2, x3, y3] = [x3, y3, x1, y1, x2, y2];
                    }
                }
            }

            const a = y2 - y3;
            const b = x3 - x2;
            const c = a * (x1 - x2) + b * (y1 - y2);

            if ((c * c) / (a * a + b * b) > 0.0625) {
                points.push(x, y);
            } else {
                const dx = points[m - 4] - x;
                const dy = points[m - 3] - y;

                points.length -= 2;

                if (dx * dx + dy * dy > 0.0625) {
                    points.push(x, y);
                }
            }
        } else if (m === 2) {
            const dx = points[m - 2] - x;
            const dy = points[m - 1] - y;

            if (dx * dx + dy * dy > 0.0625) {
                points.push(x, y);
            }
        } else {
            points.push(x, y);
        }
    }

    /**
     * Close the points of the constraint.
     */
    #closePoints() {
        const points = this.points;

        if (points.length < 6) {
            points.length = 0;

            return;
        }

        const [x1, y1, x2, y2] = points;

        this.#addPoint(x1, y1);
        this.#addPoint(x2, y2);

        const m = points.length;

        [points[0], points[1], points[2], points[3]] = [points[m - 4], points[m - 3], points[m - 2], points[m - 1]];
        points.length -= 4;
    }

    /**
     * Visualize the polygon for debugging.
     */
    visualize() {
        const dg = canvas.controls.debug;

        dg.clear();

        for (const [i, space] of [this.#space1, this.#space2, this.#space3, this.#space4].entries()) {
            if (!space || (space.minDistance < space.maxDistance)) {
                continue;
            }

            let minX = this.#origin.x;
            let minY = this.#origin.y;
            let maxX = this.#quadrantBounds[i * 2];
            let maxY = this.#quadrantBounds[i * 2 + 1];

            if (minX > maxX) {
                [minX, maxX] = [maxX, minX];
            }

            if (minY > maxY) {
                [minY, maxY] = [maxY, minY];
            }

            dg.lineStyle(0);
            dg.beginFill(0x00FF00, 0.2);
            dg.drawRect(minX, minY, maxX - minX, maxY - minY);
            dg.endFill();
        }

        dg.lineStyle(2, 0x0000FF);
        dg.drawPolygon(this.points);

        dg.lineStyle(2, 0xFFFF00, 0.7);

        if (this.#quadrantBounds) {
            const { x, y } = this.#origin;
            const [q0x, q0y, q1x, q1y, q2x, q2y, q3x, q3y] = this.#quadrantBounds;

            dg.drawPolygon([q0x, q0y, x, q0y, x, q1y, q1x, q1y, q1x, y, q2x, y, q2x, q2y, x, q2y, x, q3y, q3x, q3y, q3x, y, q0x, y]);
        } else {
            dg.beginFill(0x00FF00, 0.2);
            dg.drawShape(this.#sourceBounds);
            dg.endFill();
        }

        dg.lineStyle(0);
    }
}
