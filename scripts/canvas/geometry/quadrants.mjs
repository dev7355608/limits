/**
 * @param {number} originX - The x-coordinate of the origin.
 * @param {number} originY - The y-coordinate of the origin.
 * @param {number[]} points - The points of the polygon (`[x0, y0, x1, y1, x2, y2, ...]`).
 * @returns {[x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number]}
 */
export default function computeQuadrantBounds(originX, originY, points) {
    let q0x = originX;
    let q1x = originX;
    let q2x = originX;
    let q3x = originX;
    let q0y = originY;
    let q1y = originY;
    let q2y = originY;
    let q3y = originY;
    let x1, y1, q1;
    let i = 0;
    const m = points.length;

    for (; i < m; i += 2) {
        x1 = points[i];
        y1 = points[i + 1];

        if (y1 > originY) {
            q1 = x1 >= originX ? 0 : 1;

            break;
        }

        if (y1 < originY) {
            q1 = x1 <= originX ? 2 : 3;

            break;
        }

        if (x1 !== originX) {
            q1 = x1 <= originX ? 1 : 3;

            break;
        }
    }

    if (i < m) {
        const i0 = i = (i + 2) % m;

        for (; ;) {
            const x2 = points[i];
            const y2 = points[i + 1];
            let q2;

            if (y2 > originY) {
                q2 = x2 >= originX ? 0 : 1;
            } else if (y2 < originY) {
                q2 = x2 <= originX ? 2 : 3;
            } else if (x2 !== originX) {
                q2 = x2 <= originX ? 1 : 3;
            } else {
                q2 = q1;
            }

            if (q2 !== q1) {
                let s;

                switch (q1) {
                    case 0:
                    case 2:
                        if (x2 !== x1) {
                            s = (originX - x1) / (x2 - x1);
                            x1 = originX;
                            y1 = y1 * (1 - s) + y2 * s;
                        } else {
                            s = 0;
                            x1 = originX;
                            y1 = originY;
                        }

                        break;
                    case 1:
                    case 3:
                        if (y2 !== y1) {
                            s = (originY - y1) / (y2 - y1);
                            x1 = x1 * (1 - s) + x2 * s;
                            y1 = originY;
                        } else {
                            s = 0;
                            x1 = originX;
                            y1 = originY;
                        }

                        break;
                }

                switch (q1) {
                    case 0:
                        if (s !== 0) {
                            q0x = max(q0x, x1);
                            q0y = max(q0y, y1);
                        }

                        q1x = min(q1x, x1);
                        q1y = max(q1y, y1);

                        break;
                    case 1:
                        if (s !== 0) {
                            q1x = min(q1x, x1);
                            q1y = max(q1y, y1);
                        }

                        q2x = min(q2x, x1);
                        q2y = min(q2y, y1);

                        break;
                    case 2:
                        if (s !== 0) {
                            q2x = min(q2x, x1);
                            q2y = min(q2y, y1);
                        }

                        q3x = max(q3x, x1);
                        q3y = min(q3y, y1);

                        break;
                    case 3:
                        if (s !== 0) {
                            q3x = max(q3x, x1);
                            q3y = min(q3y, y1);
                        }

                        q0x = max(q0x, x1);
                        q0y = max(q0y, y1);

                        break;
                }

                q1 = (q1 + 1) % 4;
            } else {
                switch (q2) {
                    case 0:
                        if (x1 !== originX || x2 !== originX) {
                            q0x = max(q0x, x2);
                            q0y = max(q0y, y2);
                        }

                        break;
                    case 1:
                        if (y1 !== originY || y2 !== originY) {
                            q1x = min(q1x, x2);
                            q1y = max(q1y, y2);
                        }

                        break;
                    case 2:
                        if (x1 !== originX || x2 !== originX) {
                            q2x = min(q2x, x2);
                            q2y = min(q2y, y2);
                        }

                        break;
                    case 3:
                        if (y1 !== originY || y2 !== originY) {
                            q3x = max(q3x, x2);
                            q3y = min(q3y, y2);
                        }

                        break;
                }

                i = (i + 2) % m;

                if (i === i0) {
                    break;
                }

                x1 = x2;
                y1 = y2;
                q1 = q2;
            }
        }
    }

    return [q0x, q0y, q1x, q1y, q2x, q2y, q3x, q3y];
}

/**
 * Minimum.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function min(x, y) {
    return x < y ? x : y;
}

/**
 * Maximum.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function max(x, y) {
    return x > y ? x : y;
}
