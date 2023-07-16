import { BitmaskField, MapField, VariantDataField } from "./fields.mjs";

export class FigureData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const schema = {};

        schema.x = new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0 });
        schema.y = new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0 });
        schema.rotation = new foundry.data.fields.AngleField({ required: true });
        schema.shape = new foundry.data.fields.EmbeddedDataField(foundry.data.ShapeData, { required: true });
        schema.texture = new foundry.data.TextureData({ required: true });
        schema.mask = new BitmaskField({ required: true, initial: -1 });

        return schema;
    }
}

export class BoundaryData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const schema = {};

        schema.type = new foundry.data.fields.StringField({ required: true });
        schema.data = new VariantDataField({
            cylinder: CylinderData,
            sphere: SphereData
        });
        schema.mask = new BitmaskField({ required: true, initial: -1 });

        return schema;
    }
}

export class CylinderData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const schema = {};

        schema.base = new foundry.data.fields.ArrayField(
            new foundry.data.fields.EmbeddedDataField(FigureData, { required: true }),
            { required: true }
        );
        schema.bottom = new foundry.data.fields.NumberField({ required: true, nullable: true, initial: null });
        schema.top = new foundry.data.fields.NumberField({ required: true, nullable: true, initial: null });

        return schema;
    }
}

export class SphereData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const schema = {};

        schema.x = new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0 });
        schema.y = new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0 });
        schema.radius = new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0 });

        return schema;
    }
}

export class VolumeData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const rangeField = () => new foundry.data.fields.SchemaField({
            enabled: new foundry.data.fields.BooleanField({ required: true }),
            range: new foundry.data.fields.NumberField({
                required: true,
                initial: null,
                nullable: true,
                min: 0,
                step: 0.01
            })
        });
        const schema = {};

        schema.hidden = new foundry.data.fields.BooleanField({ required: true });
        schema.boundaries = new foundry.data.fields.ArrayField(
            new foundry.data.fields.EmbeddedDataField(BoundaryData, { required: true }),
            { required: true }
        );
        schema.priority = new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            initial: 0,
            min: Number.MIN_SAFE_INTEGER,
            max: Number.MAX_SAFE_INTEGER
        });
        schema.mode = new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            initial: 0,
            min: 0,
            max: 4
        });
        schema.light = rangeField();
        schema.sight = new MapField(rangeField());
        schema.sound = rangeField();

        return schema;
    }
}
