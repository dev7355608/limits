import { MODES } from "../../const.mjs";

/**
 * @extends {foundry.data.fields.NumberField}
 */
export default class ModeField extends foundry.data.fields.NumberField {
    constructor() {
        super({
            required: true,
            nullable: false,
            initial: MODES.DOWNGRADE,
            choices: Object.values(MODES),
        });
    }

    /** @override */
    _toInput(config) {
        if (config.value === undefined) {
            config.value = this.getInitialValue({});
        }

        config.options = Object.entries(MODES).map(([key, value]) => ({ value, label: `LIMITS.MODES.${key}.label` }));
        config.localize = true;
        config.sort = false;
        config.dataset ??= {};
        config.dataset.dtype = "Number";

        const select = foundry.applications.fields.createSelectInput(config);
        const modes = foundry.utils.invertObject(MODES);

        select.dataset.tooltip = `LIMITS.MODES.${modes[select.value]}.hint`;
        select.dataset.tooltipDirection = "UP";
        select.setAttribute("onchange", `game.tooltip.deactivate(); this.dataset.tooltip = "LIMITS.MODES." + (${JSON.stringify(modes)})[this.value] + ".hint";`);

        return select;
    }
}
