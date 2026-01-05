import {useEffect, useMemo, useRef} from 'react';
import PropTypes from 'prop-types';

import LazyScratchBlocks from '../../lib/tw-lazy-scratch-blocks';
import Utils from '../../lib/find-bar/Utils';

import {loadAddonMessagesForLocale, formatAddonMessage} from './addon-i18n';
import {waitForElement} from './dom-utils';
import FindBarController from './FindBarController';

import inputStyles from '../forms/input.css';

import './find-bar.css';

/**
 * The find bar component
 * @param {object} props the props for the component
 * @returns {void}
 */
export default function NativeFindBar ({vm, locale, activeTabIndex, isPlayerOnly}) {
    const activeTabIndexRef = useRef(activeTabIndex);
    activeTabIndexRef.current = activeTabIndex;

    const isPlayerOnlyRef = useRef(isPlayerOnly);
    isPlayerOnlyRef.current = isPlayerOnly;

    const localeRef = useRef(locale);
    localeRef.current = locale;

    const state = useMemo(() => ({
        cleanup: null
    }), []);

    useEffect(() => {
        let didUnmount = false;
        const abortController = new AbortController();

        const run = async () => {
            if (!vm || isPlayerOnlyRef.current) return;

            const ScratchBlocks = await LazyScratchBlocks.load().then(() => LazyScratchBlocks.get());
            if (didUnmount) return;

            const messages = await loadAddonMessagesForLocale(localeRef.current);
            if (didUnmount) return;

            const msg = (id, args) => formatAddonMessage(messages, `find-bar/${id}`, args);
            const msgAny = (fullId, args) => formatAddonMessage(messages, fullId, args);

            const utils = new Utils(vm, ScratchBlocks);

            const originalDoBlockClick = ScratchBlocks.Gesture &&
                ScratchBlocks.Gesture.prototype &&
                ScratchBlocks.Gesture.prototype.doBlockClick_;

            const findBar = new FindBarController({
                ScratchBlocks,
                utils,
                vm,
                msg,
                msgAny,
                inputClassName: inputStyles.inputForm,
                activeTabIndexRef,
                isPlayerOnlyRef
            });

            const installGesturePatch = () => {
                if (!originalDoBlockClick) return () => {};

                if (ScratchBlocks.Gesture.prototype.doBlockClick_.__mwFindBarPatched) {
                    return () => {};
                }

                const patched = function () {
                    /* eslint-disable no-invalid-this */
                    if (document.querySelector('.mw-native-find-bar')) {
                        if ((this.mostRecentEvent_.button === 1 ||
                        this.mostRecentEvent_.shiftKey) &&
                        findBar.findInput) {
                            let block = this.startBlock_;
                            for (; block; block = block.getSurroundParent()) {
                                if (block.type === 'procedures_definition' ||
                                (!this.jumpToDef && block.type === 'procedures_call')) {
                                    const id = block.id ? block.id : block.getId ? block.getId() : null;
                                    findBar.findInput.focus();
                                    findBar.showDropDown(id);
                                    return;
                                }

                                if (block.type === 'data_variable' ||
                                    block.type === 'data_changevariableby' ||
                                    block.type === 'data_setvariableto') {

                                    const id = block.getVars()[0];
                                    findBar.findInput.focus();
                                    findBar.showDropDown(id, block);
                                    findBar.selVarID = id;
                                    return;
                                }

                                if (
                                    block.type === 'event_whenbroadcastreceived' ||
                                    block.type === 'event_broadcastandwait' ||
                                    block.type === 'event_broadcast') {

                                    const id = block.id;
                                    findBar.findInput.focus();
                                    findBar.showDropDown(id, block);
                                    findBar.selVarID = id;
                                    return;
                                }
                            }
                        }
                    }

                    const result = originalDoBlockClick.call(this);
                    /* eslint-enable no-invalid-this */
                    return result;
                };
                patched.__mwFindBarPatched = true;

                ScratchBlocks.Gesture.prototype.doBlockClick_ = patched;

                return () => {
                    if (ScratchBlocks.Gesture.prototype.doBlockClick_ === patched) {
                        ScratchBlocks.Gesture.prototype.doBlockClick_ = originalDoBlockClick;
                    }
                };
            };

            const ensureInjected = async () => {
                if (didUnmount || isPlayerOnlyRef.current) return;

                const root = await waitForElement('ul[class*=gui_tab-list_]', {
                    signal: abortController.signal}
                ).catch(() => null);
                if (!root || didUnmount) return;

                if (root.querySelector('.mw-native-find-bar')) {
                    findBar.tabChanged();
                    return;
                }

                findBar.createDom(root);
                findBar.tabChanged();
            };

            const removeGesturePatch = installGesturePatch();

            const observer = new MutationObserver(() => {
                if (didUnmount) return;
                if (!document.querySelector('ul[class*=gui_tab-list_] .mw-native-find-bar')) {
                    ensureInjected();
                }
            });
            observer.observe(document.documentElement, {childList: true, subtree: true});

            await ensureInjected();

            state.cleanup = () => {
                observer.disconnect();
                removeGesturePatch();
                findBar.destroy();
            };
        };

        run();

        return () => {
            didUnmount = true;
            abortController.abort();
            if (state.cleanup) {
                state.cleanup();
                state.cleanup = null;
            }
        };
    }, [vm, state]);

    useEffect(() => {
        const el = document.querySelector('.mw-native-find-bar');
        if (el) {
            const visible = activeTabIndex === 0 ||
                            activeTabIndex === 1 ||
                            activeTabIndex === 2;
            el.hidden = !visible;
        }
    }, [activeTabIndex]);
    return null;
}

NativeFindBar.propTypes = {
    vm: PropTypes.shape({
        runtime: PropTypes.shape({
            targets: PropTypes.array,
            getBlocksJSON: PropTypes.func,
            getTargetById: PropTypes.func
        }).isRequired,
        setEditingTarget: PropTypes.func.isRequired
    }).isRequired,
    locale: PropTypes.string,
    activeTabIndex: PropTypes.number.isRequired,
    isPlayerOnly: PropTypes.bool
};

NativeFindBar.defaultProps = {
    locale: null,
    isPlayerOnly: false
};
