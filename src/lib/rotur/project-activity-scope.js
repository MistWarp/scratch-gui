class ProjectActivityScope {
    constructor (call) {
        this.callRotur = call;
        this.activityIds = new Set();
        this.active = true;
    }

    async call (method, args = []) {
        const activityId = method === 'socket.addActivity' && args[0] && args[0].id;
        const result = await this.callRotur(method, args);

        if (activityId) {
            if (this.active) {
                this.activityIds.add(activityId);
            } else {
                await this.callRotur('socket.removeActivity', [activityId]);
            }
        } else if (method === 'socket.removeActivity' && args[0]) {
            this.activityIds.delete(args[0]);
        }

        return result;
    }

    clear () {
        this.active = false;
        const removals = Array.from(this.activityIds, activityId => (
            Promise.resolve(this.callRotur('socket.removeActivity', [activityId])).catch(() => {})
        ));
        this.activityIds.clear();
        return Promise.all(removals);
    }
}

export default ProjectActivityScope;
