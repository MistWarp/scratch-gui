import projectData from './project-data';

/* eslint-disable import/no-unresolved */
import overrideDefaultProject from './override-default-project.sb3?arraybuffer';
import backdrop from './cd21514d0531fdffb22204e0ec5ed84a.svg?raw';
import costume1 from './fog.svg?raw';
/* eslint-enable import/no-unresolved */
import {TextEncoder} from '../tw-text-encoder';

const defaultProject = translator => {
    if (overrideDefaultProject.byteLength > 0) {
        return [{
            id: 0,
            assetType: 'Project',
            dataFormat: 'JSON',
            data: overrideDefaultProject
        }];
    }

    const encoder = new TextEncoder();

    const projectJson = projectData(translator);
    return [{
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: 'cd21514d0531fdffb22204e0ec5ed84a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(backdrop)
    }, {
        id: '3a1ada409351ee090e4052020189c1d8',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume1)
    }];
};

export default defaultProject;
