# Project state machine

Much of the editor depends on where the current project is in its lifecycle: fetching, loading into the VM, showing, or saving. `src/reducers/project-state.js` models that lifecycle as a finite state machine so the current phase is always explicit.

## Loading states

`LoadingState` in `src/reducers/project-state.js` lists every state, for example:

- `NOT_LOADED`, the default state
- `ERROR`
- `FETCHING_WITH_ID`
- `LOADING_VM_WITH_ID`
- `REMIXING`
- `SHOWING_WITH_ID`
- `SHOWING_WITHOUT_ID`

## Transitions

Transitions are the Redux actions that move the project from one state to another, for example:

- `START_FETCHING_NEW`
- `DONE_FETCHING_WITH_ID`
- `DONE_LOADING_VM_WITH_ID`
- `SET_PROJECT_ID`
- `START_AUTO_UPDATING`

The diagram shows how transitions connect the loading states. It leaves out error handling for clarity.

![Project state diagram](project_state_diagram.svg)

## Example

When the editor opens a project by id, such as `/editor#123456`:

![Project state example](project_state_example.png)

1. The app mounts and the state is `NOT_LOADED`.
2. `src/lib/components/project-fetcher-hoc.jsx` dispatches `SET_PROJECT_ID` with `projectId` set to `123456`. The state becomes `FETCHING_WITH_ID`.
3. While in `FETCHING_WITH_ID`, the fetcher requests the project data.
4. When the data arrives, the fetcher dispatches `DONE_FETCHING_WITH_ID` with `projectData`. The state becomes `LOADING_VM_WITH_ID`.
5. While in `LOADING_VM_WITH_ID`, `src/lib/components/vm-manager-hoc.jsx` loads `projectData` into the VM.
6. When loading finishes, the VM manager dispatches `DONE_LOADING_VM_WITH_ID`. The state becomes `SHOWING_WITH_ID`.
7. In `SHOWING_WITH_ID` the project is playable and editable.
