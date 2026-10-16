const spawnFractchWorker = () => new Worker(new URL('./fractch.worker.js', import.meta.url), {type: 'module'});

export default spawnFractchWorker;
