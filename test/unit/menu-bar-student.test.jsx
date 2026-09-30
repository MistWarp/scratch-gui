/* eslint-disable react/display-name, react/jsx-no-bind */
import React from 'react';
import {mount} from 'enzyme';
import {IntlProvider} from 'react-intl';

import {MwEditorNav} from '../../src/components/menu-bar/mw-editor-nav.jsx';
import {RoturAccount} from '../../src/components/menu-bar/mw-rotur-account.jsx';
import {HelpMenu} from '../../src/components/menu-bar/help-menu.jsx';

jest.mock('../../src/components/menu-bar/mw-notifications.jsx', () => () => <div id="notifications" />);
jest.mock('../../src/lib/originchats/chat-ui.js', () => ({
    getChatUi: () => ({open: false}),
    subscribeChatUi: () => () => {},
    toggleChat: jest.fn()
}));
jest.mock('../../src/lib/originchats/connection.js', () => ({
    getChatConnection: () => ({getState: () => ({unread: 0}), subscribe: () => () => {}}),
    getDirectConnection: () => ({getState: () => ({unread: 0}), subscribe: () => () => {}})
}));
jest.mock('../../src/lib/rotur/session-api.js', () => ({getRoturSessionApi: () => null}));
jest.mock('../../src/lib/rotur/client.js', () => ({buildAuthUrl: () => 'https://rotur.dev/auth'}));
jest.mock('../../src/lib/community/enabled.js', () => true);
jest.mock('../../src/components/mw-avatar/avatar.jsx', () => () => <span id="avatar" />);
jest.mock('../../src/components/menu-bar/menu-bar-menu.jsx', () => ({children}) => <div>{children}</div>);
jest.mock('../../src/components/menu-bar/tw-menu-label.jsx', () => ({children}) => <div>{children}</div>);
jest.mock('../../src/containers/menu-item.jsx', () => ({children, onClick}) => (
    <button
        type="button"
        onClick={onClick}
    >{children}</button>
));
jest.mock('../../src/components/menu/menu.jsx', () => ({
    MenuSection: ({children}) => <div>{children}</div>,
    MenuItem: ({children, onClick}) => (
        <button
            type="button"
            onClick={onClick}
        >{children}</button>
    )
}));

const intl = {formatMessage: message => message.defaultMessage};

const renderIntl = element => mount(<IntlProvider locale="en">{element}</IntlProvider>);

describe('editor menu bar for students', () => {
    test('the editor nav renders nothing for a student', () => {
        const student = renderIntl(<MwEditorNav
            intl={intl}
            isStudent
            username="adaokafor~yumrk"
            projectId="p1"
            onOpenAnalytics={() => {}}
        />);
        expect(student.find('button')).toHaveLength(0);
        expect(student.find('a')).toHaveLength(0);
        expect(student.find('#notifications')).toHaveLength(0);
        student.unmount();
    });

    test('the editor nav keeps chat, my stuff, notifications and analytics for everyone else', () => {
        const teacher = renderIntl(<MwEditorNav
            intl={intl}
            isStudent={false}
            username="Mist"
            projectId="p1"
            onOpenAnalytics={() => {}}
        />);
        expect(teacher.find('[title="Chat"]').hostNodes()).toHaveLength(1);
        expect(teacher.find('a[href="/mystuff"]')).toHaveLength(1);
        expect(teacher.find('#notifications')).toHaveLength(1);
        expect(teacher.find('[title="Project analytics"]').hostNodes()).toHaveLength(1);
        teacher.unmount();
    });

    test('the account menu offers a student only Sign out', () => {
        const props = {
            username: 'adaokafor~yumrk',
            displayName: 'Ada Okafor',
            menuOpen: true,
            showEditorItems: true,
            onOpenLogin: () => {},
            onOpenMenu: () => {},
            onCloseMenu: () => {},
            onLogout: () => {}
        };
        const student = renderIntl(<RoturAccount
            {...props}
            studentMode
        />);
        const studentLabels = student.find('button').map(node => node.text());
        expect(studentLabels).toEqual(['Sign out']);
        expect(student.text()).toContain('Ada Okafor');
        student.unmount();
        const teacher = renderIntl(<RoturAccount
            {...props}
            studentMode={false}
        />);
        const teacherLabels = teacher.find('button').map(node => node.text());
        expect(teacherLabels)
            .toEqual(expect.arrayContaining(['Profile', 'Account settings', 'Switch account', 'Sign out']));
        teacher.unmount();
    });

    test('the help menu leaves out feedback for a student', () => {
        const props = {
            open: true,
            onOpenHelp: () => {},
            onOpenShortcuts: () => {},
            onRequestClose: () => {},
            onRequestOpen: () => {}
        };
        const student = renderIntl(<HelpMenu
            {...props}
            isStudent
        />);
        expect(student.text()).toContain('Documentation');
        expect(student.text()).not.toContain('Send feedback');
        student.unmount();
        const teacher = renderIntl(<HelpMenu
            {...props}
            isStudent={false}
        />);
        expect(teacher.text()).toContain('Send feedback');
        teacher.unmount();
    });
});
