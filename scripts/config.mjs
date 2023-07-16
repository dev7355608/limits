import { MODULE_ID } from "./const.mjs";
import { VolumeData } from "./data/models.mjs";

export class LimitsConfig extends DocumentSheet {
    /** @override */
    static _getInheritanceChain() {
        return [];
    }

    /** @override */
    static name = "LimitsConfig";

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "token-sheet"],
            id: `${MODULE_ID}-config`,
            template: `modules/${MODULE_ID}/templates/config.hbs`,
            width: 440,
            height: "auto"
        });
    }

    /**
     * @param {DocumentSheet} sheet
     * @param {string[]} selectors
     * @param {string} position
     * @param {(html: string) => string} [wrap]
     */
    static inject(sheet, selectors, position, wrap = (s) => s) {
        let element;

        for (const selector of selectors) {
            element = element ? element.closest(selector) : sheet.element[0].querySelector(selector);
        }

        element.insertAdjacentHTML(position, wrap(`\
           <div class="form-group">
                <label>${game.i18n.localize("LIMITS.LimitsLabel")}</label>
                <div class="form-fields">
                    <button type="button" name="flags.${MODULE_ID}" class="${MODULE_ID}--button">
                        <i class="fas fa-eye"></i>
                        ${game.i18n.localize("LIMITS.ConfigureLimits")}
                    </button>
                </div>
                <p class="notes">${game.i18n.localize("LIMITS.LimitsHint")}</p>
            </div>`));
        sheet.form.querySelector(`button[name="flags.${MODULE_ID}"]`)
            .addEventListener("click", event => {
                event.preventDefault();

                new LimitsConfig(sheet.object).render(true);
            });

        sheet.options.height = "auto";
        sheet.position.height = "auto";
        sheet.setPosition(sheet.position);
    }

    /** @override */
    get id() {
        return `${this.constructor.name}-${this.document.uuid.replace(/\./g, "-")}`;
    }

    /** @override */
    get title() {
        const name = this.document.name || game.i18n.localize(this.document.constructor.metadata.label);

        return `${game.i18n.localize("LIMITS.ConfigureLimits")}: ${name}`;
    }

    /** @override */
    getData(options) {
        const baseData = {};
        const data = foundry.utils.mergeObject(baseData, super.getData(options));

        if (!this._sight) {
            const limits = new VolumeData(data.data.flags[MODULE_ID] ?? {});

            this._sight = [];

            for (const mode of Object.values(CONFIG.Canvas.detectionModes)) {
                if (mode.tokenConfig && mode.id in limits.sight) {
                    this._sight.push({
                        id: mode.id,
                        label: game.i18n.localize(mode.label),
                        enabled: limits.sight[mode.id]?.enabled,
                        range: limits.sight[mode.id]?.range
                    });
                }
            }

            this._sight.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
            this._light = foundry.utils.deepClone(limits.light);
            this._sound = foundry.utils.deepClone(limits.sound);

            if (this._sight.length === 0) {
                this._sight.push({ id: "", range: null, enabled: true });
            }
        }

        const scene = this.document instanceof Scene
            ? this.document
            : this.document.parent instanceof Scene
                ? this.document.parent : null;

        return foundry.utils.mergeObject(
            data,
            {
                sight: this._sight,
                light: this._light,
                sound: this._sound,
                detectionModes: Object.values(CONFIG.Canvas.detectionModes).filter(m => m.tokenConfig),
                gridUnits: scene?.grid.units || game.system.gridUnits || game.i18n.localize("GridUnits"),
                submitText: game.i18n.localize("Save Changes"),
                classPrefix: MODULE_ID
            }
        );
    }

    /** @override */
    render(force = false, options = {}) {
        return super.render(force, options);
    }

    /** @override */
    activateListeners(html) {
        html.find('button[type="reset"]').click(this._onResetForm.bind(this));
        html.find(".action-button").click(this._onClickActionButton.bind(this));

        return super.activateListeners(html);
    }

    /** @param {PointerEvent} event */
    _onClickActionButton(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const action = button.dataset.action;
        game.tooltip.deactivate();

        switch (action) {
            case "addDetectionMode":
                this._sight.push({ id: "", range: null, enabled: true });
                break;
            case "removeDetectionMode":
                this._sight.splice(button.closest(".detection-mode").dataset.index, 1);

                if (this._sight.length === 0) {
                    this._sight.push({ id: "", range: null, enabled: true });
                }
                break;
        }

        this.render();
    }

    /** @override */
    async _onChangeInput(event) {
        await super._onChangeInput(event);

        const name = event.currentTarget.name;

        if (name.startsWith("sight.")) {
            const i = event.currentTarget.closest(".detection-mode").dataset.index;
            const limit = this._sight[i];

            limit.id = this.form.querySelector(`[name="sight.${i}.id"]`).value;
            limit.range = this.form.querySelector(`[name="sight.${i}.range"]`).value;
            limit.enabled = this.form.querySelector(`[name="sight.${i}.enabled"]`).checked;
        } else if (name.startsWith("light.")) {
            const limit = this._light;

            limit.range = this.form.querySelector(`[name="light.range"]`).value;
            limit.enabled = this.form.querySelector(`[name="light.enabled"]`).checked;
        } else if (name.startsWith("sound.")) {
            const limit = this._sound;

            limit.range = this.form.querySelector(`[name="sound.range"]`).value;
            limit.enabled = this.form.querySelector(`[name="sound.enabled"]`).checked;
        }
    }

    /** @param {PointerEvent} event */
    _onResetForm(event) {
        event.preventDefault();

        this._sight = [{ id: "", range: null, enabled: true }];
        this._light.enabled = false;
        this._light.range = null;
        this._sound.enabled = false;
        this._sound.range = null;
        this.render();
    }

    /** @override */
    _getSubmitData(updateData = {}) {
        const formData = foundry.utils.expandObject(super._getSubmitData(updateData));

        formData.sight = Object.fromEntries(Object.values(formData.sight ?? [])
            .filter(({ id }) => id).map(({ id, range, enabled }) => [id, { range, enabled }]));

        return foundry.utils.flattenObject({ flags: { [MODULE_ID]: formData } });
    }

    /** @override */
    async _updateObject(event, formData) {
        formData = foundry.utils.expandObject(formData);

        const flags = this.document.toObject().flags[MODULE_ID] ?? {};

        if (foundry.utils.isEmpty(flags)) {
            const updateData = foundry.utils.expandObject(formData).flags[MODULE_ID];

            if (!updateData.light.enabled && updateData.light.range == null
                && Object.values(updateData.sight).every((mode) => !mode.enabled && mode.range == null)
                && !updateData.sound.enabled && updateData.sound.range == null) {
                return;
            }
        }

        for (const id of Object.keys(flags.sight ?? {})) {
            if (!foundry.utils.hasProperty(formData, `flags.${MODULE_ID}.sight.${id}`)
                && CONFIG.Canvas.detectionModes[id]?.tokenConfig) {
                formData[`flags.${MODULE_ID}.sight.-=${id}`] = null;
            }
        }

        return this.document.update(formData, { render: false });
    }
}
