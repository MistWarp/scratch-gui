import React from 'react';
import PropTypes from 'prop-types';
import dropdownCaret from './dropdown-caret.svg?raw';

const ChevronDown = ({size = 8, ...props}) => {
    const height = size * (5 / 8);

    return (
        <svg
            viewBox="0 0 8 5"
            width={size}
            height={height}
            {...props}
            // Safe: the markup is a static SVG file bundled at build time, never user input.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{__html: dropdownCaret}}
        />
    );
};

ChevronDown.propTypes = {
    size: PropTypes.number
};

export default ChevronDown;
