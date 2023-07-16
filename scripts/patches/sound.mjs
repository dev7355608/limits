import { MODULE_ID } from "../const.mjs";
import { Constraint } from "./../constraint.mjs";
import { VolumeCollection } from "./../volume.mjs";

Hooks.once("libWrapper.Ready", () => {
    libWrapper.register(
        MODULE_ID,
        "SoundSource.prototype._createPolygon",
        function (wrapped, ...args) {
            return Constraint.apply(wrapped(...args), "sound", { scalingFactor: 100 });
        },
        libWrapper.WRAPPER,
        { perf_mode: libWrapper.PERF_FAST }
    );

    libWrapper.register(
        MODULE_ID,
        "SoundsLayer.prototype._syncPositions",
        function (listeners, options) {
            if (!this.placeables.length || game.audio.locked) return;
            const sounds = {};
            for (let sound of this.placeables) {
                const p = sound.document.path;
                const r = sound.radius;
                if (!p) continue;

                // Track one audible object per unique sound path
                if (!(p in sounds)) sounds[p] = { path: p, audible: false, volume: 0, sound };
                const s = sounds[p];
                if (!sound.isAudible) continue; // The sound may not be currently audible

                // Determine whether the sound is audible, and its greatest audible volume
                for (let l of listeners) {
                    if (!sound.source.active || !sound.source.shape?.contains(l.x, l.y)) continue;
                    s.audible = true;
                    let volume = sound.document.volume;
                    if (sound.document.easing) {
                        const soundZ = sound.source.elevation * canvas.dimensions.distancePixels;
                        const distance = Math.hypot(l.x - sound.x, l.y - sound.y, (l.z ?? soundZ) - soundZ);
                        const remainingEnergy = VolumeCollection.instance.castRay(
                            "sound", 0, sound.x, sound.y, soundZ, l.x, l.y, l.z ?? soundZ).remainingEnergy;
                        volume *= this._getEasingVolume(distance, r) * remainingEnergy;
                    }
                    if (!s.volume || (volume > s.volume)) s.volume = volume;
                }
            }

            // For each audible sound, sync at the target volume
            for (let s of Object.values(sounds)) {
                s.sound.sync(s.audible, s.volume, options);
            }
        },
        libWrapper.OVERRIDE,
        { perf_mode: libWrapper.PERF_FAST }
    );
});
