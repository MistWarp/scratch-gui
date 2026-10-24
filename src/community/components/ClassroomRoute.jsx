import React from 'react';
import {Outlet} from 'react-router-dom';
import {useClassroomAvailable} from '../classroom-availability.js';
import NotFound from '../pages/NotFound.jsx';
import RouteLoading from './RouteLoading.jsx';

const ClassroomRoute = () => {
    const {checked, available} = useClassroomAvailable();
    if (!checked) return <RouteLoading />;
    return available ? <Outlet /> : <NotFound />;
};

export default ClassroomRoute;
