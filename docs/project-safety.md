# Project replacement and recovery

Opening a file while editing a MistWarp project offers two destinations. **Open in new workspace** keeps the saved online project intact and clears the editor's save destination. **Replace project** keeps that destination and requires a manual save before the online copy changes. For an MWP file, **Replace project and history** imports the complete archive, including its branches, and explains that the next manual save replaces the online history.

Replacement operations first make a device backup. If the backup cannot be written, replacement stops. A failed operation restores the previous repository and, if loading began, the previous editor code. Edits made while a backup or download is pending stop the replacement. Device backups remain available until the user deletes them. Browser storage clearing can remove local backups, so downloaded files remain useful independent copies.

| Normal workflow | Protection |
| --- | --- |
| Open an SB3, MWP, or packaged HTML file | Explicit destination choice for an existing online project; backup and rollback; cancellation retains the previous file handle and title. |
| Start a new project using the menu or shortcut | Both use the same prompt and backup path when there are changes. |
| Switch projects or load a URL | Prompt for changed work; back up before changing code or repository; recover after a failed load. |
| Restore a device backup | Explain that it opens a new workspace; clear the old online destination after success. |
| Checkout a branch or commit, undo, merge, pull, clone, or delete history | Explain the specific replacement and offer Cancel; back up before mutation. Clones open a new workspace. |
| Create a branch | Keep current edits without reloading an older snapshot. |
| Inspect files, commits, or pull requests | Preserve the raw repository, including uncommitted files and incomplete repositories, then restore it after inspection. |
| Open or duplicate another editor tab | Copy the previous tab repository into a separate database before use; subsequent writes are isolated. |
| Save after another tab or user updates the online project | Compare against the version actually opened or last saved; reject a stale save instead of silently adopting the new server version. |
| Save without creating a version | Explicitly label the action; save the current working code even if the commit ID did not change. |
| Autosave | Require an explicit setting; skip replacement workspaces, pending manual overwrites, and active project operations. |
| Save from an old publishing dialog | Check the original workspace and revision before upload; only mark the matching revision saved. |
| Join live editing or receive full collaboration snapshots | Explain the replacement before joining; back up before full snapshots; clear unrelated online destinations for unscoped rooms. |
| Receive an external postMessage project in the editor | Ask before opening it; use a new workspace and recover from failed loads. |
| Close or reload the page | Warn for unsaved changes, pending replacements, and active project operations. |
| Save an imported project with Git connections | Require explicit approval before automatically pushing to inherited remotes. |

Full history replacement requires a complete, validated MWP archive and permission to maintain the target project. The API checks the expected online head and edit timestamp. Paid-project remixes continue to stay private.

Paid projects use the same source permission for See inside, files, commits, archive downloads, and contribution inspection. Buyers can inspect source when See inside is enabled; enabling remixes also permits a private fork. A purchase does not override disabled See inside, and a preview link does not count as a purchase. The project owner retains access.

Regression coverage includes failed backups and loads, cancellation, edits during pending work, overlapping operations, tab isolation, stale saves, full history replacement, uncommitted MWP code, source access, and the affected menu, import, collaboration, publishing, and recovery workflows.
