// Read only the metadata needed by the settings UI. Serializing assets waits until export.
export const getEditorProjectData = (vm, title) => {
    const stage = vm.runtime.getTargetForStage();
    const extensions = vm.extensionManager;
    return {
        title: `${title}.sb3`,
        uniqueId: `editor-${title}`,
        project: {
            analysis: {
                stageVariables: Object.values(stage ? stage.variables : {}).map(variable => ({
                    name: variable.name,
                    isCloud: variable.isCloud || variable.name.startsWith('☁')
                })),
                stageComments: Object.values(stage ? stage.comments : {}).map(comment => comment.text),
                extensions: Object.values(extensions.getExtensionURLs()),
                usesSteamworks: extensions.isExtensionLoaded('steamworks'),
                usesMusic: extensions.isExtensionLoaded('music')
            }
        }
    };
};
