const formatStatusRows = matrix => matrix.reduce((lines, [filepath, head, workdir, stage]) => {
    if (head === workdir && workdir === stage) return lines;
    if (head === 0 && workdir === 2 && stage === 0) {
        lines.push(`?? ${filepath}`);
        return lines;
    }
    const index = stage === 2 ? (head === 0 ? 'A' : 'M') : ' ';
    const working = workdir === 0 ? 'D' : (workdir === 2 && stage !== workdir ? 'M' : ' ');
    lines.push(`${index}${working} ${filepath}`);
    return lines;
}, []);

export {formatStatusRows};
