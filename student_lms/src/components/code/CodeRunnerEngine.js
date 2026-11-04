/**
 * Multi-Language Client-Side Execution Engine for Student LMS
 * Supports: Real Python Transpiler & Runtime, Turtle Graphics Canvas, HTML/CSS/JS Live Preview
 */

export function executePython(code) {
  const logs = [];
  const startTime = performance.now();
  let success = true;

  try {
    // Check if code uses turtle
    const isTurtle = /import\s+turtle|from\s+turtle/.test(code);
    if (isTurtle) {
      return executeTurtleScript(code);
    }

    // Transpile Python to executable JavaScript
    const jsCode = transpilePythonToJs(code);

    // Custom environment with Python builtins
    const __print = (...args) => {
      const formatted = args.map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          if (Array.isArray(arg)) {
            return '[' + arg.map((item) => (typeof item === 'string' ? `'${item}'` : String(item))).join(', ') + ']';
          }
          return JSON.stringify(arg);
        }
        return String(arg);
      });
      logs.push(formatted.join(' '));
    };

    const __range = (start, stop, step = 1) => {
      if (stop === undefined) {
        stop = start;
        start = 0;
      }
      const res = [];
      if (step > 0) {
        for (let i = start; i < stop && res.length < 5000; i += step) res.push(i);
      } else if (step < 0) {
        for (let i = start; i > stop && res.length < 5000; i += step) res.push(i);
      }
      return res;
    };

    const __len = (x) => (x !== undefined && x !== null && x.length !== undefined ? x.length : Object.keys(x || {}).length);
    const __sum = (arr) => (Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b), 0) : 0);
    const __max = (...arr) => {
      const flat = arr.length === 1 && Array.isArray(arr[0]) ? arr[0] : arr;
      return Math.max(...flat);
    };
    const __min = (...arr) => {
      const flat = arr.length === 1 && Array.isArray(arr[0]) ? arr[0] : arr;
      return Math.min(...flat);
    };

    // Ensure Array prototype has Python methods during execution
    const origAppend = Array.prototype.append;
    const origPop = Array.prototype.pop;
    Array.prototype.append = function (val) {
      this.push(val);
      return this;
    };

    // Run the generated code in sandbox function
    const sandboxFn = new Function(
      '__print',
      '__range',
      '__len',
      '__sum',
      '__max',
      '__min',
      `"use strict";\n${jsCode}`
    );

    sandboxFn(__print, __range, __len, __sum, __max, __min);

    // Restore Array methods
    if (origAppend) Array.prototype.append = origAppend;
    else delete Array.prototype.append;

    if (logs.length === 0) {
      logs.push('[Python 3.11 Runtime: Program selesai dieksekusi tanpa error. (0 output)]');
    }
  } catch (err) {
    success = false;
    logs.push(`Traceback (most recent call last):`);
    logs.push(`Python Runtime Exception: ${err.message}`);
  }

  const duration = Math.max(1, Math.round(performance.now() - startTime));

  return {
    output: logs.join('\n'),
    duration,
    success,
    type: 'terminal',
  };
}

function transpilePythonToJs(pyCode) {
  const lines = pyCode.split('\n');
  const jsLines = [];
  const indentStack = [0];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines or comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const indent = rawLine.search(/\S/);

    // Close blocks if indentation decreased
    while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push('}');
    }

    let line = trimmed;

    // Convert f-strings: f"text {var} more" -> `text ${var} more`
    line = line.replace(/f(["'])(.*?)\1/g, (m, q, content) => {
      const interpolated = content.replace(/\{([^}]+)\}/g, '${$1}');
      return '`' + interpolated + '`';
    });

    // Replace Python constants and operators
    line = line
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\b/g, '!');

    // def __init__(self, ...): -> constructor(...) {
    if (line.match(/^def\s+__init__\s*\(\s*self\s*,?/)) {
      line = line
        .replace(/^def\s+__init__\s*\(\s*self\s*,?\s*/, 'constructor(')
        .replace(/\)\s*:/, ') {');
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // def method(self, ...): -> method(...) {
    if (line.match(/^def\s+([a-zA-Z_]\w*)\s*\(\s*self\s*,?/)) {
      line = line
        .replace(/^def\s+([a-zA-Z_]\w*)\s*\(\s*self\s*,?\s*/, '$1(')
        .replace(/\)\s*:/, ') {');
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // def func(...): -> function func(...) {
    if (line.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*)\)\s*:/)) {
      line = line.replace(/^def\s+([a-zA-Z_]\w*)\s*\((.*)\)\s*:/, 'function $1($2) {');
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // class Cls: -> class Cls {
    if (line.match(/^class\s+([a-zA-Z_]\w*)\s*(?:\((.*?)\))?\s*:/)) {
      line = line.replace(/^class\s+([a-zA-Z_]\w*)\s*(?:\((.*?)\))?\s*:/, (m, name, parent) => {
        return parent ? `class ${name} extends ${parent} {` : `class ${name} {`;
      });
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // if cond: -> if (cond) {
    if (line.match(/^if\s+(.*?)\s*:/)) {
      line = line.replace(/^if\s+(.*?)\s*:/, 'if ($1) {');
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // elif cond: -> else if (cond) {
    if (line.match(/^elif\s+(.*?)\s*:/)) {
      line = line.replace(/^elif\s+(.*?)\s*:/, 'else if ($1) {');
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // else: -> else {
    if (line.match(/^else\s*:/)) {
      line = 'else {';
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // for var in range(...): -> for (let var of __range(...)) {
    if (line.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\((.*?)\)\s*:/)) {
      line = line.replace(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\((.*?)\)\s*:/, 'for (let $1 of __range($2)) {');
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // for var in list: -> for (let var of list) {
    if (line.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.*?)\s*:/)) {
      line = line.replace(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.*?)\s*:/, 'for (let $1 of $2) {');
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // while cond: -> while (cond) {
    if (line.match(/^while\s+(.*?)\s*:/)) {
      line = line.replace(/^while\s+(.*?)\s*:/, 'while ($1) {');
      indentStack.push(indent + 4);
      jsLines.push(line);
      continue;
    }

    // print(...) -> __print(...)
    line = line.replace(/\bprint\s*\(/g, '__print(');

    // Replace self. with this.
    line = line.replace(/\bself\./g, 'this.');

    // Builtins
    line = line.replace(/\blen\s*\(/g, '__len(');
    line = line.replace(/\bsum\s*\(/g, '__sum(');
    line = line.replace(/\bmax\s*\(/g, '__max(');
    line = line.replace(/\bmin\s*\(/g, '__min(');

    // Replace PascalCase object instantiation: obj = ClassName(...) -> let obj = new ClassName(...)
    line = line.replace(/^([a-zA-Z_]\w*)\s*=\s*([A-Z][a-zA-Z0-9_]*)\s*\((.*)\)$/, 'let $1 = new $2($3)');

    // Standard variable assignment at statement level -> let x = ...
    if (
      line.match(/^[a-zA-Z_]\w*\s*=/) &&
      !line.startsWith('let ') &&
      !line.startsWith('var ') &&
      !line.startsWith('const ') &&
      !line.startsWith('this.')
    ) {
      line = 'let ' + line;
    }

    jsLines.push(line + ';');
  }

  // Close any unclosed blocks
  while (indentStack.length > 1) {
    indentStack.pop();
    jsLines.push('}');
  }

  return jsLines.join('\n');
}

/**
 * Turtle Graphics Command Parser
 * Generates an array of drawing commands for HTML5 Canvas
 */
export function executeTurtleScript(code) {
  const commands = [];
  const logs = [];

  logs.push('[Turtle Graphics Engine]');
  logs.push('Inisialisasi kanvas Turtle...');

  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    // Check loop e.g. for _ in range(6):
    const forRangeMatch = line.match(/for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+range\s*\(([^)]+)\):/);
    if (forRangeMatch) {
      const varName = forRangeMatch[1];
      const count = parseInt(forRangeMatch[2]) || 4;
      const subLines = [];
      let j = i + 1;
      while (j < lines.length && (lines[j].startsWith('  ') || lines[j].startsWith('\t'))) {
        subLines.push(lines[j].trim());
        j++;
      }
      i = j - 1;

      for (let iter = 0; iter < Math.min(count, 120); iter++) {
        for (const sLine of subLines) {
          parseTurtleLine(sLine, commands, { [varName]: iter });
        }
      }
      continue;
    }

    parseTurtleLine(line, commands);
  }

  logs.push(`✓ Total ${commands.length} langkah gerakan Turtle berhasil dirender pada Kanvas.`);

  return {
    output: logs.join('\n'),
    commands,
    type: 'turtle',
    success: true,
  };
}

function parseTurtleLine(line, commands, localVars = {}) {
  const resolve = (valStr) => {
    valStr = valStr.trim();
    if (localVars[valStr] !== undefined) return localVars[valStr];
    try {
      const keys = Object.keys(localVars);
      const vals = Object.values(localVars);
      const fn = new Function(...keys, `return (${valStr});`);
      return fn(...vals);
    } catch {
      const num = parseFloat(valStr);
      return isNaN(num) ? valStr.replace(/['"]/g, '') : num;
    }
  };

  if (/forward|fd/.test(line)) {
    const m = line.match(/(?:forward|fd)\s*\((.*?)\)/);
    if (m) commands.push({ action: 'forward', dist: resolve(m[1]) });
  } else if (/backward|bk/.test(line)) {
    const m = line.match(/(?:backward|bk)\s*\((.*?)\)/);
    if (m) commands.push({ action: 'backward', dist: resolve(m[1]) });
  } else if (/left|lt/.test(line)) {
    const m = line.match(/(?:left|lt)\s*\((.*?)\)/);
    if (m) commands.push({ action: 'left', angle: resolve(m[1]) });
  } else if (/right|rt/.test(line)) {
    const m = line.match(/(?:right|rt)\s*\((.*?)\)/);
    if (m) commands.push({ action: 'right', angle: resolve(m[1]) });
  } else if (/circle/.test(line)) {
    const m = line.match(/circle\s*\((.*?)\)/);
    if (m) commands.push({ action: 'circle', radius: resolve(m[1]) });
  } else if (/color|pencolor/.test(line)) {
    const m = line.match(/(?:pencolor|color)\s*\((.*?)\)/);
    if (m) {
      const colorVal = resolve(m[1]);
      commands.push({ action: 'color', color: String(colorVal) });
    }
  } else if (/width|pensize/.test(line)) {
    const m = line.match(/(?:width|pensize)\s*\((.*?)\)/);
    if (m) commands.push({ action: 'pensize', width: resolve(m[1]) });
  } else if (/penup|pu|up/.test(line)) {
    commands.push({ action: 'penup' });
  } else if (/pendown|pd|down/.test(line)) {
    commands.push({ action: 'pendown' });
  } else if (/begin_fill/.test(line)) {
    commands.push({ action: 'begin_fill' });
  } else if (/end_fill/.test(line)) {
    commands.push({ action: 'end_fill' });
  } else if (/goto|setpos/.test(line)) {
    const m = line.match(/(?:goto|setpos)\s*\((.*?),(.*?)\)/);
    if (m) commands.push({ action: 'goto', x: resolve(m[1]), y: resolve(m[2]) });
  }
}
