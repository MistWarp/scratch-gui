/*
 * Helpers for using enzyme and react-test-renderer with react-intl
 * Directly from https://github.com/yahoo/react-intl/wiki/Testing-with-React-Intl
 */
import React from 'react';
import PropTypes from 'prop-types';
import renderer from 'react-test-renderer';
import {IntlProvider, intlShape} from 'react-intl';
import {Provider} from 'react-redux';
import {mount, shallow} from 'enzyme';
import configureStore from 'redux-mock-store';
import {Theme} from '../../src/lib/themes';

const intlProvider = new IntlProvider({locale: 'en'}, {});
const {intl} = intlProvider.getChildContext();

/*
 * Presentational components render theme-connected children (see
 * lib/tw-recolor/render.jsx), so connect() needs a store even when the test
 * only cares about the markup. react-redux 5 reads the store from legacy
 * context, so this can be injected without changing the mounted root.
 */
const defaultStore = configureStore()({
    locales: {
        isRtl: false,
        locale: 'en',
        messages: {}
    },
    scratchGui: {
        theme: {
            theme: new Theme()
        }
    }
});

const storeContextTypes = {store: PropTypes.object};

const nodeWithIntlProp = node => React.cloneElement(node, {intl});

const shallowWithIntl = (node, {context} = {}) => shallow(
    nodeWithIntlProp(node),
    {
        context: Object.assign({store: defaultStore}, context, {intl})
    }
);

const mountWithIntl = (node, {context, childContextTypes} = {}) => mount(
    nodeWithIntlProp(node),
    {
        context: Object.assign({store: defaultStore}, context, {intl}),
        childContextTypes: Object.assign({}, {intl: intlShape}, storeContextTypes, childContextTypes)
    }
);

// react-test-renderer component for use with snapshot testing
const componentWithIntl = (children, props = {locale: 'en'}) => renderer.create(
    <IntlProvider {...props}>
        <Provider store={defaultStore}>{children}</Provider>
    </IntlProvider>
);

export {
    componentWithIntl,
    shallowWithIntl,
    mountWithIntl,
    defaultStore
};
