import React from 'react';
import {APP_NAME} from '../../lib/constants/brand';
import {isScratchDesktop} from '../../lib/utils/isScratchDesktop';
import CloseButton from '../close-button/close-button.jsx';
import styles from './tw-news.css';
import {local} from '../../modules/storage';

const LOCAL_STORAGE_KEY = 'tw:closedNews';
const NEWS_ID = 'vanilla-compatible-extendables';

const getIsClosedInLocalStorage = () => local.readString(LOCAL_STORAGE_KEY) === NEWS_ID;

const markAsClosedInLocalStorage = () => {
    local.writeString(LOCAL_STORAGE_KEY, NEWS_ID);
};

class TWNews extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            closed: getIsClosedInLocalStorage()
        };
        this.handleClose = this.handleClose.bind(this);
    }
    handleClose () {
        markAsClosedInLocalStorage();
        this.setState({
            closed: true
        }, () => {
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('resize'));
            });
        });
    }
    render () {
        if (this.state.closed || isScratchDesktop()) {
            return null;
        }
        return (
            <div className={styles.news}>
                <div className={styles.text}>
                    {/* eslint-disable-next-line max-len */}
                    {`New in ${APP_NAME}: Vanilla Compatible Extendables. Operators like +, and, or and join can now hold extra inputs!`}
                </div>
                <CloseButton
                    className={styles.close}
                    onClick={this.handleClose}
                />
            </div>
        );
    }
}

export default TWNews;
