import React from 'react';
import GUI from '../containers/gui.jsx';
import {isStudentSession} from '../lib/rotur/student-flag.js';

const searchParams = new URLSearchParams(location.search);
const cloudHost = searchParams.get('cloud_host') || 'wss://clouddata.turbowarp.org';

const RenderGUI = props => {
    const student = isStudentSession();
    return (
        <GUI
            cloudHost={student ? null : cloudHost}
            canUseCloud={!student}
            hasCloudPermission={!student}
            canSave={false}
            basePath={process.env.ROOT}
            canEditTitle
            enableCommunity
            {...props}
        />
    );
};

export default RenderGUI;
