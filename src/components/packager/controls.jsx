/* eslint-disable react/jsx-no-bind */
import React, {useContext, useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {RotateCcw} from 'lucide-react';

export const SettingsContext = React.createContext({
    tab: 'Export',
    translate: value => value,
    confirm: () => Promise.resolve(true)
});

export const Section = ({tab, reset, children}) => {
    const context = useContext(SettingsContext);
    return (
        <section hidden={tab !== context.tab}>
            {reset && <button
                className="reset-section"
                title={context.translate('reset.reset')}
                aria-label={context.translate('reset.reset')}
                onClick={() => {
                    context.confirm(context.translate('reset.reset'), context.translate('reset.confirm'))
                        .then(accepted => {
                            if (accepted) reset();
                        });
                }}
            ><RotateCcw size={16} /></button>}
            {children}
        </section>
    );
};
Section.propTypes = {tab: PropTypes.string, reset: PropTypes.func, children: PropTypes.node};

export const Button = ({text, onClick}) => <button onClick={onClick}>{text}</button>;
Button.propTypes = {text: PropTypes.string, onClick: PropTypes.func};

export const ImageInput = ({file, onChange, previewSizes}) => {
    const input = useRef();
    const [url, setURL] = useState(null);
    const {translate} = useContext(SettingsContext);
    useEffect(() => {
        if (!file) {
            setURL(null);
            return;
        }
        const next = URL.createObjectURL(file);
        setURL(next);
        return () => URL.revokeObjectURL(next);
    }, [file]);
    return (
        <div
            className="image-input"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
                e.preventDefault();
                const dropped = e.dataTransfer.files[0];
                if (dropped && /\.(png|jpe?g|bmp|svg|ico|gif)$/i.test(dropped.name)) onChange(dropped);
            }}
        >
            <input
                ref={input}
                type="file"
                accept=".png,.jpg,.jpeg,.bmp,.svg,.ico,.gif"
                aria-label={translate('fileInput.select')}
                onChange={e => {
                    if (e.target.files[0]) onChange(e.target.files[0]);
                }}
            />
            {file && <div className="image-preview">
                {url && previewSizes.map(([width, height]) => (<img
                    key={`${width}-${height}`}
                    src={url}
                    width={width}
                    height={height}
                    alt=""
                />))}
                <span>{file.name}</span>
                <button
                    onClick={() => {
                        input.current.value = ''; onChange(null);
                    }}
                >
                    {translate('fileInput.clear')}
                </button>
            </div>}
        </div>
    );
};
ImageInput.propTypes = {file: PropTypes.instanceOf(Blob),
    onChange: PropTypes.func,
    previewSizes: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])))};
ImageInput.defaultProps = {previewSizes: [[48, 48]]};

export const ColorPicker = ({value, onChange}) => (<input
    type="color"
    value={value}
    onChange={e => onChange(e.target.value)}
/>);
ColorPicker.propTypes = {value: PropTypes.string, onChange: PropTypes.func};

export const CustomExtensions = ({extensions, onChange}) => (<textarea
    aria-label="Custom extension URLs"
    value={extensions.join('\n')}
    onChange={e => onChange(e.target.value.split('\n').filter(Boolean))}
/>);
CustomExtensions.propTypes = {extensions: PropTypes.arrayOf(PropTypes.string), onChange: PropTypes.func};

export const LearnMore = ({slug, href}) => (<a
    href={slug ? `https://docs.turbowarp.org/${slug}` : href}
    title="Learn more"
    target="_blank"
    rel="noopener noreferrer"
>{'(?)'}</a>);
LearnMore.propTypes = {slug: PropTypes.string, href: PropTypes.string};
