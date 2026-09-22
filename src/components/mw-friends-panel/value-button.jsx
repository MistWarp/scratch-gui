import PropTypes from 'prop-types';
import React from 'react';

import Button from '../button/button.jsx';

class ValueButton extends React.Component {
    constructor (props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick () {
        this.props.onPress(this.props.value);
    }

    render () {
        const {onPress, value, ...props} = this.props;
        return (
            <Button
                {...props}
                onClick={this.handleClick}
            />
        );
    }
}

ValueButton.propTypes = {
    onPress: PropTypes.func.isRequired,
    value: PropTypes.any
};

export default ValueButton;
