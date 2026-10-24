const CONTEXT_LINES = 3;

const groupedHunks = result => {
    const groups = [];
    for (const hunk of result.hunks || []) {
        const previous = groups[groups.length - 1];
        const previousHunk = previous?.[previous.length - 1];
        const oldGap = previousHunk ? hunk.oldStart - (previousHunk.oldStart + previousHunk.oldLines) : Infinity;
        const newGap = previousHunk ? hunk.newStart - (previousHunk.newStart + previousHunk.newLines) : Infinity;
        if (previous && oldGap <= CONTEXT_LINES * 2 && newGap <= CONTEXT_LINES * 2) previous.push(hunk);
        else groups.push([hunk]);
    }
    return groups;
};

const appendUnifiedHunks = (lines, result) => {
    for (const group of groupedHunks(result)) {
        const first = group[0];
        const last = group[group.length - 1];
        const oldStart = Math.max(1, first.oldStart - CONTEXT_LINES);
        const newStart = Math.max(1, first.newStart - CONTEXT_LINES);
        const oldEnd = Math.min(result.linesA.length, last.oldStart - 1 + last.oldLines + CONTEXT_LINES);
        const newEnd = Math.min(result.linesB.length, last.newStart - 1 + last.newLines + CONTEXT_LINES);
        lines.push(`@@ -${oldStart},${oldEnd - oldStart + 1} +${newStart},${newEnd - newStart + 1} @@`);
        let oldIndex = oldStart - 1;
        let newIndex = newStart - 1;
        for (const hunk of group) {
            const changedOldIndex = hunk.oldStart - 1;
            const changedNewIndex = hunk.newStart - 1;
            while (oldIndex < changedOldIndex && newIndex < changedNewIndex) {
                lines.push(` ${result.linesA[oldIndex] || ''}`);
                oldIndex++;
                newIndex++;
            }
            for (const item of hunk.changes || []) {
                lines.push(`${item.type === 'add' ? '+' : '-'}${item.content || ''}`);
            }
            oldIndex = changedOldIndex + hunk.oldLines;
            newIndex = changedNewIndex + hunk.newLines;
        }
        while (oldIndex < oldEnd && newIndex < newEnd) {
            lines.push(` ${result.linesA[oldIndex] || ''}`);
            oldIndex++;
            newIndex++;
        }
    }
};

export {
    CONTEXT_LINES,
    appendUnifiedHunks
};
