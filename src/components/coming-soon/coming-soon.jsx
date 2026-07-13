import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {Tooltip} from 'react-tooltip';

import styles from './coming-soon.css';

import awwCatIcon from './aww-cat.png';
import coolCatIcon from './cool-cat.png';

const messages = defineMessages({
    message1: {
        defaultMessage: 'Don\'t worry, we\'re on it {emoji}',
        description: 'One of the "coming soon" random messages for yet-to-be-done features',
        id: 'gui.comingSoon.message1'
    },
    message2: {
        defaultMessage: 'Coming Soon...',
        description: 'One of the "coming soon" random messages for yet-to-be-done features',
        id: 'gui.comingSoon.message2'
    },
    message3: {
        defaultMessage: 'We\'re working on it {emoji}',
        description: 'One of the "coming soon" random messages for yet-to-be-done features',
        id: 'gui.comingSoon.message3'
    }
});

class ComingSoonContent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'setHide',
            'setShow',
            'getRandomMessage'
        ]);
        this.state = {
            isShowing: false
        };
    }
    setShow () {
        // needed to set the opacity to 1, since the default is .9 on show
        this.setState({isShowing: true});
    }
    setHide () {
        this.setState({isShowing: false});
    }
    getRandomMessage () {
        // randomly chooses a messages from `messages` to display in the tooltip.
        const images = [awwCatIcon, coolCatIcon];
        const messageNumber = Math.floor(Math.random() * Object.keys(messages).length) + 1;
        const imageNumber = Math.floor(Math.random() * Object.keys(images).length);
        return (
            <FormattedMessage
                {...messages[`message${messageNumber}`]}
                values={{
                    emoji: (
                        <img
                            className={styles.comingSoonImage}
                            src={images[imageNumber]}
                            draggable={false}
                        />
                    )
                }}
            />
        );
    }
    render () {
        return (
            <Tooltip
                afterHide={this.setHide}
                afterShow={this.setShow}
                className={classNames(
                    styles.comingSoon,
                    this.props.className,
                    {
                        [styles.show]: (this.state.isShowing)
                    }
                )}
                classNameArrow={styles.comingSoonArrow}
                id={this.props.tooltipId}
                place={this.props.place}
                render={this.getRandomMessage}
            />
        );
    }
}

ComingSoonContent.propTypes = {
    className: PropTypes.string,
    intl: intlShape,
    place: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    tooltipId: PropTypes.string.isRequired
};

ComingSoonContent.defaultProps = {
    place: 'bottom'
};

const ComingSoon = injectIntl(ComingSoonContent);

const ComingSoonTooltip = props => (
    <div className={props.className}>
        <div
            data-tooltip-delay-hide={props.delayHide}
            data-tooltip-delay-show={props.delayShow}
            data-tooltip-id={props.tooltipId}
            data-tooltip-place={props.place}
        >
            {props.children}
        </div>
        <ComingSoon
            className={props.tooltipClassName}
            place={props.place}
            tooltipId={props.tooltipId}
        />
    </div>
);

ComingSoonTooltip.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    delayHide: PropTypes.number,
    delayShow: PropTypes.number,
    place: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    tooltipClassName: PropTypes.string,
    tooltipId: PropTypes.string.isRequired
};

ComingSoonTooltip.defaultProps = {
    delayHide: 0,
    delayShow: 0
};

export {
    ComingSoon as ComingSoonComponent,
    ComingSoonTooltip
};
