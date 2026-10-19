const SCRATCH_API = 'building-extensions/apis/scratch-api';
const VM_API = 'building-extensions/apis/vm-api';
const RENDERER_API = 'building-extensions/apis/renderer-api';
const UTILITY_APIS = 'building-extensions/apis/utility-apis';
const UNSANDBOXED = 'building-extensions/unsandboxed';
const HELLO_WORLD = 'building-extensions/hello-world';
const INPUTS = 'building-extensions/inputs';
const HATS = 'building-extensions/hats';
const ASSORTED = 'building-extensions/assorted-apis';
const C_BLOCKS = 'building-extensions/custom-c-blocks';
const ADVANCED_BLOCKS = 'building-extensions/advanced-block-customization';
const COMPILED = 'building-extensions/compiled/structure';
const SWITCHES = 'building-extensions/block-switches';
const IN_EDITOR = 'building-extensions/in-editor';

const make = type => (label, detail, info, docsPath, unsandboxedOnly = false) =>
    ({label, type, detail, info, docsPath, unsandboxedOnly});
const fn = make('function');
const prop = make('property');
const constant = make('constant');
const cls = make('class');
const key = make('key');

const enumValues = (detail, values, docsPath) => values.map(([name, value, info]) =>
    constant(name, `${detail}.${name} = ${JSON.stringify(value)}`, info, docsPath));

const memberDocs = {
    'Scratch': [
        prop('extensions', 'Scratch.extensions',
            'Registers extensions and tells you whether this one runs unsandboxed.',
            SCRATCH_API),
        cls('BlockType', 'Scratch.BlockType', 'The kinds of block a block entry can be, such as REPORTER or COMMAND.',
            SCRATCH_API),
        cls('ArgumentType', 'Scratch.ArgumentType', 'The kinds of input an argument can be, such as STRING or NUMBER.',
            SCRATCH_API),
        cls('TargetType', 'Scratch.TargetType', 'Sprite or stage, used in a block filter.', SCRATCH_API),
        cls('BlockShape', 'Scratch.BlockShape', 'Output shapes for reporters: ROUND, HEXAGONAL, or SQUARE.',
            ADVANCED_BLOCKS),
        cls('ReturnType', 'Scratch.ReturnType', 'Value types a compiled block declares with returnType.', COMPILED),
        cls('Cast', 'Scratch.Cast',
            'Converts block inputs to numbers, strings, booleans, and colors the way Scratch does.',
            UTILITY_APIS),
        prop('external', 'Scratch.external', 'Loads modules and files from absolute URLs.', SCRATCH_API),
        fn('translate', 'Scratch.translate(message: string | {id, default}, args?): string',
            'Translates a block or menu string into the editor language, falling back to the text you pass.',
            SCRATCH_API),
        fn('fetch', 'Scratch.fetch(url: string, options?: RequestInit): Promise<Response>',
            'Like fetch. Unsandboxed extensions ask the user first when the URL is not trusted.', SCRATCH_API),
        fn('canFetch', 'Scratch.canFetch(url: string): Promise<boolean>',
            'Checks whether the user allows requests to this URL. Use it before opening a WebSocket.', SCRATCH_API),
        fn('openWindow', 'Scratch.openWindow(url: string, features?: string): Promise<Window | null>',
            'Opens a URL in a new window after the user allows it.', SCRATCH_API, true),
        fn('canOpenWindow', 'Scratch.canOpenWindow(url: string): Promise<boolean>',
            'Checks whether the user allows opening this URL in a new window.', SCRATCH_API),
        fn('redirect', 'Scratch.redirect(url: string): Promise<void>',
            'Navigates the page to a URL after the user allows it.', SCRATCH_API, true),
        fn('canRedirect', 'Scratch.canRedirect(url: string): Promise<boolean>',
            'Checks whether the user allows navigating to this URL.', SCRATCH_API),
        fn('download', 'Scratch.download(url: string, file: string): Promise<void>',
            'Downloads a URL as a file after the user allows it.', SCRATCH_API, true),
        fn('canDownload', 'Scratch.canDownload(url: string, file: string): Promise<boolean>',
            'Checks whether the user allows this download.', SCRATCH_API),
        fn('canEmbed', 'Scratch.canEmbed(url: string): Promise<boolean>',
            'Checks whether the user allows embedding this URL, for example in an iframe.', SCRATCH_API),
        fn('canRecordAudio', 'Scratch.canRecordAudio(): Promise<boolean>',
            'Asks whether the extension may use the microphone.', SCRATCH_API),
        fn('canRecordVideo', 'Scratch.canRecordVideo(): Promise<boolean>',
            'Asks whether the extension may use the camera.', SCRATCH_API),
        fn('canReadClipboard', 'Scratch.canReadClipboard(): Promise<boolean>',
            'Asks whether the extension may read the clipboard.', SCRATCH_API),
        fn('canNotify', 'Scratch.canNotify(): Promise<boolean>',
            'Asks whether the extension may show notifications.', SCRATCH_API),
        fn('canGeolocate', 'Scratch.canGeolocate(): Promise<boolean>',
            'Asks whether the extension may read the location.', SCRATCH_API),
        prop('vm', 'Scratch.vm: VirtualMachine',
            'The virtual machine that runs the project. Only available without the sandbox.', VM_API, true),
        prop('renderer', 'Scratch.renderer: RenderWebGL',
            'The stage renderer. Only available without the sandbox.', RENDERER_API, true),
        prop('gui', 'Scratch.gui',
            'Editor hooks such as getBlockly. Only available without the sandbox, and only in the editor.',
            SCRATCH_API, true)
    ],
    'Scratch.extensions': [
        fn('register', 'Scratch.extensions.register(extension: object): void',
            'Registers an extension instance. Its getInfo method describes the blocks.', HELLO_WORLD),
        prop('unsandboxed', 'Scratch.extensions.unsandboxed: boolean',
            'True when the extension runs without the sandbox. Check it before using Scratch.vm.', UNSANDBOXED),
        prop('isMistWarp', 'Scratch.extensions.isMistWarp: boolean',
            'True when the extension runs in MistWarp.', SCRATCH_API)
    ],
    'Scratch.BlockType': enumValues('Scratch.BlockType', [
        ['COMMAND', 'command', 'A stack block that runs an action.'],
        ['REPORTER', 'reporter', 'A round block that returns a value.'],
        ['BOOLEAN', 'Boolean', 'A hexagonal block that returns true or false.'],
        ['HAT', 'hat', 'A hat block whose method runs as a predicate. By default it is checked every frame and ' +
            'the script starts when it turns true. With isEdgeActivated: false it starts from runtime.startHats, ' +
            'and the method must still return true.'],
        ['EVENT', 'event', 'A hat block with no method. With isEdgeActivated: false it starts only from ' +
            'runtime.startHats. Without it the hat defaults to edge-activated and its script runs every frame.'],
        ['CONDITIONAL', 'conditional', 'A C block whose method returns which branch to run, starting at 1, ' +
            'like if.'],
        ['LOOP', 'loop', 'A C block whose method returns which branch to run and runs again after it, like repeat.'],
        ['LABEL', 'label', 'Text shown in the palette between blocks.'],
        ['BUTTON', 'button', 'A palette button that calls the method named by func.'],
        ['XML', 'xml', 'Raw palette XML from the xml key.']
    ], SCRATCH_API),
    'Scratch.ArgumentType': enumValues('Scratch.ArgumentType', [
        ['STRING', 'string', 'A text input.'],
        ['NUMBER', 'number', 'A number input.'],
        ['BOOLEAN', 'Boolean', 'A hexagonal slot for boolean blocks.'],
        ['ANGLE', 'angle', 'A number input with an angle picker.'],
        ['COLOR', 'color', 'A color picker.'],
        ['MATRIX', 'matrix', 'A 5 by 5 LED grid.'],
        ['NOTE', 'note', 'A piano note picker.'],
        ['IMAGE', 'image', 'An inline image from dataURI, not an input.'],
        ['COSTUME', 'costume', 'A menu of the sprite\'s costumes.'],
        ['SOUND', 'sound', 'A menu of the sprite\'s sounds.']
    ], INPUTS),
    'Scratch.TargetType': enumValues('Scratch.TargetType', [
        ['SPRITE', 'sprite', 'Show the block for sprites.'],
        ['STAGE', 'stage', 'Show the block for the stage.']
    ], ASSORTED),
    'Scratch.BlockShape': enumValues('Scratch.BlockShape', [
        ['ROUND', 2, 'Rounded ends, like a reporter.'],
        ['HEXAGONAL', 1, 'Pointed ends, like a boolean.'],
        ['SQUARE', 3, 'Square ends.']
    ], ADVANCED_BLOCKS),
    'Scratch.ReturnType': [
        constant('ANY', 'Scratch.ReturnType.ANY', 'The compiled value can be anything.', COMPILED),
        constant('NUMBER', 'Scratch.ReturnType.NUMBER', 'A number that may be NaN. The safe choice for numbers.',
            COMPILED),
        constant('NUMBER_NEVER_NAN', 'Scratch.ReturnType.NUMBER_NEVER_NAN',
            'A number that is never NaN. The compiler skips NaN checks, so only use it when that is certain.',
            COMPILED),
        constant('STRING', 'Scratch.ReturnType.STRING', 'A string.', COMPILED),
        constant('BOOLEAN', 'Scratch.ReturnType.BOOLEAN', 'A boolean.', COMPILED),
        constant('COMMAND', 'Scratch.ReturnType.COMMAND', 'A stack block with no value.', COMPILED)
    ],
    'Scratch.Cast': [
        fn('toNumber', 'Scratch.Cast.toNumber(value: unknown): number',
            'Converts to a number the way Scratch does. Text that is not a number becomes 0.', UTILITY_APIS),
        fn('toString', 'Scratch.Cast.toString(value: unknown): string', 'Converts to a string.', UTILITY_APIS),
        fn('toBoolean', 'Scratch.Cast.toBoolean(value: unknown): boolean',
            'Converts to a boolean. The strings "", "0", and "false" in any case are false.', UTILITY_APIS),
        fn('compare', 'Scratch.Cast.compare(a: unknown, b: unknown): number',
            'Compares two values like the Scratch comparison blocks: numerically when both look like numbers, ' +
            'else as case-insensitive text.', UTILITY_APIS),
        fn('isInt', 'Scratch.Cast.isInt(value: unknown): boolean',
            'Checks whether a value counts as a whole number: numbers without a fraction, booleans, and strings ' +
            'without a decimal point.', UTILITY_APIS),
        fn('isWhiteSpace', 'Scratch.Cast.isWhiteSpace(value: unknown): boolean',
            'Checks whether a value is empty or only whitespace.', UTILITY_APIS),
        fn('toRgbColorList', 'Scratch.Cast.toRgbColorList(value: unknown): number[]',
            'Converts a color to [r, g, b].', UTILITY_APIS),
        fn('toRgbColorObject', 'Scratch.Cast.toRgbColorObject(value: unknown): {r, g, b, a?}',
            'Converts a color to an object with r, g, and b.', UTILITY_APIS),
        fn('toListIndex', 'Scratch.Cast.toListIndex(index: unknown, length: number, acceptAll: boolean)',
            'Converts a list index input, including "last" and "random", to a 1-based index.', UTILITY_APIS),
        constant('LIST_INVALID', 'Scratch.Cast.LIST_INVALID', 'Returned by toListIndex for an invalid index.',
            UTILITY_APIS),
        constant('LIST_ALL', 'Scratch.Cast.LIST_ALL', 'Returned by toListIndex for "all".', UTILITY_APIS)
    ],
    'Scratch.external': [
        fn('importModule', 'Scratch.external.importModule(url: string): Promise<any>',
            'Imports an ES module from an absolute URL.', SCRATCH_API),
        fn('fetch', 'Scratch.external.fetch(url: string): Promise<Response>',
            'Fetches an absolute URL and throws when the response is not ok.', SCRATCH_API),
        fn('dataURL', 'Scratch.external.dataURL(url: string): Promise<string>',
            'Fetches a URL and returns it as a data: URL.', SCRATCH_API),
        fn('blob', 'Scratch.external.blob(url: string): Promise<Blob>', 'Fetches a URL as a Blob.', SCRATCH_API),
        fn('evalAndReturn', 'Scratch.external.evalAndReturn(url: string, expression: string): Promise<any>',
            'Runs a script from a URL and returns the value of an expression, for libraries without modules.',
            SCRATCH_API)
    ],
    'Scratch.vm': [
        prop('runtime', 'vm.runtime: Runtime', 'The runtime holds targets, threads, and events.', VM_API, true),
        prop('renderer', 'vm.renderer: RenderWebGL', 'The stage renderer, same as Scratch.renderer.', RENDERER_API,
            true),
        prop('editingTarget', 'vm.editingTarget: RenderedTarget', 'The sprite or stage open in the editor.',
            VM_API, true),
        prop('exports', 'vm.exports', 'Internal classes, plus the compiler API at vm.exports.compiler.', COMPILED,
            true),
        fn('on', 'vm.on(event: string, listener: Function): void', 'Listens for a VM event.', VM_API, true),
        fn('off', 'vm.off(event: string, listener: Function): void', 'Removes a VM event listener.', VM_API, true),
        fn('greenFlag', 'vm.greenFlag(): void', 'Starts the project as if the green flag was clicked.', VM_API, true),
        fn('stopAll', 'vm.stopAll(): void', 'Stops every script.', VM_API, true),
        fn('setTurboMode', 'vm.setTurboMode(enabled: boolean): void', 'Turns turbo mode on or off.', VM_API, true),
        fn('setFramerate', 'vm.setFramerate(fps: number): void', 'Sets the project framerate.', VM_API, true),
        fn('setStageSize', 'vm.setStageSize(width: number, height: number): void', 'Resizes the stage.', VM_API,
            true),
        fn('setEditingTarget', 'vm.setEditingTarget(targetId: string): void', 'Opens a sprite in the editor.',
            VM_API, true),
        fn('toJSON', 'vm.toJSON(targetId?: string): string', 'Serializes the project, or one target, to JSON.',
            VM_API, true),
        fn('loadProject', 'vm.loadProject(input): Promise<void>', 'Replaces the current project.', VM_API, true)
    ],
    'Scratch.vm.runtime': [
        prop('targets', 'runtime.targets: RenderedTarget[]', 'Every sprite, clone, and the stage.', VM_API, true),
        prop('threads', 'runtime.threads: Thread[]', 'The scripts running right now.', VM_API, true),
        prop('extensionStorage', 'runtime.extensionStorage: object',
            'Data saved inside the project. Store small JSON values under your extension id.', VM_API, true),
        prop('ioDevices', 'runtime.ioDevices', 'Keyboard, mouse, clock, and other input devices.', VM_API, true),
        prop('compilerOptions', 'runtime.compilerOptions: {enabled, warpTimer}', 'Whether the compiler is on.',
            VM_API, true),
        prop('frameLoop', 'runtime.frameLoop', 'The frame timer, including the framerate.', VM_API, true),
        prop('stageWidth', 'runtime.stageWidth: number', 'Stage width in pixels.', VM_API, true),
        prop('stageHeight', 'runtime.stageHeight: number', 'Stage height in pixels.', VM_API, true),
        fn('on', 'runtime.on(event: string, listener: Function): void',
            'Listens for a runtime event such as PROJECT_START, PROJECT_STOP_ALL, or BEFORE_EXECUTE.', VM_API, true),
        fn('once', 'runtime.once(event: string, listener: Function): void', 'Listens for the next runtime event only.',
            VM_API, true),
        fn('off', 'runtime.off(event: string, listener: Function): void', 'Removes a runtime event listener.',
            VM_API, true),
        fn('startHats', 'runtime.startHats(opcode: string, fields?: object, target?: Target): Thread[]',
            'Starts the hat blocks with this full opcode, such as myext_whenSomething.', HATS, true),
        fn('getTargetForStage', 'runtime.getTargetForStage(): Target', 'Returns the stage.', VM_API, true),
        fn('getSpriteTargetByName', 'runtime.getSpriteTargetByName(name: string): RenderedTarget | undefined',
            'Finds the original sprite with this name.', VM_API, true),
        fn('getTargetById', 'runtime.getTargetById(id: string): Target | undefined', 'Finds a target by id.',
            VM_API, true),
        fn('getEditingTarget', 'runtime.getEditingTarget(): Target', 'Returns the target open in the editor.',
            VM_API, true),
        fn('requestRedraw', 'runtime.requestRedraw(): void', 'Asks for the stage to redraw this frame.',
            RENDERER_API, true),
        fn('stopAll', 'runtime.stopAll(): void', 'Stops every script.', VM_API, true),
        fn('setRuntimeOptions', 'runtime.setRuntimeOptions(options: object): void',
            'Changes runtime options such as maxClones. The change stays after the extension is reloaded or removed.',
            VM_API, true)
    ],
    'Scratch.renderer': [
        prop('canvas', 'renderer.canvas: HTMLCanvasElement', 'The stage canvas.', RENDERER_API, true),
        prop('gl', 'renderer.gl: WebGLRenderingContext', 'The WebGL context the stage draws with.', RENDERER_API,
            true),
        fn('draw', 'renderer.draw(): void', 'Draws the stage now.', RENDERER_API, true),
        fn('createBitmapSkin', 'renderer.createBitmapSkin(image, resolution?: number): number',
            'Creates a skin from an image or canvas and returns its id.', RENDERER_API, true),
        fn('updateBitmapSkin', 'renderer.updateBitmapSkin(skinId: number, image, resolution?: number): void',
            'Replaces the image of a bitmap skin.', RENDERER_API, true),
        fn('destroySkin', 'renderer.destroySkin(skinId: number): void', 'Frees a skin you created.', RENDERER_API,
            true)
    ],
    'Scratch.gui': [
        fn('getBlockly', 'Scratch.gui.getBlockly(): Promise<ScratchBlocks>',
            'Resolves with ScratchBlocks once the editor has loaded it. It may never resolve in the player.',
            SCRATCH_API, true),
        fn('getBlocklyEagerly', 'Scratch.gui.getBlocklyEagerly(): Promise<ScratchBlocks>',
            'Loads ScratchBlocks now. This downloads a large bundle, so prefer getBlockly.', SCRATCH_API, true),
        prop('wm', 'Scratch.gui.wm', 'The editor window manager for opening addon windows.', SCRATCH_API, true),
        prop('git', 'Scratch.gui.git', 'The in-browser git helpers the editor uses.', SCRATCH_API, true)
    ]
};

const keyDocs = {
    info: [
        key('id', 'id: string', 'A unique id made of letters and numbers. Block opcodes are prefixed with it.',
            HELLO_WORLD),
        key('name', 'name: string', 'The category name shown in the palette.', HELLO_WORLD),
        key('blocks', 'blocks: Block[]', 'The blocks, labels, buttons, and "---" separators in palette order.',
            HELLO_WORLD),
        key('menus', 'menus: {[name]: Menu}', 'Menus that arguments refer to by name.', INPUTS),
        key('color1', 'color1: string', 'The main block color, as a hex string.', ASSORTED),
        key('color2', 'color2: string', 'The secondary color used for inputs and menus.', ASSORTED),
        key('color3', 'color3: string', 'The border color.', ASSORTED),
        key('menuIconURI', 'menuIconURI: string', 'Icon shown next to the category in the palette.', ASSORTED),
        key('blockIconURI', 'blockIconURI: string', 'Icon shown at the start of every block.', ASSORTED),
        key('docsURI', 'docsURI: string', 'Adds a documentation button to the palette that opens this URL.',
            ASSORTED),
        key('showStatusButton', 'showStatusButton: boolean', 'Shows a hardware connection status button.',
            ASSORTED),
        key('customFieldTypes', 'customFieldTypes: object', 'Custom field types for advanced inputs.',
            ADVANCED_BLOCKS)
    ],
    block: [
        key('opcode', 'opcode: string', 'The block id within the extension, and the method called when it runs.',
            HELLO_WORLD),
        key('blockType', 'blockType: Scratch.BlockType', 'The kind of block. Defaults to COMMAND.', HELLO_WORLD),
        key('text', 'text: string | string[]',
            'The block text. Write [NAME] for each argument. Use an array for one line per branch.', INPUTS),
        key('arguments', 'arguments: {[NAME]: Argument}', 'The inputs named in text.', INPUTS),
        key('func', 'func: string', 'The method to call instead of the opcode. Required for BUTTON blocks.',
            ASSORTED),
        key('isEdgeActivated', 'isEdgeActivated: boolean',
            'For HAT and EVENT blocks. Defaults to true, which checks the hat every frame. false means it starts ' +
            'only from runtime.startHats, and a HAT method still runs as a predicate that must return true.', HATS),
        key('shouldRestartExistingThreads', 'shouldRestartExistingThreads: boolean',
            'For hats: restart scripts that are still running when the hat fires again.', HATS),
        key('isTerminal', 'isTerminal: boolean', 'No blocks can attach below this one.', ASSORTED),
        key('disableMonitor', 'disableMonitor: boolean', 'Hides the monitor checkbox for this reporter.', ASSORTED),
        key('hideFromPalette', 'hideFromPalette: boolean', 'Keeps the block out of the palette.', ASSORTED),
        key('filter', 'filter: Scratch.TargetType[]', 'Only show the block for these target types.', ASSORTED),
        key('blockIconURI', 'blockIconURI: string', 'Icon for this block only.', ASSORTED),
        key('color1', 'color1: string', 'Main color for this block only.', ASSORTED),
        key('color2', 'color2: string', 'Secondary color for this block only.', ASSORTED),
        key('color3', 'color3: string', 'Border color for this block only.', ASSORTED),
        key('branchCount', 'branchCount: number', 'How many branches a CONDITIONAL or LOOP block has.', C_BLOCKS),
        key('branchIconURI', 'branchIconURI: string',
            'Icon at the bottom right of a C block. Loops show a repeat arrow by default; an empty string hides it.',
            C_BLOCKS),
        key('blockShape', 'blockShape: Scratch.BlockShape', 'Overrides the output shape of a reporter.',
            ADVANCED_BLOCKS),
        key('allowDropAnywhere', 'allowDropAnywhere: boolean',
            'Lets a reporter be dropped into any input, including boolean slots.', ADVANCED_BLOCKS),
        key('isDynamic', 'isDynamic: boolean', 'Stores the block info in each block so it can change per block.',
            ADVANCED_BLOCKS),
        key('switches', 'switches: string[]', 'Opcodes this block can be switched to from its context menu.',
            SWITCHES),
        key('compFunc', 'compFunc: string | Function',
            'A compiler function that returns JavaScript source for this block. Loop and conditional blocks also ' +
            'receive branch() and yieldLoop(). Unsandboxed only.', COMPILED, true),
        key('returnType', 'returnType: Scratch.ReturnType', 'The value type a compiled block produces.', COMPILED,
            true),
        key('xml', 'xml: string', 'Palette XML for XML blocks.', ASSORTED)
    ],
    argument: [
        key('type', 'type: Scratch.ArgumentType', 'The kind of input.', INPUTS),
        key('defaultValue', 'defaultValue: string | number | boolean', 'The value the input starts with.', INPUTS),
        key('menu', 'menu: string', 'The name of a menu in menus to use for this input.', INPUTS),
        key('dataURI', 'dataURI: string', 'The image for an IMAGE argument.', ASSORTED),
        key('flipRTL', 'flipRTL: boolean', 'Mirrors an IMAGE argument in right to left languages.', ASSORTED)
    ],
    menu: [
        key('items', 'items: string | Array<string | {text, value}>',
            'The menu entries, or the name of a method that returns them.', INPUTS),
        key('acceptReporters', 'acceptReporters: boolean', 'Lets blocks be dropped into the menu.', INPUTS)
    ]
};

const suppressionDocs = [
    key('mw-ext-disable-next-line', '// mw-ext-disable-next-line <code> [code...]',
        'Hides problems with these codes on the next line, or every problem there when no code is given. ' +
        'On line 1 it also covers whole-file problems such as no-register. Add -- and a reason after the codes.',
        IN_EDITOR),
    key('mw-ext-disable', '// mw-ext-disable <code> [code...]',
        'On its own line, hides problems with these codes from this comment to the end of the file, or every ' +
        'problem when no code is given. Whole-file problems such as no-register are hidden wherever it appears. ' +
        'Add -- and a reason after the codes.', IN_EDITOR)
];

const findMemberDoc = path => {
    const dot = path.lastIndexOf('.');
    if (dot === -1) return null;
    const entries = memberDocs[path.slice(0, dot)];
    const name = path.slice(dot + 1);
    return (entries && entries.find(entry => entry.label === name)) || null;
};

const findKeyDoc = (name, scope) => {
    const scopes = scope ? [scope] : Object.keys(keyDocs);
    for (const each of scopes) {
        const found = (keyDocs[each] || []).find(entry => entry.label === name);
        if (found) return found;
    }
    return null;
};

export {
    memberDocs,
    keyDocs,
    suppressionDocs,
    findMemberDoc,
    findKeyDoc
};
