# Commits pages visual style cleanup

**Session ID:** ses_f946c28e4ffe4bx82a3ci0qvWJ
**Created:** 9/4/2026, 9:40:46 AM
**Updated:** 9/4/2026, 6:55:05 PM

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.3s)

**Tool: bash**

**Input:**
```json
{
  "command": "node /tmp/tr.mjs 2>/dev/null",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 60000
}
```

**Output:**
```
when I receive [coinclaim]
change [wealth] by (cointype)
repeat (10)
  turn left (5) degrees
end
hide
play sound [] until done
---changed---
DESC: when green flag clicked
BEFORE:
when green flag clicked
- move (10) steps
say [hi]
AFTER:
when green flag clicked
+ move (20) steps
say [hi]

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.0s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "node -e \"import('fractch/browser').then(m => { const p = m.parseFractch('when flag {\\n playSoundUntilDone \\\"mixkit-quick-win-video-game-notification-269\\\";\\n}\\n'); const s = p.scripts[0].calls.find(n => n?.callee?.name==='sound_playuntildone'); console.log(JSON.stringify(s)); })\" 2>/dev/null",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 60000
}
```

**Output:**
```
{"type":"call","callee":{"type":"opcode","name":"sound_playuntildone"},"args":[{"kind":"keyed","sep":"input","key":"SOUND_MENU","value":{"type":"call","value":{"type":"call","callee":{"type":"opcode","name":"sound_sounds_menu"},"args":[{"kind":"positional","value":{"type":"string","value":"mixkit-quick-win-video-game-notification-269"}}]}}}],"line":2}

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.8s)

_Thinking:_

Debugging a nested call unwrap in translateValue where the callee name matches '_menu' but the inner node lacks a string or array value, causing an empty result.

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "newString": "const translateMenuValue = value => {\n    if (typeof value === 'string') return cleanMenuValue(value);\n    const node = unwrapCall(value);\n    if (!node || typeof node !== 'object') return '';\n    if (node.type === 'call') {\n        const inner = node.callee ? node : node.value;\n        const name = inner?.callee?.name || '';\n        if (name.endsWith('menu') || name.endsWith('menus')) {\n            const positional = (inner.args || []).find(arg => typeof arg.value === 'object' || typeof arg.value === 'string');\n            const raw = typeof positional?.value === 'string' ?\n                positional.value : positional?.value?.value ?? positional?.value?.name ?? '';\n            return cleanMenuValue(raw);\n        }\n        return '';\n    }",
  "oldString": "const translateMenuValue = value => {\n    if (typeof value === 'string') return cleanMenuValue(value);\n    const node = unwrapCall(value);\n    if (!node || typeof node !== 'object') return '';"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 5.5s)

**Tool: bash**

**Input:**
```json
{
  "command": "node /tmp/tr.mjs 2>/dev/null | head -8",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 60000
}
```

**Output:**
```
when I receive [coinclaim]
change [wealth] by (cointype)
repeat (10)
  turn left (5) degrees
end
hide
play sound [mixkit-quick-win-video-game-notification-269 v] until done
---changed---

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 14.7s)

_Thinking:_

Planning translator unit tests and a DOM-free render test with canvas mock for scratchblocks diff output.

_Thinking:_



**Tool: write**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-scratchblocks-translate.test.js",
  "content": "import {\n    changedScripts,\n    matchScripts,\n    translateCall,\n    translateScript,\n    translateValue\n} from '../../src/community/scratchblocks-translate.js';\nimport {parseFractch} from 'fractch/browser';\n\nconst firstCall = (source, opcode) => {\n    const parsed = parseFractch(source);\n    const found = [];\n    const visit = nodes => {\n        for (const node of nodes || []) {\n            if (node?.type === 'call' && node.callee?.type === 'opcode') {\n                if (!opcode || node.callee.name === opcode) found.push(node);\n            }\n            for (const arg of node.args || []) {\n                if (arg?.body) visit(arg.body);\n                else if (arg?.value) visit([arg.value]);\n            }\n            if (node.body) visit(node.body);\n        }\n    };\n    for (const script of parsed.scripts) visit(script.calls);\n    return opcode ? found[0] : found;\n};\n\nconst translateSource = source => {\n    const parsed = parseFractch(source);\n    return parsed.scripts.map(script => translateScript(script)).join('\\n\\n');\n};\n\ndescribe('scratchblocks translation', () => {\n    test('translates hats to scratch language', () => {\n        expect(translateSource('when flag {\\n}\\n')).toContain('when green flag clicked');\n        expect(translateSource('when broadcast go {\\n}\\n')).toContain('when I receive [go]');\n        expect(translateSource('when clicked {\\n}\\n')).toContain('when this sprite clicked');\n        expect(translateSource('when key \"space\" {\\n}\\n')).toContain('when [space v] key pressed');\n        expect(translateSource('when clone {\\n}\\n')).toContain('when I start as a clone');\n    });\n\n    test('translates common statements', () => {\n        const text = translateSource(\n            'when flag {\\n  move 10;\\n  turnLeft 15;\\n  say \"hi\" for 2;\\n  hide;\\n  wait 1;\\n  broadcast go;\\n}\\n'\n        );\n\n        expect(text).toContain('move (10) steps');\n        expect(text).toContain('turn left (15) degrees');\n        expect(text).toContain('say [hi] for (2) seconds');\n        expect(text).toContain('hide');\n        expect(text).toContain('wait (1) seconds');\n        expect(text).toContain('broadcast [go]');\n    });\n\n    test('translates variables, sounds, and pen', () => {\n        const text = translateSource(\n            'when flag {\\n  score = 0;\\n  score += 1;\\n  playSound pop;\\n  pen_down;\\n  stamp;\\n}\\n'\n        );\n\n        expect(text).toContain('set [score] to (0)');\n        expect(text).toContain('change [score] by (1)');\n        expect(text).toContain('play sound [pop v]');\n        expect(text).toContain('pen down');\n        expect(text).toContain('stamp');\n    });\n\n    test('translates control structures with nesting', () => {\n        const text = translateSource(\n            'when flag {\\n  repeat 4 {\\n    if touching(\"edge\") {\\n      stop all;\\n    }\\n  }\\n}\\n'\n        );\n\n        expect(text).toContain('repeat (4)');\n        expect(text).toContain('if <touching [edge v]?> then');\n        expect(text).toContain('stop [all v]');\n        expect(text).toContain('end');\n    });\n\n    test('translates operators and reporters', () => {\n        expect(translateValue({type: 'number', value: 10, raw: '10'})).toBe('(10)');\n        expect(translateValue({type: 'string', value: 'hi'})).toBe('[hi]');\n        expect(translateValue({type: 'var', name: 'score'})).toBe('(score)');\n        expect(translateValue({type: 'array', value: ['lives']})).toBe('[lives]');\n        const equals = firstCall('when flag {\\n  if a == 1 {\\n  }\\n}\\n', 'operator_equals');\n        expect(translateCall(equals)).toBe('<(a) = (1)>');\n    });\n\n    test('falls back gracefully for unknown opcodes', () => {\n        const text = translateCall({type: 'call', callee: {type: 'opcode', name: 'some_future_block'}});\n        expect(text).toBe('some future block');\n    });\n\n    test('marks added and removed statements', () => {\n        const matches = changedScripts('when flag {\\n  move 10;\\n}\\n', 'when flag {\\n  move 20;\\n}\\n');\n\n        expect(matches).toHaveLength(1);\n        expect(matches[0].before).toContain('- move (10) steps');\n        expect(matches[0].after).toContain('+ move (20) steps');\n    });\n\n    test('detects added and removed scripts', () => {\n        const matches = changedScripts(\n            'when flag {\\n  move 10;\\n}\\n',\n            'when flag {\\n  move 10;\\n}\\nwhen key \"space\" {\\n  say \"hi\";\\n}\\n'\n        );\n        const added = matches.find(match => match.before === null);\n\n        expect(added.after).toContain('when [space v] key pressed');\n        expect(added.after).toContain('say [hi]');\n    });\n\n    test('matches scripts by hat and reports descriptions', () => {\n        const matches = matchScripts(\n            parseFractch('when broadcast go {\\n  move 10;\\n}\\n'),\n            parseFractch('when broadcast go {\\n  move 10;\\n}\\n')\n        );\n\n        expect(matches).toHaveLength(1);\n        expect(matches[0].changed).toBe(false);\n    });\n});\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 15.0s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-scratchblocks-translate.test.js 2>&1 | tail -25",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```

      at Object.toBe (test/unit/community-scratchblocks-translate.test.js:85:39)

  ● scratchblocks translation › falls back gracefully for unknown opcodes

    expect(received).toBe(expected) // Object.is equality

    Expected: "some future block"
    Received: "future block"

      88 |     test('falls back gracefully for unknown opcodes', () => {
      89 |         const text = translateCall({type: 'call', callee: {type: 'opcode', name: 'some_future_block'}});
    > 90 |         expect(text).toBe('some future block');
         |                      ^
      91 |     });
      92 |
      93 |     test('marks added and removed statements', () => {

      at Object.toBe (test/unit/community-scratchblocks-translate.test.js:90:22)

Test Suites: 1 failed, 1 total
Tests:       3 failed, 6 passed, 9 total
Snapshots:   0 total
Time:        4.28 s
Ran all test suites matching /test\/unit\/community-scratchblocks-translate.test.js/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 16.3s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-scratchblocks-translate.test.js 2>&1 | grep -B2 -A12 \"●.*›\" | head -80",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
    ✓ matches scripts by hat and reports descriptions (1 ms)

  ● scratchblocks translation › translates hats to scratch language

    expect(received).toContain(expected) // indexOf

    Expected substring: "when I start as a clone"
    Received string:    "start as clone"

      38 |         expect(translateSource('when clicked {\n}\n')).toContain('when this sprite clicked');
      39 |         expect(translateSource('when key "space" {\n}\n')).toContain('when [space v] key pressed');
    > 40 |         expect(translateSource('when clone {\n}\n')).toContain('when I start as a clone');
         |                                                      ^
      41 |     });
      42 |
--
      at Object.toContain (test/unit/community-scratchblocks-translate.test.js:40:54)

  ● scratchblocks translation › translates operators and reporters

    expect(received).toBe(expected) // Object.is equality

    Expected: "<(a) = (1)>"
    Received: ""

      83 |         expect(translateValue({type: 'array', value: ['lives']})).toBe('[lives]');
      84 |         const equals = firstCall('when flag {\n  if a == 1 {\n  }\n}\n', 'operator_equals');
    > 85 |         expect(translateCall(equals)).toBe('<(a) = (1)>');
         |                                       ^
      86 |     });
      87 |
--
      at Object.toBe (test/unit/community-scratchblocks-translate.test.js:85:39)

  ● scratchblocks translation › falls back gracefully for unknown opcodes

    expect(received).toBe(expected) // Object.is equality

    Expected: "some future block"
    Received: "future block"

      88 |     test('falls back gracefully for unknown opcodes', () => {
      89 |         const text = translateCall({type: 'call', callee: {type: 'opcode', name: 'some_future_block'}});
    > 90 |         expect(text).toBe('some future block');
         |                      ^
      91 |     });
      92 |

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 13.5s)

_Thinking:_

Analyzing a translator opcode mismatch and fallback producing unexpected script text.

_Thinking:_

Refining the visitor to descend into nested call wrappers and correcting the fallback expectation.

**Tool: bash**

**Input:**
```json
{
  "command": "node -e \"import('fractch/browser').then(m => { for (const s of ['when clone {\\n}\\n', 'when clicked {\\n}\\n']) { const p = m.parseFractch(s); console.log(JSON.stringify(p.scripts[0].calls.map(c => c?.type + ':' + (c?.callee?.name || c?.callee?.type || '')))); } })\" 2>/dev/null",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 60000
}
```

**Output:**
```
["call:control_start_as_clone"]
["call:event_whenthisspriteclicked"]

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 12.2s)

_Thinking:_

Analyzing why a specific opcode failed to translate by tracing callee type and head-finding logic.

_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "newString": "const isHatOpcode = name =>\n    typeof name === 'string' && (name.startsWith('event_') || name === 'control_start_as_clone');\n\nconst isHatCall = node => node?.type === 'call' && node.callee?.type === 'opcode' && isHatOpcode(node.callee.name);",
  "oldString": "const translateHat = node => {"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.0s)

_Thinking:_



**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "offset": 228,
  "limit": 18
}
```

**Output:**
```
<path>/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js</path>
<type>file</type>
<content>
228:     case 'pen_changePenShadeBy': return `change pen shade by ${inputOf(node, 'SHADE', '10')}`;
229:     case 'pen_setPenHueToNumber': return `set pen color to ${inputOf(node, 'HUE', '50')}`;
230:     case 'pen_changePenHueBy': return `change pen color by ${inputOf(node, 'HUE', '10')}`;
231:     default: {
232:         const pretty = opcode.includes('_') ? opcode.slice(opcode.indexOf('_') + 1).replace(/_/g, ' ') : opcode;
233:         const inputs = (node.args || [])
234:             .filter(arg => arg.key && arg.value !== null && typeof arg.value !== 'undefined')
235:             .map(arg => translateValue(arg.value))
236:             .join(' ');
237:         return inputs ? `${pretty} ${inputs}` : pretty;
238:     }
239:     }
240: };
241: 
242: const isHatOpcode = name =>
243:     typeof name === 'string' && (name.startsWith('event_') || name === 'control_start_as_clone');
244: 
245: const isHatCall = node => node?.type === 'call' && node.callee?.type === 'opcode' && isHatOpcode(node.callee.name);

(Showing lines 228-245 of 498. Use offset=246 to continue.)
</content>
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.0s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx",
  "offset": 246,
  "limit": 25
}
```

**Output:**
```
<path>/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx</path>
<type>file</type>
<content>
246:     return {variables: [], sprite: [], scripts: [], assets: rows, watchers: [], extensions: []};
247: };
248: 
249: const sideForStatus = (side, status) => {
250:     if (side === 'old' && status === 'Added') return {status: 'empty', message: 'New in this commit.'};
251:     if (side === 'new' && status === 'Deleted') return {status: 'empty', message: 'Removed in this commit.'};
252:     return {status: 'loading'};
253: };
254: 
255: export const AssetCompare = ({file, loadAsset}) => {
256:     const [sides, setSides] = useState(() => ({
257:         old: sideForStatus('old', file.status),
258:         new: sideForStatus('new', file.status)
259:     }));
260:     const [attempt, setAttempt] = useState(0);
261:     const urlsRef = useRef([]);
262:     useEffect(() => () => {
263:         urlsRef.current.forEach(url => URL.revokeObjectURL(url));
264:         urlsRef.current = [];
265:     }, []);
266: 
267:     useEffect(() => {
268:         let active = true;
269:         urlsRef.current.forEach(url => URL.revokeObjectURL(url));
270:         urlsRef.current = [];

(Showing lines 246-270 of 540. Use offset=271 to continue.)
</content>
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.5s)

_Thinking:_



**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "offset": 242,
  "limit": 20
}
```

**Output:**
```
<path>/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js</path>
<type>file</type>
<content>
242: const isHatOpcode = name =>
243:     typeof name === 'string' && (name.startsWith('event_') || name === 'control_start_as_clone');
244: 
245: const isHatCall = node => node?.type === 'call' && node.callee?.type === 'opcode' && isHatOpcode(node.callee.name);
246:     if (!node || node.type !== 'call' || node.callee?.type !== 'opcode') {
247:         if (node?.type === 'call' && node.callee?.type === 'procedureCall') return null;
248:         return null;
249:     }
250:     switch (node.callee.name) {
251:     case 'event_whenflagclicked': return 'when green flag clicked';
252:     case 'event_whenkeypressed': return `when ${menuOf(node, 'KEY_OPTION')} key pressed`;
253:     case 'event_whenthisspriteclicked': return 'when this sprite clicked';
254:     case 'event_whenstageclicked': return 'when stage clicked';
255:     case 'event_whenbroadcastreceived': return `when I receive ${refOf(node, 'BROADCAST_OPTION', 'message1')}`;
256:     case 'event_whenbackdropswitchesto': return `switch backdrop to ${menuOf(node, 'BACKDROP')}`.replace('switch backdrop to', 'when backdrop switches to');
257:     case 'event_whengreaterthan': {
258:         const menu = translateMenuValue(argValue(node, 'WHENGREATERTHANMENU')).toLowerCase() || 'timer';
259:         return `when [${menu} v] > ${inputOf(node, 'VALUE', '10')}`;
260:     }
261:     case 'control_start_as_clone': return 'when I start as a clone';

(Showing lines 242-261 of 498. Use offset=262 to continue.)
</content>
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.2s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "newString": "const isHatCall = node => node?.type === 'call' && node.callee?.type === 'opcode' && isHatOpcode(node.callee.name);\n\nconst translateHat = node => {\n    if (!node || node.type !== 'call' || node.callee?.type !== 'opcode') {",
  "oldString": "const isHatCall = node => node?.type === 'call' && node.callee?.type === 'opcode' && isHatOpcode(node.callee.name);\n    if (!node || node.type !== 'call' || node.callee?.type !== 'opcode') {"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.1s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "grep -n \"startsWith('event_')\" src/community/scratchblocks-translate.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
243:    typeof name === 'string' && (name.startsWith('event_') || name === 'control_start_as_clone');
334:        calls.find(node => node?.type === 'call' && node.callee?.type === 'opcode' && node.callee.name.startsWith('event_')) ||
391:        if (head?.type === 'call' && head.callee?.type === 'opcode' && head.callee.name.startsWith('event_')) {
487:    const hat = calls.find(node => node?.type === 'call' && node.callee?.type === 'opcode' && node.callee.name.startsWith('event_'));

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 11.6s)

**Tool: bash**

**Input:**
```json
{
  "command": "python3 - <<'EOF'\np = 'src/community/scratchblocks-translate.js'\ns = open(p).read()\ns = s.replace(\"calls.find(node => node?.type === 'call' && node.callee?.type === 'opcode' && node.callee.name.startsWith('event_')) ||\",\n              \"calls.find(isHatCall) ||\")\ns = s.replace(\"if (head?.type === 'call' && head.callee?.type === 'opcode' && head.callee.name.startsWith('event_')) {\",\n              \"if (isHatCall(head)) {\")\ns = s.replace(\"const hat = calls.find(node => node?.type === 'call' && node.callee?.type === 'opcode' && node.callee.name.startsWith('event_'));\",\n              \"const hat = calls.find(isHatCall);\")\nopen(p, 'w').write(s)\nprint('ok')\nEOF\ngrep -n \"startsWith('event_')\" src/community/scratchblocks-translate.js; npx babel src/community/scratchblocks-translate.js -o /dev/null 2>&1 | head -3 && echo BABEL-OK",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```
ok
243:    typeof name === 'string' && (name.startsWith('event_') || name === 'control_start_as_clone');
BABEL-OK

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 14.9s)

_Thinking:_



_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-scratchblocks-translate.test.js",
  "newString": "    const visit = nodes => {\n        for (const node of nodes || []) {\n            if (node?.type === 'call' && node.callee?.type === 'opcode') {\n                if (!opcode || node.callee.name === opcode) found.push(node);\n            }\n            if (node?.type === 'call' && node.value) visit([node.value]);\n            for (const arg of node.args || []) {\n                if (arg?.body) visit(arg.body);\n                else if (arg?.value) visit([arg.value]);\n            }\n            if (node.body) visit(node.body);\n        }\n    };",
  "oldString": "    const visit = nodes => {\n        for (const node of nodes || []) {\n            if (node?.type === 'call' && node.callee?.type === 'opcode') {\n                if (!opcode || node.callee.name === opcode) found.push(node);\n            }\n            for (const arg of node.args || []) {\n                if (arg?.body) visit(arg.body);\n                else if (arg?.value) visit([arg.value]);\n            }\n            if (node.body) visit(node.body);\n        }\n    };"
}
```

**Output:**
```
Edit applied successfully.
```

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-scratchblocks-translate.test.js",
  "newString": "        const text = translateCall({type: 'call', callee: {type: 'opcode', name: 'some_future_block'}});\n        expect(text).toBe('future block');",
  "oldString": "        const text = translateCall({type: 'call', callee: {type: 'opcode', name: 'some_future_block'}});\n        expect(text).toBe('some future block');"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 18.7s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-scratchblocks-translate.test.js 2>&1 | tail -16 && npx eslint src/community/scratchblocks-translate.js 2>&1 | tail -5",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
  scratchblocks translation
    ✓ translates hats to scratch language (8 ms)
    ✓ translates common statements (4 ms)
    ✓ translates variables, sounds, and pen (1 ms)
    ✓ translates control structures with nesting (2 ms)
    ✓ translates operators and reporters (2 ms)
    ✓ falls back gracefully for unknown opcodes (1 ms)
    ✓ marks added and removed statements (3 ms)
    ✓ detects added and removed scripts (1 ms)
    ✓ matches scripts by hat and reports descriptions (1 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        2.899 s
Ran all test suites matching /test\/unit\/community-scratchblocks-translate.test.js/i.
  477:19  error  'describeScriptHead' was used before it was defined                              no-use-before-define

✖ 24 problems (24 errors, 0 warnings)
  5 errors and 0 warnings potentially fixable with the `--fix` option.


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.4s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx eslint --fix src/community/scratchblocks-translate.js && npx eslint src/community/scratchblocks-translate.js 2>&1 | tail -6",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```

/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js
   37:1   error  This line has a length of 126. Maximum allowed is 120                            max-len
   71:22  error  'translateCall' was used before it was defined                                   no-use-before-define
  118:1   error  This line has a length of 136. Maximum allowed is 120                            max-len
  129:1   error  This line has a length of 122. Maximum allowed is 120                            max-len
  131:1   error  This line has a length of 126. Maximum allowed is 120                            max-len
  146:1   error  This line has a length of 126. Maximum allowed is 120                            max-len
  170:1   error  This line has a length of 122. Maximum allowed is 120                            max-len
  181:1   error  This line has a length of 127. Maximum allowed is 120                            max-len
  201:1   error  This line has a length of 121. Maximum allowed is 120                            max-len
  206:1   error  This line has a length of 126. Maximum allowed is 120                            max-len
  213:1   error  This line has a length of 148. Maximum allowed is 120                            max-len
  214:1   error  This line has a length of 161. Maximum allowed is 120                            max-len
  258:1   error  This line has a length of 156. Maximum allowed is 120                            max-len
  299:41  error  'conditionOf' was used before it was defined                                     no-use-before-define
  301:38  error  'conditionOf' was used before it was defined                                     no-use-before-define
  302:35  error  'conditionOf' was used before it was defined                                     no-use-before-define
  385:1   error  This line has a length of 124. Maximum allowed is 120                            max-len
  474:15  error  'head' is assigned a value but never used. Allowed unused vars must match /^_/u  no-unused-vars
  477:19  error  'describeScriptHead' was used before it was defined                              no-use-before-define

✖ 19 problems (19 errors, 0 warnings)


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 13.6s)

_Thinking:_

Converting mutually-recursive const arrows to hoisted function declarations to satisfy no-use-before-define and fixing max-len and unused variable issues.

_Thinking:_

Removing the unused head variable and hoisting remaining arrow functions to function declarations.

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "python3 - <<'EOF'\np = 'src/community/scratchblocks-translate.js'\ns = open(p).read()\ns = s.replace(\"export const translateCall = node => {\", \"export function translateCall (node) {\")\ns = s.replace(\"const conditionOf = (node, key) => {\", \"function conditionOf (node, key) {\")\ns = s.replace(\"const describeScriptHead = script => {\", \"function describeScriptHead (script) {\")\nopen(p, 'w').write(s)\nprint('ok')\nEOF\ngrep -n \"const head = (match\" src/community/scratchblocks-translate.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
ok
474:        const head = (match.after || match.before).calls[0];

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.1s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "offset": 465,
  "limit": 22
}
```

**Output:**
```
<path>/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js</path>
<type>file</type>
<content>
465:         before = parseFractch(beforeText || '');
466:         after = parseFractch(afterText || '');
467:     } catch (error) {
468:         return [];
469:     }
470:     const out = [];
471:     for (const match of matchScripts(before, after)) {
472:         if (!match.changed) continue;
473:         const {added, removed} = diffScriptCalls(match.before, match.after);
474:         const head = (match.after || match.before).calls[0];
475:         out.push({
476:             key: match.key,
477:             desc: describeScriptHead(match.after || match.before),
478:             before: match.before ? translateScript(match.before, {added: new Set(), removed}) : null,
479:             after: match.after ? translateScript(match.after, {added, removed: new Set()}) : null
480:         });
481:     }
482:     return out;
483: };
484: 
485: function describeScriptHead (script) {
486:     const calls = script?.calls || [];

(Showing lines 465-486 of 500. Use offset=487 to continue.)
</content>
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.1s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "newString": "        const {added, removed} = diffScriptCalls(match.before, match.after);\n        out.push({",
  "oldString": "        const {added, removed} = diffScriptCalls(match.before, match.after);\n        const head = (match.after || match.before).calls[0];\n        out.push({"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.1s)

**Tool: bash**

**Input:**
```json
{
  "command": "awk 'length > 120 {print NR\": \"substr($0, 1, 80)}' src/community/scratchblocks-translate.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
37:             const positional = (inner.args || []).find(arg => typeof arg.value =
118:     case 'motion_glidesecstoxy': return `glide ${inputOf(node, 'SECS', '1')} sec
129:     case 'looks_sayforsecs': return `say ${inputOf(node, 'MESSAGE', 'Hello!')} f
131:     case 'looks_thinkforsecs': return `think ${inputOf(node, 'MESSAGE', 'Hmm...'
146:     case 'looks_goforwardbackwardlayers': return `go ${menuOf(node, 'FORWARD_BAC
170:     case 'sensing_coloristouchingcolor': return `color ${inputOf(node, 'COLOR')}
181:     case 'sensing_of': return `[${translateMenuValue(argValue(node, 'PROPERTY'))
201:     case 'operator_contains': return `<${inputOf(node, 'STRING1', 'apple')} cont
206:     case 'data_changevariableby': return `change ${refOf(node, 'VARIABLE', 'my v
213:     case 'data_insertatlist': return `insert ${inputOf(node, 'ITEM', 'thing')} a
214:     case 'data_replaceitemoflist': return `replace item ${inputOf(node, 'INDEX',
258:     case 'event_whenbackdropswitchesto': return `switch backdrop to ${menuOf(nod
385: const scriptSignature = script => JSON.stringify(stripVolatile((script.calls || 

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 15.4s)

**Tool: bash**

**Input:**
```json
{
  "command": "python3 - <<'EOF'\nimport re\np = 'src/community/scratchblocks-translate.js'\nlines = open(p).read().split('\\n')\nout = []\nfor line in lines:\n    if len(line) > 120 and line.strip().startswith('case ') and 'return `' in line:\n        indent = line[:len(line) - len(line.lstrip())]\n        pre, rest = line.split('return `', 1)\n        expr, suffix = rest.rsplit('`;', 1)\n        # split template at safe boundaries: '}, ${' occurrences\n        parts = re.split(r'(\\} \\$\\{|\\} [a-z]+ \\$\\{)', expr)\n        if len(parts) > 1:\n            out.append(f'{indent}case{pre.split(\"case\",1)[1]}return (')\n            # naive rejoin into continuation lines\n            chunks = []\n            cur = ''\n            for tok in re.findall(r'\\$\\{[^}]*\\}|[^{\\}$]+', expr):\n                if len(cur) + len(tok) > 90 and cur:\n                    chunks.append(cur); cur = tok\n                else: cur += tok\n            if cur: chunks.append(cur)\n            for i, ch in enumerate(chunks):\n                comma = '' if i == len(chunks)-1 else ''\n                out.append(f'{indent}    `{ch}`{comma}' if i else f'{indent}    `{ch}` +')\n            # fix: join with +\n            out.append(f'{indent});{suffix}')\n            continue\n    out.append(line)\nopen(p, 'w').write('\\n'.join(out))\nprint('done')\nEOF\nnpx eslint src/community/scratchblocks-translate.js 2>&1 | tail -6",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```
Traceback (most recent call last):
  File "<stdin>", line 9, in <module>
ValueError: not enough values to unpack (expected 2, got 1)
  484:1   error  Missing JSDoc comment                                  require-jsdoc
  499:2   error  Unnecessary semicolon                                  no-extra-semi

✖ 27 problems (27 errors, 0 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 16.3s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx eslint src/community/scratchblocks-translate.js 2>&1 | head -30",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```

/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js
   37:1   error  This line has a length of 126. Maximum allowed is 120  max-len
   71:22  error  'translateCall' was used before it was defined         no-use-before-define
  102:8   error  Expected a function expression                         func-style
  102:8   error  Missing JSDoc comment                                  require-jsdoc
  118:1   error  This line has a length of 136. Maximum allowed is 120  max-len
  129:1   error  This line has a length of 122. Maximum allowed is 120  max-len
  131:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  146:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  170:1   error  This line has a length of 122. Maximum allowed is 120  max-len
  181:1   error  This line has a length of 127. Maximum allowed is 120  max-len
  201:1   error  This line has a length of 121. Maximum allowed is 120  max-len
  206:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  213:1   error  This line has a length of 148. Maximum allowed is 120  max-len
  214:1   error  This line has a length of 161. Maximum allowed is 120  max-len
  240:2   error  Unnecessary semicolon                                  no-extra-semi
  258:1   error  This line has a length of 156. Maximum allowed is 120  max-len
  299:41  error  'conditionOf' was used before it was defined           no-use-before-define
  301:38  error  'conditionOf' was used before it was defined           no-use-before-define
  302:35  error  'conditionOf' was used before it was defined           no-use-before-define
  319:1   error  Expected a function expression                         func-style
  319:1   error  Missing JSDoc comment                                  require-jsdoc
  328:2   error  Unnecessary semicolon                                  no-extra-semi
  385:1   error  This line has a length of 124. Maximum allowed is 120  max-len
  476:19  error  'describeScriptHead' was used before it was defined    no-use-before-define
  484:1   error  Expected a function expression                         func-style
  484:1   error  Missing JSDoc comment                                  require-jsdoc
  499:2   error  Unnecessary semicolon                                  no-extra-semi


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 18.3s)

_Thinking:_

Checking whether the Python replace edits actually applied and why ESLint still flags function declarations.

**Tool: bash**

**Input:**
```json
{
  "command": "grep -rn \"no-use-before-define\" src .eslintrc.js 2>/dev/null | head -5; grep -n \"no-use-before-define\\|func-style\\|require-jsdoc\" .eslintrc.js | head",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
src/addons/addons/workspace-tabs/userscript.js:175:            // eslint-disable-next-line no-use-before-define
src/addons/api.js:110:    // eslint-disable-next-line no-use-before-define
src/components/spotlight/spotlight.jsx:1:/* eslint-disable no-use-before-define, func-style, require-jsdoc, no-loop-func */

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 14.6s)

_Thinking:_

Evaluating a targeted disable versus restructuring to break a mutual recursion cycle in the translator module.

_Thinking:_

Assessing a dispatch-table or single-function refactor against lint constraints and forward-declaration limits.

**Tool: bash**

**Input:**
```json
{
  "command": "grep -n \"translateCall\\s*=\\|function translateCall\\|conditionOf\\s*=\\|function conditionOf\\|describeScriptHead\\s*=\\|function describeScriptHead\\|translateHat\\s*=\\|function translateHat\" src/community/scratchblocks-translate.js; grep -n \"func-style\\|no-use-before\" .eslintrc.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
102:export function translateCall (node) {
247:const translateHat = node => {
319:function conditionOf (node, key) {
484:function describeScriptHead (script) {

```

---

## User

[Image 1] why is there no block diff?

---

## Assistant (Build · Muse Spark 1.3 Contributor · 38.6s)

_Thinking:_

Resuming translator lint fixes and planning a BlocksCompare component with UI wiring and tests.

_Thinking:_

Reordering mutual recursion and converting functions to arrows to satisfy lint rules.

_Thinking:_

Choosing targeted eslint-disable comments over a large refactor to resolve forward-reference cycles.

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "git diff --stat; npx eslint src/community/scratchblocks-translate.js 2>&1 | head -25",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```
 package.json                                       |   6 +-
 pnpm-lock.yaml                                     | 455 +--------------------
 scripts/prepublish.mjs                             |  17 +-
 src/community/commit-diff.js                       |  68 ++-
 src/community/components/DiffView.jsx              | 454 ++++++++++++++++++--
 src/community/components/DiffView.module.css       | 295 ++++++++++++-
 src/community/components/FileBrowserTree.jsx       |  13 +-
 .../components/FileBrowserTree.module.css          |   3 +-
 src/community/components/ProjectFiles.jsx          |  41 ++
 src/community/components/ProjectFiles.module.css   |   8 +-
 src/community/pages/Commit.jsx                     |  42 +-
 src/community/pages/Commit.module.css              |   2 +-
 src/community/pages/PullRequest.jsx                |  91 ++++-
 src/lib/microbit-update.js                         |   2 +-
 test/unit/community-commit-diff.test.js            |  45 ++
 test/unit/community-diff-view.test.jsx             | 224 +++++++++-
 test/unit/community-project-files.test.jsx         |  20 +
 webpack.config.js                                  |   2 +
 18 files changed, 1214 insertions(+), 574 deletions(-)

/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js
   37:1   error  This line has a length of 126. Maximum allowed is 120  max-len
   71:22  error  'translateCall' was used before it was defined         no-use-before-define
  102:8   error  Expected a function expression                         func-style
  102:8   error  Missing JSDoc comment                                  require-jsdoc
  118:1   error  This line has a length of 136. Maximum allowed is 120  max-len
  129:1   error  This line has a length of 122. Maximum allowed is 120  max-len
  131:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  146:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  170:1   error  This line has a length of 122. Maximum allowed is 120  max-len
  181:1   error  This line has a length of 127. Maximum allowed is 120  max-len
  201:1   error  This line has a length of 121. Maximum allowed is 120  max-len
  206:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  213:1   error  This line has a length of 148. Maximum allowed is 120  max-len
  214:1   error  This line has a length of 161. Maximum allowed is 120  max-len
  240:2   error  Unnecessary semicolon                                  no-extra-semi
  258:1   error  This line has a length of 156. Maximum allowed is 120  max-len
  299:41  error  'conditionOf' was used before it was defined           no-use-before-define
  301:38  error  'conditionOf' was used before it was defined           no-use-before-define
  302:35  error  'conditionOf' was used before it was defined           no-use-before-define
  319:1   error  Expected a function expression                         func-style
  319:1   error  Missing JSDoc comment                                  require-jsdoc
  328:2   error  Unnecessary semicolon                                  no-extra-semi
  385:1   error  This line has a length of 124. Maximum allowed is 120  max-len

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.4s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "sed -n 100,104p src/community/scratchblocks-translate.js; echo ---; sed -n 238,242p src/community/scratchblocks-translate.js; echo ---; sed -n 317,330p src/community/scratchblocks-translate.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
};

export function translateCall (node) {
    if (!node || node.type !== 'call' || !node.callee) return '';
    if (node.callee.type === 'procedureCall') {
---
    }
    }
};

const isHatOpcode = name =>
---
};

function conditionOf (node, key) {
    const value = argValue(node, key);
    const unwrapped = unwrapCall(value);
    if (unwrapped?.type === 'call' && unwrapped.callee) {
        const inner = unwrapped.callee ? unwrapped : unwrapped.value;
        const text = translateCall(inner?.callee ? inner : unwrapped);
        return `<${text}>`;
    }
    return `<${translateValue(value).replace(/^\(|\)$/g, '')}>`;
};

export const translateScript = (script, marks = null) => {

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.7s)

**Tool: bash**

**Input:**
```json
{
  "command": "python3 - <<'EOF'\nimport re\np = 'src/community/scratchblocks-translate.js'\ns = open(p).read()\ns = s.replace(\"export function translateCall (node) {\", \"export const translateCall = node => {\")\ns = s.replace(\"function conditionOf (node, key) {\", \"const conditionOf = (node, key) => {\")\ns = s.replace(\"function describeScriptHead (script) {\", \"const describeScriptHead = script => {\")\n# fix double semicolons after switch blocks (}; following a closing brace of switch)\ns = s.replace(\"    }\\n};\\n\\nconst isHatOpcode\", \"    }\\n}\\n\\nconst isHatOpcode\")\nopen(p, 'w').write(s)\nprint('ok')\nEOF\ngrep -n \"^};\" src/community/scratchblocks-translate.js | head",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
ok
11:};
19:};
25:};
48:};
80:};
85:};
94:};
100:};
266:};
278:};

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 12.6s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx eslint src/community/scratchblocks-translate.js 2>&1 | head -25",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```

/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js
   37:1   error  This line has a length of 126. Maximum allowed is 120  max-len
   71:22  error  'translateCall' was used before it was defined         no-use-before-define
  118:1   error  This line has a length of 136. Maximum allowed is 120  max-len
  129:1   error  This line has a length of 122. Maximum allowed is 120  max-len
  131:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  146:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  170:1   error  This line has a length of 122. Maximum allowed is 120  max-len
  181:1   error  This line has a length of 127. Maximum allowed is 120  max-len
  201:1   error  This line has a length of 121. Maximum allowed is 120  max-len
  206:1   error  This line has a length of 126. Maximum allowed is 120  max-len
  213:1   error  This line has a length of 148. Maximum allowed is 120  max-len
  214:1   error  This line has a length of 161. Maximum allowed is 120  max-len
  240:2   error  Missing semicolon                                      semi
  258:1   error  This line has a length of 156. Maximum allowed is 120  max-len
  299:41  error  'conditionOf' was used before it was defined           no-use-before-define
  301:38  error  'conditionOf' was used before it was defined           no-use-before-define
  302:35  error  'conditionOf' was used before it was defined           no-use-before-define
  385:1   error  This line has a length of 124. Maximum allowed is 120  max-len
  476:19  error  'describeScriptHead' was used before it was defined    no-use-before-define

✖ 19 problems (19 errors, 0 warnings)
  1 error and 0 warnings potentially fixable with the `--fix` option.


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.7s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "sed -n 236,244p src/community/scratchblocks-translate.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
            .join(' ');
        return inputs ? `${pretty} ${inputs}` : pretty;
    }
    }
}

const isHatOpcode = name =>
    typeof name === 'string' && (name.startsWith('event_') || name === 'control_start_as_clone');


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.2s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "newString": "        return inputs ? `${pretty} ${inputs}` : pretty;\n    }\n    }\n};\n\nconst isHatOpcode = name =>",
  "oldString": "        return inputs ? `${pretty} ${inputs}` : pretty;\n    }\n    }\n}\n\nconst isHatOpcode = name =>"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 5.5s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "awk 'length > 120 {print NR\": \"$0}' src/community/scratchblocks-translate.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
37:             const positional = (inner.args || []).find(arg => typeof arg.value === 'object' || typeof arg.value === 'string');
118:     case 'motion_glidesecstoxy': return `glide ${inputOf(node, 'SECS', '1')} secs to x: ${inputOf(node, 'X')} y: ${inputOf(node, 'Y')}`;
129:     case 'looks_sayforsecs': return `say ${inputOf(node, 'MESSAGE', 'Hello!')} for ${inputOf(node, 'SECS', '2')} seconds`;
131:     case 'looks_thinkforsecs': return `think ${inputOf(node, 'MESSAGE', 'Hmm...')} for ${inputOf(node, 'SECS', '2')} seconds`;
146:     case 'looks_goforwardbackwardlayers': return `go ${menuOf(node, 'FORWARD_BACKWARD')} ${inputOf(node, 'NUM', '1')} layers`;
170:     case 'sensing_coloristouchingcolor': return `color ${inputOf(node, 'COLOR')} is touching ${inputOf(node, 'COLOR2')}?`;
181:     case 'sensing_of': return `[${translateMenuValue(argValue(node, 'PROPERTY'))} v] of ${inputOf(node, 'OBJECT', 'Sprite1')}`;
201:     case 'operator_contains': return `<${inputOf(node, 'STRING1', 'apple')} contains ${inputOf(node, 'STRING2', 'a')}?>`;
206:     case 'data_changevariableby': return `change ${refOf(node, 'VARIABLE', 'my variable')} by ${inputOf(node, 'VALUE', '1')}`;
213:     case 'data_insertatlist': return `insert ${inputOf(node, 'ITEM', 'thing')} at ${inputOf(node, 'INDEX', '1')} of ${refOf(node, 'LIST', 'list')}`;
214:     case 'data_replaceitemoflist': return `replace item ${inputOf(node, 'INDEX', '1')} of ${refOf(node, 'LIST', 'list')} with ${inputOf(node, 'ITEM', 'thing')}`;
258:     case 'event_whenbackdropswitchesto': return `switch backdrop to ${menuOf(node, 'BACKDROP')}`.replace('switch backdrop to', 'when backdrop switches to');
385: const scriptSignature = script => JSON.stringify(stripVolatile((script.calls || []).filter(node => node?.type === 'call')));

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 12.2s)

**Tool: bash**

**Input:**
```json
{
  "command": "python3 - <<'EOF'\np = 'src/community/scratchblocks-translate.js'\ns = open(p).read()\nsubs = [\n(\"\"\"            const positional = (inner.args || []).find(arg => typeof arg.value === 'object' || typeof arg.value === 'string');\"\"\",\n\"\"\"            const positional = (inner.args || []).find(arg => (\n                typeof arg.value === 'object' || typeof arg.value === 'string'\n            ));\"\"\"),\n(\"\"\"    case 'motion_glidesecstoxy': return `glide ${inputOf(node, 'SECS', '1')} secs to x: ${inputOf(node, 'X')} y: ${inputOf(node, 'Y')}`;\"\"\",\n\"\"\"    case 'motion_glidesecstoxy': {\n        const secs = inputOf(node, 'SECS', '1');\n        return `glide ${secs} secs to x: ${inputOf(node, 'X')} y: ${inputOf(node, 'Y')}`;\n    }\"\"\"),\n(\"\"\"    case 'looks_sayforsecs': return `say ${inputOf(node, 'MESSAGE', 'Hello!')} for ${inputOf(node, 'SECS', '2')} seconds`;\"\"\",\n\"\"\"    case 'looks_sayforsecs': {\n        const message = inputOf(node, 'MESSAGE', 'Hello!');\n        return `say ${message} for ${inputOf(node, 'SECS', '2')} seconds`;\n    }\"\"\"),\n(\"\"\"    case 'looks_thinkforsecs': return `think ${inputOf(node, 'MESSAGE', 'Hmm...')} for ${inputOf(node, 'SECS', '2')} seconds`;\"\"\",\n\"\"\"    case 'looks_thinkforsecs': {\n        const message = inputOf(node, 'MESSAGE', 'Hmm...');\n        return `think ${message} for ${inputOf(node, 'SECS', '2')} seconds`;\n    }\"\"\"),\n(\"\"\"    case 'looks_goforwardbackwardlayers': return `go ${menuOf(node, 'FORWARD_BACKWARD')} ${inputOf(node, 'NUM', '1')} layers`;\"\"\",\n\"\"\"    case 'looks_goforwardbackwardlayers': {\n        const direction = menuOf(node, 'FORWARD_BACKWARD');\n        return `go ${direction} ${inputOf(node, 'NUM', '1')} layers`;\n    }\"\"\"),\n(\"\"\"    case 'sensing_coloristouchingcolor': return `color ${inputOf(node, 'COLOR')} is touching ${inputOf(node, 'COLOR2')}?`;\"\"\",\n\"\"\"    case 'sensing_coloristouchingcolor': {\n        const first = inputOf(node, 'COLOR');\n        return `color ${first} is touching ${inputOf(node, 'COLOR2')}?`;\n    }\"\"\"),\n(\"\"\"    case 'sensing_of': return `[${translateMenuValue(argValue(node, 'PROPERTY'))} v] of ${inputOf(node, 'OBJECT', 'Sprite1')}`;\"\"\",\n\"\"\"    case 'sensing_of': {\n        const property = translateMenuValue(argValue(node, 'PROPERTY'));\n        return `[${property} v] of ${inputOf(node, 'OBJECT', 'Sprite1')}`;\n    }\"\"\"),\n(\"\"\"    case 'operator_contains': return `<${inputOf(node, 'STRING1', 'apple')} contains ${inputOf(node, 'STRING2', 'a')}?>`;\"\"\",\n\"\"\"    case 'operator_contains': {\n        const text = inputOf(node, 'STRING1', 'apple');\n        return `<${text} contains ${inputOf(node, 'STRING2', 'a')}?>`;\n    }\"\"\"),\n(\"\"\"    case 'data_changevariableby': return `change ${refOf(node, 'VARIABLE', 'my variable')} by ${inputOf(node, 'VALUE', '1')}`;\"\"\",\n\"\"\"    case 'data_changevariableby': {\n        const variable = refOf(node, 'VARIABLE', 'my variable');\n        return `change ${variable} by ${inputOf(node, 'VALUE', '1')}`;\n    }\"\"\"),\n(\"\"\"    case 'data_insertatlist': return `insert ${inputOf(node, 'ITEM', 'thing')} at ${inputOf(node, 'INDEX', '1')} of ${refOf(node, 'LIST', 'list')}`;\"\"\",\n\"\"\"    case 'data_insertatlist': {\n        const item = inputOf(node, 'ITEM', 'thing');\n        return `insert ${item} at ${inputOf(node, 'INDEX', '1')} of ${refOf(node, 'LIST', 'list')}`;\n    }\"\"\"),\n(\"\"\"    case 'data_replaceitemoflist': return `replace item ${inputOf(node, 'INDEX', '1')} of ${refOf(node, 'LIST', 'list')} with ${inputOf(node, 'ITEM', 'thing')}`;\"\"\",\n\"\"\"    case 'data_replaceitemoflist': {\n        const index = inputOf(node, 'INDEX', '1');\n        const list = refOf(node, 'LIST', 'list');\n        return `replace item ${index} of ${list} with ${inputOf(node, 'ITEM', 'thing')}`;\n    }\"\"\"),\n(\"\"\"    case 'event_whenbackdropswitchesto': return `switch backdrop to ${menuOf(node, 'BACKDROP')}`.replace('switch backdrop to', 'when backdrop switches to');\"\"\",\n\"\"\"    case 'event_whenbackdropswitchesto':\n        return `when backdrop switches to ${menuOf(node, 'BACKDROP')}`;\"\"\"),\n(\"\"\"const scriptSignature = script => JSON.stringify(stripVolatile((script.calls || []).filter(node => node?.type === 'call')));\"\"\",\n\"\"\"const scriptSignature = script => JSON.stringify(stripVolatile(\n    (script.calls || []).filter(node => node?.type === 'call')\n));\"\"\"),\n]\nmissing = [a for a, _ in subs if a not in s]\nassert not missing, missing\nfor a, b in subs:\n    s = s.replace(a, b)\nopen(p, 'w').write(s)\nprint('ok')\nEOF\nnpx eslint src/community/scratchblocks-translate.js 2>&1 | tail -8",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```
ok
   73:22  error  'translateCall' was used before it was defined       no-use-before-define
  333:41  error  'conditionOf' was used before it was defined         no-use-before-define
  335:38  error  'conditionOf' was used before it was defined         no-use-before-define
  336:35  error  'conditionOf' was used before it was defined         no-use-before-define
  512:19  error  'describeScriptHead' was used before it was defined  no-use-before-define

✖ 5 problems (5 errors, 0 warnings)


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.6s)

_Thinking:_



_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "sed -n 71,73p src/community/scratchblocks-translate.js; echo ---; sed -n 331,338p src/community/scratchblocks-translate.js; echo ---; sed -n 510,514p src/community/scratchblocks-translate.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
        if (inner?.callee?.name?.endsWith('menu')) return `[${translateMenuValue(inner)} v]`;
        if (!inner || inner.type !== 'call' || !inner.callee) return '()';
        const text = translateCall(inner);
---
                node.callee.name === 'control_forever' ? 'forever' :
                    node.callee.name === 'control_repeat_until' ?
                        `repeat until ${conditionOf(node, 'CONDITION')}` :
                        node.callee.name === 'control_while' ?
                            `while ${conditionOf(node, 'CONDITION')}` :
                            `if ${conditionOf(node, 'CONDITION')} then`;
            lines.push(`${prefix}${pad}${cond}`);
            lines.push(...translateStatements(branchBodies(node)[0]?.body || [], indent + 1, marks));
---
        out.push({
            key: match.key,
            desc: describeScriptHead(match.after || match.before),
            before: match.before ? translateScript(match.before, {added: new Set(), removed}) : null,
            after: match.after ? translateScript(match.after, {added, removed: new Set()}) : null

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 19.4s)

**Tool: bash**

**Input:**
```json
{
  "command": "python3 - <<'EOF'\np = 'src/community/scratchblocks-translate.js'\ns = open(p).read()\ns = s.replace(\"\"\"        if (!inner || inner.type !== 'call' || !inner.callee) return '()';\n        const text = translateCall(inner);\"\"\",\n\"\"\"        if (!inner || inner.type !== 'call' || !inner.callee) return '()';\n        // Mutual recursion with translateCall; safe at runtime after module evaluation.\n        // eslint-disable-next-line no-use-before-define\n        const text = translateCall(inner);\"\"\")\ns = s.replace(\"\"\"                    node.callee.name === 'control_repeat_until' ?\n                        `repeat until ${conditionOf(node, 'CONDITION')}` :\n                        node.callee.name === 'control_while' ?\n                            `while ${conditionOf(node, 'CONDITION')}` :\n                            `if ${conditionOf(node, 'CONDITION')} then`;\"\"\",\n\"\"\"                    node.callee.name === 'control_repeat_until' ?\n                        // eslint-disable-next-line no-use-before-define\n                        `repeat until ${conditionOf(node, 'CONDITION')}` :\n                        node.callee.name === 'control_while' ?\n                            // eslint-disable-next-line no-use-before-define\n                            `while ${conditionOf(node, 'CONDITION')}` :\n                            // eslint-disable-next-line no-use-before-define\n                            `if ${conditionOf(node, 'CONDITION')} then`;\"\"\")\ns = s.replace(\"\"\"            key: match.key,\n            desc: describeScriptHead(match.after || match.before),\"\"\",\n\"\"\"            key: match.key,\n            // eslint-disable-next-line no-use-before-define\n            desc: describeScriptHead(match.after || match.before),\"\"\")\nopen(p, 'w').write(s)\nprint('ok')\nEOF\nnpx eslint src/community/scratchblocks-translate.js && echo LINT-OK && npx jest test/unit/community-scratchblocks-translate.test.js 2>&1 | tail -5",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
ok
LINT-OK
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        2.197 s
Ran all test suites matching /test\/unit\/community-scratchblocks-translate.test.js/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 30.4s)

_Thinking:_

Creating a separate BlocksCompare component that renders before and after scratchblocks SVGs side by side using shared CSS classes.

_Thinking:_

Adding a React effect to render scratchblocks with a canvas fallback and empty-state handling.

_Thinking:_

Adding a memoized script diff with per-group cap and separate BlocksCompare component.

_Thinking:_



**Tool: write**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/BlocksCompare.jsx",
  "content": "import PropTypes from 'prop-types';\nimport React, {useEffect, useRef} from 'react';\nimport scratchblocks from 'scratchblocks';\nimport styles from './DiffView.module.css';\n\nconst renderScript = (container, source) => {\n    container.innerHTML = '';\n    if (!source) return false;\n    try {\n        const doc = scratchblocks.parse(source, {languages: ['en']});\n        container.appendChild(scratchblocks.render(doc, {style: 'scratch3', scale: 0.9}));\n        return true;\n    } catch (error) {\n        return false;\n    }\n};\n\nconst ScriptPane = ({label, source, emptyMessage}) => {\n    const ref = useRef(null);\n    useEffect(() => {\n        if (ref.current && source) {\n            const rendered = renderScript(ref.current, source);\n            if (!rendered) ref.current.textContent = 'Could not render blocks.';\n        }\n    }, [source]);\n    if (!source) {\n        return (\n            <div className={styles.assetPane}>\n                <span className={styles.assetLabel}>{label}</span>\n                <p className={styles.assetState}>{emptyMessage}</p>\n            </div>\n        );\n    }\n    return (\n        <div className={styles.assetPane}>\n            <span className={styles.assetLabel}>{label}</span>\n            <div ref={ref} className={styles.blocksPreview} />\n        </div>\n    );\n};\n\nScriptPane.propTypes = {\n    label: PropTypes.string.isRequired,\n    source: PropTypes.string,\n    emptyMessage: PropTypes.string.isRequired\n};\n\nScriptPane.defaultProps = {\n    source: null\n};\n\nconst BlocksCompare = ({before, after}) => (\n    <div className={styles.assetCompare}>\n        <ScriptPane label=\"Before\" source={before} emptyMessage=\"New in this commit.\" />\n        <ScriptPane label=\"After\" source={after} emptyMessage=\"Removed in this commit.\" />\n    </div>\n);\n\nBlocksCompare.propTypes = {\n    before: PropTypes.string,\n    after: PropTypes.string\n};\n\nBlocksCompare.defaultProps = {\n    before: null,\n    after: null\n};\n\nexport default BlocksCompare;\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 9.3s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.module.css",
  "newString": ".assetState button {\n    border: 0;\n    background: none;\n    color: var(--accent-strong);\n    font: inherit;\n    font-weight: 700;\n    cursor: pointer;\n}\n\n.blocksSection {\n    display: grid;\n    gap: 12px;\n    padding: 12px 14px;\n    border: 0;\n    border-radius: 9px;\n    background: var(--bg-card);\n    box-shadow: var(--card-shadow);\n}\n\n.blockScript {\n    display: grid;\n    gap: 8px;\n    min-width: 0;\n}\n\n.blockScript + .blockScript {\n    padding-top: 12px;\n    border-top: 1px solid var(--border-soft);\n}\n\n.blockDesc {\n    color: var(--text-dim);\n    font-size: 12px;\n    font-weight: 700;\n}\n\n.blockTruncated {\n    margin: 0;\n    color: var(--text-faint);\n    font-size: 12px;\n}\n\n.blocksPreview {\n    min-height: 60px;\n    max-height: 420px;\n    padding: 12px 14px;\n    overflow: auto;\n    border-radius: 8px;\n    background: var(--bg-raised);\n}\n\n.blocksPreview svg {\n    display: block;\n    max-width: none;\n    height: auto;\n}",
  "oldString": ".assetState button {\n    border: 0;\n    background: none;\n    color: var(--accent-strong);\n    font: inherit;\n    font-weight: 700;\n    cursor: pointer;\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.6s)

_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx",
  "newString": "import {cancelMovedAssets, filterCoveredDiffLines, isEmptySummary, summarizeFractchChange} from '../fractch-summary.js';\nimport {changedScripts} from '../scratchblocks-translate.js';\nimport {builtinExtensionMeta, resolveExtensionMetas} from '../extension-meta.js';\nimport BlocksCompare from './BlocksCompare.jsx';",
  "oldString": "import {cancelMovedAssets, filterCoveredDiffLines, isEmptySummary, summarizeFractchChange} from '../fractch-summary.js';\nimport {builtinExtensionMeta, resolveExtensionMetas} from '../extension-meta.js';"
}
```

**Output:**
```
Edit applied successfully.
```

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx",
  "newString": "        cancelMovedAssets(map);\n        return {summaries: map, coveredFiles: covered};\n    }, [spriteFiles, fileTexts]);\n    const extensionMetas = useExtensionMetas(summaries);\n    const blockScripts = useMemo(() => {\n        const map = {};\n        for (const file of spriteFiles) {\n            if (!/\\.fractch$/i.test(file.path)) continue;\n            const group = spriteOfPath(file.path);\n            const texts = fileTexts[file.path];\n            if (!texts) continue;\n            const scripts = changedScripts(texts.before, texts.after);\n            if (scripts.length) map[group] = [...(map[group] || []), ...scripts];\n        }\n        return map;\n    }, [spriteFiles, fileTexts]);",
  "oldString": "        cancelMovedAssets(map);\n        return {summaries: map, coveredFiles: covered};\n    }, [spriteFiles, fileTexts]);\n    const extensionMetas = useExtensionMetas(summaries);"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.2s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx",
  "newString": "                        {tabSummary ? (\n                            <SummarySections\n                                summary={tabSummary}\n                                assetsTitle={assetsTitle}\n                                extensionMetas={extensionMetas}\n                            />\n                        ) : null}\n                        {activeTab === 'code' && (blockScripts[group.name] || []).length ? (\n                            <section className={styles.blocksSection} aria-label=\"Changed scripts as blocks\">\n                                {blockScripts[group.name].slice(0, MAX_BLOCK_SCRIPTS).map(script => (\n                                    <div className={styles.blockScript} key={script.key}>\n                                        <span className={styles.blockDesc}>{script.desc}</span>\n                                        <BlocksCompare before={script.before} after={script.after} />\n                                    </div>\n                                ))}\n                                {blockScripts[group.name].length > MAX_BLOCK_SCRIPTS ? (\n                                    <p className={styles.blockTruncated}>\n                                        And {blockScripts[group.name].length - MAX_BLOCK_SCRIPTS} more changed script{blockScripts[group.name].length - MAX_BLOCK_SCRIPTS === 1 ? '' : 's'}.\n                                    </p>\n                                ) : null}\n                            </section>\n                        ) : null}",
  "oldString": "                        {tabSummary ? (\n                            <SummarySections\n                                summary={tabSummary}\n                                assetsTitle={assetsTitle}\n                                extensionMetas={extensionMetas}\n                            />\n                        ) : null}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.0s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx",
  "newString": "const CATEGORIES = [\n    {key: 'code', label: 'Code'},\n    {key: 'costumes', label: 'Costumes'},\n    {key: 'sounds', label: 'Sounds'}\n];\n\nconst MAX_BLOCK_SCRIPTS = 6;",
  "oldString": "const CATEGORIES = [\n    {key: 'code', label: 'Code'},\n    {key: 'costumes', label: 'Costumes'},\n    {key: 'sounds', label: 'Sounds'}\n];"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 18.9s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx babel src/community/components/BlocksCompare.jsx -o /dev/null 2>&1 | head -3; npx eslint src/community/components/BlocksCompare.jsx src/community/components/DiffView.jsx 2>&1 | tail -6",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```
  499:1   error  Expected indentation of 32 spaces but found 28            indent
  500:1   error  Expected indentation of 28 spaces but found 24            indent

✖ 24 problems (24 errors, 0 warnings)
  23 errors and 0 warnings potentially fixable with the `--fix` option.


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 14.1s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx eslint --fix src/community/components/BlocksCompare.jsx src/community/components/DiffView.jsx && npx eslint src/community/components/BlocksCompare.jsx src/community/components/DiffView.jsx 2>&1 | tail -6",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```

/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx
  496:1  error  This line has a length of 192. Maximum allowed is 120  max-len

✖ 1 problem (1 error, 0 warnings)


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 5.4s)

**Tool: bash**

**Input:**
```json
{
  "command": "sed -n 494,498p src/community/components/DiffView.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
                                    {blockScripts[group.name].length > MAX_BLOCK_SCRIPTS ? (
                                        <p className={styles.blockTruncated}>
                                            And {blockScripts[group.name].length - MAX_BLOCK_SCRIPTS} more changed script{blockScripts[group.name].length - MAX_BLOCK_SCRIPTS === 1 ? '' : 's'}.
                                        </p>
                                    ) : null}

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.5s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx",
  "newString": "                                    {blockScripts[group.name].length > MAX_BLOCK_SCRIPTS ? (\n                                        <p className={styles.blockTruncated}>\n                                            {truncatedScriptsLabel(blockScripts[group.name].length - MAX_BLOCK_SCRIPTS)}\n                                        </p>\n                                    ) : null}",
  "oldString": "                                    {blockScripts[group.name].length > MAX_BLOCK_SCRIPTS ? (\n                                        <p className={styles.blockTruncated}>\n                                            And {blockScripts[group.name].length - MAX_BLOCK_SCRIPTS} more changed script{blockScripts[group.name].length - MAX_BLOCK_SCRIPTS === 1 ? '' : 's'}.\n                                        </p>\n                                    ) : null}"
}
```

**Output:**
```
Edit applied successfully.
```

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/DiffView.jsx",
  "newString": "const MAX_BLOCK_SCRIPTS = 6;\n\nconst truncatedScriptsLabel = count => `And ${count} more changed script${count === 1 ? '' : 's'}.`;",
  "oldString": "const MAX_BLOCK_SCRIPTS = 6;"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 13.1s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx eslint src/community/components/BlocksCompare.jsx src/community/components/DiffView.jsx && echo LINT-OK && git diff --stat src/community/components/DiffView.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 120000
}
```

**Output:**
```
LINT-OK
 src/community/components/DiffView.jsx | 487 +++++++++++++++++++++++++++++++---
 1 file changed, 452 insertions(+), 35 deletions(-)

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.1s)

_Thinking:_



_Thinking:_



**Tool: write**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "content": "import React from 'react';\nimport {mount} from 'enzyme';\n\nimport BlocksCompare from '../../src/community/components/BlocksCompare.jsx';\n\nconst mockCanvas = () => {\n    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({\n        measureText: text => ({width: String(text).length * 6})\n    }));\n};\n\ndescribe('BlocksCompare', () => {\n    beforeEach(() => {\n        mockCanvas();\n    });\n\n    test('renders before and after scripts side by side', () => {\n        const wrapper = mount(\n            <BlocksCompare\n                before={'when green flag clicked\\n- move (10) steps'}\n                after={'when green flag clicked\\n+ move (20) steps'}\n            />\n        );\n        wrapper.update();\n\n        const svgs = wrapper.find('svg');\n        expect(svgs.length).toBe(2);\n        expect(wrapper.text()).toContain('Before');\n        expect(wrapper.text()).toContain('After');\n        expect(wrapper.html()).toContain('sb-diff');\n        wrapper.unmount();\n    });\n\n    test('shows placeholders for added and removed scripts', () => {\n        const added = mount(<BlocksCompare before={null} after={'when green flag clicked\\n+say [hi]'} />);\n        expect(added.text()).toContain('New in this commit.');\n        expect(added.find('svg')).toHaveLength(1);\n        added.unmount();\n\n        const removed = mount(<BlocksCompare before={'when green flag clicked\\n-say [hi]'} after={null} />);\n        expect(removed.text()).toContain('Removed in this commit.');\n        expect(removed.find('svg')).toHaveLength(1);\n        removed.unmount();\n    });\n});\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 12.8s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | tail -12",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
         |                                   ^
      38 |         added.unmount();
      39 |
      40 |         const removed = mount(<BlocksCompare before={'when green flag clicked\n-say [hi]'} after={null} />);

      at Object.toHaveLength (test/unit/community-blocks-compare.test.jsx:37:35)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Snapshots:   0 total
Time:        2.998 s
Ran all test suites matching /test\/unit\/community-blocks-compare.test.jsx/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.1s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | grep -B5 -A20 \"●.*side by side\" | head -45",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
FAIL test/unit/community-blocks-compare.test.jsx
  BlocksCompare
    ✕ renders before and after scripts side by side (52 ms)
    ✕ shows placeholders for added and removed scripts (8 ms)

  ● BlocksCompare › renders before and after scripts side by side

    expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: 0

      25 |
      26 |         const svgs = wrapper.find('svg');
    > 27 |         expect(svgs.length).toBe(2);
         |                             ^
      28 |         expect(wrapper.text()).toContain('Before');
      29 |         expect(wrapper.text()).toContain('After');
      30 |         expect(wrapper.html()).toContain('sb-diff');

      at Object.toBe (test/unit/community-blocks-compare.test.jsx:27:29)

  ● BlocksCompare › shows placeholders for added and removed scripts

    expect(received).toHaveLength(expected)


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 27.9s)

_Thinking:_

Debugging why SVG render fails by checking parse and render errors and module-level measuring initialization.

_Thinking:_

Isolating the module load order to ensure the canvas mock initializes before the measuring reference is captured.

_Thinking:_

Evaluating lazy dynamic import for scratchblocks to defer initialization until after the canvas mock.

_Thinking:_



**Tool: write**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/components/BlocksCompare.jsx",
  "content": "import PropTypes from 'prop-types';\nimport React, {useEffect, useRef, useState} from 'react';\nimport styles from './DiffView.module.css';\n\nlet scratchblocksPromise = null;\nconst loadScratchblocks = () => {\n    if (!scratchblocksPromise) scratchblocksPromise = import('scratchblocks');\n    return scratchblocksPromise;\n};\n\nconst renderScript = (container, source, scratchblocks) => {\n    container.innerHTML = '';\n    const doc = scratchblocks.parse(source, {languages: ['en']});\n    container.appendChild(scratchblocks.render(doc, {style: 'scratch3', scale: 0.9}));\n};\n\nconst ScriptPane = ({label, source, emptyMessage}) => {\n    const ref = useRef(null);\n    const [failed, setFailed] = useState(false);\n    useEffect(() => {\n        let active = true;\n        setFailed(false);\n        if (ref.current && source) {\n            loadScratchblocks().then(module => {\n                if (!active || !ref.current) return;\n                try {\n                    renderScript(ref.current, source, module.default || module);\n                } catch (error) {\n                    if (active) setFailed(true);\n                }\n            }).catch(() => {\n                if (active) setFailed(true);\n            });\n        }\n        return () => {\n            active = false;\n        };\n    }, [source]);\n    if (!source) {\n        return (\n            <div className={styles.assetPane}>\n                <span className={styles.assetLabel}>{label}</span>\n                <p className={styles.assetState}>{emptyMessage}</p>\n            </div>\n        );\n    }\n    return (\n        <div className={styles.assetPane}>\n            <span className={styles.assetLabel}>{label}</span>\n            {failed ? (\n                <p className={styles.assetState}>Could not render blocks.</p>\n            ) : <div ref={ref} className={styles.blocksPreview} />}\n        </div>\n    );\n};\n\nScriptPane.propTypes = {\n    label: PropTypes.string.isRequired,\n    source: PropTypes.string,\n    emptyMessage: PropTypes.string.isRequired\n};\n\nScriptPane.defaultProps = {\n    source: null\n};\n\nconst BlocksCompare = ({before, after}) => (\n    <div className={styles.assetCompare}>\n        <ScriptPane label=\"Before\" source={before} emptyMessage=\"New in this commit.\" />\n        <ScriptPane label=\"After\" source={after} emptyMessage=\"Removed in this commit.\" />\n    </div>\n);\n\nBlocksCompare.propTypes = {\n    before: PropTypes.string,\n    after: PropTypes.string\n};\n\nBlocksCompare.defaultProps = {\n    before: null,\n    after: null\n};\n\nexport default BlocksCompare;\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 17.4s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | tail -10",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
      39 |
      40 |         const removed = mount(<BlocksCompare before={'when green flag clicked\n-say [hi]'} after={null} />);

      at Object.toHaveLength (test/unit/community-blocks-compare.test.jsx:37:35)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Snapshots:   0 total
Time:        2.488 s
Ran all test suites matching /test\/unit\/community-blocks-compare.test.jsx/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 11.1s)

_Thinking:_



_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "newString": "const mockCanvas = () => {\n    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({\n        measureText: text => ({width: String(text).length * 6})\n    }));\n};\n\nconst flush = async (rounds = 4) => {\n    for (let round = 0; round < rounds; round++) {\n        await new Promise(resolve => setTimeout(resolve, 0));\n    }\n};",
  "oldString": "const mockCanvas = () => {\n    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({\n        measureText: text => ({width: String(text).length * 6})\n    }));\n};"
}
```

**Output:**
```
Edit applied successfully.
```

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "newString": "    test('renders before and after scripts side by side', async () => {\n        const wrapper = mount(\n            <BlocksCompare\n                before={'when green flag clicked\\n- move (10) steps'}\n                after={'when green flag clicked\\n+ move (20) steps'}\n            />\n        );\n        await flush();\n        wrapper.update();",
  "oldString": "    test('renders before and after scripts side by side', () => {\n        const wrapper = mount(\n            <BlocksCompare\n                before={'when green flag clicked\\n- move (10) steps'}\n                after={'when green flag clicked\\n+ move (20) steps'}\n            />\n        );\n        wrapper.update();"
}
```

**Output:**
```
Edit applied successfully.
```

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "newString": "    test('shows placeholders for added and removed scripts', async () => {\n        const added = mount(<BlocksCompare before={null} after={'when green flag clicked\\n+say [hi]'} />);\n        await flush();\n        added.update();\n        expect(added.text()).toContain('New in this commit.');\n        expect(added.find('svg')).toHaveLength(1);\n        added.unmount();\n\n        const removed = mount(<BlocksCompare before={'when green flag clicked\\n-say [hi]'} after={null} />);\n        await flush();\n        removed.update();\n        expect(removed.text()).toContain('Removed in this commit.');\n        expect(removed.find('svg')).toHaveLength(1);\n        removed.unmount();\n    });",
  "oldString": "    test('shows placeholders for added and removed scripts', () => {\n        const added = mount(<BlocksCompare before={null} after={'when green flag clicked\\n+say [hi]'} />);\n        expect(added.text()).toContain('New in this commit.');\n        expect(added.find('svg')).toHaveLength(1);\n        added.unmount();\n\n        const removed = mount(<BlocksCompare before={'when green flag clicked\\n-say [hi]'} after={null} />);\n        expect(removed.text()).toContain('Removed in this commit.');\n        expect(removed.find('svg')).toHaveLength(1);\n        removed.unmount();\n    });"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.8s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | tail -12",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
         |                                   ^
      47 |         added.unmount();
      48 |
      49 |         const removed = mount(<BlocksCompare before={'when green flag clicked\n-say [hi]'} after={null} />);

      at Object.toHaveLength (test/unit/community-blocks-compare.test.jsx:46:35)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Snapshots:   0 total
Time:        1.705 s, estimated 2 s
Ran all test suites matching /test\/unit\/community-blocks-compare.test.jsx/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.9s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | grep -B8 -A20 \"●.*side by side\" | head -50",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
      at dispatchAction (node_modules/react-dom/cjs/react-dom.development.js:15656:9)
      at setFailed (src/community/components/BlocksCompare.jsx:29:33)

FAIL test/unit/community-blocks-compare.test.jsx
  BlocksCompare
    ✕ renders before and after scripts side by side (119 ms)
    ✕ shows placeholders for added and removed scripts (11 ms)

  ● BlocksCompare › renders before and after scripts side by side

    expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: 0

      32 |
      33 |         const svgs = wrapper.find('svg');
    > 34 |         expect(svgs.length).toBe(2);
         |                             ^
      35 |         expect(wrapper.text()).toContain('Before');
      36 |         expect(wrapper.text()).toContain('After');
      37 |         expect(wrapper.html()).toContain('sb-diff');

      at Object.toBe (test/unit/community-blocks-compare.test.jsx:34:29)

  ● BlocksCompare › shows placeholders for added and removed scripts

    expect(received).toHaveLength(expected)


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 24.9s)

_Thinking:_

Debugging a dynamic import failure by checking jest ESM handling, parse/render errors, language loading, and render style options.

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "cat > test/unit/zz-dbg.test.jsx <<'EOF'\nimport React from 'react';\nimport {mount} from 'enzyme';\nimport BlocksCompare from '../../src/community/components/BlocksCompare.jsx';\ndescribe('dbg', () => {\n    test('dbg', async () => {\n        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({measureText: t => ({width: 10})}));\n        try {\n            const m = await import('scratchblocks');\n            console.log('import keys:', Object.keys(m));\n            const sb = m.default || m;\n            const doc = sb.parse('when green flag clicked\\nsay [hi]', {languages: ['en']});\n            console.log('parsed scripts:', doc.scripts.length);\n            const svg = sb.render(doc, {style: 'scratch3', scale: 0.9});\n            console.log('svg tag:', svg.tagName, 'len:', svg.outerHTML.length);\n        } catch (e) {\n            console.log('ERROR:', e.message);\n        }\n    });\n});\nEOF\nnpx jest test/unit/zz-dbg.test.jsx 2>&1 | grep -A4 \"console.log\\|ERROR\" | head -30; rm test/unit/zz-dbg.test.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
  console.log
    import keys: [ 'default' ]

      at Object.log (test/unit/zz-dbg.test.jsx:9:21)

  console.log
    ERROR: sb.parse is not a function

      at Object.log (test/unit/zz-dbg.test.jsx:16:21)

PASS test/unit/zz-dbg.test.jsx

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 17.4s)

_Thinking:_

Analyzing module interop to resolve missing parse function due to default export handling.

**Tool: bash**

**Input:**
```json
{
  "command": "cat > test/unit/zz-dbg.test.jsx <<'EOF'\ndescribe('dbg', () => {\n    test('dbg', async () => {\n        const m = await import('scratchblocks');\n        console.log('typeof default:', typeof m.default);\n        console.log('default keys:', m.default && Object.keys(m.default).slice(0, 20));\n        console.log('resolve path:', require.resolve('scratchblocks'));\n    });\n});\nEOF\nnpx jest test/unit/zz-dbg.test.jsx 2>&1 | grep -A6 \"console.log\" | head -30; rm test/unit/zz-dbg.test.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
      4 |         console.log('typeof default:', typeof m.default);
      5 |         console.log('default keys:', m.default && Object.keys(m.default).slice(0, 20));
      6 |         console.log('resolve path:', require.resolve('scratchblocks'));

      at VirtualConsole.<anonymous> (node_modules/jest-environment-jsdom/build/index.js:63:23)
      at module.exports (node_modules/jsdom/lib/jsdom/browser/not-implemented.js:12:26)
      at HTMLCanvasElementImpl.getContext (node_modules/jsdom/lib/jsdom/living/nodes/HTMLCanvasElement-impl.js:42:5)
      at HTMLCanvasElement.getContext (node_modules/jsdom/lib/jsdom/living/generated/HTMLCanvasElement.js:131:58)
      at getContext (node_modules/scratchblocks/scratch2/index.js:8:42)
--
      4 |         console.log('typeof default:', typeof m.default);
      5 |         console.log('default keys:', m.default && Object.keys(m.default).slice(0, 20));
      6 |         console.log('resolve path:', require.resolve('scratchblocks'));

      at VirtualConsole.<anonymous> (node_modules/jest-environment-jsdom/build/index.js:63:23)
      at module.exports (node_modules/jsdom/lib/jsdom/browser/not-implemented.js:12:26)
      at HTMLCanvasElementImpl.getContext (node_modules/jsdom/lib/jsdom/living/nodes/HTMLCanvasElement-impl.js:42:5)
      at HTMLCanvasElement.getContext (node_modules/jsdom/lib/jsdom/living/generated/HTMLCanvasElement.js:131:58)
      at getContext (node_modules/scratchblocks/scratch3/index.js:8:42)
--
  console.log
    typeof default: object

      at Object.log (test/unit/zz-dbg.test.jsx:4:17)

  console.log
    default keys: []

      at Object.log (test/unit/zz-dbg.test.jsx:5:17)


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.9s)

_Thinking:_

Analyzing jest module resolution and UMD export behavior causing an empty default export.

**Tool: bash**

**Input:**
```json
{
  "command": "head -c 600 node_modules/scratchblocks/build/scratchblocks.min.js; echo; ls node_modules/scratchblocks/; grep -n \"main\\|exports\" node_modules/scratchblocks/package.json | head",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 30000
}
```

**Output:**
```
/**
 * scratchblocks v3.7.1
 * https://scratchblocks.github.io/
 * Make pictures of Scratch blocks from text.
 *
 * Copyright 2013–2026, Tim Radvan
 * @license MIT
 */

var scratchblocks=function(){"use strict";function e(e,t){(null==t||t>e.length)&&(t=e.length);for(var s=0,i=Array(t);s<t;s++)i[s]=e[s];return i}function t(e,t){for(var s=0;s<t.length;s++){var i=t[s];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,c(i.key),i)}}function s(e,s,i){return s&&t(e.prototype,s),i&&t(e,i),Object.defineProperty(e,"prototype",{writable:!1}),e}function
LICENSE
README.md
browser.es.js
browser.js
build
index.js
locales
package.json
scratch2
scratch3
syntax
16:  "main": "build/scratchblocks.min.js",

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.9s)

_Thinking:_



_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/package.json",
  "newString": "      \"^scratch-audio$\": \"<rootDir>/node_modules/scratch-audio/src/index.js\",\n      \"^scratchblocks$\": \"<rootDir>/node_modules/scratchblocks/build/scratchblocks.min.es.js\",",
  "oldString": "      \"^scratch-audio$\": \"<rootDir>/node_modules/scratch-audio/src/index.js\","
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.1s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | tail -10",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
      48 |
      49 |         const removed = mount(<BlocksCompare before={'when green flag clicked\n-say [hi]'} after={null} />);

      at Object.toHaveLength (test/unit/community-blocks-compare.test.jsx:46:35)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Snapshots:   0 total
Time:        1.913 s
Ran all test suites matching /test\/unit\/community-blocks-compare.test.jsx/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 9.8s)

**Tool: bash**

**Input:**
```json
{
  "command": "cat > test/unit/zz-dbg.test.jsx <<'EOF'\ndescribe('dbg', () => {\n    test('dbg', async () => {\n        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({measureText: t => ({width: 10})}));\n        const m = await import('scratchblocks');\n        const sb = m.default || m;\n        console.log('parse fn:', typeof sb.parse, 'render fn:', typeof sb.render);\n        try {\n            const doc = sb.parse('when green flag clicked\\nsay [hi]', {languages: ['en']});\n            console.log('parsed scripts:', doc.scripts.length);\n            const svg = sb.render(doc, {style: 'scratch3', scale: 0.9});\n            console.log('svg:', svg.tagName, svg.outerHTML.length);\n        } catch (e) {\n            console.log('ERROR:', e.message);\n        }\n    });\n});\nEOF\nnpx jest test/unit/zz-dbg.test.jsx 2>&1 | grep -A3 \"console.log\" | head -25; rm test/unit/zz-dbg.test.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
  console.log
    parse fn: function render fn: function

      at Object.log (test/unit/zz-dbg.test.jsx:6:17)
--
  console.log
    parsed scripts: 1

      at Object.log (test/unit/zz-dbg.test.jsx:9:21)
--
  console.log
    svg: svg 25447

      at Object.log (test/unit/zz-dbg.test.jsx:11:21)

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 17.1s)

_Thinking:_

Analyzing dynamic import resolution and Jest module mapping behavior for a CJS-transformed component test failure.

_Thinking:_

Diagnosing pnpm path mismatch in the Jest transform allowlist causing dynamic import rejection.

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "cat > test/unit/zz-dbg.test.jsx <<'EOF'\nimport React from 'react';\nimport {mount} from 'enzyme';\nimport BlocksCompare from '../../src/community/components/BlocksCompare.jsx';\ndescribe('dbg', () => {\n    test('dbg', async () => {\n        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({measureText: t => ({width: 10})}));\n        const wrapper = mount(<BlocksCompare before={'when green flag clicked\\nsay [hi]'} after={null} />);\n        for (let i = 0; i < 6; i++) await new Promise(r => setTimeout(r, 0));\n        wrapper.update();\n        console.log('HTML:', wrapper.html().slice(0, 300));\n    });\n});\nEOF\nnpx jest test/unit/zz-dbg.test.jsx 2>&1 | grep -A6 \"console.log\\|Error\" | head -30; rm test/unit/zz-dbg.test.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
  console.log
    HTML: <div><div><span>Before</span><div><svg version="1.1" width="93.60000000000001" height="109.8" viewBox="0 0 93.60000000000001 109.8" class="scratchblocks-style-scratch3"><defs><g id="sb3-greenFlag"><path d="M20.8 3.7c-.4-.2-.9-.1-1.2.2-2 1.6-4.8 1.6-6.8 0-2.3-1.9-5.6-2.3-8.3-1v-.4c0-.6-.5-1-1-1s-1 .4

      at Object.log (test/unit/zz-dbg.test.jsx:10:17)

PASS test/unit/zz-dbg.test.jsx
  dbg

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 9.0s)

_Thinking:_



_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "newString": "const flush = async (rounds = 8) => {",
  "oldString": "const flush = async (rounds = 4) => {"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.2s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | tail -10",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
      48 |
      49 |         const removed = mount(<BlocksCompare before={'when green flag clicked\n-say [hi]'} after={null} />);

      at Object.toHaveLength (test/unit/community-blocks-compare.test.jsx:46:35)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Snapshots:   0 total
Time:        2.295 s
Ran all test suites matching /test\/unit\/community-blocks-compare.test.jsx/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 11.2s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | grep -B10 -A18 \"●.*side by side\" | head -50",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
MustScanSubDirs UserDroppedTo resolve, please review the information on
https://facebook.github.io/watchman/docs/troubleshooting.html#recrawl
To clear this warning, run:
`watchman watch-del '/Users/sophie/mistwarp/scratch-gui' ; watchman watch-project '/Users/sophie/mistwarp/scratch-gui'`

FAIL test/unit/community-blocks-compare.test.jsx
  BlocksCompare
    ✕ renders before and after scripts side by side (108 ms)
    ✕ shows placeholders for added and removed scripts (21 ms)

  ● BlocksCompare › renders before and after scripts side by side

    expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: 0

      32 |
      33 |         const svgs = wrapper.find('svg');
    > 34 |         expect(svgs.length).toBe(2);
         |                             ^
      35 |         expect(wrapper.text()).toContain('Before');
      36 |         expect(wrapper.text()).toContain('After');
      37 |         expect(wrapper.html()).toContain('sb-diff');

      at Object.toBe (test/unit/community-blocks-compare.test.jsx:34:29)

  ● BlocksCompare › shows placeholders for added and removed scripts


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 19.5s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "cat > test/unit/zz-dbg.test.jsx <<'EOF'\nimport React from 'react';\nimport {mount} from 'enzyme';\nimport BlocksCompare from '../../src/community/components/BlocksCompare.jsx';\ndescribe('dbg', () => {\n    beforeEach(() => {\n        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({measureText: text => ({width: String(text).length * 6})}));\n    });\n    test('dbg', async () => {\n        const wrapper = mount(\n            <BlocksCompare\n                before={'when green flag clicked\\n- move (10) steps'}\n                after={'when green flag clicked\\n+ move (20) steps'}\n            />\n        );\n        for (let i = 0; i < 8; i++) await new Promise(r => setTimeout(r, 0));\n        wrapper.update();\n        console.log('svgs:', wrapper.find('svg').length, 'text:', wrapper.text().slice(0, 120));\n    });\n});\nEOF\nnpx jest test/unit/zz-dbg.test.jsx 2>&1 | grep -A3 \"console.log\" | head -10; rm test/unit/zz-dbg.test.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
  console.log
    svgs: 0 text: Beforewhenclickedmove10stepsAfterwhenclickedmove20steps

      at Object.log (test/unit/zz-dbg.test.jsx:17:17)

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 15.0s)

_Thinking:_

Debugging Enzyme SVG selector mismatch by checking DOM tag casing and namespace handling.

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "cat > test/unit/zz-dbg.test.jsx <<'EOF'\nimport React from 'react';\nimport {mount} from 'enzyme';\nimport BlocksCompare from '../../src/community/components/BlocksCompare.jsx';\ndescribe('dbg', () => {\n    test('dbg', async () => {\n        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({measureText: t => ({width: 10})}));\n        const wrapper = mount(<BlocksCompare before={'when green flag clicked\\nsay [hi]'} after={null} />);\n        for (let i = 0; i < 8; i++) await new Promise(r => setTimeout(r, 0));\n        wrapper.update();\n        console.log('svg:', wrapper.find('svg').length, 'Svg:', wrapper.find('Svg').length);\n        console.log('byTag:', wrapper.findWhere(n => n.type() === 'svg').length);\n        console.log('html has svg:', wrapper.html().includes('<svg'));\n    });\n});\nEOF\nnpx jest test/unit/zz-dbg.test.jsx 2>&1 | grep -A8 \"console.log\" | head -30; rm test/unit/zz-dbg.test.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
  console.log
    svg: 0 Svg: 0

      at Object.log (test/unit/zz-dbg.test.jsx:10:17)

  console.log
    byTag: 0

      at Object.log (test/unit/zz-dbg.test.jsx:11:17)

  console.log
    html has svg: true

      at Object.log (test/unit/zz-dbg.test.jsx:12:17)

PASS test/unit/zz-dbg.test.jsx
  dbg
    ✓ dbg (117 ms)


```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 9.8s)

_Thinking:_



_Thinking:_



**Tool: write**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "content": "import React from 'react';\nimport {mount} from 'enzyme';\n\nimport BlocksCompare from '../../src/community/components/BlocksCompare.jsx';\n\nconst mockCanvas = () => {\n    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({\n        measureText: text => ({width: String(text).length * 6})\n    }));\n};\n\nconst flush = async (rounds = 8) => {\n    for (let round = 0; round < rounds; round++) {\n        await new Promise(resolve => setTimeout(resolve, 0));\n    }\n};\n\nconst svgCount = wrapper => (wrapper.html().match(/<svg/g) || []).length;\n\ndescribe('BlocksCompare', () => {\n    beforeEach(() => {\n        mockCanvas();\n    });\n\n    test('renders before and after scripts side by side', async () => {\n        const wrapper = mount(\n            <BlocksCompare\n                before={'when green flag clicked\\n- move (10) steps'}\n                after={'when green flag clicked\\n+ move (20) steps'}\n            />\n        );\n        await flush();\n        wrapper.update();\n\n        expect(svgCount(wrapper)).toBe(2);\n        expect(wrapper.text()).toContain('Before');\n        expect(wrapper.text()).toContain('After');\n        expect(wrapper.html()).toContain('sb-diff');\n        wrapper.unmount();\n    });\n\n    test('shows placeholders for added and removed scripts', async () => {\n        const added = mount(<BlocksCompare before={null} after={'when green flag clicked\\n+say [hi]'} />);\n        await flush();\n        added.update();\n        expect(added.text()).toContain('New in this commit.');\n        expect(svgCount(added)).toBe(1);\n        added.unmount();\n\n        const removed = mount(<BlocksCompare before={'when green flag clicked\\n-say [hi]'} after={null} />);\n        await flush();\n        removed.update();\n        expect(removed.text()).toContain('Removed in this commit.');\n        expect(svgCount(removed)).toBe(1);\n        removed.unmount();\n    });\n});\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 9.7s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | tail -10",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
      40 |     });
      41 |

      at Object.toContain (test/unit/community-blocks-compare.test.jsx:38:32)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
Snapshots:   0 total
Time:        2.167 s
Ran all test suites matching /test\/unit\/community-blocks-compare.test.jsx/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 13.2s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | grep -B4 -A12 \"●.*placeholders\" | head -30",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
(no output)
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 9.1s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | grep -A16 \"● Blocks\" | head -40",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
...output truncated...

Full output saved to: /Users/sophie/.local/share/opencode/tool-output/tool_06bfea7950015WJdWouMOUcJjv

          A 4 4 0 0 1 4 0
          H 12 c 2 0 3 1 4 2
          l 4 4
          c 1 1 2 2 4 2
          h 12
          c 2 0 3 -1 4 -2
          l 4 -4
          c 1 -1 2 -2 4 -2
          L 130 0
          a 4 4 0 0 1 4 4 L 134 44 a 4 4 0 0 1 -4 4 L 48 48 c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L 4 48 a 4 4 0 0 1 -4 -4 Z\"></path><text class=\"sb3-label sb3-\" x=\"0\" y=\"13.1\" transform=\"translate(8 17)\">move</text><g transform=\"translate(48 8)\"><rect rx=\"16\" ry=\"16\" x=\"0\" y=\"0\" width=\"40\" height=\"32\" class=\"sb3-motion sb3-input sb3-input-number\"></rect><text class=\"sb3-label sb3-literal-number\" x=\"0\" y=\"13.1\" transform=\"translate(14 9)\">10</text></g><text class=\"sb3-label sb3-\" x=\"0\" y=\"13.1\" transform=\"translate(96 17)\">steps</text></g><path class=\"sb3-diff sb3-diff-del\" d=\"M 0 0 L 134 0\" transform=\"translate(2 90)\"></path></g></g></svg></div></div><div><span>After</span><div><svg version=\"1.1\" width=\"124.2\" height=\"110.7\" viewBox=\"0 0 124.2 110.7\" class=\"scratchblocks-style-scratch3\"><defs><g id=\"sb3-greenFlag\"><path d=\"M20.8 3.7c-.4-.2-.9-.1-1.2.2-2 1.6-4.8 1.6-6.8 0-2.3-1.9-5.6-2.3-8.3-1v-.4c0-.6-.5-1-1-1s-1 .4-1 1v18.8c0 .5.5 1 1 1h.1c.5 0 1-.5 1-1v-6.4c1-.7 2.1-1.2 3.4-1.3 1.2 0 2.4.4 3.4 1.2 2.9 2.3 7 2.3 9.8 0 .3-.2.4-.5.4-.9V4.7c0-.5-.3-.9-.8-1zm-.3 10.2C18 16 14.4 16 11.9 14c-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2l.1.1-.1 9.2z\" fill=\"#45993d\"></path><path d=\"M20.6 4.8l-.1 9.1v.1c-2.5 2-6.1 2-8.6 0-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2c0 .1.1.1.1.2z\" fill=\"#4cbf56\"></path></g><polygon points=\"6.6,0.5 13.12,0.5 19.5,6.6 19.5,13.12 13.12,19.5 6.6,19.5 0.5,13.12 0.5,6.6 \" fill=\"#ec5959\" stroke=\"#b84848\" stroke-linejoin=\"round\" stroke-linecap=\"round\" id=\"sb3-stopSign\"></polygon><path d=\"M0 0L4 4L0 8Z\" fill=\"#111\" id=\"sb3-addInput\"></path><path d=\"M4 0L4 8L0 4Z\" fill=\"#111\" id=\"sb3-delInput\"></path><g id=\"sb3-list\"><rect x=\"0\" y=\"0\" width=\"15\" height=\"18\" fill=\"#fff\"></rect><rect x=\"1\" y=\"1\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect><rect x=\"1\" y=\"7\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect><rect x=\"1\" y=\"13\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect></g><image id=\"sb3-microbitBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACmlBMVEUAAAArKysrIB8lJCNBRlY2O0U9X48sKCvOoBQzKzMnJyfrswi/xdDRoxN2dnbToxPosgnmsAq/lxo6MSq0kCLOoRXKnhbEmhc7LRooJCTcqQ7OoBXstAjpsgi9lhuvjCCPdSd4Zyg2NjZMi+Slhyq8lR5CR1fZqBG+lh3ttQjFnBnLnhbDmhqZore3kh5ARlW2kR6qiCGcfyU6QEtyYyd4ZSDSoxOGdDedgizLnhfgrA25kx9YXWqbgCxMUWDfqwzcqg/VphBBR1ecpLmcgSzHmxijq77BmRprYkOOlKZARlVGdbabo7m3kRxGcrKwjB9ARVSIjaCZobuVeyahgh+VdyE8XIOLayBIOydBR1f/vwBMl//m5+g+Q1JlanY6P0uCiJjj5OU9QVBARVQ/RFP9vgBFZpjk5ebwtgbzuAR0eotARlZITl3d3+KNlKRQVmRNUmGxs7mRlJtUW2nLnhfInRfpsQn1uQS/wsa0t7qlp62doKeKjpeBg41YXmxCSlvGyMtHb6xCUGlCTGBJgdJDSFVobXlMlPhLhtq/wchIesFGbqpDVXRXXGxCTGNiXEe+lh1LjuzP0dRJg9RIfslJfMW9v8RGbKRFY5Jzd4NdYm88QE1+bjrQpCHQohTxtwVLkPDa3OHd3t9If826vMCusLZHcrGIj6F6gpaDho9ESlpITFOQeTLcqhnEmhnqsw34uwVKkfNNhdi6vMRLUWBPUFC7lzDWpx31uQjutQj6vAP5+frZ29zZ2dvW2NtHc7JGbKVFaJx/hpl/hpdxd4hzd4JDWHpDUm5UWWiZhEh3aT6WfC/EnSqtiyW/lxzBmRpKi+VQgMhRermqq7BSdrCLjpVEXYVEW4A/SFtOT1BaV0pxZUCpjT2xkTcYNOUYAAAAWXRSTlMADBgV5DRLEdcIE+3Z2QLt6unOI/zp1dEcDf7z7eu9qVtFBPv7+/fx7u3p3NnOzcq0lXZENzD6+fj39vTm5uXk4t3c2tbS0c/NvrCopKKcm4yLbGpiTUA3JzDAPbYAAAQqSURBVFjD7dX1fxJhHMDxE+MIRRFrdnd3d3fr9ziwhsVsmC2K6HRTtzlb0ens2uzu7m79X3z4HufdwTNvj/qbfPYaPDe+vMf23AEXL168/6bBTfoWx5r0GskxVMhsoDfg3Lb12LlzIwz0zKZYzzy0lkPVKtXdutXw++o2a5UQ7SUMcqibGpA8kD09slX0azRkazwISB5Inn4D+ShwrNYjIHpQQA96mqPAYlqPgOhBAT0oUpgGyh6C6EHYWz11e7jbO9hAxUMQPezR6+wtW0nBlJzV7CB62nIyN/mB5H/ouM0G0j3ITIXsAMDUVMjcygbSPQgqrzCNDaR7sCEzO2cLKSvlLNP/ED1qgbRbh0m37viBAUSPvU/BYFZWcAMFRI+9HW/fOFLSgAaixw6erZWS5qeBVG+XKwlghWsuwALXHIA5rgUAc10r1KADvViwKNDaLO4EWCQuA5gnLgVYKs4DWCYuUoPoFRhcKa4FWCwuB1gizgeYLy4BWC4uBqWPq9Cjg55EJ5bogUi7J0wBmDwhMXzjBHBOmAyQSG4wnPd4cJ4Kejbem4gdTQL9NPN00Hlk0jRs//0p+puinaeDs0XxwMFtk8RZM6fob4pmPl/wxtqkOcemIai7Kco8HTx/88Ns8dBxgMcrEdTfFKcyP/9m1xhwwbV30sBGCdTPqczPu9Y5BoTzZODAg6S5kT9Zf1PU8+fz25TrTJuizOd32kjtL9CmaOfpJ/Zd5UTV3RTtfP6X3mfl0tNNuVSpILYp5xHL25ccFUQv9cwGhrcvPZB4jgiovyn6IHrrZFB/U/RBf6rD8f4sgqzRwTtZQfKZGPiXm4Kxb8rff6awgf9sU5jTB9O79G63BqTW1C5baQ9geNSwvnIEJ8s2PCkPXqhTtlM6HUxvWpiv3h6kyozmDY2egnzUkjc3/3X0bAjPt3gW+VWVxvFtSn6hgi9acxzfeI001yiBs46pI7/AkjzHVSgjg5XIkwvXB+xbcxNnGraHCmZUr8nxJS/g3AlC1KzujQgnOpo5axufDFasYLUa2gK2p2ohzlTtJB2sV6NCNSECCtUq1Kj3CxSq2luXlY8gufF4e9PkCLiwpWFULg38+qKiILgFYe9Lr++07zSur4SXr7zeV5Gj0z5vxt69GVcFt1vI874kS6/0pDIZsWB6crLgzhNI+wRhOrm7Sr5n4HIhWeW5yRJ/EBYuS4+5yUN5Vy9fuewT6GDouQq8qAFDITX4/XmuDF788eTJRQpoD4PTT6nAXA14KVcNhshgBDx16VTokk9oZo4Czf0JiEkgpoCYApJkEPMJwxOiQFONDn8DlrRbuWjRXrWEzWKzlOhnLNfHWN5S2Va5cndjufLG8uWMpRs0sFmqdMNliRKlS1nIlw2Xxh5kWaVKC0NNLiarqdAfZ+LixYsX77f9BFJt17cXqnnkAAAAAElFTkSuQmCC\"></image><g id=\"sb3-wedoBlock\" fill=\"none\"><path d=\"M23.513 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M24.91 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M9.54 11.17h-.728c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479\" fill=\"#7C87A5\"></path><path d=\"M10.938 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479z\"></path><path d=\"M26.305 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M27.702 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M29.101 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M30.498 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M17.925 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M19.322 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M20.717 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M22.114 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M15.129 11.17H14.4c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M16.526 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M12.335 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.882v-1.08c0-.265-.26-.479-.577-.479\" fill=\"#7C87A5\"></path><path d=\"M13.732 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M31.893 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M33.29 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992\" fill=\"#FFF\"></path><path d=\"M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" fill=\"#FFF\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z\" fill=\"#4C97FF\"></path><path d=\"M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z\" stroke=\"#3D79CC\" stroke-width=\".893\"></path><path stroke=\"#7C87A5\" stroke-width=\".893\" d=\"M4.47 20.474h27.961l2.157 2.974\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479z\"></path><path d=\"M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993\" fill=\"#E6E7E8\"></path><path d=\"M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z\" fill=\"#E6E7E8\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path fill=\"#E6E7E8\" d=\"M19.53 24.438h11.294V20.47H19.529z\"></path><path stroke=\"#7C87A5\" stroke-width=\".893\" d=\"M19.53 24.438h11.294V20.47H19.529zm12.902-3.964l2.157-2.794\"></path></g><g transform=\"translate(5.5 3.5)\" id=\"sb3-ev3Block\"><rect stroke=\"#7C87A5\" fill=\"#FFF\" x=\".5\" y=\"3.59\" width=\"28\" height=\"25.81\" rx=\"1\"></rect><rect stroke=\"#7C87A5\" fill=\"#E6E7E8\" x=\"2.5\" y=\".5\" width=\"24\" height=\"32\" rx=\"1\"></rect><path stroke=\"#7C87A5\" fill=\"#FFF\" d=\"M2.5 14.5h24v13h-24z\"></path><path d=\"M14.5 10.5v4\" stroke=\"#7C87A5\" fill=\"#E6E7E8\"></path><rect fill=\"#414757\" x=\"4.5\" y=\"2.5\" width=\"20\" height=\"10\" rx=\"1\"></rect><rect fill=\"#7C87A5\" opacity=\".5\" x=\"13.5\" y=\"20.13\" width=\"2\" height=\"2\" rx=\".5\"></rect><path d=\"M9.06 20.13h1.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1.5a1 1 0 0 1 0-2zM19.93 22.13h-1.51a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1.5a1 1 0 0 1 .01 2zM8.23 17.5H5a.5.5 0 0 1-.5-.5v-2.5h6l-1.85 2.78a.51.51 0 0 1-.42.22zM18.15 18.85l-.5.5a.49.49 0 0 0-.15.36V20a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-.29a.49.49 0 0 0-.15-.36l-.5-.5a.51.51 0 0 1 0-.71l1.51-1.49a.47.47 0 0 1 .35-.15h3.58a.47.47 0 0 1 .35.15l1.51 1.49a.51.51 0 0 1 0 .71zM10.85 23.45l.5-.5a.49.49 0 0 0 .15-.36v-.29a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.29a.49.49 0 0 0 .15.36l.5.5a.5.5 0 0 1 0 .7l-1.51 1.5a.47.47 0 0 1-.35.15h-3.58a.47.47 0 0 1-.35-.15l-1.51-1.5a.5.5 0 0 1 0-.7z\" fill=\"#7C87A5\" opacity=\".5\"></path><path d=\"M21.5 27.5h5v4a1 1 0 0 1-1 1h-4v-5z\" stroke=\"#CC4C23\" fill=\"#F15A29\"></path></g><g id=\"sb3-makeymakeyBlock\" fill=\"none\"><path d=\"M35 28H5a1 1 0 0 1-1-1V12c0-.6.4-1 1-1h30c.5 0 1 .4 1 1v15c0 .5-.5 1-1 1z\" fill=\"#fff\"></path><path fill=\"red\" d=\"M4 25h32v2.7H4zm9-1h-2.2a1 1 0 0 1-1-1v-9.7c0-.6.4-1 1-1H13c.6 0 1 .4 1 1V23c0 .6-.5 1-1 1z\"></path><path fill=\"red\" d=\"M6.1 19.3v-2.2c0-.5.4-1 1-1h9.7c.5 0 1 .5 1 1v2.2c0 .5-.5 1-1 1H7.1a1 1 0 0 1-1-1z\"></path><circle fill=\"red\" cx=\"22.8\" cy=\"18.2\" r=\"3.4\"></circle><circle fill=\"red\" cx=\"30.6\" cy=\"18.2\" r=\"3.4\"></circle><path fill=\"red\" d=\"M4.2 27h31.9v.7H4.2z\"></path><circle fill=\"#e0e0e0\" cx=\"22.8\" cy=\"18.2\" r=\"2.3\"></circle><circle fill=\"#e0e0e0\" cx=\"30.6\" cy=\"18.2\" r=\"2.3\"></circle><path fill=\"#e0e0e0\" d=\"M12.5 22.9h-1.2c-.3 0-.5-.2-.5-.5V14c0-.3.2-.5.5-.5h1.2c.3 0 .5.2.5.5v8.4c0 .3-.2.5-.5.5z\"></path><path fill=\"#e0e0e0\" d=\"M7.2 18.7v-1.2c0-.3.2-.5.5-.5h8.4c.3 0 .5.2.5.5v1.2c0 .3-.2.5-.5.5H7.7c-.3 0-.5-.2-.5-.5zM4 26h32v2H4z\"></path><path stroke=\"#666\" stroke-width=\".5\" d=\"M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z\"></path><path stroke=\"#666\" stroke-width=\".5\" d=\"M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z\"></path></g><image id=\"sb3-gdxforBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAABAlBMVEUAAAABAQEAAAB9h6YAAAAAAAAAAAB8iKZ7iKaAjKvm5+h+iqhcXFxGR0d8iKbj5OV9iKZ8h6be3+Db3d19h6acnJ0AAAB7nrDh4uPh4uN9iabZ2tt9iKbX19nJycnExsZ8iKe+wMC7vL2Eka/g4ePU1dV8iKZ9iKZ9iKd+iKitra2RkZGLjo5wcHCLi7l0oqJV//9csdZ8h6WFkq//vwDm5+iEka79vgJ6iql9iaaHk6tgq9Btm71+iadmo8dzk7OCj6yAjKp/iqhiqc1qnsB4jKtgrNFwl7d1tLTgtCxpocN0krJ2j65ossWNtZSbt4LAulHWsDnasTTuvhXzvg9zk7TzqAfaAAAAMXRSTlMAJiLoFBwI8q4a+0c4M/nr3tnQwKxYDAnk2726tbGMh4J9dinXq56ddG9nT01ACwsDk/+seAAAAidJREFUWMPt2Olu2kAUhuE5NvuaBAhZm7TpvufgMXaBbmAghOzp/d9KD7RW6yaqPeL7YVV9/471aBgfCXnUH7ULNhtkF96qv1dgwwoxoM08cDsJcwfMdgwonoiJPRFjQXkscQM3Adhxk4NuJwkoDx0nSp5NDTiae958NEaBwzkvC4YYcOxx7fCoeJhnrwcBv7H9TklFm08R4JD5SEkiMg8B4IjXwsV1HgHAPu+EizsQcMbr2B0OufZz7X0NcIZSwC9+rD3nADI2/fCtrHEfAvZ8Liqp6PuIwZZO+ZmSnspcY8AZ55WU5xkElDwuK1Vm7xgFTjhfLud5AgPHAUvBGARKvYnnTXpp/gvAg9PLyykSPLt1nNszIHjuSOdAcNp1nO4UeYYXNzcX0UH62P+0AnjH8lgCgL8s/+uXzwZgrOV2JAMwxpIMwRjLHIyxzMEYyxyMWgAwYiHAzm99iLQ6eOJEul4d7Ea6WhG8W7rAE+fertHgVXp+clpB9Oet64M/wH2TKwI/FrRFTH6JIZ6NvmZpxoDtptlFULOtzGPWy+4/r//gvwKGgcC90NtTqIg2dIuyClaWDvTjKlDMLba4UaUMcIuVbd0gyiGwjGVlFuKWfkQZhEfSQnypd8mCvOHGvkA5quo6EQSs6yrlNumN3obs0KKGHJ70QD+hLOQMW7r0sFI5KJVeY+bGkr1JopKlEG0StXbrW/uvQGMookXLLPFAZYTMJju/7z6rRW1MZcnIAAAAAElFTkSuQmCC\"></image><image id=\"sb3-boostBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQBAMAAAB8P++eAAAAKlBMVEUAAAD///98h6Xm5+iVnrb/Zhq+w9L5hk73+Pnf4eSQmbLr7Ozo39vp184hSCf6AAAAAXRSTlMAQObYZgAAAOFJREFUSMftlDEOgjAUhonhAi1sLvIk7NDJDTYu0LhzBzcXruHoDTyFB/BCNi30KU3InzioSb++hAS+vPfKa5pEIpHvk7a8gpf8ISWINtlg4i7ZFOKVTBlqsUR+ItYZJG7VzQQgMqGYd7zWRArpULEAe5Q/J9JMj4rluC7uleNw7TFRXcoREDnlinjX57eUsvRTn8+AE0/6OKV0g5buYTTyWFFr/XAp3aDzed4yFJWnKbhPbtaXXohDNYlDJWz4zSxEokkkEjb496AiVtqAbIYgYNGWBmhgES+NX6SRSORfeAJMWajr95DdqQAAAABJRU5ErkJggg==\"></image><g id=\"sb3-dropdownArrow\" transform=\"scale(0.94413847364)\"><path d=\"M12.71 2.44A2.41 2.41 0 0 1 12 4.16L8.08 8.08a2.45 2.45 0 0 1-3.45 0L.72 4.16A2.42 2.42 0 0 1 0 2.44 2.48 2.48 0 0 1 .71.71C1 .47 1.43 0 6.36 0s5.39.46 5.64.71a2.44 2.44 0 0 1 .71 1.73z\" fill=\"#231f20\" opacity=\".1\"></path><path d=\"M6.36 7.79a1.43 1.43 0 0 1-1-.42L1.42 3.45a1.44 1.44 0 0 1 0-2c.56-.56 9.31-.56 9.87 0a1.44 1.44 0 0 1 0 2L7.37 7.37a1.43 1.43 0 0 1-1.01.42z\" fill=\"#fff\"></path></g><g id=\"sb3-turnRight\"><path d=\"M22.68 12.2a1.6 1.6 0 0 1-1.27.63h-7.69a1.59 1.59 0 0 1-1.16-2.58l1.12-1.41a4.82 4.82 0 0 0-3.14-.77 4.31 4.31 0 0 0-2 .8A4.25 4.25 0 0 0 7.2 10.6a5.06 5.06 0 0 0 .54 4.62A5.58 5.58 0 0 0 12 17.74a2.26 2.26 0 0 1-.16 4.52A10.25 10.25 0 0 1 3.74 18a10.14 10.14 0 0 1-1.49-9.22 9.7 9.7 0 0 1 2.83-4.14A9.92 9.92 0 0 1 9.66 2.5a10.66 10.66 0 0 1 7.72 1.68l1.08-1.35a1.57 1.57 0 0 1 1.24-.6 1.6 1.6 0 0 1 1.54 1.21l1.7 7.37a1.57 1.57 0 0 1-.26 1.39z\" fill=\"#3d79cc\"></path><path d=\"M21.38 11.83h-7.61a.59.59 0 0 1-.43-1l1.75-2.19a5.9 5.9 0 0 0-4.7-1.58 5.07 5.07 0 0 0-4.11 3.17A6 6 0 0 0 7 15.77a6.51 6.51 0 0 0 5 2.92 1.31 1.31 0 0 1-.08 2.62 9.3 9.3 0 0 1-7.35-3.82 9.16 9.16 0 0 1-1.4-8.37A8.51 8.51 0 0 1 5.71 5.4a8.76 8.76 0 0 1 4.11-1.92 9.71 9.71 0 0 1 7.75 2.07l1.67-2.1a.59.59 0 0 1 1 .21L22 11.08a.59.59 0 0 1-.62.75z\" fill=\"#fff\"></path></g><g id=\"sb3-turnLeft\"><path d=\"M20.34 18.21a10.24 10.24 0 0 1-8.1 4.22 2.26 2.26 0 0 1-.16-4.52 5.58 5.58 0 0 0 4.25-2.53 5.06 5.06 0 0 0 .54-4.62A4.25 4.25 0 0 0 15.55 9a4.31 4.31 0 0 0-2-.8 4.82 4.82 0 0 0-3.15.8l1.12 1.41A1.59 1.59 0 0 1 10.36 13H2.67a1.56 1.56 0 0 1-1.26-.63A1.54 1.54 0 0 1 1.13 11l1.72-7.43A1.59 1.59 0 0 1 4.38 2.4a1.57 1.57 0 0 1 1.24.6L6.7 4.35a10.66 10.66 0 0 1 7.72-1.68A9.88 9.88 0 0 1 19 4.81 9.61 9.61 0 0 1 21.83 9a10.08 10.08 0 0 1-1.49 9.21z\" fill=\"#3d79cc\"></path><path d=\"M19.56 17.65a9.29 9.29 0 0 1-7.35 3.83 1.31 1.31 0 0 1-.08-2.62 6.53 6.53 0 0 0 5-2.92 6.05 6.05 0 0 0 .67-5.51 5.32 5.32 0 0 0-1.64-2.16 5.21 5.21 0 0 0-2.48-1A5.86 5.86 0 0 0 9 8.84L10.74 11a.59.59 0 0 1-.43 1H2.7a.6.6 0 0 1-.6-.75l1.71-7.42a.59.59 0 0 1 1-.21l1.67 2.1a9.71 9.71 0 0 1 7.75-2.07 8.84 8.84 0 0 1 4.12 1.92 8.68 8.68 0 0 1 2.54 3.72 9.14 9.14 0 0 1-1.33 8.36z\" fill=\"#fff\"></path></g><g id=\"sb3-loopArrow\"><path d=\"M23.3 11c-.3.6-.9 1-1.5 1h-1.6c-.1 1.3-.5 2.5-1.1 3.6-.9 1.7-2.3 3.2-4.1 4.1-1.7.9-3.6 1.2-5.5.9-1.8-.3-3.5-1.1-4.9-2.3-.7-.7-.7-1.9 0-2.6.6-.6 1.6-.7 2.3-.2H7c.9.6 1.9.9 2.9.9s1.9-.3 2.7-.9c1.1-.8 1.8-2.1 1.8-3.5h-1.5c-.9 0-1.7-.7-1.7-1.7 0-.4.2-.9.5-1.2l4.4-4.4c.7-.6 1.7-.6 2.4 0L23 9.2c.5.5.6 1.2.3 1.8z\" fill=\"#cf8b17\"></path><path d=\"M21.8 11h-2.6c0 1.5-.3 2.9-1 4.2-.8 1.6-2.1 2.8-3.7 3.6-1.5.8-3.3 1.1-4.9.8-1.6-.2-3.2-1-4.4-2.1-.4-.3-.4-.9-.1-1.2.3-.4.9-.4 1.2-.1 1 .7 2.2 1.1 3.4 1.1s2.3-.3 3.3-1c.9-.6 1.6-1.5 2-2.6.3-.9.4-1.8.2-2.8h-2.4c-.4 0-.7-.3-.7-.7 0-.2.1-.3.2-.4l4.4-4.4c.3-.3.7-.3.9 0L22 9.8c.3.3.4.6.3.9s-.3.3-.5.3z\" fill=\"#fff\"></path></g><g id=\"sb3-musicBlock\" fill=\"none\"><path d=\"M28.456 21.675c-.009-.312-.087-.825-.256-1.702-.096-.495-.612-3.022-.753-3.73-.395-1.98-.76-3.92-1.142-6.113-.732-4.223-.693-6.05.344-6.527.502-.23 1.06-.081 1.842.35.413.227 2.181 1.365 2.07 1.296 1.993 1.243 3.463 1.775 4.928 1.549 1.527-.237 2.505-.06 2.877.618.348.635.015 1.416-.729 2.18-1.473 1.516-3.976 2.514-5.849 2.023-.822-.218-1.238-.464-2.38-1.266a9.737 9.737 0 0 0-.095-.066c.047.593.264 1.74.717 3.803.294 1.336 2.079 9.187 2.637 11.674l.002.012c.529 2.637-1.872 4.724-5.235 4.724-3.29 0-6.363-1.988-6.862-4.528-.53-2.64 1.873-4.734 5.233-4.734a8.411 8.411 0 0 1 2.65.437zM11.46 27.666c-.01-.319-.091-.84-.266-1.738-.09-.46-.595-2.937-.753-3.727-.39-1.96-.752-3.892-1.131-6.07-.732-4.224-.692-6.052.344-6.527.502-.23 1.06-.082 1.841.349.414.228 2.181 1.365 2.07 1.296 1.992 1.243 3.461 1.775 4.925 1.549 1.525-.24 2.504-.064 2.876.614.348.635.015 1.415-.728 2.18-1.474 1.517-3.977 2.513-5.847 2.017-.822-.218-1.237-.463-2.38-1.266a9.729 9.729 0 0 0-.094-.065c.047.593.264 1.74.717 3.802.294 1.337 2.078 9.19 2.636 11.675l.003.013c.517 2.638-1.884 4.732-5.234 4.732-3.286 0-6.359-1.993-6.87-4.54-.518-2.639 1.885-4.73 5.242-4.73.904 0 1.802.15 2.65.436z\" stroke=\"#000\" stroke-opacity=\".1\"></path><path d=\"M32.18 25.874C32.636 28.157 30.512 30 27.433 30c-3.07 0-5.923-1.843-6.372-4.126-.458-2.285 1.665-4.136 4.743-4.136.647 0 1.283.084 1.89.234a7 7 0 0 1 .938.302c.87-.02-.104-2.294-1.835-12.229-2.134-12.303 3.06-1.87 8.768-2.753 5.708-.885.076 4.82-3.65 3.844-3.724-.987-4.65-7.153.263 14.738zm-16.998 5.99C15.63 34.148 13.507 36 10.439 36c-3.068 0-5.92-1.852-6.379-4.136-.448-2.284 1.674-4.135 4.751-4.135 1.002 0 1.974.197 2.854.544.822-.055-.15-2.377-1.862-12.228-2.133-12.303 3.059-1.87 8.764-2.753 5.706-.894.076 4.821-3.648 3.834-3.723-.987-4.648-7.152.263 14.738z\" fill=\"#FFF\"></path></g><g id=\"sb3-penBlock\" stroke=\"#575E75\" fill=\"none\" stroke-linejoin=\"round\"><path d=\"M8.753 34.602l-4.251 1.779 1.784-4.236c1.218-2.892 2.907-5.423 5.03-7.538L31.066 4.93c.846-.842 2.65-.41 4.032.967 1.38 1.375 1.816 3.173.97 4.015L16.318 29.59c-2.123 2.116-4.664 3.799-7.565 5.012\" fill=\"#FFF\"></path><path d=\"M29.41 6.111s-4.45-2.379-8.202 5.771c-1.734 3.766-4.35 1.546-4.35 1.546\"></path><path d=\"M36.42 8.825c0 .463-.14.873-.432 1.164l-9.335 9.301c.282-.29.41-.668.41-1.12 0-.874-.507-1.963-1.406-2.868-1.362-1.358-3.147-1.8-4.002-.99L30.99 5.01c.844-.84 2.65-.41 4.035.96.898.904 1.396 1.982 1.396 2.855M10.515 33.774a23.74 23.74 0 0 1-1.764.83L4.5 36.382l1.786-4.235c.258-.604.529-1.186.833-1.757.69.183 1.449.625 2.109 1.282.659.658 1.102 1.412 1.287 2.102\" fill=\"#4C97FF\"></path><path d=\"M36.498 8.748c0 .464-.141.874-.433 1.165l-19.742 19.68c-2.131 2.111-4.673 3.793-7.572 5.01L4.5 36.381l.974-2.317 1.925-.808c2.899-1.218 5.441-2.899 7.572-5.01l19.742-19.68c.292-.292.432-.702.432-1.165 0-.647-.27-1.4-.779-2.123.249.172.498.377.736.614.898.905 1.396 1.983 1.396 2.856\" fill=\"#575E75\" opacity=\".15\"></path><path d=\"M18.45 12.831a.904.904 0 1 1-1.807 0 .904.904 0 0 1 1.807 0z\" fill=\"#575E75\"></path></g><g id=\"sb3-videoBlock\" stroke=\"#000\" fill=\"#FFF\" stroke-opacity=\"0.15\"><circle opacity=\"0.25\" cx=\"32\" cy=\"16\" r=\"4.5\"></circle><circle opacity=\"0.5\" cx=\"32\" cy=\"12\" r=\"4.5\"></circle><circle opacity=\"0.75\" cx=\"32\" cy=\"8\" r=\"4.5\"></circle><circle cx=\"32\" cy=\"4\" r=\"4.5\"></circle><path d=\"M22.672 4.42l-6.172 4V6.1c0-2.01-1.563-3.6-3.5-3.6H4.1C2.076 2.5.5 4.076.5 6.1V14c0 1.927 1.584 3.512 3.6 3.6H13c1.902 0 3.5-1.653 3.5-3.6v-2.283l6.257 3.754.097.075c.02.02.098.054.146.054.267 0 .5-.217.5-.5V4.8c0 .037-.056-.094-.129-.243-.145-.242-.43-.299-.7-.137z\" fill=\"#4D4D4D\" stroke-linejoin=\"round\"></path></g><g id=\"sb3-faceSensingBlock\" transform=\"scale(1.67785234899 1.67785234899)\"><circle cx=\"8.35\" cy=\"9.65\" r=\"0.97\" fill=\"#FFF\"></circle><circle cx=\"14.19\" cy=\"9.65\" r=\"0.97\" fill=\"#FFF\"></circle><path d=\"M11.27 4.14c-3.94 0-7.13 3.19-7.13 7.13s3.19 7.13 7.13 7.13 7.13-3.19 7.13-7.13-3.19-7.13-7.13-7.13m0 1.3c3.22 0 5.84 2.61 5.84 5.84s-2.61 5.84-5.84 5.84-5.84-2.61-5.84-5.84 2.61-5.84 5.84-5.84\" fill=\"#FFF\"></path><path d=\"M17.57 13.88c.57-.15 1.02-.6 1.17-1.17l.35-1.3c.16-.61 1.04-.61 1.2 0l.35 1.3c.15.57.6 1.02 1.18 1.17l1.3.35c.61.16.61 1.04 0 1.2l-1.3.35c-.57.15-1.02.6-1.18 1.17l-.35 1.3c-.17.62-1.04.62-1.2 0l-.35-1.3c-.15-.57-.6-1.02-1.17-1.17l-1.3-.35c-.61-.17-.61-1.04 0-1.2l1.3-.35Zm-16-11.43c.43-.12.76-.45.88-.88l.26-.98c.12-.46.78-.46.9 0l.26.98c.12.43.45.76.88.88l.98.26c.46.12.46.78 0 .9l-.98.26c-.43.11-.77.45-.88.88l-.26.98c-.12.46-.78.46-.9 0l-.26-.98a1.26 1.26 0 0 0-.88-.88l-.98-.26c-.46-.12-.46-.78 0-.9z\" fill=\"#ffbf00\" fill-rule=\"evenodd\" stroke=\"#0b8e69\" stroke-miterlimit=\"2\" stroke-width=\".5\"></path><path d=\"M12.68 12.53c.2-.3.6-.38.9-.18s.38.6.18.9c-.56.83-1.41 1.26-2.48 1.26s-1.93-.43-2.48-1.26c-.2-.3-.12-.7.18-.9s.7-.12.9.18c.31.46.75.68 1.41.68s1.1-.22 1.41-.68Z\" fill=\"#FFF\"></path><path d=\"M20.89 6.06a.57.57 0 0 1-.57-.57V2.2h-3.31c-.31 0-.57-.25-.57-.57s.25-.57.57-.57h3.88c.31 0 .57.25.57.57v3.86c0 .31-.25.57-.57.57M5.44 21.46H1.59a.57.57 0 0 1-.57-.57v-3.82c0-.31.25-.57.57-.57s.57.25.57.57v3.25h3.28c.31 0 .57.25.57.57s-.25.57-.57.57\" fill=\"#0b8e69\"></path></g><g id=\"sb3-ttsBlock\" stroke=\"#000\" stroke-opacity=\"0.15\"><path d=\"M25.644 20.5c-1.667 1.937-4.539 3.429-5.977 3.429a1.25 1.25 0 0 1-.557-.137c-.372-.186-.61-.542-.61-1.03 0-.105.017-.207.05-.308.076-.236.624-.986.727-1.173.27-.484.462-1.075.566-1.865A8.5 8.5 0 0 1 24 3.5h4a8.5 8.5 0 1 1 0 17h-2.356z\" fill=\"#FFF\"></path><path d=\"M15.5 21.67c0-1.016-1.494-1.586-2.387-.782l-2.7 2.163A5.958 5.958 0 0 1 6.7 24.33h-.4c-1.035 0-1.8.69-1.8 1.573v4.235c0 .883.765 1.572 1.8 1.572h.4c1.458 0 2.754.423 3.82 1.287l2.598 2.161c.908.75 2.382.188 2.382-.876V21.67z\" fill=\"#4D4D4D\"></path></g><image id=\"sb3-translateBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAA21BMVEUAAAAAAAAAAAAAAADS0tIAAABHR0cAAADX19cAAAAAAACkpKRqamq2traurq6WlpbV1dWEhITHx8fPz8/Ly8vDw8O9vb0AAABMTEz////Z2dlXXnVMl//g4ODu7u7m5ub4+PhPmf/x8fH09PT6+vri4uNRmv/r6+1uqv/0+P9Ynv/p8v+rrrphZ33S5f+51v9ho/+1uMKBhpfH3v+Wmqhrcoacxf+Pvv/KzNSgpLGLkKDd6/+rzf9npv/AwsuDtv98s/90rv9jpP9GieeOrtm5ubl2fI7Z4u56otk5hEFfAAAAGXRSTlMAJhgM1wYyHvIkEWpBhXhc5U+uybyhk0YvleQYgwAABDpJREFUWMPtmNl6mzAQhQMCBAYbvLX1GIwxi7e2TtosTdKk+/L+T1QBVoQtJHDby5yLROYTPzOagSM4e9az6oVUrDgKxh39//Bwb+QBkTZ2VL3hypYilKWicpY6gmWcTCbxIoSh0xHjOkZXA4m0rlGcrcBsslcSmrYq4qm2GczmE6Hms6A8W4GQHZ1BTxXweuTCErGz1TEEaTpLymML6HVq87VhIWPRs21yNu679guNXn9hOnWVMUwanzxG0yCTdYQQts195umwJmnUDSatFHQRPaVvljkl4CAuRlWrCfD9uiZEbR+ObrnjfRDhwHUtdAi0gK/vLtts+VqDVfIMjZSmLEycBuD1D4kK8MHc+Ju3/FFQaHdXc4rBU/8NiCE+OJyAIQKuz32qjA7O1xzwqMtiUETAXeRzinZcyoPgsPpDcco3q9WD729WhTI/e1itbriUzwwtqPI0Q5et4ZoA6SDj1pCWOeB44qJ88aOiIB8j/xMH5IiUJwG+jfyHPMCNH20FQEpkPGnbnBeFuI78Fd82VWJCeTyQCzHb3pMCb8VAQhxBCkPKkzf2Z9J9mR9dCxqb3tBO17EoTw4ky0f0VXSnUCGE6LDp1tvlwK0cyNQMJA1DlL3Px8TenvTjpcAN5cD7VVSsoR992c4oS+aGcuDbzxFBfVqvv5L/375DCzeUAXfnOW5TJHudffvdzg3FwPdZvnbX6/LXr+9t3ZCzAAaMNh/X9BdAWzcUm9T2vnrpk91QbqOhLEDeDZuNHkBSX94Nm7ciAJOWAkW8WZIDl1MikAD57ZwceJsDL0VAfsPJwgzzO5cHvsmBb2IJkAlhB5InntlXlJcc8MO00GMzsHTbsMJDdU+hOxIeCfKuXYQu7ZJ5oDmExwPjfAEvyZ9lGyDW9tOWMH6l1z4nLwjrQ572RRugAvMS57mq4MH7czq9Kgpz1QZoDcI4DsHrWUjw4E1JbLeTSZ5z2gLYMTTwBnaOEwBvS1Ke86UUyF7isKpLrIHkSvVGBORdUQx8nFb0KAUy38aSCO8I510hMrhrBOrGEFIYGToPZM+Fn+XwiraiAMh2Uwnb+3DAC9Z/t3TIA2W7MwZkYbH+uZIC+f0jD3z9+vXF05hIAJTtcK3TLIDnMSLnhqeZlDo8eksYqH/3UskWPz7aCuDTX3urMiA5ejHCp7+YV4W9gxBnMFJP/XRwKNT3IEhLZpIGQMp86seNY6LlutRQgrFr6dLPLyELjm44eemIWt6C+JP0A1HffCIm4GDEw2jvpNTxbIwQ0kUTUYUYkgYTSXfMBU1Ee+G6fSwkOlpA/RFcJCR2erRHkllKSjNWhdd+NQbqkJrgunyPhKBIprpeiZyLZtEeCRNWQdlUZPU8yF1yYJ1J1HGGEC5iknS8pN0tRtoDDzTSNDLpqjMu2s4b9fBZg/TcJVHjrA7GSl/JZz7rWbX6A0ZzUfwVEqfrAAAAAElFTkSuQmCC\"></image></defs><g style=\"transform: scale(0.9)\"><g transform=\"translate(0 0)\"><g transform=\"translate(2 1)\"><path class=\"sb3-events\" d=\"M 0 16 c 25,-22 71,-22 96,0 L 114 16 a 4 4 0 0 1 4 4 L 118 60 a 4 4 0 0 1 -4 4 L 48 64 c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L 4 64 a 4 4 0 0 1 -4 -4 Z\"></path><text class=\"sb3-label sb3-\" x=\"0\" y=\"13.1\" transform=\"translate(8 33)\">when</text><use href=\"#sb3-greenFlag\" transform=\"translate(40 28)\"></use><text class=\"sb3-label sb3-\" x=\"0\" y=\"13.1\" transform=\"translate(68 33)\">clicked</text></g><g transform=\"translate(2 65)\"><g><g transform=\"translate(0 1)\"><path class=\"sb3-motion\" d=\"M 0 4
          A 4 4 0 0 1 4 0

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 14.2s)

_Thinking:_



_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | grep -E \"✓|✕|Tests:\" | head -10",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
    ✕ renders before and after scripts side by side (118 ms)
    ✓ shows placeholders for added and removed scripts (47 ms)
Tests:       1 failed, 1 passed, 2 total

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.8s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx -t \"side by side\" 2>&1 | grep -A12 \"● Blocks\" | head -25",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
  ● BlocksCompare › renders before and after scripts side by side

    expect(received).toContain(expected) // indexOf

    Expected substring: "sb-diff"
    Received string:    "<div><div><span>Before</span><div><svg version=\"1.1\" width=\"124.2\" height=\"109.8\" viewBox=\"0 0 124.2 109.8\" class=\"scratchblocks-style-scratch3\"><defs><g id=\"sb3-greenFlag\"><path d=\"M20.8 3.7c-.4-.2-.9-.1-1.2.2-2 1.6-4.8 1.6-6.8 0-2.3-1.9-5.6-2.3-8.3-1v-.4c0-.6-.5-1-1-1s-1 .4-1 1v18.8c0 .5.5 1 1 1h.1c.5 0 1-.5 1-1v-6.4c1-.7 2.1-1.2 3.4-1.3 1.2 0 2.4.4 3.4 1.2 2.9 2.3 7 2.3 9.8 0 .3-.2.4-.5.4-.9V4.7c0-.5-.3-.9-.8-1zm-.3 10.2C18 16 14.4 16 11.9 14c-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2l.1.1-.1 9.2z\" fill=\"#45993d\"></path><path d=\"M20.6 4.8l-.1 9.1v.1c-2.5 2-6.1 2-8.6 0-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2c0 .1.1.1.1.2z\" fill=\"#4cbf56\"></path></g><polygon points=\"6.6,0.5 13.12,0.5 19.5,6.6 19.5,13.12 13.12,19.5 6.6,19.5 0.5,13.12 0.5,6.6 \" fill=\"#ec5959\" stroke=\"#b84848\" stroke-linejoin=\"round\" stroke-linecap=\"round\" id=\"sb3-stopSign\"></polygon><path d=\"M0 0L4 4L0 8Z\" fill=\"#111\" id=\"sb3-addInput\"></path><path d=\"M4 0L4 8L0 4Z\" fill=\"#111\" id=\"sb3-delInput\"></path><g id=\"sb3-list\"><rect x=\"0\" y=\"0\" width=\"15\" height=\"18\" fill=\"#fff\"></rect><rect x=\"1\" y=\"1\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect><rect x=\"1\" y=\"7\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect><rect x=\"1\" y=\"13\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect></g><image id=\"sb3-microbitBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACmlBMVEUAAAArKysrIB8lJCNBRlY2O0U9X48sKCvOoBQzKzMnJyfrswi/xdDRoxN2dnbToxPosgnmsAq/lxo6MSq0kCLOoRXKnhbEmhc7LRooJCTcqQ7OoBXstAjpsgi9lhuvjCCPdSd4Zyg2NjZMi+Slhyq8lR5CR1fZqBG+lh3ttQjFnBnLnhbDmhqZore3kh5ARlW2kR6qiCGcfyU6QEtyYyd4ZSDSoxOGdDedgizLnhfgrA25kx9YXWqbgCxMUWDfqwzcqg/VphBBR1ecpLmcgSzHmxijq77BmRprYkOOlKZARlVGdbabo7m3kRxGcrKwjB9ARVSIjaCZobuVeyahgh+VdyE8XIOLayBIOydBR1f/vwBMl//m5+g+Q1JlanY6P0uCiJjj5OU9QVBARVQ/RFP9vgBFZpjk5ebwtgbzuAR0eotARlZITl3d3+KNlKRQVmRNUmGxs7mRlJtUW2nLnhfInRfpsQn1uQS/wsa0t7qlp62doKeKjpeBg41YXmxCSlvGyMtHb6xCUGlCTGBJgdJDSFVobXlMlPhLhtq/wchIesFGbqpDVXRXXGxCTGNiXEe+lh1LjuzP0dRJg9RIfslJfMW9v8RGbKRFY5Jzd4NdYm88QE1+bjrQpCHQohTxtwVLkPDa3OHd3t9If826vMCusLZHcrGIj6F6gpaDho9ESlpITFOQeTLcqhnEmhnqsw34uwVKkfNNhdi6vMRLUWBPUFC7lzDWpx31uQjutQj6vAP5+frZ29zZ2dvW2NtHc7JGbKVFaJx/hpl/hpdxd4hzd4JDWHpDUm5UWWiZhEh3aT6WfC/EnSqtiyW/lxzBmRpKi+VQgMhRermqq7BSdrCLjpVEXYVEW4A/SFtOT1BaV0pxZUCpjT2xkTcYNOUYAAAAWXRSTlMADBgV5DRLEdcIE+3Z2QLt6unOI/zp1dEcDf7z7eu9qVtFBPv7+/fx7u3p3NnOzcq0lXZENzD6+fj39vTm5uXk4t3c2tbS0c/NvrCopKKcm4yLbGpiTUA3JzDAPbYAAAQqSURBVFjD7dX1fxJhHMDxE+MIRRFrdnd3d3fr9ziwhsVsmC2K6HRTtzlb0ens2uzu7m79X3z4HufdwTNvj/qbfPYaPDe+vMf23AEXL168/6bBTfoWx5r0GskxVMhsoDfg3Lb12LlzIwz0zKZYzzy0lkPVKtXdutXw++o2a5UQ7SUMcqibGpA8kD09slX0azRkazwISB5Inn4D+ShwrNYjIHpQQA96mqPAYlqPgOhBAT0oUpgGyh6C6EHYWz11e7jbO9hAxUMQPezR6+wtW0nBlJzV7CB62nIyN/mB5H/ouM0G0j3ITIXsAMDUVMjcygbSPQgqrzCNDaR7sCEzO2cLKSvlLNP/ED1qgbRbh0m37viBAUSPvU/BYFZWcAMFRI+9HW/fOFLSgAaixw6erZWS5qeBVG+XKwlghWsuwALXHIA5rgUAc10r1KADvViwKNDaLO4EWCQuA5gnLgVYKs4DWCYuUoPoFRhcKa4FWCwuB1gizgeYLy4BWC4uBqWPq9Cjg55EJ5bogUi7J0wBmDwhMXzjBHBOmAyQSG4wnPd4cJ4Kejbem4gdTQL9NPN00Hlk0jRs//0p+puinaeDs0XxwMFtk8RZM6fob4pmPl/wxtqkOcemIai7Kco8HTx/88Ns8dBxgMcrEdTfFKcyP/9m1xhwwbV30sBGCdTPqczPu9Y5BoTzZODAg6S5kT9Zf1PU8+fz25TrTJuizOd32kjtL9CmaOfpJ/Zd5UTV3RTtfP6X3mfl0tNNuVSpILYp5xHL25ccFUQv9cwGhrcvPZB4jgiovyn6IHrrZFB/U/RBf6rD8f4sgqzRwTtZQfKZGPiXm4Kxb8rff6awgf9sU5jTB9O79G63BqTW1C5baQ9geNSwvnIEJ8s2PCkPXqhTtlM6HUxvWpiv3h6kyozmDY2egnzUkjc3/3X0bAjPt3gW+VWVxvFtSn6hgi9acxzfeI001yiBs46pI7/AkjzHVSgjg5XIkwvXB+xbcxNnGraHCmZUr8nxJS/g3AlC1KzujQgnOpo5axufDFasYLUa2gK2p2ohzlTtJB2sV6NCNSECCtUq1Kj3CxSq2luXlY8gufF4e9PkCLiwpWFULg38+qKiILgFYe9Lr++07zSur4SXr7zeV5Gj0z5vxt69GVcFt1vI874kS6/0pDIZsWB6crLgzhNI+wRhOrm7Sr5n4HIhWeW5yRJ/EBYuS4+5yUN5Vy9fuewT6GDouQq8qAFDITX4/XmuDF788eTJRQpoD4PTT6nAXA14KVcNhshgBDx16VTokk9oZo4Czf0JiEkgpoCYApJkEPMJwxOiQFONDn8DlrRbuWjRXrWEzWKzlOhnLNfHWN5S2Va5cndjufLG8uWMpRs0sFmqdMNliRKlS1nIlw2Xxh5kWaVKC0NNLiarqdAfZ+LixYsX77f9BFJt17cXqnnkAAAAAElFTkSuQmCC\"></image><g id=\"sb3-wedoBlock\" fill=\"none\"><path d=\"M23.513 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M24.91 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M9.54 11.17h-.728c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479\" fill=\"#7C87A5\"></path><path d=\"M10.938 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479z\"></path><path d=\"M26.305 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M27.702 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M29.101 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M30.498 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M17.925 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M19.322 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M20.717 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M22.114 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M15.129 11.17H14.4c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M16.526 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M12.335 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.882v-1.08c0-.265-.26-.479-.577-.479\" fill=\"#7C87A5\"></path><path d=\"M13.732 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M31.893 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M33.29 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992\" fill=\"#FFF\"></path><path d=\"M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" fill=\"#FFF\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z\" fill=\"#4C97FF\"></path><path d=\"M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z\" stroke=\"#3D79CC\" stroke-width=\".893\"></path><path stroke=\"#7C87A5\" stroke-width=\".893\" d=\"M4.47 20.474h27.961l2.157 2.974\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479z\"></path><path d=\"M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993\" fill=\"#E6E7E8\"></path><path d=\"M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z\" fill=\"#E6E7E8\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path fill=\"#E6E7E8\" d=\"M19.53 24.438h11.294V20.47H19.529z\"></path><path stroke=\"#7C87A5\" stroke-width=\".893\" d=\"M19.53 24.438h11.294V20.47H19.529zm12.902-3.964l2.157-2.794\"></path></g><g transform=\"translate(5.5 3.5)\" id=\"sb3-ev3Block\"><rect stroke=\"#7C87A5\" fill=\"#FFF\" x=\".5\" y=\"3.59\" width=\"28\" height=\"25.81\" rx=\"1\"></rect><rect stroke=\"#7C87A5\" fill=\"#E6E7E8\" x=\"2.5\" y=\".5\" width=\"24\" height=\"32\" rx=\"1\"></rect><path stroke=\"#7C87A5\" fill=\"#FFF\" d=\"M2.5 14.5h24v13h-24z\"></path><path d=\"M14.5 10.5v4\" stroke=\"#7C87A5\" fill=\"#E6E7E8\"></path><rect fill=\"#414757\" x=\"4.5\" y=\"2.5\" width=\"20\" height=\"10\" rx=\"1\"></rect><rect fill=\"#7C87A5\" opacity=\".5\" x=\"13.5\" y=\"20.13\" width=\"2\" height=\"2\" rx=\".5\"></rect><path d=\"M9.06 20.13h1.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1.5a1 1 0 0 1 0-2zM19.93 22.13h-1.51a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1.5a1 1 0 0 1 .01 2zM8.23 17.5H5a.5.5 0 0 1-.5-.5v-2.5h6l-1.85 2.78a.51.51 0 0 1-.42.22zM18.15 18.85l-.5.5a.49.49 0 0 0-.15.36V20a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-.29a.49.49 0 0 0-.15-.36l-.5-.5a.51.51 0 0 1 0-.71l1.51-1.49a.47.47 0 0 1 .35-.15h3.58a.47.47 0 0 1 .35.15l1.51 1.49a.51.51 0 0 1 0 .71zM10.85 23.45l.5-.5a.49.49 0 0 0 .15-.36v-.29a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.29a.49.49 0 0 0 .15.36l.5.5a.5.5 0 0 1 0 .7l-1.51 1.5a.47.47 0 0 1-.35.15h-3.58a.47.47 0 0 1-.35-.15l-1.51-1.5a.5.5 0 0 1 0-.7z\" fill=\"#7C87A5\" opacity=\".5\"></path><path d=\"M21.5 27.5h5v4a1 1 0 0 1-1 1h-4v-5z\" stroke=\"#CC4C23\" fill=\"#F15A29\"></path></g><g id=\"sb3-makeymakeyBlock\" fill=\"none\"><path d=\"M35 28H5a1 1 0 0 1-1-1V12c0-.6.4-1 1-1h30c.5 0 1 .4 1 1v15c0 .5-.5 1-1 1z\" fill=\"#fff\"></path><path fill=\"red\" d=\"M4 25h32v2.7H4zm9-1h-2.2a1 1 0 0 1-1-1v-9.7c0-.6.4-1 1-1H13c.6 0 1 .4 1 1V23c0 .6-.5 1-1 1z\"></path><path fill=\"red\" d=\"M6.1 19.3v-2.2c0-.5.4-1 1-1h9.7c.5 0 1 .5 1 1v2.2c0 .5-.5 1-1 1H7.1a1 1 0 0 1-1-1z\"></path><circle fill=\"red\" cx=\"22.8\" cy=\"18.2\" r=\"3.4\"></circle><circle fill=\"red\" cx=\"30.6\" cy=\"18.2\" r=\"3.4\"></circle><path fill=\"red\" d=\"M4.2 27h31.9v.7H4.2z\"></path><circle fill=\"#e0e0e0\" cx=\"22.8\" cy=\"18.2\" r=\"2.3\"></circle><circle fill=\"#e0e0e0\" cx=\"30.6\" cy=\"18.2\" r=\"2.3\"></circle><path fill=\"#e0e0e0\" d=\"M12.5 22.9h-1.2c-.3 0-.5-.2-.5-.5V14c0-.3.2-.5.5-.5h1.2c.3 0 .5.2.5.5v8.4c0 .3-.2.5-.5.5z\"></path><path fill=\"#e0e0e0\" d=\"M7.2 18.7v-1.2c0-.3.2-.5.5-.5h8.4c.3 0 .5.2.5.5v1.2c0 .3-.2.5-.5.5H7.7c-.3 0-.5-.2-.5-.5zM4 26h32v2H4z\"></path><path stroke=\"#666\" stroke-width=\".5\" d=\"M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z\"></path><path stroke=\"#666\" stroke-width=\".5\" d=\"M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z\"></path></g><image id=\"sb3-gdxforBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAABAlBMVEUAAAABAQEAAAB9h6YAAAAAAAAAAAB8iKZ7iKaAjKvm5+h+iqhcXFxGR0d8iKbj5OV9iKZ8h6be3+Db3d19h6acnJ0AAAB7nrDh4uPh4uN9iabZ2tt9iKbX19nJycnExsZ8iKe+wMC7vL2Eka/g4ePU1dV8iKZ9iKZ9iKd+iKitra2RkZGLjo5wcHCLi7l0oqJV//9csdZ8h6WFkq//vwDm5+iEka79vgJ6iql9iaaHk6tgq9Btm71+iadmo8dzk7OCj6yAjKp/iqhiqc1qnsB4jKtgrNFwl7d1tLTgtCxpocN0krJ2j65ossWNtZSbt4LAulHWsDnasTTuvhXzvg9zk7TzqAfaAAAAMXRSTlMAJiLoFBwI8q4a+0c4M/nr3tnQwKxYDAnk2726tbGMh4J9dinXq56ddG9nT01ACwsDk/+seAAAAidJREFUWMPt2Olu2kAUhuE5NvuaBAhZm7TpvufgMXaBbmAghOzp/d9KD7RW6yaqPeL7YVV9/471aBgfCXnUH7ULNhtkF96qv1dgwwoxoM08cDsJcwfMdgwonoiJPRFjQXkscQM3Adhxk4NuJwkoDx0nSp5NDTiae958NEaBwzkvC4YYcOxx7fCoeJhnrwcBv7H9TklFm08R4JD5SEkiMg8B4IjXwsV1HgHAPu+EizsQcMbr2B0OufZz7X0NcIZSwC9+rD3nADI2/fCtrHEfAvZ8Liqp6PuIwZZO+ZmSnspcY8AZ55WU5xkElDwuK1Vm7xgFTjhfLud5AgPHAUvBGARKvYnnTXpp/gvAg9PLyykSPLt1nNszIHjuSOdAcNp1nO4UeYYXNzcX0UH62P+0AnjH8lgCgL8s/+uXzwZgrOV2JAMwxpIMwRjLHIyxzMEYyxyMWgAwYiHAzm99iLQ6eOJEul4d7Ea6WhG8W7rAE+fertHgVXp+clpB9Oet64M/wH2TKwI/FrRFTH6JIZ6NvmZpxoDtptlFULOtzGPWy+4/r//gvwKGgcC90NtTqIg2dIuyClaWDvTjKlDMLba4UaUMcIuVbd0gyiGwjGVlFuKWfkQZhEfSQnypd8mCvOHGvkA5quo6EQSs6yrlNumN3obs0KKGHJ70QD+hLOQMW7r0sFI5KJVeY+bGkr1JopKlEG0StXbrW/uvQGMookXLLPFAZYTMJju/7z6rRW1MZcnIAAAAAElFTkSuQmCC\"></image><image id=\"sb3-boostBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQBAMAAAB8P++eAAAAKlBMVEUAAAD///98h6Xm5+iVnrb/Zhq+w9L5hk73+Pnf4eSQmbLr7Ozo39vp184hSCf6AAAAAXRSTlMAQObYZgAAAOFJREFUSMftlDEOgjAUhonhAi1sLvIk7NDJDTYu0LhzBzcXruHoDTyFB/BCNi30KU3InzioSb++hAS+vPfKa5pEIpHvk7a8gpf8ISWINtlg4i7ZFOKVTBlqsUR+ItYZJG7VzQQgMqGYd7zWRArpULEAe5Q/J9JMj4rluC7uleNw7TFRXcoREDnlinjX57eUsvRTn8+AE0/6OKV0g5buYTTyWFFr/XAp3aDzed4yFJWnKbhPbtaXXohDNYlDJWz4zSxEokkkEjb496AiVtqAbIYgYNGWBmhgES+NX6SRSORfeAJMWajr95DdqQAAAABJRU5ErkJggg==\"></image><g id=\"sb3-dropdownArrow\" transform=\"scale(0.94413847364)\"><path d=\"M12.71 2.44A2.41 2.41 0 0 1 12 4.16L8.08 8.08a2.45 2.45 0 0 1-3.45 0L.72 4.16A2.42 2.42 0 0 1 0 2.44 2.48 2.48 0 0 1 .71.71C1 .47 1.43 0 6.36 0s5.39.46 5.64.71a2.44 2.44 0 0 1 .71 1.73z\" fill=\"#231f20\" opacity=\".1\"></path><path d=\"M6.36 7.79a1.43 1.43 0 0 1-1-.42L1.42 3.45a1.44 1.44 0 0 1 0-2c.56-.56 9.31-.56 9.87 0a1.44 1.44 0 0 1 0 2L7.37 7.37a1.43 1.43 0 0 1-1.01.42z\" fill=\"#fff\"></path></g><g id=\"sb3-turnRight\"><path d=\"M22.68 12.2a1.6 1.6 0 0 1-1.27.63h-7.69a1.59 1.59 0 0 1-1.16-2.58l1.12-1.41a4.82 4.82 0 0 0-3.14-.77 4.31 4.31 0 0 0-2 .8A4.25 4.25 0 0 0 7.2 10.6a5.06 5.06 0 0 0 .54 4.62A5.58 5.58 0 0 0 12 17.74a2.26 2.26 0 0 1-.16 4.52A10.25 10.25 0 0 1 3.74 18a10.14 10.14 0 0 1-1.49-9.22 9.7 9.7 0 0 1 2.83-4.14A9.92 9.92 0 0 1 9.66 2.5a10.66 10.66 0 0 1 7.72 1.68l1.08-1.35a1.57 1.57 0 0 1 1.24-.6 1.6 1.6 0 0 1 1.54 1.21l1.7 7.37a1.57 1.57 0 0 1-.26 1.39z\" fill=\"#3d79cc\"></path><path d=\"M21.38 11.83h-7.61a.59.59 0 0 1-.43-1l1.75-2.19a5.9 5.9 0 0 0-4.7-1.58 5.07 5.07 0 0 0-4.11 3.17A6 6 0 0 0 7 15.77a6.51 6.51 0 0 0 5 2.92 1.31 1.31 0 0 1-.08 2.62 9.3 9.3 0 0 1-7.35-3.82 9.16 9.16 0 0 1-1.4-8.37A8.51 8.51 0 0 1 5.71 5.4a8.76 8.76 0 0 1 4.11-1.92 9.71 9.71 0 0 1 7.75 2.07l1.67-2.1a.59.59 0 0 1 1 .21L22 11.08a.59.59 0 0 1-.62.75z\" fill=\"#fff\"></path></g><g id=\"sb3-turnLeft\"><path d=\"M20.34 18.21a10.24 10.24 0 0 1-8.1 4.22 2.26 2.26 0 0 1-.16-4.52 5.58 5.58 0 0 0 4.25-2.53 5.06 5.06 0 0 0 .54-4.62A4.25 4.25 0 0 0 15.55 9a4.31 4.31 0 0 0-2-.8 4.82 4.82 0 0 0-3.15.8l1.12 1.41A1.59 1.59 0 0 1 10.36 13H2.67a1.56 1.56 0 0 1-1.26-.63A1.54 1.54 0 0 1 1.13 11l1.72-7.43A1.59 1.59 0 0 1 4.38 2.4a1.57 1.57 0 0 1 1.24.6L6.7 4.35a10.66 10.66 0 0 1 7.72-1.68A9.88 9.88 0 0 1 19 4.81 9.61 9.61 0 0 1 21.83 9a10.08 10.08 0 0 1-1.49 9.21z\" fill=\"#3d79cc\"></path><path d=\"M19.56 17.65a9.29 9.29 0 0 1-7.35 3.83 1.31 1.31 0 0 1-.08-2.62 6.53 6.53 0 0 0 5-2.92 6.05 6.05 0 0 0 .67-5.51 5.32 5.32 0 0 0-1.64-2.16 5.21 5.21 0 0 0-2.48-1A5.86 5.86 0 0 0 9 8.84L10.74 11a.59.59 0 0 1-.43 1H2.7a.6.6 0 0 1-.6-.75l1.71-7.42a.59.59 0 0 1 1-.21l1.67 2.1a9.71 9.71 0 0 1 7.75-2.07 8.84 8.84 0 0 1 4.12 1.92 8.68 8.68 0 0 1 2.54 3.72 9.14 9.14 0 0 1-1.33 8.36z\" fill=\"#fff\"></path></g><g id=\"sb3-loopArrow\"><path d=\"M23.3 11c-.3.6-.9 1-1.5 1h-1.6c-.1 1.3-.5 2.5-1.1 3.6-.9 1.7-2.3 3.2-4.1 4.1-1.7.9-3.6 1.2-5.5.9-1.8-.3-3.5-1.1-4.9-2.3-.7-.7-.7-1.9 0-2.6.6-.6 1.6-.7 2.3-.2H7c.9.6 1.9.9 2.9.9s1.9-.3 2.7-.9c1.1-.8 1.8-2.1 1.8-3.5h-1.5c-.9 0-1.7-.7-1.7-1.7 0-.4.2-.9.5-1.2l4.4-4.4c.7-.6 1.7-.6 2.4 0L23 9.2c.5.5.6 1.2.3 1.8z\" fill=\"#cf8b17\"></path><path d=\"M21.8 11h-2.6c0 1.5-.3 2.9-1 4.2-.8 1.6-2.1 2.8-3.7 3.6-1.5.8-3.3 1.1-4.9.8-1.6-.2-3.2-1-4.4-2.1-.4-.3-.4-.9-.1-1.2.3-.4.9-.4 1.2-.1 1 .7 2.2 1.1 3.4 1.1s2.3-.3 3.3-1c.9-.6 1.6-1.5 2-2.6.3-.9.4-1.8.2-2.8h-2.4c-.4 0-.7-.3-.7-.7 0-.2.1-.3.2-.4l4.4-4.4c.3-.3.7-.3.9 0L22 9.8c.3.3.4.6.3.9s-.3.3-.5.3z\" fill=\"#fff\"></path></g><g id=\"sb3-musicBlock\" fill=\"none\"><path d=\"M28.456 21.675c-.009-.312-.087-.825-.256-1.702-.096-.495-.612-3.022-.753-3.73-.395-1.98-.76-3.92-1.142-6.113-.732-4.223-.693-6.05.344-6.527.502-.23 1.06-.081 1.842.35.413.227 2.181 1.365 2.07 1.296 1.993 1.243 3.463 1.775 4.928 1.549 1.527-.237 2.505-.06 2.877.618.348.635.015 1.416-.729 2.18-1.473 1.516-3.976 2.514-5.849 2.023-.822-.218-1.238-.464-2.38-1.266a9.737 9.737 0 0 0-.095-.066c.047.593.264 1.74.717 3.803.294 1.336 2.079 9.187 2.637 11.674l.002.012c.529 2.637-1.872 4.724-5.235 4.724-3.29 0-6.363-1.988-6.862-4.528-.53-2.64 1.873-4.734 5.233-4.734a8.411 8.411 0 0 1 2.65.437zM11.46 27.666c-.01-.319-.091-.84-.266-1.738-.09-.46-.595-2.937-.753-3.727-.39-1.96-.752-3.892-1.131-6.07-.732-4.224-.692-6.052.344-6.527.502-.23 1.06-.082 1.841.349.414.228 2.181 1.365 2.07 1.296 1.992 1.243 3.461 1.775 4.925 1.549 1.525-.24 2.504-.064 2.876.614.348.635.015 1.415-.728 2.18-1.474 1.517-3.977 2.513-5.847 2.017-.822-.218-1.237-.463-2.38-1.266a9.729 9.729 0 0 0-.094-.065c.047.593.264 1.74.717 3.802.294 1.337 2.078 9.19 2.636 11.675l.003.013c.517 2.638-1.884 4.732-5.234 4.732-3.286 0-6.359-1.993-6.87-4.54-.518-2.639 1.885-4.73 5.242-4.73.904 0 1.802.15 2.65.436z\" stroke=\"#000\" stroke-opacity=\".1\"></path><path d=\"M32.18 25.874C32.636 28.157 30.512 30 27.433 30c-3.07 0-5.923-1.843-6.372-4.126-.458-2.285 1.665-4.136 4.743-4.136.647 0 1.283.084 1.89.234a7 7 0 0 1 .938.302c.87-.02-.104-2.294-1.835-12.229-2.134-12.303 3.06-1.87 8.768-2.753 5.708-.885.076 4.82-3.65 3.844-3.724-.987-4.65-7.153.263 14.738zm-16.998 5.99C15.63 34.148 13.507 36 10.439 36c-3.068 0-5.92-1.852-6.379-4.136-.448-2.284 1.674-4.135 4.751-4.135 1.002 0 1.974.197 2.854.544.822-.055-.15-2.377-1.862-12.228-2.133-12.303 3.059-1.87 8.764-2.753 5.706-.894.076 4.821-3.648 3.834-3.723-.987-4.648-7.152.263 14.738z\" fill=\"#FFF\"></path></g><g id=\"sb3-penBlock\" stroke=\"#575E75\" fill=\"none\" stroke-linejoin=\"round\"><path d=\"M8.753 34.602l-4.251 1.779 1.784-4.236c1.218-2.892 2.907-5.423 5.03-7.538L31.066 4.93c.846-.842 2.65-.41 4.032.967 1.38 1.375 1.816 3.173.97 4.015L16.318 29.59c-2.123 2.116-4.664 3.799-7.565 5.012\" fill=\"#FFF\"></path><path d=\"M29.41 6.111s-4.45-2.379-8.202 5.771c-1.734 3.766-4.35 1.546-4.35 1.546\"></path><path d=\"M36.42 8.825c0 .463-.14.873-.432 1.164l-9.335 9.301c.282-.29.41-.668.41-1.12 0-.874-.507-1.963-1.406-2.868-1.362-1.358-3.147-1.8-4.002-.99L30.99 5.01c.844-.84 2.65-.41 4.035.96.898.904 1.396 1.982 1.396 2.855M10.515 33.774a23.74 23.74 0 0 1-1.764.83L4.5 36.382l1.786-4.235c.258-.604.529-1.186.833-1.757.69.183 1.449.625 2.109 1.282.659.658 1.102 1.412 1.287 2.102\" fill=\"#4C97FF\"></path><path d=\"M36.498 8.748c0 .464-.141.874-.433 1.165l-19.742 19.68c-2.131 2.111-4.673 3.793-7.572 5.01L4.5 36.381l.974-2.317 1.925-.808c2.899-1.218 5.441-2.899 7.572-5.01l19.742-19.68c.292-.292.432-.702.432-1.165 0-.647-.27-1.4-.779-2.123.249.172.498.377.736.614.898.905 1.396 1.983 1.396 2.856\" fill=\"#575E75\" opacity=\".15\"></path><path d=\"M18.45 12.831a.904.904 0 1 1-1.807 0 .904.904 0 0 1 1.807 0z\" fill=\"#575E75\"></path></g><g id=\"sb3-videoBlock\" stroke=\"#000\" fill=\"#FFF\" stroke-opacity=\"0.15\"><circle opacity=\"0.25\" cx=\"32\" cy=\"16\" r=\"4.5\"></circle><circle opacity=\"0.5\" cx=\"32\" cy=\"12\" r=\"4.5\"></circle><circle opacity=\"0.75\" cx=\"32\" cy=\"8\" r=\"4.5\"></circle><circle cx=\"32\" cy=\"4\" r=\"4.5\"></circle><path d=\"M22.672 4.42l-6.172 4V6.1c0-2.01-1.563-3.6-3.5-3.6H4.1C2.076 2.5.5 4.076.5 6.1V14c0 1.927 1.584 3.512 3.6 3.6H13c1.902 0 3.5-1.653 3.5-3.6v-2.283l6.257 3.754.097.075c.02.02.098.054.146.054.267 0 .5-.217.5-.5V4.8c0 .037-.056-.094-.129-.243-.145-.242-.43-.299-.7-.137z\" fill=\"#4D4D4D\" stroke-linejoin=\"round\"></path></g><g id=\"sb3-faceSensingBlock\" transform=\"scale(1.67785234899 1.67785234899)\"><circle cx=\"8.35\" cy=\"9.65\" r=\"0.97\" fill=\"#FFF\"></circle><circle cx=\"14.19\" cy=\"9.65\" r=\"0.97\" fill=\"#FFF\"></circle><path d=\"M11.27 4.14c-3.94 0-7.13 3.19-7.13 7.13s3.19 7.13 7.13 7.13 7.13-3.19 7.13-7.13-3.19-7.13-7.13-7.13m0 1.3c3.22 0 5.84 2.61 5.84 5.84s-2.61 5.84-5.84 5.84-5.84-2.61-5.84-5.84 2.61-5.84 5.84-5.84\" fill=\"#FFF\"></path><path d=\"M17.57 13.88c.57-.15 1.02-.6 1.17-1.17l.35-1.3c.16-.61 1.04-.61 1.2 0l.35 1.3c.15.57.6 1.02 1.18 1.17l1.3.35c.61.16.61 1.04 0 1.2l-1.3.35c-.57.15-1.02.6-1.18 1.17l-.35 1.3c-.17.62-1.04.62-1.2 0l-.35-1.3c-.15-.57-.6-1.02-1.17-1.17l-1.3-.35c-.61-.17-.61-1.04 0-1.2l1.3-.35Zm-16-11.43c.43-.12.76-.45.88-.88l.26-.98c.12-.46.78-.46.9 0l.26.98c.12.43.45.76.88.88l.98.26c.46.12.46.78 0 .9l-.98.26c-.43.11-.77.45-.88.88l-.26.98c-.12.46-.78.46-.9 0l-.26-.98a1.26 1.26 0 0 0-.88-.88l-.98-.26c-.46-.12-.46-.78 0-.9z\" fill=\"#ffbf00\" fill-rule=\"evenodd\" stroke=\"#0b8e69\" stroke-miterlimit=\"2\" stroke-width=\".5\"></path><path d=\"M12.68 12.53c.2-.3.6-.38.9-.18s.38.6.18.9c-.56.83-1.41 1.26-2.48 1.26s-1.93-.43-2.48-1.26c-.2-.3-.12-.7.18-.9s.7-.12.9.18c.31.46.75.68 1.41.68s1.1-.22 1.41-.68Z\" fill=\"#FFF\"></path><path d=\"M20.89 6.06a.57.57 0 0 1-.57-.57V2.2h-3.31c-.31 0-.57-.25-.57-.57s.25-.57.57-.57h3.88c.31 0 .57.25.57.57v3.86c0 .31-.25.57-.57.57M5.44 21.46H1.59a.57.57 0 0 1-.57-.57v-3.82c0-.31.25-.57.57-.57s.57.25.57.57v3.25h3.28c.31 0 .57.25.57.57s-.25.57-.57.57\" fill=\"#0b8e69\"></path></g><g id=\"sb3-ttsBlock\" stroke=\"#000\" stroke-opacity=\"0.15\"><path d=\"M25.644 20.5c-1.667 1.937-4.539 3.429-5.977 3.429a1.25 1.25 0 0 1-.557-.137c-.372-.186-.61-.542-.61-1.03 0-.105.017-.207.05-.308.076-.236.624-.986.727-1.173.27-.484.462-1.075.566-1.865A8.5 8.5 0 0 1 24 3.5h4a8.5 8.5 0 1 1 0 17h-2.356z\" fill=\"#FFF\"></path><path d=\"M15.5 21.67c0-1.016-1.494-1.586-2.387-.782l-2.7 2.163A5.958 5.958 0 0 1 6.7 24.33h-.4c-1.035 0-1.8.69-1.8 1.573v4.235c0 .883.765 1.572 1.8 1.572h.4c1.458 0 2.754.423 3.82 1.287l2.598 2.161c.908.75 2.382.188 2.382-.876V21.67z\" fill=\"#4D4D4D\"></path></g><image id=\"sb3-translateBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAA21BMVEUAAAAAAAAAAAAAAADS0tIAAABHR0cAAADX19cAAAAAAACkpKRqamq2traurq6WlpbV1dWEhITHx8fPz8/Ly8vDw8O9vb0AAABMTEz////Z2dlXXnVMl//g4ODu7u7m5ub4+PhPmf/x8fH09PT6+vri4uNRmv/r6+1uqv/0+P9Ynv/p8v+rrrphZ33S5f+51v9ho/+1uMKBhpfH3v+Wmqhrcoacxf+Pvv/KzNSgpLGLkKDd6/+rzf9npv/AwsuDtv98s/90rv9jpP9GieeOrtm5ubl2fI7Z4u56otk5hEFfAAAAGXRSTlMAJhgM1wYyHvIkEWpBhXhc5U+uybyhk0YvleQYgwAABDpJREFUWMPtmNl6mzAQhQMCBAYbvLX1GIwxi7e2TtosTdKk+/L+T1QBVoQtJHDby5yLROYTPzOagSM4e9az6oVUrDgKxh39//Bwb+QBkTZ2VL3hypYilKWicpY6gmWcTCbxIoSh0xHjOkZXA4m0rlGcrcBsslcSmrYq4qm2GczmE6Hms6A8W4GQHZ1BTxXweuTCErGz1TEEaTpLymML6HVq87VhIWPRs21yNu679guNXn9hOnWVMUwanzxG0yCTdYQQts195umwJmnUDSatFHQRPaVvljkl4CAuRlWrCfD9uiZEbR+ObrnjfRDhwHUtdAi0gK/vLtts+VqDVfIMjZSmLEycBuD1D4kK8MHc+Ju3/FFQaHdXc4rBU/8NiCE+OJyAIQKuz32qjA7O1xzwqMtiUETAXeRzinZcyoPgsPpDcco3q9WD729WhTI/e1itbriUzwwtqPI0Q5et4ZoA6SDj1pCWOeB44qJ88aOiIB8j/xMH5IiUJwG+jfyHPMCNH20FQEpkPGnbnBeFuI78Fd82VWJCeTyQCzHb3pMCb8VAQhxBCkPKkzf2Z9J9mR9dCxqb3tBO17EoTw4ky0f0VXSnUCGE6LDp1tvlwK0cyNQMJA1DlL3Px8TenvTjpcAN5cD7VVSsoR992c4oS+aGcuDbzxFBfVqvv5L/375DCzeUAXfnOW5TJHudffvdzg3FwPdZvnbX6/LXr+9t3ZCzAAaMNh/X9BdAWzcUm9T2vnrpk91QbqOhLEDeDZuNHkBSX94Nm7ciAJOWAkW8WZIDl1MikAD57ZwceJsDL0VAfsPJwgzzO5cHvsmBb2IJkAlhB5InntlXlJcc8MO00GMzsHTbsMJDdU+hOxIeCfKuXYQu7ZJ5oDmExwPjfAEvyZ9lGyDW9tOWMH6l1z4nLwjrQ572RRugAvMS57mq4MH7czq9Kgpz1QZoDcI4DsHrWUjw4E1JbLeTSZ5z2gLYMTTwBnaOEwBvS1Ke86UUyF7isKpLrIHkSvVGBORdUQx8nFb0KAUy38aSCO8I510hMrhrBOrGEFIYGToPZM+Fn+XwiraiAMh2Uwnb+3DAC9Z/t3TIA2W7MwZkYbH+uZIC+f0jD3z9+vXF05hIAJTtcK3TLIDnMSLnhqeZlDo8eksYqH/3UskWPz7aCuDTX3urMiA5ejHCp7+YV4W9gxBnMFJP/XRwKNT3IEhLZpIGQMp86seNY6LlutRQgrFr6dLPLyELjm44eemIWt6C+JP0A1HffCIm4GDEw2jvpNTxbIwQ0kUTUYUYkgYTSXfMBU1Ee+G6fSwkOlpA/RFcJCR2erRHkllKSjNWhdd+NQbqkJrgunyPhKBIprpeiZyLZtEeCRNWQdlUZPU8yF1yYJ1J1HGGEC5iknS8pN0tRtoDDzTSNDLpqjMu2s4b9fBZg/TcJVHjrA7GSl/JZz7rWbX6A0ZzUfwVEqfrAAAAAElFTkSuQmCC\"></image></defs><g style=\"transform: scale(0.9)\"><g transform=\"translate(0 0)\"><g transform=\"translate(2 1)\"><path class=\"sb3-events\" d=\"M 0 16 c 25,-22 71,-22 96,0 L 114 16 a 4 4 0 0 1 4 4 L 118 60 a 4 4 0 0 1 -4 4 L 48 64 c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L 4 64 a 4 4 0 0 1 -4 -4 Z\"></path><text class=\"sb3-label sb3-\" x=\"0\" y=\"13.1\" transform=\"translate(8 33)\">when</text><use href=\"#sb3-greenFlag\" transform=\"translate(40 28)\"></use><text class=\"sb3-label sb3-\" x=\"0\" y=\"13.1\" transform=\"translate(68 33)\">clicked</text></g><g transform=\"translate(2 65)\"><path class=\"sb3-motion\" d=\"M 0 4
          A 4 4 0 0 1 4 0
          H 12 c 2 0 3 1 4 2
          l 4 4
          c 1 1 2 2 4 2
          h 12
          c 2 0 3 -1 4 -2
          l 4 -4

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 18.0s)

_Thinking:_



_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx -t \"side by side\" 2>&1 | grep -E \"Expected|Received|at Object\" | head -8",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
    Expected substring: "sb-diff"
    Received string:    "<div><div><span>Before</span><div><svg version=\"1.1\" width=\"124.2\" height=\"109.8\" viewBox=\"0 0 124.2 109.8\" class=\"scratchblocks-style-scratch3\"><defs><g id=\"sb3-greenFlag\"><path d=\"M20.8 3.7c-.4-.2-.9-.1-1.2.2-2 1.6-4.8 1.6-6.8 0-2.3-1.9-5.6-2.3-8.3-1v-.4c0-.6-.5-1-1-1s-1 .4-1 1v18.8c0 .5.5 1 1 1h.1c.5 0 1-.5 1-1v-6.4c1-.7 2.1-1.2 3.4-1.3 1.2 0 2.4.4 3.4 1.2 2.9 2.3 7 2.3 9.8 0 .3-.2.4-.5.4-.9V4.7c0-.5-.3-.9-.8-1zm-.3 10.2C18 16 14.4 16 11.9 14c-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2l.1.1-.1 9.2z\" fill=\"#45993d\"></path><path d=\"M20.6 4.8l-.1 9.1v.1c-2.5 2-6.1 2-8.6 0-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2c0 .1.1.1.1.2z\" fill=\"#4cbf56\"></path></g><polygon points=\"6.6,0.5 13.12,0.5 19.5,6.6 19.5,13.12 13.12,19.5 6.6,19.5 0.5,13.12 0.5,6.6 \" fill=\"#ec5959\" stroke=\"#b84848\" stroke-linejoin=\"round\" stroke-linecap=\"round\" id=\"sb3-stopSign\"></polygon><path d=\"M0 0L4 4L0 8Z\" fill=\"#111\" id=\"sb3-addInput\"></path><path d=\"M4 0L4 8L0 4Z\" fill=\"#111\" id=\"sb3-delInput\"></path><g id=\"sb3-list\"><rect x=\"0\" y=\"0\" width=\"15\" height=\"18\" fill=\"#fff\"></rect><rect x=\"1\" y=\"1\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect><rect x=\"1\" y=\"7\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect><rect x=\"1\" y=\"13\" width=\"13\" height=\"4\" fill=\"#ff920f\"></rect></g><image id=\"sb3-microbitBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACmlBMVEUAAAArKysrIB8lJCNBRlY2O0U9X48sKCvOoBQzKzMnJyfrswi/xdDRoxN2dnbToxPosgnmsAq/lxo6MSq0kCLOoRXKnhbEmhc7LRooJCTcqQ7OoBXstAjpsgi9lhuvjCCPdSd4Zyg2NjZMi+Slhyq8lR5CR1fZqBG+lh3ttQjFnBnLnhbDmhqZore3kh5ARlW2kR6qiCGcfyU6QEtyYyd4ZSDSoxOGdDedgizLnhfgrA25kx9YXWqbgCxMUWDfqwzcqg/VphBBR1ecpLmcgSzHmxijq77BmRprYkOOlKZARlVGdbabo7m3kRxGcrKwjB9ARVSIjaCZobuVeyahgh+VdyE8XIOLayBIOydBR1f/vwBMl//m5+g+Q1JlanY6P0uCiJjj5OU9QVBARVQ/RFP9vgBFZpjk5ebwtgbzuAR0eotARlZITl3d3+KNlKRQVmRNUmGxs7mRlJtUW2nLnhfInRfpsQn1uQS/wsa0t7qlp62doKeKjpeBg41YXmxCSlvGyMtHb6xCUGlCTGBJgdJDSFVobXlMlPhLhtq/wchIesFGbqpDVXRXXGxCTGNiXEe+lh1LjuzP0dRJg9RIfslJfMW9v8RGbKRFY5Jzd4NdYm88QE1+bjrQpCHQohTxtwVLkPDa3OHd3t9If826vMCusLZHcrGIj6F6gpaDho9ESlpITFOQeTLcqhnEmhnqsw34uwVKkfNNhdi6vMRLUWBPUFC7lzDWpx31uQjutQj6vAP5+frZ29zZ2dvW2NtHc7JGbKVFaJx/hpl/hpdxd4hzd4JDWHpDUm5UWWiZhEh3aT6WfC/EnSqtiyW/lxzBmRpKi+VQgMhRermqq7BSdrCLjpVEXYVEW4A/SFtOT1BaV0pxZUCpjT2xkTcYNOUYAAAAWXRSTlMADBgV5DRLEdcIE+3Z2QLt6unOI/zp1dEcDf7z7eu9qVtFBPv7+/fx7u3p3NnOzcq0lXZENzD6+fj39vTm5uXk4t3c2tbS0c/NvrCopKKcm4yLbGpiTUA3JzDAPbYAAAQqSURBVFjD7dX1fxJhHMDxE+MIRRFrdnd3d3fr9ziwhsVsmC2K6HRTtzlb0ens2uzu7m79X3z4HufdwTNvj/qbfPYaPDe+vMf23AEXL168/6bBTfoWx5r0GskxVMhsoDfg3Lb12LlzIwz0zKZYzzy0lkPVKtXdutXw++o2a5UQ7SUMcqibGpA8kD09slX0azRkazwISB5Inn4D+ShwrNYjIHpQQA96mqPAYlqPgOhBAT0oUpgGyh6C6EHYWz11e7jbO9hAxUMQPezR6+wtW0nBlJzV7CB62nIyN/mB5H/ouM0G0j3ITIXsAMDUVMjcygbSPQgqrzCNDaR7sCEzO2cLKSvlLNP/ED1qgbRbh0m37viBAUSPvU/BYFZWcAMFRI+9HW/fOFLSgAaixw6erZWS5qeBVG+XKwlghWsuwALXHIA5rgUAc10r1KADvViwKNDaLO4EWCQuA5gnLgVYKs4DWCYuUoPoFRhcKa4FWCwuB1gizgeYLy4BWC4uBqWPq9Cjg55EJ5bogUi7J0wBmDwhMXzjBHBOmAyQSG4wnPd4cJ4Kejbem4gdTQL9NPN00Hlk0jRs//0p+puinaeDs0XxwMFtk8RZM6fob4pmPl/wxtqkOcemIai7Kco8HTx/88Ns8dBxgMcrEdTfFKcyP/9m1xhwwbV30sBGCdTPqczPu9Y5BoTzZODAg6S5kT9Zf1PU8+fz25TrTJuizOd32kjtL9CmaOfpJ/Zd5UTV3RTtfP6X3mfl0tNNuVSpILYp5xHL25ccFUQv9cwGhrcvPZB4jgiovyn6IHrrZFB/U/RBf6rD8f4sgqzRwTtZQfKZGPiXm4Kxb8rff6awgf9sU5jTB9O79G63BqTW1C5baQ9geNSwvnIEJ8s2PCkPXqhTtlM6HUxvWpiv3h6kyozmDY2egnzUkjc3/3X0bAjPt3gW+VWVxvFtSn6hgi9acxzfeI001yiBs46pI7/AkjzHVSgjg5XIkwvXB+xbcxNnGraHCmZUr8nxJS/g3AlC1KzujQgnOpo5axufDFasYLUa2gK2p2ohzlTtJB2sV6NCNSECCtUq1Kj3CxSq2luXlY8gufF4e9PkCLiwpWFULg38+qKiILgFYe9Lr++07zSur4SXr7zeV5Gj0z5vxt69GVcFt1vI874kS6/0pDIZsWB6crLgzhNI+wRhOrm7Sr5n4HIhWeW5yRJ/EBYuS4+5yUN5Vy9fuewT6GDouQq8qAFDITX4/XmuDF788eTJRQpoD4PTT6nAXA14KVcNhshgBDx16VTokk9oZo4Czf0JiEkgpoCYApJkEPMJwxOiQFONDn8DlrRbuWjRXrWEzWKzlOhnLNfHWN5S2Va5cndjufLG8uWMpRs0sFmqdMNliRKlS1nIlw2Xxh5kWaVKC0NNLiarqdAfZ+LixYsX77f9BFJt17cXqnnkAAAAAElFTkSuQmCC\"></image><g id=\"sb3-wedoBlock\" fill=\"none\"><path d=\"M23.513 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M24.91 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M9.54 11.17h-.728c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479\" fill=\"#7C87A5\"></path><path d=\"M10.938 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479z\"></path><path d=\"M26.305 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M27.702 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M29.101 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M30.498 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M17.925 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M19.322 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M20.717 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M22.114 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M15.129 11.17H14.4c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M16.526 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M12.335 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.882v-1.08c0-.265-.26-.479-.577-.479\" fill=\"#7C87A5\"></path><path d=\"M13.732 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M31.893 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M33.29 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z\"></path><path d=\"M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992\" fill=\"#FFF\"></path><path d=\"M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" fill=\"#FFF\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z\" fill=\"#4C97FF\"></path><path d=\"M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z\" stroke=\"#3D79CC\" stroke-width=\".893\"></path><path stroke=\"#7C87A5\" stroke-width=\".893\" d=\"M4.47 20.474h27.961l2.157 2.974\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z\"></path><path d=\"M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479\" fill=\"#7C87A5\"></path><path d=\"M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479z\"></path><path d=\"M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479\" fill=\"#7C87A5\"></path><path d=\"M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z\"></path><path d=\"M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993\" fill=\"#E6E7E8\"></path><path d=\"M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z\" fill=\"#E6E7E8\"></path><path d=\"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z\" stroke=\"#7C87A5\" stroke-width=\".893\"></path><path fill=\"#E6E7E8\" d=\"M19.53 24.438h11.294V20.47H19.529z\"></path><path stroke=\"#7C87A5\" stroke-width=\".893\" d=\"M19.53 24.438h11.294V20.47H19.529zm12.902-3.964l2.157-2.794\"></path></g><g transform=\"translate(5.5 3.5)\" id=\"sb3-ev3Block\"><rect stroke=\"#7C87A5\" fill=\"#FFF\" x=\".5\" y=\"3.59\" width=\"28\" height=\"25.81\" rx=\"1\"></rect><rect stroke=\"#7C87A5\" fill=\"#E6E7E8\" x=\"2.5\" y=\".5\" width=\"24\" height=\"32\" rx=\"1\"></rect><path stroke=\"#7C87A5\" fill=\"#FFF\" d=\"M2.5 14.5h24v13h-24z\"></path><path d=\"M14.5 10.5v4\" stroke=\"#7C87A5\" fill=\"#E6E7E8\"></path><rect fill=\"#414757\" x=\"4.5\" y=\"2.5\" width=\"20\" height=\"10\" rx=\"1\"></rect><rect fill=\"#7C87A5\" opacity=\".5\" x=\"13.5\" y=\"20.13\" width=\"2\" height=\"2\" rx=\".5\"></rect><path d=\"M9.06 20.13h1.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1.5a1 1 0 0 1 0-2zM19.93 22.13h-1.51a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1.5a1 1 0 0 1 .01 2zM8.23 17.5H5a.5.5 0 0 1-.5-.5v-2.5h6l-1.85 2.78a.51.51 0 0 1-.42.22zM18.15 18.85l-.5.5a.49.49 0 0 0-.15.36V20a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-.29a.49.49 0 0 0-.15-.36l-.5-.5a.51.51 0 0 1 0-.71l1.51-1.49a.47.47 0 0 1 .35-.15h3.58a.47.47 0 0 1 .35.15l1.51 1.49a.51.51 0 0 1 0 .71zM10.85 23.45l.5-.5a.49.49 0 0 0 .15-.36v-.29a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.29a.49.49 0 0 0 .15.36l.5.5a.5.5 0 0 1 0 .7l-1.51 1.5a.47.47 0 0 1-.35.15h-3.58a.47.47 0 0 1-.35-.15l-1.51-1.5a.5.5 0 0 1 0-.7z\" fill=\"#7C87A5\" opacity=\".5\"></path><path d=\"M21.5 27.5h5v4a1 1 0 0 1-1 1h-4v-5z\" stroke=\"#CC4C23\" fill=\"#F15A29\"></path></g><g id=\"sb3-makeymakeyBlock\" fill=\"none\"><path d=\"M35 28H5a1 1 0 0 1-1-1V12c0-.6.4-1 1-1h30c.5 0 1 .4 1 1v15c0 .5-.5 1-1 1z\" fill=\"#fff\"></path><path fill=\"red\" d=\"M4 25h32v2.7H4zm9-1h-2.2a1 1 0 0 1-1-1v-9.7c0-.6.4-1 1-1H13c.6 0 1 .4 1 1V23c0 .6-.5 1-1 1z\"></path><path fill=\"red\" d=\"M6.1 19.3v-2.2c0-.5.4-1 1-1h9.7c.5 0 1 .5 1 1v2.2c0 .5-.5 1-1 1H7.1a1 1 0 0 1-1-1z\"></path><circle fill=\"red\" cx=\"22.8\" cy=\"18.2\" r=\"3.4\"></circle><circle fill=\"red\" cx=\"30.6\" cy=\"18.2\" r=\"3.4\"></circle><path fill=\"red\" d=\"M4.2 27h31.9v.7H4.2z\"></path><circle fill=\"#e0e0e0\" cx=\"22.8\" cy=\"18.2\" r=\"2.3\"></circle><circle fill=\"#e0e0e0\" cx=\"30.6\" cy=\"18.2\" r=\"2.3\"></circle><path fill=\"#e0e0e0\" d=\"M12.5 22.9h-1.2c-.3 0-.5-.2-.5-.5V14c0-.3.2-.5.5-.5h1.2c.3 0 .5.2.5.5v8.4c0 .3-.2.5-.5.5z\"></path><path fill=\"#e0e0e0\" d=\"M7.2 18.7v-1.2c0-.3.2-.5.5-.5h8.4c.3 0 .5.2.5.5v1.2c0 .3-.2.5-.5.5H7.7c-.3 0-.5-.2-.5-.5zM4 26h32v2H4z\"></path><path stroke=\"#666\" stroke-width=\".5\" d=\"M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z\"></path><path stroke=\"#666\" stroke-width=\".5\" d=\"M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z\"></path></g><image id=\"sb3-gdxforBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAABAlBMVEUAAAABAQEAAAB9h6YAAAAAAAAAAAB8iKZ7iKaAjKvm5+h+iqhcXFxGR0d8iKbj5OV9iKZ8h6be3+Db3d19h6acnJ0AAAB7nrDh4uPh4uN9iabZ2tt9iKbX19nJycnExsZ8iKe+wMC7vL2Eka/g4ePU1dV8iKZ9iKZ9iKd+iKitra2RkZGLjo5wcHCLi7l0oqJV//9csdZ8h6WFkq//vwDm5+iEka79vgJ6iql9iaaHk6tgq9Btm71+iadmo8dzk7OCj6yAjKp/iqhiqc1qnsB4jKtgrNFwl7d1tLTgtCxpocN0krJ2j65ossWNtZSbt4LAulHWsDnasTTuvhXzvg9zk7TzqAfaAAAAMXRSTlMAJiLoFBwI8q4a+0c4M/nr3tnQwKxYDAnk2726tbGMh4J9dinXq56ddG9nT01ACwsDk/+seAAAAidJREFUWMPt2Olu2kAUhuE5NvuaBAhZm7TpvufgMXaBbmAghOzp/d9KD7RW6yaqPeL7YVV9/471aBgfCXnUH7ULNhtkF96qv1dgwwoxoM08cDsJcwfMdgwonoiJPRFjQXkscQM3Adhxk4NuJwkoDx0nSp5NDTiae958NEaBwzkvC4YYcOxx7fCoeJhnrwcBv7H9TklFm08R4JD5SEkiMg8B4IjXwsV1HgHAPu+EizsQcMbr2B0OufZz7X0NcIZSwC9+rD3nADI2/fCtrHEfAvZ8Liqp6PuIwZZO+ZmSnspcY8AZ55WU5xkElDwuK1Vm7xgFTjhfLud5AgPHAUvBGARKvYnnTXpp/gvAg9PLyykSPLt1nNszIHjuSOdAcNp1nO4UeYYXNzcX0UH62P+0AnjH8lgCgL8s/+uXzwZgrOV2JAMwxpIMwRjLHIyxzMEYyxyMWgAwYiHAzm99iLQ6eOJEul4d7Ea6WhG8W7rAE+fertHgVXp+clpB9Oet64M/wH2TKwI/FrRFTH6JIZ6NvmZpxoDtptlFULOtzGPWy+4/r//gvwKGgcC90NtTqIg2dIuyClaWDvTjKlDMLba4UaUMcIuVbd0gyiGwjGVlFuKWfkQZhEfSQnypd8mCvOHGvkA5quo6EQSs6yrlNumN3obs0KKGHJ70QD+hLOQMW7r0sFI5KJVeY+bGkr1JopKlEG0StXbrW/uvQGMookXLLPFAZYTMJju/7z6rRW1MZcnIAAAAAElFTkSuQmCC\"></image><image id=\"sb3-boostBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQBAMAAAB8P++eAAAAKlBMVEUAAAD///98h6Xm5+iVnrb/Zhq+w9L5hk73+Pnf4eSQmbLr7Ozo39vp184hSCf6AAAAAXRSTlMAQObYZgAAAOFJREFUSMftlDEOgjAUhonhAi1sLvIk7NDJDTYu0LhzBzcXruHoDTyFB/BCNi30KU3InzioSb++hAS+vPfKa5pEIpHvk7a8gpf8ISWINtlg4i7ZFOKVTBlqsUR+ItYZJG7VzQQgMqGYd7zWRArpULEAe5Q/J9JMj4rluC7uleNw7TFRXcoREDnlinjX57eUsvRTn8+AE0/6OKV0g5buYTTyWFFr/XAp3aDzed4yFJWnKbhPbtaXXohDNYlDJWz4zSxEokkkEjb496AiVtqAbIYgYNGWBmhgES+NX6SRSORfeAJMWajr95DdqQAAAABJRU5ErkJggg==\"></image><g id=\"sb3-dropdownArrow\" transform=\"scale(0.94413847364)\"><path d=\"M12.71 2.44A2.41 2.41 0 0 1 12 4.16L8.08 8.08a2.45 2.45 0 0 1-3.45 0L.72 4.16A2.42 2.42 0 0 1 0 2.44 2.48 2.48 0 0 1 .71.71C1 .47 1.43 0 6.36 0s5.39.46 5.64.71a2.44 2.44 0 0 1 .71 1.73z\" fill=\"#231f20\" opacity=\".1\"></path><path d=\"M6.36 7.79a1.43 1.43 0 0 1-1-.42L1.42 3.45a1.44 1.44 0 0 1 0-2c.56-.56 9.31-.56 9.87 0a1.44 1.44 0 0 1 0 2L7.37 7.37a1.43 1.43 0 0 1-1.01.42z\" fill=\"#fff\"></path></g><g id=\"sb3-turnRight\"><path d=\"M22.68 12.2a1.6 1.6 0 0 1-1.27.63h-7.69a1.59 1.59 0 0 1-1.16-2.58l1.12-1.41a4.82 4.82 0 0 0-3.14-.77 4.31 4.31 0 0 0-2 .8A4.25 4.25 0 0 0 7.2 10.6a5.06 5.06 0 0 0 .54 4.62A5.58 5.58 0 0 0 12 17.74a2.26 2.26 0 0 1-.16 4.52A10.25 10.25 0 0 1 3.74 18a10.14 10.14 0 0 1-1.49-9.22 9.7 9.7 0 0 1 2.83-4.14A9.92 9.92 0 0 1 9.66 2.5a10.66 10.66 0 0 1 7.72 1.68l1.08-1.35a1.57 1.57 0 0 1 1.24-.6 1.6 1.6 0 0 1 1.54 1.21l1.7 7.37a1.57 1.57 0 0 1-.26 1.39z\" fill=\"#3d79cc\"></path><path d=\"M21.38 11.83h-7.61a.59.59 0 0 1-.43-1l1.75-2.19a5.9 5.9 0 0 0-4.7-1.58 5.07 5.07 0 0 0-4.11 3.17A6 6 0 0 0 7 15.77a6.51 6.51 0 0 0 5 2.92 1.31 1.31 0 0 1-.08 2.62 9.3 9.3 0 0 1-7.35-3.82 9.16 9.16 0 0 1-1.4-8.37A8.51 8.51 0 0 1 5.71 5.4a8.76 8.76 0 0 1 4.11-1.92 9.71 9.71 0 0 1 7.75 2.07l1.67-2.1a.59.59 0 0 1 1 .21L22 11.08a.59.59 0 0 1-.62.75z\" fill=\"#fff\"></path></g><g id=\"sb3-turnLeft\"><path d=\"M20.34 18.21a10.24 10.24 0 0 1-8.1 4.22 2.26 2.26 0 0 1-.16-4.52 5.58 5.58 0 0 0 4.25-2.53 5.06 5.06 0 0 0 .54-4.62A4.25 4.25 0 0 0 15.55 9a4.31 4.31 0 0 0-2-.8 4.82 4.82 0 0 0-3.15.8l1.12 1.41A1.59 1.59 0 0 1 10.36 13H2.67a1.56 1.56 0 0 1-1.26-.63A1.54 1.54 0 0 1 1.13 11l1.72-7.43A1.59 1.59 0 0 1 4.38 2.4a1.57 1.57 0 0 1 1.24.6L6.7 4.35a10.66 10.66 0 0 1 7.72-1.68A9.88 9.88 0 0 1 19 4.81 9.61 9.61 0 0 1 21.83 9a10.08 10.08 0 0 1-1.49 9.21z\" fill=\"#3d79cc\"></path><path d=\"M19.56 17.65a9.29 9.29 0 0 1-7.35 3.83 1.31 1.31 0 0 1-.08-2.62 6.53 6.53 0 0 0 5-2.92 6.05 6.05 0 0 0 .67-5.51 5.32 5.32 0 0 0-1.64-2.16 5.21 5.21 0 0 0-2.48-1A5.86 5.86 0 0 0 9 8.84L10.74 11a.59.59 0 0 1-.43 1H2.7a.6.6 0 0 1-.6-.75l1.71-7.42a.59.59 0 0 1 1-.21l1.67 2.1a9.71 9.71 0 0 1 7.75-2.07 8.84 8.84 0 0 1 4.12 1.92 8.68 8.68 0 0 1 2.54 3.72 9.14 9.14 0 0 1-1.33 8.36z\" fill=\"#fff\"></path></g><g id=\"sb3-loopArrow\"><path d=\"M23.3 11c-.3.6-.9 1-1.5 1h-1.6c-.1 1.3-.5 2.5-1.1 3.6-.9 1.7-2.3 3.2-4.1 4.1-1.7.9-3.6 1.2-5.5.9-1.8-.3-3.5-1.1-4.9-2.3-.7-.7-.7-1.9 0-2.6.6-.6 1.6-.7 2.3-.2H7c.9.6 1.9.9 2.9.9s1.9-.3 2.7-.9c1.1-.8 1.8-2.1 1.8-3.5h-1.5c-.9 0-1.7-.7-1.7-1.7 0-.4.2-.9.5-1.2l4.4-4.4c.7-.6 1.7-.6 2.4 0L23 9.2c.5.5.6 1.2.3 1.8z\" fill=\"#cf8b17\"></path><path d=\"M21.8 11h-2.6c0 1.5-.3 2.9-1 4.2-.8 1.6-2.1 2.8-3.7 3.6-1.5.8-3.3 1.1-4.9.8-1.6-.2-3.2-1-4.4-2.1-.4-.3-.4-.9-.1-1.2.3-.4.9-.4 1.2-.1 1 .7 2.2 1.1 3.4 1.1s2.3-.3 3.3-1c.9-.6 1.6-1.5 2-2.6.3-.9.4-1.8.2-2.8h-2.4c-.4 0-.7-.3-.7-.7 0-.2.1-.3.2-.4l4.4-4.4c.3-.3.7-.3.9 0L22 9.8c.3.3.4.6.3.9s-.3.3-.5.3z\" fill=\"#fff\"></path></g><g id=\"sb3-musicBlock\" fill=\"none\"><path d=\"M28.456 21.675c-.009-.312-.087-.825-.256-1.702-.096-.495-.612-3.022-.753-3.73-.395-1.98-.76-3.92-1.142-6.113-.732-4.223-.693-6.05.344-6.527.502-.23 1.06-.081 1.842.35.413.227 2.181 1.365 2.07 1.296 1.993 1.243 3.463 1.775 4.928 1.549 1.527-.237 2.505-.06 2.877.618.348.635.015 1.416-.729 2.18-1.473 1.516-3.976 2.514-5.849 2.023-.822-.218-1.238-.464-2.38-1.266a9.737 9.737 0 0 0-.095-.066c.047.593.264 1.74.717 3.803.294 1.336 2.079 9.187 2.637 11.674l.002.012c.529 2.637-1.872 4.724-5.235 4.724-3.29 0-6.363-1.988-6.862-4.528-.53-2.64 1.873-4.734 5.233-4.734a8.411 8.411 0 0 1 2.65.437zM11.46 27.666c-.01-.319-.091-.84-.266-1.738-.09-.46-.595-2.937-.753-3.727-.39-1.96-.752-3.892-1.131-6.07-.732-4.224-.692-6.052.344-6.527.502-.23 1.06-.082 1.841.349.414.228 2.181 1.365 2.07 1.296 1.992 1.243 3.461 1.775 4.925 1.549 1.525-.24 2.504-.064 2.876.614.348.635.015 1.415-.728 2.18-1.474 1.517-3.977 2.513-5.847 2.017-.822-.218-1.237-.463-2.38-1.266a9.729 9.729 0 0 0-.094-.065c.047.593.264 1.74.717 3.802.294 1.337 2.078 9.19 2.636 11.675l.003.013c.517 2.638-1.884 4.732-5.234 4.732-3.286 0-6.359-1.993-6.87-4.54-.518-2.639 1.885-4.73 5.242-4.73.904 0 1.802.15 2.65.436z\" stroke=\"#000\" stroke-opacity=\".1\"></path><path d=\"M32.18 25.874C32.636 28.157 30.512 30 27.433 30c-3.07 0-5.923-1.843-6.372-4.126-.458-2.285 1.665-4.136 4.743-4.136.647 0 1.283.084 1.89.234a7 7 0 0 1 .938.302c.87-.02-.104-2.294-1.835-12.229-2.134-12.303 3.06-1.87 8.768-2.753 5.708-.885.076 4.82-3.65 3.844-3.724-.987-4.65-7.153.263 14.738zm-16.998 5.99C15.63 34.148 13.507 36 10.439 36c-3.068 0-5.92-1.852-6.379-4.136-.448-2.284 1.674-4.135 4.751-4.135 1.002 0 1.974.197 2.854.544.822-.055-.15-2.377-1.862-12.228-2.133-12.303 3.059-1.87 8.764-2.753 5.706-.894.076 4.821-3.648 3.834-3.723-.987-4.648-7.152.263 14.738z\" fill=\"#FFF\"></path></g><g id=\"sb3-penBlock\" stroke=\"#575E75\" fill=\"none\" stroke-linejoin=\"round\"><path d=\"M8.753 34.602l-4.251 1.779 1.784-4.236c1.218-2.892 2.907-5.423 5.03-7.538L31.066 4.93c.846-.842 2.65-.41 4.032.967 1.38 1.375 1.816 3.173.97 4.015L16.318 29.59c-2.123 2.116-4.664 3.799-7.565 5.012\" fill=\"#FFF\"></path><path d=\"M29.41 6.111s-4.45-2.379-8.202 5.771c-1.734 3.766-4.35 1.546-4.35 1.546\"></path><path d=\"M36.42 8.825c0 .463-.14.873-.432 1.164l-9.335 9.301c.282-.29.41-.668.41-1.12 0-.874-.507-1.963-1.406-2.868-1.362-1.358-3.147-1.8-4.002-.99L30.99 5.01c.844-.84 2.65-.41 4.035.96.898.904 1.396 1.982 1.396 2.855M10.515 33.774a23.74 23.74 0 0 1-1.764.83L4.5 36.382l1.786-4.235c.258-.604.529-1.186.833-1.757.69.183 1.449.625 2.109 1.282.659.658 1.102 1.412 1.287 2.102\" fill=\"#4C97FF\"></path><path d=\"M36.498 8.748c0 .464-.141.874-.433 1.165l-19.742 19.68c-2.131 2.111-4.673 3.793-7.572 5.01L4.5 36.381l.974-2.317 1.925-.808c2.899-1.218 5.441-2.899 7.572-5.01l19.742-19.68c.292-.292.432-.702.432-1.165 0-.647-.27-1.4-.779-2.123.249.172.498.377.736.614.898.905 1.396 1.983 1.396 2.856\" fill=\"#575E75\" opacity=\".15\"></path><path d=\"M18.45 12.831a.904.904 0 1 1-1.807 0 .904.904 0 0 1 1.807 0z\" fill=\"#575E75\"></path></g><g id=\"sb3-videoBlock\" stroke=\"#000\" fill=\"#FFF\" stroke-opacity=\"0.15\"><circle opacity=\"0.25\" cx=\"32\" cy=\"16\" r=\"4.5\"></circle><circle opacity=\"0.5\" cx=\"32\" cy=\"12\" r=\"4.5\"></circle><circle opacity=\"0.75\" cx=\"32\" cy=\"8\" r=\"4.5\"></circle><circle cx=\"32\" cy=\"4\" r=\"4.5\"></circle><path d=\"M22.672 4.42l-6.172 4V6.1c0-2.01-1.563-3.6-3.5-3.6H4.1C2.076 2.5.5 4.076.5 6.1V14c0 1.927 1.584 3.512 3.6 3.6H13c1.902 0 3.5-1.653 3.5-3.6v-2.283l6.257 3.754.097.075c.02.02.098.054.146.054.267 0 .5-.217.5-.5V4.8c0 .037-.056-.094-.129-.243-.145-.242-.43-.299-.7-.137z\" fill=\"#4D4D4D\" stroke-linejoin=\"round\"></path></g><g id=\"sb3-faceSensingBlock\" transform=\"scale(1.67785234899 1.67785234899)\"><circle cx=\"8.35\" cy=\"9.65\" r=\"0.97\" fill=\"#FFF\"></circle><circle cx=\"14.19\" cy=\"9.65\" r=\"0.97\" fill=\"#FFF\"></circle><path d=\"M11.27 4.14c-3.94 0-7.13 3.19-7.13 7.13s3.19 7.13 7.13 7.13 7.13-3.19 7.13-7.13-3.19-7.13-7.13-7.13m0 1.3c3.22 0 5.84 2.61 5.84 5.84s-2.61 5.84-5.84 5.84-5.84-2.61-5.84-5.84 2.61-5.84 5.84-5.84\" fill=\"#FFF\"></path><path d=\"M17.57 13.88c.57-.15 1.02-.6 1.17-1.17l.35-1.3c.16-.61 1.04-.61 1.2 0l.35 1.3c.15.57.6 1.02 1.18 1.17l1.3.35c.61.16.61 1.04 0 1.2l-1.3.35c-.57.15-1.02.6-1.18 1.17l-.35 1.3c-.17.62-1.04.62-1.2 0l-.35-1.3c-.15-.57-.6-1.02-1.17-1.17l-1.3-.35c-.61-.17-.61-1.04 0-1.2l1.3-.35Zm-16-11.43c.43-.12.76-.45.88-.88l.26-.98c.12-.46.78-.46.9 0l.26.98c.12.43.45.76.88.88l.98.26c.46.12.46.78 0 .9l-.98.26c-.43.11-.77.45-.88.88l-.26.98c-.12.46-.78.46-.9 0l-.26-.98a1.26 1.26 0 0 0-.88-.88l-.98-.26c-.46-.12-.46-.78 0-.9z\" fill=\"#ffbf00\" fill-rule=\"evenodd\" stroke=\"#0b8e69\" stroke-miterlimit=\"2\" stroke-width=\".5\"></path><path d=\"M12.68 12.53c.2-.3.6-.38.9-.18s.38.6.18.9c-.56.83-1.41 1.26-2.48 1.26s-1.93-.43-2.48-1.26c-.2-.3-.12-.7.18-.9s.7-.12.9.18c.31.46.75.68 1.41.68s1.1-.22 1.41-.68Z\" fill=\"#FFF\"></path><path d=\"M20.89 6.06a.57.57 0 0 1-.57-.57V2.2h-3.31c-.31 0-.57-.25-.57-.57s.25-.57.57-.57h3.88c.31 0 .57.25.57.57v3.86c0 .31-.25.57-.57.57M5.44 21.46H1.59a.57.57 0 0 1-.57-.57v-3.82c0-.31.25-.57.57-.57s.57.25.57.57v3.25h3.28c.31 0 .57.25.57.57s-.25.57-.57.57\" fill=\"#0b8e69\"></path></g><g id=\"sb3-ttsBlock\" stroke=\"#000\" stroke-opacity=\"0.15\"><path d=\"M25.644 20.5c-1.667 1.937-4.539 3.429-5.977 3.429a1.25 1.25 0 0 1-.557-.137c-.372-.186-.61-.542-.61-1.03 0-.105.017-.207.05-.308.076-.236.624-.986.727-1.173.27-.484.462-1.075.566-1.865A8.5 8.5 0 0 1 24 3.5h4a8.5 8.5 0 1 1 0 17h-2.356z\" fill=\"#FFF\"></path><path d=\"M15.5 21.67c0-1.016-1.494-1.586-2.387-.782l-2.7 2.163A5.958 5.958 0 0 1 6.7 24.33h-.4c-1.035 0-1.8.69-1.8 1.573v4.235c0 .883.765 1.572 1.8 1.572h.4c1.458 0 2.754.423 3.82 1.287l2.598 2.161c.908.75 2.382.188 2.382-.876V21.67z\" fill=\"#4D4D4D\"></path></g><image id=\"sb3-translateBlock\" width=\"40px\" height=\"40px\" href=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAA21BMVEUAAAAAAAAAAAAAAADS0tIAAABHR0cAAADX19cAAAAAAACkpKRqamq2traurq6WlpbV1dWEhITHx8fPz8/Ly8vDw8O9vb0AAABMTEz////Z2dlXXnVMl//g4ODu7u7m5ub4+PhPmf/x8fH09PT6+vri4uNRmv/r6+1uqv/0+P9Ynv/p8v+rrrphZ33S5f+51v9ho/+1uMKBhpfH3v+Wmqhrcoacxf+Pvv/KzNSgpLGLkKDd6/+rzf9npv/AwsuDtv98s/90rv9jpP9GieeOrtm5ubl2fI7Z4u56otk5hEFfAAAAGXRSTlMAJhgM1wYyHvIkEWpBhXhc5U+uybyhk0YvleQYgwAABDpJREFUWMPtmNl6mzAQhQMCBAYbvLX1GIwxi7e2TtosTdKk+/L+T1QBVoQtJHDby5yLROYTPzOagSM4e9az6oVUrDgKxh39//Bwb+QBkTZ2VL3hypYilKWicpY6gmWcTCbxIoSh0xHjOkZXA4m0rlGcrcBsslcSmrYq4qm2GczmE6Hms6A8W4GQHZ1BTxXweuTCErGz1TEEaTpLymML6HVq87VhIWPRs21yNu679guNXn9hOnWVMUwanzxG0yCTdYQQts195umwJmnUDSatFHQRPaVvljkl4CAuRlWrCfD9uiZEbR+ObrnjfRDhwHUtdAi0gK/vLtts+VqDVfIMjZSmLEycBuD1D4kK8MHc+Ju3/FFQaHdXc4rBU/8NiCE+OJyAIQKuz32qjA7O1xzwqMtiUETAXeRzinZcyoPgsPpDcco3q9WD729WhTI/e1itbriUzwwtqPI0Q5et4ZoA6SDj1pCWOeB44qJ88aOiIB8j/xMH5IiUJwG+jfyHPMCNH20FQEpkPGnbnBeFuI78Fd82VWJCeTyQCzHb3pMCb8VAQhxBCkPKkzf2Z9J9mR9dCxqb3tBO17EoTw4ky0f0VXSnUCGE6LDp1tvlwK0cyNQMJA1DlL3Px8TenvTjpcAN5cD7VVSsoR992c4oS+aGcuDbzxFBfVqvv5L/375DCzeUAXfnOW5TJHudffvdzg3FwPdZvnbX6/LXr+9t3ZCzAAaMNh/X9BdAWzcUm9T2vnrpk91QbqOhLEDeDZuNHkBSX94Nm7ciAJOWAkW8WZIDl1MikAD57ZwceJsDL0VAfsPJwgzzO5cHvsmBb2IJkAlhB5InntlXlJcc8MO00GMzsHTbsMJDdU+hOxIeCfKuXYQu7ZJ5oDmExwPjfAEvyZ9lGyDW9tOWMH6l1z4nLwjrQ572RRugAvMS57mq4MH7czq9Kgpz1QZoDcI4DsHrWUjw4E1JbLeTSZ5z2gLYMTTwBnaOEwBvS1Ke86UUyF7isKpLrIHkSvVGBORdUQx8nFb0KAUy38aSCO8I510hMrhrBOrGEFIYGToPZM+Fn+XwiraiAMh2Uwnb+3DAC9Z/t3TIA2W7MwZkYbH+uZIC+f0jD3z9+vXF05hIAJTtcK3TLIDnMSLnhqeZlDo8eksYqH/3UskWPz7aCuDTX3urMiA5ejHCp7+YV4W9gxBnMFJP/XRwKNT3IEhLZpIGQMp86seNY6LlutRQgrFr6dLPLyELjm44eemIWt6C+JP0A1HffCIm4GDEw2jvpNTxbIwQ0kUTUYUYkgYTSXfMBU1Ee+G6fSwkOlpA/RFcJCR2erRHkllKSjNWhdd+NQbqkJrgunyPhKBIprpeiZyLZtEeCRNWQdlUZPU8yF1yYJ1J1HGGEC5iknS8pN0tRtoDDzTSNDLpqjMu2s4b9fBZg/TcJVHjrA7GSl/JZz7rWbX6A0ZzUfwVEqfrAAAAAElFTkSuQmCC\"></image></defs><g style=\"transform: scale(0.9)\"><g transform=\"translate(0 0)\"><g transform=\"translate(2 1)\"><path class=\"sb3-events\" d=\"M 0 16 c 25,-22 71,-22 96,0 L 114 16 a 4 4 0 0 1 4 4 L 118 60 a 4 4 0 0 1 -4 4 L 48 64 c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 L 4 64 a 4 4 0 0 1 -4 -4 Z\"></path><text class=\"sb3-label sb3-\" x=\"0\" y=\"13.1\" transform=\"translate(8 33)\">when</text><use href=\"#sb3-greenFlag\" transform=\"translate(40 28)\"></use><text class=\"sb3-label sb3-\" x=\"0\" y=\"13.1\" transform=\"translate(68 33)\">clicked</text></g><g transform=\"translate(2 65)\"><path class=\"sb3-motion\" d=\"M 0 4
      at Object.toContain (test/unit/community-blocks-compare.test.jsx:38:32)

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.2s)

_Thinking:_



_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "newString": "        expect(svgCount(wrapper)).toBe(2);\n        expect(wrapper.text()).toContain('Before');\n        expect(wrapper.text()).toContain('After');\n        expect(wrapper.html()).toMatch(/sb3?-diff/);",
  "oldString": "        expect(svgCount(wrapper)).toBe(2);\n        expect(wrapper.text()).toContain('Before');\n        expect(wrapper.text()).toContain('After');\n        expect(wrapper.html()).toContain('sb-diff');"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.3s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | grep -E \"✓|✕|Tests:\" | head",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
    ✓ renders before and after scripts side by side (112 ms)
    ✓ shows placeholders for added and removed scripts (45 ms)
Tests:       2 passed, 2 total

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.5s)

_Thinking:_



_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-diff-view.test.jsx",
  "newString": "    test('renders changed scripts as blocks', async () => {\n        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({\n            measureText: text => ({width: String(text).length * 6})\n        }));\n        const diff = [\n            'diff --mwp a/Sprite/main.fractch b/Sprite/main.fractch',\n            '--- a/Sprite/main.fractch',\n            '+++ b/Sprite/main.fractch',\n            '@@ -1,3 +1,3 @@',\n            ' when flag {',\n            '-  move 10;',\n            '+  move 20;',\n            ' }'\n        ].join('\\n');\n        const texts = {'Sprite/main.fractch': {\n            before: 'when flag {\\n  move 10;\\n}\\n',\n            after: 'when flag {\\n  move 20;\\n}\\n'\n        }};\n        const wrapper = mount(<DiffView diff={diff} fileTexts={texts} />);\n        for (let round = 0; round < 8; round++) await new Promise(resolve => setTimeout(resolve, 0));\n        wrapper.update();\n\n        expect(wrapper.text()).toContain('when green flag clicked');\n        expect(wrapper.html()).toMatch(/<svg/);\n        delete HTMLCanvasElement.prototype.getContext;\n        wrapper.unmount();\n    });",
  "oldString": "    test('sorts summary-only sprites before sprites with code changes', () => {"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.3s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-diff-view.test.jsx",
  "newString": "        delete HTMLCanvasElement.prototype.getContext;\n        wrapper.unmount();\n    });\n\n    test('sorts summary-only sprites before sprites with code changes', () => {",
  "oldString": "        delete HTMLCanvasElement.prototype.getContext;\n        wrapper.unmount();\n    });"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 12.3s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-diff-view.test.jsx 2>&1 | grep -E \"✓|✕|Tests:\" | head -20",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
    ✓ groups changes by file and counts changed lines (4 ms)
    ✓ classifies changed files into code, costumes, and sounds (1 ms)
    ✓ formats asset byte sizes (1 ms)
    ✓ shows source files on the code tab and assets as compact rows without a loader (22 ms)
    ✓ switches between code, costumes, and sounds tabs (66 ms)
    ✓ compares asset versions side by side with before and after sizes (46 ms)
    ✓ marks the missing side for added and removed assets (15 ms)
    ✓ filters by sprite and drops fully covered code cards (19 ms)
    ✓ counts summarized costumes and sounds in the tab badges (11 ms)
    ✓ renders extension changes with icons from the library (9 ms)
    ✓ renders changed scripts as blocks (75 ms)
    ✓ sorts summary-only sprites before sprites with code changes (8 ms)
    ✓ renders grouped change summaries above the code diff (5 ms)
    ✓ offers historical file links when a file opener is provided (3 ms)
    ✓ uses a plain status instead of a code panel for failed diffs (1 ms)
Tests:       15 passed, 15 total

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.6s)

_Thinking:_



_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "cat > /tmp/cos.mjs <<'EOF'\nimport {changedScripts} from '/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js';\nconst before = 'when timer > -1 at 48,64 {\\n  forever {\\n    say \"Hello!\" for 0.5;\\n  }\\n}\\n';\nconst after = 'when timer > -1 at 48,64 {\\n  forever {\\n  }\\n}\\n';\nfor (const m of changedScripts(before, after)) {\n  console.log('DESC:', m.desc);\n  console.log('BEFORE:\\n' + m.before);\n}\nEOF\nnode /tmp/cos.mjs 2>/dev/null",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 60000
}
```

**Output:**
```
(no output)
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.8s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "node /tmp/cos.mjs 2>&1 | head -20",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 60000
}
```

**Output:**
```
(node:57296) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /Users/sophie/mistwarp/scratch-gui/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 12.1s)

_Thinking:_

Diagnosing why changedScripts returned empty by identifying a signature comparison bug that ignores script bodies.

_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/src/community/scratchblocks-translate.js",
  "newString": "const stripLines = value => {\n    if (Array.isArray(value)) return value.map(stripLines);\n    if (value && typeof value === 'object') {\n        const out = {};\n        for (const [key, entry] of Object.entries(value)) {\n            if (key === 'line') continue;\n            out[key] = stripLines(entry);\n        }\n        return out;\n    }\n    return value;\n};\n\nconst stripBranches = value => {\n    if (Array.isArray(value)) return value.map(stripBranches);\n    if (value && typeof value === 'object') {\n        const out = {};\n        for (const [key, entry] of Object.entries(value)) {\n            if (key === 'line' || key === 'body') continue;\n            out[key] = stripBranches(entry);\n        }\n        return out;\n    }\n    return value;\n};",
  "oldString": "const stripVolatile = value => {\n    if (Array.isArray(value)) return value.map(stripVolatile);\n    if (value && typeof value === 'object') {\n        const out = {};\n        for (const [key, entry] of Object.entries(value)) {\n            if (key === 'line' || key === 'body') continue;\n            out[key] = stripVolatile(entry);\n        }\n        return out;\n    }\n    return value;\n};"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.3s)

**Tool: bash**

**Input:**
```json
{
  "command": "grep -n \"stripVolatile\\|scriptSignature\" src/community/scratchblocks-translate.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
437:const scriptSignature = script => JSON.stringify(stripVolatile(
472:        const changed = scriptSignature(beforeScript) !== scriptSignature(afterScript);
485:            const sig = JSON.stringify(stripVolatile(item.node));
493:            const sig = JSON.stringify(stripVolatile(item.node));

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.2s)

**Tool: bash**

**Input:**
```json
{
  "command": "python3 - <<'EOF'\np = 'src/community/scratchblocks-translate.js'\ns = open(p).read()\ns = s.replace(\"\"\"const scriptSignature = script => JSON.stringify(stripVolatile(\"\"\",\n\"\"\"const scriptSignature = script => JSON.stringify(stripLines(\"\"\")\ns = s.replace(\"\"\"            const sig = JSON.stringify(stripVolatile(item.node));\"\"\",\n\"\"\"            const sig = JSON.stringify(stripBranches(item.node));\"\"\")\nopen(p, 'w').write(s)\nprint('ok')\nEOF\ngrep -n \"stripVolatile\" src/community/scratchblocks-translate.js; node /tmp/cos.mjs 2>/dev/null",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 60000
}
```

**Output:**
```
ok
DESC: when [timer v] > (-1)
BEFORE:
when [timer v] > (-1)
forever
-   say [Hello!] for (0.5) seconds
end

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 11.0s)

_Thinking:_

Analyzing scratchblocks diff rendering for nested minus markers inside a forever loop and substack handling.

_Thinking:_



**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "newString": "    test('renders nested changed blocks with diff styling', async () => {\n        const wrapper = mount(\n            <BlocksCompare\n                before={'when [timer v] > (-1)\\nforever\\n-   say [Hello!] for (0.5) seconds\\nend'}\n                after={'when [timer v] > (-1)\\nforever\\nend'}\n            />\n        );\n        await flush();\n        wrapper.update();\n\n        expect(svgCount(wrapper)).toBe(2);\n        expect(wrapper.html()).toMatch(/sb3?-diff/);\n        wrapper.unmount();\n    });\n});",
  "oldString": "    test('shows placeholders for added and removed scripts', async () => {"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 5.5s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "newString": "        expect(wrapper.html()).toMatch(/sb3?-diff/);\n        wrapper.unmount();\n    });\n\n    test('shows placeholders for added and removed scripts', async () => {",
  "oldString": "        expect(wrapper.html()).toMatch(/sb3?-diff/);\n        wrapper.unmount();\n    });"
}
```

**Error:**
```
Found multiple matches for oldString. Provide more surrounding context to make the match unique.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 5.7s)

**Tool: bash**

**Input:**
```json
{
  "command": "grep -n \"shows placeholders\\|renders nested\\|renders before\" test/unit/community-blocks-compare.test.jsx; tail -8 test/unit/community-blocks-compare.test.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
25:    test('renders before and after scripts side by side', async () => {
42:    test('renders nested changed blocks with diff styling', async () => {
        const removed = mount(<BlocksCompare before={'when green flag clicked\n-say [hi]'} after={null} />);
        await flush();
        removed.update();
        expect(removed.text()).toContain('Removed in this commit.');
        expect(svgCount(removed)).toBe(1);
        removed.unmount();
    });
});

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 12.0s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx test/unit/community-scratchblocks-translate.test.js 2>&1 | grep -E \"✓|✕|Tests:\" | head -20",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
Tests:       9 passed, 9 total

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 9.4s)

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx 2>&1 | tail -12; grep -n \"test(\" test/unit/community-blocks-compare.test.jsx",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
      at sync (node_modules/gensync/index.js:89:14)
      at fn (node_modules/@babel/core/src/errors/rewrite-stack-trace.ts:99:14)
      at transformSync (node_modules/@babel/core/src/transform.ts:66:52)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        1.445 s
Ran all test suites matching /test\/unit\/community-blocks-compare.test.jsx/i.
25:    test('renders before and after scripts side by side', async () => {
42:    test('renders nested changed blocks with diff styling', async () => {

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.1s)

_Thinking:_



**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "offset": 42
}
```

**Output:**
```
<path>/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx</path>
<type>file</type>
<content>
42:     test('renders nested changed blocks with diff styling', async () => {
43:         const wrapper = mount(
44:             <BlocksCompare
45:                 before={'when [timer v] > (-1)\nforever\n-   say [Hello!] for (0.5) seconds\nend'}
46:                 after={'when [timer v] > (-1)\nforever\nend'}
47:             />
48:         );
49:         await flush();
50:         wrapper.update();
51: 
52:         expect(svgCount(wrapper)).toBe(2);
53:         expect(wrapper.html()).toMatch(/sb3?-diff/);
54:         wrapper.unmount();
55:     });
56: });
57:         const added = mount(<BlocksCompare before={null} after={'when green flag clicked\n+say [hi]'} />);
58:         await flush();
59:         added.update();
60:         expect(added.text()).toContain('New in this commit.');
61:         expect(svgCount(added)).toBe(1);
62:         added.unmount();
63: 
64:         const removed = mount(<BlocksCompare before={'when green flag clicked\n-say [hi]'} after={null} />);
65:         await flush();
66:         removed.update();
67:         expect(removed.text()).toContain('Removed in this commit.');
68:         expect(svgCount(removed)).toBe(1);
69:         removed.unmount();
70:     });
71: });

(End of file - total 71 lines)
</content>
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 5.5s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/sophie/mistwarp/scratch-gui/test/unit/community-blocks-compare.test.jsx",
  "newString": "        expect(svgCount(wrapper)).toBe(2);\n        expect(wrapper.html()).toMatch(/sb3?-diff/);\n        wrapper.unmount();\n    });\n\n    test('shows placeholders for added and removed scripts', async () => {\n        const added = mount(<BlocksCompare before={null} after={'when green flag clicked\\n+say [hi]'} />);",
  "oldString": "        expect(svgCount(wrapper)).toBe(2);\n        expect(wrapper.html()).toMatch(/sb3?-diff/);\n        wrapper.unmount();\n    });\n});\n        const added = mount(<BlocksCompare before={null} after={'when green flag clicked\\n+say [hi]'} />);"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 10.3s)

**Tool: bash**

**Input:**
```json
{
  "command": "npx jest test/unit/community-blocks-compare.test.jsx test/unit/community-scratchblocks-translate.test.js 2>&1 | grep -E \"✓|✕|Tests:\" | head -20",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 240000
}
```

**Output:**
```
Tests:       12 passed, 12 total

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 24.9s)

_Thinking:_



_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "npx eslint src/community/scratchblocks-translate.js src/community/components/BlocksCompare.jsx src/community/components/DiffView.jsx src/community/fractch-summary.js src/community/extension-meta.js src/community/commit-diff.js 2>&1 | tail -4 && npx jest test/unit/community-blocks-compare.test.jsx test/unit/community-scratchblocks-translate.test.js test/unit/community-extension-meta.test.js test/unit/community-fractch-summary.test.js test/unit/community-sprite-list.test.jsx test/unit/community-diff-view.test.jsx test/unit/community-commit-diff.test.js test/unit/community-commit-management.test.js test/unit/community-project-files.test.jsx test/unit/community-pull-request-performance.test.js test/unit/project-history.test.js 2>&1 | tail -6",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 300000
}
```

**Output:**
```

Test Suites: 11 passed, 11 total
Tests:       90 passed, 90 total
Snapshots:   0 total
Time:        10.471 s
Ran all test suites matching /test\/unit\/community-blocks-compare.test.jsx|test\/unit\/community-scratchblocks-translate.test.js|test\/unit\/community-extension-meta.test.js|test\/unit\/community-fractch-summary.test.js|test\/unit\/community-sprite-list.test.jsx|test\/unit\/community-diff-view.test.jsx|test\/unit\/community-commit-diff.test.js|test\/unit\/community-commit-management.test.js|test\/unit\/community-project-files.test.jsx|test\/unit\/community-pull-request-performance.test.js|test\/unit\/project-history.test.js/i.

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 6.7s)

_Thinking:_



**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Watcher rows: Eye / EyeOff icons by visibility",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Inspect scratchblocks API for diff/highlight support",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Translator fractch->scratchblocks + changed-script blocks view",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Tests + lint + full suite",
      "status": "completed",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Watcher rows: Eye / EyeOff icons by visibility",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Inspect scratchblocks API for diff/highlight support",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Translator fractch->scratchblocks + changed-script blocks view",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Tests + lint + full suite",
    "status": "completed",
    "priority": "medium"
  }
]
```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 7.9s)

There was no block diff because the blocks view didn't exist yet — only the translator did. That's now built, and your screenshot case is exactly what I verified it against.

How it works now, per sprite in the Code tab:
- **Changed scripts render as real Scratch blocks**, Before/After side by side. Removed lines get red strikethrough, added lines get the green glow — native scratchblocks `+`/`-` styling, plus the Before/After labels and sizes you asked for.
- Your `say "Hello!" for 0.5;` case renders as: Before pane with the say block struck through in red inside its `forever` loop, After pane with the empty loop. (Catching this exposed a real bug — removed statements inside branches were invisible to matching — fixed.)
- Whole added/removed scripts show single-pane with a "New/Removed in this commit" placeholder on the other side. Capped at 6 scripts per sprite with an overflow note, since remix diffs can touch dozens.
- Translation covers hats, motion/looks/sound/events/control/sensing/operators/data/pen, nesting, menus, variables, and custom blocks; anything unknown falls back to a readable line rather than crashing.

Also done in this pass: watcher rows use Eye for shown, EyeOff for hidden. Verification: 90/90 tests green across 11 suites, lint clean, and the translator output for your exact snippet renders without errors.

---

## User

./node_modules/scratchblocks/build/scratchblocks.min.es.js 10:64234
Module parse failed: Unexpected token (10:64234)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
|  */
| 
> const t={pen:"pen",video:"sensing",music:"sound"},e={...t,faceSensing:"faceSensing",tts:"tts",translate:"translate",microbit:"microbit",gdxfor:"gdxfor",wedo:"wedo",makeymakey:"makeymakey",ev3:"ev3",boost:"boost"},s={wedo2:"wedo",text2speech:"tts"};const i=["motion","looks","sound","variables","list","events","control","sensing","operators","custom","custom-arg","extension","grey","obsolete",...Object.keys(e),...Object.keys(s)],o=Object.assign(Object.create(null),{gray:"grey",other:"grey"}),r=["hat","cap","stack","boolean","reporter","ring","cat"],c=["ar","ckb","fa","he"],n=/%([0-9]+)/,a=/(%[a-zA-Z0-9](?:\.[a-zA-Z0-9]+)?)/,l=RegExp(a.source,"g"),h=/(@[a-zA-Z]+)/,p=RegExp(`${a.source}|${h.source}| +`,"g"),d=/^#(?:[0-9a-fA-F]{3}){1,2}?$/;function f(t){const e=n.exec(t);return e?+e[1]:0}function u(t){const e=t.split(p).filter(t=>t),s=e.filter(t=>a.test(t));return{spec:t,parts:e,inputs:s,hash:g(t)}}function g(t){return V(t.replace(l," _ "))}function V(t){return t.replace(/_/g," _ ").replace(/ +/g," ").replace(/[,%?:]/g,"").replace(/ß/g,"ss").replace(/ä/g,"a").replace(/ö/g,"o").replace(/ü/g,"u").replace(". . .","...").replace(/^…$/,"...").trim().toLowerCase()}const m={},b=[{id:"MOTION_MOVESTEPS",selector:"forward:",spec:"move %1 steps",inputs:["%n"],shape:"stack",category:"motion"},{id:"MOTION_TURNRIGHT",selector:"turnRight:",spec:"turn @turnRight %1 degrees",inputs:["%n"],shape:"stack",category:"motion"},{id:"MOTION_TURNLEFT",selector:"turnLeft:",spec:"turn @turnLeft %1 degrees",inputs:["%n"],shape:"stack",category:"motion"},{id:"MOTION_POINTINDIRECTION",selector:"heading:",spec:"point in direction %1",inputs:["%d.direction"],shape:"stack",category:"motion"},{id:"MOTION_POINTTOWARDS",selector:"pointTowards:",spec:"point towards %1",inputs:["%m.spriteOrMouse"],shape:"stack",category:"motion"},{id:"MOTION_GOTOXY",selector:"gotoX:y:",spec:"go to x:%1 y:%2",inputs:["%n","%n"],shape:"stack",category:"motion"},{id:"MOTION_GOTO",selector:"gotoSpriteOrMouse:",spec:"go to %1",inputs:["%m.location"],shape:"stack",category:"motion"},{id:"MOTION_GLIDESECSTOXY",selector:"glideSecs:toX:y:elapsed:from:",spec:"glide %1 secs to x:%2 y:%3",inputs:["%n","%n","%n"],shape:"stack",category:"motion"},{id:"MOTION_GLIDETO",spec:"glide %1 secs to %2",inputs:["%n","%m.location"],shape:"stack",category:"motion"},{id:"MOTION_CHANGEXBY",selector:"changeXposBy:",spec:"change x by %1",inputs:["%n"],shape:"stack",category:"motion"},{id:"MOTION_SETX",selector:"xpos:",spec:"set x to %1",inputs:["%n"],shape:"stack",category:"motion"},{id:"MOTION_CHANGEYBY",selector:"changeYposBy:",spec:"change y by %1",inputs:["%n"],shape:"stack",category:"motion"},{id:"MOTION_SETY",selector:"ypos:",spec:"set y to %1",inputs:["%n"],shape:"stack",category:"motion"},{id:"MOTION_SETROTATIONSTYLE",selector:"setRotationStyle",spec:"set rotation style %1",inputs:["%m.rotationStyle"],shape:"stack",category:"motion"},{id:"LOOKS_SAYFORSECS",selector:"say:duration:elapsed:from:",spec:"say %1 for %2 seconds",inputs:["%s","%n"],shape:"stack",category:"looks"},{id:"LOOKS_SAY",selector:"say:",spec:"say %1",inputs:["%s"],shape:"stack",category:"looks"},{id:"LOOKS_THINKFORSECS",selector:"think:duration:elapsed:from:",spec:"think %1 for %2 seconds",inputs:["%s","%n"],shape:"stack",category:"looks"},{id:"LOOKS_THINK",selector:"think:",spec:"think %1",inputs:["%s"],shape:"stack",category:"looks"},{id:"LOOKS_SHOW",selector:"show",spec:"show",inputs:[],shape:"stack",category:"looks"},{id:"LOOKS_HIDE",selector:"hide",spec:"hide",inputs:[],shape:"stack",category:"looks"},{id:"LOOKS_SWITCHCOSTUMETO",selector:"lookLike:",spec:"switch costume to %1",inputs:["%m.costume"],shape:"stack",category:"looks"},{id:"LOOKS_NEXTCOSTUME",selector:"nextCostume",spec:"next costume",inputs:[],shape:"stack",category:"looks"},{id:"LOOKS_NEXTBACKDROP_BLOCK",selector:"nextScene",spec:"next backdrop",inputs:[],shape:"stack",category:"looks"},{id:"LOOKS_SWITCHBACKDROPTO",selector:"startScene",spec:"switch backdrop to %1",inputs:["%m.backdrop"],shape:"stack",category:"looks"},{id:"LOOKS_SWITCHBACKDROPTOANDWAIT",selector:"startSceneAndWait",spec:"switch backdrop to %1 and wait",inputs:["%m.backdrop"],shape:"stack",category:"looks"},{id:"LOOKS_CHANGEEFFECTBY",selector:"changeGraphicEffect:by:",spec:"change %1 effect by %2",inputs:["%m.effect","%n"],shape:"stack",category:"looks"},{id:"LOOKS_SETEFFECTTO",selector:"setGraphicEffect:to:",spec:"set %1 effect to %2",inputs:["%m.effect","%n"],shape:"stack",category:"looks"},{id:"LOOKS_CLEARGRAPHICEFFECTS",selector:"filterReset",spec:"clear graphic effects",inputs:[],shape:"stack",category:"looks"},{id:"LOOKS_CHANGESIZEBY",selector:"changeSizeBy:",spec:"change size by %1",inputs:["%n"],shape:"stack",category:"looks"},{id:"LOOKS_SETSIZETO",selector:"setSizeTo:",spec:"set size to %1%",inputs:["%n"],shape:"stack",category:"looks"},{selector:"comeToFront",spec:"go to front",inputs:[],shape:"stack",category:"looks"},{id:"LOOKS_GOTOFRONTBACK",spec:"go to %1 layer",inputs:["%m"],shape:"stack",category:"looks"},{selector:"goBackByLayers:",spec:"go back %1 layers",inputs:["%n"],shape:"stack",category:"looks"},{id:"LOOKS_GOFORWARDBACKWARDLAYERS",spec:"go %1 %2 layers",inputs:["%m","%n"],shape:"stack",category:"looks"},{id:"SOUND_PLAY",selector:"playSound:",spec:"start sound %1",inputs:["%m.sound"],shape:"stack",category:"sound"},{id:"SOUND_CHANGEEFFECTBY",spec:"change %1 effect by %2",inputs:["%m","%n"],shape:"stack",category:"sound"},{id:"SOUND_SETEFFECTO",spec:"set %1 effect to %2",inputs:["%m","%n"],shape:"stack",category:"sound"},{id:"SOUND_CLEAREFFECTS",spec:"clear sound effects",inputs:[],shape:"stack",category:"sound"},{id:"SOUND_PLAYUNTILDONE",selector:"doPlaySoundAndWait",spec:"play sound %1 until done",inputs:["%m.sound"],shape:"stack",category:"sound"},{id:"SOUND_STOPALLSOUNDS",selector:"stopAllSounds",spec:"stop all sounds",inputs:[],shape:"stack",category:"sound"},{id:"music.playDrumForBeats",selector:"playDrum",spec:"play drum %1 for %2 beats",inputs:["%d.drum","%n"],shape:"stack",category:"music"},{id:"music.restForBeats",selector:"rest:elapsed:from:",spec:"rest for %1 beats",inputs:["%n"],shape:"stack",category:"music"},{id:"music.playNoteForBeats",selector:"noteOn:duration:elapsed:from:",spec:"play note %1 for %2 beats",inputs:["%d.note","%n"],shape:"stack",category:"music"},{id:"music.setInstrument",selector:"instrument:",spec:"set instrument to %1",inputs:["%d.instrument"],shape:"stack",category:"music"},{id:"SOUND_CHANGEVOLUMEBY",selector:"changeVolumeBy:",spec:"change volume by %1",inputs:["%n"],shape:"stack",category:"sound"},{id:"SOUND_SETVOLUMETO",selector:"setVolumeTo:",spec:"set volume to %1%",inputs:["%n"],shape:"stack",category:"sound"},{id:"music.changeTempo",selector:"changeTempoBy:",spec:"change tempo by %1",inputs:["%n"],shape:"stack",category:"music"},{selector:"setTempoTo:",spec:"set tempo to %1 bpm",inputs:["%n"],shape:"stack",category:"sound"},{id:"music.setTempo",selector:"setTempoTo:",spec:"set tempo to %1",inputs:["%n"],shape:"stack",category:"music"},{id:"pen.clear",selector:"clearPenTrails",spec:"erase all",inputs:[],shape:"stack",category:"pen"},{id:"pen.stamp",selector:"stampCostume",spec:"stamp",inputs:[],shape:"stack",category:"pen"},{id:"pen.penDown",selector:"putPenDown",spec:"pen down",inputs:[],shape:"stack",category:"pen"},{id:"pen.penUp",selector:"putPenUp",spec:"pen up",inputs:[],shape:"stack",category:"pen"},{id:"pen.setColor",selector:"penColor:",spec:"set pen color to %1",inputs:["%c"],shape:"stack",category:"pen"},{id:"pen.changeHue",selector:"changePenHueBy:",spec:"change pen color by %1",inputs:["%n"],shape:"stack",category:"pen"},{id:"pen.setColorParam",spec:"set pen %1 to %2",inputs:["%m.color","%c"],shape:"stack",category:"pen"},{id:"pen.changeColorParam",spec:"change pen %1 by %2",inputs:["%m.color","%n"],shape:"stack",category:"pen"},{id:"pen.setHue",selector:"setPenHueTo:",spec:"set pen color to %1",inputs:["%n"],shape:"stack",category:"pen"},{id:"pen.changeShade",selector:"changePenShadeBy:",spec:"change pen shade by %1",inputs:["%n"],shape:"stack",category:"pen"},{id:"pen.setShade",selector:"setPenShadeTo:",spec:"set pen shade to %1",inputs:["%n"],shape:"stack",category:"pen"},{id:"pen.changeSize",selector:"changePenSizeBy:",spec:"change pen size by %1",inputs:["%n"],shape:"stack",category:"pen"},{id:"pen.setSize",selector:"penSize:",spec:"set pen size to %1",inputs:["%n"],shape:"stack",category:"pen"},{id:"EVENT_WHENFLAGCLICKED",selector:"whenGreenFlag",spec:"when @greenFlag clicked",inputs:[],shape:"hat",category:"events"},{id:"EVENT_WHENKEYPRESSED",selector:"whenKeyPressed",spec:"when %1 key pressed",inputs:["%m.key"],shape:"hat",category:"events"},{id:"EVENT_WHENTHISSPRITECLICKED",selector:"whenClicked",spec:"when this sprite clicked",inputs:[],shape:"hat",category:"events"},{id:"EVENT_WHENSTAGECLICKED",spec:"when stage clicked",inputs:[],shape:"hat",category:"events"},{id:"EVENT_WHENBACKDROPSWITCHESTO",selector:"whenSceneStarts",spec:"when backdrop switches to %1",inputs:["%m.backdrop"],shape:"hat",category:"events"},{id:"EVENT_WHENGREATERTHAN",selector:"whenSensorGreaterThan",spec:"when %1 > %2",inputs:["%m.triggerSensor","%n"],shape:"hat",category:"events"},{id:"EVENT_WHENBROADCASTRECEIVED",selector:"whenIReceive",spec:"when I receive %1",inputs:["%m.broadcast"],shape:"hat",category:"events"},{id:"EVENT_BROADCAST",selector:"broadcast:",spec:"broadcast %1",inputs:["%m.broadcast"],shape:"stack",category:"events"},{id:"EVENT_BROADCASTANDWAIT",selector:"doBroadcastAndWait",spec:"broadcast %1 and wait",inputs:["%m.broadcast"],shape:"stack",category:"events"},{id:"CONTROL_WAIT",selector:"wait:elapsed:from:",spec:"wait %1 seconds",inputs:["%n"],shape:"stack",category:"control"},{id:"CONTROL_REPEAT",selector:"doRepeat",spec:"repeat %1",inputs:["%n"],shape:"c-block",category:"control",hasLoopArrow:!0},{id:"CONTROL_FOREVER",selector:"doForever",spec:"forever",inputs:[],shape:"c-block cap",category:"control",hasLoopArrow:!0},{id:"CONTROL_IF",selector:"doIf",spec:"if %1 then",inputs:["%b"],shape:"c-block",category:"control"},{id:"CONTROL_WAITUNTIL",selector:"doWaitUntil",spec:"wait until %1",inputs:["%b"],shape:"stack",category:"control"},{id:"CONTROL_REPEATUNTIL",selector:"doUntil",spec:"repeat until %1",inputs:["%b"],shape:"c-block",category:"control",hasLoopArrow:!0},{id:"CONTROL_STOP",selector:"stopScripts",spec:"stop %1",inputs:["%m.stop"],shape:"cap",category:"control"},{id:"CONTROL_STARTASCLONE",selector:"whenCloned",spec:"when I start as a clone",inputs:[],shape:"hat",category:"control"},{id:"CONTROL_CREATECLONEOF",selector:"createCloneOf",spec:"create clone of %1",inputs:["%m.spriteOnly"],shape:"stack",category:"control"},{id:"CONTROL_DELETETHISCLONE",selector:"deleteClone",spec:"delete this clone",inputs:[],shape:"cap",category:"control"},{id:"SENSING_ASKANDWAIT",selector:"doAsk",spec:"ask %1 and wait",inputs:["%s"],shape:"stack",category:"sensing"},{id:"videoSensing.videoToggle",selector:"setVideoState",spec:"turn video %1",inputs:["%m.videoState"],shape:"stack",category:"video"},{id:"videoSensing.setVideoTransparency",selector:"setVideoTransparency",spec:"set video transparency to %1%",inputs:["%n"],shape:"stack",category:"video"},{id:"videoSensing.whenMotionGreaterThan",spec:"when video motion > %1",inputs:["%n"],shape:"hat",category:"video"},{id:"SENSING_RESETTIMER",selector:"timerReset",spec:"reset timer",inputs:[],shape:"stack",category:"sensing"},{id:"DATA_SETVARIABLETO",selector:"setVar:to:",spec:"set %1 to %2",inputs:["%m.var","%s"],shape:"stack",category:"variables"},{id:"DATA_CHANGEVARIABLEBY",selector:"changeVar:by:",spec:"change %1 by %2",inputs:["%m.var","%n"],shape:"stack",category:"variables"},{id:"DATA_SHOWVARIABLE",selector:"showVariable:",spec:"show variable %1",inputs:["%m.var"],shape:"stack",category:"variables"},{id:"DATA_HIDEVARIABLE",selector:"hideVariable:",spec:"hide variable %1",inputs:["%m.var"],shape:"stack",category:"variables"},{id:"DATA_ADDTOLIST",selector:"append:toList:",spec:"add %1 to %2",inputs:["%s","%m.list"],shape:"stack",category:"list"},{id:"DATA_DELETEOFLIST",selector:"deleteLine:ofList:",spec:"delete %1 of %2",inputs:["%d.listDeleteItem","%m.list"],shape:"stack",category:"list"},{id:"DATA_DELETEALLOFLIST",spec:"delete all of %1",inputs:["%m.list"],shape:"stack",category:"list"},{id:"MOTION_IFONEDGEBOUNCE",selector:"bounceOffEdge",spec:"if on edge, bounce",inputs:[],shape:"stack",category:"motion"},{id:"DATA_INSERTATLIST",selector:"insert:at:ofList:",spec:"insert %1 at %2 of %3",inputs:["%s","%d.listItem","%m.list"],shape:"stack",category:"list"},{id:"DATA_REPLACEITEMOFLIST",selector:"setLine:ofList:to:",spec:"replace item %1 of %2 with %3",inputs:["%d.listItem","%m.list","%s"],shape:"stack",category:"list"},{id:"DATA_SHOWLIST",selector:"showList:",spec:"show list %1",inputs:["%m.list"],shape:"stack",category:"list"},{id:"DATA_HIDELIST",selector:"hideList:",spec:"hide list %1",inputs:["%m.list"],shape:"stack",category:"list"},{id:"MOTION_XPOSITION",selector:"xpos",spec:"x position",inputs:[],shape:"reporter",category:"motion"},{id:"MOTION_YPOSITION",selector:"ypos",spec:"y position",inputs:[],shape:"reporter",category:"motion"},{id:"MOTION_DIRECTION",selector:"heading",spec:"direction",inputs:[],shape:"reporter",category:"motion"},{id:"SENSING_OF_COSTUMENUMBER",selector:"costumeIndex",spec:"costume #",inputs:[],shape:"reporter",category:"looks"},{id:"LOOKS_COSTUMENUMBERNAME",selector:"LOOKS_COSTUMENUMBERNAME",spec:"costume %1",inputs:["%m"],shape:"reporter",category:"looks"},{id:"LOOKS_SIZE",selector:"scale",spec:"size",inputs:[],shape:"reporter",category:"looks"},{id:"SENSING_OF_BACKDROPNAME",selector:"sceneName",spec:"backdrop name",inputs:[],shape:"reporter",category:"looks"},{id:"LOOKS_BACKDROPNUMBERNAME",spec:"backdrop %1",inputs:["%m"],shape:"reporter",category:"looks"},{id:"SENSING_OF_BACKDROPNUMBER",selector:"backgroundIndex",spec:"backdrop #",inputs:[],shape:"reporter",category:"looks"},{id:"SOUND_VOLUME",selector:"volume",spec:"volume",inputs:[],shape:"reporter",category:"sound"},{id:"music.getTempo",selector:"tempo",spec:"tempo",inputs:[],shape:"reporter",category:"music"},{id:"SENSING_TOUCHINGOBJECT",selector:"touching:",spec:"touching %1?",inputs:["%m.touching"],shape:"boolean",category:"sensing"},{id:"SENSING_TOUCHINGCOLOR",selector:"touchingColor:",spec:"touching color %1?",inputs:["%c"],shape:"boolean",category:"sensing"},{id:"SENSING_COLORISTOUCHINGCOLOR",selector:"color:sees:",spec:"color %1 is touching %2?",inputs:["%c","%c"],shape:"boolean",category:"sensing"},{id:"SENSING_DISTANCETO",selector:"distanceTo:",spec:"distance to %1",inputs:["%m.spriteOrMouse"],shape:"reporter",category:"sensing"},{id:"SENSING_ANSWER",selector:"answer",spec:"answer",inputs:[],shape:"reporter",category:"sensing"},{id:"SENSING_KEYPRESSED",selector:"keyPressed:",spec:"key %1 pressed?",inputs:["%m.key"],shape:"boolean",category:"sensing"},{id:"SENSING_MOUSEDOWN",selector:"mousePressed",spec:"mouse down?",inputs:[],shape:"boolean",category:"sensing"},{id:"SENSING_MOUSEX",selector:"mouseX",spec:"mouse x",inputs:[],shape:"reporter",category:"sensing"},{id:"SENSING_MOUSEY",selector:"mouseY",spec:"mouse y",inputs:[],shape:"reporter",category:"sensing"},{id:"SENSING_SETDRAGMODE",spec:"set drag mode %1",inputs:["%m"],shape:"stack",category:"sensing"},{id:"SENSING_LOUDNESS",selector:"soundLevel",spec:"loudness",inputs:[],shape:"reporter",category:"sensing"},{id:"videoSensing.videoOn",selector:"senseVideoMotion",spec:"video %1 on %2",inputs:["%m.videoMotionType","%m.stageOrThis"],shape:"reporter",category:"video"},{id:"SENSING_TIMER",selector:"timer",spec:"timer",inputs:[],shape:"reporter",category:"sensing"},{id:"SENSING_OF",selector:"getAttribute:of:",spec:"%1 of %2",inputs:["%m.attribute","%m.spriteOrStage"],shape:"reporter",category:"sensing"},{id:"SENSING_CURRENT",selector:"timeAndDate",spec:"current %1",inputs:["%m.timeAndDate"],shape:"reporter",category:"sensing"},{id:"SENSING_DAYSSINCE2000",selector:"timestamp",spec:"days since 2000",inputs:[],shape:"reporter",category:"sensing"},{id:"SENSING_ONLINE",spec:"online?",inputs:[],shape:"boolean",category:"sensing"},{id:"SENSING_USERNAME",selector:"getUserName",spec:"username",inputs:[],shape:"reporter",category:"sensing"},{id:"OPERATORS_ADD",selector:"+",spec:"%1 + %2",inputs:["%n","%n"],shape:"reporter",category:"operators"},{id:"OPERATORS_SUBTRACT",selector:"-",spec:"%1 - %2",inputs:["%n","%n"],shape:"reporter",category:"operators"},{id:"OPERATORS_MULTIPLY",selector:"*",spec:"%1 * %2",inputs:["%n","%n"],shape:"reporter",category:"operators"},{id:"OPERATORS_DIVIDE",selector:"/",spec:"%1 / %2",inputs:["%n","%n"],shape:"reporter",category:"operators"},{id:"OPERATORS_RANDOM",selector:"randomFrom:to:",spec:"pick random %1 to %2",inputs:["%n","%n"],shape:"reporter",category:"operators"},{id:"OPERATORS_LT",selector:"<",spec:"%1 < %2",inputs:["%s","%s"],shape:"boolean",category:"operators"},{id:"OPERATORS_EQUALS",selector:"=",spec:"%1 = %2",inputs:["%s","%s"],shape:"boolean",category:"operators"},{id:"OPERATORS_GT",selector:">",spec:"%1 > %2",inputs:["%s","%s"],shape:"boolean",category:"operators"},{id:"OPERATORS_AND",selector:"&",spec:"%1 and %2",inputs:["%b","%b"],shape:"boolean",category:"operators"},{id:"OPERATORS_OR",selector:"|",spec:"%1 or %2",inputs:["%b","%b"],shape:"boolean",category:"operators"},{id:"OPERATORS_NOT",selector:"not",spec:"not %1",inputs:["%b"],shape:"boolean",category:"operators"},{id:"OPERATORS_JOIN",selector:"concatenate:with:",spec:"join %1 %2",inputs:["%s","%s"],shape:"reporter",category:"operators"},{id:"OPERATORS_LETTEROF",selector:"letter:of:",spec:"letter %1 of %2",inputs:["%n","%s"],shape:"reporter",category:"operators"},{id:"OPERATORS_LENGTH",selector:"stringLength:",spec:"length of %1",inputs:["%s"],shape:"reporter",category:"operators"},{id:"OPERATORS_MOD",selector:"%",spec:"%1 mod %2",inputs:["%n","%n"],shape:"reporter",category:"operators"},{id:"OPERATORS_ROUND",selector:"rounded",spec:"round %1",inputs:["%n"],shape:"reporter",category:"operators"},{id:"OPERATORS_MATHOP",selector:"computeFunction:of:",spec:"%1 of %2",inputs:["%m.mathOp","%n"],shape:"reporter",category:"operators"},{id:"OPERATORS_CONTAINS",spec:"%1 contains %2?",inputs:["%s","%s"],shape:"boolean",category:"operators"},{id:"DATA_ITEMOFLIST",selector:"getLine:ofList:",spec:"item %1 of %2",inputs:["%d.listItem","%m.list"],shape:"reporter",category:"list"},{id:"DATA_ITEMNUMOFLIST",spec:"item # of %1 in %2",inputs:["%s","%m.list"],shape:"reporter",category:"list"},{id:"DATA_LENGTHOFLIST",selector:"lineCountOfList:",spec:"length of %1",inputs:["%m.list"],shape:"reporter",category:"list"},{id:"DATA_LISTCONTAINSITEM",selector:"list:contains:",spec:"%1 contains %2?",inputs:["%m.list","%s"],shape:"boolean",category:"list"},{id:"CONTROL_ELSE",spec:"else",inputs:[],shape:"celse",category:"control"},{id:"scratchblocks:end",spec:"end",inputs:[],shape:"cend",category:"control"},{id:"scratchblocks:ellipsis",spec:". . .",inputs:[],shape:"stack",category:"grey"},{id:"scratchblocks:addInput",spec:"%1 @addInput",inputs:["%n"],shape:"ring",category:"grey"},{id:"SENSING_USERID",spec:"user id",inputs:[],shape:"reporter",category:"obsolete"},{selector:"doIf",spec:"if %1",inputs:["%b"],shape:"c-block",category:"obsolete"},{selector:"doForeverIf",spec:"forever if %1",inputs:["%b"],shape:"c-block cap",category:"obsolete"},{selector:"doReturn",spec:"stop script",inputs:[],shape:"cap",category:"obsolete"},{selector:"stopAll",spec:"stop all",inputs:[],shape:"cap",category:"obsolete"},{selector:"lookLike:",spec:"switch to costume %1",inputs:["%m.costume"],shape:"stack",category:"obsolete"},{selector:"nextScene",spec:"next background",inputs:[],shape:"stack",category:"obsolete"},{selector:"startScene",spec:"switch to background %1",inputs:["%m.backdrop"],shape:"stack",category:"obsolete"},{selector:"backgroundIndex",spec:"background #",inputs:[],shape:"reporter",category:"obsolete"},{id:"SENSING_LOUD",selector:"isLoud",spec:"loud?",inputs:[],shape:"boolean",category:"obsolete"},{id:"faceSensing.goToPart",spec:"go to %1",inputs:["%m"],shape:"stack",category:"faceSensing"},{id:"faceSensing.pointInFaceTiltDirection",spec:"point in direction of face tilt",inputs:[],shape:"stack",category:"faceSensing"},{id:"faceSensing.setSizeToFaceSize",spec:"set size to face size",inputs:[],shape:"stack",category:"faceSensing"},{id:"faceSensing.whenTilted",spec:"when face tilts %1",inputs:["%m"],shape:"hat",category:"faceSensing"},{id:"faceSensing.whenSpriteTouchesPart",spec:"when this sprite touches a %1",inputs:["%m"],shape:"hat",category:"faceSensing"},{id:"faceSensing.whenFaceDetected",spec:"when a face is detected",inputs:[],shape:"hat",category:"faceSensing"},{id:"faceSensing.faceDetected",spec:"a face is detected?",inputs:[],shape:"boolean",category:"faceSensing"},{id:"faceSensing.faceTilt",spec:"face tilt",inputs:[],shape:"reporter",category:"faceSensing"},{id:"faceSensing.faceSize",spec:"face size",inputs:[],shape:"reporter",category:"faceSensing"},{id:"text2speech.speakAndWaitBlock",spec:"speak %1",inputs:["%s"],shape:"stack",category:"tts"},{id:"text2speech.setVoiceBlock",spec:"set voice to %1",inputs:["%m"],shape:"stack",category:"tts"},{id:"text2speech.setLanguageBlock",spec:"set language to %1",inputs:["%m"],shape:"stack",category:"tts"},{id:"translate.translateBlock",spec:"translate %1 to %2",inputs:["%s","%m"],shape:"reporter",category:"translate"},{id:"translate.viewerLanguage",spec:"language",shape:"reporter",category:"translate"},{id:"makeymakey.whenKeyPressed",spec:"when %1 key pressed",inputs:["%m"],shape:"hat",category:"makeymakey"},{id:"makeymakey.whenKeysPressedInOrder",spec:"when %1 pressed in order",inputs:["%m"],shape:"hat",category:"makeymakey"},{id:"microbit.whenButtonPressed",spec:"when %1 button pressed",inputs:["%m"],shape:"hat",category:"microbit"},{id:"microbit.isButtonPressed",spec:"%1 button pressed?",inputs:["%m"],shape:"boolean",category:"microbit"},{id:"microbit.whenGesture",spec:"when %1",inputs:["%m"],shape:"hat",category:"microbit"},{id:"microbit.displaySymbol",spec:"display %1",inputs:["%m"],shape:"stack",category:"microbit"},{id:"microbit.displayText",spec:"display text %1",inputs:["%s"],shape:"stack",category:"microbit"},{id:"microbit.clearDisplay",spec:"clear display",shape:"stack",category:"microbit"},{id:"microbit.whenTilted",spec:"when tilted %1",inputs:["%m"],shape:"hat",category:"microbit"},{id:"microbit.isTilted",spec:"tilted %1?",inputs:["%m"],shape:"boolean",category:"microbit"},{id:"microbit.tiltAngle",spec:"tilt angle %1",inputs:["%m"],shape:"reporter",category:"microbit"},{id:"microbit.whenPinConnected",spec:"when pin %1 connected",inputs:["%m"],shape:"hat",category:"microbit"},{id:"ev3.motorTurnClockwise",spec:"motor %1 turn this way for %2 seconds",inputs:["%m","%n"],shape:"stack",category:"ev3"},{id:"ev3.motorTurnCounterClockwise",spec:"motor %1 turn that way for %2 seconds",inputs:["%m","%n"],shape:"stack",category:"ev3"},{id:"ev3.motorSetPower",spec:"motor %1 set power %2%",inputs:["%m","%n"],shape:"stack",category:"ev3"},{id:"ev3.getMotorPosition",spec:"motor %1 position",inputs:["%m"],shape:"reporter",category:"ev3"},{id:"ev3.whenButtonPressed",spec:"when button %1 pressed",inputs:["%m"],shape:"hat",category:"ev3"},{id:"ev3.whenDistanceLessThan",spec:"when distance < %1",inputs:["%n"],shape:"hat",category:"ev3"},{id:"ev3.whenBrightnessLessThan",spec:"when brightness < %1",inputs:["%n"],shape:"hat",category:"ev3"},{id:"ev3.buttonPressed",spec:"button %1 pressed?",inputs:["%m"],shape:"boolean",category:"ev3"},{id:"ev3.getDistance",spec:"distance",shape:"reporter",category:"ev3"},{id:"ev3.getBrightness",spec:"brightness",shape:"reporter",category:"ev3"},{id:"ev3.beepNote",spec:"beep note %1 for %2 secs",inputs:["%d.note","%n"],shape:"stack",category:"ev3"},{id:"wedo2.motorOn",spec:"turn %1 on",inputs:["%m.motor"],shape:"stack",category:"wedo"},{id:"wedo2.motorOff",spec:"turn %1 off",inputs:["%m.motor"],shape:"stack",category:"wedo"},{id:"wedo2.startMotorPower",spec:"set %1 power to %2",inputs:["%m.motor","%n"],shape:"stack",category:"wedo"},{id:"wedo2.setMotorDirection",spec:"set %1 direction to %2",inputs:["%m.motor2","%m.motorDirection"],shape:"stack",category:"wedo"},{id:"wedo2.whenDistance",spec:"when distance %1 %2",inputs:["%m.lessMore","%n"],shape:"hat",category:"wedo"},{id:"wedo2.getDistance",spec:"distance",inputs:[],shape:"reporter",category:"wedo"},{id:"wedo2.motorOnFor",spec:"turn %1 on for %2 seconds",inputs:["%m.motor","%n"],shape:"stack",category:"wedo"},{id:"wedo2.setLightHue",spec:"set light color to %1",inputs:["%n"],shape:"stack",category:"wedo"},{id:"wedo2.playNoteFor",spec:"play note %1 for %2 seconds",inputs:["%n","%n"],shape:"stack",category:"wedo"},{id:"wedo2.whenTilted",spec:"when tilted %1",inputs:["%m.xxx"],shape:"hat",category:"wedo"},{id:"wedo2.isTilted",spec:"tilted %1?",inputs:["%m"],shape:"boolean",category:"wedo"},{id:"wedo2.getTiltAngle",spec:"tilt angle %1",inputs:["%m.xxx"],shape:"reporter",category:"wedo"},{id:"gdxfor.whenGesture",spec:"when %1",inputs:["%m"],shape:"hat",category:"gdxfor"},{id:"gdxfor.whenForcePushedOrPulled",spec:"when force sensor %1",inputs:["%m"],shape:"hat",category:"gdxfor"},{id:"gdxfor.getForce",spec:"force",shape:"reporter",category:"gdxfor"},{id:"gdxfor.whenTilted",spec:"when tilted %1",inputs:["%m"],shape:"hat",category:"gdxfor"},{id:"gdxfor.isTilted",spec:"tilted %1?",inputs:["%m"],shape:"boolean",category:"gdxfor"},{id:"gdxfor.getTilt",spec:"tilt angle %1",inputs:["%m"],shape:"reporter",category:"gdxfor"},{id:"gdxfor.isFreeFalling",spec:"falling?",shape:"boolean",category:"gdxfor"},{id:"gdxfor.getSpin",spec:"spin speed %1",inputs:["%m"],shape:"reporter",category:"gdxfor"},{id:"gdxfor.getAcceleration",spec:"acceleration %1",inputs:["%m"],shape:"reporter",category:"gdxfor"},{id:"boost.motorOnFor",spec:"turn motor %1 for %2 seconds",inputs:["%m","%n"],shape:"stack",category:"boost"},{id:"boost.motorOnForRotation",spec:"turn motor %1 for %2 rotations",inputs:["%m","%n"],shape:"stack",category:"boost"},{id:"boost.motorOn",spec:"turn motor %1 on",inputs:["%m"],shape:"stack",category:"boost"},{id:"boost.motorOff",spec:"turn motor %1 off",inputs:["%m"],shape:"stack",category:"boost"},{id:"boost.setMotorPower",spec:"set motor %1 speed to %2%",inputs:["%m","%n"],shape:"stack",category:"boost"},{id:"boost.setMotorDirection",spec:"set motor %1 direction %2",inputs:["%m","%m"],shape:"stack",category:"boost"},{id:"boost.getMotorPosition",spec:"motor %1 position",inputs:["%m"],shape:"reporter",category:"boost"},{id:"boost.whenColor",spec:"when %1 brick seen",inputs:["%m"],shape:"hat",category:"boost"},{id:"boost.seeingColor",spec:"seeing %1 brick?",inputs:["%m"],shape:"boolean",category:"boost"},{id:"boost.whenTilted",spec:"when tilted %1",inputs:["%m"],shape:"hat",category:"boost"},{id:"boost.getTiltAngle",spec:"tilt angle %1",inputs:["%m"],shape:"reporter",category:"boost"},{id:"boost.setLightHue",spec:"set light color to %1",inputs:["%n"],shape:"stack",category:"boost"}].map(t=>{if(!t.id){if(!t.selector)throw Error("Missing ID: "+t.spec);t.id="sb2:"+t.selector}if(!t.spec)throw Error("Missing spec: "+t.id);const e={id:t.id,spec:t.spec,parts:t.spec.split(p).filter(t=>t),selector:t.selector||"sb3:"+t.id,inputs:null==t.inputs?[]:t.inputs,shape:t.shape,category:t.category,hasLoopArrow:!!t.hasLoopArrow};if(m[e.id])throw Error("Duplicate ID: "+e.id);return m[e.id]=e,e}),A={"@greenFlag":"⚑","@turnRight":"↻","@turnLeft":"↺","@addInput":"▸","@delInput":"◂"},y={};function k(t){Object.keys(t).forEach(e=>function(t,e){const s=e.blocksByHash={};Object.keys(e.commands).forEach(t=>{const i=e.commands[t],o=m[t],r=g(i);s[r]||(s[r]=[]),s[r].push(o);const c=h.exec(o.spec);if(c){const t=c[0],e=r.replace(g(t),A[t]);s[e]||(s[e]=[]),s[e].push(o)}}),e.nativeAliases={},Object.keys(e.aliases).forEach(t=>{const i=e.aliases[t],o=m[i];if(void 0===o)throw Error(`Invalid alias '${i}'`);const r=g(t);s[r]||(s[r]=[]),s[r].push(o),e.nativeAliases[i]||(e.nativeAliases[i]=[]),e.nativeAliases[i].push(t)}),Object.keys(e.renamedBlocks||{}).forEach(t=>{const s=e.renamedBlocks[t];if(!m[s])throw Error("Unknown ID: "+s);const i=m[s],o=g(t);w.blocksByHash[o]||(w.blocksByHash[o]=[]),w.blocksByHash[o].push(i)}),e.nativeDropdowns={},Object.keys(e.dropdowns).forEach(t=>{const s=e.dropdowns[t];e.nativeDropdowns[s]=t}),e.code=t,y[t]=e}(e,t[e]))}const w={aliases:{"turn ccw %1 degrees":"MOTION_TURNLEFT","turn left %1 degrees":"MOTION_TURNLEFT","turn cw %1 degrees":"MOTION_TURNRIGHT","turn right %1 degrees":"MOTION_TURNRIGHT","when flag clicked":"EVENT_WHENFLAGCLICKED","when gf clicked":"EVENT_WHENFLAGCLICKED","when green flag clicked":"EVENT_WHENFLAGCLICKED"},renamedBlocks:{"say %1 for %2 secs":"LOOKS_SAYFORSECS","think %1 for %2 secs":"LOOKS_THINKFORSECS","play sound %1":"SOUND_PLAY","wait %1 secs":"CONTROL_WAIT",clear:"pen.clear"},definePrefix:["define"],defineSuffix:[],ignorelt:["when distance"],math:["abs","floor","ceiling","sqrt","sin","cos","tan","asin","acos","atan","ln","log","e ^","10 ^"],name:"English",faceParts:["nose","mouth","left eye","right eye","between eyes","left ear","right ear","top of head"],soundEffects:["pitch","pan left/right"],microbitWhen:["moved","shaken","jumped"],osis:["other scripts in sprite","other scripts in stage"],dropdowns:{},commands:{}};function v(t,e){if(!m[t])throw Error("Unknown ID: "+t);m[t].accepts=e}function S(t,e,s){v(t,(t,e,i)=>s(e,i)),v(e,(t,e,i)=>!s(e,i))}function O(t){const e=[];for(const s of t.children){if(!s.isLabel)return;e.push(s.value)}return e.join(" ")}function L(t,e){if(!t)throw Error("Assertion failed! "+(e||""))}b.forEach(t=>{w.commands[t.id]=t.spec}),k({en:w}),S("OPERATORS_MATHOP","SENSING_OF",(t,e)=>{const s=t[0];if(!s.isInput)return;const i=s.value;return e.math.includes(i)}),S("SOUND_CHANGEEFFECTBY","LOOKS_CHANGEEFFECTBY",(t,e)=>{for(const s of t)if("dropdown"===s.shape){const t=s.value;for(const s of e.soundEffects)if(V(s)===V(t))return!0}return!1}),S("SOUND_SETEFFECTO","LOOKS_SETEFFECTTO",(t,e)=>{for(const s of t)if("dropdown"===s.shape){const t=s.value;for(const s of e.soundEffects)if(V(s)===V(t))return!0}return!1}),S("DATA_LENGTHOFLIST","OPERATORS_LENGTH",(t,e)=>{const s=t[t.length-1];if(s.isInput)return"dropdown"===s.shape}),S("DATA_LISTCONTAINSITEM","OPERATORS_CONTAINS",(t,e)=>{const s=t[0];if(s.isInput)return"dropdown"===s.shape}),S("pen.setColor","pen.setHue",(t,e)=>{const s=t[t.length-1];return s.isInput&&s.isColor||s.isBlock}),S("faceSensing.goToPart","MOTION_GOTO",(t,e)=>{for(const s of t)if("dropdown"===s.shape){const t=s.value;for(const s of e.faceParts)if(V(s)===V(t))return!0}return!1}),S("microbit.whenGesture","gdxfor.whenGesture",(t,e)=>{for(const s of t)if("dropdown"===s.shape){const t=s.value;for(const s of e.microbitWhen)if(V(s)===V(t))return!0}return!1}),S("ev3.buttonPressed","microbit.isButtonPressed",(t,e)=>{for(const e of t)if("dropdown"===e.shape)switch(V(e.value)){case"1":case"2":case"3":case"4":return!0}return!1}),function(t,e){if(!m[t])throw Error("Unknown ID: "+t);m[t].specialCase=e}("CONTROL_STOP",(t,e,s)=>{const i=e[e.length-1];if(!i.isInput)return;const o=i.value;return s.osis.includes(o)?{...m.CONTROL_STOP,shape:"stack"}:void 0});const E="￼DIFF";function T(t){return t.includes(E)?t.split("\n").map(t=>t.includes(E)?t.replace(RegExp(`( *)${E}([-+])`,"g"),"$2$1"):"  "+t).join("\n"):t}class R{constructor(t,e){this.value=t,this.cls=e||"",this.el=null,this.height=12,this.metrics=null,this.x=0}get isLabel(){return!0}stringify(){return this._stringify()}_stringify(){return"<"===this.value||">"===this.value?this.value:this.value.replace(/([<>[\](){}\\])/g,"\\$1").replace(/:{2,}/g,t=>":"+"\\:".repeat(t.length-1))}}class C{constructor(t){this.name=t,this.isArrow="loopArrow"===t,L(C.icons[t],"no info for icon "+t)}get isIcon(){return!0}static get icons(){return{greenFlag:!0,stopSign:!0,turnLeft:!0,turnRight:!0,loopArrow:!0,addInput:!0,delInput:!0,list:!0}}stringify(){return this._stringify()}_stringify(){return A["@"+this.name]||""}}class M{constructor(t,e,s){this.shape=t,this.value=e,this.menu=s||null,this.isRound="number"===t||"number-dropdown"===t,this.isBoolean="boolean"===t,this.isStack="stack"===t,this.isInset="boolean"===t||"stack"===t||"reporter"===t,this.isColor="color"===t,this.hasArrow="dropdown"===t||"number-dropdown"===t,this.isDarker="boolean"===t||"stack"===t||"dropdown"===t,this.isSquare="string"===t||"color"===t||"dropdown"===t,this.hasLabel=!(this.isColor||this.isInset),this.label=this.hasLabel?new R(e,"literal-"+this.shape):null,this.x=0}get isInput(){return!0}stringify(){return this._stringify()}_stringify(){if(this.isColor)return L("#"===this.value[0]),`[${this.value}]`;let t=this.value?this.value+"":"";return this.isSquare&&(t=t.replace(/([\]\\])/g,"\\$1")),this.isRound&&(t=t.replace(/([()[<])/g,"\\$1")),t=t.replace(/ v$/," \\v"),this.hasArrow?t+=" v":d.test(t)&&(t="\\"+t),this.isRound?`(${t})`:this.isSquare?`[${t}]`:this.isBoolean?"<>":this.isStack?"{}":t}translate(t){if(this.hasArrow){const t=this.menu||this.value;this.value=t,this.label=new R(this.value,"literal-"+this.shape)}}}class I{constructor(t,e,s){L(t),this.info={...t},this.children=e,this.comment=s||null,this.diff=null;const i=this.info.shape;this.isHat="hat"===i||"cat"===i||"define-hat"===i||"define-cat"===i,this.hasPuzzle="stack"===i||"hat"===i||"cat"===i||"c-block"===i||"define-hat"===i||"define-cat"===i,this.isFinal=/cap/.test(i),this.isCommand="stack"===i||"cap"===i||/block/.test(i),this.isOutline="outline"===i,this.isReporter="reporter"===i,this.isBoolean="boolean"===i,this.isRing="ring"===i,this.hasScript=/block/.test(i),this.isElse="celse"===i,this.isEnd="cend"===i}get isBlock(){return!0}stringify(t){return T(this._stringify(t))}_stringify(t){let e=null,s=!1,i=this.children.map((t,i,o)=>{if(t.isIcon&&(s=!0),e||t.isLabel||t.isIcon||(e=t),t.isScript)return t.isEmpty?"\n":`\n${function(t){return t.split("\n").map(t=>"  "+t).join("\n")}(t._stringify())}\n`;let r=o[i+1];r=r&&"loopArrow"===r.name?o[i+2]:r;const c=!(r&&r.isScript);return t._stringify().trim()+(c?" ":"")}).join("").trim();if("reporter"===this.info.shape&&d.test(i))return`(\\${i})`;const o=this.info.language;if(s&&o&&this.info.selector){const t=o.nativeAliases[this.info.id];if(t&&t.length){let s=t[0];return a.test(s)&&e&&(s=s.replace(a,e._stringify())),s}}let r=t||this.info.diff||"";(!1===this.info.categoryIsDefault||"custom-arg"===this.info.category&&(this.isReporter||this.isBoolean)||"custom"===this.info.category&&"stack"===this.info.shape)&&(r&&(r+=" "),this.info.isReset&&"obsolete"===this.info.category?r+="reset":r+=this.info.category),!1===this.info.shapeIsDefault&&(r&&(r+=" "),r+="define-cat"===this.info.shape?"cat":this.info.shape),r&&(i+=" :: "+r),(i.startsWith("+")||i.startsWith("-"))&&"reporter"!==this.info.shape&&"boolean"!==this.info.shape&&(i="\\"+i);const c=this.diff&&!this.info.diff?`${E}${this.diff} `:"";return this.hasScript?c+i+"\n"+(Object.keys(o.aliases).find(t=>"scratchblocks:end"===o.aliases[t])||"end"):"reporter"===this.info.shape?`${c}(${i})`:"boolean"===this.info.shape?`${c}<${i}>`:c+i}translate(t,e){if(!t)throw Error("Missing language");const s=this.info.id;if(!s)return;if("PROCEDURES_DEFINITION"===s){const e=this.children.find(t=>t.isOutline);this.children=[];for(const e of t.definePrefix)this.children.push(new R(e));this.children.push(e);for(const e of t.defineSuffix)this.children.push(new R(e));return}if("PROCEDURES_CALL"===s)return void this.children.forEach(e=>{e.isLabel||e.isIcon||e.translate(t)});if("custom-arg"===this.info.category||"custom"===this.info.category)return;const i=this.info.language.commands[s],o=t.commands[s];if(!o)return;const r=u(o),n=this.children.filter(t=>!t.isLabel&&!t.isIcon);e||n.forEach(e=>e.translate(t));const a=u(i).parts.map(t=>f(t)).filter(t=>t);let l=0;const p=a.map(t=>(l=Math.max(l,t),n[t-1])),d=n.slice(l);this.children=r.parts.map(t=>{if(!(t=t.trim()))return;const e=f(t);return e?p[e-1]:h.test(t)?new C(t.slice(1)):new R(t)}).filter(t=>t),d.forEach((e,s)=>{1===s&&"CONTROL_IF"===this.info.id&&this.children.push(new R(t.commands.CONTROL_ELSE)),this.children.push(e)}),this.info.language=t,this.info.isRTL=c.includes(t.code),this.info.categoryIsDefault=!0}}class x{constructor(t,e){this.label=new R(t,"comment-label"),this.width=null,this.hasBlock=e}get isComment(){return!0}stringify(){return this._stringify()}_stringify(){return"// "+this.label.value.trim()}}class N{constructor(t){L(t),this.child=t,t.isBlock?(this.shape=t.info.shape,this.info=t.info):this.shape="stack"}get isGlow(){return!0}stringify(){return T(this._stringify())}_stringify(){if(this.child.isBlock)return this.child._stringify("+");return this.child._stringify().split("\n").map(t=>t.includes(E)?t:`${E}+ ${t}`).join("\n")}translate(t){this.child.translate(t)}}class B{constructor(t){this.blocks=t,this.isEmpty=!t.length,this.isFinal=!this.isEmpty&&t[t.length-1].isFinal}get isScript(){return!0}stringify(){return T(this._stringify())}_stringify(){return this.blocks.map(t=>{let e=t._stringify();if(t.comment)if(t.isBlock&&t.hasScript){const s=" "+t.comment._stringify(),i=e.indexOf("\n");-1!==i?e=e.slice(0,i)+s+e.slice(i):e+=s}else e+=" "+t.comment._stringify();return e}).join("\n")}translate(t){this.blocks.forEach(e=>e.translate&&e.translate(t))}}class D{constructor(t){this.scripts=t}stringify(){return this.scripts.map(t=>t.stringify()).join("\n\n")}translate(t){this.scripts.forEach(e=>e.translate(t))}}function P(t,e,s){let n=[];Array.isArray(e[e.length-1])&&(n=e.pop());const a=[];for(const t of e)t.isLabel?a.push(t.value):t.isIcon?a.push("@"+t.name):a.push("_");const l=a.join(" "),p=t.hash=V(l);let f,u;if(!n.includes("reset")){const i=function(t,e,s,i){for(const o of i)if(Object.prototype.hasOwnProperty.call(o.blocksByHash,t)){const i=o.blocksByHash[t];for(let t of i)if(("reporter"!==e.shape||"reporter"===t.shape||"ring"===t.shape)&&("boolean"!==e.shape||"boolean"===t.shape)&&(!(i.length>1&&t.accepts)||t.accepts(e,s,o)))return t.specialCase&&(t=t.specialCase(e,s,o)||t),{type:t,lang:o}}}(p,t,e,s);if(i)f=i.lang,u=i.type,t.language=f,t.isRTL=c.includes(f.code),("ring"===u.shape?"reporter"===t.shape:"stack"===t.shape)&&(t.shape=u.shape),o[u.category]?t.category=o[u.category]:t.category=u.category,t.categoryIsDefault=!0,u.selector&&(t.selector=u.selector),u.id&&(t.id=u.id),t.hasLoopArrow=u.hasLoopArrow,". . ."===u.spec&&(e=[new R(". . .")]);else for(const i of s){if(!F(e,i))continue;t.shape="define-hat",t.category="custom";const o=e.splice(i.definePrefix.length,e.length-i.defineSuffix.length).map(t=>{if(t.isInput&&t.isBoolean)t=P({shape:"boolean",argument:"boolean",category:"custom-arg"},[new R("")],s);else if(!t.isInput||"string"!==t.shape&&"number"!==t.shape)(t.isReporter||t.isBoolean)&&(t.info.categoryIsDefault&&(t.info.category="custom-arg"),t.info.argument=t.isBoolean?"boolean":"number");else{const e=t.value.split(/ +/g).map(t=>new R(t));t=P({shape:"reporter",argument:"string"===t.shape?"string":"number",category:"custom-arg"},e,s)}return t}),r=new I({shape:"outline",category:"custom",categoryIsDefault:!0,hasLoopArrow:!1},o);e.splice(i.definePrefix.length,0,r);break}}!function(t,e){for(const s of e)d.test(s)?(t.color=s,t.category="",t.categoryIsDefault=!1):o[s]&&i.includes(o[s])?(t.category=o[s],t.categoryIsDefault=!1):i.includes(s)?(t.category=s,t.categoryIsDefault=!1):"cat"===s&&"define-hat"===t.shape?(t.shape="define-cat",t.shapeIsDefault=!1):r.includes(s)?(t.shape=s,t.shapeIsDefault=!1):"loop"===s?t.hasLoopArrow=!0:"+"===s||"-"===s?t.diff=s:"reset"===s&&(t.categoryIsDefault=!1,t.isReset=!0)}(t,n),t.hasLoopArrow&&e.push(new C("loopArrow"));const g=new I(t,e);return u&&h.test(u.spec)&&g.translate(f,!0),"+"===t.diff?new N(g):(g.diff=t.diff,g)}function F(t,e){if(t.length<e.definePrefix.length)return!1;if(t.length<e.defineSuffix.length)return!1;for(let s=0;s<e.definePrefix.length;s++){const i=e.definePrefix[s],o=t[s];if(!o.isLabel||V(o.value)!==V(i))return!1}for(let s=1;s<=e.defineSuffix.length;s++){const i=e.defineSuffix[e.defineSuffix.length-s],o=t[t.length-s];if(!o.isLabel||V(o.value)!==V(i))return!1}return!0}function z(t,e){let s,i=t[0],o=0;function r(){i=t[++o]}function c(){return t[o+1]}function n(){for(let e=o+1;e<t.length;e++)if(" "!==t[e])return t[e]}let a=[];function l(t,s){const i=s.filter(t=>!t.isLabel).length;return P({shape:t,category:"reporter"!==t||i?"obsolete":"variables",categoryIsDefault:!0,hasLoopArrow:!1},s,e)}function h(t,s){const i=function(t,e){for(const s of e)if(Object.prototype.hasOwnProperty.call(s.nativeDropdowns,t))return s.nativeDropdowns[t]}(s,e)||s;return new M(t,s,i)}function p(t){const e=[];let s;for(;i&&"\n"!==i;){if(("<"===i||">"===i)&&">"===t&&1===e.length&&!e[e.length-1].isLabel){const t=n();if("["===t||"("===t||"<"===t||"{"===t){s=null,e.push(new R(i)),r();continue}}if(i===t)break;if("/"===i&&"/"===c()&&!t)break;switch(i){case"[":s=null,e.push(f());break;case"(":s=null,e.push(g());break;case"<":s=null,e.push(V());break;case"{":s=null,e.push(m());break;case" ":case"\t":r(),s=null;break;case"◂":case"▸":e.push(b()),s=null;break;case"@":{r();let t="";for(;i&&/[a-zA-Z]/.test(i);)t+=i,r();"cloud"===t?e.push(new R("☁")):e.push(Object.prototype.hasOwnProperty.call(C.icons,t)?new C(t):new R("@"+t)),s=null;break}case"\\":r();case":":if(":"===i&&":"===c())return e.push(A(t)),e;default:s||e.push(s=new R("")),s.value+=i,r()}}return e}function f(){r();let t="",e=!1;const s="\\"===i;for(;i&&"]"!==i&&"\n"!==i;){if("\\"===i){if(r(),"v"===i&&(e=!0),!i)break}else e=!1;t+=i,r()}return"]"===i&&r(),!s&&d.test(t)?new M("color",t):!e&&/ v$/.test(t)?h("dropdown",t.slice(0,t.length-2)):new M("string",t)}function u(t){const e=p(t);if(i&&"\n"===i&&(s=!0,r()),0!==e.length){if(1===e.length){const t=e[0];if(t.isBlock&&(t.isReporter||t.isBoolean||t.isRing))return t}return l("stack",e)}}function g(){r();const t="\\"===i;if(" "===i&&(r(),"v"===i&&")"===c()))return r(),r(),new M("number-dropdown","");const e=p(")");if(i&&")"===i&&r(),0===e.length)return new M("number","");if(1===e.length&&e[0].isLabel){const s=e[0].value;if(/^[0-9e.-]*$/.test(s))return new M("number",s);if(!t&&d.test(s))return new M("color",s)}if(e.length>1&&e.every(t=>t.isLabel)){if("v"===e[e.length-1].value){e.pop();return h("number-dropdown",e.map(t=>t.value).join(" "))}}const s=l("reporter",e);if(s.info&&"ring"===s.info.shape){const t=s.children[0];t&&t.isInput&&"number"===t.shape&&""===t.value?s.children[0]=new M("reporter"):(t&&t.isScript&&t.isEmpty||t&&t.isBlock&&!t.children.length)&&(s.children[0]=new M("stack"))}return s}function V(){r();const t=p(">");return i&&">"===i&&r(),0===t.length?new M("boolean"):l("boolean",t)}function m(){r(),s=!1;const t=H(function(){for(;i&&"}"!==i;){const t=u("}");if(t)return t}});let e=[];return t.forEach(t=>{e=e.concat(t.blocks)}),"}"===i&&r(),s?new B(e):(function(t){if(!t)throw Error("Assertion failed! ")}(e.length<=1),e.length?e[0]:l("stack",[]))}function b(){const t=i;switch(r(),t){case"▸":return new C("addInput");case"◂":return new C("delInput");default:return}}function A(t){r(),r();const e=[];let s="";for(;i&&"\n"!==i&&i!==t;){if(" "===i)s&&(e.push(s),s="");else{if("/"===i&&"/"===c())break;s+=i}r()}return s&&e.push(s),e}function y(){let t;"+"!==i&&"-"!==i||(t=i,r());const e=u();if("/"===i&&"/"===c()){const t=function(t){r(),r();let e="";for(;i&&"\n"!==i&&i!==t;)e+=i,r();return i&&"\n"===i&&r(),new x(e,!0)}();if(t.hasBlock=e&&e.children.length,!t.hasBlock)return t;e.comment=t}return e&&(e.diff=t),e}return e.map(t=>{a=a.concat(t.define)}),()=>{if(!i)return;return y()||"NL"}}function H(t){let e=t();function s(){e=t()}function i(){const t=e;if(s(),t.hasScript)for(;;){const i=o();if(t.children.push(new B(i)),!e||!e.isElse){e&&e.isEnd&&s();break}for(const s of e.children)t.children.push(s);s()}return t}function o(){const t=[];for(;e;){if("NL"===e){s();continue}if(!e.isCommand)return t;const o=i(),r="+"===o.diff;if(r&&(o.diff=null),r){const e=t[t.length-1];let s=[];e&&e.isGlow&&(t.pop(),s=e.child.isScript?e.child.blocks:[e.child]),s.push(o),t.push(new N(new B(s)))}else t.push(o)}return t}return function(){for(;"NL"===e;)s();const t=[];for(;e;){let o=[];for(;e&&"NL"!==e;){let e=i();const s="+"===e.diff;if(s&&(e.diff=null),(e.isElse||e.isEnd)&&(e=new I({...e.info,shape:"stack"},e.children)),s){const t=o[o.length-1];let s=[];t&&t.isGlow&&(o.pop(),s=t.child.isScript?t.child.blocks:[t.child]),s.push(e),o.push(new N(new B(s)))}else if(e.isHat)o.length&&t.push(new B(o)),o=[e];else{if(e.isFinal){o.push(e);break}if(!e.isCommand){o.length&&t.push(new B(o)),t.push(new B([e])),o=[];break}o.push(e)}}for(o.length&&t.push(new B(o));"NL"===e;)s()}return t}()}function G(t,e){t.isScript?t.blocks=t.blocks.map(t=>(G(t,e),e(t)||t)):t.isBlock?t.children=t.children.map(t=>(G(t,e),e(t)||t)):t.isGlow&&G(t.child,e)}const U={"append:toList:":1,"deleteLine:ofList:":1,"insert:at:ofList:":2,"setLine:ofList:to:":1,"showList:":0,"hideList:":0};function j(t,e){if((e={inline:!1,languages:["en"],...e}).dialect)throw Error("Option 'dialect' no longer supported");t=(t=t.replace(/&lt;/g,"<")).replace(/&gt;/g,">"),e.inline&&(t=t.replace(/\n/g," "));const s=e.languages.map(t=>{const e=y[t];if(!e)throw Error(`Unknown language: '${t}'`);return e}),i=H(z(t,s));return function(t){const e=Object.create(null),s=new Set;t.forEach(t=>{const i=new Set;G(t,t=>{if(t.isBlock)if("define-hat"===t.info.shape||"define-cat"===t.info.shape){const s=t.children.find(t=>t.isOutline);if(!s)return;const o=[],r=[];for(const t of s.children)if(t.isLabel)r.push(t.value.replace(/%/g,""));else if(t.isBlock){if(!t.info.argument)return;r.push({number:"%n",string:"%s",boolean:"%b"}[t.info.argument]);const e=O(t);o.push(e),i.add(e)}const c=r.join(" "),n=g(c),a={spec:c,names:o};e[n]||(e[n]=a),t.info.id="PROCEDURES_DEFINITION",t.info.selector="procDef",t.info.call=a.spec,t.info.names=a.names,t.info.category="custom"}else if(t.info.categoryIsDefault&&(t.isReporter||t.isBoolean)){const e=O(t);i.has(e)&&(t.info.category="custom-arg",t.info.categoryIsDefault=!1,t.info.selector="getParam")}else if(Object.prototype.hasOwnProperty.call(U,t.info.selector)){const e=U[t.info.selector],i=t.children.filter(t=>!t.isLabel)[e];i&&i.isInput&&s.add(i.value)}})}),t.forEach(t=>{G(t,t=>{if(t.info&&t.info.categoryIsDefault&&"obsolete"===t.info.category){const s=e[t.info.hash];return void(s&&(t.info.id="PROCEDURES_CALL",t.info.selector="call",t.info.call=s.spec,t.info.names=s.names,t.info.category="custom"))}let i,o;t.isReporter&&"variables"===t.info.category&&t.info.categoryIsDefault&&(t.info.selector="readVariable",i=O(t),o=t.info),i&&s.has(i)&&(o.category="list",o.categoryIsDefault=!1,o.selector="contentsOfList:")})})}(i),new D(i)}function _(t,e){if(!t)throw Error("Assertion failed! "+e)}let K,W;const Z={textContent:!0};let Q=class t{static init(e){K=e.document;const s=e.DOMParser;W=(new s).parseFromString("<xml></xml>","application/xml"),t.XMLSerializer=e.XMLSerializer}static makeCanvas(){return K.createElement("canvas")}static cdata(t){return W.createCDATASection(t)}static el(e,s){const i=K.createElementNS("http://www.w3.org/2000/svg",e);return t.setProps(i,s)}static setProps(t,e){for(const s in e){const i=e[s]+"";Z[s]?t[s]=i:null!=e[s]&&Object.prototype.hasOwnProperty.call(e,s)&&t.setAttributeNS(null,s,i)}return t}static withChildren(t,e){for(const s of e)t.appendChild(s);return t}static group(e){return t.withChildren(t.el("g"),e)}static newSVG(e,s,i){return t.el("svg",{version:"1.1",width:e*i,height:s*i,viewBox:`0 0 ${e} ${s}`})}static polygon(e){return t.el("polygon",{...e,points:e.points.join(" ")})}static path(e){return t.el("path",{...e,path:null,d:e.path.join(" ")})}static text(e,s,i,o){return t.el("text",{...o,x:e,y:s,textContent:i})}static symbol(e){return t.el("use",{href:e})}static move(e,s,i){return t.setProps(i,{transform:`translate(${e} ${s})`}),i}static translatePath(t,e,s){let i=!0;const o=s.split(/\s+/),r=[];for(let s=0;s<o.length;s++){let c=o[s];if("A"===c){const t=s+5;for(r.push("A");s<t;)r.push(o[++s]);continue}/[A-Za-z]/.test(c)?_(i,"translatePath: invalid argument"):(c=+c,c+=i?t:e,i=!i),r.push(c)}return r.join(" ")}static rect(e,s,i){return t.el("rect",{...i,x:0,y:0,width:e,height:s})}static ellipse(e,s,i){return t.el("ellipse",{...i,cx:e/2,cy:s/2,rx:e/2,ry:s/2})}static arc(t,e,s,i,o,r){return`L ${t} ${e} A ${o} ${r} 0 0 1 ${s} ${i}`}static arcw(t,e,s,i,o,r){return`L ${t} ${e} A ${o} ${r} 0 0 0 ${s} ${i}`}static roundedPath(e,s){const i=s/2;return["M",i,0,t.arc(e-i,0,e-i,s,i,i),t.arc(i,s,i,0,i,i),"Z"]}static roundedRect(e,s,i){return t.path({...i,path:t.roundedPath(e,s)})}static pointedPath(t,e){const s=e/2;return["M",s,0,"L",t-s,0,t,s,"L",t,s,t-s,e,"L",s,e,0,s,"L",0,s,s,0,"Z"]}static pointedRect(e,s,i){return t.path({...i,path:t.pointedPath(e,s)})}static getTop(t){return`M 0 3\n      L 3 0\n      L 13 0\n      L 16 3\n      L 24 3\n      L 27 0\n      L ${t-3} 0\n      L ${t} 3`}static getRingTop(t){return`M 0 3\n      L 3 0\n      L 7 0\n      L 10 3\n      L 16 3\n      L 19 0\n      L ${t-3} 0\n      L ${t} 3`}static getRightAndBottom(t,e,s,i){void 0===i&&(i=0);let o=["L",t,e-3,"L",t-3,e];return s&&(o=o.concat(["L",i+27,e,"L",i+24,e+3,"L",i+16,e+3,"L",i+13,e])),o=i>0?o.concat(["L",i+2,e,"L",i,e+2]):o.concat(["L",i+3,e,"L",0,e-3]),o.join(" ")}static getArm(t,e){return`L 15 ${e-2}\n      L 17 ${e}\n      L ${t-3} ${e}\n      L ${t} ${e+3}`}static stackRect(e,s,i){return t.path({...i,path:[t.getTop(e),t.getRightAndBottom(e,s,!0,0),"Z"]})}static capPath(e,s){return[t.getTop(e),t.getRightAndBottom(e,s,!1,0),"Z"]}static capRect(e,s,i){return t.path({...i,path:t.capPath(e,s)})}static hatRect(e,s,i){return t.path({...i,path:["M",0,12,t.arc(0,12,80,10,80,80),"L",e-3,10,"L",e,13,t.getRightAndBottom(e,s,!0),"Z"]})}static curve(t,e,s,i,o){const r=(e+i)/2;return`${Math.round((t+s)/2+(o=o||.42)*(i-e))} ${Math.round(r-o*(s-t))} ${s} ${i}`}static procHatBase(e,s,i,o){return i=Math.min(.2,35/e),t.path({...o,path:["M",0,15,"Q",t.curve(0,15,e,15,i),t.getRightAndBottom(e,s,!0),"M",-1,13,"Q",t.curve(-1,13,e+1,13,i),"Q",t.curve(e+1,13,e,16,.6),"Q",t.curve(e,16,0,16,-i),"Q",t.curve(0,16,-1,13,.6),"Z"]})}static procHatCap(e,s,i){return t.path({path:["M",-1,13,"Q",t.curve(-1,13,e+1,13,i),"Q",t.curve(e+1,13,e,16,.6),"Q",t.curve(e,16,0,16,-i),"Q",t.curve(0,16,-1,13,.6),"Z"],class:"sb-define-hat-cap"})}static procHatRect(e,s,i){const o=s-52,r=Math.min(.2,35/e);return t.move(0,o,t.group([t.procHatBase(e,52,r,i),t.procHatCap(e,52,r)]))}static mouthRect(e,s,i,o,r){let c=o[0].height;const n=[t.getTop(e),t.getRightAndBottom(e,c,!0,15)];for(let s=1;s<o.length;s+=2){const r=s+2===o.length;c+=o[s].height-3,n.push(t.getArm(e,c));const a=!(r&&i),l=r?0:15;c+=o[s+1].height+3,n.push(t.getRightAndBottom(e,c,a,l))}return t.path({...r,path:n})}static ringRect(e,s,i,o,r,c,n){const a="reporter"===c?t.roundedPath:"boolean"===c?t.pointedPath:t.capPath;return t.path({...n,path:["M",8,0,t.arcw(8,0,0,8,8,8),t.arcw(0,s-8,8,s,8,8),t.arcw(e-8,s,e,s-8,8,8),t.arcw(e,8,e-8,0,8,8),"Z",t.translatePath(4,i||4,a(o,r).join(" "))],"fill-rule":"even-odd"})}static commentRect(e,s,i){return t.path({...i,class:"sb-comment",path:["M",6,0,t.arc(e-6,0,e,6,6,6),t.arc(e,s-6,e-6,s,6,6),t.arc(6,s,0,s-6,6,6),t.arc(0,6,6,0,6,6),"Z"]})}static commentLine(e,s){return t.move(-e,9,t.rect(e,2,{...s,class:"sb-comment-line"}))}static strikethroughLine(e,s){return t.path({...s,path:["M",0,0,"L",e,0],class:"sb-diff sb-diff-del"})}};class X{constructor(t,e){this.el=Q.el("filter",{...e,id:t,x0:"-50%",y0:"-50%",width:"200%",height:"200%"}),this.highestId=0}fe(t,e,s){const i=`${t.toLowerCase().replace(/gaussian|osite/,"")}-${++this.highestId}`;return this.el.appendChild(Q.withChildren(Q.el("fe"+t,{...e,result:i}),s||[])),i}comp(t,e,s,i){return this.fe("Composite",{...i,operator:t,in:e,in2:s})}subtract(t,e){return this.comp("arithmetic",t,e,{k2:1,k3:-1})}offset(t,e,s){return this.fe("Offset",{in:s,dx:t,dy:e})}flood(t,e,s){return this.fe("Flood",{in:s,"flood-color":t,"flood-opacity":e})}blur(t,e){return this.fe("GaussianBlur",{in:e,stdDeviation:`${t} ${t}`})}colorMatrix(t,e){return this.fe("ColorMatrix",{in:t,type:"matrix",values:e.join(" ")})}merge(t){this.fe("Merge",{},t.map(t=>Q.el("feMergeNode",{in:t})))}}let Y=class t{static get cssContent(){return".sb-label{font-family:Lucida Grande,Verdana,Arial,DejaVu Sans,sans-serif;font-weight:700;fill:#fff;font-size:10px;word-spacing:1px}.sb-obsolete{fill:#d42828}.sb-motion{fill:#4a6cd4}.sb-looks{fill:#8a55d7}.sb-sound{fill:#bb42c3}.sb-pen{fill:#0e9a6c}.sb-events{fill:#c88330}.sb-control{fill:#e1a91a}.sb-sensing{fill:#2ca5e2}.sb-operators{fill:#5cb712}.sb-variables{fill:#ee7d16}.sb-list{fill:#cc5b22}.sb-custom{fill:#632d99}.sb-custom-arg{fill:#5947b1}.sb-extension{fill:#4b4a60}.sb-grey{fill:#969696}.sb-bevel{filter:url(#bevelFilter)}.sb-input{filter:url(#inputBevelFilter)}.sb-input-number,.sb-input-number-dropdown,.sb-input-string{fill:#fff}.sb-literal-dropdown,.sb-literal-number,.sb-literal-number-dropdown,.sb-literal-string{font-weight:400;font-size:9px;word-spacing:0}.sb-literal-number,.sb-literal-number-dropdown,.sb-literal-string{fill:#000}.sb-darker{filter:url(#inputDarkFilter)}.sb-outline{stroke:#fff;stroke-opacity:.2;stroke-width:2;fill:none}.sb-comment,.sb-define-hat-cap{stroke:#632d99;stroke-width:1;fill:#8e2ec2}.sb-comment{fill:#ffffa5;stroke:#d0d1d2}.sb-comment-line{fill:#ffff80}.sb-comment-label{font-family:Helvetica,Arial,DejaVu Sans,sans-serif;font-weight:700;fill:#5c5d5f;word-spacing:0;font-size:12px}.sb-diff{fill:none;stroke:#000}.sb-diff-ins{stroke-width:2px}.sb-diff-del{stroke-width:3px}"}static makeIcons(){return[Q.el("path",{d:"M1.504 21L0 19.493 4.567 0h1.948l-.5 2.418s1.002-.502 3.006 0c2.006.503 3.008 2.01 6.517 2.01 3.508 0 4.463-.545 4.463-.545l-.823 9.892s-2.137 1.005-5.144.696c-3.007-.307-3.007-2.007-6.014-2.51-3.008-.502-4.512.503-4.512.503L1.504 21z",fill:"#3f8d15",id:"greenFlag"}),Q.el("polygon",{points:"6.3,0.4725 12.516,0.4725 18.585,6.3 18.585,12.495 12.495,18.585 6.3,18.585 0.483,12.495 0.483,6.3  ",fill:"#bb0010",id:"stopSign"}),Q.el("path",{d:"M6.724 0C3.01 0 0 2.91 0 6.5c0 2.316 1.253 4.35 3.14 5.5H5.17v-1.256C3.364 10.126 2.07 8.46 2.07 6.5 2.07 4.015 4.152 2 6.723 2c1.14 0 2.184.396 2.993 1.053L8.31 4.13c-.45.344-.398.826.11 1.08L15 8.5 13.858.992c-.083-.547-.514-.714-.963-.37l-1.532 1.172A6.825 6.825 0 0 0 6.723 0z",fill:"#fff",id:"turnRight"}),Q.el("path",{d:"M3.637 1.794A6.825 6.825 0 0 1 8.277 0C11.99 0 15 2.91 15 6.5c0 2.316-1.253 4.35-3.14 5.5H9.83v-1.256c1.808-.618 3.103-2.285 3.103-4.244 0-2.485-2.083-4.5-4.654-4.5-1.14 0-2.184.396-2.993 1.053L6.69 4.13c.45.344.398.826-.11 1.08L0 8.5 1.142.992c.083-.547.514-.714.963-.37l1.532 1.172z",fill:"#fff",id:"turnLeft"}),Q.el("path",{d:"M0 0L4 4L0 8Z",fill:"#111",id:"addInput"}),Q.el("path",{d:"M4 0L4 8L0 4Z",fill:"#111",id:"delInput"}),Q.setProps(Q.group([Q.el("path",{d:"M8 0l2 -2l0 -3l3 0l-4 -5l-4 5l3 0l0 3l-8 0l0 2",fill:"#000",opacity:"0.3"}),Q.move(-1,-1,Q.el("path",{d:"M8 0l2 -2l0 -3l3 0l-4 -5l-4 5l3 0l0 3l-8 0l0 2",fill:"#fff",opacity:"0.9"}))]),{id:"loopArrow"}),Q.setProps(Q.group([Q.el("rect",{x:"0",y:"0",width:"12",height:"14",fill:"#000",opacity:"0.25"}),Q.el("rect",{x:"1",y:"1",width:"1",height:"13",fill:"#fff"}),Q.el("rect",{x:"11",y:"1",width:"1",height:"13",fill:"#fff"}),Q.el("rect",{x:"2",y:"1",width:"9",height:"1",fill:"#fff"}),Q.el("rect",{x:"2",y:"5",width:"9",height:"1",fill:"#fff"}),Q.el("rect",{x:"2",y:"9",width:"9",height:"1",fill:"#fff"}),Q.el("rect",{x:"2",y:"13",width:"9",height:"1",fill:"#fff"}),Q.el("rect",{x:"2",y:"2",width:"9",height:"2",fill:"#ea8d1c"}),Q.el("rect",{x:"2",y:"6",width:"9",height:"2",fill:"#ea8d1c"}),Q.el("rect",{x:"2",y:"10",width:"9",height:"2",fill:"#ea8d1c"}),Q.el("rect",{x:"11",y:"0",width:"1",height:"1",fill:"#ea8d1c"}),Q.el("rect",{x:"0",y:"13",width:"1",height:"1",fill:"#ea8d1c"})]),{id:"list"})]}static makeStyle(){const e=Q.el("style");return e.appendChild(Q.cdata(t.cssContent)),e}static bevelFilter(t,e){const s=new X(t),i="SourceAlpha",o=e?-1:1,r=s.blur(1,i);return s.merge(["SourceGraphic",s.comp("in",s.flood("#fff",.15),s.subtract(i,s.offset(+o,+o,r))),s.comp("in",s.flood("#000",.7),s.subtract(i,s.offset(-o,-o,r)))]),s.el}static darkFilter(t){const e=new X(t);return e.merge(["SourceGraphic",e.comp("in",e.flood("#000",.2),"SourceAlpha")]),e.el}static darkRect(t,e,s,i){return Q.setProps(Q.group([Q.setProps(i,{class:`sb-${s} sb-darker`})]),{width:t,height:e})}static get defaultFontFamily(){return"Lucida Grande, Verdana, Arial, DejaVu Sans, sans-serif"}};const{defaultFontFamily:q,makeStyle:$,makeIcons:J,darkRect:tt,bevelFilter:et,darkFilter:st}=Y;let it=class t{constructor(t){Object.assign(this,t),this.el=null,this.height=12,this.metrics=null,this.x=0}get isLabel(){return!0}draw(){return this.el}get width(){return this.metrics.width}measure(){const e=this.value,s="sb-"+this.cls;this.el=Q.text(0,10,e,{class:"sb-label "+s});let i=t.metricsCache[s];if(i||(i=t.metricsCache[s]=Object.create(null)),Object.hasOwnProperty.call(i,e))this.metrics=i[e];else{const s=/comment-label/.test(this.cls)?"bold 12px Helvetica, Arial, DejaVu Sans, sans-serif":/literal/.test(this.cls)?"normal 9px "+q:"bold 10px "+q;this.metrics=i[e]=t.measure(e,s)}}static measure(e,s){const i=t.measuring;i.font=s;return{width:i.measureText(e).width+.5|0}}};it.metricsCache={},it.toMeasure=[];let ot=class t{constructor(e){Object.assign(this,e);const s=t.icons[this.name];if(!s)throw Error("no info for icon: "+this.name);Object.assign(this,s)}get isIcon(){return!0}draw(){return Q.symbol("#"+this.name,{width:this.width,height:this.height})}static get icons(){return{greenFlag:{width:20,height:21,dy:-2},stopSign:{width:20,height:20},turnLeft:{width:15,height:12,dy:1},turnRight:{width:15,height:12,dy:1},loopArrow:{width:14,height:11},addInput:{width:4,height:8},delInput:{width:4,height:8},list:{width:12,height:14}}}},rt=class t{constructor(t){Object.assign(this,t),t.label&&(this.label=pt(t.label)),this.x=0}measure(){this.hasLabel&&this.label.measure()}static get shapes(){return{string:Q.rect,number:Q.roundedRect,"number-dropdown":Q.roundedRect,color:Q.rect,dropdown:Q.rect,boolean:Q.pointedRect,stack:Q.stackRect,reporter:Q.roundedRect}}draw(e){let s,i;this.hasLabel?(i=this.label.draw(),s=Math.max(14,this.label.width+("string"===this.shape||"number-dropdown"===this.shape?6:9))):s=this.isInset?30:this.isColor?13:null,this.hasArrow&&(s+=10),this.width=s;const o=this.height=this.isRound||this.isColor?13:14;let r=t.shapes[this.shape](s,o);this.isColor?Q.setProps(r,{fill:this.value}):this.isDarker&&(r=tt(s,o,e.info.category,r),e.info.color&&Q.setProps(r,{fill:e.info.color}));const c=Q.group([Q.setProps(r,{class:"sb-input sb-input-"+this.shape})]);if(this.hasLabel){const t=this.isRound?5:4;c.appendChild(Q.move(t,0,i))}if(this.hasArrow){const t="dropdown"===this.shape?5:4;c.appendChild(Q.move(s-10,t,Q.polygon({points:[7,0,3.5,4,0,0],fill:"#000",opacity:"0.6"})))}return c}},ct=class i{constructor(i){Object.assign(this,i),this.children=i.children.map(pt),this.comment=this.comment?pt(this.comment):null,Object.prototype.hasOwnProperty.call(s,this.info.category)&&(this.info.category=s[this.info.category]),Object.prototype.hasOwnProperty.call(t,this.info.category)?this.info.category=t[this.info.category]:Object.prototype.hasOwnProperty.call(e,this.info.category)&&(this.info.category="extension"),this.x=0,this.width=null,this.height=null,this.firstLine=null,this.innerWidth=null}get isBlock(){return!0}measure(){for(const t of this.children)t.measure&&t.measure();this.comment&&this.comment.measure()}static get shapes(){return{stack:Q.stackRect,"c-block":Q.stackRect,"if-block":Q.stackRect,celse:Q.stackRect,cend:Q.stackRect,cap:Q.capRect,reporter:Q.roundedRect,boolean:Q.pointedRect,hat:Q.hatRect,cat:Q.hatRect,"define-hat":Q.procHatRect,"define-cat":Q.procHatRect,ring:Q.roundedRect}}drawSelf(t,e,s){if(s.length>1)return Q.mouthRect(t,e,this.isFinal,s,{class:`sb-${this.info.category} sb-bevel`});if("outline"===this.info.shape)return Q.setProps(Q.stackRect(t,e),{class:"sb-outline"});if(this.isRing){const s=this.children[0];if(s&&(s.isStack||s.isBlock||s.isScript)){const i=s.isScript?"stack":s.isStack?s.shape:s.info.shape;return Q.ringRect(t,e,s.y,s.width,s.height,i,{class:`sb-${this.info.category} sb-bevel`})}}const o=i.shapes[this.info.shape];if(!o)throw Error("no shape func: "+this.info.shape);return o(t,e,{class:`sb-${this.info.category} sb-bevel`})}minDistance(t){return this.isBoolean?t.isReporter?4+t.height/4|0:t.isLabel?5+t.height/2|0:t.isBoolean||"boolean"===t.shape?5:2+t.height/2|0:this.isReporter?t.isInput&&t.isRound||(t.isReporter||t.isBoolean)&&!t.hasScript?0:t.isLabel?2+t.height/2|0:t.height/2-2|0:0}static get padding(){return{hat:[15,6,2],cat:[15,6,2],"define-hat":[21,8,9],"define-cat":[21,8,9],reporter:[3,4,1],boolean:[3,4,2],cap:[6,6,2],"c-block":[3,6,2],"if-block":[3,6,2],ring:[4,4,2],null:[4,6,2]}}draw(){const t="define-hat"===this.info.shape||"define-cat"===this.info.shape;let e=this.children;const s=i.padding[this.info.shape]||i.padding.null;let o=s[0];const r=s[1],c=s[2];let n=0;const a=function(t){this.y=t,this.width=0,this.height=t?13:16,this.children=[]};let l=0,h=0,p=new a(n);const d=t=>{0===f.length?p.height+=o+c:(p.height+=t?0:2,p.y-=1),n+=p.height,f.push(p)};if(this.info.isRTL){let t=0;const s=()=>{e=e.slice(0,t).concat(e.slice(t,i).reverse()).concat(e.slice(i))};let i;for(i=0;i<e.length;i++)e[i].isScript&&(s(),t=i+1);t<i&&s()}const f=[];for(let t=0;t<e.length;t++){const s=e[t];if(s.el=s.draw(this),s.isScript&&this.isCommand)this.hasScript=!0,d(),s.y=n,f.push(s),h=Math.max(h,Math.max(1,s.width)),s.height=Math.max(12,s.height)+3,n+=s.height,p=new a(n);else if(s.isArrow)p.children.push(s);else{const e=t>0?30:0,i=this.isCommand?0:this.minDistance(s),o=this.isCommand?s.isBlock||s.isInput?e:0:i;o&&!f.length&&p.width<o-r&&(p.width=o-r),s.x=p.width,p.width+=s.width,l=Math.max(l,p.width+Math.max(0,i-r)),p.width+=4,s.isLabel||(p.height=Math.max(p.height,s.height)),p.children.push(s)}}if(d(!0),l=Math.max(l+2*r,this.isHat||this.hasScript?83:this.isCommand||this.isOutline||this.isRing?39:20),this.height=n,this.width=h?Math.max(l,15+h):l,t){const t=Math.min(26,3.5+.13*l|0)-18;this.height+=t,o+=2*t}this.firstLine=f[0],this.innerWidth=l;const u=[];for(const e of f){if(e.isScript){u.push(Q.move(15,e.y,e.el));continue}const s=e.height;for(const i of e.children){if(i.isArrow){u.push(Q.move(l-15,this.height-3,i.el));continue}let n=o+(s-i.height-o-c)/2-1;if(t&&i.isLabel?n+=3:i.isIcon&&(n+=0|i.dy),!(this.isRing&&(i.y=e.y+n|0,i.isInset)||(u.push(Q.move(r+i.x,e.y+n|0,i.el)),"+"!==i.diff))){const t=Q.insEllipse(i.width,i.height);u.push(Q.move(r+i.x,e.y+n|0,t))}}}const g=this.drawSelf(l,this.height,f);return u.splice(0,0,g),this.info.color&&Q.setProps(g,{fill:this.info.color}),Q.group(u)}},nt=class t{constructor(t){Object.assign(this,t),this.label=pt(t.label),this.width=null}get isComment(){return!0}static get lineLength(){return 12}get height(){return 20}measure(){this.label.measure()}draw(){const e=this.label.draw();return this.width=this.label.width+16,Q.group([Q.commentLine(this.hasBlock?t.lineLength:0,6),Q.commentRect(this.width,this.height,{class:"sb-comment"}),Q.move(8,4,e)])}},at=class{constructor(t){Object.assign(this,t),this.child=pt(t.child),this.width=null,this.height=null,this.y=0}get isGlow(){return!0}measure(){this.child.measure()}drawSelf(){const t=this.child;let e;const s=this.width,i=this.height-1;return e=t.isScript?!t.isEmpty&&t.blocks[0].isHat?Q.hatRect(s,i):t.isFinal?Q.capRect(s,i):Q.stackRect(s,i):t.drawSelf(s,i,[]),Q.setProps(e,{class:"sb-diff sb-diff-ins"})}draw(){const t=this.child,e=t.isScript?t.draw(!0):t.draw();return this.width=t.width,this.height=t.isBlock&&t.firstLine.height||t.height,Q.group([e,this.drawSelf()])}},lt=class{constructor(t){Object.assign(this,t),this.blocks=t.blocks.map(pt),this.y=0}get isScript(){return!0}measure(){for(const t of this.blocks)t.measure()}draw(t){const e=[];let s=0;this.width=0;for(const i of this.blocks){const o=t?0:2,r=i.draw();e.push(Q.move(o,s,r)),this.width=Math.max(this.width,i.width);if("-"===(i.diff||i.info?.diff)){const t=i.width,r=i.firstLine.height||i.height;e.push(Q.move(o,s+r/2+1,Q.strikethroughLine(t))),this.width=Math.max(this.width,i.width)}s+=i.height;const c=i.comment;if(c){const t=i.firstLine,o=i.innerWidth+2+nt.lineLength,r=s-i.height+t.height/2,n=c.draw();e.push(Q.move(o,r-c.height/2,n)),this.width=Math.max(this.width,o+c.width)}}this.height=s,t||this.isFinal||(this.height+=3);const i=this.blocks[this.blocks.length-1];return!t&&i.isGlow&&(this.height+=2),Q.group(e)}},ht=class{constructor(t,e){Object.assign(this,t),this.scripts=t.scripts.map(pt),this.width=null,this.height=null,this.el=null,this.defs=null,this.scale=e.scale}measure(){this.scripts.forEach(t=>t.measure())}render(t){if("function"==typeof t)throw Error("render() no longer takes a callback");this.measure();let e=0,s=0;const i=[];for(const t of this.scripts)s&&(s+=10),t.y=s,i.push(Q.move(0,s,t.draw())),s+=t.height,e=Math.max(e,t.width+4);this.width=e,this.height=s;const o=Q.newSVG(e,s,this.scale);return o.appendChild(this.defs=Q.withChildren(Q.el("defs"),[et("bevelFilter",!1),et("inputBevelFilter",!0),st("inputDarkFilter"),...J()])),o.appendChild(Q.group(i)),this.el=o,o}exportSVGString(){if(null==this.el)throw Error("call draw() first");const t=$();this.defs.appendChild(t);const e=(new Q.XMLSerializer).serializeToString(this.el);return this.defs.removeChild(t),e}exportSVG(){return"data:image/svg+xml;utf8,"+this.exportSVGString().replace(/[#]/g,encodeURIComponent)}toCanvas(t,e){e=e||1;const s=Q.makeCanvas();s.width=Math.max(1,this.width*e*this.scale),s.height=Math.max(1,this.height*e*this.scale);const i=s.getContext("2d"),o=new Image;o.src=this.exportSVG(),o.onload=()=>{i.save(),i.scale(e,e),i.drawImage(o,0,0),i.restore(),t(s)}}exportPNG(t,e){this.toCanvas(e=>{URL&&URL.createObjectURL&&Blob&&e.toBlob?e.toBlob(e=>{t(URL.createObjectURL(e))},"image/png"):t(e.toDataURL("image/png"))},e)}};const pt=(t,e)=>new((t=>{switch(t.constructor){case R:return it;case C:return ot;case M:return rt;case I:return ct;case x:return nt;case N:return at;case B:return lt;case D:return ht;default:throw Error("no view for "+t.constructor.name)}})(t))(t,e);const dt=Y.makeStyle;let ft,ut;const gt={textContent:!0};class Vt{static init(t){ft=t.document;const e=t.DOMParser;ut=(new e).parseFromString("<xml></xml>","application/xml"),Vt.XMLSerializer=t.XMLSerializer}static makeCanvas(){return ft.createElement("canvas")}static cdata(t){return ut.createCDATASection(t)}static el(t,e){const s=ft.createElementNS("http://www.w3.org/2000/svg",t);return Vt.setProps(s,e)}static setProps(t,e){for(const s in e){const i=e[s]+"";gt[s]?t[s]=i:null!=e[s]&&Object.prototype.hasOwnProperty.call(e,s)&&t.setAttributeNS(null,s,i)}return t}static withChildren(t,e){for(const s of e)t.appendChild(s);return t}static group(t){return Vt.withChildren(Vt.el("g"),t)}static newSVG(t,e,s){return Vt.el("svg",{version:"1.1",width:t*s,height:e*s,viewBox:`0 0 ${t*s} ${e*s}`})}static polygon(t){return Vt.el("polygon",{...t,points:t.points.join(" ")})}static path(t){return Vt.el("path",{...t,path:null,d:t.path.join(" ")})}static text(t,e,s,i){return Vt.el("text",{...i,x:t,y:e,textContent:s})}static symbol(t){return Vt.el("use",{href:t})}static move(t,e,s){return Vt.setProps(s,{transform:`translate(${t} ${e})`}),s}static rect(t,e,s){return Vt.el("rect",{...s,x:0,y:0,width:t,height:e})}static roundRect(t,e,s){return Vt.rect(t,e,{...s,rx:4,ry:4})}static pillRect(t,e,s){const i=e/2;return Vt.rect(t,e,{...s,rx:i,ry:i})}static pointedPath(t,e){const s=e/2;return[`M ${s} 0`,`L ${t-s} 0 ${t} ${s}`,`L ${t} ${s} ${t-s} ${e}`,`L ${s} ${e} 0 ${s}`,`L 0 ${s} ${s} 0`,"Z"]}static pointedRect(t,e,s){return Vt.path({...s,path:Vt.pointedPath(t,e)})}static topNotch(t,e){return`c 2 0 3 1 4 2\n      l 4 4\n      c 1 1 2 2 4 2\n      h 12\n      c 2 0 3 -1 4 -2\n      l 4 -4\n      c 1 -1 2 -2 4 -2\n      L ${t-4} ${e}\n      a 4 4 0 0 1 4 4`}static getTop(t){return"M 0 4\n      A 4 4 0 0 1 4 0\n      H 12 "+Vt.topNotch(t,0)}static getRingTop(t){return`M 0 3\n      L 3 0\n      L 7 0\n      L 10 3\n      L 16 3\n      L 19 0\n      L ${t-3} 0\n      L ${t} 3`}static getRightAndBottom(t,e,s,i){void 0===i&&(i=0);let o=[`L ${t} ${e-4}`,"a 4 4 0 0 1 -4 4"];return s&&(o=o.concat([`L ${i+48} ${e}`,"c -2 0 -3 1 -4 2","l -4 4","c -1 1 -2 2 -4 2","h -12","c -2 0 -3 -1 -4 -2","l -4 -4","c -1 -1 -2 -2 -4 -2"])),0===i?(o.push("L",i+4,e),o.push("a 4 4 0 0 1 -4 -4")):(o.push("L",i+4,e),o.push("a 4 4 0 0 0 -4 4")),o.join(" ")}static getArm(t,e){return`L 16 ${e-4}\n      a 4 4 0 0 0 4 4\n      L 28 ${e} ${Vt.topNotch(t,e)}`}static getArmNoNotch(t,e){return`L 16 ${e-4}\n      a 4 4 0 0 0 4 4\n      L 28 ${e} L ${t-4} ${e}\n      a 4 4 0 0 1 4 4`}static stackRect(t,e,s){return Vt.path({...s,path:[Vt.getTop(t),Vt.getRightAndBottom(t,e,!0,0),"Z"]})}static capPath(t,e){return[Vt.getTop(t),Vt.getRightAndBottom(t,e,!1,0),"Z"]}static capRect(t,e,s){return Vt.path({...s,path:Vt.capPath(t,e)})}static getHatTop(t){return`M 0 16 c 25,-22 71,-22 96,0 L ${t-4} 16 a 4 4 0 0 1 4 4`}static getCatTop(t){return`M 0 32\n      c2.6,-2.3 5.5,-4.3 8.5,-6.2c-1,-12.5 5.3,-23.3 8.4,-24.8c3.7,-1.8 16.5,13.1 18.4,15.4c8.4,-1.3 17,-1.3 25.4,0c1.9,-2.3 14.7,-17.2 18.4,-15.4c3.1,1.5 9.4,12.3 8.4,24.8c3,1.8 5.9,3.9 8.5,6.1\n      L ${t-4} 32\n      a 4 4 0 0 1 4 4`}static hatRect(t,e,s){return Vt.path({...s,path:[Vt.getHatTop(t),Vt.getRightAndBottom(t,e,!0,0),"Z"]})}static catParts(){return Vt.group([Vt.move(0,32,Vt.setProps(Vt.group([Vt.el("circle",{cx:29.1,cy:-3.3,r:3.4}),Vt.el("circle",{cx:59.2,cy:-3.3,r:3.4}),Vt.el("path",{d:"M45.6,0.1c-0.9,0-1.7-0.3-2.3-0.9c-0.6,0.6-1.3,0.9-2.2,0.9c-0.9,0-1.8-0.3-2.3-0.9c-1-1.1-1.1-2.6-1.1-2.8c0-0.5,0.5-1,1-1l0,0c0.6,0,1,0.5,1,1c0,0.4,0.1,1.7,1.4,1.7c0.5,0,0.7-0.2,0.8-0.3c0.3-0.3,0.4-1,0.4-1.3c0-0.1,0-0.1,0-0.2c0-0.5,0.5-1,1-1l0,0c0.5,0,1,0.4,1,1c0,0,0,0.1,0,0.2c0,0.3,0.1,0.9,0.4,1.2C44.8-2.2,45-2,45.5-2s0.7-0.2,0.8-0.3c0.3-0.4,0.4-1.1,0.3-1.3c0-0.5,0.4-1,0.9-1.1c0.5,0,1,0.4,1.1,0.9c0,0.2,0.1,1.8-0.8,2.8C47.5-0.4,46.8,0.1,45.6,0.1z"})]),{fill:"#000","fill-opacity":.6})),Vt.move(0,32,Vt.el("path",{d:"M73.1-15.6c1.7-4.2,4.5-9.1,5.8-8.5c1.6,0.8,5.4,7.9,5,15.4c0,0.6-0.7,0.7-1.1,0.5c-3-1.6-6.4-2.8-8.6-3.6C72.8-12.3,72.4-13.7,73.1-15.6z",fill:"#FFD5E6",transform:"translate(0, 32)"})),Vt.move(0,32,Vt.el("path",{d:"M22.4-15.6c-1.7-4.2-4.5-9.1-5.8-8.5c-1.6,0.8-5.4,7.9-5,15.4c0,0.6,0.7,0.7,1.1,0.5c3-1.6,6.4-2.8,8.6-3.6C22.8-12.3,23.2-13.7,22.4-15.6z",fill:"#FFD5E6",transform:"translate(0, 32)"}))])}static catHat(t,e,s){return Vt.group([Vt.path({...s,path:[Vt.getCatTop(t),Vt.getRightAndBottom(t,e,!0,0),"Z"]}),Vt.catParts()])}static getProcHatTop(t){return`M 0 20 a 20 20 0 0 1 20 -20 L ${t-20} 0 a 20,20 0 0,1 20,20`}static getProcCatTop(t){return`M 0 20 c 0,-7.1 3.7,-13.3 9.3,-16.9 c 1.7,-7.5 5.4,-13.2 7.6,-14.2 c 2.6,-1.3 10,6 14.6,11.1 h 33 c 4.6,-5.1 11.9,-12.4 14.6,-11.1 c 1.9,0.9 4.9,5.2 6.8,11.1 h 7.8 L ${t-20} 0 a 20,20 0 0,1 20,20`}static procHatRect(t,e,s){return Vt.path({...s,path:[Vt.getProcHatTop(t),Vt.getRightAndBottom(t,e,!0,0),"Z"]})}static procCatRect(t,e,s){return Vt.group([Vt.path({...s,path:[Vt.getProcCatTop(t),Vt.getRightAndBottom(t,e,!0,0),"Z"]}),Vt.move(0,-13,Vt.catParts())])}static mouthRect(t,e,s,i,o){let r=i[0].height;const c=[Vt.getTop(t),Vt.getRightAndBottom(t,r,!0,16)];for(let e=1;e<i.length;e+=2){const o=e+2===i.length,n=i[e];r+=n.height-3,n.isFinal?c.push(Vt.getArmNoNotch(t,r)):c.push(Vt.getArm(t,r));const a=!(o&&s),l=o?0:16;r+=i[e+1].height+3,c.push(Vt.getRightAndBottom(t,r,a,l))}return c.push("Z"),Vt.path({...o,path:c})}static commentRect(t,e,s){return Vt.roundRect(t,e,{...s,class:"sb3-comment"})}static commentLine(t,e){return Vt.move(-t,9,Vt.rect(t,2,{...e,class:"sb3-comment-line"}))}static strikethroughLine(t,e){return Vt.path({...e,path:["M",0,0,"L",t,0],class:"sb3-diff sb3-diff-del"})}}const mt=new Set(["dropdownArrow","turnRight","turnLeft","loopArrow","musicBlock","penBlock","videoBlock","faceSensingBlock","ttsBlock","translationBlock"]);class bt{static get cssContent(){return".sb3-label{font:500 12pt Helvetica Neue,Helvetica,sans-serif}.sb3-literal-dropdown,.sb3-literal-number,.sb3-literal-number-dropdown,.sb3-literal-string{word-spacing:0}.sb3-diff{fill:none;stroke:#000}.sb3-diff-ins{stroke-width:2px}.sb3-diff-del{stroke-width:3px}svg .sb3-motion{fill:#4c97ff;stroke:#3373cc}svg .sb3-motion-alt{fill:#4280d7}svg .sb3-motion-dark{fill:#3373cc}svg .sb3-looks{fill:#96f;stroke:#774dcb}svg .sb3-looks-alt{fill:#855cd6}svg .sb3-looks-dark{fill:#774dcb}svg .sb3-sound{fill:#cf63cf;stroke:#bd42bd}svg .sb3-sound-alt{fill:#c94fc9}svg .sb3-sound-dark{fill:#bd42bd}svg .sb3-control{fill:#ffab19;stroke:#cf8b17}svg .sb3-control-alt{fill:#ec9c13}svg .sb3-control-dark{fill:#cf8b17}svg .sb3-events{fill:#ffbf00;stroke:#c90}svg .sb3-events-alt{fill:#e6ac00}svg .sb3-events-dark{fill:#c90}svg .sb3-sensing{fill:#5cb1d6;stroke:#2e8eb8}svg .sb3-sensing-alt{fill:#47a8d1}svg .sb3-sensing-dark{fill:#2e8eb8}svg .sb3-operators{fill:#59c059;stroke:#389438}svg .sb3-operators-alt{fill:#46b946}svg .sb3-operators-dark{fill:#389438}svg .sb3-variables{fill:#ff8c1a;stroke:#db6e00}svg .sb3-variables-alt{fill:#ff8000}svg .sb3-variables-dark{fill:#db6e00}svg .sb3-list{fill:#ff661a;stroke:#e64d00}svg .sb3-list-alt{fill:#f50}svg .sb3-list-dark{fill:#e64d00}svg .sb3-custom{fill:#ff6680;stroke:#f35}svg .sb3-custom-alt{fill:#ff4d6a}svg .sb3-custom-dark{fill:#f35}svg .sb3-extension{fill:#0fbd8c;stroke:#0b8e69}svg .sb3-extension-alt{fill:#0da57a}svg .sb3-extension-dark{fill:#0b8e69}svg .sb3-obsolete{fill:#ed4242;stroke:#ca2b2b}svg .sb3-obsolete-alt{fill:#db3333}svg .sb3-obsolete-dark{fill:#ca2b2b}svg .sb3-grey{fill:#bfbfbf;stroke:#909090}svg .sb3-grey-alt{fill:#b2b2b2}svg .sb3-grey-dark{fill:#909090}svg .sb3-label{fill:#fff}svg .sb3-input-color{stroke:#fff}svg .sb3-input-number,svg .sb3-input-string{fill:#fff}svg .sb3-literal-number,svg .sb3-literal-string{fill:#575e75}svg .sb3-custom-arg{fill:#ff6680;stroke:#f35}svg .sb3-extension-line{stroke:#0da57a}svg.scratchblocks-style-scratch3-high-contrast .sb3-motion{fill:#80b5ff;stroke:#3373cc}svg.scratchblocks-style-scratch3-high-contrast .sb3-motion-alt{fill:#b3d2ff}svg.scratchblocks-style-scratch3-high-contrast .sb3-motion-dark{fill:#3373cc}svg.scratchblocks-style-scratch3-high-contrast .sb3-looks{fill:#ccb3ff;stroke:#774dcb}svg.scratchblocks-style-scratch3-high-contrast .sb3-looks-alt{fill:#dcf}svg.scratchblocks-style-scratch3-high-contrast .sb3-looks-dark{fill:#774dcb}svg.scratchblocks-style-scratch3-high-contrast .sb3-sound{fill:#e19de1;stroke:#bd42bd}svg.scratchblocks-style-scratch3-high-contrast .sb3-sound-alt{fill:#ffb3ff}svg.scratchblocks-style-scratch3-high-contrast .sb3-sound-dark{fill:#bd42bd}svg.scratchblocks-style-scratch3-high-contrast .sb3-control{fill:#ffbe4c;stroke:#cf8b17}svg.scratchblocks-style-scratch3-high-contrast .sb3-control-alt{fill:#ffda99}svg.scratchblocks-style-scratch3-high-contrast .sb3-control-dark{fill:#cf8b17}svg.scratchblocks-style-scratch3-high-contrast .sb3-events{fill:#ffd966;stroke:#c90}svg.scratchblocks-style-scratch3-high-contrast .sb3-events-alt{fill:#ffecb3}svg.scratchblocks-style-scratch3-high-contrast .sb3-events-dark{fill:#c90}svg.scratchblocks-style-scratch3-high-contrast .sb3-sensing{fill:#85c4e0;stroke:#2e8eb8}svg.scratchblocks-style-scratch3-high-contrast .sb3-sensing-alt{fill:#aed8ea}svg.scratchblocks-style-scratch3-high-contrast .sb3-sensing-dark{fill:#2e8eb8}svg.scratchblocks-style-scratch3-high-contrast .sb3-operators{fill:#7ece7e;stroke:#389438}svg.scratchblocks-style-scratch3-high-contrast .sb3-operators-alt{fill:#b5e3b5}svg.scratchblocks-style-scratch3-high-contrast .sb3-operators-dark{fill:#389438}svg.scratchblocks-style-scratch3-high-contrast .sb3-variables{fill:#ffa54c;stroke:#db6e00}svg.scratchblocks-style-scratch3-high-contrast .sb3-variables-alt{fill:#fc9}svg.scratchblocks-style-scratch3-high-contrast .sb3-variables-dark{fill:#db6e00}svg.scratchblocks-style-scratch3-high-contrast .sb3-list{fill:#f96;stroke:#e64d00}svg.scratchblocks-style-scratch3-high-contrast .sb3-list-alt{fill:#ffcab0}svg.scratchblocks-style-scratch3-high-contrast .sb3-list-dark{fill:#e64d00}svg.scratchblocks-style-scratch3-high-contrast .sb3-custom{fill:#f9a;stroke:#f35}svg.scratchblocks-style-scratch3-high-contrast .sb3-custom-alt{fill:#ffccd5}svg.scratchblocks-style-scratch3-high-contrast .sb3-custom-dark{fill:#f35}svg.scratchblocks-style-scratch3-high-contrast .sb3-extension{fill:#13ecaf;stroke:#0b8e69}svg.scratchblocks-style-scratch3-high-contrast .sb3-extension-alt{fill:#75f0cd}svg.scratchblocks-style-scratch3-high-contrast .sb3-extension-dark{fill:#0b8e69}svg.scratchblocks-style-scratch3-high-contrast .sb3-obsolete{fill:#fc6666;stroke:#d32121}svg.scratchblocks-style-scratch3-high-contrast .sb3-obsolete-alt{fill:#fcb0b0}svg.scratchblocks-style-scratch3-high-contrast .sb3-obsolete-dark{fill:#d32121}svg.scratchblocks-style-scratch3-high-contrast .sb3-grey{fill:#bfbfbf;stroke:#959595}svg.scratchblocks-style-scratch3-high-contrast .sb3-grey-alt{fill:#b2b2b2}svg.scratchblocks-style-scratch3-high-contrast .sb3-grey-dark{fill:#959595}svg.scratchblocks-style-scratch3-high-contrast .sb3-label{fill:#000}svg.scratchblocks-style-scratch3-high-contrast .sb3-input-color{stroke:#fff}svg.scratchblocks-style-scratch3-high-contrast .sb3-input-number,svg.scratchblocks-style-scratch3-high-contrast .sb3-input-string{fill:#fff}svg.scratchblocks-style-scratch3-high-contrast .sb3-literal-number,svg.scratchblocks-style-scratch3-high-contrast .sb3-literal-string{fill:#000}svg.scratchblocks-style-scratch3-high-contrast .sb3-custom-arg{fill:#f9a;stroke:#f35}svg.scratchblocks-style-scratch3-high-contrast .sb3-extension-line{stroke:#75f0cd}.sb3-comment{fill:#ffffa5;stroke:#d0d1d2;stroke-width:1}.sb3-comment-line{fill:#ffff80}.sb3-comment-label,.sb3-label.sb3-comment-label{font:400 12pt Helvetica Neue,Helvetica,sans-serif;fill:#000;word-spacing:0}"}static makeCommonIcons(){return[Vt.setProps(Vt.group([Vt.el("path",{d:"M20.8 3.7c-.4-.2-.9-.1-1.2.2-2 1.6-4.8 1.6-6.8 0-2.3-1.9-5.6-2.3-8.3-1v-.4c0-.6-.5-1-1-1s-1 .4-1 1v18.8c0 .5.5 1 1 1h.1c.5 0 1-.5 1-1v-6.4c1-.7 2.1-1.2 3.4-1.3 1.2 0 2.4.4 3.4 1.2 2.9 2.3 7 2.3 9.8 0 .3-.2.4-.5.4-.9V4.7c0-.5-.3-.9-.8-1zm-.3 10.2C18 16 14.4 16 11.9 14c-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2l.1.1-.1 9.2z",fill:"#45993d"}),Vt.el("path",{d:"M20.6 4.8l-.1 9.1v.1c-2.5 2-6.1 2-8.6 0-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2c0 .1.1.1.1.2z",fill:"#4cbf56"})]),{id:"sb3-greenFlag"}),Vt.setProps(Vt.el("polygon",{points:"6.6,0.5 13.12,0.5 19.5,6.6 19.5,13.12 13.12,19.5 6.6,19.5 0.5,13.12 0.5,6.6 ",fill:"#ec5959",stroke:"#b84848","stroke-linejoin":"round","stroke-linecap":"round"}),{id:"sb3-stopSign"}),Vt.el("path",{d:"M0 0L4 4L0 8Z",fill:"#111",id:"sb3-addInput"}),Vt.el("path",{d:"M4 0L4 8L0 4Z",fill:"#111",id:"sb3-delInput"}),Vt.setProps(Vt.group([Vt.el("rect",{x:"0",y:"0",width:"15",height:"18",fill:"#fff"}),Vt.el("rect",{x:"1",y:"1",width:"13",height:"4",fill:"#ff920f"}),Vt.el("rect",{x:"1",y:"7",width:"13",height:"4",fill:"#ff920f"}),Vt.el("rect",{x:"1",y:"13",width:"13",height:"4",fill:"#ff920f"})]),{id:"sb3-list"}),Vt.el("image",{id:"sb3-microbitBlock",width:"40px",height:"40px",href:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAACmlBMVEUAAAArKysrIB8lJCNBRlY2O0U9X48sKCvOoBQzKzMnJyfrswi/xdDRoxN2dnbToxPosgnmsAq/lxo6MSq0kCLOoRXKnhbEmhc7LRooJCTcqQ7OoBXstAjpsgi9lhuvjCCPdSd4Zyg2NjZMi+Slhyq8lR5CR1fZqBG+lh3ttQjFnBnLnhbDmhqZore3kh5ARlW2kR6qiCGcfyU6QEtyYyd4ZSDSoxOGdDedgizLnhfgrA25kx9YXWqbgCxMUWDfqwzcqg/VphBBR1ecpLmcgSzHmxijq77BmRprYkOOlKZARlVGdbabo7m3kRxGcrKwjB9ARVSIjaCZobuVeyahgh+VdyE8XIOLayBIOydBR1f/vwBMl//m5+g+Q1JlanY6P0uCiJjj5OU9QVBARVQ/RFP9vgBFZpjk5ebwtgbzuAR0eotARlZITl3d3+KNlKRQVmRNUmGxs7mRlJtUW2nLnhfInRfpsQn1uQS/wsa0t7qlp62doKeKjpeBg41YXmxCSlvGyMtHb6xCUGlCTGBJgdJDSFVobXlMlPhLhtq/wchIesFGbqpDVXRXXGxCTGNiXEe+lh1LjuzP0dRJg9RIfslJfMW9v8RGbKRFY5Jzd4NdYm88QE1+bjrQpCHQohTxtwVLkPDa3OHd3t9If826vMCusLZHcrGIj6F6gpaDho9ESlpITFOQeTLcqhnEmhnqsw34uwVKkfNNhdi6vMRLUWBPUFC7lzDWpx31uQjutQj6vAP5+frZ29zZ2dvW2NtHc7JGbKVFaJx/hpl/hpdxd4hzd4JDWHpDUm5UWWiZhEh3aT6WfC/EnSqtiyW/lxzBmRpKi+VQgMhRermqq7BSdrCLjpVEXYVEW4A/SFtOT1BaV0pxZUCpjT2xkTcYNOUYAAAAWXRSTlMADBgV5DRLEdcIE+3Z2QLt6unOI/zp1dEcDf7z7eu9qVtFBPv7+/fx7u3p3NnOzcq0lXZENzD6+fj39vTm5uXk4t3c2tbS0c/NvrCopKKcm4yLbGpiTUA3JzDAPbYAAAQqSURBVFjD7dX1fxJhHMDxE+MIRRFrdnd3d3fr9ziwhsVsmC2K6HRTtzlb0ens2uzu7m79X3z4HufdwTNvj/qbfPYaPDe+vMf23AEXL168/6bBTfoWx5r0GskxVMhsoDfg3Lb12LlzIwz0zKZYzzy0lkPVKtXdutXw++o2a5UQ7SUMcqibGpA8kD09slX0azRkazwISB5Inn4D+ShwrNYjIHpQQA96mqPAYlqPgOhBAT0oUpgGyh6C6EHYWz11e7jbO9hAxUMQPezR6+wtW0nBlJzV7CB62nIyN/mB5H/ouM0G0j3ITIXsAMDUVMjcygbSPQgqrzCNDaR7sCEzO2cLKSvlLNP/ED1qgbRbh0m37viBAUSPvU/BYFZWcAMFRI+9HW/fOFLSgAaixw6erZWS5qeBVG+XKwlghWsuwALXHIA5rgUAc10r1KADvViwKNDaLO4EWCQuA5gnLgVYKs4DWCYuUoPoFRhcKa4FWCwuB1gizgeYLy4BWC4uBqWPq9Cjg55EJ5bogUi7J0wBmDwhMXzjBHBOmAyQSG4wnPd4cJ4Kejbem4gdTQL9NPN00Hlk0jRs//0p+puinaeDs0XxwMFtk8RZM6fob4pmPl/wxtqkOcemIai7Kco8HTx/88Ns8dBxgMcrEdTfFKcyP/9m1xhwwbV30sBGCdTPqczPu9Y5BoTzZODAg6S5kT9Zf1PU8+fz25TrTJuizOd32kjtL9CmaOfpJ/Zd5UTV3RTtfP6X3mfl0tNNuVSpILYp5xHL25ccFUQv9cwGhrcvPZB4jgiovyn6IHrrZFB/U/RBf6rD8f4sgqzRwTtZQfKZGPiXm4Kxb8rff6awgf9sU5jTB9O79G63BqTW1C5baQ9geNSwvnIEJ8s2PCkPXqhTtlM6HUxvWpiv3h6kyozmDY2egnzUkjc3/3X0bAjPt3gW+VWVxvFtSn6hgi9acxzfeI001yiBs46pI7/AkjzHVSgjg5XIkwvXB+xbcxNnGraHCmZUr8nxJS/g3AlC1KzujQgnOpo5axufDFasYLUa2gK2p2ohzlTtJB2sV6NCNSECCtUq1Kj3CxSq2luXlY8gufF4e9PkCLiwpWFULg38+qKiILgFYe9Lr++07zSur4SXr7zeV5Gj0z5vxt69GVcFt1vI874kS6/0pDIZsWB6crLgzhNI+wRhOrm7Sr5n4HIhWeW5yRJ/EBYuS4+5yUN5Vy9fuewT6GDouQq8qAFDITX4/XmuDF788eTJRQpoD4PTT6nAXA14KVcNhshgBDx16VTokk9oZo4Czf0JiEkgpoCYApJkEPMJwxOiQFONDn8DlrRbuWjRXrWEzWKzlOhnLNfHWN5S2Va5cndjufLG8uWMpRs0sFmqdMNliRKlS1nIlw2Xxh5kWaVKC0NNLiarqdAfZ+LixYsX77f9BFJt17cXqnnkAAAAAElFTkSuQmCC"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M23.513 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M24.91 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z"}),Vt.el("path",{d:"M9.54 11.17h-.728c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M10.938 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479z"}),Vt.el("path",{d:"M26.305 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M27.702 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z"}),Vt.el("path",{d:"M29.101 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M30.498 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z"}),Vt.el("path",{d:"M17.925 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M19.322 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479z"}),Vt.el("path",{d:"M20.717 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M22.114 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z"}),Vt.el("path",{d:"M15.129 11.17H14.4c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M16.526 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z"}),Vt.el("path",{d:"M12.335 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.882v-1.08c0-.265-.26-.479-.577-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M13.732 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z"}),Vt.el("path",{d:"M31.893 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M33.29 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z"}),Vt.el("path",{d:"M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992",fill:"#FFF"}),Vt.el("path",{d:"M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992z",stroke:"#7C87A5","stroke-width":".893"}),Vt.el("path",{d:"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z",fill:"#FFF"}),Vt.el("path",{d:"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z",stroke:"#7C87A5","stroke-width":".893"}),Vt.el("path",{d:"M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z",fill:"#4C97FF"}),Vt.el("path",{d:"M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z",stroke:"#3D79CC","stroke-width":".893"}),Vt.el("path",{stroke:"#7C87A5","stroke-width":".893",d:"M4.47 20.474h27.961l2.157 2.974"}),Vt.el("path",{d:"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z",stroke:"#7C87A5","stroke-width":".893"}),Vt.el("path",{d:"M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z"}),Vt.el("path",{d:"M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479z"}),Vt.el("path",{d:"M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479z"}),Vt.el("path",{d:"M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479",fill:"#7C87A5"}),Vt.el("path",{d:"M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z"}),Vt.el("path",{d:"M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993",fill:"#E6E7E8"}),Vt.el("path",{d:"M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993z",stroke:"#7C87A5","stroke-width":".893"}),Vt.el("path",{d:"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z",fill:"#E6E7E8"}),Vt.el("path",{d:"M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z",stroke:"#7C87A5","stroke-width":".893"}),Vt.el("path",{fill:"#E6E7E8",d:"M19.53 24.438h11.294V20.47H19.529z"}),Vt.el("path",{stroke:"#7C87A5","stroke-width":".893",d:"M19.53 24.438h11.294V20.47H19.529zm12.902-3.964l2.157-2.794"})]),{id:"sb3-wedoBlock",fill:"none"}),Vt.setProps(Vt.group([Vt.el("rect",{stroke:"#7C87A5",fill:"#FFF",x:".5",y:"3.59",width:"28",height:"25.81",rx:"1"}),Vt.el("rect",{stroke:"#7C87A5",fill:"#E6E7E8",x:"2.5",y:".5",width:"24",height:"32",rx:"1"}),Vt.el("path",{stroke:"#7C87A5",fill:"#FFF",d:"M2.5 14.5h24v13h-24z"}),Vt.el("path",{d:"M14.5 10.5v4",stroke:"#7C87A5",fill:"#E6E7E8"}),Vt.el("rect",{fill:"#414757",x:"4.5",y:"2.5",width:"20",height:"10",rx:"1"}),Vt.el("rect",{fill:"#7C87A5",opacity:".5",x:"13.5",y:"20.13",width:"2",height:"2",rx:".5"}),Vt.el("path",{d:"M9.06 20.13h1.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1.5a1 1 0 0 1 0-2zM19.93 22.13h-1.51a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1.5a1 1 0 0 1 .01 2zM8.23 17.5H5a.5.5 0 0 1-.5-.5v-2.5h6l-1.85 2.78a.51.51 0 0 1-.42.22zM18.15 18.85l-.5.5a.49.49 0 0 0-.15.36V20a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-.29a.49.49 0 0 0-.15-.36l-.5-.5a.51.51 0 0 1 0-.71l1.51-1.49a.47.47 0 0 1 .35-.15h3.58a.47.47 0 0 1 .35.15l1.51 1.49a.51.51 0 0 1 0 .71zM10.85 23.45l.5-.5a.49.49 0 0 0 .15-.36v-.29a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.29a.49.49 0 0 0 .15.36l.5.5a.5.5 0 0 1 0 .7l-1.51 1.5a.47.47 0 0 1-.35.15h-3.58a.47.47 0 0 1-.35-.15l-1.51-1.5a.5.5 0 0 1 0-.7z",fill:"#7C87A5",opacity:".5"}),Vt.el("path",{d:"M21.5 27.5h5v4a1 1 0 0 1-1 1h-4v-5z",stroke:"#CC4C23",fill:"#F15A29"})]),{transform:"translate(5.5 3.5)",id:"sb3-ev3Block"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M35 28H5a1 1 0 0 1-1-1V12c0-.6.4-1 1-1h30c.5 0 1 .4 1 1v15c0 .5-.5 1-1 1z",fill:"#fff"}),Vt.el("path",{fill:"red",d:"M4 25h32v2.7H4zm9-1h-2.2a1 1 0 0 1-1-1v-9.7c0-.6.4-1 1-1H13c.6 0 1 .4 1 1V23c0 .6-.5 1-1 1z"}),Vt.el("path",{fill:"red",d:"M6.1 19.3v-2.2c0-.5.4-1 1-1h9.7c.5 0 1 .5 1 1v2.2c0 .5-.5 1-1 1H7.1a1 1 0 0 1-1-1z"}),Vt.el("circle",{fill:"red",cx:"22.8",cy:"18.2",r:"3.4"}),Vt.el("circle",{fill:"red",cx:"30.6",cy:"18.2",r:"3.4"}),Vt.el("path",{fill:"red",d:"M4.2 27h31.9v.7H4.2z"}),Vt.el("circle",{fill:"#e0e0e0",cx:"22.8",cy:"18.2",r:"2.3"}),Vt.el("circle",{fill:"#e0e0e0",cx:"30.6",cy:"18.2",r:"2.3"}),Vt.el("path",{fill:"#e0e0e0",d:"M12.5 22.9h-1.2c-.3 0-.5-.2-.5-.5V14c0-.3.2-.5.5-.5h1.2c.3 0 .5.2.5.5v8.4c0 .3-.2.5-.5.5z"}),Vt.el("path",{fill:"#e0e0e0",d:"M7.2 18.7v-1.2c0-.3.2-.5.5-.5h8.4c.3 0 .5.2.5.5v1.2c0 .3-.2.5-.5.5H7.7c-.3 0-.5-.2-.5-.5zM4 26h32v2H4z"}),Vt.el("path",{stroke:"#666","stroke-width":".5",d:"M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z"}),Vt.el("path",{stroke:"#666","stroke-width":".5",d:"M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z"})]),{id:"sb3-makeymakeyBlock",fill:"none"}),Vt.el("image",{id:"sb3-gdxforBlock",width:"40px",height:"40px",href:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAABAlBMVEUAAAABAQEAAAB9h6YAAAAAAAAAAAB8iKZ7iKaAjKvm5+h+iqhcXFxGR0d8iKbj5OV9iKZ8h6be3+Db3d19h6acnJ0AAAB7nrDh4uPh4uN9iabZ2tt9iKbX19nJycnExsZ8iKe+wMC7vL2Eka/g4ePU1dV8iKZ9iKZ9iKd+iKitra2RkZGLjo5wcHCLi7l0oqJV//9csdZ8h6WFkq//vwDm5+iEka79vgJ6iql9iaaHk6tgq9Btm71+iadmo8dzk7OCj6yAjKp/iqhiqc1qnsB4jKtgrNFwl7d1tLTgtCxpocN0krJ2j65ossWNtZSbt4LAulHWsDnasTTuvhXzvg9zk7TzqAfaAAAAMXRSTlMAJiLoFBwI8q4a+0c4M/nr3tnQwKxYDAnk2726tbGMh4J9dinXq56ddG9nT01ACwsDk/+seAAAAidJREFUWMPt2Olu2kAUhuE5NvuaBAhZm7TpvufgMXaBbmAghOzp/d9KD7RW6yaqPeL7YVV9/471aBgfCXnUH7ULNhtkF96qv1dgwwoxoM08cDsJcwfMdgwonoiJPRFjQXkscQM3Adhxk4NuJwkoDx0nSp5NDTiae958NEaBwzkvC4YYcOxx7fCoeJhnrwcBv7H9TklFm08R4JD5SEkiMg8B4IjXwsV1HgHAPu+EizsQcMbr2B0OufZz7X0NcIZSwC9+rD3nADI2/fCtrHEfAvZ8Liqp6PuIwZZO+ZmSnspcY8AZ55WU5xkElDwuK1Vm7xgFTjhfLud5AgPHAUvBGARKvYnnTXpp/gvAg9PLyykSPLt1nNszIHjuSOdAcNp1nO4UeYYXNzcX0UH62P+0AnjH8lgCgL8s/+uXzwZgrOV2JAMwxpIMwRjLHIyxzMEYyxyMWgAwYiHAzm99iLQ6eOJEul4d7Ea6WhG8W7rAE+fertHgVXp+clpB9Oet64M/wH2TKwI/FrRFTH6JIZ6NvmZpxoDtptlFULOtzGPWy+4/r//gvwKGgcC90NtTqIg2dIuyClaWDvTjKlDMLba4UaUMcIuVbd0gyiGwjGVlFuKWfkQZhEfSQnypd8mCvOHGvkA5quo6EQSs6yrlNumN3obs0KKGHJ70QD+hLOQMW7r0sFI5KJVeY+bGkr1JopKlEG0StXbrW/uvQGMookXLLPFAZYTMJju/7z6rRW1MZcnIAAAAAElFTkSuQmCC"}),Vt.el("image",{id:"sb3-boostBlock",width:"40px",height:"40px",href:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQBAMAAAB8P++eAAAAKlBMVEUAAAD///98h6Xm5+iVnrb/Zhq+w9L5hk73+Pnf4eSQmbLr7Ozo39vp184hSCf6AAAAAXRSTlMAQObYZgAAAOFJREFUSMftlDEOgjAUhonhAi1sLvIk7NDJDTYu0LhzBzcXruHoDTyFB/BCNi30KU3InzioSb++hAS+vPfKa5pEIpHvk7a8gpf8ISWINtlg4i7ZFOKVTBlqsUR+ItYZJG7VzQQgMqGYd7zWRArpULEAe5Q/J9JMj4rluC7uleNw7TFRXcoREDnlinjX57eUsvRTn8+AE0/6OKV0g5buYTTyWFFr/XAp3aDzed4yFJWnKbhPbtaXXohDNYlDJWz4zSxEokkkEjb496AiVtqAbIYgYNGWBmhgES+NX6SRSORfeAJMWajr95DdqQAAAABJRU5ErkJggg=="})]}static makeOriginalIcons(){return[...bt.makeCommonIcons(),Vt.setProps(Vt.group([Vt.el("path",{d:"M12.71 2.44A2.41 2.41 0 0 1 12 4.16L8.08 8.08a2.45 2.45 0 0 1-3.45 0L.72 4.16A2.42 2.42 0 0 1 0 2.44 2.48 2.48 0 0 1 .71.71C1 .47 1.43 0 6.36 0s5.39.46 5.64.71a2.44 2.44 0 0 1 .71 1.73z",fill:"#231f20",opacity:".1"}),Vt.el("path",{d:"M6.36 7.79a1.43 1.43 0 0 1-1-.42L1.42 3.45a1.44 1.44 0 0 1 0-2c.56-.56 9.31-.56 9.87 0a1.44 1.44 0 0 1 0 2L7.37 7.37a1.43 1.43 0 0 1-1.01.42z",fill:"#fff"})]),{id:"sb3-dropdownArrow",transform:"scale(0.94413847364)"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M22.68 12.2a1.6 1.6 0 0 1-1.27.63h-7.69a1.59 1.59 0 0 1-1.16-2.58l1.12-1.41a4.82 4.82 0 0 0-3.14-.77 4.31 4.31 0 0 0-2 .8A4.25 4.25 0 0 0 7.2 10.6a5.06 5.06 0 0 0 .54 4.62A5.58 5.58 0 0 0 12 17.74a2.26 2.26 0 0 1-.16 4.52A10.25 10.25 0 0 1 3.74 18a10.14 10.14 0 0 1-1.49-9.22 9.7 9.7 0 0 1 2.83-4.14A9.92 9.92 0 0 1 9.66 2.5a10.66 10.66 0 0 1 7.72 1.68l1.08-1.35a1.57 1.57 0 0 1 1.24-.6 1.6 1.6 0 0 1 1.54 1.21l1.7 7.37a1.57 1.57 0 0 1-.26 1.39z",fill:"#3d79cc"}),Vt.el("path",{d:"M21.38 11.83h-7.61a.59.59 0 0 1-.43-1l1.75-2.19a5.9 5.9 0 0 0-4.7-1.58 5.07 5.07 0 0 0-4.11 3.17A6 6 0 0 0 7 15.77a6.51 6.51 0 0 0 5 2.92 1.31 1.31 0 0 1-.08 2.62 9.3 9.3 0 0 1-7.35-3.82 9.16 9.16 0 0 1-1.4-8.37A8.51 8.51 0 0 1 5.71 5.4a8.76 8.76 0 0 1 4.11-1.92 9.71 9.71 0 0 1 7.75 2.07l1.67-2.1a.59.59 0 0 1 1 .21L22 11.08a.59.59 0 0 1-.62.75z",fill:"#fff"})]),{id:"sb3-turnRight"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M20.34 18.21a10.24 10.24 0 0 1-8.1 4.22 2.26 2.26 0 0 1-.16-4.52 5.58 5.58 0 0 0 4.25-2.53 5.06 5.06 0 0 0 .54-4.62A4.25 4.25 0 0 0 15.55 9a4.31 4.31 0 0 0-2-.8 4.82 4.82 0 0 0-3.15.8l1.12 1.41A1.59 1.59 0 0 1 10.36 13H2.67a1.56 1.56 0 0 1-1.26-.63A1.54 1.54 0 0 1 1.13 11l1.72-7.43A1.59 1.59 0 0 1 4.38 2.4a1.57 1.57 0 0 1 1.24.6L6.7 4.35a10.66 10.66 0 0 1 7.72-1.68A9.88 9.88 0 0 1 19 4.81 9.61 9.61 0 0 1 21.83 9a10.08 10.08 0 0 1-1.49 9.21z",fill:"#3d79cc"}),Vt.el("path",{d:"M19.56 17.65a9.29 9.29 0 0 1-7.35 3.83 1.31 1.31 0 0 1-.08-2.62 6.53 6.53 0 0 0 5-2.92 6.05 6.05 0 0 0 .67-5.51 5.32 5.32 0 0 0-1.64-2.16 5.21 5.21 0 0 0-2.48-1A5.86 5.86 0 0 0 9 8.84L10.74 11a.59.59 0 0 1-.43 1H2.7a.6.6 0 0 1-.6-.75l1.71-7.42a.59.59 0 0 1 1-.21l1.67 2.1a9.71 9.71 0 0 1 7.75-2.07 8.84 8.84 0 0 1 4.12 1.92 8.68 8.68 0 0 1 2.54 3.72 9.14 9.14 0 0 1-1.33 8.36z",fill:"#fff"})]),{id:"sb3-turnLeft"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M23.3 11c-.3.6-.9 1-1.5 1h-1.6c-.1 1.3-.5 2.5-1.1 3.6-.9 1.7-2.3 3.2-4.1 4.1-1.7.9-3.6 1.2-5.5.9-1.8-.3-3.5-1.1-4.9-2.3-.7-.7-.7-1.9 0-2.6.6-.6 1.6-.7 2.3-.2H7c.9.6 1.9.9 2.9.9s1.9-.3 2.7-.9c1.1-.8 1.8-2.1 1.8-3.5h-1.5c-.9 0-1.7-.7-1.7-1.7 0-.4.2-.9.5-1.2l4.4-4.4c.7-.6 1.7-.6 2.4 0L23 9.2c.5.5.6 1.2.3 1.8z",fill:"#cf8b17"}),Vt.el("path",{d:"M21.8 11h-2.6c0 1.5-.3 2.9-1 4.2-.8 1.6-2.1 2.8-3.7 3.6-1.5.8-3.3 1.1-4.9.8-1.6-.2-3.2-1-4.4-2.1-.4-.3-.4-.9-.1-1.2.3-.4.9-.4 1.2-.1 1 .7 2.2 1.1 3.4 1.1s2.3-.3 3.3-1c.9-.6 1.6-1.5 2-2.6.3-.9.4-1.8.2-2.8h-2.4c-.4 0-.7-.3-.7-.7 0-.2.1-.3.2-.4l4.4-4.4c.3-.3.7-.3.9 0L22 9.8c.3.3.4.6.3.9s-.3.3-.5.3z",fill:"#fff"})]),{id:"sb3-loopArrow"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M28.456 21.675c-.009-.312-.087-.825-.256-1.702-.096-.495-.612-3.022-.753-3.73-.395-1.98-.76-3.92-1.142-6.113-.732-4.223-.693-6.05.344-6.527.502-.23 1.06-.081 1.842.35.413.227 2.181 1.365 2.07 1.296 1.993 1.243 3.463 1.775 4.928 1.549 1.527-.237 2.505-.06 2.877.618.348.635.015 1.416-.729 2.18-1.473 1.516-3.976 2.514-5.849 2.023-.822-.218-1.238-.464-2.38-1.266a9.737 9.737 0 0 0-.095-.066c.047.593.264 1.74.717 3.803.294 1.336 2.079 9.187 2.637 11.674l.002.012c.529 2.637-1.872 4.724-5.235 4.724-3.29 0-6.363-1.988-6.862-4.528-.53-2.64 1.873-4.734 5.233-4.734a8.411 8.411 0 0 1 2.65.437zM11.46 27.666c-.01-.319-.091-.84-.266-1.738-.09-.46-.595-2.937-.753-3.727-.39-1.96-.752-3.892-1.131-6.07-.732-4.224-.692-6.052.344-6.527.502-.23 1.06-.082 1.841.349.414.228 2.181 1.365 2.07 1.296 1.992 1.243 3.461 1.775 4.925 1.549 1.525-.24 2.504-.064 2.876.614.348.635.015 1.415-.728 2.18-1.474 1.517-3.977 2.513-5.847 2.017-.822-.218-1.237-.463-2.38-1.266a9.729 9.729 0 0 0-.094-.065c.047.593.264 1.74.717 3.802.294 1.337 2.078 9.19 2.636 11.675l.003.013c.517 2.638-1.884 4.732-5.234 4.732-3.286 0-6.359-1.993-6.87-4.54-.518-2.639 1.885-4.73 5.242-4.73.904 0 1.802.15 2.65.436z",stroke:"#000","stroke-opacity":".1"}),Vt.el("path",{d:"M32.18 25.874C32.636 28.157 30.512 30 27.433 30c-3.07 0-5.923-1.843-6.372-4.126-.458-2.285 1.665-4.136 4.743-4.136.647 0 1.283.084 1.89.234a7 7 0 0 1 .938.302c.87-.02-.104-2.294-1.835-12.229-2.134-12.303 3.06-1.87 8.768-2.753 5.708-.885.076 4.82-3.65 3.844-3.724-.987-4.65-7.153.263 14.738zm-16.998 5.99C15.63 34.148 13.507 36 10.439 36c-3.068 0-5.92-1.852-6.379-4.136-.448-2.284 1.674-4.135 4.751-4.135 1.002 0 1.974.197 2.854.544.822-.055-.15-2.377-1.862-12.228-2.133-12.303 3.059-1.87 8.764-2.753 5.706-.894.076 4.821-3.648 3.834-3.723-.987-4.648-7.152.263 14.738z",fill:"#FFF"})]),{id:"sb3-musicBlock",fill:"none"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M8.753 34.602l-4.251 1.779 1.784-4.236c1.218-2.892 2.907-5.423 5.03-7.538L31.066 4.93c.846-.842 2.65-.41 4.032.967 1.38 1.375 1.816 3.173.97 4.015L16.318 29.59c-2.123 2.116-4.664 3.799-7.565 5.012",fill:"#FFF"}),Vt.el("path",{d:"M29.41 6.111s-4.45-2.379-8.202 5.771c-1.734 3.766-4.35 1.546-4.35 1.546"}),Vt.el("path",{d:"M36.42 8.825c0 .463-.14.873-.432 1.164l-9.335 9.301c.282-.29.41-.668.41-1.12 0-.874-.507-1.963-1.406-2.868-1.362-1.358-3.147-1.8-4.002-.99L30.99 5.01c.844-.84 2.65-.41 4.035.96.898.904 1.396 1.982 1.396 2.855M10.515 33.774a23.74 23.74 0 0 1-1.764.83L4.5 36.382l1.786-4.235c.258-.604.529-1.186.833-1.757.69.183 1.449.625 2.109 1.282.659.658 1.102 1.412 1.287 2.102",fill:"#4C97FF"}),Vt.el("path",{d:"M36.498 8.748c0 .464-.141.874-.433 1.165l-19.742 19.68c-2.131 2.111-4.673 3.793-7.572 5.01L4.5 36.381l.974-2.317 1.925-.808c2.899-1.218 5.441-2.899 7.572-5.01l19.742-19.68c.292-.292.432-.702.432-1.165 0-.647-.27-1.4-.779-2.123.249.172.498.377.736.614.898.905 1.396 1.983 1.396 2.856",fill:"#575E75",opacity:".15"}),Vt.el("path",{d:"M18.45 12.831a.904.904 0 1 1-1.807 0 .904.904 0 0 1 1.807 0z",fill:"#575E75"})]),{id:"sb3-penBlock",stroke:"#575E75",fill:"none","stroke-linejoin":"round"}),Vt.setProps(Vt.group([Vt.el("circle",{opacity:.25,cx:32,cy:16,r:4.5}),Vt.el("circle",{opacity:.5,cx:32,cy:12,r:4.5}),Vt.el("circle",{opacity:.75,cx:32,cy:8,r:4.5}),Vt.el("circle",{cx:32,cy:4,r:4.5}),Vt.el("path",{d:"M22.672 4.42l-6.172 4V6.1c0-2.01-1.563-3.6-3.5-3.6H4.1C2.076 2.5.5 4.076.5 6.1V14c0 1.927 1.584 3.512 3.6 3.6H13c1.902 0 3.5-1.653 3.5-3.6v-2.283l6.257 3.754.097.075c.02.02.098.054.146.054.267 0 .5-.217.5-.5V4.8c0 .037-.056-.094-.129-.243-.145-.242-.43-.299-.7-.137z",fill:"#4D4D4D","stroke-linejoin":"round"})]),{id:"sb3-videoBlock",stroke:"#000",fill:"#FFF","stroke-opacity":.15}),Vt.setProps(Vt.group([Vt.el("circle",{cx:8.35,cy:9.65,r:.97,fill:"#FFF"}),Vt.el("circle",{cx:14.19,cy:9.65,r:.97,fill:"#FFF"}),Vt.el("path",{d:"M11.27 4.14c-3.94 0-7.13 3.19-7.13 7.13s3.19 7.13 7.13 7.13 7.13-3.19 7.13-7.13-3.19-7.13-7.13-7.13m0 1.3c3.22 0 5.84 2.61 5.84 5.84s-2.61 5.84-5.84 5.84-5.84-2.61-5.84-5.84 2.61-5.84 5.84-5.84",fill:"#FFF"}),Vt.el("path",{d:"M17.57 13.88c.57-.15 1.02-.6 1.17-1.17l.35-1.3c.16-.61 1.04-.61 1.2 0l.35 1.3c.15.57.6 1.02 1.18 1.17l1.3.35c.61.16.61 1.04 0 1.2l-1.3.35c-.57.15-1.02.6-1.18 1.17l-.35 1.3c-.17.62-1.04.62-1.2 0l-.35-1.3c-.15-.57-.6-1.02-1.17-1.17l-1.3-.35c-.61-.17-.61-1.04 0-1.2l1.3-.35Zm-16-11.43c.43-.12.76-.45.88-.88l.26-.98c.12-.46.78-.46.9 0l.26.98c.12.43.45.76.88.88l.98.26c.46.12.46.78 0 .9l-.98.26c-.43.11-.77.45-.88.88l-.26.98c-.12.46-.78.46-.9 0l-.26-.98a1.26 1.26 0 0 0-.88-.88l-.98-.26c-.46-.12-.46-.78 0-.9z",fill:"#ffbf00","fill-rule":"evenodd",stroke:"#0b8e69","stroke-miterlimit":"2","stroke-width":".5"}),Vt.el("path",{d:"M12.68 12.53c.2-.3.6-.38.9-.18s.38.6.18.9c-.56.83-1.41 1.26-2.48 1.26s-1.93-.43-2.48-1.26c-.2-.3-.12-.7.18-.9s.7-.12.9.18c.31.46.75.68 1.41.68s1.1-.22 1.41-.68Z",fill:"#FFF"}),Vt.el("path",{d:"M20.89 6.06a.57.57 0 0 1-.57-.57V2.2h-3.31c-.31 0-.57-.25-.57-.57s.25-.57.57-.57h3.88c.31 0 .57.25.57.57v3.86c0 .31-.25.57-.57.57M5.44 21.46H1.59a.57.57 0 0 1-.57-.57v-3.82c0-.31.25-.57.57-.57s.57.25.57.57v3.25h3.28c.31 0 .57.25.57.57s-.25.57-.57.57",fill:"#0b8e69"})]),{id:"sb3-faceSensingBlock",transform:"scale(1.67785234899 1.67785234899)"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M25.644 20.5c-1.667 1.937-4.539 3.429-5.977 3.429a1.25 1.25 0 0 1-.557-.137c-.372-.186-.61-.542-.61-1.03 0-.105.017-.207.05-.308.076-.236.624-.986.727-1.173.27-.484.462-1.075.566-1.865A8.5 8.5 0 0 1 24 3.5h4a8.5 8.5 0 1 1 0 17h-2.356z",fill:"#FFF"}),Vt.el("path",{d:"M15.5 21.67c0-1.016-1.494-1.586-2.387-.782l-2.7 2.163A5.958 5.958 0 0 1 6.7 24.33h-.4c-1.035 0-1.8.69-1.8 1.573v4.235c0 .883.765 1.572 1.8 1.572h.4c1.458 0 2.754.423 3.82 1.287l2.598 2.161c.908.75 2.382.188 2.382-.876V21.67z",fill:"#4D4D4D"})]),{id:"sb3-ttsBlock",stroke:"#000","stroke-opacity":.15}),Vt.el("image",{id:"sb3-translateBlock",width:"40px",height:"40px",href:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAA21BMVEUAAAAAAAAAAAAAAADS0tIAAABHR0cAAADX19cAAAAAAACkpKRqamq2traurq6WlpbV1dWEhITHx8fPz8/Ly8vDw8O9vb0AAABMTEz////Z2dlXXnVMl//g4ODu7u7m5ub4+PhPmf/x8fH09PT6+vri4uNRmv/r6+1uqv/0+P9Ynv/p8v+rrrphZ33S5f+51v9ho/+1uMKBhpfH3v+Wmqhrcoacxf+Pvv/KzNSgpLGLkKDd6/+rzf9npv/AwsuDtv98s/90rv9jpP9GieeOrtm5ubl2fI7Z4u56otk5hEFfAAAAGXRSTlMAJhgM1wYyHvIkEWpBhXhc5U+uybyhk0YvleQYgwAABDpJREFUWMPtmNl6mzAQhQMCBAYbvLX1GIwxi7e2TtosTdKk+/L+T1QBVoQtJHDby5yLROYTPzOagSM4e9az6oVUrDgKxh39//Bwb+QBkTZ2VL3hypYilKWicpY6gmWcTCbxIoSh0xHjOkZXA4m0rlGcrcBsslcSmrYq4qm2GczmE6Hms6A8W4GQHZ1BTxXweuTCErGz1TEEaTpLymML6HVq87VhIWPRs21yNu679guNXn9hOnWVMUwanzxG0yCTdYQQts195umwJmnUDSatFHQRPaVvljkl4CAuRlWrCfD9uiZEbR+ObrnjfRDhwHUtdAi0gK/vLtts+VqDVfIMjZSmLEycBuD1D4kK8MHc+Ju3/FFQaHdXc4rBU/8NiCE+OJyAIQKuz32qjA7O1xzwqMtiUETAXeRzinZcyoPgsPpDcco3q9WD729WhTI/e1itbriUzwwtqPI0Q5et4ZoA6SDj1pCWOeB44qJ88aOiIB8j/xMH5IiUJwG+jfyHPMCNH20FQEpkPGnbnBeFuI78Fd82VWJCeTyQCzHb3pMCb8VAQhxBCkPKkzf2Z9J9mR9dCxqb3tBO17EoTw4ky0f0VXSnUCGE6LDp1tvlwK0cyNQMJA1DlL3Px8TenvTjpcAN5cD7VVSsoR992c4oS+aGcuDbzxFBfVqvv5L/375DCzeUAXfnOW5TJHudffvdzg3FwPdZvnbX6/LXr+9t3ZCzAAaMNh/X9BdAWzcUm9T2vnrpk91QbqOhLEDeDZuNHkBSX94Nm7ciAJOWAkW8WZIDl1MikAD57ZwceJsDL0VAfsPJwgzzO5cHvsmBb2IJkAlhB5InntlXlJcc8MO00GMzsHTbsMJDdU+hOxIeCfKuXYQu7ZJ5oDmExwPjfAEvyZ9lGyDW9tOWMH6l1z4nLwjrQ572RRugAvMS57mq4MH7czq9Kgpz1QZoDcI4DsHrWUjw4E1JbLeTSZ5z2gLYMTTwBnaOEwBvS1Ke86UUyF7isKpLrIHkSvVGBORdUQx8nFb0KAUy38aSCO8I510hMrhrBOrGEFIYGToPZM+Fn+XwiraiAMh2Uwnb+3DAC9Z/t3TIA2W7MwZkYbH+uZIC+f0jD3z9+vXF05hIAJTtcK3TLIDnMSLnhqeZlDo8eksYqH/3UskWPz7aCuDTX3urMiA5ejHCp7+YV4W9gxBnMFJP/XRwKNT3IEhLZpIGQMp86seNY6LlutRQgrFr6dLPLyELjm44eemIWt6C+JP0A1HffCIm4GDEw2jvpNTxbIwQ0kUTUYUYkgYTSXfMBU1Ee+G6fSwkOlpA/RFcJCR2erRHkllKSjNWhdd+NQbqkJrgunyPhKBIprpeiZyLZtEeCRNWQdlUZPU8yF1yYJ1J1HGGEC5iknS8pN0tRtoDDzTSNDLpqjMu2s4b9fBZg/TcJVHjrA7GSl/JZz7rWbX6A0ZzUfwVEqfrAAAAAElFTkSuQmCC"})]}static makeHighContrastIcons(){return[...bt.makeCommonIcons(),Vt.setProps(Vt.group([Vt.el("path",{d:"M12.71 2.44A2.41 2.41 0 0 1 12 4.16L8.08 8.08a2.45 2.45 0 0 1-3.45 0L.72 4.16A2.42 2.42 0 0 1 0 2.44 2.48 2.48 0 0 1 .71.71C1 .47 1.43 0 6.36 0s5.39.46 5.64.71a2.44 2.44 0 0 1 .71 1.73z",fill:"#231f20",opacity:".1"}),Vt.el("path",{d:"M6.36 7.79a1.43 1.43 0 0 1-1-.42L1.42 3.45a1.44 1.44 0 0 1 0-2c.56-.56 9.31-.56 9.87 0a1.44 1.44 0 0 1 0 2L7.37 7.37a1.43 1.43 0 0 1-1.01.42z",fill:"#000"})]),{id:"sb3-dropdownArrow-high-contrast",transform:"scale(0.944)"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M22.68 12.2a1.6 1.6 0 0 1-1.27.63h-7.69a1.59 1.59 0 0 1-1.16-2.58l1.12-1.41a4.82 4.82 0 0 0-3.14-.77 4.31 4.31 0 0 0-2 .8A4.25 4.25 0 0 0 7.2 10.6a5.06 5.06 0 0 0 .54 4.62A5.58 5.58 0 0 0 12 17.74a2.26 2.26 0 0 1-.16 4.52A10.25 10.25 0 0 1 3.74 18a10.14 10.14 0 0 1-1.49-9.22 9.7 9.7 0 0 1 2.83-4.14A9.92 9.92 0 0 1 9.66 2.5a10.66 10.66 0 0 1 7.72 1.68l1.08-1.35a1.57 1.57 0 0 1 1.24-.6 1.6 1.6 0 0 1 1.54 1.21l1.7 7.37a1.57 1.57 0 0 1-.26 1.39z",fill:"#000"}),Vt.el("path",{d:"M21.38 11.83h-7.61a.59.59 0 0 1-.43-1l1.75-2.19a5.9 5.9 0 0 0-4.7-1.58 5.07 5.07 0 0 0-4.11 3.17A6 6 0 0 0 7 15.77a6.51 6.51 0 0 0 5 2.92 1.31 1.31 0 0 1-.08 2.62 9.3 9.3 0 0 1-7.35-3.82 9.16 9.16 0 0 1-1.4-8.37A8.51 8.51 0 0 1 5.71 5.4a8.76 8.76 0 0 1 4.11-1.92 9.71 9.71 0 0 1 7.75 2.07l1.67-2.1a.59.59 0 0 1 1 .21L22 11.08a.59.59 0 0 1-.62.75z",fill:"#000"})]),{id:"sb3-turnRight-high-contrast"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M20.34 18.21a10.24 10.24 0 0 1-8.1 4.22 2.26 2.26 0 0 1-.16-4.52 5.58 5.58 0 0 0 4.25-2.53 5.06 5.06 0 0 0 .54-4.62A4.25 4.25 0 0 0 15.55 9a4.31 4.31 0 0 0-2-.8 4.82 4.82 0 0 0-3.15.8l1.12 1.41A1.59 1.59 0 0 1 10.36 13H2.67a1.56 1.56 0 0 1-1.26-.63A1.54 1.54 0 0 1 1.13 11l1.72-7.43A1.59 1.59 0 0 1 4.38 2.4a1.57 1.57 0 0 1 1.24.6L6.7 4.35a10.66 10.66 0 0 1 7.72-1.68A9.88 9.88 0 0 1 19 4.81 9.61 9.61 0 0 1 21.83 9a10.08 10.08 0 0 1-1.49 9.21z",fill:"#000"}),Vt.el("path",{d:"M19.56 17.65a9.29 9.29 0 0 1-7.35 3.83 1.31 1.31 0 0 1-.08-2.62 6.53 6.53 0 0 0 5-2.92 6.05 6.05 0 0 0 .67-5.51 5.32 5.32 0 0 0-1.64-2.16 5.21 5.21 0 0 0-2.48-1A5.86 5.86 0 0 0 9 8.84L10.74 11a.59.59 0 0 1-.43 1H2.7a.6.6 0 0 1-.6-.75l1.71-7.42a.59.59 0 0 1 1-.21l1.67 2.1a9.71 9.71 0 0 1 7.75-2.07 8.84 8.84 0 0 1 4.12 1.92 8.68 8.68 0 0 1 2.54 3.72 9.14 9.14 0 0 1-1.33 8.36z",fill:"#000"})]),{id:"sb3-turnLeft-high-contrast"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M23.3 11c-.3.6-.9 1-1.5 1h-1.6c-.1 1.3-.5 2.5-1.1 3.6-.9 1.7-2.3 3.2-4.1 4.1-1.7.9-3.6 1.2-5.5.9-1.8-.3-3.5-1.1-4.9-2.3-.7-.7-.7-1.9 0-2.6.6-.6 1.6-.7 2.3-.2H7c.9.6 1.9.9 2.9.9s1.9-.3 2.7-.9c1.1-.8 1.8-2.1 1.8-3.5h-1.5c-.9 0-1.7-.7-1.7-1.7 0-.4.2-.9.5-1.2l4.4-4.4c.7-.6 1.7-.6 2.4 0L23 9.2c.5.5.6 1.2.3 1.8z",fill:"#000"}),Vt.el("path",{d:"M21.8 11h-2.6c0 1.5-.3 2.9-1 4.2-.8 1.6-2.1 2.8-3.7 3.6-1.5.8-3.3 1.1-4.9.8-1.6-.2-3.2-1-4.4-2.1-.4-.3-.4-.9-.1-1.2.3-.4.9-.4 1.2-.1 1 .7 2.2 1.1 3.4 1.1s2.3-.3 3.3-1c.9-.6 1.6-1.5 2-2.6.3-.9.4-1.8.2-2.8h-2.4c-.4 0-.7-.3-.7-.7 0-.2.1-.3.2-.4l4.4-4.4c.3-.3.7-.3.9 0L22 9.8c.3.3.4.6.3.9s-.3.3-.5.3z",fill:"#000"})]),{id:"sb3-loopArrow-high-contrast"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M28.456 21.675c-.009-.312-.087-.825-.256-1.702-.096-.495-.612-3.022-.753-3.73-.395-1.98-.76-3.92-1.142-6.113-.732-4.223-.693-6.05.344-6.527.502-.23 1.06-.081 1.842.35.413.227 2.181 1.365 2.07 1.296 1.993 1.243 3.463 1.775 4.928 1.549 1.527-.237 2.505-.06 2.877.618.348.635.015 1.416-.729 2.18-1.473 1.516-3.976 2.514-5.849 2.023-.822-.218-1.238-.464-2.38-1.266a9.737 9.737 0 0 0-.095-.066c.047.593.264 1.74.717 3.803.294 1.336 2.079 9.187 2.637 11.674l.002.012c.529 2.637-1.872 4.724-5.235 4.724-3.29 0-6.363-1.988-6.862-4.528-.53-2.64 1.873-4.734 5.233-4.734a8.411 8.411 0 0 1 2.65.437zM11.46 27.666c-.01-.319-.091-.84-.266-1.738-.09-.46-.595-2.937-.753-3.727-.39-1.96-.752-3.892-1.131-6.07-.732-4.224-.692-6.052.344-6.527.502-.23 1.06-.082 1.841.349.414.228 2.181 1.365 2.07 1.296 1.992 1.243 3.461 1.775 4.925 1.549 1.525-.24 2.504-.064 2.876.614.348.635.015 1.415-.728 2.18-1.474 1.517-3.977 2.513-5.847 2.017-.822-.218-1.237-.463-2.38-1.266a9.729 9.729 0 0 0-.094-.065c.047.593.264 1.74.717 3.802.294 1.337 2.078 9.19 2.636 11.675l.003.013c.517 2.638-1.884 4.732-5.234 4.732-3.286 0-6.359-1.993-6.87-4.54-.518-2.639 1.885-4.73 5.242-4.73.904 0 1.802.15 2.65.436z",stroke:"#000"}),Vt.el("path",{d:"M32.18 25.874C32.636 28.157 30.512 30 27.433 30c-3.07 0-5.923-1.843-6.372-4.126-.458-2.285 1.665-4.136 4.743-4.136.647 0 1.283.084 1.89.234a7 7 0 0 1 .938.302c.87-.02-.104-2.294-1.835-12.229-2.134-12.303 3.06-1.87 8.768-2.753 5.708-.885.076 4.82-3.65 3.844-3.724-.987-4.65-7.153.263 14.738zm-16.998 5.99C15.63 34.148 13.507 36 10.439 36c-3.068 0-5.92-1.852-6.379-4.136-.448-2.284 1.674-4.135 4.751-4.135 1.002 0 1.974.197 2.854.544.822-.055-.15-2.377-1.862-12.228-2.133-12.303 3.059-1.87 8.764-2.753 5.706-.894.076 4.821-3.648 3.834-3.723-.987-4.648-7.152.263 14.738z",fill:"#000"})]),{id:"sb3-musicBlock-high-contrast",fill:"none"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M8.753 34.602l-4.251 1.779 1.784-4.236c1.218-2.892 2.907-5.423 5.03-7.538L31.066 4.93c.846-.842 2.65-.41 4.032.967 1.38 1.375 1.816 3.173.97 4.015L16.318 29.59c-2.123 2.116-4.664 3.799-7.565 5.012",fill:"#FFF"}),Vt.el("path",{d:"M29.41 6.111s-4.45-2.379-8.202 5.771c-1.734 3.766-4.35 1.546-4.35 1.546"}),Vt.el("path",{d:"M36.42 8.825c0 .463-.14.873-.432 1.164l-9.335 9.301c.282-.29.41-.668.41-1.12 0-.874-.507-1.963-1.406-2.868-1.362-1.358-3.147-1.8-4.002-.99L30.99 5.01c.844-.84 2.65-.41 4.035.96.898.904 1.396 1.982 1.396 2.855M10.515 33.774a23.74 23.74 0 0 1-1.764.83L4.5 36.382l1.786-4.235c.258-.604.529-1.186.833-1.757.69.183 1.449.625 2.109 1.282.659.658 1.102 1.412 1.287 2.102",fill:"#4C97FF"}),Vt.el("path",{d:"M36.498 8.748c0 .464-.141.874-.433 1.165l-19.742 19.68c-2.131 2.111-4.673 3.793-7.572 5.01L4.5 36.381l.974-2.317 1.925-.808c2.899-1.218 5.441-2.899 7.572-5.01l19.742-19.68c.292-.292.432-.702.432-1.165 0-.647-.27-1.4-.779-2.123.249.172.498.377.736.614.898.905 1.396 1.983 1.396 2.856",fill:"#0b8e69",opacity:".15"}),Vt.el("path",{d:"M18.45 12.831a.904.904 0 1 1-1.807 0 .904.904 0 0 1 1.807 0z",fill:"#0b8e69"})]),{id:"sb3-penBlock-high-contrast",stroke:"#0b8e69",fill:"none","stroke-linejoin":"round"}),Vt.setProps(Vt.group([Vt.el("circle",{opacity:.25,cx:32,cy:16,r:4.5}),Vt.el("circle",{opacity:.5,cx:32,cy:12,r:4.5}),Vt.el("circle",{opacity:.75,cx:32,cy:8,r:4.5}),Vt.el("circle",{cx:32,cy:4,r:4.5}),Vt.el("path",{d:"M22.672 4.42l-6.172 4V6.1c0-2.01-1.563-3.6-3.5-3.6H4.1C2.076 2.5.5 4.076.5 6.1V14c0 1.927 1.584 3.512 3.6 3.6H13c1.902 0 3.5-1.653 3.5-3.6v-2.283l6.257 3.754.097.075c.02.02.098.054.146.054.267 0 .5-.217.5-.5V4.8c0 .037-.056-.094-.129-.243-.145-.242-.43-.299-.7-.137z",fill:"#000","stroke-linejoin":"round"})]),{id:"sb3-videoBlock-high-contrast",stroke:"#0b8e69",fill:"#FFF","stroke-opacity":.15}),Vt.setProps(Vt.group([Vt.el("circle",{fill:"#231f20",cx:8.35,cy:9.65,r:.97}),Vt.el("circle",{fill:"#231f20",cx:14.19,cy:9.65,r:.97}),Vt.el("path",{d:"M11.27 4.14c-3.94 0-7.13 3.19-7.13 7.13s3.19 7.13 7.13 7.13 7.13-3.19 7.13-7.13-3.19-7.13-7.13-7.13m0 1.3c3.22 0 5.84 2.61 5.84 5.84s-2.61 5.84-5.84 5.84-5.84-2.61-5.84-5.84 2.61-5.84 5.84-5.84",fill:"#231f20"}),Vt.el("path",{d:"M17.57 13.88c.57-.15 1.02-.6 1.17-1.17l.35-1.3c.16-.61 1.04-.61 1.2 0l.35 1.3c.15.57.6 1.02 1.18 1.17l1.3.35c.61.16.61 1.04 0 1.2l-1.3.35c-.57.15-1.02.6-1.18 1.17l-.35 1.3c-.17.62-1.04.62-1.2 0l-.35-1.3c-.15-.57-.6-1.02-1.17-1.17l-1.3-.35c-.61-.17-.61-1.04 0-1.2l1.3-.35Zm-16-11.43c.43-.12.76-.45.88-.88l.26-.98c.12-.46.78-.46.9 0l.26.98c.12.43.45.76.88.88l.98.26c.46.12.46.78 0 .9l-.98.26c-.43.11-.77.45-.88.88l-.26.98c-.12.46-.78.46-.9 0l-.26-.98a1.26 1.26 0 0 0-.88-.88l-.98-.26c-.46-.12-.46-.78 0-.9z",fill:"#ffbf00","fill-rule":"evenodd",stroke:"#0b8e69","stroke-miterlimit":"2","stroke-width":".5"}),Vt.el("path",{d:"M12.68 12.53c.2-.3.6-.38.9-.18s.38.6.18.9c-.56.83-1.41 1.26-2.48 1.26s-1.93-.43-2.48-1.26c-.2-.3-.12-.7.18-.9s.7-.12.9.18c.31.46.75.68 1.41.68s1.1-.22 1.41-.68Z",fill:"#231f20"}),Vt.el("path",{d:"M20.89 6.06a.57.57 0 0 1-.57-.57V2.2h-3.31c-.31 0-.57-.25-.57-.57s.25-.57.57-.57h3.88c.31 0 .57.25.57.57v3.86c0 .31-.25.57-.57.57M5.44 21.46H1.59a.57.57 0 0 1-.57-.57v-3.82c0-.31.25-.57.57-.57s.57.25.57.57v3.25h3.28c.31 0 .57.25.57.57s-.25.57-.57.57",fill:"#0b8e69"})]),{id:"sb3-faceSensingBlock-high-contrast",transform:"scale(1.67785234899 1.67785234899)"}),Vt.setProps(Vt.group([Vt.el("path",{d:"M25.644 20.5c-1.667 1.937-4.539 3.429-5.977 3.429a1.25 1.25 0 0 1-.557-.137c-.372-.186-.61-.542-.61-1.03 0-.105.017-.207.05-.308.076-.236.624-.986.727-1.173.27-.484.462-1.075.566-1.865A8.5 8.5 0 0 1 24 3.5h4a8.5 8.5 0 1 1 0 17h-2.356z",fill:"#FFF",stroke:"#0b8e69"}),Vt.el("path",{d:"M15.5 21.67c0-1.016-1.494-1.586-2.387-.782l-2.7 2.163A5.958 5.958 0 0 1 6.7 24.33h-.4c-1.035 0-1.8.69-1.8 1.573v4.235c0 .883.765 1.572 1.8 1.572h.4c1.458 0 2.754.423 3.82 1.287l2.598 2.161c.908.75 2.382.188 2.382-.876V21.67z",fill:"#000"})]),{id:"sb3-ttsBlock-high-contrast","stroke-opacity":.15}),Vt.el("image",{id:"sb3-translateBlock-high-contrast",width:"40px",height:"40px",href:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAxoAAARjCAMAAADfFKLnAAABhlBMVEUAAAALjWkOj2oLjmkAAAAQj2wkmnkYlHILj2kLjmkAAAAAAABsu6VouaIJjmgimncAAAAAAAALjml0v6kAAAAAAAAAAAAATzhjt6A9pogVk28XlHAVk28ZlHEAAAAAAAAAAAANj2oAAAAJj2oAAAAAAAByvahsu6VVsZcqnXwAAAAAAAAAAAAMj2oQkWsAAAAPkGwAAABHqo4AAAAclnMcl3MKj2kXlHIXk3EAAAALj2gAAAD///8AAAB9w6+ExrONyrmHyLWrzv/3+/r8/v6Fx7VpqP/0+fh7s/9Ml//4/PvK59/4+//u9f/l8P/V5v9vrP9an/9Smv/o6OjMzMwrKysDAwPp8//e7P+w0f+axf9xrf9kpf9jpP9ho/9Nl//e3t7E5Nu+4dfT09OUzb2QzLuZmZlMrJKGhoYpnHxlZWVgYGBCQkINDQ30+P/J4P/D3P+11P+Nvf90rv9Jlvby8vLc3Nyl1cik1ce+vr6DxrKlpaWfn58xnJZBpJWJiYl+fn4fHx9PedmHAAAAPHRSTlMAd4OAxg/0wohyDv78+Tj16Ik6+ux+WAb79e7mvbCemW1rZDYXC/n39PTw39u8t7RVNvX11NLDm5qOWx0x5AFdAAAGd0lEQVR42uzbV3faQBCG4XGChMEU4wLujntv6WXXIUAwxd3Gvfea3nv+eQaBcgS5ztV8zwWMfsB7js7uiAAAAAAAAP6fgKfCwRMg1l49OBzqJgC5DLfZO+nQa7oNovq2Ia2rJwhArFZ/QpVI+Fspr57b8BKAUAEzrgpmXhSHjBmgvDGtQwQglKdWFaU27KnWQ0TekEvruvYwAYh08ym3ML0ei8V2NvlnfZofn98gorC2DBKASFYaq8md9MLW1kJ6O7lqp9Hj0qzqFgGIxGlYtjeUepPkwU6D20AZIJidRmxhZnbxtTMN8rpQBshlpzGdTL2dTzjSYJEnBCCVnYaaS++uqb9pAEhnpzGXXFycn1PZo2g0ejpiL410EYBQhTRepnZTs2vz776f+yYd/EG3QQAiWVd+s+nNV/yX+NEQVyXiDS0EIFKNmeAEZlRe9jyuysSDNQQgkrsvo4qOfOofvgoCEMloNWs/cgNTx9FT+7RqaUV/KI7PcFoFYgVG+7iMxpbK+19UwU+tfyENEC/SvK+yAw8cdxy5XO53AmmAdI8bD/qbxh13HMv67Ex/RhogXVfzvQ6DHGlc6L09fYk0AJgjjalrza7fIw2QrjtSksZXfXFycqm/IQ0QrrPK5XWmcbWylD+/vUIaIFtnldaFNjx+lbd8qNjhMq78QDQug7l6eAwE46pMxsSiCAhVpy1hYu7y9cKM300AMoXbOQ5XyEvMaAn6opbjKQ7jkw9L6SBZSOsxe66pqLSMNnIb/hG8TYFk3mqt66nMw4Gs2m+OEIBgE9zGcFtZHeNN/Qe3OwhAsu5HQ3fq2qiU0XG3Cd+GAwAAAAD8YQ8OBAAAAACA/F8bQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVYQ8OBAAAAACA/F8bQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV2IMDAQAAAAAg/9dGUFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUV9uBAAAAAAADI/7URVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWFPTgQAAAAAADyf20EVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVhDw4EAAAAAID8XxtBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVXYgwMBAAAAACD/10ZQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRX24EAAAAAAAMj/tRFUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVYU9OBAAAAAAAPJ/bQRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWEPDgQAAAAAgPxfG0FVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVdiDAwEAAAAAIP/XRlBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFfbgQAAAAAAAyP+1EVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVhT04EAAAAAAA8n9tBFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVYQ8OBAAAAACA/F8bQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV2oNDAgAAAABB/1/7wgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMArKwCvdMdAc1YAAAAASUVORK5CYII="})]}static iconName(t,e){return"high-contrast"===e&&mt.has(t)?t+"-high-contrast":t}static makeStyle(){const t=Vt.el("style");return t.appendChild(Vt.cdata(bt.cssContent)),t}static get defaultFont(){return"500 12pt Helvetica Neue, Helvetica, sans-serif"}static get commentFont(){return"400 12pt Helvetica Neue, Helvetica, sans-serif"}}const{defaultFont:At,commentFont:yt,makeStyle:kt,makeOriginalIcons:wt,makeHighContrastIcons:vt,iconName:St}=bt;class Ot{constructor(t){Object.assign(this,t),this.el=null,this.height=12,this.metrics=null,this.x=0}get isLabel(){return!0}draw(t){return this.el}get width(){return this.metrics.width}measure(){const t=this.value,e="sb3-"+this.cls;this.el=Vt.text(0,13.1,t,{class:"sb3-label "+e});let s=Ot.metricsCache[e];if(s||(s=Ot.metricsCache[e]=Object.create(null)),Object.hasOwnProperty.call(s,t))this.metrics=s[t];else{const e=/comment-label/.test(this.cls)?yt:At;this.metrics=s[t]=Ot.measure(t,e)}}static measure(t,e){const s=Ot.measuring;s.font=e;return{width:s.measureText(t).width}}}Ot.metricsCache={},Ot.toMeasure=[];class Lt{constructor(t){Object.assign(this,t);const e=Lt.icons[this.name];if(!e)throw Error("no info for icon: "+this.name);Object.assign(this,e)}get isIcon(){return!0}draw(t){return Vt.symbol("#sb3-"+St(this.name,t),{width:this.width,height:this.height})}static get icons(){return{greenFlag:{width:20,height:21,dy:-1},stopSign:{width:20,height:20},turnLeft:{width:24,height:24},turnRight:{width:24,height:24},loopArrow:{width:24,height:24},addInput:{width:4,height:8},delInput:{width:4,height:8},list:{width:15,height:18},musicBlock:{width:40,height:40},penBlock:{width:40,height:40},videoBlock:{width:40,height:40,dy:10},faceSensingBlock:{width:40,height:40,dy:3.9932885906},ttsBlock:{width:40,height:40},translateBlock:{width:40,height:40},wedoBlock:{width:40,height:40},ev3Block:{width:40,height:40},microbitBlock:{width:40,height:40},makeymakeyBlock:{width:40,height:40},gdxforBlock:{width:40,height:40},boostBlock:{width:40,height:40}}}}class Et{constructor(){this.width=1,this.height=40,this.x=0}get isLine(){return!0}measure(){}draw(t,e){return Vt.el("line",{class:"sb3-extension-line","stroke-linecap":"round",x1:0,y1:0,x2:0,y2:40})}}class Tt{constructor(t){Object.assign(this,t),t.label&&(this.label=Nt(t.label)),this.isBoolean="boolean"===this.shape,this.isDropdown="dropdown"===this.shape,this.isRound=!(this.isBoolean||this.isDropdown),this.x=0}get isInput(){return!0}measure(){this.hasLabel&&this.label.measure()}static get shapes(){return{string:Vt.pillRect,number:Vt.pillRect,"number-dropdown":Vt.pillRect,color:Vt.pillRect,dropdown:Vt.roundRect,boolean:Vt.pointedRect,stack:Vt.stackRect,reporter:Vt.pillRect}}draw(t,e){let s,i,o;this.isBoolean?s=48:this.isColor?s=40:this.hasLabel?(i=this.label.draw(t),this.hasArrow?(o=11,s=this.label.width+o+31):(o=this.label.width>=18?11:(40-this.label.width)/2,s=this.label.width+2*o),i=Vt.move(o,9,i)):s=this.isInset?30:null,this.width=s;const r=this.height=32,c=Tt.shapes[this.shape](s,r);Vt.setProps(c,{class:`${this.isColor?"":"sb3-"+e.info.category} sb3-input sb3-input-${this.shape}`}),this.isColor?Vt.setProps(c,{fill:this.value}):"dropdown"===this.shape?e.info.color&&Vt.setProps(c,{fill:e.info.color,stroke:"rgba(0, 0, 0, 0.2)"}):"number-dropdown"===this.shape?(c.classList.add(`sb3-${e.info.category}-alt`),e.info.color&&Vt.setProps(c,{fill:"rgba(0, 0, 0, 0.1)",stroke:"rgba(0, 0, 0, 0.15)"})):"boolean"===this.shape&&(c.classList.remove("sb3-"+e.info.category),c.classList.add(`sb3-${e.info.category}-dark`),e.info.color&&Vt.setProps(c,{fill:"rgba(0, 0, 0, 0.15)"}));const n=Vt.group([c]);return this.hasLabel&&n.appendChild(i),this.hasArrow&&n.appendChild(Vt.move(s-24,12.8505114083,Vt.symbol("high-contrast"===t?"#sb3-dropdownArrow-high-contrast":"#sb3-dropdownArrow",{}))),n}}class Rt{constructor(t){Object.assign(this,t),this.children=t.children.map(Nt),this.comment=this.comment?Nt(this.comment):null,this.isRound=this.isReporter,this.info={...t.info},Object.prototype.hasOwnProperty.call(s,this.info.category)&&(this.info.category=s[this.info.category]),Object.prototype.hasOwnProperty.call(e,this.info.category)&&(this.children.unshift(new Et),this.children.unshift(new Lt({name:this.info.category+"Block"})),this.info.category="extension"),this.x=0,this.width=null,this.height=null,this.firstLine=null,this.innerWidth=null}get isBlock(){return!0}measure(){for(const t of this.children)t.measure&&t.measure();this.comment&&this.comment.measure()}static get shapes(){return{stack:Vt.stackRect,"c-block":Vt.stackRect,"if-block":Vt.stackRect,celse:Vt.stackRect,cend:Vt.stackRect,cap:Vt.capRect,reporter:Vt.pillRect,boolean:Vt.pointedRect,hat:Vt.hatRect,cat:Vt.catHat,"define-hat":Vt.procHatRect,"define-cat":Vt.procCatRect,ring:Vt.pillRect}}drawSelf(t,e,s,i){if(i.length>1)return Vt.mouthRect(e,s,this.isFinal,i,{class:"sb3-"+this.info.category});if("outline"===this.info.shape)return Vt.setProps(Vt.stackRect(e,s),{class:`sb3-${this.info.category} sb3-${this.info.category}-alt`});if(this.isRing){const t=this.children[0];if(t&&(t.isInput||t.isBlock||t.isScript))return Vt.roundRect(e,s,{class:"sb3-"+this.info.category})}const o=Rt.shapes[this.info.shape];if(!o)throw Error("no shape func: "+this.info.shape);return o(e,s,{class:"sb3-"+this.info.category})}static get padding(){return{hat:[24,8,17],cat:[24,8,49],"define-hat":[20,16,0],"define-cat":[20,16,0],null:[4,4,0]}}horizontalPadding(t){if(this.isRound){if(t.isIcon)return 16;if(t.isLabel)return 12;if(t.isDropdown)return 12;if(t.isBoolean)return 12;if(t.isRound)return 4}else if(this.isBoolean){if(t.isIcon)return 24;if(t.isLabel)return 20;if(t.isDropdown)return 20;if(t.isRound&&t.isBlock)return 24;if(t.isRound)return 20;if(t.isBoolean)return 8}return 8}marginBetween(t,e){return t.isLabel&&e.isLabel?4.447998046875:8}draw(t){const e="define-hat"===this.info.shape||"define-cat"===this.info.shape;let s=this.children;const i=this.isCommand,o=Rt.padding[this.info.shape]||Rt.padding.null,r=o[0],c=o[1];let n="cat"===this.info.shape?16:0;const a=function(t){this.y=t,this.width=0,this.height=i?40:32,this.children=[]};let l=0,h=0,p=new a(n);const d=()=>{0===f.length?p.height+=r+c:(p.height-=11,p.y-=2),n+=p.height,f.push(p)};if(this.info.isRTL){let t=0;const e=()=>{s=s.slice(0,t).concat(s.slice(t,i).reverse()).concat(s.slice(i))};let i;for(i=0;i<s.length;i++)s[i].isScript&&(e(),t=i+1);t<i&&e()}const f=[];let u,g;for(let e=0;e<s.length;e++){const i=s[e];if(i.el=i.draw(t,this),i.isScript&&this.isCommand)this.hasScript=!0,d(),i.y=n-1,f.push(i),h=Math.max(h,Math.max(1,i.width)),i.height=Math.max(29,i.height+3)-2,n+=i.height,p=new a(n),u=null;else if(i.isArrow)p.children.push(i),u=i;else{if(f.length||(g=i),u&&(p.width+=this.marginBetween(u,i)),null!=s[0]){const t=48-this.horizontalPadding(s[0]);(this.isCommand||this.isOutline)&&!i.isLabel&&!i.isIcon&&p.width<t&&(p.width=t)}i.isIcon&&0===e&&this.isCommand&&(p.height=Math.max(p.height,i.height+8)),i.x=p.width,p.width+=i.width,l=Math.max(l,p.width),i.isLabel||(p.height=Math.max(p.height,i.height)),p.children.push(i),u=i}}d();let V=s.length?this.horizontalPadding(s[0]):0;l+=V+(s.length?this.horizontalPadding(g):0);const m=l;l=Math.max(this.hasScript?160:this.isHat?100:this.isCommand||this.isOutline?64:this.isReporter?48:0,l),this.isReporter&&(V+=(l-m)/2),this.height=n,this.width=h?Math.max(l,15+h):l,this.firstLine=f[0],this.innerWidth=l;const b=[];for(let t=0;t<f.length;t++){const s=f[t];if(s.isScript){b.push(Vt.move(16,s.y,s.el));continue}const i=s.height;for(let o=0;o<s.children.length;o++){const n=s.children[o];if(n.isArrow){b.push(Vt.move(l-32,this.height-28,n.el));continue}let a=r+(i-n.height-r-c)/2;n.isLabel&&0===t?a-=1:e&&n.isLabel?a+=3:n.isIcon&&(a+=0|n.dy,this.isCommand&&0===t&&0===o&&(a+=4));let h=V+n.x;n.dx&&(h+=n.dx),b.push(Vt.move(h,s.y+a|0,n.el))}}const A=this.drawSelf(t,l,this.height,f);b.splice(0,0,A),this.info.color&&Vt.setProps(A,{fill:this.info.color,stroke:"rgba(0, 0, 0, 0.2)"});const y=Vt.group(b);return"define-cat"===this.info.shape?(this.height+=16,Vt.group([Vt.move(0,16,y)])):y}}class Ct{constructor(t){Object.assign(this,t),this.label=Nt(t.label),this.width=null}get isComment(){return!0}static get lineLength(){return 12}get height(){return 20}measure(){this.label.measure()}draw(t){const e=this.label.draw(t);return this.width=this.label.width+16,Vt.group([Vt.commentLine(this.hasBlock?Ct.lineLength:0,6),Vt.commentRect(this.width,this.height,{class:"sb3-comment"}),Vt.move(8,4,e)])}}class Mt{constructor(t){Object.assign(this,t),this.child=Nt(t.child),this.width=null,this.height=null,this.y=0}get isGlow(){return!0}measure(){this.child.measure()}drawSelf(t){const e=this.child;let s;const i=this.width,o=this.height-1;return s=e.isScript?!e.isEmpty&&e.blocks[0].isHat?Vt.hatRect(i,o):e.isFinal?Vt.capRect(i,o):Vt.stackRect(i,o):e.drawSelf(t,i,o,[]),Vt.setProps(s,{class:"sb3-diff sb3-diff-ins"})}draw(t){const e=this.child,s=e.isScript?e.draw(t,!0):e.draw(t);return this.width=e.width,this.height=e.isBlock&&e.firstLine.height||e.height,Vt.group([s,this.drawSelf(t)])}}class It{constructor(t){Object.assign(this,t),this.blocks=t.blocks.map(Nt),this.y=0}get isScript(){return!0}measure(){for(const t of this.blocks)t.measure()}draw(t,e){const s=[];let i=1;this.width=0;for(const o of this.blocks){const r=e?0:2,c=o.draw(t);s.push(Vt.move(r,i,c)),this.width=Math.max(this.width,o.width);if("-"===(o.diff||o.info?.diff)){const t=o.width,e=o.firstLine.height||o.height;s.push(Vt.move(r,i+e/2+1,Vt.strikethroughLine(t))),this.width=Math.max(this.width,o.width)}i+=o.height;const n=o.comment;if(n){const e=o.firstLine,r=o.innerWidth+2+Ct.lineLength,c=Rt.padding[o.info.shape]||Rt.padding.null,a=i-o.height+(e.height-c[2])/2+c[2],l=n.draw(t);s.push(Vt.move(r,a-n.height/2,l)),this.width=Math.max(this.width,r+n.width)}}const o=this.blocks[this.blocks.length-1];return this.height=i+1,e||this.isFinal||(this.height+=o.hasPuzzle?8:0),!e&&o.isGlow&&(this.height+=7),Vt.group(s)}}class xt{constructor(t,e){Object.assign(this,t),this.scripts=t.scripts.map(Nt),this.width=null,this.height=null,this.el=null,this.defs=null,this.scale=e.scale,this.iconStyle=e.style.replace("scratch3-","")}measure(){this.scripts.forEach(t=>{t.measure()})}render(t){if("function"==typeof t)throw Error("render() no longer takes a callback");this.measure();let e=0,s=0;const i=[];for(let t=0;t<this.scripts.length;t++){const o=this.scripts[t];s&&(s+=10),o.y=s,i.push(Vt.move(0,s,o.draw(this.iconStyle))),s+=o.height,t!==this.scripts.length-1&&(s+=36),e=Math.max(e,o.width+4)}this.width=e,this.height=s;const o=Vt.newSVG(e,s,this.scale),r="high-contrast"===this.iconStyle?vt():wt();return o.appendChild(this.defs=Vt.withChildren(Vt.el("defs"),r)),o.appendChild(Vt.setProps(Vt.group(i),{style:`transform: scale(${this.scale})`})),this.el=o,o}exportSVGString(){if(null==this.el)throw Error("call draw() first");const t=kt();this.defs.appendChild(t);const e=(new Vt.XMLSerializer).serializeToString(this.el);return this.defs.removeChild(t),e}exportSVG(){return"data:image/svg+xml;utf8,"+this.exportSVGString().replace(/[#]/g,encodeURIComponent)}toCanvas(t,e){e=e||1;const s=Vt.makeCanvas();s.width=Math.max(1,this.width*e*this.scale),s.height=Math.max(1,this.height*e*this.scale);const i=s.getContext("2d"),o=new Image;o.src=this.exportSVG(),o.onload=()=>{i.save(),i.scale(e,e),i.drawImage(o,0,0),i.restore(),t(s)}}exportPNG(t,e){this.toCanvas(e=>{URL&&URL.createObjectURL&&Blob&&e.toBlob?e.toBlob(e=>{t(URL.createObjectURL(e))},"image/png"):t(e.toDataURL("image/png"))},e)}}const Nt=(t,e)=>new((t=>{switch(t.constructor){case R:return Ot;case C:return Lt;case M:return Tt;case I:return Rt;case x:return Ct;case N:return Mt;case B:return It;case D:return xt;default:throw Error("no view for "+t.constructor.name)}})(t))(t,e);const Bt=bt.makeStyle;const Dt=function(t){const e=t.document;function s(t,e){if((e={style:"scratch2",...e}).scale=e.scale||1,"scratch2"===e.style)return pt(t,e);if(/^scratch3($|-)/.test(e.style))return Nt(t,e);throw Error("Unknown style: "+e.style)}function i(t,e){if("function"==typeof e)throw Error("render() no longer takes a callback");const i=s(t,e).render();return i.classList.add("scratchblocks-style-"+e.style),i}function o(t,s){s={inline:!1,...s};const i=t.innerHTML.replace(/<br>\s?|\n|\r\n|\r/gi,"\n"),o=e.createElement("pre");o.innerHTML=i;let r=o.textContent;return s.inline&&(r=r.replace("\n","")),r}function r(t,s,i,o){let r;if(o.inline){r=e.createElement("span");let t="scratchblocks scratchblocks-inline";i.scripts[0]&&!i.scripts[0].isEmpty&&(t+=" scratchblocks-inline-"+i.scripts[0].blocks[0].shape),r.className=t,r.style.display="inline-block",r.style.verticalAlign="middle"}else r=e.createElement("div"),r.className="scratchblocks";r.appendChild(s),t.innerHTML="",t.appendChild(r)}return function(t){Q.init(t),it.measuring=Q.makeCanvas().getContext("2d")}(t),function(t){Vt.init(t),Ot.measuring=Vt.makeCanvas().getContext("2d")}(t),{allLanguages:y,loadLanguages:k,stringify:function(t){return t.stringify()},Label:R,Icon:C,Input:M,Block:I,Comment:x,Script:B,Document:D,newView:s,read:o,parse:j,replace:r,render:i,renderMatching:function(t,s){t=t||"pre.blocks",s={style:"scratch2",inline:!1,languages:["en"],scale:1,read:o,parse:j,render:i,replace:r,...s};[].slice.apply(e.querySelectorAll(t)).forEach(t=>{const e=s.read(t,s),i=s.parse(e,s),o=s.render(i,s);s.replace(t,o,i,s)})},appendStyles:function(){e.head.appendChild(dt()),e.head.appendChild(Bt())}}}(window);Dt.appendStyles();export{Dt as default};
| //# sourceMappingURL=scratchblocks.min.es.js.map
| 

---

## Assistant (Build · Muse Spark 1.3 Contributor · 47.2s)

_Thinking:_

Diagnosing a webpack 4 parse failure from unmatched babel-loader include due to pnpm's nested node_modules path breaking the regex.

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "grep -n \"module.exports\\|^    {\\|name: '\" webpack.config.js | head -20; grep -n \"scratchblocks\" webpack.config.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
195:module.exports = [
243:                        name: 'vendors-async',
250:                        name: 'community-async',
271:                filename: 'editor.html',
279:                filename: 'index.html',
285:                filename: 'index.html',
293:                filename: 'player.html',
300:                filename: 'fullscreen.html',
307:                filename: 'embed.html',
314:                filename: 'addons.html',
321:                filename: 'credits.html',
361:                filename: 'js/[name].js',
362:                chunkFilename: 'js/[name].js',
110:                /node_modules[\\/]scratchblocks[\\/]build/,

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.2s)

**Tool: bash**

**Input:**
```json
{
  "command": "sed -n 193,242p webpack.config.js; grep -n \"entry:\\|entry =\" webpack.config.js | head",
  "workdir": "/Users/sophie/mistwarp/scratch-gui",
  "timeout": 30000
}
```

**Output:**
```
}

module.exports = [
    // to run editor examples
    defaultsDeep({}, base, {
        entry: Object.fromEntries(Object.entries({
            ...(ENABLE_COMMUNITY ? {community: './src/playground/community.jsx'} : {}),
            'editor': './src/playground/editor.jsx',
            'player': './src/playground/player.jsx',
            'fullscreen': './src/playground/fullscreen.jsx',
            'embed': './src/playground/embed.jsx',
            'addon-settings': './src/playground/addon-settings.jsx',
            'credits': './src/playground/credits/credits.jsx'
        }).filter(([name]) => !ONLY_ENTRY || name === ONLY_ENTRY)),
        output: {
            path: path.resolve(__dirname, BUILD_DIR)
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: /\.(svg|png|wav|mp3|gif|jpg|ttf|woff|woff2)$/,
                    loader: 'url-loader',
                    options: {
                        limit: 2048,
                        outputPath: 'static/assets/',
                        esModule: false
                    }
                }
            ])
        },
        optimization: {
            // Keep initial site vs editor bundles independent.
            // Shared code only splits out of lazy-loaded chunks, so
            // editor.html never pulls community code on first paint and
            // index.html never pulls scratch-vm/blocks on first paint.
            runtimeChunk: {
                name: entrypoint => `runtime~${entrypoint.name}`
            },
            splitChunks: {
                // 'async' (not 'all') avoids shared initial chunks that would
                // force HtmlWebpackPlugin to inject cross-entry scripts.
                chunks: 'async',
                minSize: 50000,
                maxAsyncRequests: 6,
                maxInitialRequests: 4,
                automaticNameDelimiter: '~',
                cacheGroups: {
                    default: false,
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
198:        entry: Object.fromEntries(Object.entries({
356:            entry: {

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 17.2s)

_Thinking:_

Diagnosing a webpack 4 loader mismatch by checking include array behavior and dev server config reload.

_Thinking:_

Shifting to a restart requirement and ruling out lazy import or vendor copy workarounds.

_Thinking:_



**Tool: bash**

**Input:**
```json
{
  "command": "sed -n 98,114p webpack.config.js",
  "workdir": "/Users/sophie/mistwarp/scratch-gui"
}
```

**Output:**
```
    },
    module: {
        rules: [{
            test: /\.m?jsx?$/,
            loader: 'babel-loader',
            include: [
                path.resolve(__dirname, 'src'),
                /node_modules[\\/]scratch-[^\\/]+[\\/]src/,
                /node_modules[\\/]pify/,
                /node_modules[\\/]@vernier[\\/]godirect/,
                /node_modules[\\/]@chenglou[\\/]pretext/,
                /node_modules[\\/]fractch[\\/]src/,
                /node_modules[\\/]scratchblocks[\\/]build/,
                /node_modules[\\/]isomorphic-git/,
                /node_modules[\\/]monaco-editor/,
                /node_modules[\\/]rotur-sdk/,
                /node_modules[\\/]fake-indexeddb/

```

---

## Assistant (Build · Muse Spark 1.3 Contributor · 8.5s)

_Thinking:_



That error is a stale dev server, not broken code. I added the babel-loader exception for scratchblocks to `webpack.config.js`, but webpack only reads its config at startup — your server booted before the edit, so it's still trying to parse the file raw (the `...spread` at that token is what chokes webpack 4's parser).

Restart the dev server (`npm start` on :8601) and it will compile — I verified the identical rule + browser targets bundle scratchblocks cleanly in isolation. No code changes needed on your end; everything else (translator, component, tests) is already in place.

---

