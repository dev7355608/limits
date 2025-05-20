/**
 * @extends {foundry.data.fields.NumberField}
 */
export default class RangeField extends foundry.data.fields.NumberField {
    constructor() {
        super({ required: true, nullable: true, min: 0, step: 0.01 });
    }

    /** @override */
    toFormGroup(groupConfig = {}, inputConfig) {
        groupConfig.units ??= "GridUnits";

        return super.toFormGroup(groupConfig, inputConfig);
    }

    /** @override */
    _toInput(config) {
        Object.assign(config, {
            min: this.min,
            max: this.max,
            step: this.step,
            placeholder: "\uF534",
        });

        const input = foundry.applications.fields.createNumberInput(config);

        input.classList.add("placeholder-fa-solid", "limits--placeholder-font-size-12");

        return input;
    }
}
