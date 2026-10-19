const spawnLintWorker = () => new Worker(new URL('./lint.worker.js', import.meta.url), {type: 'module'});

export default spawnLintWorker;
