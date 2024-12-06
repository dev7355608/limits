/**
 * @param {typeof foundry.canvas.perception.DetectionMode} DetectionMode
 * @returns {typeof foundry.canvas.perception.DetectionMode}
 */
export const DetectionModeMixin = (DetectionMode) => class extends DetectionMode {
    /** @override */
    _testPoint(visionSource, mode, target, test) {
        if (!super._testPoint(visionSource, mode, target, test)) {
            return false;
        }

        let point;

        if (game.release.generation >= 13) {
            point = test.point;
        } else {
            const { x, y } = test.point;

            point = TEMP_POINT;
            point.x = x;
            point.y = y;
            point.elevation = test.elevation;
        }

        return visionSource._testLimit(mode, point);
    }
};

export default DetectionModeMixin;

/** @type {foundry.types.ElevatedPoint} */
const TEMP_POINT = { x: 0.0, y: 0.0, elevation: 0.0 };
