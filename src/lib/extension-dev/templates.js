import {snippet} from '@codemirror/autocomplete';
import {ensureSyntaxTree, syntaxTree} from '@codemirror/language';

const deriveExtensionId = name => String(name || '').toLowerCase()
    .replace(/[^a-z0-9]/g, '') || 'myextension';

const isValidExtensionId = id => typeof id === 'string' && /^[a-z0-9]+$/i.test(id);

const RESERVED_CLASS_NAMES = new Set([
    'Scratch', 'Error', 'Promise', 'Object', 'Math', 'Array', 'String', 'Number', 'Boolean', 'Symbol', 'Map',
    'Set', 'Date', 'JSON', 'RegExp', 'Function', 'Reflect', 'Proxy', 'Intl', 'BigInt', 'Window', 'Document',
    'Console', 'Infinity', 'NaN', 'Undefined', 'Arguments', 'Eval', 'Target', 'Args'
]);

const className = name => {
    const words = String(name || '').match(/[A-Za-z0-9]+/g) || [];
    const joined = words.map(word => word[0].toUpperCase() + word.slice(1)).join('');
    if (!joined) return 'MyExtension';
    if (/^[0-9]/.test(joined)) return `Extension${joined}`;
    return RESERVED_CLASS_NAMES.has(joined) ? `${joined}Extension` : joined;
};

const singleLine = value => String(value || '').replace(/[\r\n\u2028\u2029]+/g, ' ')
    .trim();

const header = ({name, id, description, author}) => [
    `// Name: ${singleLine(name) || 'My Extension'}`,
    `// ID: ${id}`,
    `// Description: ${singleLine(description) || 'Describe what this extension does.'}`,
    `// By: ${singleLine(author) || 'You'}`,
    '// License: MPL-2.0',
    ''
].join('\n');

const blankTemplate = ({name, id, description, author} = {}) => {
    const displayName = singleLine(name) || 'My Extension';
    const extensionId = isValidExtensionId(id) ? id : deriveExtensionId(displayName);
    return `${header({name: displayName, id: extensionId, description, author})}
(function (Scratch) {
  "use strict";

  class ${className(displayName)} {
    /** @returns {Scratch.Info} */
    getInfo() {
      return {
        id: ${JSON.stringify(extensionId)},
        name: ${JSON.stringify(displayName)},
        blocks: [
          {
            opcode: "hello",
            blockType: Scratch.BlockType.REPORTER,
            text: "hello [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "world",
              },
            },
          },
        ],
      };
    }

    hello(args) {
      return "Hello, " + Scratch.Cast.toString(args.NAME) + "!";
    }
  }

  Scratch.extensions.register(new ${className(displayName)}());
})(Scratch);
`;
};

const unsandboxedTemplate = ({name, id, description, author} = {}) => {
    const displayName = singleLine(name) || 'My Extension';
    const extensionId = isValidExtensionId(id) ? id : deriveExtensionId(displayName);
    return `${header({name: displayName, id: extensionId, description, author})}
(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error(${JSON.stringify(`${displayName} must run unsandboxed`)});
  }

  class ${className(displayName)} {
    constructor() {
      this.starts = 0;
      Scratch.vm.runtime.on("PROJECT_START", () => {
        this.starts++;
      });
    }

    /** @returns {Scratch.Info} */
    getInfo() {
      return {
        id: ${JSON.stringify(extensionId)},
        name: ${JSON.stringify(displayName)},
        blocks: [
          {
            opcode: "timesStarted",
            blockType: Scratch.BlockType.REPORTER,
            text: "times green flag clicked",
          },
          {
            opcode: "spriteCount",
            blockType: Scratch.BlockType.REPORTER,
            text: "number of sprites",
          },
        ],
      };
    }

    timesStarted() {
      return this.starts;
    }

    spriteCount() {
      return Scratch.vm.runtime.targets.filter(target => target.isOriginal && !target.isStage).length;
    }
  }

  Scratch.extensions.register(new ${className(displayName)}());
})(Scratch);
`;
};

const enclosingClassBody = (state, pos) => {
    const tree = ensureSyntaxTree(state, state.doc.length, 200) || syntaxTree(state);
    for (let node = tree.resolveInner(pos, -1); node; node = node.parent) {
        if (node.name === 'ClassBody') return state.sliceDoc(node.to - 1, node.to) === '}' ? node : null;
    }
    return null;
};

const uniqueOpcode = (doc, base) => {
    for (let n = 1; ; n++) {
        const opcode = `${base}${n}`;
        if (!doc.includes(`"${opcode}"`) && !doc.includes(`'${opcode}'`) && !doc.includes(`${opcode}(`)) return opcode;
    }
};

const blockSnippet = ({label, detail, base, block, methods}) => ({
    label,
    detail,
    type: 'snippet',
    boost: 1,
    apply: (view, completion, from, to) => {
        const doc = view.state.doc.toString();
        const opcode = uniqueOpcode(doc, base);
        const classBody = enclosingClassBody(view.state, from);
        let methodChange = null;
        if (classBody && methods) {
            const classIndent = /^\s*/.exec(view.state.doc.lineAt(classBody.from).text)[0];
            const text = methods(opcode).split('\n')
                .map(each => (each ? `${classIndent}  ${each}` : each))
                .join('\n');
            const brace = classBody.to - 1;
            const closeLine = view.state.doc.lineAt(brace);
            const onOwnLine = /^\s*$/.test(view.state.doc.sliceString(closeLine.from, brace));
            methodChange = onOwnLine ?
                {from: closeLine.from, insert: `\n${text}\n`} :
                {from: brace, insert: `\n${text}\n${classIndent}`};
        }
        if (!methodChange) {
            snippet(block(opcode))(view, completion, from, to);
            return;
        }
        const state = Object.create(view.state);
        state.update = (...specs) => view.state.update(...specs, {changes: methodChange});
        snippet(block(opcode))({state, dispatch: transaction => view.dispatch(transaction)}, completion, from, to);
    }
});

const argumentsSnippet = type => `arguments: {\n\tVALUE: {\n\t\ttype: Scratch.ArgumentType.${type},\n` +
    `\t\tdefaultValue: \${2:${type === 'NUMBER' ? '10' : '"text"'}},\n\t},\n},`;

const snippets = [
    blockSnippet({
        label: 'block',
        detail: 'Command block',
        base: 'doSomething',
        block: opcode => `{\n\topcode: "${opcode}",\n\tblockType: Scratch.BlockType.COMMAND,\n` +
            `\ttext: "\${1:do something with} [VALUE]",\n${argumentsSnippet('STRING').replace(/^/gm, '\t')}\n},`,
        methods: opcode => `${opcode}(args) {\n  console.log(args.VALUE);\n}`
    }),
    blockSnippet({
        label: 'reporter',
        detail: 'Reporter block',
        base: 'getValue',
        block: opcode => `{\n\topcode: "${opcode}",\n\tblockType: Scratch.BlockType.REPORTER,\n` +
            `\ttext: "\${1:value of} [VALUE]",\n${argumentsSnippet('STRING').replace(/^/gm, '\t')}\n},`,
        methods: opcode => `${opcode}(args) {\n  return Scratch.Cast.toString(args.VALUE);\n}`
    }),
    blockSnippet({
        label: 'boolean',
        detail: 'Boolean block',
        base: 'isTrue',
        block: opcode => `{\n\topcode: "${opcode}",\n\tblockType: Scratch.BlockType.BOOLEAN,\n` +
            `\ttext: "\${1:is} [VALUE] true?",\n\targuments: {\n\t\tVALUE: {\n` +
            '\t\t\ttype: Scratch.ArgumentType.BOOLEAN,' +
            `\n\t\t},\n\t},\n},`,
        methods: opcode => `${opcode}(args) {\n  return Scratch.Cast.toBoolean(args.VALUE);\n}`
    }),
    blockSnippet({
        label: 'hat',
        detail: 'Hat block started with runtime.startHats',
        base: 'whenSomething',
        block: opcode => `{\n\topcode: "${opcode}",\n\tblockType: Scratch.BlockType.HAT,\n` +
            `\ttext: "\${1:when something happens}",\n\tisEdgeActivated: false,\n},`,
        methods: opcode => `${opcode}() {\n  return true;\n}`
    }),
    blockSnippet({
        label: 'label',
        detail: 'Palette label',
        base: 'label',
        block: () => `{\n\tblockType: Scratch.BlockType.LABEL,\n\ttext: "\${1:Section}",\n},`,
        methods: null
    }),
    blockSnippet({
        label: 'compiled reporter',
        detail: 'Reporter with compFunc and returnType',
        base: 'double',
        block: opcode => `{\n\topcode: "${opcode}",\n\tblockType: Scratch.BlockType.REPORTER,\n` +
            `\ttext: "\${1:double} [VALUE]",\n${argumentsSnippet('NUMBER').replace(/^/gm, '\t')}\n` +
            `\treturnType: Scratch.ReturnType.NUMBER,\n\tcompFunc: "${opcode}Compiled",\n},`,
        methods: opcode => `${opcode}Compiled(args, {cast}) {\n` +
            `  return \`(\${cast.toNumber(args.VALUE)} * 2)\`;\n}\n\n` +
            `${opcode}(args) {\n  return Scratch.Cast.toNumber(args.VALUE) * 2;\n}`
    }),
    {
        label: 'menu',
        detail: 'Menu for menus',
        type: 'snippet',
        boost: 1,
        apply: snippet('#{menuName}: {\n\tacceptReporters: true,\n\titems: [#{"first"}, "second"],\n},')
    }
];

export {
    deriveExtensionId,
    isValidExtensionId,
    blankTemplate,
    unsandboxedTemplate,
    snippets
};
