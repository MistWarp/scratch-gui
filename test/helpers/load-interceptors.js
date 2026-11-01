import VM from 'scratch-vm';

const withLoadProjectInterceptors = vm => {
    const loadDirectly = vm.loadProject || (() => Promise.resolve());
    vm._loadProjectInterceptors = [];
    vm._loadProjectDirectly = loadDirectly;
    vm.loadProject = VM.prototype.loadProject;
    vm.addLoadProjectInterceptor = VM.prototype.addLoadProjectInterceptor;
    return vm;
};

export default withLoadProjectInterceptors;
