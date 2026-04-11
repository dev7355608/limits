/** @type {WeakMap<Function, WeakRef<Function>>} */
const mixinCache = new WeakMap();

/**
 * @param {Function} classToMixin
 * @param {(classToMixin: Function) => Function} mixin
 * @returns {Function}
 */
export function applyMixin(classToMixin, mixin) {
    let mixedInClass = mixinCache.get(classToMixin)?.deref();

    if (mixedInClass) {
        return mixedInClass;
    }

    mixedInClass = mixin(classToMixin);

    const mixedInClassRef = new WeakRef(mixedInClass);

    mixinCache.set(classToMixin, mixedInClassRef);
    mixinCache.set(mixedInClass, mixedInClassRef);

    return mixedInClass;
}
