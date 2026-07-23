import React from 'react';
import {Globe, Link as LinkIcon, Lock, ChevronDown, Check} from 'lucide-react';
import {Dropdown, DropdownItem} from './ui/Dropdown.jsx';
import styles from './VisibilityMenu.module.css';

const OPTIONS = [
    {value: 'public', label: 'Shared', icon: Globe},
    {value: 'unlisted', label: 'Unlisted', icon: LinkIcon},
    {value: 'private', label: 'Unshared', icon: Lock}
];

const VisibilityMenu = ({value, onChange}) => {
    const current = OPTIONS.find(option => option.value === value) || OPTIONS[0];
    const CurrentIcon = current.icon;
    return (
        <Dropdown
            width={210}
            renderTrigger={({toggle}) => (
                <button
                    type="button"
                    className={styles.button}
                    onClick={toggle}
                    aria-label="Project visibility"
                >
                    <CurrentIcon size={16} />
                    {current.label}
                    <ChevronDown size={15} />
                </button>
            )}
        >
            {({close}) => OPTIONS.map(option => {
                const OptionIcon = option.icon;
                return (
                    <DropdownItem
                        key={option.value}
                        onClick={() => {
                            close();
                            if (option.value !== value) onChange(option.value);
                        }}
                    >
                        <OptionIcon size={15} />
                        {option.label}
                        {option.value === value ? (
                            <Check
                                size={14}
                                className={styles.check}
                            />
                        ) : null}
                    </DropdownItem>
                );
            })}
        </Dropdown>
    );
};

export default VisibilityMenu;
