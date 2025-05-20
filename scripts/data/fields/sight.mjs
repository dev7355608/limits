/**
 * @extends {foundry.data.fields.NumberField}
 */
export default class SightField extends foundry.data.fields.SetField {
    constructor() {
        super(new foundry.data.fields.StringField({ required: true, nullable: false, blank: false }));
    }

    /** @override */
    _cleanType(value, options) {
        value = super._cleanType(value, options);
        value.sort();

        const n = value.length;
        let k = 0;

        for (let i = 0; i + 1 < n; i++) {
            if (value[i] === value[i + 1]) {
                k++;
            } else if (k !== 0) {
                value[i - k] = value[i];
            }
        }

        if (k !== 0) {
            value[n - 1 - k] = value[n - 1];
            value.length -= k;
        }

        return value;
    }

    /** @override */
    _toInput(config) {
        config.options = Object.entries(CONFIG.Canvas.detectionModes).map(([value, { label }]) => ({ value, label }));
        config.localize = true;
        config.sort = true;

        return foundry.applications.fields.createMultiSelectInput(config);
    }
}
