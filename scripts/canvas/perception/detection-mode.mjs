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

        return visionSource._testLimit(this.id, mode.range, test.point, test.level);
    }
};

export default DetectionModeMixin;
