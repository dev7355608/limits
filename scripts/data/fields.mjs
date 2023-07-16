export class BitmaskField extends foundry.data.fields.DataField {
    /** @override */
    static get _defaults() {
        return foundry.utils.mergeObject(super._defaults, {
            initial: 0,
            nullable: false
        });
    }

    /** @override */
    _cast(value) {
        return Number(value);
    }

    /** @override */
    _cleanType(value, options) {
        value = super._cleanType(value, options);

        if (typeof value !== "number") {
            return value;
        }

        return value | 0;
    }

    /** @override */
    _validateType(value) {
        if (value !== (value | 0)) {
            throw new Error("must be a signed 32-bit integer");
        }
    }
}

export class MapField extends foundry.data.fields.DataField {
    /**
     * @param {DataField} element
     * @param {DataFieldOptions} [options]
     */
    constructor(element, options) {
        super(options);

        this.element = this.constructor._validateElementType(element);
    }

    /** @override */
    static get _defaults() {
        return foundry.utils.mergeObject(super._defaults, {
            required: true,
            nullable: false,
            initial: () => ({})
        });
    }

    /** @override */
    static recursive = true;

    static _validateElementType(element) {
        if (!(element instanceof foundry.data.fields.DataField)) {
            throw new Error(`${this.name} must have a DataField as its contained element`);
        }

        return element;
    }

    /** @override */
    _cast(value) {
        return typeof value === "object" ? value : {};
    }

    /** @override */
    _cleanType(value, options = {}) {
        options.source = options.source || value;

        for (const name in value) {
            value[name] = this.element.clean(value[name], options);
        }

        return value;
    }

    /** @override */
    initialize(value, model, options = {}) {
        if (!value) {
            return value;
        }

        const data = {};

        for (const name in value) {
            const v = this.element.initialize(value[name], model, options);

            if (this.element.readonly) {
                Object.defineProperty(data, name, { value: v, writable: false });
            } else if (typeof v === "function" && !v.prototype) {
                Object.defineProperty(data, name, { get: v, set() { }, configurable: true });
            } else {
                data[name] = v;
            }
        }

        return data;
    }

    /** @override */
    _validateType(data, options = {}) {
        if (!(data instanceof Object)) {
            throw new Error("must be an object");
        }

        options.source = options.source || data;

        const schemaFailure = new foundry.data.validation.DataModelValidationFailure();

        for (const key in data) {
            const value = data[key];
            const failure = this.element.validate(value, options);

            if (failure) {
                schemaFailure.fields[key] = failure;

                if (!failure.unresolved && failure.fallback) {
                    continue;
                }

                if (options.fallback) {
                    const initial = this.element.getInitialValue(options.source);

                    if (this.element.validate(initial, { source: options.source }) === undefined) {
                        data[key] = initial;
                        failure.fallback = initial;
                    } else {
                        failure.unresolved = schemaFailure.unresolved = true;
                    }
                } else {
                    failure.unresolved = schemaFailure.unresolved = true;
                }
            }
        }

        if (!foundry.utils.isEmpty(schemaFailure.fields)) {
            return schemaFailure;
        }
    }

    /** @override */
    _validateModel(changes, options = {}) {
        options.source = options.source || changes;

        if (!changes) {
            return;
        }

        for (const name in changes) {
            const change = changes[name];

            if (change && this.element.constructor.recursive) {
                this.element._validateModel(change, options);
            }
        }
    }

    /** @override */
    toObject(value) {
        if (value == null) {
            return value;
        }

        const data = {};

        for (const name in value) {
            data[name] = this.element.toObject(value[name]);
        }

        return data;
    }

    /** @override */
    apply(fn, data = {}, options = {}) {
        const results = {};

        for (const key in data) {
            const r = this.element.apply(fn, data[key], options);

            if (!options.filter || !foundry.utils.isEmpty(r)) {
                results[key] = r;
            }
        }

        return results;
    }
}

export class VariantDataField extends foundry.data.fields.TypeDataField {
    /**
     * The data models of this variant data type.
     * @type {{[type: string]: DataModel}}
     */
    #dataModels;

    /**
     * @param {{[type: string]: DataModel}} dataModels
     * @param {DataFieldOptions} [options]
     */
    constructor(dataModels, options) {
        super(foundry.abstract.Document, options);

        this.#dataModels = Object.freeze({ ...dataModels });
    }

    /** @override */
    static getModelProvider(model) {
        return null;
    }

    /** @override */
    getModelForType(type) {
        return this.#dataModels[type] ?? null;
    }

    /** @override */
    getInitialValue(data) {
        return this.getModelForType(data.type)?.cleanData() ?? {};
    }
}
