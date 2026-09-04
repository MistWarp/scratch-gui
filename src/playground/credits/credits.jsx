import React from 'react';
import PropTypes from 'prop-types';
import render from '../app-target';
import styles from './credits.module.css';

import {APP_NAME} from '../../lib/constants/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';
import UserData from './users';

/* eslint-disable react/jsx-no-literals */

applyGuiColors(detectTheme());
document.documentElement.lang = 'en';

const User = ({image, text, href}) => (
    <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={styles.user}
    >
        <img
            loading="lazy"
            className={styles.userImage}
            src={image}
            width="60"
            height="60"
        />
        <div className={styles.userInfo}>
            {text}
        </div>
    </a>
);
User.propTypes = {
    image: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    href: PropTypes.string
};

const UserList = ({users}) => (
    <div className={styles.users}>
        {users.map((data, index) => (
            <User
                key={index}
                {...data}
            />
        ))}
    </div>
);
UserList.propTypes = {
    users: PropTypes.arrayOf(PropTypes.object)
};

const projects = {
    TurboWarp: {base: null},
    MistWarp: {base: 'TurboWarp'}
};

const links = {
    TurboWarp: 'https://turbowarp.org/',
    MistWarp: 'https://mistwarp.org/'
};

const getBaseChain = name => {
    const chain = [];
    let current = projects[name]?.base;

    while (current) {
        chain.push(current);
        current = projects[current]?.base;
    }

    return chain;
};

const chain = getBaseChain(APP_NAME);

const Credits = () => (
    <main className={styles.main}>
        <header className={styles.headerContainer}>
            <h1 className={styles.headerText}>
                {APP_NAME} Credits
            </h1>
        </header>
        <section>
            <h2>The {APP_NAME} Team</h2>
            <UserList users={UserData.team} />
        </section>
        <section>
            <p>
                The {APP_NAME} project is made possible by the work of many volunteers.
            </p>
        </section>
        <section>
            <h2>Forks and Code Usage</h2>
            {chain.map((base, i) => {
                const subject = i === 0 ? APP_NAME : chain[i - 1];

                return (
                    <p key={base}>
                        {subject} is based on <a href={links[base]}>{base}</a>.
                    </p>
                );
            })}
            <p>
                Scratch Paint is forked from <a href="https://penguinmod.com">Penguinmod</a>.
            </p>
            <p>
                {APP_NAME} uses some extension manager improvements from <a href="https://nitrobolt.org">NitroBolt</a>.
            </p>
        </section>
        <section>
            <h2>Scratch</h2>
            <p>
                {APP_NAME} is based on the work of the <a href="https://scratch.mit.edu/credits">Scratch contributors</a> but is not endorsed by Scratch in any way.
            </p>
            <p>
                <a href="https://scratch.mit.edu/donate">
                    Donate to support Scratch.
                </a>
            </p>
        </section>
        <section>
            <h2>Contributors</h2>
            <UserList users={UserData.contributors} />
        </section>
        <section>
            <h2>Addons</h2>
            <UserList users={UserData.addonDevelopers} />
        </section>
        <section>
            <h2>TurboWarp Extension Gallery</h2>
            <UserList users={UserData.extensionDevelopers} />
        </section>
        <section>
            <h2>Documentation</h2>
            <UserList users={UserData.docs} />
        </section>
        <section>
            <h2>Translators</h2>
            <p>
                More than 100 people have helped translate {APP_NAME} and its addons into many languages
                &mdash; far more than we could hope to list here.
            </p>
        </section>
        <section>
            <p>
                <i>
                    Individual contributors are listed in no particular order.
                    The order is randomized each visit.
                </i>
            </p>
        </section>
    </main>
);

render(<Credits />);
