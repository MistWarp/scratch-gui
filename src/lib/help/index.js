/* eslint-disable max-len */
const DOCS_BASE = '/docs';

const HELP_CATEGORIES = [
    'Editor',
    'Blocks',
    'Extensions',
    'Advanced'
];

const HELP_ENTRIES = [
    {
        id: 'interface',
        title: 'Editor overview',
        category: 'Editor',
        keywords: ['layout', 'panels', 'regions'],
        short: 'The editor is split into the stage, the sprite pane, the block palette, and the code workspace. The menu bar across the top holds every project and tool command.',
        howTo: [
            'Drag the divider between the workspace and the stage to resize either side.',
            'Use the tabs above the palette to switch between Code, Costumes, and Sounds.',
            'Open the Settings menu to change the theme, layout, and performance options.'
        ],
        docsPath: '/editor/interface'
    },
    {
        id: 'menu-bar',
        title: 'Menu bar',
        category: 'Editor',
        keywords: ['file', 'edit', 'tools', 'top bar'],
        short: 'The menu bar holds the File, Edit, Tools, Bookmarks, and Settings menus. Everything from saving to opening the debugger starts here.',
        howTo: [
            'File holds New, Save to MistWarp, Save to your computer, Package, and Restore points.',
            'Tools holds the Git panel, Terminal, Live Collaboration, Debugger, and Variable Manager.',
            'Edit holds Undo, Redo, Addons, and the tutorial.'
        ],
        docsPath: '/editor/menu-bar'
    },
    {
        id: 'stage',
        title: 'Stage',
        category: 'Editor',
        keywords: ['backdrop', 'green flag', 'canvas', 'fullscreen'],
        short: 'The Stage is where your project runs. Sprites move, draw, and react here against the current backdrop.',
        howTo: [
            'Press the green flag to run every "when green flag clicked" script.',
            'Press the stop sign to halt all scripts.',
            'Use the fullscreen button for a distraction free view, or set a custom stage size in Settings.'
        ],
        docsPath: '/editor/stage'
    },
    {
        id: 'sprites',
        title: 'Sprites',
        category: 'Editor',
        keywords: ['sprite pane', 'actors', 'x', 'y', 'direction'],
        short: 'Sprites are the characters and objects in your project. The sprite pane below the stage lists them and lets you set position, size, direction, and visibility.',
        howTo: [
            'Use the buttons in the corner of the pane to add a sprite from the library, paint one, or upload a file.',
            'Click a sprite to edit its code, costumes, and sounds.',
            'Right-click a sprite to duplicate, export, or delete it.'
        ],
        docsPath: '/editor/sprites'
    },
    {
        id: 'costumes',
        title: 'Costumes and the paint editor',
        category: 'Editor',
        keywords: ['paint', 'draw', 'bitmap', 'vector', 'images'],
        short: 'Each sprite has one or more costumes. The paint editor edits them in vector or bitmap mode.',
        howTo: [
            'Open the Costumes tab to see and edit a sprite\'s costumes.',
            'Switch between Vector and Bitmap with the button in the corner.',
            'Add costumes from the library, by painting, or by uploading an image.'
        ],
        docsPath: '/editor/costumes'
    },
    {
        id: 'sounds',
        title: 'Sounds',
        category: 'Editor',
        keywords: ['audio', 'record', 'trim', 'effects'],
        short: 'The Sounds tab holds the audio a sprite can play. The sound editor can trim clips, apply effects, and record from a microphone.',
        howTo: [
            'Open the Sounds tab, then add a sound from the library, upload a file, or record one.',
            'Drag on the waveform to select a section, then trim or apply an effect.',
            'Play sounds in code with the blocks from the Sound category.'
        ],
        docsPath: '/editor/sounds'
    },
    {
        id: 'workspace',
        title: 'Code workspace',
        category: 'Editor',
        keywords: ['blocks', 'scripts', 'canvas', 'comments', 'zoom'],
        short: 'The workspace is the canvas where you assemble blocks into scripts. Drag blocks out of the palette and snap them together.',
        howTo: [
            'Drag a block from the palette into the workspace to add it.',
            'Right-click for Clean Up Blocks, Add Comment, and to toggle inline help.',
            'Use the zoom controls in the corner, or scroll to pan around large projects.'
        ],
        docsPath: '/editor/workspace'
    },
    {
        id: 'blocks-palette',
        title: 'Block palette',
        category: 'Editor',
        keywords: ['categories', 'search', 'toolbox'],
        short: 'The palette on the left lists every available block, grouped into color coded categories. Extensions add their own categories at the bottom.',
        howTo: [
            'Click a category name to jump to that section of the palette.',
            'Add an extension from the Add Extension button to bring in more blocks.',
            'See the Blocks reference for what every block does.'
        ],
        docsPath: '/blocks/overview'
    },
    {
        id: 'variables',
        title: 'Variables and lists',
        category: 'Editor',
        keywords: ['data', 'make a variable', 'monitors'],
        short: 'Variables store single values and lists store ordered collections. Create them from the Variables category in the palette.',
        howTo: [
            'Click Make a Variable or Make a List and choose For all sprites or For this sprite only.',
            'Tick the checkbox next to a variable to show it on the stage as a monitor.',
            'For bulk editing, open the Variable Manager from the Tools menu.'
        ],
        docsPath: '/editor/variables'
    },
    {
        id: 'custom-blocks',
        title: 'Custom blocks (My Blocks)',
        category: 'Editor',
        keywords: ['my blocks', 'define', 'procedures', 'functions'],
        short: 'My Blocks lets you define your own blocks with inputs, which keeps scripts short and reusable.',
        howTo: [
            'Click Make a Block in the My Blocks category and add label text and inputs.',
            'Tick "Run without screen refresh" to run the whole block in one frame.',
            'MistWarp also supports return values so a custom block can report a result.'
        ],
        docsPath: '/blocks/my-blocks'
    },
    {
        id: 'backpack',
        title: 'Backpack',
        category: 'Editor',
        keywords: ['storage', 'copy between projects'],
        short: 'The backpack is a strip at the bottom of the editor that stores sprites, scripts, costumes, and sounds so you can reuse them across projects.',
        howTo: [
            'Drag a block, sprite, costume, or sound onto the backpack to store it.',
            'Drag an item out of the backpack into a project to use it.',
            'The backpack persists between sessions when you are signed in.'
        ],
        docsPath: '/editor/backpack'
    },
    {
        id: 'settings',
        title: 'Settings',
        category: 'Editor',
        keywords: ['preferences', 'options', 'fps', 'stage size'],
        short: 'The Settings window collects appearance, interface, stage, performance, and advanced options. Many performance settings are saved into the project.',
        howTo: [
            'Open Settings from the menu bar to change theme, accent color, and layout.',
            'Adjust frame rate, stage size, and rendering under the Stage section.',
            'The Remove Limits section unlocks clone, list, and fencing limits.'
        ],
        docsPath: '/editor/settings'
    },
    {
        id: 'addons',
        title: 'Addons',
        category: 'Editor',
        keywords: ['extensions', 'editor tweaks', 'features'],
        short: 'Addons are optional editor features and tweaks you can turn on and configure individually, from block search to a custom stage design.',
        howTo: [
            'Open Addons from the Edit menu to browse and enable them.',
            'Each addon has its own settings and can be reset to defaults.',
            'Enabled addons sync to your account so they follow you between devices.'
        ],
        docsPath: '/editor/addons'
    },
    {
        id: 'themes',
        title: 'Themes and appearance',
        category: 'Editor',
        keywords: ['dark mode', 'accent', 'custom theme', 'colors'],
        short: 'MistWarp lets you restyle the editor and the blocks. The editor Settings choose the block color scheme, while the overall light or dark theme and accent are set in your account settings on the community site.',
        howTo: [
            'Choose a block color scheme (such as High Contrast) in the editor Theme settings.',
            'Set the overall light or dark theme and accent color in your account settings.',
            'Signed in, your theme choices sync between devices.'
        ],
        docsPath: '/editor/themes'
    },
    {
        id: 'debugger',
        title: 'Debugger',
        category: 'Editor',
        keywords: ['logs', 'inspect', 'threads', 'console'],
        short: 'The debugger shows log output, running threads, and variable state so you can trace what a project is doing.',
        howTo: [
            'Open the Debugger from the Tools menu.',
            'Read log, warn, and error output as scripts run.',
            'Inspect variables and threads to find where behavior diverges.'
        ],
        docsPath: '/editor/debugger'
    },
    {
        id: 'variable-manager',
        title: 'Variable manager',
        category: 'Editor',
        keywords: ['bulk edit', 'inspect data'],
        short: 'The variable manager is a single window for viewing and editing every variable and list in the project at once.',
        howTo: [
            'Open it from the Tools menu.',
            'Search, edit, and delete variables and list items in bulk.',
            'Useful for inspecting large lists that are awkward to read on the stage.'
        ],
        docsPath: '/editor/variable-manager'
    },
    {
        id: 'restore-points',
        title: 'Restore points and autosave',
        category: 'Editor',
        keywords: ['backup', 'history', 'recovery', 'undo'],
        short: 'Restore points are local snapshots of your project. Autosave creates them on a schedule so you can recover after a crash or mistake.',
        howTo: [
            'Create a restore point manually from the File menu at any time.',
            'Open Restore Points to load an earlier snapshot.',
            'Pause or resume autosave, and change its interval, from the File menu or Settings.'
        ],
        docsPath: '/editor/restore-points'
    },
    {
        id: 'git',
        title: 'Version control (Git)',
        category: 'Editor',
        keywords: ['git', 'commit', 'push', 'pull', 'diff', 'history'],
        short: 'MistWarp can track a project as a git repository, so you get a full history with commits, pushes, pulls, diffs, and merge handling.',
        howTo: [
            'Open the Git panel from the Tools menu.',
            'Commit changes with a message, then push to share them.',
            'Review a visual diff before committing, and resolve merge conflicts in the editor.'
        ],
        docsPath: '/editor/git'
    },
    {
        id: 'collaboration',
        title: 'Live collaboration',
        category: 'Editor',
        keywords: ['multiplayer', 'realtime', 'share editing'],
        short: 'Live collaboration lets several people edit the same project at once, with edits syncing between everyone in the session.',
        howTo: [
            'Start a session from the Tools menu and share the link.',
            'Others join through that link and edit alongside you.',
            'Changes to blocks, sprites, and assets propagate to everyone live.'
        ],
        docsPath: '/editor/collaboration'
    },
    {
        id: 'packaging',
        title: 'Packaging projects',
        category: 'Editor',
        keywords: ['packager', 'export', 'html', 'standalone', 'exe'],
        short: 'The packager turns a project into a standalone HTML file or a native application you can distribute without the editor.',
        howTo: [
            'Choose Package project from the File menu to open the packager with your project.',
            'Pick a target such as plain HTML or an executable, and adjust options.',
            'See the Packager guide for embedding, offline use, and cloud behavior.'
        ],
        docsPath: '/packager/overview'
    },
    {
        id: 'find-bar',
        title: 'Find bar',
        category: 'Editor',
        keywords: ['search blocks', 'jump', 'definition'],
        short: 'The find bar searches your scripts and jumps straight to a block, variable, or custom block definition.',
        howTo: [
            'Open the find bar and type part of a block or variable name.',
            'Select a result to scroll the workspace to it.',
            'Use it to jump to a custom block definition quickly.'
        ],
        docsPath: '/editor/find-bar'
    },
    {
        id: 'bookmarks',
        title: 'Workspace bookmarks',
        category: 'Editor',
        keywords: ['navigation', 'saved positions'],
        short: 'Workspace bookmarks save spots in the code canvas so you can jump back to them in large projects.',
        howTo: [
            'Save a bookmark for the current workspace location.',
            'Open the Bookmarks menu to jump to a saved spot.',
            'Handy for moving between distant scripts without scrolling.'
        ],
        docsPath: '/editor/bookmarks'
    },
    {
        id: 'shortcuts',
        title: 'Keyboard shortcuts',
        category: 'Editor',
        keywords: ['hotkeys', 'keybindings'],
        short: 'MistWarp has keyboard shortcuts for common actions, and a shortcut manager where you can view and change them.',
        howTo: [
            'Save with Ctrl/Cmd plus S and open a project with Ctrl/Cmd plus O.',
            'Open the shortcut manager from Settings to see the full list.',
            'Rebind shortcuts that clash with your own habits.'
        ],
        docsPath: '/editor/shortcuts'
    },
    {
        id: 'blocks-motion',
        title: 'Motion blocks',
        category: 'Blocks',
        keywords: ['move', 'turn', 'glide', 'position'],
        short: 'Motion blocks move and rotate sprites: move, turn, go to a position, glide, and point in a direction.',
        howTo: [
            'Motion blocks only affect sprites, not the stage.',
            'MistWarp adds point-towards-x/y for pointing at an exact coordinate.',
            'Combine with a forever loop to create continuous movement.'
        ],
        docsPath: '/blocks/motion'
    },
    {
        id: 'blocks-looks',
        title: 'Looks blocks',
        category: 'Blocks',
        keywords: ['say', 'costume', 'effect', 'size', 'show', 'hide'],
        short: 'Looks blocks control appearance: speech and thought bubbles, costumes and backdrops, graphic effects, size, and layers.',
        howTo: [
            'Use say and think for speech and thought bubbles.',
            'Switch costumes and backdrops, or step through them with next.',
            'Graphic effects like color and ghost stack until you clear them.'
        ],
        docsPath: '/blocks/looks'
    },
    {
        id: 'blocks-sound',
        title: 'Sound blocks',
        category: 'Blocks',
        keywords: ['play', 'volume', 'audio effects'],
        short: 'Sound blocks play a sprite\'s sounds, set volume, and apply pitch and pan effects.',
        howTo: [
            'Play starts a sound and continues; play until done waits for it to finish.',
            'Set and change volume, or apply pitch and pan effects.',
            'Add sounds to a sprite in the Sounds tab first.'
        ],
        docsPath: '/blocks/sound'
    },
    {
        id: 'blocks-events',
        title: 'Events blocks',
        category: 'Blocks',
        keywords: ['when', 'broadcast', 'green flag', 'hat'],
        short: 'Events blocks start scripts. Hat blocks like when green flag clicked sit at the top, and broadcasts let scripts trigger each other.',
        howTo: [
            'Start most scripts with when green flag clicked.',
            'Use broadcast and receive to coordinate between sprites.',
            'Broadcast and wait pauses until every receiver finishes.'
        ],
        docsPath: '/blocks/events'
    },
    {
        id: 'blocks-control',
        title: 'Control blocks',
        category: 'Blocks',
        keywords: ['if', 'repeat', 'forever', 'wait', 'clone', 'switch'],
        short: 'Control blocks manage flow: loops, conditionals, waits, clones, and stopping scripts.',
        howTo: [
            'Use repeat, forever, and if to structure logic.',
            'Clones let one sprite spawn copies of itself at runtime.',
            'MistWarp adds while, for each, switch/case, and all at once.'
        ],
        docsPath: '/blocks/control'
    },
    {
        id: 'blocks-sensing',
        title: 'Sensing blocks',
        category: 'Blocks',
        keywords: ['touching', 'mouse', 'key', 'timer', 'ask'],
        short: 'Sensing blocks read the world: touch and color detection, mouse and keyboard, the timer, and asking the user a question.',
        howTo: [
            'Use touching and touching color for collision detection.',
            'Read mouse position, key presses, and the timer.',
            'Ask and wait pauses for typed input and stores it in answer.'
        ],
        docsPath: '/blocks/sensing'
    },
    {
        id: 'blocks-operators',
        title: 'Operators blocks',
        category: 'Blocks',
        keywords: ['math', 'string', 'compare', 'random', 'join'],
        short: 'Operators do math, compare values, combine and manipulate text, and generate random numbers.',
        howTo: [
            'Nest operators to build larger expressions.',
            'Use join, letter of, and length for text handling.',
            'MistWarp adds replace, trim, clamp, min, max, pi, and more.'
        ],
        docsPath: '/blocks/operators'
    },
    {
        id: 'blocks-variables',
        title: 'Variables and list blocks',
        category: 'Blocks',
        keywords: ['data', 'set', 'change', 'list', 'add', 'item'],
        short: 'These blocks read and write variables and lists: set, change, and the full set of list operations like add, insert, and item of.',
        howTo: [
            'Set and change update a variable\'s value.',
            'List blocks add, delete, insert, and read items by index.',
            'Show a variable or list on the stage with its checkbox to watch it live.'
        ],
        docsPath: '/blocks/variables'
    },
    {
        id: 'blocks-my-blocks',
        title: 'My Blocks',
        category: 'Blocks',
        keywords: ['custom blocks', 'define', 'procedures'],
        short: 'My Blocks are the custom blocks you define. They can take inputs, run without screen refresh, and in MistWarp report a return value.',
        howTo: [
            'Define a block, then call it like any other block.',
            'Read inputs inside the definition with the argument reporters.',
            'Return a value to use a custom block as a reporter.'
        ],
        docsPath: '/blocks/my-blocks'
    },
    {
        id: 'blocks-mistwarp-extras',
        title: 'MistWarp extra blocks',
        category: 'Blocks',
        keywords: ['turbowarp', 'extra', 'added blocks'],
        short: 'MistWarp and TurboWarp add blocks across several categories that vanilla Scratch does not have, such as while loops, switch/case, and extra text operators.',
        howTo: [
            'Extra blocks appear inline in their normal categories.',
            'They save into standard sb3 projects and run anywhere MistWarp runs.',
            'See the reference for the full list and how each behaves.'
        ],
        docsPath: '/blocks/mistwarp-extras'
    },
    {
        id: 'ext-overview',
        title: 'Extensions',
        category: 'Extensions',
        keywords: ['add extension', 'library', 'custom'],
        short: 'Extensions add extra blocks, from pen drawing and music to hardware and custom JavaScript. Add them from the Add Extension button.',
        howTo: [
            'Click Add Extension in the bottom corner of the palette.',
            'Some extensions need a camera, internet, or a Bluetooth device.',
            'You can also load a custom extension from a URL or file.'
        ],
        docsPath: '/extensions/overview'
    },
    {
        id: 'ext-mistwarp-blocks',
        title: 'MistWarp Blocks',
        category: 'Extensions',
        keywords: ['tw', 'last key', 'mouse button'],
        short: 'The MistWarp Blocks extension adds utility blocks such as the last key pressed and whether a specific mouse button is down.',
        howTo: [
            'Add it from the extension library.',
            'Use last key pressed to react to any key without naming it.',
            'Check individual mouse buttons, including right and middle click.'
        ],
        docsPath: '/extensions/mistwarp-blocks'
    },
    {
        id: 'ext-patching',
        title: 'Patching',
        category: 'Extensions',
        keywords: ['javascript', 'inject', 'compiler'],
        short: 'Patching injects JavaScript into compiled projects through jsreporter, jsboolean, and jscommand blocks. It requires the compiler.',
        howTo: [
            'Add the Patching extension from the library.',
            'Write JavaScript inside the js blocks to run custom logic.',
            'Only use code you trust; injected JavaScript runs with full access.'
        ],
        docsPath: '/extensions/patching'
    },
    {
        id: 'ext-custom',
        title: 'Custom extensions',
        category: 'Extensions',
        keywords: ['load', 'url', 'file', 'third party'],
        short: 'Custom extensions load extra blocks from a URL, a file, or pasted JavaScript, including sandboxed and unsandboxed extensions.',
        howTo: [
            'Choose Custom Extension in the library, then provide a URL or file.',
            'Unsandboxed extensions can do more but require you to trust the source.',
            'See Building Extensions to write your own.'
        ],
        docsPath: '/extensions/custom-extension'
    },
    {
        id: 'ext-music',
        title: 'Music',
        category: 'Extensions',
        keywords: ['instruments', 'drums', 'notes', 'tempo'],
        short: 'The Music extension plays instrument notes and drums and sets the tempo.',
        howTo: [
            'Pick an instrument, then play notes for a duration.',
            'Play drum sounds for rhythm.',
            'Set the tempo to speed up or slow down playback.'
        ],
        docsPath: '/extensions/music'
    },
    {
        id: 'ext-pen',
        title: 'Pen',
        category: 'Extensions',
        keywords: ['draw', 'stamp', 'trails', 'lines'],
        short: 'The Pen extension lets sprites draw lines and stamp images onto the stage.',
        howTo: [
            'Use pen down and pen up to control drawing as a sprite moves.',
            'Set pen color, size, and shade.',
            'Stamp prints the sprite\'s current costume onto the stage.'
        ],
        docsPath: '/extensions/pen'
    },
    {
        id: 'ext-video-sensing',
        title: 'Video Sensing',
        category: 'Extensions',
        keywords: ['camera', 'motion', 'webcam'],
        short: 'Video Sensing uses your camera to detect motion on sprites and the stage. It needs camera access.',
        howTo: [
            'Add the extension and allow camera access when prompted.',
            'Read the motion amount on a sprite to react to movement.',
            'Turn the video layer on or off and set its transparency.'
        ],
        docsPath: '/extensions/video-sensing'
    },
    {
        id: 'ext-face-sensing',
        title: 'Face Sensing',
        category: 'Extensions',
        keywords: ['camera', 'face', 'tracking'],
        short: 'Face Sensing detects faces through the camera. It loads from the TurboWarp extension gallery and needs camera access.',
        howTo: [
            'Add the extension and allow camera access.',
            'Read face position and features to drive sprites.',
            'Works best with good lighting and a clear view of the face.'
        ],
        docsPath: '/extensions/face-sensing'
    },
    {
        id: 'ext-text-to-speech',
        title: 'Text to Speech',
        category: 'Extensions',
        keywords: ['talk', 'voice', 'speak'],
        short: 'Text to Speech makes projects speak text aloud in several voices and languages. It needs an internet connection.',
        howTo: [
            'Add the extension, then use the speak block with your text.',
            'Choose a voice and set the language.',
            'Requires internet because speech is generated online.'
        ],
        docsPath: '/extensions/text-to-speech'
    },
    {
        id: 'ext-translate',
        title: 'Translate',
        category: 'Extensions',
        keywords: ['language', 'translation'],
        short: 'Translate converts text into many languages and reports the viewer\'s language. It needs an internet connection.',
        howTo: [
            'Add the extension and use the translate block with a target language.',
            'Read the viewer\'s language to localize a project automatically.',
            'Requires internet because translation happens online.'
        ],
        docsPath: '/extensions/translate'
    },
    {
        id: 'ext-makey-makey',
        title: 'Makey Makey',
        category: 'Extensions',
        keywords: ['hardware', 'keys', 'input'],
        short: 'The Makey Makey extension adds blocks that respond to Makey Makey key presses and sequences.',
        howTo: [
            'Add the extension; a Makey Makey acts like a keyboard.',
            'React to a key or to a sequence of keys.',
            'No pairing is needed beyond plugging the device in.'
        ],
        docsPath: '/extensions/makey-makey'
    },
    {
        id: 'ext-microbit',
        title: 'micro:bit',
        category: 'Extensions',
        keywords: ['bbc', 'hardware', 'bluetooth', 'sensors'],
        short: 'The micro:bit extension connects to a BBC micro:bit over Bluetooth to read buttons, motion, and the pins, and to drive the LED display.',
        howTo: [
            'Add the extension and pair your micro:bit over Bluetooth.',
            'Read buttons, tilt, and pin state; display text and images.',
            'Requires a compatible browser and the Scratch Link helper.'
        ],
        docsPath: '/extensions/micro-bit'
    },
    {
        id: 'ext-ev3',
        title: 'LEGO MINDSTORMS EV3',
        category: 'Extensions',
        keywords: ['lego', 'robotics', 'bluetooth', 'motors'],
        short: 'The EV3 extension controls LEGO MINDSTORMS EV3 motors and sensors over Bluetooth.',
        howTo: [
            'Add the extension and pair the EV3 brick.',
            'Drive motors and read the touch and distance sensors.',
            'Requires Scratch Link and a paired device.'
        ],
        docsPath: '/extensions/ev3'
    },
    {
        id: 'ext-boost',
        title: 'LEGO BOOST',
        category: 'Extensions',
        keywords: ['lego', 'robotics', 'bluetooth'],
        short: 'The BOOST extension controls a LEGO BOOST model over Bluetooth, including motors, color sensing, and tilt.',
        howTo: [
            'Add the extension and pair the BOOST hub.',
            'Drive motors and read color and tilt.',
            'Requires Scratch Link and a paired device.'
        ],
        docsPath: '/extensions/boost'
    },
    {
        id: 'ext-wedo2',
        title: 'LEGO Education WeDo 2.0',
        category: 'Extensions',
        keywords: ['lego', 'bluetooth', 'motor', 'sensor'],
        short: 'The WeDo 2.0 extension controls a LEGO Education WeDo 2.0 motor and reads its motion and distance sensors over Bluetooth.',
        howTo: [
            'Add the extension and pair the WeDo 2.0 hub.',
            'Run the motor and read the tilt and distance sensors.',
            'Requires Scratch Link and a paired device.'
        ],
        docsPath: '/extensions/wedo2'
    },
    {
        id: 'ext-force-and-acceleration',
        title: 'Go Direct Force and Acceleration',
        category: 'Extensions',
        keywords: ['vernier', 'sensor', 'bluetooth', 'physics'],
        short: 'This extension reads a Vernier Go Direct Force and Acceleration sensor over Bluetooth.',
        howTo: [
            'Add the extension and pair the sensor.',
            'Read force, acceleration, and spin values in your project.',
            'Requires Scratch Link and a paired device.'
        ],
        docsPath: '/extensions/force-and-acceleration'
    },
    {
        id: 'cloud-variables',
        title: 'Cloud variables',
        category: 'Advanced',
        keywords: ['online', 'shared data', 'multiplayer'],
        short: 'Cloud variables store a value on the server so it is shared between everyone running a project.',
        howTo: [
            'Make a variable and choose the cloud option, or prefix it as a cloud variable.',
            'Cloud variables hold numbers and sync between players.',
            'See the guide for limits and how cloud data behaves when packaged.'
        ],
        docsPath: '/advanced/cloud-variables'
    },
    {
        id: 'javascript',
        title: 'JavaScript and the compiler',
        category: 'Advanced',
        keywords: ['performance', 'compile', 'window.vm'],
        short: 'MistWarp compiles blocks into JavaScript for speed. Advanced users can also access the running project through window.vm.',
        howTo: [
            'The compiler runs automatically; disable it in Settings to compare behavior.',
            'Open the browser console and use window.vm to inspect the running project.',
            'The Patching extension can inject custom JavaScript into compiled projects.'
        ],
        docsPath: '/advanced/javascript'
    },
    {
        id: 'url-parameters',
        title: 'URL parameters',
        category: 'Advanced',
        keywords: ['query', 'links', 'options'],
        short: 'URL parameters change how the editor or player behaves when a project loads, such as forcing settings or hiding controls.',
        howTo: [
            'Append parameters to the page URL to change load behavior.',
            'Useful for sharing a project preset to a specific configuration.',
            'See the guide for the full list of supported parameters.'
        ],
        docsPath: '/advanced/url-parameters'
    },
    {
        id: 'embedding',
        title: 'Embedding projects',
        category: 'Advanced',
        keywords: ['iframe', 'website', 'embed', 'postmessage'],
        short: 'You can embed a MistWarp project in another web page and, optionally, communicate with it from the surrounding page.',
        howTo: [
            'Embed the player in an iframe on your site.',
            'Adjust size and controls with URL parameters.',
            'Use the messaging API to send and receive data from the page.'
        ],
        docsPath: '/advanced/embedding'
    }
];

const getHelpEntry = id => HELP_ENTRIES.find(e => e.id === id) || null;

const searchHelp = query => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return HELP_ENTRIES;
    return HELP_ENTRIES.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.short.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.keywords || []).some(k => k.toLowerCase().includes(q))
    );
};

const validateHelpRegistry = () => {
    const seen = new Set();
    const docsPathRe = /^\/[\w\-/]+$/;
    for (const e of HELP_ENTRIES) {
        if (!e.id || seen.has(e.id)) throw new Error(`help: duplicate or missing id "${e.id}"`);
        seen.add(e.id);
        if (!HELP_CATEGORIES.includes(e.category)) throw new Error(`help: bad category "${e.category}" on "${e.id}"`);
        if (!e.title || !e.short) throw new Error(`help: missing title/short on "${e.id}"`);
        if (!Array.isArray(e.howTo) || e.howTo.length === 0) throw new Error(`help: empty howTo on "${e.id}"`);
        if (e.docsPath && !docsPathRe.test(e.docsPath)) throw new Error(`help: bad docsPath "${e.docsPath}" on "${e.id}"`);
    }
    return true;
};

export {
    DOCS_BASE,
    HELP_CATEGORIES,
    HELP_ENTRIES,
    getHelpEntry,
    searchHelp,
    validateHelpRegistry
};
