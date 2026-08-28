import React, {useEffect, useState} from 'react';
import {Navigate, useParams} from 'react-router-dom';
import api from '../api.js';

const VanityProject = () => {
    const {slug} = useParams();
    const [id, setId] = useState('');
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let active = true;
        setId('');
        setFailed(false);
        api.resolveVanity(slug)
            .then(data => {
                if (active) setId(data.id);
            })
            .catch(() => {
                if (active) setFailed(true);
            });
        return () => {
            active = false;
        };
    }, [slug]);
    if (id) return <Navigate replace to={`/project/${id}`} />;
    return (
        <main style={{maxWidth: 900, margin: '0 auto', padding: 40}}>
            {failed ? 'This project link does not exist.' : 'Finding project…'}
        </main>
    );
};

export default VanityProject;
