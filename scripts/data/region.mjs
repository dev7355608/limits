import PointSourcePolygonConstraint from "../canvas/geometry/constraint.mjs";
import { TYPE } from "../const.mjs";
import { getSpace, invalidateGeometry, invalidateSpaces, isRegionIncludedInSpace } from "../limits/_module.mjs";

/**
 * @param {typeof foundry.documents.RegionDocument} RegionDocument
 * @returns {typeof foundry.documents.RegionDocument}
 */
export const RegionDocumentMixin = (RegionDocument) => class extends RegionDocument {
    /** @override */
    _onPolygonTreeChange() {
        super._onPolygonTreeChange();

        invalidateGeometry(this);
    }

    /**
     * @param {object} copy
     * @param {object} diff
     * @param {object} options
     * @param {object} state
     * @override
     */
    _updateCommit(copy, diff, options, state) {
        super._updateCommit(copy, diff, options, state);

        if ("elevation" in diff) {
            invalidateGeometry(this);
        }

        if ("levels" in diff) {
            for (const behavior of this.behaviors) {
                if (behavior.type !== TYPE || !behavior.active) {
                    continue;
                }

                invalidateSpaces(behavior);
            }
        } else if ("restriction" in diff) {
            for (const behavior of this.behaviors) {
                if (behavior.type !== TYPE || !behavior.active) {
                    continue;
                }

                if (behavior.system.light || behavior.system.darkness) {
                    invalidateSpaces(behavior);
                }
            }
        }
    }

    /**
     * @param {foundry.types.ElevatedPoint} origin
     * @param {foundry.types.PointSourcePolygonConfig} config
     * @override
     */
    _computeShapeConstraint(origin, config) {
        const polygon = super._computeShapeConstraint(origin, config);
        const { type: restrictionType, level } = polygon.config;

        if (restrictionType !== "move" && !isRegionIncludedInSpace(this)) {
            const scene = level.parent;
            const modeId = restrictionType === "sight" ? "lightPerception" : undefined;
            const space = getSpace(scene, [level.id], restrictionType, modeId);

            PointSourcePolygonConstraint.apply(polygon, space);
        }

        return polygon;
    }
};

export default RegionDocumentMixin;
