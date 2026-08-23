/* eslint-disable max-len */
import React, {useEffect} from 'react';
import {Link} from 'react-router-dom';
import setPageMeta from '../page-meta.js';
import styles from './InfoPage.module.css';

const NotFound = () => {
    useEffect(() => setPageMeta({title: 'Page not found'}), []);
    return <main className={`${styles.page} ${styles.notFound}`}><div><h1>404</h1><h2>That page does not exist.</h2><p><Link className={styles.link} to="/">Return to the MistWarp home page</Link></p></div></main>;
};

export default NotFound;
