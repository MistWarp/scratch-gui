export default () => {
    const menuBar = document.querySelector("[class*='menu-bar_menu-bar']");
    if (menuBar && menuBar.getBoundingClientRect) {
        const height = menuBar.getBoundingClientRect().height;
        if (height > 0) return height;
    }
    return 48;
};
