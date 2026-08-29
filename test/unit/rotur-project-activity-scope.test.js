import ProjectActivityScope from '../../src/lib/rotur/project-activity-scope.js';

test('removes activities added by a project when its scope is cleared', async () => {
    const callRotur = jest.fn(() => Promise.resolve());
    const scope = new ProjectActivityScope(callRotur);

    await scope.call('socket.addActivity', [{id: 'project-123', title: 'Playing'}]);
    await scope.clear();

    expect(callRotur).toHaveBeenLastCalledWith('socket.removeActivity', ['project-123']);
});

test('does not remove an activity the project already cleared', async () => {
    const callRotur = jest.fn(() => Promise.resolve());
    const scope = new ProjectActivityScope(callRotur);

    await scope.call('socket.addActivity', [{id: 'project-123'}]);
    await scope.call('socket.removeActivity', ['project-123']);
    callRotur.mockClear();
    await scope.clear();

    expect(callRotur).not.toHaveBeenCalled();
});

test('removes an activity whose add finishes after the scope was cleared', async () => {
    let finishAdd;
    const callRotur = jest.fn(method => {
        if (method === 'socket.addActivity') {
            return new Promise(resolve => {
                finishAdd = resolve;
            });
        }
        return Promise.resolve();
    });
    const scope = new ProjectActivityScope(callRotur);

    const adding = scope.call('socket.addActivity', [{id: 'project-123'}]);
    await scope.clear();
    finishAdd();
    await adding;

    expect(callRotur).toHaveBeenLastCalledWith('socket.removeActivity', ['project-123']);
});
