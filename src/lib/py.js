// @ts-nocheck — перенесено з офлайн-версії без змін; типи описано в py.d.ts
/* ===== Міні-інтерпретатор Python (підмножина для вступного уроку) ===== */
const Py = (() => {
  class PyError extends Error {
    constructor(type, msg, line) { super(msg); this.pyType = type; this.pyMsg = msg; this.line = line; }
  }
  class NeedInput extends Error { constructor() { super('need input'); } }
  class BreakSig {} class ContinueSig {}
  const BREAK = new BreakSig(), CONTINUE = new ContinueSig();

  /* ---------- типи ---------- */
  const T = (name, call) => ({ __type: name, call });
  const NONE = null;
  function typeName(v) {
    if (v === null) return 'NoneType';
    switch (typeof v) {
      case 'bigint': return 'int';
      case 'number': return 'float';
      case 'string': return 'str';
      case 'boolean': return 'bool';
    }
    if (Array.isArray(v)) return v.__tuple ? 'tuple' : 'list';
    if (v.__range) return 'range';
    if (v.__map) return 'map';
    if (v.__type) return 'type';
    if (v.__builtin) return 'builtin_function_or_method';
    if (v.__module) return 'module';
    if (v.__method) return 'builtin_function_or_method';
    return 'object';
  }

  function floatRepr(x) {
    if (Number.isNaN(x)) return 'nan';
    if (!Number.isFinite(x)) return x > 0 ? 'inf' : '-inf';
    if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
    const e = x.toExponential(); // shortest round-trip digits
    let [mant, ex] = e.split('e');
    const exp = parseInt(ex, 10);
    const neg = mant[0] === '-';
    if (neg) mant = mant.slice(1);
    const digits = mant.replace('.', '');
    let s;
    if (exp >= -4 && exp < 16) {
      if (exp >= 0) {
        if (digits.length <= exp + 1) s = digits.padEnd(exp + 1, '0') + '.0';
        else s = digits.slice(0, exp + 1) + '.' + digits.slice(exp + 1);
      } else {
        s = '0.' + '0'.repeat(-exp - 1) + digits;
      }
    } else {
      const m = digits.length > 1 ? digits[0] + '.' + digits.slice(1) : digits;
      const ae = Math.abs(exp);
      s = m + 'e' + (exp < 0 ? '-' : '+') + (ae < 10 ? '0' + ae : String(ae));
    }
    return (neg ? '-' : '') + s;
  }
  function strRepr(s) {
    const q = (s.includes("'") && !s.includes('"')) ? '"' : "'";
    let out = '';
    for (const ch of s) {
      if (ch === '\\') out += '\\\\';
      else if (ch === q) out += '\\' + q;
      else if (ch === '\n') out += '\\n';
      else if (ch === '\t') out += '\\t';
      else if (ch === '\r') out += '\\r';
      else out += ch;
    }
    return q + out + q;
  }
  function repr(v) {
    if (typeof v === 'string') return strRepr(v);
    return str(v, true);
  }
  function str(v, asRepr) {
    if (v === null) return 'None';
    switch (typeof v) {
      case 'bigint': return v.toString();
      case 'number': return floatRepr(v);
      case 'string': return asRepr ? strRepr(v) : v;
      case 'boolean': return v ? 'True' : 'False';
    }
    if (Array.isArray(v)) {
      const inner = v.map(repr).join(', ');
      if (v.__tuple) return v.length === 1 ? '(' + inner + ',)' : '(' + inner + ')';
      return '[' + inner + ']';
    }
    if (v.__range) return v.step === 1n ? `range(${v.start}, ${v.stop})` : `range(${v.start}, ${v.stop}, ${v.step})`;
    if (v.__map) return `<map object at 0x${v.addr}>`;
    if (v.__type) return `<class '${v.__type}'>`;
    if (v.__builtin) return `<built-in function ${v.__builtin}>`;
    if (v.__module) return `<module '${v.__module}'>`;
    if (v.__method) return `<built-in method ${v.__method}>`;
    return '<object>';
  }
  function truthy(v) {
    if (v === null) return false;
    switch (typeof v) {
      case 'bigint': return v !== 0n;
      case 'number': return v !== 0;
      case 'string': return v.length > 0;
      case 'boolean': return v;
    }
    if (Array.isArray(v)) return v.length > 0;
    if (v.__range) return rangeLen(v) > 0n;
    return true;
  }
  const isNum = v => typeof v === 'bigint' || typeof v === 'number' || typeof v === 'boolean';
  const toBig = v => typeof v === 'boolean' ? (v ? 1n : 0n) : v;
  function rangeLen(r) {
    const { start, stop, step } = r;
    if (step > 0n) return stop > start ? (stop - start + step - 1n) / step : 0n;
    return start > stop ? (start - stop - step - 1n) / (-step) : 0n;
  }
  function editDist(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function floorDivBig(a, b) {
    const q = a / b;
    if ((a % b !== 0n) && ((a < 0n) !== (b < 0n))) return q - 1n;
    return q;
  }
  function modBig(a, b) { const m = a % b; return (m !== 0n && ((m < 0n) !== (b < 0n))) ? m + b : m; }

  /* ---------- лексер ---------- */
  const KEYWORDS = new Set(['False', 'None', 'True', 'and', 'or', 'not', 'for', 'in', 'while', 'if', 'elif', 'else', 'break', 'continue', 'pass', 'import', 'def', 'return', 'class', 'from', 'as', 'is', 'lambda', 'try', 'except', 'with', 'global', 'del', 'yield', 'raise', 'finally', 'assert', 'nonlocal', 'async', 'await']);
  const OPS = ['**=', '//=', '**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '->', '+', '-', '*', '/', '%', '<', '>', '=', '(', ')', '[', ']', '{', '}', ':', ',', '.', ';'];
  const BAD_QUOTES = { '‘': 'U+2018', '’': 'U+2019', '“': 'U+201C', '”': 'U+201D', '«': 'U+00AB', '»': 'U+00BB', '„': 'U+201E', '′': 'U+2032', 'ʼ': 'U+02BC' };

  function tokenize(src) {
    const toks = [];
    const lines = src.replace(/\r\n?/g, '\n').split('\n');
    const indents = [0];
    let depth = 0; const openStack = [];
    for (let ln = 0; ln < lines.length; ln++) {
      let line = lines[ln];
      let L = ln + 1;
      let i = 0;
      if (depth === 0) {
        let col = 0;
        while (i < line.length && (line[i] === ' ' || line[i] === '\t')) { col += line[i] === '\t' ? 4 : 1; i++; }
        if (i >= line.length || line[i] === '#') continue; // порожній рядок / коментар
        const top = indents[indents.length - 1];
        if (col > top) { indents.push(col); toks.push({ t: 'INDENT', line: L }); }
        else if (col < top) {
          while (col < indents[indents.length - 1]) { indents.pop(); toks.push({ t: 'DEDENT', line: L }); }
          if (col !== indents[indents.length - 1]) throw new PyError('IndentationError', 'unindent does not match any outer indentation level', L);
        }
      }
      while (i < line.length) {
        const c = line[i];
        if (c === ' ' || c === '\t') { i++; continue; }
        if (c === '#') break;
        if (c === '\\' && i === line.length - 1) { i++; continue; }
        // рядки
        let pre = '';
        if ((c === 'f' || c === 'F' || c === 'r' || c === 'R') && (line[i + 1] === '"' || line[i + 1] === "'")) { pre = c.toLowerCase(); i++; }
        const q = line[i];
        if (q === '"' || q === "'") {
          const triple = line.substr(i, 3) === q.repeat(3);
          if (triple) {
            let j = i + 3, buf = '', curLine = ln, curStr = line;
            for (;;) {
              const k = curStr.indexOf(q.repeat(3), j);
              if (k >= 0) { buf += curStr.slice(j, k); i = k + 3; break; }
              buf += curStr.slice(j) + '\n';
              curLine++;
              if (curLine >= lines.length) throw new PyError('SyntaxError', `unterminated triple-quoted string literal (detected at line ${lines.length})`, L);
              curStr = lines[curLine]; j = 0;
            }
            toks.push({ t: 'STR', v: pre === 'r' ? buf : unescape(buf), f: pre === 'f', line: L });
            if (curLine !== ln) { ln = curLine; line = curStr; L = ln + 1; }
            continue;
          }
          let j = i + 1, buf = '';
          while (j < line.length && line[j] !== q) {
            if (line[j] === '\\' && j + 1 < line.length) { buf += line[j] + line[j + 1]; j += 2; continue; }
            buf += line[j]; j++;
          }
          if (j >= line.length) throw new PyError('SyntaxError', `unterminated string literal (detected at line ${L})`, L);
          toks.push({ t: 'STR', v: pre === 'r' ? buf : unescape(buf), f: pre === 'f', line: L });
          i = j + 1; continue;
        }
        if (pre) { i--; }
        // числа
        if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(line[i + 1] || ''))) {
          const m = /^(\d[\d_]*)?(\.\d*)?([eE][+-]?\d+)?/.exec(line.slice(i));
          let txt = m[0];
          if (!txt) txt = c;
          const after = line[i + txt.length] || '';
          if (/[\p{L}_]/u.test(after)) throw new PyError('SyntaxError', 'invalid decimal literal', L);
          const clean = txt.replace(/_/g, '');
          if (m[2] !== undefined || m[3] !== undefined) toks.push({ t: 'NUM', v: parseFloat(clean), line: L });
          else {
            if (clean.length > 1 && clean[0] === '0' && /[1-9]/.test(clean)) throw new PyError('SyntaxError', 'leading zeros in decimal integer literals are not permitted; use an 0o prefix for octal integers', L);
            toks.push({ t: 'NUM', v: BigInt(clean), line: L });
          }
          i += txt.length; continue;
        }
        // імена
        const nm = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(line.slice(i));
        if (nm) {
          const w = nm[0];
          toks.push({ t: KEYWORDS.has(w) ? 'KW' : 'NAME', v: w, line: L });
          i += w.length; continue;
        }
        // оператори
        let op = null;
        for (const o of OPS) if (line.startsWith(o, i)) { op = o; break; }
        if (op) {
          if (op === '(' || op === '[' || op === '{') { depth++; openStack.push({ op, line: L }); }
          if (op === ')' || op === ']' || op === '}') {
            const want = { ')': '(', ']': '[', '}': '{' }[op];
            if (!openStack.length) throw new PyError('SyntaxError', `unmatched '${op}'`, L);
            const top = openStack.pop(); depth--;
            if (top.op !== want) throw new PyError('SyntaxError', `closing parenthesis '${op}' does not match opening parenthesis '${top.op}'`, L);
          }
          toks.push({ t: 'OP', v: op, line: L });
          i += op.length; continue;
        }
        if (BAD_QUOTES[c]) throw new PyError('SyntaxError', `invalid character '${c}' (${BAD_QUOTES[c]})`, L);
        if (c === '!' ) throw new PyError('SyntaxError', 'invalid syntax', L);
        throw new PyError('SyntaxError', `invalid character '${c}' (U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`, L);
      }
      if (depth === 0 && toks.length && toks[toks.length - 1].t !== 'NEWLINE' && toks[toks.length - 1].t !== 'INDENT' && toks[toks.length - 1].t !== 'DEDENT') toks.push({ t: 'NEWLINE', line: L });
    }
    if (openStack.length) { const o = openStack[openStack.length - 1]; throw new PyError('SyntaxError', `'${o.op}' was never closed`, o.line); }
    const last = lines.length;
    if (toks.length && toks[toks.length - 1].t !== 'NEWLINE') toks.push({ t: 'NEWLINE', line: last });
    while (indents.length > 1) { indents.pop(); toks.push({ t: 'DEDENT', line: last }); }
    toks.push({ t: 'EOF', line: last });
    return toks;
  }
  function unescape(s) {
    return s.replace(/\\(n|t|r|\\|'|"|0|\n)/g, (m, c) => ({ n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '0': '\0', '\n': '' }[c]));
  }

  /* ---------- парсер ---------- */
  function parse(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = (o = 0) => toks[p + o];
    const at = (t, v) => { const k = toks[p]; return k.t === t && (v === undefined || k.v === v); };
    const eat = (t, v) => { if (at(t, v)) return toks[p++]; return null; };
    const syntax = (msg, line) => new PyError('SyntaxError', msg || 'invalid syntax', line || peek().line);
    const expect = (t, v, msg) => { const k = eat(t, v); if (!k) throw syntax(msg); return k; };

    function parseFile() {
      const body = [];
      while (!at('EOF')) {
        if (eat('NEWLINE')) continue;
        if (at('INDENT')) throw new PyError('IndentationError', 'unexpected indent', peek().line);
        body.push(...statement());
      }
      return body;
    }
    function block(kind, line) {
      if (eat('NEWLINE')) {
        if (!eat('INDENT')) throw new PyError('IndentationError', `expected an indented block after '${kind}' statement on line ${line}`, peek().line);
        const body = [];
        while (!eat('DEDENT')) {
          if (at('EOF')) break;
          if (eat('NEWLINE')) continue;
          if (at('INDENT')) throw new PyError('IndentationError', 'unexpected indent', peek().line);
          body.push(...statement());
        }
        return body;
      }
      return simpleLine();
    }
    function statement() {
      const k = peek();
      if (k.t === 'KW') {
        if (k.v === 'for') {
          p++;
          const tgt = expect('NAME', undefined, 'invalid syntax');
          let targets = [tgt.v];
          while (eat('OP', ',')) targets.push(expect('NAME').v);
          expect('KW', 'in', "invalid syntax");
          const iter = exprList();
          expect('OP', ':', "expected ':'");
          const body = block('for', k.line);
          let orelse = null;
          if (at('KW', 'else') ) { const e = toks[p++]; expect('OP', ':', "expected ':'"); orelse = block('else', e.line); }
          return [{ k: 'for', targets, iter, body, orelse, line: k.line }];
        }
        if (k.v === 'while') {
          p++;
          const test = expr();
          if (at('OP', '=')) throw syntax("invalid syntax. Maybe you meant '==' or ':=' instead of '='?");
          expect('OP', ':', "expected ':'");
          const body = block('while', k.line);
          return [{ k: 'while', test, body, line: k.line }];
        }
        if (k.v === 'if') {
          p++;
          const test = expr();
          if (at('OP', '=')) throw syntax("invalid syntax. Maybe you meant '==' or ':=' instead of '='?");
          expect('OP', ':', "expected ':'");
          const body = block('if', k.line);
          const node = { k: 'if', test, body, orelse: [], line: k.line };
          let cur = node;
          for (;;) {
            if (at('KW', 'elif')) {
              const e = toks[p++];
              const t2 = expr(); expect('OP', ':', "expected ':'");
              const n2 = { k: 'if', test: t2, body: block('elif', e.line), orelse: [], line: e.line };
              cur.orelse = [n2]; cur = n2; continue;
            }
            if (at('KW', 'else')) {
              const e = toks[p++];
              expect('OP', ':', "expected ':'");
              cur.orelse = block('else', e.line);
            }
            break;
          }
          return [node];
        }
        if (['def', 'class', 'try', 'with', 'lambda', 'return', 'from', 'global', 'raise', 'yield', 'assert', 'del'].includes(k.v)) {
          throw new PyError('Unsupported', `Конструкцію «${k.v}» цей навчальний тренажер ще не підтримує. Вона є у справжньому Python — спробуй її в IDLE чи Thonny.`, k.line);
        }
        if (k.v === 'elif' || k.v === 'else') throw syntax('invalid syntax');
      }
      return simpleLine();
    }
    function simpleLine() {
      const out = [simple()];
      while (eat('OP', ';')) { if (at('NEWLINE')) break; out.push(simple()); }
      if (!eat('NEWLINE')) {
        if (at('EOF')) return out;
        throw syntax();
      }
      return out;
    }
    function simple() {
      const k = peek();
      if (k.t === 'KW') {
        if (k.v === 'pass') { p++; return { k: 'pass', line: k.line }; }
        if (k.v === 'break') { p++; return { k: 'break', line: k.line }; }
        if (k.v === 'continue') { p++; return { k: 'continue', line: k.line }; }
        if (k.v === 'import') {
          p++;
          const names = [expect('NAME').v];
          while (eat('OP', ',')) names.push(expect('NAME').v);
          return { k: 'import', names, line: k.line };
        }
      }
      const first = exprList();
      if (at('OP', '=')) {
        const targets = [first];
        let value;
        while (eat('OP', '=')) { value = exprList(); targets.push(value); }
        value = targets.pop();
        for (const t of targets) checkTarget(t, k.line);
        return { k: 'assign', targets, value, line: k.line };
      }
      const aug = ['+=', '-=', '*=', '/=', '//=', '%=', '**='].find(o => at('OP', o));
      if (aug) {
        p++;
        checkTarget(first, k.line, true);
        return { k: 'aug', target: first, op: aug.slice(0, -1), value: exprList(), line: k.line };
      }
      if (at('OP', '==') ) throw syntax();
      return { k: 'expr', e: first, line: k.line };
    }
    function checkTarget(t, line, aug) {
      if (t.k === 'name' || t.k === 'sub') return;
      if (t.k === 'tuple' && !aug && t.items.every(x => x.k === 'name' || x.k === 'sub')) return;
      if (t.k === 'call') throw new PyError('SyntaxError', "cannot assign to function call here. Maybe you meant '==' instead of '='?", line);
      if (t.k === 'const') throw new PyError('SyntaxError', "cannot assign to literal here. Maybe you meant '==' instead of '='?", line);
      throw new PyError('SyntaxError', "cannot assign to expression here. Maybe you meant '==' instead of '='?", line);
    }
    function exprList() {
      const line = peek().line;
      const first = expr();
      if (!at('OP', ',')) return first;
      const items = [first];
      while (eat('OP', ',')) {
        if (at('NEWLINE') || at('OP', '=') || at('OP', ')') || at('OP', ':') || at('EOF')) break;
        items.push(expr());
      }
      return { k: 'tuple', items, line };
    }
    function expr() { return orExpr(); }
    function orExpr() {
      let l = andExpr();
      while (at('KW', 'or')) { const t = toks[p++]; l = { k: 'bool', op: 'or', l, r: andExpr(), line: t.line }; }
      return l;
    }
    function andExpr() {
      let l = notExpr();
      while (at('KW', 'and')) { const t = toks[p++]; l = { k: 'bool', op: 'and', l, r: notExpr(), line: t.line }; }
      return l;
    }
    function notExpr() {
      if (at('KW', 'not')) { const t = toks[p++]; return { k: 'not', e: notExpr(), line: t.line }; }
      return comparison();
    }
    const CMP = ['==', '!=', '<', '>', '<=', '>='];
    function comparison() {
      const first = arith();
      const ops = [], rest = [];
      for (;;) {
        if (peek().t === 'OP' && CMP.includes(peek().v)) { ops.push(toks[p++].v); rest.push(arith()); continue; }
        if (at('KW', 'in')) { p++; ops.push('in'); rest.push(arith()); continue; }
        if (at('KW', 'not') && peek(1).t === 'KW' && peek(1).v === 'in') { p += 2; ops.push('not in'); rest.push(arith()); continue; }
        if (at('KW', 'is')) { p++; if (eat('KW', 'not')) ops.push('is not'); else ops.push('is'); rest.push(arith()); continue; }
        break;
      }
      if (!ops.length) return first;
      return { k: 'cmp', first, ops, rest, line: first.line };
    }
    function arith() {
      let l = term();
      while (peek().t === 'OP' && (peek().v === '+' || peek().v === '-')) { const t = toks[p++]; l = { k: 'bin', op: t.v, l, r: term(), line: t.line }; }
      return l;
    }
    function term() {
      let l = unary();
      while (peek().t === 'OP' && ['*', '/', '//', '%'].includes(peek().v)) { const t = toks[p++]; l = { k: 'bin', op: t.v, l, r: unary(), line: t.line }; }
      return l;
    }
    function unary() {
      if (peek().t === 'OP' && (peek().v === '-' || peek().v === '+')) { const t = toks[p++]; return { k: 'unary', op: t.v, e: unary(), line: t.line }; }
      return power();
    }
    function power() {
      const base = postfix();
      if (at('OP', '**')) { const t = toks[p++]; return { k: 'bin', op: '**', l: base, r: unary(), line: t.line }; }
      return base;
    }
    function postfix() {
      let e = atom();
      for (;;) {
        if (at('OP', '(')) {
          const t = toks[p++];
          const args = [], kwargs = [];
          while (!at('OP', ')')) {
            if (at('OP', '*')) {
              const t = toks[p++];
              args.push({ k: 'star', e: expr(), line: t.line });
            } else if (peek().t === 'NAME' && peek(1).t === 'OP' && peek(1).v === '=') {
              const n = toks[p].v; p += 2; kwargs.push({ name: n, v: expr() });
            } else {
              if (kwargs.length) throw syntax('positional argument follows keyword argument');
              args.push(expr());
            }
            if (!eat('OP', ',')) break;
          }
          if (!eat('OP', ')')) {
            const k = peek();
            if (k.t === 'NUM' || k.t === 'STR' || k.t === 'NAME') throw syntax('invalid syntax. Perhaps you forgot a comma?', k.line);
            throw syntax();
          }
          e = { k: 'call', f: e, args, kwargs, line: t.line };
          continue;
        }
        if (at('OP', '[')) {
          const t = toks[p++];
          let a = null, b = null, c = null, isSlice = false;
          if (!at('OP', ':')) a = expr();
          if (eat('OP', ':')) {
            isSlice = true;
            if (!at('OP', ']') && !at('OP', ':')) b = expr();
            if (eat('OP', ':')) { if (!at('OP', ']')) c = expr(); }
          }
          expect('OP', ']', "invalid syntax");
          e = isSlice ? { k: 'slice', obj: e, a, b, c, line: t.line } : { k: 'sub', obj: e, idx: a, line: t.line };
          continue;
        }
        if (at('OP', '.')) {
          const t = toks[p++];
          const n = expect('NAME', undefined, 'invalid syntax');
          e = { k: 'attr', obj: e, name: n.v, line: t.line };
          continue;
        }
        break;
      }
      return e;
    }
    function atom() {
      const k = peek();
      if (k.t === 'NUM') { p++; return { k: 'const', v: k.v, line: k.line }; }
      if (k.t === 'STR') {
        p++;
        const parts = [k];
        while (peek().t === 'STR') parts.push(toks[p++]);
        if (parts.some(x => x.f)) return { k: 'fstr', parts: parts.map(x => x.f ? parseFString(x.v, x.line) : [x.v]), line: k.line };
        return { k: 'const', v: parts.map(x => x.v).join(''), line: k.line };
      }
      if (k.t === 'NAME') { p++; return { k: 'name', id: k.v, line: k.line }; }
      if (k.t === 'KW') {
        if (k.v === 'True') { p++; return { k: 'const', v: true, line: k.line }; }
        if (k.v === 'False') { p++; return { k: 'const', v: false, line: k.line }; }
        if (k.v === 'None') { p++; return { k: 'const', v: null, line: k.line }; }
        throw syntax();
      }
      if (k.t === 'OP' && k.v === '(') {
        p++;
        if (eat('OP', ')')) return { k: 'tuple', items: [], line: k.line };
        const first = expr();
        if (eat('OP', ')')) return first;
        if (eat('OP', ',')) {
          const items = [first];
          while (!at('OP', ')')) { items.push(expr()); if (!eat('OP', ',')) break; }
          expect('OP', ')');
          return { k: 'tuple', items, line: k.line };
        }
        throw syntax('invalid syntax. Perhaps you forgot a comma?');
      }
      if (k.t === 'OP' && k.v === '[') {
        p++;
        const items = [];
        while (!at('OP', ']')) { items.push(expr()); if (!eat('OP', ',')) break; }
        expect('OP', ']', 'invalid syntax. Perhaps you forgot a comma?');
        return { k: 'list', items, line: k.line };
      }
      if (k.t === 'NEWLINE' || k.t === 'EOF') throw syntax('invalid syntax', k.line);
      if (k.t === 'INDENT') throw new PyError('IndentationError', 'unexpected indent', k.line);
      throw syntax();
    }
    function parseFString(s, line) {
      const parts = [];
      let i = 0, buf = '';
      while (i < s.length) {
        if (s[i] === '{' && s[i + 1] === '{') { buf += '{'; i += 2; continue; }
        if (s[i] === '}' && s[i + 1] === '}') { buf += '}'; i += 2; continue; }
        if (s[i] === '{') {
          const j = s.indexOf('}', i);
          if (j < 0) throw new PyError('SyntaxError', "f-string: expecting '}'", line);
          if (buf) parts.push(buf); buf = '';
          let inner = s.slice(i + 1, j), spec = '';
          const ci = inner.indexOf(':');
          if (ci >= 0) { spec = inner.slice(ci + 1); inner = inner.slice(0, ci); }
          const sub = parse(inner).body;
          if (sub.length !== 1 || sub[0].k !== 'expr') throw new PyError('SyntaxError', 'f-string: invalid syntax', line);
          parts.push({ e: sub[0].e, spec });
          i = j + 1; continue;
        }
        buf += s[i]; i++;
      }
      if (buf) parts.push(buf);
      return parts;
    }
    return { body: parseFile(), lines: src.replace(/\r\n?/g, '\n').split('\n') };
  }

  /* ---------- виконання ---------- */
  const ZEN = `The Zen of Python, by Tim Peters

Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
Complex is better than complicated.
Flat is better than nested.
Sparse is better than dense.
Readability counts.
Special cases aren't special enough to break the rules.
Although practicality beats purity.
Errors should never pass silently.
Unless explicitly silenced.
In the face of ambiguity, refuse the temptation to guess.
There should be one-- and preferably only one --obvious way to do it.
Although that way may not be obvious at first unless you're Dutch.
Now is better than never.
Although never is often better than *right* now.
If the implementation is hard to explain, it's a bad idea.
If the implementation is easy to explain, it may be a good idea.
Namespaces are one honking great idea -- let's do more of those!`;

  function run(src, opts = {}) {
    const inputs = (opts.inputs || []).slice();
    const out = []; // сегменти {text, kind}
    const events = [];
    let steps = 0, lines = 0;
    const MAX_STEPS = opts.maxSteps || 300000;
    const env = opts.env || Object.create(null);
    let curLine = 0;

    const write = (text, kind = 'out') => {
      if (!text) return;
      lines += (text.match(/\n/g) || []).length;
      if (lines > 3000) throw new PyError('OutputLimit', 'Програма вивела понад 3000 рядків — виконання зупинено.', curLine);
      const lastSeg = out[out.length - 1];
      if (lastSeg && lastSeg.kind === kind) lastSeg.text += text; else out.push({ text, kind });
    };
    const err = (type, msg) => new PyError(type, msg, curLine);
    const tick = () => { if (++steps > MAX_STEPS) throw new PyError('Timeout', 'Програма виконується надто довго (можливо, нескінченний цикл) — виконання зупинено.', curLine); };

    function argCount(name, args, min, max) {
      if (args.length < min || args.length > max) {
        if (min === max) throw err('TypeError', `${name}() takes exactly ${min} argument${min === 1 ? '' : 's'} (${args.length} given)`);
        throw err('TypeError', `${name} expected at most ${max} argument${max === 1 ? '' : 's'}, got ${args.length}`);
      }
    }
    function toInt(v) {
      if (typeof v === 'bigint') return v;
      if (typeof v === 'boolean') return v ? 1n : 0n;
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) throw err(Number.isNaN(v) ? 'ValueError' : 'OverflowError', Number.isNaN(v) ? 'cannot convert float NaN to integer' : 'cannot convert float infinity to integer');
        return BigInt(Math.trunc(v));
      }
      if (typeof v === 'string') {
        const s = v.trim().replace(/_/g, '');
        if (/^[+-]?\d+$/.test(s)) return BigInt(s);
        throw err('ValueError', `invalid literal for int() with base 10: ${strRepr(v)}`);
      }
      throw err('TypeError', `int() argument must be a string, a bytes-like object or a real number, not '${typeName(v)}'`);
    }
    function toFloat(v) {
      if (typeof v === 'number') return v;
      if (typeof v === 'bigint' || typeof v === 'boolean') return Number(toBig(v));
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (/^[+-]?(\d[\d_]*\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s)) return parseFloat(s.replace(/_/g, ''));
        if (/^[+-]?(inf|infinity)$/.test(s)) return s[0] === '-' ? -Infinity : Infinity;
        if (/^[+-]?nan$/.test(s)) return NaN;
        throw err('ValueError', `could not convert string to float: ${strRepr(v)}`);
      }
      throw err('TypeError', `float() argument must be a string or a real number, not '${typeName(v)}'`);
    }
    function iterate(v) {
      if (typeof v === 'string') return Array.from(v);
      if (Array.isArray(v)) return v;
      if (v && v.__range) {
        const n = rangeLen(v);
        if (n > 5000000n) throw new PyError('Timeout', 'Занадто великий range() для навчального тренажера.', curLine);
        const res = []; let x = v.start;
        for (let i = 0n; i < n; i++) { res.push(x); x += v.step; }
        return res;
      }
      if (v && v.__map) {
        const res = [], n = Math.min(...v.its.map(a => a.length));
        while (v.i < n) { const i = v.i++; res.push(callValue(v.f, v.its.map(a => a[i]), [])); }
        return res;
      }
      throw err('TypeError', `'${typeName(v)}' object is not iterable`);
    }
    function roundHalfEven(x) {
      const f = Math.floor(x), d = x - f;
      if (d > 0.5) return f + 1; if (d < 0.5) return f;
      return f % 2 === 0 ? f : f + 1;
    }

    const B = (name, fn) => ({ __builtin: name, fn });
    let mapSeq = 0;
    const builtins = {
      print: B('print', (args, kw) => {
        let sep = ' ', end = '\n';
        for (const k of kw) {
          if (k.name === 'sep') sep = k.v === null ? ' ' : (typeof k.v === 'string' ? k.v : (() => { throw err('TypeError', `sep must be None or a string, not ${typeName(k.v)}`); })());
          else if (k.name === 'end') end = k.v === null ? '\n' : (typeof k.v === 'string' ? k.v : (() => { throw err('TypeError', `end must be None or a string, not ${typeName(k.v)}`); })());
          else throw err('TypeError', `'${k.name}' is an invalid keyword argument for print()`);
        }
        write(args.map(a => str(a)).join(sep) + end);
        return null;
      }),
      input: B('input', (args) => {
        argCount('input', args, 0, 1);
        if (args.length) write(str(args[0]));
        if (!inputs.length) throw new NeedInput();
        const v = inputs.shift();
        write(v + '\n', 'in');
        return v;
      }),
      int: T('int', (args) => { argCount('int', args, 0, 1); return args.length ? toInt(args[0]) : 0n; }),
      float: T('float', (args) => { argCount('float', args, 0, 1); return args.length ? toFloat(args[0]) : 0; }),
      str: T('str', (args) => { argCount('str', args, 0, 1); return args.length ? str(args[0]) : ''; }),
      bool: T('bool', (args) => { argCount('bool', args, 0, 1); return args.length ? truthy(args[0]) : false; }),
      map: B('map', (args) => {
        if (args.length < 2) throw err('TypeError', 'map() must have at least two arguments.');
        return { __map: true, f: args[0], its: args.slice(1).map(iterate), i: 0, addr: (0x7f3a5c1b2e40 + 0x60 * mapSeq++).toString(16) };
      }),
      list: T('list', (args) => { argCount('list', args, 0, 1); return args.length ? iterate(args[0]).slice() : []; }),
      tuple: T('tuple', (args) => { const a = args.length ? iterate(args[0]).slice() : []; a.__tuple = true; return a; }),
      type: B('type', (args) => {
        argCount('type', args, 1, 1);
        const n = typeName(args[0]);
        return builtins[n] && builtins[n].__type ? builtins[n] : T(n);
      }),
      len: B('len', (args) => {
        argCount('len', args, 1, 1);
        const v = args[0];
        if (typeof v === 'string') return BigInt(Array.from(v).length);
        if (Array.isArray(v)) return BigInt(v.length);
        if (v && v.__range) return rangeLen(v);
        throw err('TypeError', `object of type '${typeName(v)}' has no len()`);
      }),
      abs: B('abs', (args) => {
        argCount('abs', args, 1, 1);
        const v = args[0];
        if (typeof v === 'number') return Math.abs(v);
        if (isNum(v)) { const b = toBig(v); return b < 0n ? -b : b; }
        throw err('TypeError', `bad operand type for abs(): '${typeName(v)}'`);
      }),
      round: B('round', (args) => {
        argCount('round', args, 1, 2);
        const v = args[0];
        if (!isNum(v)) throw err('TypeError', `type ${typeName(v)} doesn't define __round__ method`);
        if (args.length === 1 || args[1] === null) return typeof v === 'number' ? BigInt(roundHalfEven(v)) : toBig(v);
        const n = Number(toInt(args[1]));
        if (typeof v !== 'number') return toBig(v);
        const m = Math.pow(10, n);
        return roundHalfEven(Math.round(v * m * 1e6) / 1e6) / m;
      }),
      range: B('range', (args) => {
        if (args.length < 1 || args.length > 3) throw err('TypeError', `range expected at least 1 argument, got ${args.length}`);
        const ints = args.map(a => {
          if (typeof a === 'bigint' || typeof a === 'boolean') return toBig(a);
          throw err('TypeError', `'${typeName(a)}' object cannot be interpreted as an integer`);
        });
        let [start, stop, step] = ints.length === 1 ? [0n, ints[0], 1n] : [ints[0], ints[1], ints[2] ?? 1n];
        if (step === 0n) throw err('ValueError', 'range() arg 3 must not be zero');
        return { __range: true, start, stop, step };
      }),
      min: B('min', (args) => minmax(args, 'min')),
      max: B('max', (args) => minmax(args, 'max')),
      sum: B('sum', (args) => {
        let acc = 0n;
        for (const x of iterate(args[0])) acc = binop('+', acc, x);
        return acc;
      }),
      sorted: B('sorted', (args, kw) => {
        const a = iterate(args[0]).slice();
        a.sort((x, y) => compare(x, y));
        return sortKw(a, kw, 'sorted');
      }),
      reversed: B('reversed', (args) => iterate(args[0]).slice().reverse()),
      ord: B('ord', (args) => BigInt(String(args[0]).codePointAt(0))),
      chr: B('chr', (args) => String.fromCodePoint(Number(toInt(args[0])))),
      repr: B('repr', (args) => repr(args[0])),
      exit: B('exit', () => { throw new PyError('Exit', '', curLine); }),
      quit: B('quit', () => { throw new PyError('Exit', '', curLine); }),
    };
    function minmax(args, name) {
      const items = args.length === 1 ? iterate(args[0]) : args;
      if (!items.length) throw err('ValueError', `${name}() iterable argument is empty`);
      let best = items[0];
      for (const x of items.slice(1)) { const c = compare(x, best); if (name === 'min' ? c < 0 : c > 0) best = x; }
      return best;
    }
    const modules = {
      math: () => ({ __module: 'math', attrs: {
        pi: Math.PI, e: Math.E,
        sqrt: B('sqrt', a => { const v = toFloat(a[0]); if (v < 0) throw err('ValueError', 'math domain error'); return Math.sqrt(v); }),
        floor: B('floor', a => toInt(Math.floor(toFloat(a[0])))),
        ceil: B('ceil', a => toInt(Math.ceil(toFloat(a[0])))),
      } }),
    };

    function lookup(name) {
      if (name in env) return env[name];
      if (Object.prototype.hasOwnProperty.call(builtins, name)) return builtins[name];
      const all = [...Object.keys(env), ...Object.keys(builtins)];
      let hint = all.find(n => n.toLowerCase() === name.toLowerCase() && n !== name);
      if (!hint && name.length >= 3) hint = all.find(n => !n.startsWith('_') && n.length >= 3 && editDist(n, name) <= (name.length > 5 ? 2 : 1));
      throw err('NameError', `name '${name}' is not defined` + (hint ? `. Did you mean: '${hint}'?` : ''));
    }
    function compare(a, b) {
      if (isNum(a) && isNum(b)) {
        if (typeof a === 'number' || typeof b === 'number') { const x = Number(toBig(a)), y = Number(toBig(b)); return x < y ? -1 : x > y ? 1 : 0; }
        const x = toBig(a), y = toBig(b); return x < y ? -1 : x > y ? 1 : 0;
      }
      if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
      if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < Math.min(a.length, b.length); i++) { const c = compare(a[i], b[i]); if (c) return c; }
        return a.length - b.length;
      }
      return NaN;
    }
    function eq(a, b) {
      if (isNum(a) && isNum(b)) return compare(a, b) === 0;
      if (typeof a === 'string' && typeof b === 'string') return a === b;
      if (Array.isArray(a) && Array.isArray(b)) return !!a.__tuple === !!b.__tuple && a.length === b.length && a.every((x, i) => eq(x, b[i]));
      if (a && b && a.__type && b.__type) return a.__type === b.__type;
      return a === b;
    }
    const opName = { '+': '+', '-': '-', '*': '*', '/': '/', '//': '//', '%': '%', '**': '** or pow()' };
    function binop(op, a, b) {
      if (isNum(a) && isNum(b)) {
        if (typeof a === 'number' || typeof b === 'number') {
          const x = typeof a === 'number' ? a : Number(toBig(a)), y = typeof b === 'number' ? b : Number(toBig(b));
          switch (op) {
            case '+': return x + y; case '-': return x - y; case '*': return x * y;
            case '/': if (y === 0) throw err('ZeroDivisionError', 'float division by zero'); return x / y;
            case '//': if (y === 0) throw err('ZeroDivisionError', 'float floor division by zero'); return Math.floor(x / y);
            case '%': if (y === 0) throw err('ZeroDivisionError', 'float modulo by zero'); { const m = x - y * Math.floor(x / y); return m; }
            case '**': if (x === 0 && y < 0) throw err('ZeroDivisionError', 'zero to a negative power'); return Math.pow(x, y);
          }
        }
        const x = toBig(a), y = toBig(b);
        switch (op) {
          case '+': return x + y; case '-': return x - y; case '*': return x * y;
          case '/': if (y === 0n) throw err('ZeroDivisionError', 'division by zero'); return Number(x) / Number(y);
          case '//': if (y === 0n) throw err('ZeroDivisionError', 'integer division or modulo by zero'); return floorDivBig(x, y);
          case '%': if (y === 0n) throw err('ZeroDivisionError', 'integer modulo by zero'); return modBig(x, y);
          case '**':
            if (y < 0n) { if (x === 0n) throw err('ZeroDivisionError', 'zero to a negative power'); return Math.pow(Number(x), Number(y)); }
            if (y > 20000n && (x > 1n || x < -1n)) throw new PyError('Timeout', 'Занадто велике число для навчального тренажера.', curLine);
            return x ** y;
        }
      }
      if (op === '+') {
        if (typeof a === 'string' && typeof b === 'string') return a + b;
        if (Array.isArray(a) && Array.isArray(b) && !!a.__tuple === !!b.__tuple) { const r = a.concat(b); if (a.__tuple) r.__tuple = true; return r; }
        if (typeof a === 'string') throw err('TypeError', `can only concatenate str (not "${typeName(b)}") to str`);
        if (Array.isArray(a) && !a.__tuple) throw err('TypeError', `can only concatenate list (not "${typeName(b)}") to list`);
      }
      if (op === '*') {
        let s = null, n = null;
        if ((typeof a === 'string' || Array.isArray(a)) && (typeof b === 'bigint' || typeof b === 'boolean')) { s = a; n = toBig(b); }
        else if ((typeof b === 'string' || Array.isArray(b)) && (typeof a === 'bigint' || typeof a === 'boolean')) { s = b; n = toBig(a); }
        if (s !== null) {
          const k = n < 0n ? 0 : Number(n);
          if (k * (s.length || 1) > 1000000) throw new PyError('Timeout', 'Занадто довгий результат для навчального тренажера.', curLine);
          if (typeof s === 'string') return s.repeat(k);
          let r = []; for (let i = 0; i < k; i++) r = r.concat(s); if (s.__tuple) r.__tuple = true; return r;
        }
        if (typeof a === 'string' || Array.isArray(a)) throw err('TypeError', `can't multiply sequence by non-int of type '${typeName(b)}'`);
        if (typeof b === 'string' || Array.isArray(b)) throw err('TypeError', `can't multiply sequence by non-int of type '${typeName(a)}'`);
      }
      throw err('TypeError', `unsupported operand type(s) for ${opName[op]}: '${typeName(a)}' and '${typeName(b)}'`);
    }
    function index(obj, i) {
      if (typeof obj === 'string' || Array.isArray(obj)) {
        const arr = typeof obj === 'string' ? Array.from(obj) : obj;
        if (typeof i !== 'bigint' && typeof i !== 'boolean') throw err('TypeError', `${typeName(obj)} indices must be integers or slices, not ${typeName(i)}`);
        let n = Number(toBig(i)); if (n < 0) n += arr.length;
        if (n < 0 || n >= arr.length) throw err('IndexError', `${typeName(obj)} index out of range`);
        return arr[n];
      }
      throw err('TypeError', `'${typeName(obj)}' object is not subscriptable`);
    }
    /** sort()/sorted(): з іменованих аргументів — лише reverse. Невідомий аргумент — помилка, а не мовчки неправильний результат. */
    function sortKw(a, kw, fname) {
      for (const k of kw) {
        if (k.name === 'key') throw new PyError('Unsupported', 'Аргумент key= цей навчальний тренажер ще не підтримує. Він є у справжньому Python — спробуй його в IDLE чи Thonny.', curLine);
        if (k.name !== 'reverse') throw err('TypeError', `'${k.name}' is an invalid keyword argument for ${fname}()`);
        if (truthy(k.v)) a.reverse();
      }
      return a;
    }
    function callMethod(obj, name, args, kw) {
      const t = typeName(obj);
      if (kw.length && !(t === 'list' && name === 'sort')) throw err('TypeError', `${t}.${name}() takes no keyword arguments`);
      if (t === 'str') {
        const m = {
          upper: () => obj.toUpperCase(), lower: () => obj.toLowerCase(),
          strip: () => obj.trim(), title: () => obj.replace(/\p{L}+/gu, w => w[0].toUpperCase() + w.slice(1).toLowerCase()),
          capitalize: () => obj ? obj[0].toUpperCase() + obj.slice(1).toLowerCase() : obj,
          replace: () => obj.split(str(args[0])).join(str(args[1])),
          split: () => args.length ? obj.split(str(args[0])) : obj.trim().split(/\s+/).filter(Boolean),
          count: () => BigInt(obj.split(str(args[0])).length - 1),
          find: () => BigInt(obj.indexOf(str(args[0]))),
          startswith: () => obj.startsWith(str(args[0])), endswith: () => obj.endsWith(str(args[0])),
          isdigit: () => /^\d+$/.test(obj), isalpha: () => /^\p{L}+$/u.test(obj),
          join: () => iterate(args[0]).map(x => { if (typeof x !== 'string') throw err('TypeError', `sequence item: expected str instance, ${typeName(x)} found`); return x; }).join(obj),
        }[name];
        if (m) return m();
      }
      if (t === 'list') {
        const m = {
          append: () => { obj.push(args[0]); return null; },
          pop: () => { if (!obj.length) throw err('IndexError', 'pop from empty list'); if (args.length) { let n = Number(toInt(args[0])); if (n < 0) n += obj.length; if (n < 0 || n >= obj.length) throw err('IndexError', 'pop index out of range'); return obj.splice(n, 1)[0]; } return obj.pop(); },
          insert: () => { let n = Number(toInt(args[0])); if (n < 0) n = Math.max(0, n + obj.length); obj.splice(n, 0, args[1]); return null; },
          remove: () => { const i = obj.findIndex(x => eq(x, args[0])); if (i < 0) throw err('ValueError', 'list.remove(x): x not in list'); obj.splice(i, 1); return null; },
          sort: () => { obj.sort((x, y) => compare(x, y)); sortKw(obj, kw, 'sort'); return null; },
          reverse: () => { obj.reverse(); return null; },
          index: () => { const i = obj.findIndex(x => eq(x, args[0])); if (i < 0) throw err('ValueError', `${repr(args[0])} is not in list`); return BigInt(i); },
          count: () => BigInt(obj.filter(x => eq(x, args[0])).length),
          clear: () => { obj.length = 0; return null; },
        }[name];
        if (m) return m();
      }
      throw err('AttributeError', `'${t}' object has no attribute '${name}'`);
    }

    function callValue(f, args, kwargs) {
      if (f && f.__method) return callMethod(f.obj, f.name, args, kwargs);
      if (f && (f.__builtin || f.call)) {
        if (kwargs.length && f.__builtin !== 'print' && f.__builtin !== 'sorted') throw err('TypeError', `${f.__builtin || f.__type}() takes no keyword arguments`);
        return (f.fn || f.call)(args, kwargs);
      }
      if (f && f.__type && !f.call) throw err('TypeError', `cannot create '${f.__type}' instances`);
      throw err('TypeError', `'${typeName(f)}' object is not callable`);
    }
    function evalE(n) {
      switch (n.k) {
        case 'const': return n.v;
        case 'name': curLine = n.line; return lookup(n.id);
        case 'fstr': return n.parts.map(part => part.map(x => {
          if (typeof x === 'string') return x;
          const v = evalE(x.e);
          if (x.spec) {
            const m = /^\.(\d+)f$/.exec(x.spec);
            if (m) return toFloat(v).toFixed(+m[1]);
          }
          return str(v);
        }).join('')).join('');
        case 'tuple': { const r = n.items.map(evalE); r.__tuple = true; return r; }
        case 'list': return n.items.map(evalE);
        case 'bool': { const l = evalE(n.l); if (n.op === 'and') return truthy(l) ? evalE(n.r) : l; return truthy(l) ? l : evalE(n.r); }
        case 'not': return !truthy(evalE(n.e));
        case 'unary': {
          const v = evalE(n.e); curLine = n.line;
          if (typeof v === 'number') return n.op === '-' ? -v : v;
          if (isNum(v)) return n.op === '-' ? -toBig(v) : toBig(v);
          throw err('TypeError', `bad operand type for unary ${n.op}: '${typeName(v)}'`);
        }
        case 'bin': { const a = evalE(n.l), b = evalE(n.r); curLine = n.line; return binop(n.op, a, b); }
        case 'cmp': {
          let a = evalE(n.first);
          for (let i = 0; i < n.ops.length; i++) {
            const b = evalE(n.rest[i]); const op = n.ops[i]; let r;
            curLine = n.line;
            if (op === '==') r = eq(a, b);
            else if (op === '!=') r = !eq(a, b);
            else if (op === 'is') r = a === b || (a === null && b === null);
            else if (op === 'is not') r = !(a === b);
            else if (op === 'in' || op === 'not in') {
              let has;
              if (typeof b === 'string') { if (typeof a !== 'string') throw err('TypeError', `'in <string>' requires string as left operand, not ${typeName(a)}`); has = b.includes(a); }
              else has = iterate(b).some(x => eq(x, a));
              r = op === 'in' ? has : !has;
            } else {
              const c = compare(a, b);
              if (Number.isNaN(c)) throw err('TypeError', `'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`);
              r = op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
            }
            if (!r) return false;
            a = b;
          }
          return true;
        }
        case 'sub': { const o = evalE(n.obj), i = evalE(n.idx); curLine = n.line; return index(o, i); }
        case 'slice': {
          const o = evalE(n.obj); curLine = n.line;
          if (typeof o !== 'string' && !Array.isArray(o)) throw err('TypeError', `'${typeName(o)}' object is not subscriptable`);
          const arr = typeof o === 'string' ? Array.from(o) : o;
          const len = arr.length;
          const step = n.c ? Number(toInt(evalE(n.c))) : 1;
          if (step === 0) throw err('ValueError', 'slice step cannot be zero');
          const norm = (x, d) => { if (x === null) return d; let v = Number(toInt(x)); if (v < 0) v += len; return step > 0 ? Math.min(Math.max(v, 0), len) : Math.min(Math.max(v, -1), len - 1); };
          const a = norm(n.a ? evalE(n.a) : null, step > 0 ? 0 : len - 1);
          const b = norm(n.b ? evalE(n.b) : null, step > 0 ? len : -1);
          const res = [];
          if (step > 0) for (let i = a; i < b; i += step) res.push(arr[i]);
          else for (let i = a; i > b; i += step) res.push(arr[i]);
          if (typeof o === 'string') return res.join('');
          if (o.__tuple) res.__tuple = true;
          return res;
        }
        case 'attr': {
          const o = evalE(n.obj); curLine = n.line;
          if (o && o.__module) {
            if (n.name in o.attrs) return o.attrs[n.name];
            throw err('AttributeError', `module '${o.__module}' has no attribute '${n.name}'`);
          }
          return { __method: `${n.name} of ${typeName(o)} object`, obj: o, name: n.name };
        }
        case 'call': {
          const f = evalE(n.f);
          const args = [];
          for (const a of n.args) {
            if (a.k !== 'star') { args.push(evalE(a)); continue; }
            const v = evalE(a.e);
            let items;
            try { items = iterate(v); } catch (e) {
              if (e.pyType !== 'TypeError') throw e;
              throw err('TypeError', `${f && (f.__builtin || f.__type || f.name) || 'function'}() argument after * must be an iterable, not ${typeName(v)}`);
            }
            for (const x of items) args.push(x);
          }
          const kwargs = n.kwargs.map(k => ({ name: k.name, v: evalE(k.v) }));
          curLine = n.line; tick();
          return callValue(f, args, kwargs);
        }
      }
      throw err('SystemError', 'unknown node ' + n.k);
    }
    function assign(t, v) {
      if (t.k === 'name') {
        if (Object.prototype.hasOwnProperty.call(builtins, t.id) && !(t.id in env)) events.push({ type: 'shadow', name: t.id, line: curLine });
        env[t.id] = v; return;
      }
      if (t.k === 'sub') {
        const o = evalE(t.obj), i = evalE(t.idx);
        if (Array.isArray(o) && !o.__tuple) {
          if (typeof i !== 'bigint') throw err('TypeError', `list indices must be integers or slices, not ${typeName(i)}`);
          let n = Number(i); if (n < 0) n += o.length;
          if (n < 0 || n >= o.length) throw err('IndexError', 'list assignment index out of range');
          o[n] = v; return;
        }
        throw err('TypeError', `'${typeName(o)}' object does not support item assignment`);
      }
      if (t.k === 'tuple') {
        const vals = iterate(v);
        if (vals.length !== t.items.length) throw err('ValueError', vals.length > t.items.length ? `too many values to unpack (expected ${t.items.length})` : `not enough values to unpack (expected ${t.items.length}, got ${vals.length})`);
        t.items.forEach((x, i) => assign(x, vals[i]));
      }
    }
    function execBlock(stmts) { for (const s of stmts) execS(s); }
    function execS(s) {
      curLine = s.line; tick();
      switch (s.k) {
        case 'expr': {
          const v = evalE(s.e);
          if (opts.repl && v !== null) write(repr(v) + '\n');
          return;
        }
        case 'assign': { const v = evalE(s.value); for (const t of s.targets) { curLine = s.line; assign(t, v); } return; }
        case 'aug': {
          const cur = evalE(s.target); const v = evalE(s.value); curLine = s.line;
          if (Array.isArray(cur) && !cur.__tuple && s.op === '+') { cur.push(...iterate(v)); return; }
          assign(s.target, binop(s.op, cur, v)); return;
        }
        case 'pass': return;
        case 'break': throw BREAK;
        case 'continue': throw CONTINUE;
        case 'import':
          for (const nm of s.names) {
            if (nm === 'this') { write(ZEN + '\n'); events.push({ type: 'zen' }); }
            else if (nm === 'antigravity') { events.push({ type: 'antigravity' }); }
            else if (modules[nm]) env[nm] = modules[nm]();
            else if (['random', 'time', 'turtle', 'os', 'sys', 'datetime', 'string', 'statistics', 'tkinter', 'pygame', 'json', 'collections', 'itertools'].includes(nm))
              throw new PyError('Unsupported', `Модуля «${nm}» у цьому навчальному тренажері немає (у справжньому Python він є). Тут доступні лише math, this та antigravity.`, curLine);
            else throw err('ModuleNotFoundError', `No module named '${nm}'`);
          }
          return;
        case 'if': {
          if (truthy(evalE(s.test))) execBlock(s.body); else execBlock(s.orelse);
          return;
        }
        case 'while': {
          while (truthy(evalE(s.test))) {
            try { execBlock(s.body); } catch (e) { if (e === BREAK) break; if (e === CONTINUE) continue; throw e; }
            curLine = s.line; tick();
          }
          return;
        }
        case 'for': {
          const items = iterate(evalE(s.iter));
          let broke = false;
          for (const it of items) {
            if (s.targets.length === 1) env[s.targets[0]] = it;
            else assign({ k: 'tuple', items: s.targets.map(id => ({ k: 'name', id })) }, it);
            try { execBlock(s.body); } catch (e) { if (e === BREAK) { broke = true; break; } if (e === CONTINUE) continue; throw e; }
          }
          if (!broke && s.orelse) execBlock(s.orelse);
          return;
        }
      }
    }

    let tree, srcLines = src.replace(/\r\n?/g, '\n').split('\n');
    const result = { out, env, events, error: null, needInput: false };
    try {
      tree = parse(src);
      execBlock(tree.body);
    } catch (e) {
      if (e instanceof NeedInput) { result.needInput = true; }
      else if (e instanceof PyError) {
        if (e.pyType !== 'Exit') result.error = { type: e.pyType, msg: e.pyMsg, line: e.line, code: (srcLines[(e.line || 1) - 1] || '').trim() };
      } else if (e === BREAK || e === CONTINUE) {
        result.error = { type: 'SyntaxError', msg: `'${e === BREAK ? 'break' : 'continue'}' outside loop`, line: curLine, code: (srcLines[curLine - 1] || '').trim() };
      } else if (e instanceof RangeError) {
        result.error = { type: 'RecursionError', msg: 'Занадто складний вираз', line: curLine, code: '' };
      } else throw e;
    }
    return result;
  }

  function formatError(e) {
    if (!e) return '';
    if (['Unsupported', 'Timeout', 'OutputLimit'].includes(e.type)) return e.msg;
    if (['SyntaxError', 'IndentationError'].includes(e.type)) {
      return `  File "main.py", line ${e.line}\n    ${e.code}\n${e.type}: ${e.msg}`;
    }
    return `Traceback (most recent call last):\n  File "main.py", line ${e.line}, in <module>\n    ${e.code}\n${e.type}: ${e.msg}`;
  }
  function outputText(res) { return res.out.map(s => s.text).join(''); }

  return { run, repr, str, formatError, outputText, typeName, tokenize };
})();

export { Py };
