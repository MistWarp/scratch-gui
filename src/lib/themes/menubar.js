import alignLeftIcon from '../../components/menu-bar/tw-align-left.svg';
import alignCenterIcon from '../../components/menu-bar/tw-align-center.svg';
import alignRightIcon from '../../components/menu-bar/tw-align-right.svg';

const MENUBAR_ALIGN = {
    left: {
        defaultMessage: 'Left',
        description: 'Label for left-aligned menu bar',
        id: 'tw.menuBar.align.left',
        icon: alignLeftIcon
    },
    center: {
        defaultMessage: 'Center',
        description: 'Label for center-aligned menu bar',
        id: 'tw.menuBar.align.center',
        icon: alignCenterIcon
    },
    right: {
        defaultMessage: 'Right',
        description: 'Label for right-aligned menu bar',
        id: 'tw.menuBar.align.right',
        icon: alignRightIcon
    }
};
const MENUBAR_ALIGN_DEFAULT = 'center';

export {
    MENUBAR_ALIGN,
    MENUBAR_ALIGN_DEFAULT
};
