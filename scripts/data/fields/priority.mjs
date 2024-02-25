export default class PriorityField extends foundry.data.fields.NumberField {
    constructor() {
        super({
            required: true,
            nullable: false,
            integer: true,
            min: -2147483648,
            max: 2147483647,
            initial: 0,
        });
    }

    /** @override */
    _toInput(config) {
        Object.assign(config, {
            min: this.min,
            max: this.max,
            step: 1,
            placeholder: "0",
        });

        return foundry.applications.fields.createNumberInput(config);
    }
}
