/**
 * The "Limit Range" Region Behavior Config.
 * @extends {foundry.applications.sheets.RegionBehaviorConfig}
 * @sealed
 */
export default class LimitRangeRegionBehaviorConfig extends foundry.applications.sheets.RegionBehaviorConfig {
    /** @override */
    static PARTS = foundry.utils.mergeObject(super.PARTS, { form: { scrollable: [""] } }, { inplace: false });

    /** @override */
    async _renderHTML(context, options) {
        const rendered = await super._renderHTML(context, options);

        rendered.form.classList.add("scrollable");

        return rendered;
    }
}
