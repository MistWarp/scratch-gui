import React from 'react';
import dropdownCaret from '!!raw-loader!./dropdown-caret.svg';

const ChevronDown = ({ size = 8, ...props }) => {
    const height = size * (5 / 8);

    return (
        <svg
            viewBox="0 0 8 5"
            width={size}
            height={height}
            {...props}
            dangerouslySetInnerHTML={{ __html: dropdownCaret }}
        />
    );
};

export default ChevronDown;