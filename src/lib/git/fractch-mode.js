let opener = null;

const setFractchModeOpener = value => {
    opener = value;
};

const openFractchMode = () => {
    if (opener) opener();
};

export {
    setFractchModeOpener,
    openFractchMode
};
