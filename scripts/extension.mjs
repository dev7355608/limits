import { LimitsConfig } from "./config.mjs";
import { MODULE_ID } from "./const.mjs";
import { VolumeData } from "./data/models.mjs";
import { Volume, VolumeCollection } from "./volume.mjs";

/**
 * @abstract
 */
export class Extension {
    /**
     * @param {Document} document
     * @returns {object}
     */
    getFlags(document) {
        return foundry.utils.deepClone(document.flags[MODULE_ID]);
    }

    /**
     * @param {Document} document
     * @param {VolumeData} data
     * @abstract
     */
    prepareVolumeData(document, data) {
        throw new Error("Not implemented");
    }

    /**
     * @param {Document} document
     * @param {boolean} [deleted=false]
     */
    updateVolume(document, deleted = false) {
        const id = document.uuid;
        let volume = VolumeCollection.instance.get(id);
        let flags;

        if (!deleted && !foundry.utils.isEmpty(flags = this.getFlags(document))) {
            if (!volume) {
                volume = new Volume(id);
                VolumeCollection.instance.set(id, volume);
            }

            const data = new VolumeData(flags);

            this.prepareVolumeData(document, data);
            volume.update(data.toObject());
        } else if (volume) {
            volume.destroy();
            VolumeCollection.instance.delete(id);
        }
    }

    /**
     * @param {DocumentSheet} sheet
     * @param {string[]} selectors
     * @param {string} position
     * @param {(html: string) => string} [wrap]
     */
    injectConfig(sheet, selectors, position, wrap) {
        LimitsConfig.inject(sheet, selectors, position, wrap);
    }
}
