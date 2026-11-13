const loadAddonTranslations = (entries, locale) => {
    if (!Object.prototype.hasOwnProperty.call(entries, locale)) return Promise.resolve({});
    return entries[locale]().then(module => module.default, error => {
        console.warn('Could not download add-on translations', error);
        return {};
    });
};

export default loadAddonTranslations;
