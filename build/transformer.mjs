import ts from 'typescript';
import path$1, { dirname } from 'path';
import * as fs from 'fs';
import fs__default from 'fs';
import { array, object, is, isLittleEndian, isDef, toString } from '@libmedia/common';
import { execSync } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

function getFilePath(program, current, target) {
    var _a;
    const path = ts.resolveModuleName(target, current, program.getCompilerOptions(), ts.sys);
    return (_a = path.resolvedModule) === null || _a === void 0 ? void 0 : _a.resolvedFileName;
}

function parseImports(file, program, typeChecker, locals) {
    const map = new Map();
    file.statements.forEach((node) => {
        if (ts.isImportDeclaration(node)) {
            const ext = path$1.extname(node.moduleSpecifier.text);
            if (!ext || ext === '.ts') {
                const specifier = node.moduleSpecifier.text.split('!').pop();
                const filePath = getFilePath(program, file.fileName, specifier);
                if (filePath) {
                    const m = map.get(filePath) || {
                        map: new Map(),
                        specifier
                    };
                    if (node.importClause && ts.isImportClause(node.importClause)) {
                        if (node.importClause.isTypeOnly
                            || node.importClause.phaseModifier === ts.SyntaxKind.TypeKeyword) {
                            return;
                        }
                        if (node.importClause.name && ts.isIdentifier(node.importClause.name)) {
                            m.map.set('default', node.importClause.name.escapedText);
                            locals.set(node.importClause.name.escapedText, typeChecker.getSymbolAtLocation(node.importClause.name));
                        }
                        if (node.importClause.namedBindings) {
                            if (ts.isNamedImports(node.importClause.namedBindings)) {
                                node.importClause.namedBindings.elements.forEach((element) => {
                                    if (element.isTypeOnly) {
                                        return;
                                    }
                                    if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                                        m.map.set(element.propertyName.escapedText, element.name.escapedText);
                                        locals.set(element.propertyName.escapedText, typeChecker.getSymbolAtLocation(element.propertyName));
                                    }
                                    else {
                                        m.map.set(element.name.escapedText, element.name.escapedText);
                                        locals.set(element.name.escapedText, typeChecker.getSymbolAtLocation(element.name));
                                    }
                                });
                            }
                            else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                                m.map.set('all', node.importClause.namedBindings.name.escapedText);
                            }
                        }
                    }
                    map.set(filePath, m);
                }
            }
        }
    });
    return map;
}

function pushImport(keys, name, path, formatName, defaultExport) {
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].name === name && keys[i].path === path) {
            return keys[i];
        }
    }
    const item = {
        name,
        path,
        default: defaultExport,
        formatName
    };
    keys.push(item);
    return item;
}
function pushRequire(keys, formatName, path, defaultExport, esModule) {
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].path === path && keys[i].default === defaultExport) {
            return keys[i];
        }
    }
    const item = {
        formatName,
        path,
        default: defaultExport,
        esModule
    };
    keys.push(item);
    return item;
}

const accessof = 'accessof';
const addressof = 'addressof';
const offsetof = 'offsetof';
const memcpy = 'memcpy';
const sizeof = 'sizeof';
const move = 'move';
const staticCast = 'static_cast';
const assert = 'assert';
const indexOf = 'indexOf';
const reinterpretCast = 'reinterpret_cast';
const sharedPtr = 'SharedPtr';
const structAccess = 'mapStruct';
const ctypeEnumWrite = 'CTypeEnumWrite';
const ctypeEnumRead = 'CTypeEnumRead';
const definedMetaProperty = 'definedMetaProperty';
const symbolStructAddress = 'symbolStructAddress';
const symbolStruct = 'symbolStruct';
const symbolStructMaxBaseTypeByteLength$1 = 'symbolStructMaxBaseTypeByteLength';
const symbolStructLength$1 = 'symbolStructLength';
const symbolStructKeysMeta = 'symbolStructKeysMeta';
const createThreadFromClass = 'createThreadFromClass';
const createThreadFromFunction = 'createThreadFromFunction';
const createThreadFromModule = 'createThreadFromModule';
const typeArray = 'array';
const typeBit = 'bit';
const typePointer = 'pointer';
const typeSize = 'size';
const typeAnyptr = 'anyptr';
const typeNullptr = 'nullptr';
const typeMultiPointer = 'multiPointer';
const typeUnion = 'union';
const typeStruct = 'struct';
const defined = 'defined';
const args = 'args';
const enableArgs = 'enableArgs';
const enumPointer = 'typeptr';
const tagAsm = 'asm';
const tagAsm64 = 'asm64';
const prototype = 'prototype';
const cstruct = 'struct';
const cunion = 'union';
const ctype = 'type';
const cpointer = 'pointer';
const carray = 'array';
const cbitField = 'bit';
const cignore = 'ignore';
const cinline = 'inline';
const cdeasync = 'deasync';
const make = 'make';
const unmake = 'unmake';
const malloc = 'malloc';
const calloc = 'calloc';
const realloc = 'realloc';
const alignedAlloc = 'aligned_alloc';
const free = 'free';
const Allocator = 'Allocator';
const makeSharedPtr = 'make_shared_ptr';
const makeSharedPtrImportName = 'makeSharedPtr';
const smartPointerProperty = ['get', 'reset', 'unique', 'useCount', 'has', 'transferable', 'clone'];
const typeProperty = 'zzztype__';
const levelProperty = 'zzzlevel__';
const structProperty = 'zzzstruct__';
const LINE = '___LINE__';
const LINE_2 = '__LINE__';
const FILE = '___FILE__';
const FILE_2 = '__FILE__';
const importStar = '__importStar';
const importDefault = '__importDefault';
let PACKET_NAME = '';
let RootPath = '';
let InternalPath = '';
let AllocatorPath = '';
let makePath = '';
let unmakePath = '';
let makeSharedPtrPath = '';
let atomicsPath = '';
let sizeofPath = '';
let definedMetaPropertyPath = '';
let memoryPath = '';
let symbolPath = '';
let structAccessPath = '';
let ctypeEnumReadPath = '';
let ctypeEnumWritePath = '';
let cheapThreadPath = '';
function setPacketName(name) {
    PACKET_NAME = name;
    RootPath = PACKET_NAME;
    InternalPath = PACKET_NAME + '/internal';
    AllocatorPath = PACKET_NAME + '/heap';
    makePath = PACKET_NAME + '/std/make';
    unmakePath = PACKET_NAME + '/std/unmake';
    makeSharedPtrPath = PACKET_NAME + '/std/smartPtr/SharedPtr';
    atomicsPath = PACKET_NAME + '/thread/atomics';
    sizeofPath = PACKET_NAME + '/std/sizeof';
    definedMetaPropertyPath = PACKET_NAME + '/function/definedMetaProperty';
    memoryPath = PACKET_NAME + '/std/memory';
    symbolPath = PACKET_NAME + '/symbol';
    structAccessPath = PACKET_NAME + '/std/mapStruct';
    ctypeEnumReadPath = PACKET_NAME + '/ctypeEnumRead';
    ctypeEnumWritePath = PACKET_NAME + '/ctypeEnumWrite';
    cheapThreadPath = PACKET_NAME + '/thread/thread';
}

function addImportStatements(imports, path, updatedStatements) {
    if (imports.length) {
        const importElements = [];
        imports.forEach((item) => {
            importElements.push(statement.context.factory.createImportSpecifier(false, statement.context.factory.createIdentifier(item.name), statement.context.factory.createIdentifier(item.formatName)));
        });
        const importDeclaration = statement.context.factory.createImportDeclaration(undefined, statement.context.factory.createImportClause(false, undefined, statement.context.factory.createNamedImports(importElements)), statement.context.factory.createStringLiteral(path));
        updatedStatements.push(importDeclaration);
    }
}

function relativePath(a, b) {
    let p = path$1.relative(path$1.dirname(a), b);
    // 去掉 d.ts .ts .js 后缀
    p = p.replace(/(\.d)?\.[t|j]s$/, '');
    if (path$1.isAbsolute(p)) {
        return p;
    }
    else if (/\.\.\//.test(p)) {
        return p;
    }
    return './' + p;
}

const balanced = (a, b, str) => {
    const ma = a instanceof RegExp ? maybeMatch(a, str) : a;
    const mb = b instanceof RegExp ? maybeMatch(b, str) : b;
    const r = ma !== null && mb != null && range(ma, mb, str);
    return (r && {
        start: r[0],
        end: r[1],
        pre: str.slice(0, r[0]),
        body: str.slice(r[0] + ma.length, r[1]),
        post: str.slice(r[1] + mb.length),
    });
};
const maybeMatch = (reg, str) => {
    const m = str.match(reg);
    return m ? m[0] : null;
};
const range = (a, b, str) => {
    let begs, beg, left, right = undefined, result;
    let ai = str.indexOf(a);
    let bi = str.indexOf(b, ai + 1);
    let i = ai;
    if (ai >= 0 && bi > 0) {
        if (a === b) {
            return [ai, bi];
        }
        begs = [];
        left = str.length;
        while (i >= 0 && !result) {
            if (i === ai) {
                begs.push(i);
                ai = str.indexOf(a, i + 1);
            }
            else if (begs.length === 1) {
                const r = begs.pop();
                if (r !== undefined)
                    result = [r, bi];
            }
            else {
                beg = begs.pop();
                if (beg !== undefined && beg < left) {
                    left = beg;
                    right = bi;
                }
                bi = str.indexOf(b, i + 1);
            }
            i = ai < bi && ai >= 0 ? ai : bi;
        }
        if (begs.length && right !== undefined) {
            result = [left, right];
        }
    }
    return result;
};

const escSlash = '\0SLASH' + Math.random() + '\0';
const escOpen = '\0OPEN' + Math.random() + '\0';
const escClose = '\0CLOSE' + Math.random() + '\0';
const escComma = '\0COMMA' + Math.random() + '\0';
const escPeriod = '\0PERIOD' + Math.random() + '\0';
const escSlashPattern = new RegExp(escSlash, 'g');
const escOpenPattern = new RegExp(escOpen, 'g');
const escClosePattern = new RegExp(escClose, 'g');
const escCommaPattern = new RegExp(escComma, 'g');
const escPeriodPattern = new RegExp(escPeriod, 'g');
const slashPattern = /\\\\/g;
const openPattern = /\\{/g;
const closePattern = /\\}/g;
const commaPattern = /\\,/g;
const periodPattern = /\\./g;
function numeric(str) {
    return !isNaN(str) ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces(str) {
    return str
        .replace(slashPattern, escSlash)
        .replace(openPattern, escOpen)
        .replace(closePattern, escClose)
        .replace(commaPattern, escComma)
        .replace(periodPattern, escPeriod);
}
function unescapeBraces(str) {
    return str
        .replace(escSlashPattern, '\\')
        .replace(escOpenPattern, '{')
        .replace(escClosePattern, '}')
        .replace(escCommaPattern, ',')
        .replace(escPeriodPattern, '.');
}
/**
 * Basically just str.split(","), but handling cases
 * where we have nested braced sections, which should be
 * treated as individual members, like {a,{b,c},d}
 */
function parseCommaParts(str) {
    if (!str) {
        return [''];
    }
    const parts = [];
    const m = balanced('{', '}', str);
    if (!m) {
        return str.split(',');
    }
    const { pre, body, post } = m;
    const p = pre.split(',');
    p[p.length - 1] += '{' + body + '}';
    const postParts = parseCommaParts(post);
    if (post.length) {
        p[p.length - 1] += postParts.shift();
        p.push.apply(p, postParts);
    }
    parts.push.apply(parts, p);
    return parts;
}
function expand(str) {
    if (!str) {
        return [];
    }
    // I don't know why Bash 4.3 does this, but it does.
    // Anything starting with {} will have the first two bytes preserved
    // but *only* at the top level, so {},a}b will not expand to anything,
    // but a{},b}c will be expanded to [a}c,abc].
    // One could argue that this is a bug in Bash, but since the goal of
    // this module is to match Bash's rules, we escape a leading {}
    if (str.slice(0, 2) === '{}') {
        str = '\\{\\}' + str.slice(2);
    }
    return expand_(escapeBraces(str), true).map(unescapeBraces);
}
function embrace(str) {
    return '{' + str + '}';
}
function isPadded(el) {
    return /^-?0\d/.test(el);
}
function lte(i, y) {
    return i <= y;
}
function gte(i, y) {
    return i >= y;
}
function expand_(str, isTop) {
    /** @type {string[]} */
    const expansions = [];
    const m = balanced('{', '}', str);
    if (!m)
        return [str];
    // no need to expand pre, since it is guaranteed to be free of brace-sets
    const pre = m.pre;
    const post = m.post.length ? expand_(m.post, false) : [''];
    if (/\$$/.test(m.pre)) {
        for (let k = 0; k < post.length; k++) {
            const expansion = pre + '{' + m.body + '}' + post[k];
            expansions.push(expansion);
        }
    }
    else {
        const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
        const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
        const isSequence = isNumericSequence || isAlphaSequence;
        const isOptions = m.body.indexOf(',') >= 0;
        if (!isSequence && !isOptions) {
            // {a},b}
            if (m.post.match(/,(?!,).*\}/)) {
                str = m.pre + '{' + m.body + escClose + m.post;
                return expand_(str);
            }
            return [str];
        }
        let n;
        if (isSequence) {
            n = m.body.split(/\.\./);
        }
        else {
            n = parseCommaParts(m.body);
            if (n.length === 1 && n[0] !== undefined) {
                // x{{a,b}}y ==> x{a}y x{b}y
                n = expand_(n[0], false).map(embrace);
                //XXX is this necessary? Can't seem to hit it in tests.
                /* c8 ignore start */
                if (n.length === 1) {
                    return post.map(p => m.pre + n[0] + p);
                }
                /* c8 ignore stop */
            }
        }
        // at this point, n is the parts, and we know it's not a comma set
        // with a single entry.
        let N;
        if (isSequence && n[0] !== undefined && n[1] !== undefined) {
            const x = numeric(n[0]);
            const y = numeric(n[1]);
            const width = Math.max(n[0].length, n[1].length);
            let incr = n.length === 3 && n[2] !== undefined ? Math.abs(numeric(n[2])) : 1;
            let test = lte;
            const reverse = y < x;
            if (reverse) {
                incr *= -1;
                test = gte;
            }
            const pad = n.some(isPadded);
            N = [];
            for (let i = x; test(i, y); i += incr) {
                let c;
                if (isAlphaSequence) {
                    c = String.fromCharCode(i);
                    if (c === '\\') {
                        c = '';
                    }
                }
                else {
                    c = String(i);
                    if (pad) {
                        const need = width - c.length;
                        if (need > 0) {
                            const z = new Array(need + 1).join('0');
                            if (i < 0) {
                                c = '-' + z + c.slice(1);
                            }
                            else {
                                c = z + c;
                            }
                        }
                    }
                }
                N.push(c);
            }
        }
        else {
            N = [];
            for (let j = 0; j < n.length; j++) {
                N.push.apply(N, expand_(n[j], false));
            }
        }
        for (let j = 0; j < N.length; j++) {
            for (let k = 0; k < post.length; k++) {
                const expansion = pre + N[j] + post[k];
                if (!isTop || isSequence || expansion) {
                    expansions.push(expansion);
                }
            }
        }
    }
    return expansions;
}

const MAX_PATTERN_LENGTH = 1024 * 64;
const assertValidPattern = (pattern) => {
    if (typeof pattern !== 'string') {
        throw new TypeError('invalid pattern');
    }
    if (pattern.length > MAX_PATTERN_LENGTH) {
        throw new TypeError('pattern is too long');
    }
};

// translate the various posix character classes into unicode properties
// this works across all unicode locales
// { <posix class>: [<translation>, /u flag required, negated]
const posixClasses = {
    '[:alnum:]': ['\\p{L}\\p{Nl}\\p{Nd}', true],
    '[:alpha:]': ['\\p{L}\\p{Nl}', true],
    '[:ascii:]': ['\\x' + '00-\\x' + '7f', false],
    '[:blank:]': ['\\p{Zs}\\t', true],
    '[:cntrl:]': ['\\p{Cc}', true],
    '[:digit:]': ['\\p{Nd}', true],
    '[:graph:]': ['\\p{Z}\\p{C}', true, true],
    '[:lower:]': ['\\p{Ll}', true],
    '[:print:]': ['\\p{C}', true],
    '[:punct:]': ['\\p{P}', true],
    '[:space:]': ['\\p{Z}\\t\\r\\n\\v\\f', true],
    '[:upper:]': ['\\p{Lu}', true],
    '[:word:]': ['\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}', true],
    '[:xdigit:]': ['A-Fa-f0-9', false],
};
// only need to escape a few things inside of brace expressions
// escapes: [ \ ] -
const braceEscape = (s) => s.replace(/[[\]\\-]/g, '\\$&');
// escape all regexp magic characters
const regexpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
// everything has already been escaped, we just have to join
const rangesToString = (ranges) => ranges.join('');
// takes a glob string at a posix brace expression, and returns
// an equivalent regular expression source, and boolean indicating
// whether the /u flag needs to be applied, and the number of chars
// consumed to parse the character class.
// This also removes out of order ranges, and returns ($.) if the
// entire class just no good.
const parseClass = (glob, position) => {
    const pos = position;
    /* c8 ignore start */
    if (glob.charAt(pos) !== '[') {
        throw new Error('not in a brace expression');
    }
    /* c8 ignore stop */
    const ranges = [];
    const negs = [];
    let i = pos + 1;
    let sawStart = false;
    let uflag = false;
    let escaping = false;
    let negate = false;
    let endPos = pos;
    let rangeStart = '';
    WHILE: while (i < glob.length) {
        const c = glob.charAt(i);
        if ((c === '!' || c === '^') && i === pos + 1) {
            negate = true;
            i++;
            continue;
        }
        if (c === ']' && sawStart && !escaping) {
            endPos = i + 1;
            break;
        }
        sawStart = true;
        if (c === '\\') {
            if (!escaping) {
                escaping = true;
                i++;
                continue;
            }
            // escaped \ char, fall through and treat like normal char
        }
        if (c === '[' && !escaping) {
            // either a posix class, a collation equivalent, or just a [
            for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) {
                if (glob.startsWith(cls, i)) {
                    // invalid, [a-[] is fine, but not [a-[:alpha]]
                    if (rangeStart) {
                        return ['$.', false, glob.length - pos, true];
                    }
                    i += cls.length;
                    if (neg)
                        negs.push(unip);
                    else
                        ranges.push(unip);
                    uflag = uflag || u;
                    continue WHILE;
                }
            }
        }
        // now it's just a normal character, effectively
        escaping = false;
        if (rangeStart) {
            // throw this range away if it's not valid, but others
            // can still match.
            if (c > rangeStart) {
                ranges.push(braceEscape(rangeStart) + '-' + braceEscape(c));
            }
            else if (c === rangeStart) {
                ranges.push(braceEscape(c));
            }
            rangeStart = '';
            i++;
            continue;
        }
        // now might be the start of a range.
        // can be either c-d or c-] or c<more...>] or c] at this point
        if (glob.startsWith('-]', i + 1)) {
            ranges.push(braceEscape(c + '-'));
            i += 2;
            continue;
        }
        if (glob.startsWith('-', i + 1)) {
            rangeStart = c;
            i += 2;
            continue;
        }
        // not the start of a range, just a single character
        ranges.push(braceEscape(c));
        i++;
    }
    if (endPos < i) {
        // didn't see the end of the class, not a valid class,
        // but might still be valid as a literal match.
        return ['', false, 0, false];
    }
    // if we got no ranges and no negates, then we have a range that
    // cannot possibly match anything, and that poisons the whole glob
    if (!ranges.length && !negs.length) {
        return ['$.', false, glob.length - pos, true];
    }
    // if we got one positive range, and it's a single character, then that's
    // not actually a magic pattern, it's just that one literal character.
    // we should not treat that as "magic", we should just return the literal
    // character. [_] is a perfectly valid way to escape glob magic chars.
    if (negs.length === 0 &&
        ranges.length === 1 &&
        /^\\?.$/.test(ranges[0]) &&
        !negate) {
        const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
        return [regexpEscape(r), false, endPos - pos, false];
    }
    const sranges = '[' + (negate ? '^' : '') + rangesToString(ranges) + ']';
    const snegs = '[' + (negate ? '' : '^') + rangesToString(negs) + ']';
    const comb = ranges.length && negs.length
        ? '(' + sranges + '|' + snegs + ')'
        : ranges.length
            ? sranges
            : snegs;
    return [comb, uflag, endPos - pos, true];
};

/**
 * Un-escape a string that has been escaped with {@link escape}.
 *
 * If the {@link MinimatchOptions.windowsPathsNoEscape} option is used, then
 * square-bracket escapes are removed, but not backslash escapes.
 *
 * For example, it will turn the string `'[*]'` into `*`, but it will not
 * turn `'\\*'` into `'*'`, because `\` is a path separator in
 * `windowsPathsNoEscape` mode.
 *
 * When `windowsPathsNoEscape` is not set, then both square-bracket escapes and
 * backslash escapes are removed.
 *
 * Slashes (and backslashes in `windowsPathsNoEscape` mode) cannot be escaped
 * or unescaped.
 *
 * When `magicalBraces` is not set, escapes of braces (`{` and `}`) will not be
 * unescaped.
 */
const unescape = (s, { windowsPathsNoEscape = false, magicalBraces = true, } = {}) => {
    if (magicalBraces) {
        return windowsPathsNoEscape
            ? s.replace(/\[([^\/\\])\]/g, '$1')
            : s
                .replace(/((?!\\).|^)\[([^\/\\])\]/g, '$1$2')
                .replace(/\\([^\/])/g, '$1');
    }
    return windowsPathsNoEscape
        ? s.replace(/\[([^\/\\{}])\]/g, '$1')
        : s
            .replace(/((?!\\).|^)\[([^\/\\{}])\]/g, '$1$2')
            .replace(/\\([^\/{}])/g, '$1');
};

// parse a single path portion
const types = new Set(['!', '?', '+', '*', '@']);
const isExtglobType = (c) => types.has(c);
// Patterns that get prepended to bind to the start of either the
// entire string, or just a single path portion, to prevent dots
// and/or traversal patterns, when needed.
// Exts don't need the ^ or / bit, because the root binds that already.
const startNoTraversal = '(?!(?:^|/)\\.\\.?(?:$|/))';
const startNoDot = '(?!\\.)';
// characters that indicate a start of pattern needs the "no dots" bit,
// because a dot *might* be matched. ( is not in the list, because in
// the case of a child extglob, it will handle the prevention itself.
const addPatternStart = new Set(['[', '.']);
// cases where traversal is A-OK, no dot prevention needed
const justDots = new Set(['..', '.']);
const reSpecials = new Set('().*{}+?[]^$\\!');
const regExpEscape$1 = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
// any single thing other than /
const qmark$1 = '[^/]';
// * => any number of characters
const star$1 = qmark$1 + '*?';
// use + when we need to ensure that *something* matches, because the * is
// the only thing in the path portion.
const starNoEmpty = qmark$1 + '+?';
// remove the \ chars that we added if we end up doing a nonmagic compare
// const deslash = (s: string) => s.replace(/\\(.)/g, '$1')
class AST {
    type;
    #root;
    #hasMagic;
    #uflag = false;
    #parts = [];
    #parent;
    #parentIndex;
    #negs;
    #filledNegs = false;
    #options;
    #toString;
    // set to true if it's an extglob with no children
    // (which really means one child of '')
    #emptyExt = false;
    constructor(type, parent, options = {}) {
        this.type = type;
        // extglobs are inherently magical
        if (type)
            this.#hasMagic = true;
        this.#parent = parent;
        this.#root = this.#parent ? this.#parent.#root : this;
        this.#options = this.#root === this ? options : this.#root.#options;
        this.#negs = this.#root === this ? [] : this.#root.#negs;
        if (type === '!' && !this.#root.#filledNegs)
            this.#negs.push(this);
        this.#parentIndex = this.#parent ? this.#parent.#parts.length : 0;
    }
    get hasMagic() {
        /* c8 ignore start */
        if (this.#hasMagic !== undefined)
            return this.#hasMagic;
        /* c8 ignore stop */
        for (const p of this.#parts) {
            if (typeof p === 'string')
                continue;
            if (p.type || p.hasMagic)
                return (this.#hasMagic = true);
        }
        // note: will be undefined until we generate the regexp src and find out
        return this.#hasMagic;
    }
    // reconstructs the pattern
    toString() {
        if (this.#toString !== undefined)
            return this.#toString;
        if (!this.type) {
            return (this.#toString = this.#parts.map(p => String(p)).join(''));
        }
        else {
            return (this.#toString =
                this.type + '(' + this.#parts.map(p => String(p)).join('|') + ')');
        }
    }
    #fillNegs() {
        /* c8 ignore start */
        if (this !== this.#root)
            throw new Error('should only call on root');
        if (this.#filledNegs)
            return this;
        /* c8 ignore stop */
        // call toString() once to fill this out
        this.toString();
        this.#filledNegs = true;
        let n;
        while ((n = this.#negs.pop())) {
            if (n.type !== '!')
                continue;
            // walk up the tree, appending everthing that comes AFTER parentIndex
            let p = n;
            let pp = p.#parent;
            while (pp) {
                for (let i = p.#parentIndex + 1; !pp.type && i < pp.#parts.length; i++) {
                    for (const part of n.#parts) {
                        /* c8 ignore start */
                        if (typeof part === 'string') {
                            throw new Error('string part in extglob AST??');
                        }
                        /* c8 ignore stop */
                        part.copyIn(pp.#parts[i]);
                    }
                }
                p = pp;
                pp = p.#parent;
            }
        }
        return this;
    }
    push(...parts) {
        for (const p of parts) {
            if (p === '')
                continue;
            /* c8 ignore start */
            if (typeof p !== 'string' && !(p instanceof AST && p.#parent === this)) {
                throw new Error('invalid part: ' + p);
            }
            /* c8 ignore stop */
            this.#parts.push(p);
        }
    }
    toJSON() {
        const ret = this.type === null
            ? this.#parts.slice().map(p => (typeof p === 'string' ? p : p.toJSON()))
            : [this.type, ...this.#parts.map(p => p.toJSON())];
        if (this.isStart() && !this.type)
            ret.unshift([]);
        if (this.isEnd() &&
            (this === this.#root ||
                (this.#root.#filledNegs && this.#parent?.type === '!'))) {
            ret.push({});
        }
        return ret;
    }
    isStart() {
        if (this.#root === this)
            return true;
        // if (this.type) return !!this.#parent?.isStart()
        if (!this.#parent?.isStart())
            return false;
        if (this.#parentIndex === 0)
            return true;
        // if everything AHEAD of this is a negation, then it's still the "start"
        const p = this.#parent;
        for (let i = 0; i < this.#parentIndex; i++) {
            const pp = p.#parts[i];
            if (!(pp instanceof AST && pp.type === '!')) {
                return false;
            }
        }
        return true;
    }
    isEnd() {
        if (this.#root === this)
            return true;
        if (this.#parent?.type === '!')
            return true;
        if (!this.#parent?.isEnd())
            return false;
        if (!this.type)
            return this.#parent?.isEnd();
        // if not root, it'll always have a parent
        /* c8 ignore start */
        const pl = this.#parent ? this.#parent.#parts.length : 0;
        /* c8 ignore stop */
        return this.#parentIndex === pl - 1;
    }
    copyIn(part) {
        if (typeof part === 'string')
            this.push(part);
        else
            this.push(part.clone(this));
    }
    clone(parent) {
        const c = new AST(this.type, parent);
        for (const p of this.#parts) {
            c.copyIn(p);
        }
        return c;
    }
    static #parseAST(str, ast, pos, opt) {
        let escaping = false;
        let inBrace = false;
        let braceStart = -1;
        let braceNeg = false;
        if (ast.type === null) {
            // outside of a extglob, append until we find a start
            let i = pos;
            let acc = '';
            while (i < str.length) {
                const c = str.charAt(i++);
                // still accumulate escapes at this point, but we do ignore
                // starts that are escaped
                if (escaping || c === '\\') {
                    escaping = !escaping;
                    acc += c;
                    continue;
                }
                if (inBrace) {
                    if (i === braceStart + 1) {
                        if (c === '^' || c === '!') {
                            braceNeg = true;
                        }
                    }
                    else if (c === ']' && !(i === braceStart + 2 && braceNeg)) {
                        inBrace = false;
                    }
                    acc += c;
                    continue;
                }
                else if (c === '[') {
                    inBrace = true;
                    braceStart = i;
                    braceNeg = false;
                    acc += c;
                    continue;
                }
                if (!opt.noext && isExtglobType(c) && str.charAt(i) === '(') {
                    ast.push(acc);
                    acc = '';
                    const ext = new AST(c, ast);
                    i = AST.#parseAST(str, ext, i, opt);
                    ast.push(ext);
                    continue;
                }
                acc += c;
            }
            ast.push(acc);
            return i;
        }
        // some kind of extglob, pos is at the (
        // find the next | or )
        let i = pos + 1;
        let part = new AST(null, ast);
        const parts = [];
        let acc = '';
        while (i < str.length) {
            const c = str.charAt(i++);
            // still accumulate escapes at this point, but we do ignore
            // starts that are escaped
            if (escaping || c === '\\') {
                escaping = !escaping;
                acc += c;
                continue;
            }
            if (inBrace) {
                if (i === braceStart + 1) {
                    if (c === '^' || c === '!') {
                        braceNeg = true;
                    }
                }
                else if (c === ']' && !(i === braceStart + 2 && braceNeg)) {
                    inBrace = false;
                }
                acc += c;
                continue;
            }
            else if (c === '[') {
                inBrace = true;
                braceStart = i;
                braceNeg = false;
                acc += c;
                continue;
            }
            if (isExtglobType(c) && str.charAt(i) === '(') {
                part.push(acc);
                acc = '';
                const ext = new AST(c, part);
                part.push(ext);
                i = AST.#parseAST(str, ext, i, opt);
                continue;
            }
            if (c === '|') {
                part.push(acc);
                acc = '';
                parts.push(part);
                part = new AST(null, ast);
                continue;
            }
            if (c === ')') {
                if (acc === '' && ast.#parts.length === 0) {
                    ast.#emptyExt = true;
                }
                part.push(acc);
                acc = '';
                ast.push(...parts, part);
                return i;
            }
            acc += c;
        }
        // unfinished extglob
        // if we got here, it was a malformed extglob! not an extglob, but
        // maybe something else in there.
        ast.type = null;
        ast.#hasMagic = undefined;
        ast.#parts = [str.substring(pos - 1)];
        return i;
    }
    static fromGlob(pattern, options = {}) {
        const ast = new AST(null, undefined, options);
        AST.#parseAST(pattern, ast, 0, options);
        return ast;
    }
    // returns the regular expression if there's magic, or the unescaped
    // string if not.
    toMMPattern() {
        // should only be called on root
        /* c8 ignore start */
        if (this !== this.#root)
            return this.#root.toMMPattern();
        /* c8 ignore stop */
        const glob = this.toString();
        const [re, body, hasMagic, uflag] = this.toRegExpSource();
        // if we're in nocase mode, and not nocaseMagicOnly, then we do
        // still need a regular expression if we have to case-insensitively
        // match capital/lowercase characters.
        const anyMagic = hasMagic ||
            this.#hasMagic ||
            (this.#options.nocase &&
                !this.#options.nocaseMagicOnly &&
                glob.toUpperCase() !== glob.toLowerCase());
        if (!anyMagic) {
            return body;
        }
        const flags = (this.#options.nocase ? 'i' : '') + (uflag ? 'u' : '');
        return Object.assign(new RegExp(`^${re}$`, flags), {
            _src: re,
            _glob: glob,
        });
    }
    get options() {
        return this.#options;
    }
    // returns the string match, the regexp source, whether there's magic
    // in the regexp (so a regular expression is required) and whether or
    // not the uflag is needed for the regular expression (for posix classes)
    // TODO: instead of injecting the start/end at this point, just return
    // the BODY of the regexp, along with the start/end portions suitable
    // for binding the start/end in either a joined full-path makeRe context
    // (where we bind to (^|/), or a standalone matchPart context (where
    // we bind to ^, and not /).  Otherwise slashes get duped!
    //
    // In part-matching mode, the start is:
    // - if not isStart: nothing
    // - if traversal possible, but not allowed: ^(?!\.\.?$)
    // - if dots allowed or not possible: ^
    // - if dots possible and not allowed: ^(?!\.)
    // end is:
    // - if not isEnd(): nothing
    // - else: $
    //
    // In full-path matching mode, we put the slash at the START of the
    // pattern, so start is:
    // - if first pattern: same as part-matching mode
    // - if not isStart(): nothing
    // - if traversal possible, but not allowed: /(?!\.\.?(?:$|/))
    // - if dots allowed or not possible: /
    // - if dots possible and not allowed: /(?!\.)
    // end is:
    // - if last pattern, same as part-matching mode
    // - else nothing
    //
    // Always put the (?:$|/) on negated tails, though, because that has to be
    // there to bind the end of the negated pattern portion, and it's easier to
    // just stick it in now rather than try to inject it later in the middle of
    // the pattern.
    //
    // We can just always return the same end, and leave it up to the caller
    // to know whether it's going to be used joined or in parts.
    // And, if the start is adjusted slightly, can do the same there:
    // - if not isStart: nothing
    // - if traversal possible, but not allowed: (?:/|^)(?!\.\.?$)
    // - if dots allowed or not possible: (?:/|^)
    // - if dots possible and not allowed: (?:/|^)(?!\.)
    //
    // But it's better to have a simpler binding without a conditional, for
    // performance, so probably better to return both start options.
    //
    // Then the caller just ignores the end if it's not the first pattern,
    // and the start always gets applied.
    //
    // But that's always going to be $ if it's the ending pattern, or nothing,
    // so the caller can just attach $ at the end of the pattern when building.
    //
    // So the todo is:
    // - better detect what kind of start is needed
    // - return both flavors of starting pattern
    // - attach $ at the end of the pattern when creating the actual RegExp
    //
    // Ah, but wait, no, that all only applies to the root when the first pattern
    // is not an extglob. If the first pattern IS an extglob, then we need all
    // that dot prevention biz to live in the extglob portions, because eg
    // +(*|.x*) can match .xy but not .yx.
    //
    // So, return the two flavors if it's #root and the first child is not an
    // AST, otherwise leave it to the child AST to handle it, and there,
    // use the (?:^|/) style of start binding.
    //
    // Even simplified further:
    // - Since the start for a join is eg /(?!\.) and the start for a part
    // is ^(?!\.), we can just prepend (?!\.) to the pattern (either root
    // or start or whatever) and prepend ^ or / at the Regexp construction.
    toRegExpSource(allowDot) {
        const dot = allowDot ?? !!this.#options.dot;
        if (this.#root === this)
            this.#fillNegs();
        if (!this.type) {
            const noEmpty = this.isStart() &&
                this.isEnd() &&
                !this.#parts.some(s => typeof s !== 'string');
            const src = this.#parts
                .map(p => {
                const [re, _, hasMagic, uflag] = typeof p === 'string'
                    ? AST.#parseGlob(p, this.#hasMagic, noEmpty)
                    : p.toRegExpSource(allowDot);
                this.#hasMagic = this.#hasMagic || hasMagic;
                this.#uflag = this.#uflag || uflag;
                return re;
            })
                .join('');
            let start = '';
            if (this.isStart()) {
                if (typeof this.#parts[0] === 'string') {
                    // this is the string that will match the start of the pattern,
                    // so we need to protect against dots and such.
                    // '.' and '..' cannot match unless the pattern is that exactly,
                    // even if it starts with . or dot:true is set.
                    const dotTravAllowed = this.#parts.length === 1 && justDots.has(this.#parts[0]);
                    if (!dotTravAllowed) {
                        const aps = addPatternStart;
                        // check if we have a possibility of matching . or ..,
                        // and prevent that.
                        const needNoTrav = 
                        // dots are allowed, and the pattern starts with [ or .
                        (dot && aps.has(src.charAt(0))) ||
                            // the pattern starts with \., and then [ or .
                            (src.startsWith('\\.') && aps.has(src.charAt(2))) ||
                            // the pattern starts with \.\., and then [ or .
                            (src.startsWith('\\.\\.') && aps.has(src.charAt(4)));
                        // no need to prevent dots if it can't match a dot, or if a
                        // sub-pattern will be preventing it anyway.
                        const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
                        start = needNoTrav ? startNoTraversal : needNoDot ? startNoDot : '';
                    }
                }
            }
            // append the "end of path portion" pattern to negation tails
            let end = '';
            if (this.isEnd() &&
                this.#root.#filledNegs &&
                this.#parent?.type === '!') {
                end = '(?:$|\\/)';
            }
            const final = start + src + end;
            return [
                final,
                unescape(src),
                (this.#hasMagic = !!this.#hasMagic),
                this.#uflag,
            ];
        }
        // We need to calculate the body *twice* if it's a repeat pattern
        // at the start, once in nodot mode, then again in dot mode, so a
        // pattern like *(?) can match 'x.y'
        const repeated = this.type === '*' || this.type === '+';
        // some kind of extglob
        const start = this.type === '!' ? '(?:(?!(?:' : '(?:';
        let body = this.#partsToRegExp(dot);
        if (this.isStart() && this.isEnd() && !body && this.type !== '!') {
            // invalid extglob, has to at least be *something* present, if it's
            // the entire path portion.
            const s = this.toString();
            this.#parts = [s];
            this.type = null;
            this.#hasMagic = undefined;
            return [s, unescape(this.toString()), false, false];
        }
        // XXX abstract out this map method
        let bodyDotAllowed = !repeated || allowDot || dot || !startNoDot
            ? ''
            : this.#partsToRegExp(true);
        if (bodyDotAllowed === body) {
            bodyDotAllowed = '';
        }
        if (bodyDotAllowed) {
            body = `(?:${body})(?:${bodyDotAllowed})*?`;
        }
        // an empty !() is exactly equivalent to a starNoEmpty
        let final = '';
        if (this.type === '!' && this.#emptyExt) {
            final = (this.isStart() && !dot ? startNoDot : '') + starNoEmpty;
        }
        else {
            const close = this.type === '!'
                ? // !() must match something,but !(x) can match ''
                    '))' +
                        (this.isStart() && !dot && !allowDot ? startNoDot : '') +
                        star$1 +
                        ')'
                : this.type === '@'
                    ? ')'
                    : this.type === '?'
                        ? ')?'
                        : this.type === '+' && bodyDotAllowed
                            ? ')'
                            : this.type === '*' && bodyDotAllowed
                                ? `)?`
                                : `)${this.type}`;
            final = start + body + close;
        }
        return [
            final,
            unescape(body),
            (this.#hasMagic = !!this.#hasMagic),
            this.#uflag,
        ];
    }
    #partsToRegExp(dot) {
        return this.#parts
            .map(p => {
            // extglob ASTs should only contain parent ASTs
            /* c8 ignore start */
            if (typeof p === 'string') {
                throw new Error('string type in extglob ast??');
            }
            /* c8 ignore stop */
            // can ignore hasMagic, because extglobs are already always magic
            const [re, _, _hasMagic, uflag] = p.toRegExpSource(dot);
            this.#uflag = this.#uflag || uflag;
            return re;
        })
            .filter(p => !(this.isStart() && this.isEnd()) || !!p)
            .join('|');
    }
    static #parseGlob(glob, hasMagic, noEmpty = false) {
        let escaping = false;
        let re = '';
        let uflag = false;
        for (let i = 0; i < glob.length; i++) {
            const c = glob.charAt(i);
            if (escaping) {
                escaping = false;
                re += (reSpecials.has(c) ? '\\' : '') + c;
                continue;
            }
            if (c === '\\') {
                if (i === glob.length - 1) {
                    re += '\\\\';
                }
                else {
                    escaping = true;
                }
                continue;
            }
            if (c === '[') {
                const [src, needUflag, consumed, magic] = parseClass(glob, i);
                if (consumed) {
                    re += src;
                    uflag = uflag || needUflag;
                    i += consumed - 1;
                    hasMagic = hasMagic || magic;
                    continue;
                }
            }
            if (c === '*') {
                re += noEmpty && glob === '*' ? starNoEmpty : star$1;
                hasMagic = true;
                continue;
            }
            if (c === '?') {
                re += qmark$1;
                hasMagic = true;
                continue;
            }
            re += regExpEscape$1(c);
        }
        return [re, unescape(glob), !!hasMagic, uflag];
    }
}

/**
 * Escape all magic characters in a glob pattern.
 *
 * If the {@link MinimatchOptions.windowsPathsNoEscape}
 * option is used, then characters are escaped by wrapping in `[]`, because
 * a magic character wrapped in a character class can only be satisfied by
 * that exact character.  In this mode, `\` is _not_ escaped, because it is
 * not interpreted as a magic character, but instead as a path separator.
 *
 * If the {@link MinimatchOptions.magicalBraces} option is used,
 * then braces (`{` and `}`) will be escaped.
 */
const escape = (s, { windowsPathsNoEscape = false, magicalBraces = false, } = {}) => {
    // don't need to escape +@! because we escape the parens
    // that make those magic, and escaping ! as [!] isn't valid,
    // because [!]] is a valid glob class meaning not ']'.
    if (magicalBraces) {
        return windowsPathsNoEscape
            ? s.replace(/[?*()[\]{}]/g, '[$&]')
            : s.replace(/[?*()[\]\\{}]/g, '\\$&');
    }
    return windowsPathsNoEscape
        ? s.replace(/[?*()[\]]/g, '[$&]')
        : s.replace(/[?*()[\]\\]/g, '\\$&');
};

const minimatch = (p, pattern, options = {}) => {
    assertValidPattern(pattern);
    // shortcut: comments match nothing.
    if (!options.nocomment && pattern.charAt(0) === '#') {
        return false;
    }
    return new Minimatch(pattern, options).match(p);
};
// Optimized checking for the most common glob patterns.
const starDotExtRE = /^\*+([^+@!?\*\[\(]*)$/;
const starDotExtTest = (ext) => (f) => !f.startsWith('.') && f.endsWith(ext);
const starDotExtTestDot = (ext) => (f) => f.endsWith(ext);
const starDotExtTestNocase = (ext) => {
    ext = ext.toLowerCase();
    return (f) => !f.startsWith('.') && f.toLowerCase().endsWith(ext);
};
const starDotExtTestNocaseDot = (ext) => {
    ext = ext.toLowerCase();
    return (f) => f.toLowerCase().endsWith(ext);
};
const starDotStarRE = /^\*+\.\*+$/;
const starDotStarTest = (f) => !f.startsWith('.') && f.includes('.');
const starDotStarTestDot = (f) => f !== '.' && f !== '..' && f.includes('.');
const dotStarRE = /^\.\*+$/;
const dotStarTest = (f) => f !== '.' && f !== '..' && f.startsWith('.');
const starRE = /^\*+$/;
const starTest = (f) => f.length !== 0 && !f.startsWith('.');
const starTestDot = (f) => f.length !== 0 && f !== '.' && f !== '..';
const qmarksRE = /^\?+([^+@!?\*\[\(]*)?$/;
const qmarksTestNocase = ([$0, ext = '']) => {
    const noext = qmarksTestNoExt([$0]);
    if (!ext)
        return noext;
    ext = ext.toLowerCase();
    return (f) => noext(f) && f.toLowerCase().endsWith(ext);
};
const qmarksTestNocaseDot = ([$0, ext = '']) => {
    const noext = qmarksTestNoExtDot([$0]);
    if (!ext)
        return noext;
    ext = ext.toLowerCase();
    return (f) => noext(f) && f.toLowerCase().endsWith(ext);
};
const qmarksTestDot = ([$0, ext = '']) => {
    const noext = qmarksTestNoExtDot([$0]);
    return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
};
const qmarksTest = ([$0, ext = '']) => {
    const noext = qmarksTestNoExt([$0]);
    return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
};
const qmarksTestNoExt = ([$0]) => {
    const len = $0.length;
    return (f) => f.length === len && !f.startsWith('.');
};
const qmarksTestNoExtDot = ([$0]) => {
    const len = $0.length;
    return (f) => f.length === len && f !== '.' && f !== '..';
};
/* c8 ignore start */
const defaultPlatform = (typeof process === 'object' && process
    ? (typeof process.env === 'object' &&
        process.env &&
        process.env.__MINIMATCH_TESTING_PLATFORM__) ||
        process.platform
    : 'posix');
const path = {
    win32: { sep: '\\' },
    posix: { sep: '/' },
};
/* c8 ignore stop */
const sep = defaultPlatform === 'win32' ? path.win32.sep : path.posix.sep;
minimatch.sep = sep;
const GLOBSTAR = Symbol('globstar **');
minimatch.GLOBSTAR = GLOBSTAR;
// any single thing other than /
// don't need to escape / when using new RegExp()
const qmark = '[^/]';
// * => any number of characters
const star = qmark + '*?';
// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
const twoStarDot = '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
// not a ^ or / followed by a dot,
// followed by anything, any number of times.
const twoStarNoDot = '(?:(?!(?:\\/|^)\\.).)*?';
const filter = (pattern, options = {}) => (p) => minimatch(p, pattern, options);
minimatch.filter = filter;
const ext = (a, b = {}) => Object.assign({}, a, b);
const defaults = (def) => {
    if (!def || typeof def !== 'object' || !Object.keys(def).length) {
        return minimatch;
    }
    const orig = minimatch;
    const m = (p, pattern, options = {}) => orig(p, pattern, ext(def, options));
    return Object.assign(m, {
        Minimatch: class Minimatch extends orig.Minimatch {
            constructor(pattern, options = {}) {
                super(pattern, ext(def, options));
            }
            static defaults(options) {
                return orig.defaults(ext(def, options)).Minimatch;
            }
        },
        AST: class AST extends orig.AST {
            /* c8 ignore start */
            constructor(type, parent, options = {}) {
                super(type, parent, ext(def, options));
            }
            /* c8 ignore stop */
            static fromGlob(pattern, options = {}) {
                return orig.AST.fromGlob(pattern, ext(def, options));
            }
        },
        unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
        escape: (s, options = {}) => orig.escape(s, ext(def, options)),
        filter: (pattern, options = {}) => orig.filter(pattern, ext(def, options)),
        defaults: (options) => orig.defaults(ext(def, options)),
        makeRe: (pattern, options = {}) => orig.makeRe(pattern, ext(def, options)),
        braceExpand: (pattern, options = {}) => orig.braceExpand(pattern, ext(def, options)),
        match: (list, pattern, options = {}) => orig.match(list, pattern, ext(def, options)),
        sep: orig.sep,
        GLOBSTAR: GLOBSTAR,
    });
};
minimatch.defaults = defaults;
// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
const braceExpand = (pattern, options = {}) => {
    assertValidPattern(pattern);
    // Thanks to Yeting Li <https://github.com/yetingli> for
    // improving this regexp to avoid a ReDOS vulnerability.
    if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
        // shortcut. no need to expand.
        return [pattern];
    }
    return expand(pattern);
};
minimatch.braceExpand = braceExpand;
// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
const makeRe = (pattern, options = {}) => new Minimatch(pattern, options).makeRe();
minimatch.makeRe = makeRe;
const match = (list, pattern, options = {}) => {
    const mm = new Minimatch(pattern, options);
    list = list.filter(f => mm.match(f));
    if (mm.options.nonull && !list.length) {
        list.push(pattern);
    }
    return list;
};
minimatch.match = match;
// replace stuff like \* with *
const globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
const regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
class Minimatch {
    options;
    set;
    pattern;
    windowsPathsNoEscape;
    nonegate;
    negate;
    comment;
    empty;
    preserveMultipleSlashes;
    partial;
    globSet;
    globParts;
    nocase;
    isWindows;
    platform;
    windowsNoMagicRoot;
    regexp;
    constructor(pattern, options = {}) {
        assertValidPattern(pattern);
        options = options || {};
        this.options = options;
        this.pattern = pattern;
        this.platform = options.platform || defaultPlatform;
        this.isWindows = this.platform === 'win32';
        this.windowsPathsNoEscape =
            !!options.windowsPathsNoEscape || options.allowWindowsEscape === false;
        if (this.windowsPathsNoEscape) {
            this.pattern = this.pattern.replace(/\\/g, '/');
        }
        this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
        this.regexp = null;
        this.negate = false;
        this.nonegate = !!options.nonegate;
        this.comment = false;
        this.empty = false;
        this.partial = !!options.partial;
        this.nocase = !!this.options.nocase;
        this.windowsNoMagicRoot =
            options.windowsNoMagicRoot !== undefined
                ? options.windowsNoMagicRoot
                : !!(this.isWindows && this.nocase);
        this.globSet = [];
        this.globParts = [];
        this.set = [];
        // make the set of regexps etc.
        this.make();
    }
    hasMagic() {
        if (this.options.magicalBraces && this.set.length > 1) {
            return true;
        }
        for (const pattern of this.set) {
            for (const part of pattern) {
                if (typeof part !== 'string')
                    return true;
            }
        }
        return false;
    }
    debug(..._) { }
    make() {
        const pattern = this.pattern;
        const options = this.options;
        // empty patterns and comments match nothing.
        if (!options.nocomment && pattern.charAt(0) === '#') {
            this.comment = true;
            return;
        }
        if (!pattern) {
            this.empty = true;
            return;
        }
        // step 1: figure out negation, etc.
        this.parseNegate();
        // step 2: expand braces
        this.globSet = [...new Set(this.braceExpand())];
        if (options.debug) {
            this.debug = (...args) => console.error(...args);
        }
        this.debug(this.pattern, this.globSet);
        // step 3: now we have a set, so turn each one into a series of
        // path-portion matching patterns.
        // These will be regexps, except in the case of "**", which is
        // set to the GLOBSTAR object for globstar behavior,
        // and will not contain any / characters
        //
        // First, we preprocess to make the glob pattern sets a bit simpler
        // and deduped.  There are some perf-killing patterns that can cause
        // problems with a glob walk, but we can simplify them down a bit.
        const rawGlobParts = this.globSet.map(s => this.slashSplit(s));
        this.globParts = this.preprocess(rawGlobParts);
        this.debug(this.pattern, this.globParts);
        // glob --> regexps
        let set = this.globParts.map((s, _, __) => {
            if (this.isWindows && this.windowsNoMagicRoot) {
                // check if it's a drive or unc path.
                const isUNC = s[0] === '' &&
                    s[1] === '' &&
                    (s[2] === '?' || !globMagic.test(s[2])) &&
                    !globMagic.test(s[3]);
                const isDrive = /^[a-z]:/i.test(s[0]);
                if (isUNC) {
                    return [...s.slice(0, 4), ...s.slice(4).map(ss => this.parse(ss))];
                }
                else if (isDrive) {
                    return [s[0], ...s.slice(1).map(ss => this.parse(ss))];
                }
            }
            return s.map(ss => this.parse(ss));
        });
        this.debug(this.pattern, set);
        // filter out everything that didn't compile properly.
        this.set = set.filter(s => s.indexOf(false) === -1);
        // do not treat the ? in UNC paths as magic
        if (this.isWindows) {
            for (let i = 0; i < this.set.length; i++) {
                const p = this.set[i];
                if (p[0] === '' &&
                    p[1] === '' &&
                    this.globParts[i][2] === '?' &&
                    typeof p[3] === 'string' &&
                    /^[a-z]:$/i.test(p[3])) {
                    p[2] = '?';
                }
            }
        }
        this.debug(this.pattern, this.set);
    }
    // various transforms to equivalent pattern sets that are
    // faster to process in a filesystem walk.  The goal is to
    // eliminate what we can, and push all ** patterns as far
    // to the right as possible, even if it increases the number
    // of patterns that we have to process.
    preprocess(globParts) {
        // if we're not in globstar mode, then turn all ** into *
        if (this.options.noglobstar) {
            for (let i = 0; i < globParts.length; i++) {
                for (let j = 0; j < globParts[i].length; j++) {
                    if (globParts[i][j] === '**') {
                        globParts[i][j] = '*';
                    }
                }
            }
        }
        const { optimizationLevel = 1 } = this.options;
        if (optimizationLevel >= 2) {
            // aggressive optimization for the purpose of fs walking
            globParts = this.firstPhasePreProcess(globParts);
            globParts = this.secondPhasePreProcess(globParts);
        }
        else if (optimizationLevel >= 1) {
            // just basic optimizations to remove some .. parts
            globParts = this.levelOneOptimize(globParts);
        }
        else {
            // just collapse multiple ** portions into one
            globParts = this.adjascentGlobstarOptimize(globParts);
        }
        return globParts;
    }
    // just get rid of adjascent ** portions
    adjascentGlobstarOptimize(globParts) {
        return globParts.map(parts => {
            let gs = -1;
            while (-1 !== (gs = parts.indexOf('**', gs + 1))) {
                let i = gs;
                while (parts[i + 1] === '**') {
                    i++;
                }
                if (i !== gs) {
                    parts.splice(gs, i - gs);
                }
            }
            return parts;
        });
    }
    // get rid of adjascent ** and resolve .. portions
    levelOneOptimize(globParts) {
        return globParts.map(parts => {
            parts = parts.reduce((set, part) => {
                const prev = set[set.length - 1];
                if (part === '**' && prev === '**') {
                    return set;
                }
                if (part === '..') {
                    if (prev && prev !== '..' && prev !== '.' && prev !== '**') {
                        set.pop();
                        return set;
                    }
                }
                set.push(part);
                return set;
            }, []);
            return parts.length === 0 ? [''] : parts;
        });
    }
    levelTwoFileOptimize(parts) {
        if (!Array.isArray(parts)) {
            parts = this.slashSplit(parts);
        }
        let didSomething = false;
        do {
            didSomething = false;
            // <pre>/<e>/<rest> -> <pre>/<rest>
            if (!this.preserveMultipleSlashes) {
                for (let i = 1; i < parts.length - 1; i++) {
                    const p = parts[i];
                    // don't squeeze out UNC patterns
                    if (i === 1 && p === '' && parts[0] === '')
                        continue;
                    if (p === '.' || p === '') {
                        didSomething = true;
                        parts.splice(i, 1);
                        i--;
                    }
                }
                if (parts[0] === '.' &&
                    parts.length === 2 &&
                    (parts[1] === '.' || parts[1] === '')) {
                    didSomething = true;
                    parts.pop();
                }
            }
            // <pre>/<p>/../<rest> -> <pre>/<rest>
            let dd = 0;
            while (-1 !== (dd = parts.indexOf('..', dd + 1))) {
                const p = parts[dd - 1];
                if (p && p !== '.' && p !== '..' && p !== '**') {
                    didSomething = true;
                    parts.splice(dd - 1, 2);
                    dd -= 2;
                }
            }
        } while (didSomething);
        return parts.length === 0 ? [''] : parts;
    }
    // First phase: single-pattern processing
    // <pre> is 1 or more portions
    // <rest> is 1 or more portions
    // <p> is any portion other than ., .., '', or **
    // <e> is . or ''
    //
    // **/.. is *brutal* for filesystem walking performance, because
    // it effectively resets the recursive walk each time it occurs,
    // and ** cannot be reduced out by a .. pattern part like a regexp
    // or most strings (other than .., ., and '') can be.
    //
    // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
    // <pre>/<e>/<rest> -> <pre>/<rest>
    // <pre>/<p>/../<rest> -> <pre>/<rest>
    // **/**/<rest> -> **/<rest>
    //
    // **/*/<rest> -> */**/<rest> <== not valid because ** doesn't follow
    // this WOULD be allowed if ** did follow symlinks, or * didn't
    firstPhasePreProcess(globParts) {
        let didSomething = false;
        do {
            didSomething = false;
            // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
            for (let parts of globParts) {
                let gs = -1;
                while (-1 !== (gs = parts.indexOf('**', gs + 1))) {
                    let gss = gs;
                    while (parts[gss + 1] === '**') {
                        // <pre>/**/**/<rest> -> <pre>/**/<rest>
                        gss++;
                    }
                    // eg, if gs is 2 and gss is 4, that means we have 3 **
                    // parts, and can remove 2 of them.
                    if (gss > gs) {
                        parts.splice(gs + 1, gss - gs);
                    }
                    let next = parts[gs + 1];
                    const p = parts[gs + 2];
                    const p2 = parts[gs + 3];
                    if (next !== '..')
                        continue;
                    if (!p ||
                        p === '.' ||
                        p === '..' ||
                        !p2 ||
                        p2 === '.' ||
                        p2 === '..') {
                        continue;
                    }
                    didSomething = true;
                    // edit parts in place, and push the new one
                    parts.splice(gs, 1);
                    const other = parts.slice(0);
                    other[gs] = '**';
                    globParts.push(other);
                    gs--;
                }
                // <pre>/<e>/<rest> -> <pre>/<rest>
                if (!this.preserveMultipleSlashes) {
                    for (let i = 1; i < parts.length - 1; i++) {
                        const p = parts[i];
                        // don't squeeze out UNC patterns
                        if (i === 1 && p === '' && parts[0] === '')
                            continue;
                        if (p === '.' || p === '') {
                            didSomething = true;
                            parts.splice(i, 1);
                            i--;
                        }
                    }
                    if (parts[0] === '.' &&
                        parts.length === 2 &&
                        (parts[1] === '.' || parts[1] === '')) {
                        didSomething = true;
                        parts.pop();
                    }
                }
                // <pre>/<p>/../<rest> -> <pre>/<rest>
                let dd = 0;
                while (-1 !== (dd = parts.indexOf('..', dd + 1))) {
                    const p = parts[dd - 1];
                    if (p && p !== '.' && p !== '..' && p !== '**') {
                        didSomething = true;
                        const needDot = dd === 1 && parts[dd + 1] === '**';
                        const splin = needDot ? ['.'] : [];
                        parts.splice(dd - 1, 2, ...splin);
                        if (parts.length === 0)
                            parts.push('');
                        dd -= 2;
                    }
                }
            }
        } while (didSomething);
        return globParts;
    }
    // second phase: multi-pattern dedupes
    // {<pre>/*/<rest>,<pre>/<p>/<rest>} -> <pre>/*/<rest>
    // {<pre>/<rest>,<pre>/<rest>} -> <pre>/<rest>
    // {<pre>/**/<rest>,<pre>/<rest>} -> <pre>/**/<rest>
    //
    // {<pre>/**/<rest>,<pre>/**/<p>/<rest>} -> <pre>/**/<rest>
    // ^-- not valid because ** doens't follow symlinks
    secondPhasePreProcess(globParts) {
        for (let i = 0; i < globParts.length - 1; i++) {
            for (let j = i + 1; j < globParts.length; j++) {
                const matched = this.partsMatch(globParts[i], globParts[j], !this.preserveMultipleSlashes);
                if (matched) {
                    globParts[i] = [];
                    globParts[j] = matched;
                    break;
                }
            }
        }
        return globParts.filter(gs => gs.length);
    }
    partsMatch(a, b, emptyGSMatch = false) {
        let ai = 0;
        let bi = 0;
        let result = [];
        let which = '';
        while (ai < a.length && bi < b.length) {
            if (a[ai] === b[bi]) {
                result.push(which === 'b' ? b[bi] : a[ai]);
                ai++;
                bi++;
            }
            else if (emptyGSMatch && a[ai] === '**' && b[bi] === a[ai + 1]) {
                result.push(a[ai]);
                ai++;
            }
            else if (emptyGSMatch && b[bi] === '**' && a[ai] === b[bi + 1]) {
                result.push(b[bi]);
                bi++;
            }
            else if (a[ai] === '*' &&
                b[bi] &&
                (this.options.dot || !b[bi].startsWith('.')) &&
                b[bi] !== '**') {
                if (which === 'b')
                    return false;
                which = 'a';
                result.push(a[ai]);
                ai++;
                bi++;
            }
            else if (b[bi] === '*' &&
                a[ai] &&
                (this.options.dot || !a[ai].startsWith('.')) &&
                a[ai] !== '**') {
                if (which === 'a')
                    return false;
                which = 'b';
                result.push(b[bi]);
                ai++;
                bi++;
            }
            else {
                return false;
            }
        }
        // if we fall out of the loop, it means they two are identical
        // as long as their lengths match
        return a.length === b.length && result;
    }
    parseNegate() {
        if (this.nonegate)
            return;
        const pattern = this.pattern;
        let negate = false;
        let negateOffset = 0;
        for (let i = 0; i < pattern.length && pattern.charAt(i) === '!'; i++) {
            negate = !negate;
            negateOffset++;
        }
        if (negateOffset)
            this.pattern = pattern.slice(negateOffset);
        this.negate = negate;
    }
    // set partial to true to test if, for example,
    // "/a/b" matches the start of "/*/b/*/d"
    // Partial means, if you run out of file before you run
    // out of pattern, then that's fine, as long as all
    // the parts match.
    matchOne(file, pattern, partial = false) {
        const options = this.options;
        // UNC paths like //?/X:/... can match X:/... and vice versa
        // Drive letters in absolute drive or unc paths are always compared
        // case-insensitively.
        if (this.isWindows) {
            const fileDrive = typeof file[0] === 'string' && /^[a-z]:$/i.test(file[0]);
            const fileUNC = !fileDrive &&
                file[0] === '' &&
                file[1] === '' &&
                file[2] === '?' &&
                /^[a-z]:$/i.test(file[3]);
            const patternDrive = typeof pattern[0] === 'string' && /^[a-z]:$/i.test(pattern[0]);
            const patternUNC = !patternDrive &&
                pattern[0] === '' &&
                pattern[1] === '' &&
                pattern[2] === '?' &&
                typeof pattern[3] === 'string' &&
                /^[a-z]:$/i.test(pattern[3]);
            const fdi = fileUNC ? 3 : fileDrive ? 0 : undefined;
            const pdi = patternUNC ? 3 : patternDrive ? 0 : undefined;
            if (typeof fdi === 'number' && typeof pdi === 'number') {
                const [fd, pd] = [file[fdi], pattern[pdi]];
                if (fd.toLowerCase() === pd.toLowerCase()) {
                    pattern[pdi] = fd;
                    if (pdi > fdi) {
                        pattern = pattern.slice(pdi);
                    }
                    else if (fdi > pdi) {
                        file = file.slice(fdi);
                    }
                }
            }
        }
        // resolve and reduce . and .. portions in the file as well.
        // don't need to do the second phase, because it's only one string[]
        const { optimizationLevel = 1 } = this.options;
        if (optimizationLevel >= 2) {
            file = this.levelTwoFileOptimize(file);
        }
        this.debug('matchOne', this, { file, pattern });
        this.debug('matchOne', file.length, pattern.length);
        for (var fi = 0, pi = 0, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
            this.debug('matchOne loop');
            var p = pattern[pi];
            var f = file[fi];
            this.debug(pattern, p, f);
            // should be impossible.
            // some invalid regexp stuff in the set.
            /* c8 ignore start */
            if (p === false) {
                return false;
            }
            /* c8 ignore stop */
            if (p === GLOBSTAR) {
                this.debug('GLOBSTAR', [pattern, p, f]);
                // "**"
                // a/**/b/**/c would match the following:
                // a/b/x/y/z/c
                // a/x/y/z/b/c
                // a/b/x/b/x/c
                // a/b/c
                // To do this, take the rest of the pattern after
                // the **, and see if it would match the file remainder.
                // If so, return success.
                // If not, the ** "swallows" a segment, and try again.
                // This is recursively awful.
                //
                // a/**/b/**/c matching a/b/x/y/z/c
                // - a matches a
                // - doublestar
                //   - matchOne(b/x/y/z/c, b/**/c)
                //     - b matches b
                //     - doublestar
                //       - matchOne(x/y/z/c, c) -> no
                //       - matchOne(y/z/c, c) -> no
                //       - matchOne(z/c, c) -> no
                //       - matchOne(c, c) yes, hit
                var fr = fi;
                var pr = pi + 1;
                if (pr === pl) {
                    this.debug('** at the end');
                    // a ** at the end will just swallow the rest.
                    // We have found a match.
                    // however, it will not swallow /.x, unless
                    // options.dot is set.
                    // . and .. are *never* matched by **, for explosively
                    // exponential reasons.
                    for (; fi < fl; fi++) {
                        if (file[fi] === '.' ||
                            file[fi] === '..' ||
                            (!options.dot && file[fi].charAt(0) === '.'))
                            return false;
                    }
                    return true;
                }
                // ok, let's see if we can swallow whatever we can.
                while (fr < fl) {
                    var swallowee = file[fr];
                    this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);
                    // XXX remove this slice.  Just pass the start index.
                    if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
                        this.debug('globstar found match!', fr, fl, swallowee);
                        // found a match.
                        return true;
                    }
                    else {
                        // can't swallow "." or ".." ever.
                        // can only swallow ".foo" when explicitly asked.
                        if (swallowee === '.' ||
                            swallowee === '..' ||
                            (!options.dot && swallowee.charAt(0) === '.')) {
                            this.debug('dot detected!', file, fr, pattern, pr);
                            break;
                        }
                        // ** swallows a segment, and continue.
                        this.debug('globstar swallow a segment, and continue');
                        fr++;
                    }
                }
                // no match was found.
                // However, in partial mode, we can't say this is necessarily over.
                /* c8 ignore start */
                if (partial) {
                    // ran out of file
                    this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
                    if (fr === fl) {
                        return true;
                    }
                }
                /* c8 ignore stop */
                return false;
            }
            // something other than **
            // non-magic patterns just have to match exactly
            // patterns with magic have been turned into regexps.
            let hit;
            if (typeof p === 'string') {
                hit = f === p;
                this.debug('string match', p, f, hit);
            }
            else {
                hit = p.test(f);
                this.debug('pattern match', p, f, hit);
            }
            if (!hit)
                return false;
        }
        // Note: ending in / means that we'll get a final ""
        // at the end of the pattern.  This can only match a
        // corresponding "" at the end of the file.
        // If the file ends in /, then it can only match a
        // a pattern that ends in /, unless the pattern just
        // doesn't have any more for it. But, a/b/ should *not*
        // match "a/b/*", even though "" matches against the
        // [^/]*? pattern, except in partial mode, where it might
        // simply not be reached yet.
        // However, a/b/ should still satisfy a/*
        // now either we fell off the end of the pattern, or we're done.
        if (fi === fl && pi === pl) {
            // ran out of pattern and filename at the same time.
            // an exact hit!
            return true;
        }
        else if (fi === fl) {
            // ran out of file, but still had pattern left.
            // this is ok if we're doing the match as part of
            // a glob fs traversal.
            return partial;
        }
        else if (pi === pl) {
            // ran out of pattern, still have file left.
            // this is only acceptable if we're on the very last
            // empty segment of a file with a trailing slash.
            // a/* should match a/b/
            return fi === fl - 1 && file[fi] === '';
            /* c8 ignore start */
        }
        else {
            // should be unreachable.
            throw new Error('wtf?');
        }
        /* c8 ignore stop */
    }
    braceExpand() {
        return braceExpand(this.pattern, this.options);
    }
    parse(pattern) {
        assertValidPattern(pattern);
        const options = this.options;
        // shortcuts
        if (pattern === '**')
            return GLOBSTAR;
        if (pattern === '')
            return '';
        // far and away, the most common glob pattern parts are
        // *, *.*, and *.<ext>  Add a fast check method for those.
        let m;
        let fastTest = null;
        if ((m = pattern.match(starRE))) {
            fastTest = options.dot ? starTestDot : starTest;
        }
        else if ((m = pattern.match(starDotExtRE))) {
            fastTest = (options.nocase
                ? options.dot
                    ? starDotExtTestNocaseDot
                    : starDotExtTestNocase
                : options.dot
                    ? starDotExtTestDot
                    : starDotExtTest)(m[1]);
        }
        else if ((m = pattern.match(qmarksRE))) {
            fastTest = (options.nocase
                ? options.dot
                    ? qmarksTestNocaseDot
                    : qmarksTestNocase
                : options.dot
                    ? qmarksTestDot
                    : qmarksTest)(m);
        }
        else if ((m = pattern.match(starDotStarRE))) {
            fastTest = options.dot ? starDotStarTestDot : starDotStarTest;
        }
        else if ((m = pattern.match(dotStarRE))) {
            fastTest = dotStarTest;
        }
        const re = AST.fromGlob(pattern, this.options).toMMPattern();
        if (fastTest && typeof re === 'object') {
            // Avoids overriding in frozen environments
            Reflect.defineProperty(re, 'test', { value: fastTest });
        }
        return re;
    }
    makeRe() {
        if (this.regexp || this.regexp === false)
            return this.regexp;
        // at this point, this.set is a 2d array of partial
        // pattern strings, or "**".
        //
        // It's better to use .match().  This function shouldn't
        // be used, really, but it's pretty convenient sometimes,
        // when you just want to work with a regex.
        const set = this.set;
        if (!set.length) {
            this.regexp = false;
            return this.regexp;
        }
        const options = this.options;
        const twoStar = options.noglobstar
            ? star
            : options.dot
                ? twoStarDot
                : twoStarNoDot;
        const flags = new Set(options.nocase ? ['i'] : []);
        // regexpify non-globstar patterns
        // if ** is only item, then we just do one twoStar
        // if ** is first, and there are more, prepend (\/|twoStar\/)? to next
        // if ** is last, append (\/twoStar|) to previous
        // if ** is in the middle, append (\/|\/twoStar\/) to previous
        // then filter out GLOBSTAR symbols
        let re = set
            .map(pattern => {
            const pp = pattern.map(p => {
                if (p instanceof RegExp) {
                    for (const f of p.flags.split(''))
                        flags.add(f);
                }
                return typeof p === 'string'
                    ? regExpEscape(p)
                    : p === GLOBSTAR
                        ? GLOBSTAR
                        : p._src;
            });
            pp.forEach((p, i) => {
                const next = pp[i + 1];
                const prev = pp[i - 1];
                if (p !== GLOBSTAR || prev === GLOBSTAR) {
                    return;
                }
                if (prev === undefined) {
                    if (next !== undefined && next !== GLOBSTAR) {
                        pp[i + 1] = '(?:\\/|' + twoStar + '\\/)?' + next;
                    }
                    else {
                        pp[i] = twoStar;
                    }
                }
                else if (next === undefined) {
                    pp[i - 1] = prev + '(?:\\/|\\/' + twoStar + ')?';
                }
                else if (next !== GLOBSTAR) {
                    pp[i - 1] = prev + '(?:\\/|\\/' + twoStar + '\\/)' + next;
                    pp[i + 1] = GLOBSTAR;
                }
            });
            const filtered = pp.filter(p => p !== GLOBSTAR);
            // For partial matches, we need to make the pattern match
            // any prefix of the full path. We do this by generating
            // alternative patterns that match progressively longer prefixes.
            if (this.partial && filtered.length >= 1) {
                const prefixes = [];
                for (let i = 1; i <= filtered.length; i++) {
                    prefixes.push(filtered.slice(0, i).join('/'));
                }
                return '(?:' + prefixes.join('|') + ')';
            }
            return filtered.join('/');
        })
            .join('|');
        // need to wrap in parens if we had more than one thing with |,
        // otherwise only the first will be anchored to ^ and the last to $
        const [open, close] = set.length > 1 ? ['(?:', ')'] : ['', ''];
        // must match entire pattern
        // ending in a * or ** will make it less strict.
        re = '^' + open + re + close + '$';
        // In partial mode, '/' should always match as it's a valid prefix for any pattern
        if (this.partial) {
            re = '^(?:\\/|' + open + re.slice(1, -1) + close + ')$';
        }
        // can match anything, as long as it's not this.
        if (this.negate)
            re = '^(?!' + re + ').+$';
        try {
            this.regexp = new RegExp(re, [...flags].join(''));
            /* c8 ignore start */
        }
        catch (ex) {
            // should be impossible
            this.regexp = false;
        }
        /* c8 ignore stop */
        return this.regexp;
    }
    slashSplit(p) {
        // if p starts with // on windows, we preserve that
        // so that UNC paths aren't broken.  Otherwise, any number of
        // / characters are coalesced into one, unless
        // preserveMultipleSlashes is set to true.
        if (this.preserveMultipleSlashes) {
            return p.split('/');
        }
        else if (this.isWindows && /^\/\/[^\/]+/.test(p)) {
            // add an extra '' for the one we lose
            return ['', ...p.split(/\/+/)];
        }
        else {
            return p.split(/\/+/);
        }
    }
    match(f, partial = this.partial) {
        this.debug('match', f, this.pattern);
        // short-circuit in the case of busted things.
        // comments, etc.
        if (this.comment) {
            return false;
        }
        if (this.empty) {
            return f === '';
        }
        if (f === '/' && partial) {
            return true;
        }
        const options = this.options;
        // windows: need to use /, not \
        if (this.isWindows) {
            f = f.split('\\').join('/');
        }
        // treat the test path as a set of pathparts.
        const ff = this.slashSplit(f);
        this.debug(this.pattern, 'split', ff);
        // just ONE of the pattern sets in this.set needs to match
        // in order for it to be valid.  If negating, then just one
        // match means that we have failed.
        // Either way, return on the first hit.
        const set = this.set;
        this.debug(this.pattern, 'set', set);
        // Find the basename of the path by looking for the last non-empty segment
        let filename = ff[ff.length - 1];
        if (!filename) {
            for (let i = ff.length - 2; !filename && i >= 0; i--) {
                filename = ff[i];
            }
        }
        for (let i = 0; i < set.length; i++) {
            const pattern = set[i];
            let file = ff;
            if (options.matchBase && pattern.length === 1) {
                file = [filename];
            }
            const hit = this.matchOne(file, pattern, partial);
            if (hit) {
                if (options.flipNegate) {
                    return true;
                }
                return !this.negate;
            }
        }
        // didn't get any hits.  this is success if it's a negative
        // pattern, failure otherwise.
        if (options.flipNegate) {
            return false;
        }
        return this.negate;
    }
    static defaults(def) {
        return minimatch.defaults(def).Minimatch;
    }
}
/* c8 ignore stop */
minimatch.AST = AST;
minimatch.Minimatch = Minimatch;
minimatch.escape = escape;
minimatch.unescape = unescape;

function reportError(file, node, message, code = 9000, startPos = 0, endPos = 0) {
    if (!startPos && node.pos > -1) {
        startPos = node.getStart();
    }
    if (!endPos && node.end > -1) {
        endPos = node.getEnd();
    }
    const format = ts.formatDiagnostic({
        file: file,
        start: startPos,
        length: endPos - startPos,
        category: ts.DiagnosticCategory.Error,
        code,
        messageText: message
    }, {
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getCanonicalFileName: function (fileName) {
            return fileName;
        },
        getNewLine: function () {
            return ts.sys.newLine;
        }
    });
    if (statement.options.reportError) {
        const start = file.getLineAndCharacterOfPosition(startPos);
        const end = file.getLineAndCharacterOfPosition(endPos);
        statement.options.reportError({
            file: file.fileName,
            loc: {
                start: {
                    line: start.line + 1,
                    column: start.character + 1
                },
                end: {
                    line: end.line + 1,
                    column: end.character + 1
                }
            },
            code,
            message: format
        });
    }
    else {
        console.error('\x1b[31m%s\x1b[0m', format);
    }
}

const packageJsonCache = new Map();
function formatIdentifier(identifier, index) {
    return `cheap__${identifier}__${index}`;
}
function isIdentifier(name, identifier) {
    return name === identifier || name.indexOf(`cheap__${identifier}__`) === 0;
}
var StageStatus;
(function (StageStatus) {
    StageStatus[StageStatus["NONE"] = 0] = "NONE";
    StageStatus[StageStatus["CALL"] = 1] = "CALL";
    StageStatus[StageStatus["EqualLeft"] = 2] = "EqualLeft";
    StageStatus[StageStatus["EqualRight"] = 3] = "EqualRight";
    StageStatus[StageStatus["SingleArrowRight"] = 4] = "SingleArrowRight";
    StageStatus[StageStatus["PointerPlusMinusIgnore"] = 5] = "PointerPlusMinusIgnore";
    StageStatus[StageStatus["AddressOf"] = 6] = "AddressOf";
    StageStatus[StageStatus["Parameter"] = 7] = "Parameter";
    StageStatus[StageStatus["VariableDeclaration"] = 8] = "VariableDeclaration";
})(StageStatus || (StageStatus = {}));
var BlockType;
(function (BlockType) {
    BlockType[BlockType["UNKNOWN"] = 0] = "UNKNOWN";
    BlockType[BlockType["FUNCTION"] = 1] = "FUNCTION";
    BlockType[BlockType["IF"] = 2] = "IF";
    BlockType[BlockType["LOOP"] = 3] = "LOOP";
})(BlockType || (BlockType = {}));
class Stage {
}
class BlockStack {
    constructor(type = BlockType.UNKNOWN) {
        this.type = BlockType.UNKNOWN;
        this.topDeclaration = [];
        this.definedStruct = [];
        this.stages = [];
        this.locals = new Map();
        this.funcs = new Map();
        this.synchronize = false;
        this.type = type;
    }
    pushStage(stage, data) {
        const s = new Stage();
        s.stage = stage;
        s.data = data;
        this.stages.push(s);
    }
    popStage() {
        this.stages.pop();
    }
    lookupStage(stage) {
        for (let i = this.stages.length - 1; i >= 0; i--) {
            if (this.stages[i].stage === stage) {
                return this.stages[i];
            }
        }
    }
    getCurrentStage() {
        return this.stages[this.stages.length - 1];
    }
    hasStruct(name) {
        return array.has(this.definedStruct, name);
    }
    getDeclaration(name) {
        return this.topDeclaration.find((item) => {
            return item.name === name;
        });
    }
}
class Statement {
    start(file) {
        this.currentFile = file;
        this.identifierIndex = 0;
        this.memoryImports = [];
        this.symbolImports = [];
        this.stdImports = [];
        this.identifierImports = [];
        this.requires = [];
        this.isCheapSource = false;
        this.stacks = [];
        this.pushStack();
        this.imports = parseImports(file, this.program, this.typeChecker, this.getCurrentStack().locals);
        this.currentFilePath = path$1.relative(this.options.projectPath, file.fileName);
        if (this.options.cheapSourcePath) {
            const relative = path$1.relative(this.options.cheapSourcePath, file.fileName);
            this.isCheapSource = !!relative && !relative.startsWith('..') && !path$1.isAbsolute(relative);
        }
        if (this.moduleType === ts.ModuleKind.Node16
            || this.moduleType === ts.ModuleKind.Node18
            || this.moduleType === ts.ModuleKind.Node20
            || this.moduleType === ts.ModuleKind.NodeNext) {
            const jsonInfo = this.findNearestPackageJson(this.currentFile.fileName);
            if (jsonInfo === null || jsonInfo === void 0 ? void 0 : jsonInfo.content.type) {
                this.packageModule = jsonInfo.content.type;
            }
        }
    }
    isOutputCJS() {
        return this.moduleType === ts.ModuleKind.CommonJS
            || this.moduleType === ts.ModuleKind.UMD
            || this.moduleType === ts.ModuleKind.AMD
            || this.options.module === 'commonjs'
            || (this.moduleType === ts.ModuleKind.Node16
                || this.moduleType === ts.ModuleKind.Node18
                || this.moduleType === ts.ModuleKind.Node20
                || this.moduleType === ts.ModuleKind.NodeNext)
                && this.packageModule === 'commonjs';
    }
    end(newFile) {
        const stack = this.getCurrentStack();
        const updatedStatements = [];
        array.each(stack.topDeclaration, (item) => {
            updatedStatements.push(this.context.factory.createVariableStatement(undefined, this.context.factory.createVariableDeclarationList([
                this.context.factory.createVariableDeclaration(item.formatName, undefined, undefined, item.initializer)
            ], ts.NodeFlags.Const)));
        });
        addImportStatements(this.memoryImports, RootPath, updatedStatements);
        addImportStatements(this.symbolImports, InternalPath, updatedStatements);
        const cheapReg = new RegExp(`^\\S*/node_modules/${PACKET_NAME}/dist/((esm|cjs)/)?`);
        if (this.identifierImports.length) {
            this.identifierImports.forEach((item) => {
                let p = item.path.replace(/(\.d)?\.[t|j]s$/, '');
                p = p.replace(cheapReg, PACKET_NAME + '/');
                if (this.options.importPath) {
                    p = this.options.importPath(p);
                }
                const importDeclaration = this.context.factory.createImportDeclaration(undefined, this.context.factory.createImportClause(false, item.default
                    ? this.context.factory.createIdentifier(item.formatName)
                    : undefined, item.default
                    ? undefined
                    : this.context.factory.createNamedImports([
                        this.context.factory.createImportSpecifier(false, this.context.factory.createIdentifier(item.name), this.context.factory.createIdentifier(item.formatName))
                    ])), this.context.factory.createStringLiteral(p));
                updatedStatements.push(importDeclaration);
            });
        }
        if (this.requires.length) {
            this.requires.forEach((item) => {
                let p = item.path.replace(/(\.d)?\.[t|j]s$/, '');
                p = p.replace(cheapReg, PACKET_NAME + '/');
                if (this.options.importPath) {
                    p = this.options.importPath(p);
                }
                const requireValue = this.context.factory.createCallExpression(this.context.factory.createIdentifier('require'), undefined, [
                    this.context.factory.createStringLiteral(p)
                ]);
                const requireDeclaration = this.context.factory.createVariableStatement(undefined, this.context.factory.createVariableDeclarationList([
                    this.context.factory.createVariableDeclaration(this.context.factory.createIdentifier(item.formatName), undefined, undefined, this.esModuleInterop && !item.esModule
                        ? this.context.factory.createCallExpression(this.context.factory.createIdentifier(item.default ? importDefault : importStar), undefined, [
                            requireValue
                        ])
                        : requireValue)
                ], ts.NodeFlags.Const));
                updatedStatements.push(requireDeclaration);
            });
        }
        if (updatedStatements.length) {
            newFile = this.context.factory.updateSourceFile(newFile, [...updatedStatements, ...newFile.statements]);
        }
        this.popStack();
        this.program = null;
        this.typeChecker = null;
        this.context = null;
        this.currentFile = null;
        this.visitor = null;
        this.memoryImports = [];
        this.symbolImports = [];
        this.stdImports = [];
        this.identifierImports = [];
        this.requires = [];
        this.stacks = [];
        return newFile;
    }
    pushStack(type) {
        this.stacks.push(new BlockStack(type));
    }
    popStack() {
        this.stacks.pop();
    }
    getCurrentStack() {
        return this.stacks[this.stacks.length - 1];
    }
    pushStage(status, data = {}) {
        var _a;
        (_a = this.getCurrentStack()) === null || _a === void 0 ? void 0 : _a.pushStage(status, data);
    }
    popStage() {
        var _a;
        (_a = this.getCurrentStack()) === null || _a === void 0 ? void 0 : _a.popStage();
    }
    getCurrentStage() {
        var _a;
        return (_a = this.getCurrentStack()) === null || _a === void 0 ? void 0 : _a.getCurrentStage();
    }
    lookupStage(stage) {
        for (let i = this.stacks.length - 1; i >= 0; i--) {
            const stack = this.stacks[i];
            const s = stack.lookupStage(stage);
            if (s) {
                return s;
            }
        }
    }
    hasStruct(name) {
        for (let i = this.stacks.length - 1; i >= 0; i--) {
            const stack = this.stacks[i];
            const s = stack.hasStruct(name);
            if (s) {
                return s;
            }
        }
        return false;
    }
    addStruct(name) {
        this.getCurrentStack().definedStruct.push(name);
    }
    getDeclaration(name) {
        var _a;
        return (_a = this.getCurrentStack()) === null || _a === void 0 ? void 0 : _a.getDeclaration(name);
    }
    addDeclaration(name, initializer) {
        const stack = this.getCurrentStack();
        for (let i = 0; i < stack.topDeclaration.length; i++) {
            if (stack.topDeclaration[i].name === name) {
                return stack.topDeclaration[i];
            }
        }
        const item = {
            name,
            formatName: formatIdentifier(name, this.identifierIndex++),
            initializer
        };
        stack.topDeclaration.push(item);
        return item;
    }
    addModuleDeclaration(name, initializer) {
        const stack = this.stacks[0];
        for (let i = 0; i < stack.topDeclaration.length; i++) {
            if (stack.topDeclaration[i].name === name) {
                return stack.topDeclaration[i];
            }
        }
        const item = {
            name,
            formatName: formatIdentifier(name, this.identifierIndex++),
            initializer
        };
        stack.topDeclaration.push(item);
        return item;
    }
    relativePath(file) {
        if (file.indexOf(PACKET_NAME) === 0) {
            file = file.replace(PACKET_NAME + '/', '');
        }
        return relativePath(this.currentFile.fileName, path$1.resolve(this.options.cheapSourcePath, file));
    }
    modulePath2RelativePath(name, modulePath, defaultExport) {
        if (modulePath === InternalPath) {
            if (name === ctypeEnumRead) {
                modulePath = this.relativePath(ctypeEnumReadPath);
                defaultExport = false;
            }
            else if (name === ctypeEnumWrite) {
                modulePath = this.relativePath(ctypeEnumWritePath);
                defaultExport = false;
            }
            else if (name === Allocator) {
                modulePath = this.relativePath(AllocatorPath);
                defaultExport = false;
            }
            else if (name === makeSharedPtr) {
                modulePath = this.relativePath(makeSharedPtrPath);
                defaultExport = false;
            }
            else if (name === definedMetaProperty) {
                modulePath = this.relativePath(definedMetaPropertyPath);
                defaultExport = true;
            }
        }
        else if (modulePath === RootPath) {
            if (name === make) {
                modulePath = this.relativePath(makePath);
                defaultExport = true;
            }
            else if (name === unmake) {
                modulePath = this.relativePath(unmakePath);
                defaultExport = true;
            }
            else if (name === sizeof) {
                modulePath = this.relativePath(sizeofPath);
                defaultExport = true;
            }
            else if (name === structAccess) {
                modulePath = this.relativePath(structAccessPath);
                defaultExport = true;
            }
        }
        return {
            modulePath,
            defaultExport
        };
    }
    addMemoryImport(name) {
        if (name === ctypeEnumRead) {
            return this.addIdentifierImport(name, InternalPath, false);
        }
        else if (name === ctypeEnumWrite) {
            return this.addIdentifierImport(name, InternalPath, false);
        }
        if (this.isOutputCJS()) {
            let { formatName } = pushRequire(this.requires, formatIdentifier('identifier', this.identifierIndex++), this.isCheapSource
                ? this.relativePath(memoryPath)
                : RootPath, false, true);
            return this.context.factory.createPropertyAccessExpression(this.context.factory.createIdentifier(formatName), this.context.factory.createIdentifier(name));
        }
        else {
            let { formatName } = pushImport(this.memoryImports, name, this.isCheapSource
                ? this.relativePath(memoryPath)
                : RootPath, this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++), false);
            return this.context.factory.createIdentifier(formatName);
        }
    }
    addSymbolImport(name) {
        if (this.isOutputCJS()) {
            let { formatName } = pushRequire(this.requires, formatIdentifier('identifier', this.identifierIndex++), this.isCheapSource
                ? this.relativePath(symbolPath)
                : InternalPath, false, true);
            return this.context.factory.createPropertyAccessExpression(this.context.factory.createIdentifier(formatName), this.context.factory.createIdentifier(name));
        }
        else {
            let { formatName } = pushImport(this.symbolImports, name, this.isCheapSource
                ? this.relativePath(symbolPath)
                : InternalPath, this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++), false);
            return this.context.factory.createIdentifier(formatName);
        }
    }
    addIdentifierImport(name, modulePath, defaultExport, esModule = true) {
        if (this.isCheapSource) {
            const result = this.modulePath2RelativePath(name, modulePath, defaultExport);
            modulePath = result.modulePath;
            defaultExport = result.defaultExport;
        }
        if (this.isOutputCJS()) {
            let item = pushRequire(this.requires, formatIdentifier('identifier', this.identifierIndex++), modulePath, defaultExport, true);
            if (defaultExport) {
                item.defaultName = name;
            }
            if (defaultExport && !esModule) {
                return this.context.factory.createIdentifier(item.formatName);
            }
            else {
                return this.context.factory.createPropertyAccessExpression(this.context.factory.createIdentifier(item.formatName), this.context.factory.createIdentifier(defaultExport ? 'default' : name));
            }
        }
        else {
            let { formatName } = pushImport(this.identifierImports, name, modulePath, this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++), defaultExport);
            return this.context.factory.createIdentifier(formatName);
        }
    }
    resolveSourceSymbol(symbol) {
        let current = symbol;
        while (current.flags & ts.SymbolFlags.Alias) {
            current = this.typeChecker.getAliasedSymbol(current);
        }
        return current;
    }
    getAliasedNameFromModule(module, symbol, name) {
        const fileName = getFilePath(this.program, this.currentFile.fileName, module);
        if (fileName) {
            const sf = this.program.getSourceFile(fileName);
            if (sf) {
                const ss = this.typeChecker.getSymbolAtLocation(sf);
                if (ss === null || ss === void 0 ? void 0 : ss.exports) {
                    if (ss.exports.has(name)) {
                        if (this.resolveSourceSymbol(ss.exports.get(name)) === symbol) {
                            return name;
                        }
                    }
                    if (ss.exports.has('default')) {
                        if (this.resolveSourceSymbol(ss.exports.get('default')) === symbol) {
                            return 'default';
                        }
                    }
                    for (let en of ss.exports) {
                        if (this.resolveSourceSymbol(en[1]) === symbol) {
                            return en[0];
                        }
                    }
                }
            }
        }
    }
    addStructImport(symbol, target) {
        if (!this.isOutputCJS()) {
            let local = this.lookupLocalSymbol(symbol);
            if (local) {
                return this.context.factory.createIdentifier(local);
            }
        }
        let pathString = relativePath(this.currentFile.fileName, target.fileName);
        let name = symbol.escapedName;
        object.each(this.cheapCompilerOptions.structPaths, (value, key) => {
            if (minimatch(target.fileName, key) && !minimatch(this.currentFile.fileName, key)) {
                let importName = this.getAliasedNameFromModule(value, symbol, name);
                if (importName) {
                    pathString = value;
                    name = importName;
                }
                else {
                    reportError(statement.currentFile, this.currentFile, `not found struct ${name} from module ${value}`);
                }
                return false;
            }
        });
        if (/[\\/]node_modules[\\/]/.test(target.fileName)) {
            const match = target.fileName.match(/[\\/]node_modules[\\/](?:@[^\\/]+[\\/][^\\/]+|[^\\/]+)/);
            if (match) {
                let packageName = match[0].replace(/.*node_modules[\\/]/, '');
                let importName = this.getAliasedNameFromModule(packageName, symbol, name);
                if (importName) {
                    pathString = packageName;
                    name = importName;
                }
            }
        }
        return this.addIdentifierImport(name, pathString, name === 'default');
    }
    isIdentifier(name, identifier, path, importPath) {
        var _a, _b;
        if (this.isCheapSource) {
            const result = this.modulePath2RelativePath(identifier, importPath, false);
            importPath = result.modulePath;
        }
        if (ts.isIdentifier(name)) {
            if (name.escapedText === identifier) {
                const symbol = this.typeChecker.getSymbolAtLocation(name);
                if (symbol) {
                    const targetSource = (_a = symbol.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getSourceFile();
                    if (targetSource) {
                        if (targetSource.fileName.indexOf(path) >= 0
                            || targetSource.fileName.indexOf(PACKET_NAME) >= 0
                                && targetSource.fileName.indexOf(path.replace(PACKET_NAME, '')) >= 0) {
                            return true;
                        }
                    }
                }
            }
            return isIdentifier(name.escapedText, identifier) && this.identifierImports.some((item) => {
                return item.formatName === name.escapedText
                    && item.name === identifier
                    && item.path === importPath;
            })
                || isIdentifier(name.escapedText, 'identifier') && this.requires.some((item) => {
                    return item.defaultName === identifier
                        && item.path === importPath;
                });
        }
        else {
            if (name.name.escapedText === identifier) {
                const symbol = this.typeChecker.getSymbolAtLocation(name);
                if (symbol) {
                    const targetSource = (_b = symbol.valueDeclaration) === null || _b === void 0 ? void 0 : _b.getSourceFile();
                    if (targetSource) {
                        if (targetSource.fileName.indexOf(path) >= 0
                            || targetSource.fileName.indexOf(PACKET_NAME) >= 0
                                && targetSource.fileName.indexOf(path.replace(PACKET_NAME, '')) >= 0) {
                            return true;
                        }
                    }
                }
                else if (ts.isIdentifier(name.expression)
                    && isIdentifier(name.expression.escapedText, 'identifier')) {
                    return this.requires.some((item) => {
                        return item.formatName === name.expression.escapedText
                            && item.path === importPath;
                    });
                }
            }
            else if (name.name.escapedText === 'default'
                && ts.isIdentifier(name.expression)
                && isIdentifier(name.expression.escapedText, 'identifier')) {
                return this.requires.some((item) => {
                    return item.defaultName === identifier
                        && item.path === importPath;
                });
            }
        }
        return false;
    }
    addLocal(name, symbol) {
        var _a;
        (_a = this.getCurrentStack()) === null || _a === void 0 ? void 0 : _a.locals.set(name, symbol);
    }
    addFunc(name, node) {
        var _a;
        (_a = this.getCurrentStack()) === null || _a === void 0 ? void 0 : _a.funcs.set(name, node);
    }
    lookupLocal(name) {
        for (let i = this.stacks.length - 1; i >= 0; i--) {
            const stack = this.stacks[i];
            const s = stack.locals.get(name);
            if (s) {
                return s;
            }
        }
    }
    lookupLocalSymbol(symbol) {
        for (let i = this.stacks.length - 1; i >= 0; i--) {
            const stack = this.stacks[i];
            for (let entry of stack.locals) {
                if (this.resolveSourceSymbol(entry[1]) === symbol) {
                    return entry[0];
                }
            }
        }
    }
    lookupFunc(name) {
        for (let i = this.stacks.length - 1; i >= 0; i--) {
            const stack = this.stacks[i];
            const s = stack.funcs.get(name);
            if (s) {
                return s;
            }
        }
    }
    lookupSynchronized() {
        for (let i = this.stacks.length - 1; i >= 0; i--) {
            const stack = this.stacks[i];
            if (stack.type === BlockType.FUNCTION) {
                return stack.synchronize;
            }
        }
        return false;
    }
    findNearestPackageJson(filePath) {
        const absPath = path$1.resolve(filePath);
        // 检查缓存
        if (packageJsonCache.has(absPath)) {
            return packageJsonCache.get(absPath);
        }
        let dir = path$1.dirname(absPath);
        while (true) {
            const pkgPath = path$1.join(dir, 'package.json');
            if (packageJsonCache.get(pkgPath)) {
                return packageJsonCache.get(pkgPath);
            }
            if (!packageJsonCache.has(pkgPath) && fs__default.existsSync(pkgPath)) {
                try {
                    const content = JSON.parse(fs__default.readFileSync(pkgPath, 'utf8'));
                    const result = { path: pkgPath, content };
                    packageJsonCache.set(pkgPath, result);
                    return result;
                }
                catch (e) {
                    // 忽略解析错误，继续往上查找
                    packageJsonCache.set(pkgPath, null);
                }
            }
            const parent = path$1.dirname(dir);
            if (parent === dir) {
                break;
            }
            dir = parent;
        }
        // 找不到
        packageJsonCache.set(absPath, null);
        return null;
    }
}
const statement = new Statement();

const BuiltinType = [
    'i32',
    'i64',
    'f32',
    'f64',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'int8',
    'int16',
    'int32',
    'int64',
    'float',
    'float64',
    'double',
    'char',
    'size',
    'void',
    'bool',
    'size',
    'atomic_char',
    'atomic_uint8',
    'atomic_uint16',
    'atomic_uint32',
    'atomic_int8',
    'atomic_int16',
    'atomic_int32',
    'atomic_int64',
    'atomic_uint64',
    'atomic_bool'
];
const BuiltinDecorator = [
    cstruct,
    cunion,
    cignore,
    ctype,
    cpointer,
    carray,
    cbitField,
    cinline,
    cdeasync
];
const AtomicCall = [
    'add',
    'sub',
    'and',
    'or',
    'xor',
    'store',
    'load',
    'compareExchange',
    'exchange'
];
const BuiltinFloat = [
    'float',
    'float64',
    'double',
    'f32',
    'f64'
];
const BuiltinBigInt = [
    'i64',
    'int64',
    'uint64',
    'atomic_int64',
    'atomic_uint64'
];
const BuiltinUint = [
    'uint8',
    'atomic_uint8',
    'uint16',
    'atomic_uint16',
    'uint32',
    'atomic_uint32',
    'uint64',
    'atomic_uint64',
    'size'
];
const BuiltinBool = [
    'bool',
    'atomic_bool'
];
const CTypeEnum2Type = {
    [2 /* CTypeEnum.uint8 */]: 'uint8',
    [3 /* CTypeEnum.atomic_uint8 */]: 'atomic_uint8',
    [4 /* CTypeEnum.char */]: 'char',
    [5 /* CTypeEnum.atomic_char */]: 'atomic_char',
    [6 /* CTypeEnum.uint16 */]: 'uint16',
    [7 /* CTypeEnum.atomic_uint16 */]: 'atomic_uint16',
    [8 /* CTypeEnum.uint32 */]: 'uint32',
    [9 /* CTypeEnum.atomic_uint32 */]: 'atomic_uint32',
    [10 /* CTypeEnum.uint64 */]: 'uint64',
    [11 /* CTypeEnum.int8 */]: 'int8',
    [12 /* CTypeEnum.atomic_int8 */]: 'atomic_int8',
    [13 /* CTypeEnum.int16 */]: 'int16',
    [14 /* CTypeEnum.atomic_int16 */]: 'atomic_int16',
    [15 /* CTypeEnum.int32 */]: 'int32',
    [16 /* CTypeEnum.atomic_int32 */]: 'atomic_int32',
    [17 /* CTypeEnum.int64 */]: 'int64',
    [18 /* CTypeEnum.float */]: 'float',
    [19 /* CTypeEnum.double */]: 'double',
    [20 /* CTypeEnum.pointer */]: 'pointer',
    [1 /* CTypeEnum.void */]: 'void',
    [0 /* CTypeEnum.null */]: 'nullptr',
    [22 /* CTypeEnum.atomic_uint64 */]: 'atomic_uint64',
    [21 /* CTypeEnum.atomic_int64 */]: 'atomic_int64',
    [23 /* CTypeEnum.bool */]: 'bool',
    [24 /* CTypeEnum.atomic_bool */]: 'atomic_bool',
    [25 /* CTypeEnum.size */]: 'size'
};
const Type2CTypeEnum = {
    typeptr: 20 /* CTypeEnum.pointer */,
    i32: 15 /* CTypeEnum.int32 */,
    i64: 17 /* CTypeEnum.int64 */,
    f32: 18 /* CTypeEnum.float */,
    f64: 19 /* CTypeEnum.double */
};
object.each(CTypeEnum2Type, (value, key) => {
    Type2CTypeEnum[value] = +key;
});
const BuiltinNumber = array.exclude(array.exclude(array.exclude(BuiltinType, BuiltinFloat), BuiltinBigInt), BuiltinBool);

const CTypeEnum2Bytes = {
    [2 /* CTypeEnum.uint8 */]: 1,
    [3 /* CTypeEnum.atomic_uint8 */]: 1,
    [4 /* CTypeEnum.char */]: 1,
    [5 /* CTypeEnum.atomic_char */]: 1,
    [6 /* CTypeEnum.uint16 */]: 2,
    [7 /* CTypeEnum.atomic_uint16 */]: 2,
    [8 /* CTypeEnum.uint32 */]: 4,
    [9 /* CTypeEnum.atomic_uint32 */]: 4,
    [10 /* CTypeEnum.uint64 */]: 8,
    [11 /* CTypeEnum.int8 */]: 1,
    [12 /* CTypeEnum.atomic_int8 */]: 1,
    [13 /* CTypeEnum.int16 */]: 2,
    [14 /* CTypeEnum.atomic_int16 */]: 2,
    [15 /* CTypeEnum.int32 */]: 4,
    [16 /* CTypeEnum.atomic_int32 */]: 4,
    [17 /* CTypeEnum.int64 */]: 8,
    [18 /* CTypeEnum.float */]: 4,
    [19 /* CTypeEnum.double */]: 8,
    [20 /* CTypeEnum.pointer */]: 4,
    [0 /* CTypeEnum.null */]: 4,
    [1 /* CTypeEnum.void */]: 4,
    [22 /* CTypeEnum.atomic_uint64 */]: 8,
    [21 /* CTypeEnum.atomic_int64 */]: 8,
    [23 /* CTypeEnum.bool */]: 1,
    [24 /* CTypeEnum.atomic_bool */]: 1,
    [25 /* CTypeEnum.size */]: 4
};

const symbolStructLength = Symbol('StructLength');
const symbolStructMaxBaseTypeByteLength = Symbol('StructMaxBaseTypeByteLength');

/**
 * 获取结构体最大基本类型的长度
 *
 * @param target
 * @returns
 */
function getMaxBaseTypeByteLength(keysMeta) {
    let max = 0;
    keysMeta.forEach((value) => {
        if (value[1 /* KeyMetaKey.Pointer */]) {
            if (CTypeEnum2Bytes[20 /* CTypeEnum.pointer */] > max) {
                max = CTypeEnum2Bytes[20 /* CTypeEnum.pointer */];
            }
        }
        else {
            if (is.func(value.getTypeMeta)) {
                const typeMeta = value.getTypeMeta();
                if (typeMeta.maxBaseTypeByteLength > max) {
                    max = typeMeta.maxBaseTypeByteLength;
                }
            }
            else if (is.func(value[0 /* KeyMetaKey.Type */])) {
                if (value[0 /* KeyMetaKey.Type */][symbolStructMaxBaseTypeByteLength] > max) {
                    max = value[0 /* KeyMetaKey.Type */][symbolStructMaxBaseTypeByteLength];
                }
            }
            else if (CTypeEnum2Bytes[value[0 /* KeyMetaKey.Type */]] > max) {
                max = CTypeEnum2Bytes[value[0 /* KeyMetaKey.Type */]];
            }
        }
    });
    return max;
}
/**
 * 获取结构体最大成员的长度
 *
 * @param target
 * @returns
 */
function getMaxTypeByteLength(keysMeta) {
    let max = 0;
    keysMeta.forEach((value) => {
        if (value[1 /* KeyMetaKey.Pointer */]) {
            if (CTypeEnum2Bytes[20 /* CTypeEnum.pointer */] > max) {
                max = CTypeEnum2Bytes[20 /* CTypeEnum.pointer */];
            }
        }
        else {
            if (is.func(value.getTypeMeta)) {
                const typeMeta = value.getTypeMeta();
                if (typeMeta.length > max) {
                    max = typeMeta.length;
                }
            }
            else if (is.func(value[0 /* KeyMetaKey.Type */])) {
                if (value[0 /* KeyMetaKey.Type */][symbolStructLength] > max) {
                    max = value[0 /* KeyMetaKey.Type */][symbolStructLength];
                }
            }
            else if (CTypeEnum2Bytes[value[0 /* KeyMetaKey.Type */]] > max) {
                max = CTypeEnum2Bytes[value[0 /* KeyMetaKey.Type */]];
            }
        }
    });
    return max;
}
/**
 * 对结构体进行内存布局
 *
 * 1. 结构体变量的首地址能够被其最宽基本类型成员的大小 (sizeof)  所整除 （这个由 malloc 保证）
 * 2. 结构体每个成员相对结构体首地址的偏移量 offset 都是成员大小的整数倍，如有需要编译器会在成员之间加上填充字节
 * 3. 结构体的总大小 sizeof 为结构体最宽基本成员大小的整数倍，如有需要编译器会在最末一个成员之后加上填充字节。
 *
 * 位域：
 *
 * 4.  如果相邻位域字段的类型相同，且位宽之和小于类型的 sizeof 大小，则后一个字段将紧邻前一个字段存储，直到不能容纳为止。
 * 5.  如果相邻位域字段的类型相同，但位宽之和大于类型的 sizeof 大小，则后一个字段将从新的存储单元开始，其偏移量为其类型大小的整数倍。
 * 6.  如果相邻的位域字段的类型不同，则各编译器的具体实现有差异。（此处采取不压缩）
 * 7.  如果位域字段之间穿插着非位域字段，则不进行压缩。
 *
 * @param target
 * @returns
 */
function layout(keysQueue, keysMeta, padding, offset = 0) {
    let lastBitFieldType = 0 /* CTypeEnum.null */;
    let bitFieldRemaining = 0;
    let lastOffset = offset;
    if (keysQueue && keysMeta) {
        array.each(keysQueue, (key) => {
            const meta = keysMeta.get(key);
            let padding = 0;
            let length = 0;
            if (meta[1 /* KeyMetaKey.Pointer */]) {
                padding = CTypeEnum2Bytes[20 /* CTypeEnum.pointer */];
                length = CTypeEnum2Bytes[20 /* CTypeEnum.pointer */];
            }
            else {
                if (is.func(meta.getTypeMeta)) {
                    const typeMeta = meta.getTypeMeta();
                    padding = typeMeta.maxBaseTypeByteLength;
                    length = typeMeta.length;
                }
                else if (is.func(meta[0 /* KeyMetaKey.Type */])) {
                    padding = meta[0 /* KeyMetaKey.Type */].prototype[symbolStructMaxBaseTypeByteLength];
                    length = meta[0 /* KeyMetaKey.Type */].prototype[symbolStructLength];
                }
                else {
                    // 与上一个字段类型相同且有足够 bit 数（条件 4，6）
                    if (meta[5 /* KeyMetaKey.BitField */]
                        && meta[0 /* KeyMetaKey.Type */] === lastBitFieldType
                        && bitFieldRemaining >= meta[6 /* KeyMetaKey.BitFieldLength */]) {
                        meta[7 /* KeyMetaKey.BaseAddressOffset */] = lastOffset;
                        meta[8 /* KeyMetaKey.BaseBitOffset */] = CTypeEnum2Bytes[lastBitFieldType] * 8 - bitFieldRemaining;
                        bitFieldRemaining -= meta[6 /* KeyMetaKey.BitFieldLength */];
                        if (meta[6 /* KeyMetaKey.BitFieldLength */] === 0) {
                            meta[6 /* KeyMetaKey.BitFieldLength */] = bitFieldRemaining;
                            lastBitFieldType = 0 /* CTypeEnum.null */;
                            bitFieldRemaining = 0;
                        }
                        if (isLittleEndian()) {
                            meta[8 /* KeyMetaKey.BaseBitOffset */] = CTypeEnum2Bytes[lastBitFieldType] * 8
                                - meta[8 /* KeyMetaKey.BaseBitOffset */] - meta[6 /* KeyMetaKey.BitFieldLength */];
                        }
                        return true;
                    }
                    else {
                        // 不满足，重新开启空间（条件 5）
                        padding = CTypeEnum2Bytes[meta[0 /* KeyMetaKey.Type */]];
                        length = CTypeEnum2Bytes[meta[0 /* KeyMetaKey.Type */]];
                    }
                }
            }
            // 对当前字段类型对齐（条件 2）
            while (offset % padding !== 0) {
                offset++;
            }
            meta[7 /* KeyMetaKey.BaseAddressOffset */] = offset;
            if (meta[5 /* KeyMetaKey.BitField */]) {
                lastBitFieldType = meta[0 /* KeyMetaKey.Type */];
                meta[8 /* KeyMetaKey.BaseBitOffset */] = 0;
                bitFieldRemaining = CTypeEnum2Bytes[lastBitFieldType] * 8 - meta[6 /* KeyMetaKey.BitFieldLength */];
                if (isLittleEndian()) {
                    meta[8 /* KeyMetaKey.BaseBitOffset */] = CTypeEnum2Bytes[lastBitFieldType] * 8 - meta[6 /* KeyMetaKey.BitFieldLength */];
                }
            }
            else {
                // 不是位域重置（条件 7）
                lastBitFieldType = 0 /* CTypeEnum.null */;
                bitFieldRemaining = 0;
            }
            lastOffset = offset;
            offset += meta[3 /* KeyMetaKey.Array */] ? (length * meta[4 /* KeyMetaKey.ArrayLength */]) : length;
        });
    }
    // 对结构体大小对齐（条件 3）
    while (offset % padding !== 0) {
        offset++;
    }
    return offset;
}

var StructType;
(function (StructType) {
    StructType[StructType["CSTRUCT"] = 0] = "CSTRUCT";
    StructType[StructType["CUNION"] = 1] = "CUNION";
    StructType[StructType["INLINE_OBJECT"] = 2] = "INLINE_OBJECT";
})(StructType || (StructType = {}));
class WeakRefPolyfill {
    constructor(value) {
        this._value = value;
    }
    deref() {
        return this._value;
    }
}
function createWeakRef(value) {
    return typeof WeakRef === 'undefined' ? new WeakRefPolyfill(value) : new WeakRef(value);
}
const StructMap = new WeakMap();
const StructFileIdentifiers = new Map();
const Stack = [];
function addFileIdentifier(symbol) {
    if (symbol.valueDeclaration) {
        const fileName = symbol.valueDeclaration.getSourceFile().fileName;
        if (StructFileIdentifiers.has(fileName)) {
            const list = StructFileIdentifiers.get(fileName);
            if (!array.has(list, symbol.name)) {
                list.push(symbol.name);
            }
        }
        else {
            StructFileIdentifiers.set(fileName, [symbol.name]);
        }
    }
}
function isCStruct(node) {
    if (!node) {
        return false;
    }
    let has = false;
    // 检查是否拥有 CStruct
    array.each(node.modifiers, (modifier) => {
        var _a;
        if (modifier.kind === ts.SyntaxKind.Decorator
            && ((_a = modifier.expression) === null || _a === void 0 ? void 0 : _a.kind) === ts.SyntaxKind.Identifier
            && (modifier.expression.escapedText === cstruct)) {
            has = true;
            return false;
        }
    });
    return has;
}
function isCUnion(node) {
    if (!node) {
        return false;
    }
    let has = false;
    // 检查是否拥有 CUnion
    array.each(node.modifiers, (modifier) => {
        var _a;
        if (modifier.kind === ts.SyntaxKind.Decorator
            && ((_a = modifier.expression) === null || _a === void 0 ? void 0 : _a.kind) === ts.SyntaxKind.Identifier
            && (modifier.expression.escapedText === cunion)) {
            has = true;
            return false;
        }
    });
    return has;
}
function analyzeModifiers(list, data) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].kind === ts.SyntaxKind.Decorator) {
            const decorator = list[i];
            let hasIgnore = false;
            if (ts.isCallExpression(decorator.expression) && ts.isIdentifier(decorator.expression.expression)) {
                const name = decorator.expression.expression.escapedText;
                if (name === ctype) {
                    data.has = true;
                    if (ts.isIdentifier(decorator.expression.arguments[0]) || ts.isExpressionWithTypeArguments(decorator.expression.arguments[0])) {
                        data.typeIdentifier = (ts.isIdentifier(decorator.expression.arguments[0])
                            ? decorator.expression.arguments[0].escapedText
                            : decorator.expression
                                .arguments[0]
                                .expression.escapedText);
                        data.getTypeMeta = () => {
                            const type = ts.isIdentifier(decorator.expression.arguments[0])
                                ? statement.typeChecker.getTypeAtLocation(decorator.expression.arguments[0])
                                : statement.typeChecker.getTypeAtLocation(decorator.expression
                                    .arguments[0]
                                    .expression);
                            if (type) {
                                return getStruct(type.symbol);
                            }
                            else {
                                return {
                                    maxBaseTypeByteLength: 0,
                                    length: 0,
                                    structType: StructType.CSTRUCT,
                                    meta: null,
                                    symbol: null,
                                    name: ''
                                };
                            }
                        };
                    }
                    else if (decorator.expression.arguments[0].kind === ts.SyntaxKind.ThisKeyword) {
                        data.typeIdentifier = decorator.parent.parent.name.escapedText;
                        data.getTypeMeta = () => {
                            const type = statement.typeChecker.getTypeAtLocation(decorator.parent.parent);
                            return getStruct(type.symbol);
                        };
                    }
                    else if (ts.isPropertyAccessExpression(decorator.expression.arguments[0])) {
                        data[0 /* KeyMetaKey.Type */] = Type2CTypeEnum[decorator.expression.arguments[0].name.escapedText];
                    }
                }
                else if (name === cpointer) {
                    data[1 /* KeyMetaKey.Pointer */] = 1;
                    if (!decorator.expression.arguments.length) {
                        data[2 /* KeyMetaKey.PointerLevel */] = 1;
                    }
                    else {
                        if (ts.isIdentifier(decorator.expression.arguments[0])) {
                            data[2 /* KeyMetaKey.PointerLevel */] = +decorator.expression.arguments[0].escapedText;
                        }
                    }
                }
                else if (name === carray) {
                    data[3 /* KeyMetaKey.Array */] = 1;
                    data[4 /* KeyMetaKey.ArrayLength */] = 0;
                    if (ts.isNumericLiteral(decorator.expression.arguments[0])) {
                        data[4 /* KeyMetaKey.ArrayLength */] = +decorator.expression.arguments[0].text;
                    }
                    else if (ts.isIdentifier(decorator.expression.arguments[0])) {
                        const symbol = statement.typeChecker.getSymbolAtLocation(decorator.expression.arguments[0]);
                        if (symbol && ts.isVariableDeclaration(symbol.valueDeclaration) && symbol.valueDeclaration.initializer) {
                            if (ts.isNumericLiteral(symbol.valueDeclaration.initializer)) {
                                data[4 /* KeyMetaKey.ArrayLength */] = +symbol.valueDeclaration.initializer.text;
                            }
                        }
                    }
                    if (Number.isNaN(data[4 /* KeyMetaKey.ArrayLength */])) {
                        data[4 /* KeyMetaKey.ArrayLength */] = 0;
                    }
                }
                else if (name === cbitField) {
                    data[5 /* KeyMetaKey.BitField */] = 1;
                    if (ts.isIdentifier(decorator.expression.arguments[0])) {
                        data[6 /* KeyMetaKey.BitFieldLength */] = +decorator.expression.arguments[0].escapedText;
                    }
                }
                else if (name === cignore) {
                    hasIgnore = true;
                    if (ts.isCallExpression(decorator.expression)) {
                        if (decorator.expression.arguments.length
                            && !checkBool(statement.visitor(decorator.expression.arguments[0]), statement.visitor)) {
                            hasIgnore = false;
                        }
                    }
                }
            }
            else if (ts.isIdentifier(decorator.expression)) {
                const name = decorator.expression.escapedText;
                if (name === cignore) {
                    hasIgnore = true;
                }
            }
            if (hasIgnore) {
                data.has = false;
            }
        }
    }
}
function analyzeType(type, data) {
    var _a, _b, _c;
    if (type.aliasSymbol) {
        const typeName = type.aliasSymbol.escapedName;
        if (typeName === typeArray && ((_a = type.aliasTypeArguments[1]) === null || _a === void 0 ? void 0 : _a.isNumberLiteral())) {
            data[3 /* KeyMetaKey.Array */] = 1;
            data[4 /* KeyMetaKey.ArrayLength */] = (data[4 /* KeyMetaKey.ArrayLength */] ? data[4 /* KeyMetaKey.ArrayLength */] : 1) * type.aliasTypeArguments[1].value;
            analyzeType(type.aliasTypeArguments[0], data);
        }
        else if (typeName === typeBit && ((_b = type.aliasTypeArguments[1]) === null || _b === void 0 ? void 0 : _b.isNumberLiteral())) {
            data[5 /* KeyMetaKey.BitField */] = 1;
            data[6 /* KeyMetaKey.BitFieldLength */] = type.aliasTypeArguments[1].value;
            analyzeType(type.aliasTypeArguments[0], data);
        }
        else if (typeName === typePointer) {
            data[2 /* KeyMetaKey.PointerLevel */]++;
            data[1 /* KeyMetaKey.Pointer */] = 1;
            analyzeType(type.aliasTypeArguments[0], data);
        }
        else if (typeName === typeStruct
            || typeName === typeUnion) {
            const struct = getInlineStruct(type.aliasTypeArguments[0], typeName === typeUnion ? StructType.CUNION : StructType.CSTRUCT);
            if (struct) {
                data.has = true;
                const stack = Stack[Stack.length - 1];
                stack.inlineStructPathMap.set(struct.symbol.deref(), stack.treePath.join('.'));
                data.getTypeMeta = () => {
                    return struct;
                };
            }
        }
        else if (type.aliasSymbol.valueDeclaration
            && (ts.isEnumDeclaration(type.aliasSymbol.valueDeclaration)
                || ts.isEnumMember(type.aliasSymbol.valueDeclaration))) {
            data.has = true;
            data[0 /* KeyMetaKey.Type */] = 15 /* CTypeEnum.int32 */;
        }
        else if (array.has(BuiltinType, typeName)) {
            data.has = true;
            data[0 /* KeyMetaKey.Type */] = Type2CTypeEnum[typeName];
        }
    }
    else if (type.symbol
        && (isCStruct(type.symbol.valueDeclaration)
            || isCUnion(type.symbol.valueDeclaration))) {
        if (!data[1 /* KeyMetaKey.Pointer */] && type.symbol === data.symbol.deref()) {
            data.has = false;
        }
        else {
            data.has = true;
            data.typeIdentifier = type.symbol.escapedName;
            data.getTypeMeta = () => {
                return getStruct(type.symbol);
            };
        }
    }
    else if (((_c = type.symbol) === null || _c === void 0 ? void 0 : _c.valueDeclaration)
        && (ts.isEnumDeclaration(type.symbol.valueDeclaration)
            || ts.isEnumMember(type.symbol.valueDeclaration))) {
        data.has = true;
        data[0 /* KeyMetaKey.Type */] = 15 /* CTypeEnum.int32 */;
    }
    else if (data[1 /* KeyMetaKey.Pointer */]) {
        data.has = true;
        data[0 /* KeyMetaKey.Type */] = 1 /* CTypeEnum.void */;
    }
    else if (type.isUnion()) {
        analyzeType(type.types[0], data);
    }
}
function getInlineStruct(type, structType) {
    const metaMap = new Map();
    const metaQueue = [];
    if (type.symbol.members) {
        type.symbol.members.forEach((value, key) => {
            if (value.flags & ts.SymbolFlags.Property && value.valueDeclaration && ts.isPropertySignature(value.valueDeclaration)) {
                const stack = Stack[Stack.length - 1];
                stack.treePath.push(key);
                const metaData = {
                    [0 /* KeyMetaKey.Type */]: 1 /* CTypeEnum.void */,
                    [1 /* KeyMetaKey.Pointer */]: 0,
                    [2 /* KeyMetaKey.PointerLevel */]: 0,
                    [3 /* KeyMetaKey.Array */]: 0,
                    [4 /* KeyMetaKey.ArrayLength */]: 0,
                    [5 /* KeyMetaKey.BitField */]: 0,
                    [6 /* KeyMetaKey.BitFieldLength */]: 0,
                    [7 /* KeyMetaKey.BaseAddressOffset */]: 0,
                    [8 /* KeyMetaKey.BaseBitOffset */]: 0,
                    has: false,
                    typeIdentifier: '',
                    symbol: null,
                    name: key
                };
                analyzeType(statement.typeChecker.getTypeOfSymbol(value), metaData);
                if (metaData.has) {
                    metaMap.set(key, metaData);
                    metaQueue.push(key);
                }
                stack.treePath.pop();
            }
        });
    }
    if (metaMap.size) {
        const maxBaseTypeByteLength = getMaxBaseTypeByteLength(metaMap);
        if (!maxBaseTypeByteLength) {
            return null;
        }
        const length = structType === StructType.CUNION
            ? getMaxTypeByteLength(metaMap)
            : layout(metaQueue, metaMap, maxBaseTypeByteLength, 0);
        StructMap.set(type.symbol, {
            maxBaseTypeByteLength: maxBaseTypeByteLength,
            length: length,
            meta: metaMap,
            symbol: createWeakRef(type.symbol),
            parent: null,
            structType: StructType.INLINE_OBJECT,
            definedClassParent: Stack[Stack.length - 1].struct,
            name: type.symbol.name
        });
        addFileIdentifier(type.symbol);
        return StructMap.get(type.symbol);
    }
    return null;
}
function analyze(symbol) {
    var _a, _b;
    // 检查是否是类定义
    if (!symbol.valueDeclaration || !ts.isClassDeclaration(symbol.valueDeclaration)) {
        StructMap.set(symbol, null);
        return;
    }
    const valueDeclaration = symbol.valueDeclaration;
    if (!isCStruct(valueDeclaration) && !isCUnion(valueDeclaration)) {
        StructMap.set(symbol, null);
        return;
    }
    const structType = isCUnion(valueDeclaration) ? StructType.CUNION : StructType.CSTRUCT;
    const metaMap = new Map();
    const metaQueue = [];
    const inlineStructPathMap = new WeakMap();
    const struct = {
        maxBaseTypeByteLength: 0,
        length: 0,
        meta: null,
        symbol: createWeakRef(symbol),
        parent: null,
        structType: structType,
        name: symbol.name
    };
    const treePath = [];
    Stack.length = 0;
    Stack.push({
        treePath,
        struct,
        inlineStructPathMap
    });
    let parentStruct;
    if ((_a = valueDeclaration.heritageClauses) === null || _a === void 0 ? void 0 : _a.length) {
        for (let i = 0; i < valueDeclaration.heritageClauses.length; i++) {
            const clause = valueDeclaration.heritageClauses[i];
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                if (clause.types.length === 1) {
                    let parentSymbol = statement.typeChecker.getSymbolAtLocation(clause.types[0].expression);
                    parentStruct = StructMap.get(parentSymbol);
                    if (!parentStruct) {
                        analyze(parentSymbol);
                        parentStruct = StructMap.get(parentSymbol);
                    }
                }
            }
        }
    }
    if (symbol.members) {
        symbol.members.forEach((value, key) => {
            var _a;
            if (value.flags & ts.SymbolFlags.Property && value.valueDeclaration && ts.isPropertyDeclaration(value.valueDeclaration)) {
                const valueDeclaration = value.valueDeclaration;
                treePath.push(key);
                const metaData = {
                    [0 /* KeyMetaKey.Type */]: 1 /* CTypeEnum.void */,
                    [1 /* KeyMetaKey.Pointer */]: 0,
                    [2 /* KeyMetaKey.PointerLevel */]: 0,
                    [3 /* KeyMetaKey.Array */]: 0,
                    [4 /* KeyMetaKey.ArrayLength */]: 0,
                    [5 /* KeyMetaKey.BitField */]: 0,
                    [6 /* KeyMetaKey.BitFieldLength */]: 0,
                    [7 /* KeyMetaKey.BaseAddressOffset */]: 0,
                    [8 /* KeyMetaKey.BaseBitOffset */]: 0,
                    has: false,
                    typeIdentifier: '',
                    symbol: createWeakRef(symbol),
                    name: key
                };
                analyzeType(statement.typeChecker.getTypeOfSymbol(value), metaData);
                if ((_a = valueDeclaration.modifiers) === null || _a === void 0 ? void 0 : _a.length) {
                    analyzeModifiers(valueDeclaration.modifiers, metaData);
                }
                if (metaData.has) {
                    metaMap.set(key, metaData);
                    metaQueue.push(key);
                }
                treePath.pop();
            }
        });
    }
    if (metaMap.size) {
        const maxBaseTypeByteLength = Math.max(getMaxBaseTypeByteLength(metaMap), (_b = parentStruct === null || parentStruct === void 0 ? void 0 : parentStruct.maxBaseTypeByteLength) !== null && _b !== void 0 ? _b : 0);
        if (!maxBaseTypeByteLength) {
            StructMap.set(symbol, null);
            return;
        }
        let offset = 0;
        if (parentStruct) {
            offset = parentStruct.length;
        }
        const length = structType === StructType.CUNION
            ? getMaxTypeByteLength(metaMap)
            : layout(metaQueue, metaMap, maxBaseTypeByteLength, offset);
        object.extend(struct, {
            maxBaseTypeByteLength: maxBaseTypeByteLength,
            length,
            meta: metaMap,
            parent: parentStruct,
            inlineStructPathMap
        });
        StructMap.set(symbol, struct);
        addFileIdentifier(symbol);
    }
    else {
        if (parentStruct) {
            object.extend(struct, {
                maxBaseTypeByteLength: parentStruct.maxBaseTypeByteLength,
                length: parentStruct.length,
                meta: metaMap,
                parent: parentStruct
            });
            StructMap.set(symbol, struct);
            addFileIdentifier(symbol);
        }
        else {
            StructMap.set(symbol, null);
        }
    }
    Stack.pop();
}
function getStruct(symbol) {
    if (!symbol) {
        return null;
    }
    if (!StructMap.has(symbol)) {
        analyze(symbol);
    }
    return StructMap.get(symbol);
}
function hasStruct(symbol) {
    const struct = getStruct(symbol);
    return struct != null;
}
function getStructFileIdentifiers(fileName) {
    return StructFileIdentifiers.get(fileName);
}
function clearStructCache() {
    StructFileIdentifiers.clear();
}

function isCompatibleType(type1, type2) {
    if (type1 === typePointer && type2 === typeAnyptr
        || type1 === typeAnyptr && type2 === typePointer) {
        return true;
    }
    if (type1 === 'any' || type2 === 'any') {
        return true;
    }
    if (type1 === 'void' || type2 === 'void') {
        return true;
    }
    return type1 === type2;
}
function isTypeEquals(type1, node1, type2, node2) {
    var _a, _b;
    if (isPointerType(type1, node1) && isPointerType(type2, node2)) {
        if (isAnyPointer(type1) || isAnyPointer(type2)) {
            return true;
        }
        return getFixTypeByType(type1, node1) === getFixTypeByType(type2, node2)
            && getPointerLevelByType(type1, node1) === getPointerLevelByType(type2, node2);
    }
    else if (isBuiltinType(type1, node1) && isBuiltinType(type2, node2)) {
        return getBuiltinByType(type1, node1) === getBuiltinByType(type2, node2);
    }
    else if (isStructType(type1) && isStructType(type2)) {
        return getStructByType(type1) === getStructByType(type2);
    }
    if (type1.symbol && type2.symbol) {
        return type1.symbol === type2.symbol;
    }
    else if (type1.aliasSymbol && type2.aliasSymbol) {
        if (type1.aliasSymbol.escapedName === typePointer && type2.aliasSymbol.escapedName === typeAnyptr
            || type1.aliasSymbol.escapedName === typeAnyptr && type2.aliasSymbol.escapedName === typePointer) {
            return true;
        }
        if (!type1.aliasTypeArguments && !type2.aliasTypeArguments) {
            return isCompatibleType(type1.aliasSymbol.escapedName, type2.aliasSymbol.escapedName);
        }
        if (((_a = type1.aliasTypeArguments) === null || _a === void 0 ? void 0 : _a.length) === ((_b = type2.aliasTypeArguments) === null || _b === void 0 ? void 0 : _b.length)) {
            for (let i = 0; i < type1.aliasTypeArguments.length; i++) {
                if (!isTypeEquals(type1.aliasTypeArguments[i], null, type2.aliasTypeArguments[i], null)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    // @ts-ignore
    else if (type1.intrinsicName && type2.intrinsicName) {
        // @ts-ignore
        return type1.intrinsicName === type2.intrinsicName;
    }
    return false;
}
function isBuiltinType(type, node) {
    if (!type) {
        return false;
    }
    if (isPointerType(type, node)) {
        return true;
    }
    if (type.aliasSymbol) {
        if (type.aliasSymbol.escapedName === typeAnyptr
            || type.aliasSymbol.escapedName === typeMultiPointer) {
            return true;
        }
        return is.number(Type2CTypeEnum[type.aliasSymbol.escapedName]);
    }
    if (type.isIntersection()) {
        const value = getSymbolTypeValue(type.getProperty(typeProperty));
        if (value) {
            return is.number(Type2CTypeEnum[value.replace(/\*$/g, '')]);
        }
    }
    return false;
}
function isPointerBuiltinType(type, node) {
    if (!type) {
        return false;
    }
    return isPointerType(type, node)
        && (type.aliasSymbol && type.aliasTypeArguments && isBuiltinType(type.aliasTypeArguments[0], null)
            || !type.symbol && !type.aliasSymbol && !isPointerStructType(type, node));
}
function isStructType(type, ignoreLevel = false) {
    var _a, _b, _c, _d, _e, _f;
    if (!type) {
        return false;
    }
    if (type.symbol) {
        return hasStruct(type.symbol);
    }
    else if (type.aliasSymbol) {
        return type.aliasSymbol.escapedName === typeStruct
            || type.aliasSymbol.escapedName === typeUnion;
    }
    else if (type.isIntersection()) {
        const level = getSymbolTypeValue(type.getProperty(levelProperty));
        if (!ignoreLevel && level && level > 0) {
            return false;
        }
        // pointer[x]
        const type_ = type.getProperty(typeProperty);
        // @ts-ignore
        if ((_b = (_a = type_ === null || type_ === void 0 ? void 0 : type_.links) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.symbol) {
            // @ts-ignore
            return isStructType(type_.links.type);
        }
        // @ts-ignore
        else if (((_d = (_c = type_ === null || type_ === void 0 ? void 0 : type_.links) === null || _c === void 0 ? void 0 : _c.type) === null || _d === void 0 ? void 0 : _d.aliasSymbol)
            // @ts-ignore
            && ((_f = (_e = type_ === null || type_ === void 0 ? void 0 : type_.links) === null || _e === void 0 ? void 0 : _e.type) === null || _f === void 0 ? void 0 : _f.aliasTypeArguments)
            && (
            // @ts-ignore
            type_.links.type.aliasSymbol.escapedName === typeStruct
                // @ts-ignore
                || type_.links.type.aliasSymbol.escapedName === typeUnion)) {
            // @ts-ignore
            return isStructType(type_.links.type.aliasTypeArguments[0]);
        }
        // 内联 struct
        const struct_ = type.getProperty(structProperty);
        if (struct_) {
            for (let i = 0; i < type.types.length; i++) {
                if (type.types[i].symbol && hasStruct(type.types[i].symbol)) {
                    return true;
                }
            }
        }
    }
    return false;
}
function isAnyPointer(type) {
    if (type.aliasSymbol) {
        return type.aliasSymbol.escapedName === typeAnyptr;
    }
    return false;
}
function isArrayType(type) {
    var _a;
    return type.aliasSymbol
        && type.aliasSymbol.escapedName === typeArray
        && ((_a = type.aliasTypeArguments[1]) === null || _a === void 0 ? void 0 : _a.isNumberLiteral());
}
function isNullPointer(type, node) {
    if (type.aliasSymbol) {
        return type.aliasSymbol.escapedName === typeNullptr;
    }
    else if (node && ts.isIdentifier(node)) {
        return node.escapedText === typeNullptr;
    }
    return false;
}
function isMultiPointer(type) {
    if (type.aliasSymbol) {
        return type.aliasSymbol.escapedName === typeMultiPointer;
    }
    return false;
}
function isPointerType(type, node) {
    if (!type) {
        return false;
    }
    if (isAnyPointer(type) || isMultiPointer(type) || isNullPointer(type, node)) {
        return true;
    }
    if (type.aliasSymbol) {
        return type.aliasSymbol.escapedName === typePointer;
    }
    if (type.symbol) {
        return type.symbol.escapedName === typePointer;
    }
    if (type.isIntersection()) {
        const value = getSymbolTypeValue(type.getProperty(levelProperty));
        if (value != null) {
            return value > 0;
        }
    }
    return false;
}
function isSizeType(type, union = false) {
    if (!type) {
        return false;
    }
    if (type.aliasSymbol) {
        return type.aliasSymbol.escapedName === typeSize;
    }
    else if (type.isIntersection()) {
        const value = getSymbolTypeValue(type.getProperty(typeProperty));
        if (value === typeSize) {
            return true;
        }
    }
    else if (union && type.isUnion()) {
        for (let i = 0; i < type.types.length; i++) {
            if (isSizeType(type.types[i])) {
                return true;
            }
        }
    }
    return false;
}
function isPointerStructType(type, node) {
    if (!type) {
        return false;
    }
    if (isPointerType(type, node)) {
        if (isAnyPointer(type) || isMultiPointer(type)) {
            return false;
        }
        if (type.aliasSymbol && type.aliasTypeArguments) {
            return isStructType(type.aliasTypeArguments[0]);
        }
        else if (!type.symbol && !type.aliasSymbol && type.isIntersection()) {
            const level = getSymbolTypeValue(type.getProperty(levelProperty));
            if (level && level > 1) {
                return false;
            }
            return isStructType(type, true);
        }
    }
    return false;
}
function getStructByType(type) {
    var _a, _b, _c, _d, _e, _f;
    if (type.aliasSymbol && type.aliasTypeArguments) {
        if (type.aliasSymbol.escapedName === typeStruct
            || type.aliasSymbol.escapedName === typeUnion
            || type.aliasSymbol.escapedName === typeArray
            || type.aliasSymbol.escapedName === typePointer
            || type.aliasSymbol.escapedName === sharedPtr) {
            return getStructByType(type.aliasTypeArguments[0]);
        }
    }
    else if (type.symbol) {
        return getStruct(type.symbol);
    }
    else if (type.isIntersection()) {
        // pointer[x]
        const type_ = type.getProperty(typeProperty);
        // @ts-ignore
        if ((_b = (_a = type_ === null || type_ === void 0 ? void 0 : type_.links) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.symbol) {
            // @ts-ignore
            return getStructByType(type_.links.type);
        }
        // @ts-ignore
        else if (((_d = (_c = type_ === null || type_ === void 0 ? void 0 : type_.links) === null || _c === void 0 ? void 0 : _c.type) === null || _d === void 0 ? void 0 : _d.aliasSymbol)
            // @ts-ignore
            && ((_f = (_e = type_ === null || type_ === void 0 ? void 0 : type_.links) === null || _e === void 0 ? void 0 : _e.type) === null || _f === void 0 ? void 0 : _f.aliasTypeArguments)
            && (
            // @ts-ignore
            type_.links.type.aliasSymbol.escapedName === typeStruct
                // @ts-ignore
                || type_.links.type.aliasSymbol.escapedName === typeUnion)) {
            // @ts-ignore
            return getStructByType(type_.links.type.aliasTypeArguments[0]);
        }
        // 内联 struct
        const struct_ = type.getProperty(structProperty);
        if (struct_) {
            for (let i = 0; i < type.types.length; i++) {
                if (type.types[i].symbol && hasStruct(type.types[i].symbol)) {
                    return getStruct(type.types[i].symbol);
                }
            }
        }
    }
}
function getPointerStructByType(type, node) {
    if (getPointerLevelByType(type, node) > 1) {
        return null;
    }
    return type.aliasSymbol && type.aliasTypeArguments && !isPointerType(type.aliasTypeArguments[0], null) && getStructByType(type.aliasTypeArguments[0])
        || !type.symbol && !type.aliasSymbol && getStructByType(type);
}
function getSmartPointerStructByType(type) {
    var _a;
    return type.aliasSymbol && ((_a = type.aliasTypeArguments) === null || _a === void 0 ? void 0 : _a.length) === 1 && getStruct(type.aliasTypeArguments[0].symbol);
}
function getBuiltinNameByType(type) {
    if (type.aliasSymbol) {
        return type.aliasSymbol.escapedName;
    }
    if (type.isIntersection()) {
        const value = getSymbolTypeValue(type.getProperty(typeProperty));
        if (value) {
            if (/\*+$/.test(value)) {
                return CTypeEnum2Type[20 /* CTypeEnum.pointer */];
            }
            return value;
        }
    }
}
function getBuiltinByType(type, node) {
    if (isPointerType(type, node)) {
        return 20 /* CTypeEnum.pointer */;
    }
    const name = getBuiltinNameByType(type);
    if (name) {
        return Type2CTypeEnum[name];
    }
}
function getPointerBuiltinByType(type, node) {
    let builtinType = type.aliasSymbol && type.aliasTypeArguments && getBuiltinByType(type.aliasTypeArguments[0], null);
    if (!is.number(builtinType) && !type.symbol && !type.aliasSymbol && type.isIntersection()) {
        if (getPointerLevelByType(type, node) > 1) {
            return 20 /* CTypeEnum.pointer */;
        }
        const value = getSymbolTypeValue(type.getProperty(typeProperty));
        if (value) {
            if (/\*{2}$/.test(value)) {
                return 20 /* CTypeEnum.pointer */;
            }
            return Type2CTypeEnum[value.replace(/\**$/, '')];
        }
    }
    return builtinType;
}
function getFixTypeByType(type, node) {
    if (isPointerType(type, node)) {
        if (type.aliasSymbol && type.aliasTypeArguments) {
            return getFixTypeByType(type.aliasTypeArguments[0], null);
        }
        else {
            const value = getSymbolTypeValue(type.getProperty(typeProperty));
            if (value) {
                return Type2CTypeEnum[value.replace(/\**$/, '')];
            }
            else {
                return getStructByType(type);
            }
        }
    }
    else if (isStructType(type)) {
        return getStructByType(type);
    }
    else if (isBuiltinType(type, node)) {
        return getBuiltinByType(type, node);
    }
}
function getPointerLevelByType(type, node) {
    if (isPointerType(type, node) && type.isIntersection()) {
        const value = getSymbolTypeValue(type.getProperty(levelProperty));
        if (value) {
            return value;
        }
    }
    return 0;
}
function isSmartPointerType(type) {
    if (!type) {
        return false;
    }
    if (type.aliasSymbol) {
        const value = getSymbolTypeValue(type.getProperty(typeProperty));
        return type.aliasSymbol.escapedName === sharedPtr && value === sharedPtr;
    }
    return false;
}
function getSymbolTypeValue(type) {
    var _a, _b, _c, _d;
    if (!type) {
        return;
    }
    // @ts-ignore
    if ((_b = (_a = type === null || type === void 0 ? void 0 : type.links) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.value) {
        // @ts-ignore
        return type.links.type.value;
    }
    // @ts-ignore
    else if ((_d = (_c = type === null || type === void 0 ? void 0 : type.valueDeclaration) === null || _c === void 0 ? void 0 : _c.type) === null || _d === void 0 ? void 0 : _d.literal) {
        // @ts-ignore
        return type.valueDeclaration.type.literal.text;
    }
}

function getEqualsBinaryExpressionRight(node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        return getEqualsBinaryExpressionRight(node.right);
    }
    return node;
}
function isExpressionPointer(node) {
    let root = getPropertyAccessExpressionRootNode(node);
    while (root && root !== node) {
        const type = statement.typeChecker.getTypeAtLocation(root);
        if (isPointerType(type, root)) {
            return true;
        }
        root = root.parent;
    }
    if (!root) {
        return false;
    }
    const type = statement.typeChecker.getTypeAtLocation(root);
    if (isPointerType(type, root)) {
        return true;
    }
    return false;
}
function isExpressionSmartPointer(node) {
    let root = getPropertyAccessExpressionRootNode(node);
    while (root && root !== node) {
        const type = statement.typeChecker.getTypeAtLocation(root);
        if (isSmartPointerType(type)) {
            return true;
        }
        root = root.parent;
    }
    if (!root) {
        return false;
    }
    const type = statement.typeChecker.getTypeAtLocation(root);
    if (isSmartPointerType(type)) {
        return true;
    }
    return false;
}
function getPointerExpressionType(node) {
    if (ts.isBinaryExpression(node)) {
        const type = statement.typeChecker.getTypeAtLocation(node.right);
        if (isPointerType(type, node.right)) {
            return type;
        }
        return getPointerExpressionType(node.left);
    }
    return statement.typeChecker.getTypeAtLocation(node);
}
function isPointerNode(node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        return isPointerNode(node.left) || isPointerNode(node.right);
    }
    // 检查表达式类型
    let type = statement.typeChecker.getTypeAtLocation(node);
    if (isPointerType(type, node)) {
        return true;
    }
    // 检查二元操作符 (pointer 参与的运算结果为 pointer)
    type = getPointerExpressionType(node);
    if (isPointerType(type, node)) {
        return true;
    }
    // 检查属性访问中是否有 pointer
    if (ts.isPropertyAccessExpression(node)) {
        return isExpressionPointer(node);
    }
    // xx.xx[]
    else if (ts.isElementAccessExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        return isExpressionPointer(node.expression);
    }
    // xx[][]
    else if (ts.isElementAccessExpression(node)) {
        return isPointerNode(node.expression);
    }
    return false;
}
function isSmartPointerNode(node) {
    // 检查表达式类型
    let type = statement.typeChecker.getTypeAtLocation(node);
    if (isSmartPointerType(type)) {
        return true;
    }
    if (ts.isPropertyAccessExpression(node)) {
        return isExpressionSmartPointer(node);
    }
    else if (ts.isElementAccessExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        return isExpressionSmartPointer(node.expression);
    }
    else if (ts.isElementAccessExpression(node)) {
        return isSmartPointerNode(node.expression);
    }
    return false;
}
function isJSDocTypeAlias(node) {
    return node.kind === ts.SyntaxKind.JSDocTypedefTag || node.kind === ts.SyntaxKind.JSDocCallbackTag || node.kind === ts.SyntaxKind.JSDocEnumTag;
}
function getContainerNode(node) {
    if (isJSDocTypeAlias(node)) {
        node = node.parent.parent;
    }
    while (true) {
        node = node.parent;
        if (!node) {
            return void 0;
        }
        switch (node.kind) {
            case ts.SyntaxKind.SourceFile:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.ModuleDeclaration:
                return node;
        }
    }
}
function isParseTreeNode(node) {
    return (node.flags & ts.NodeFlags.Synthesized) === 0;
}
function getParseTreeNode(node, nodeTest) {
    if (node == null || isParseTreeNode(node)) {
        return node;
    }
    node = ts.getOriginalNode(node);
    while (node) {
        if (isParseTreeNode(node)) {
            return !nodeTest || nodeTest(node) ? node : undefined;
        }
        node = ts.getOriginalNode(node);
    }
}
function isPointerIndexOfCall(node) {
    if (ts.isPropertyAccessExpression(node.expression)) {
        const type = statement.typeChecker.getTypeAtLocation(node.expression.expression);
        return isPointerType(type, node.expression.expression) && node.expression.name.escapedText === indexOf;
    }
    return false;
}
function isPointerElementAccess(node) {
    return ts.isElementAccessExpression(node) && isPointerNode(node.expression);
}
function isSmartPointerElementAccess(node) {
    return ts.isElementAccessExpression(node) && isSmartPointerNode(node.expression);
}
function getPropertyAccessExpressionRootNode(node) {
    if (ts.isPropertyAccessExpression(node)
        || ts.isCallExpression(node)
        || ts.isElementAccessExpression(node)) {
        return getPropertyAccessExpressionRootNode(node.expression);
    }
    return node;
}
function getParameterDefaultValue(symbol, index) {
    var _a;
    const declarations = symbol.declarations;
    if (declarations === null || declarations === void 0 ? void 0 : declarations.length) {
        for (let i = 0; i < declarations.length; i++) {
            const declaration = declarations[i];
            if ((ts.isFunctionDeclaration(declaration)
                || ts.isMethodDeclaration(declaration))
                && declaration.parameters
                && ((_a = declaration.parameters[index]) === null || _a === void 0 ? void 0 : _a.initializer)) {
                return declaration.parameters[index].initializer;
            }
        }
    }
}
function checkBool(node, visitor) {
    function compute(node) {
        if (ts.isParenthesizedExpression(node)) {
            return ts.visitNode(node.expression, compute);
        }
        else if (ts.isPrefixUnaryExpression(node)) {
            if (node.operator === ts.SyntaxKind.ExclamationToken) {
                return !ts.visitNode(node.operand, compute);
            }
            return true;
        }
        else if (ts.isBinaryExpression(node)) {
            const left = ts.visitNode(node.left, compute);
            const right = ts.visitNode(node.right, compute);
            if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
                return left && right;
            }
            else if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
                return left || right;
            }
            return true;
        }
        else {
            const newNode = ts.visitNode(node, visitor);
            if (newNode.kind === ts.SyntaxKind.TrueKeyword) {
                return true;
            }
            else if (newNode.kind === ts.SyntaxKind.FalseKeyword) {
                return false;
            }
            else if (ts.isNumericLiteral(newNode)) {
                return (+newNode.text) !== 0;
            }
            else if (ts.isStringLiteral(newNode)) {
                return newNode.text !== '';
            }
            return true;
        }
    }
    return ts.visitNode(node, compute);
}
function getBinaryBuiltinTypeName(node) {
    if (!node) {
        return '';
    }
    const type = statement.typeChecker.getTypeAtLocation(node);
    if (isSizeType(type)) {
        return statement.cheapCompilerOptions.defined.WASM_64 ? 'uint64' : 'uint32';
    }
    else if (type.aliasSymbol && array.has(BuiltinType, type.aliasSymbol.escapedName)) {
        return type.aliasSymbol.escapedName;
    }
    else if (isPointerType(type, node)) {
        return statement.cheapCompilerOptions.defined.WASM_64 ? 'uint64' : 'uint32';
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) {
        return 'bool';
    }
    if (ts.isBinaryExpression(node)) {
        const leftType = getBinaryBuiltinTypeName(node.left);
        const rightType = getBinaryBuiltinTypeName(node.right);
        if (array.has(BuiltinFloat, leftType)) {
            return leftType;
        }
        if (array.has(BuiltinFloat, rightType)) {
            return rightType;
        }
        if (array.has(BuiltinBigInt, leftType)) {
            if (node.operatorToken.kind === ts.SyntaxKind.MinusToken) {
                return 'int64';
            }
            return leftType;
        }
        if (array.has(BuiltinBigInt, rightType)) {
            if (node.operatorToken.kind === ts.SyntaxKind.MinusToken) {
                return 'int64';
            }
            return rightType;
        }
        if (node.operatorToken.kind === ts.SyntaxKind.MinusToken) {
            return 'int32';
        }
        return 'uint32';
    }
    if (type.flags & ts.TypeFlags.BigInt || type.flags & ts.TypeFlags.BigIntLiteral) {
        if (type.flags & ts.TypeFlags.BigIntLiteral) {
            if (node.parent && ts.isPrefixUnaryExpression(node.parent) && node.parent.operator === ts.SyntaxKind.MinusToken) {
                return 'int64';
            }
        }
        if (type.flags & ts.TypeFlags.BigInt) {
            if (ts.isCallExpression(node) && node.arguments[0]) {
                const type = getBinaryBuiltinTypeName(node.arguments[0]);
                if (!array.has(BuiltinUint, type)) {
                    return 'int64';
                }
            }
        }
        return 'uint64';
    }
    if (type.flags & ts.TypeFlags.Enum || type.flags & ts.TypeFlags.EnumLiteral) {
        return 'int32';
    }
    if (type.flags & ts.TypeFlags.Number || type.flags & ts.TypeFlags.NumberLiteral) {
        if (type.flags & ts.TypeFlags.NumberLiteral) {
            // @ts-ignore
            if ((type.value + '').indexOf('.') > -1) {
                return 'double';
            }
            if (node.parent && ts.isPrefixUnaryExpression(node.parent) && node.parent.operator === ts.SyntaxKind.MinusToken) {
                return 'int32';
            }
            if (type.flags & ts.TypeFlags.Number) {
                if (ts.isCallExpression(node) && node.arguments[0]) {
                    const type = getBinaryBuiltinTypeName(node.arguments[0]);
                    if (!array.has(BuiltinUint, type)) {
                        return 'int32';
                    }
                }
            }
            return 'uint32';
        }
        return 'double';
    }
    if (type.isUnion()) {
        for (let i = 0; i < type.types.length; i++) {
            if (type.types[i].aliasSymbol && array.has(BuiltinType, type.types[i].aliasSymbol.escapedName)) {
                return type.types[i].aliasSymbol.escapedName;
            }
        }
    }
    return '';
}
function getParentMethodDeclaration(node, method) {
    var _a;
    if ((_a = node.members) === null || _a === void 0 ? void 0 : _a.length) {
        for (let i = 0; i < node.members.length; i++) {
            if (ts.isMethodDeclaration(node.members[i])
                && ts.isIdentifier(node.members[i].name)
                && node.members[i].name.escapedText === method) {
                return node.members[i];
            }
        }
    }
    if (node.heritageClauses) {
        for (let i = 0; i < node.heritageClauses.length; i++) {
            const types = node.heritageClauses[i].types;
            for (let j = 0; j < types.length; j++) {
                if (ts.isExpressionWithTypeArguments(types[j])) {
                    const type = statement.typeChecker.getTypeAtLocation(types[j].expression);
                    if ((type === null || type === void 0 ? void 0 : type.symbol)
                        && type.symbol.valueDeclaration
                        && (ts.isClassDeclaration(type.symbol.valueDeclaration)
                            || ts.isInterfaceDeclaration(type.symbol.valueDeclaration))) {
                        const declaration = getParentMethodDeclaration(type.symbol.valueDeclaration, method);
                        if (declaration) {
                            return declaration;
                        }
                    }
                }
            }
        }
    }
}
function isSynchronizeFunction(node) {
    if (!node) {
        return false;
    }
    if (node.modifiers) {
        for (let i = 0; i < node.modifiers.length; i++) {
            const modifier = node.modifiers[i];
            if (ts.isDecorator(modifier)
                && ts.isIdentifier(modifier.expression)
                && modifier.expression.escapedText === cdeasync) {
                return true;
            }
        }
    }
    if (node.name && ts.isIdentifier(node.name) && ts.isClassDeclaration(node.parent) && node.parent.heritageClauses) {
        for (let i = 0; i < node.parent.heritageClauses.length; i++) {
            for (let i = 0; i < node.parent.heritageClauses.length; i++) {
                const types = node.parent.heritageClauses[i].types;
                for (let j = 0; j < types.length; j++) {
                    if (ts.isExpressionWithTypeArguments(types[j])) {
                        const type = statement.typeChecker.getTypeAtLocation(types[j].expression);
                        if ((type === null || type === void 0 ? void 0 : type.symbol)
                            && type.symbol.valueDeclaration
                            && (ts.isClassDeclaration(type.symbol.valueDeclaration)
                                || ts.isInterfaceDeclaration(type.symbol.valueDeclaration))) {
                            const declaration = getParentMethodDeclaration(type.symbol.valueDeclaration, node.name.escapedText);
                            if (declaration) {
                                return isSynchronizeFunction(declaration);
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}
function isAtomicCallExpression(node) {
    const callName = ts.isPropertyAccessExpression(node.expression)
        ? node.expression.name.escapedText
        : (ts.isIdentifier(node.expression)
            ? node.expression.escapedText
            : '');
    if (!array.has(AtomicCall, callName)) {
        return false;
    }
    const symbol = statement.typeChecker.getSymbolAtLocation(node.expression);
    const file = symbol.valueDeclaration.getSourceFile();
    const atomicPathReg = new RegExp(`${atomicsPath}\\.ts$`);
    return atomicPathReg.test(file.fileName)
        || file.fileName.indexOf(PACKET_NAME) >= 0
            && file.fileName.indexOf(atomicsPath.replace(PACKET_NAME, '')) >= 0;
}
function checkConditionCompile(node) {
    if (ts.isParenthesizedExpression(node)) {
        return ts.visitNode(node.expression, checkConditionCompile);
    }
    else if (ts.isPrefixUnaryExpression(node)) {
        return ts.visitNode(node.operand, checkConditionCompile);
    }
    else if (ts.isBinaryExpression(node)) {
        const left = ts.visitNode(node.left, checkConditionCompile);
        if (!left) {
            return false;
        }
        return ts.visitNode(node.right, checkConditionCompile);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.escapedText === defined
        || node.kind === ts.SyntaxKind.TrueKeyword
        || node.kind === ts.SyntaxKind.FalseKeyword) {
        return true;
    }
    else {
        return false;
    }
}
function hasDefined(node) {
    if (ts.isParenthesizedExpression(node)) {
        return ts.visitNode(node.expression, hasDefined);
    }
    else if (ts.isPrefixUnaryExpression(node)) {
        return ts.visitNode(node.operand, hasDefined);
    }
    else if (ts.isBinaryExpression(node)) {
        return ts.visitNode(node.left, hasDefined) || ts.visitNode(node.right, hasDefined);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.escapedText === defined) {
        return true;
    }
    else {
        return false;
    }
}
function createBitInt(value) {
    if (statement.cheapCompilerOptions.defined.BIGINT_LITERAL) {
        return statement.context.factory.createBigIntLiteral(value + 'n');
    }
    return statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('BigInt'), undefined, [
        statement.context.factory.createNumericLiteral(value)
    ]);
}
function createPointerOperand(value) {
    if (is.number(value)) {
        if (statement.cheapCompilerOptions.defined.WASM_64) {
            return createBitInt(value);
        }
        return statement.context.factory.createNumericLiteral(value);
    }
    else if (ts.isNumericLiteral(value)) {
        if (statement.cheapCompilerOptions.defined.WASM_64) {
            return createBitInt(+value.text);
        }
        return value;
    }
    else if (isBigIntNode(value)) {
        const num = getBigIntValue(value);
        if (statement.cheapCompilerOptions.defined.WASM_64) {
            return createBitInt(Number(num));
        }
        return statement.context.factory.createNumericLiteral(Number(num));
    }
    else {
        const typeName = getBinaryBuiltinTypeName(value);
        if (statement.cheapCompilerOptions.defined.WASM_64
            && (!typeName || !array.has(BuiltinBigInt, typeName) && typeName !== typeSize)) {
            return statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('BigInt'), undefined, [
                value
            ]);
        }
        return value;
    }
}
function isBigIntNode(node) {
    return ts.isBigIntLiteral(node)
        || ts.isCallExpression(node)
            && ts.isIdentifier(node.expression)
            && node.expression.escapedText === 'BigInt'
            && node.arguments.length === 1
            && ts.isNumericLiteral(node.arguments[0]);
}
function getBigIntValue(node) {
    if (ts.isBigIntLiteral(node)) {
        return BigInt(node.text.substring(0, node.text.length - 1));
    }
    else {
        return BigInt(node.arguments[0].text);
    }
}
function getTypeAtLocation(node) {
    if (node.pos >= 0) {
        return statement.typeChecker.getTypeAtLocation(node);
    }
    if (ts.isParenthesizedExpression(node)) {
        return getTypeAtLocation(node.expression);
    }
    return statement.typeChecker.getTypeAtLocation(node);
}

function blockVisitor (node, visitor) {
    let type = BlockType.UNKNOWN;
    if (node.parent) {
        if (ts.isFunctionDeclaration(node.parent)
            || ts.isFunctionExpression(node.parent)
            || ts.isArrowFunction(node.parent)
            || ts.isMethodDeclaration(node.parent)) {
            type = BlockType.FUNCTION;
        }
        else if (ts.isIfStatement(node.parent)) {
            type = BlockType.IF;
        }
        else if (ts.isForStatement(node.parent) || ts.isForOfStatement(node.parent) || ts.isWhileStatement(node.parent)) {
            type = BlockType.LOOP;
        }
    }
    statement.pushStack(type);
    if (statement.cheapCompilerOptions.defined.ENABLE_SYNCHRONIZE_API
        && node.parent
        && (ts.isFunctionDeclaration(node.parent)
            || ts.isFunctionExpression(node.parent)
            || ts.isArrowFunction(node.parent)
            || ts.isMethodDeclaration(node.parent))
        && isSynchronizeFunction(node.parent)) {
        statement.getCurrentStack().synchronize = true;
    }
    let nodes = ts.visitEachChild(node, visitor, statement.context);
    const stack = statement.getCurrentStack();
    const updatedStatements = [];
    array.each(stack.topDeclaration, (item) => {
        updatedStatements.push(statement.context.factory.createVariableStatement(undefined, statement.context.factory.createVariableDeclarationList([
            statement.context.factory.createVariableDeclaration(item.formatName, undefined, undefined, item.initializer)
        ])));
    });
    if (updatedStatements.length) {
        nodes = statement.context.factory.createBlock([...updatedStatements, ...nodes.statements], true);
    }
    statement.popStack();
    return nodes;
}

function identifierVisitor (node, visitor) {
    var _a, _b;
    if ((statement.lookupStage(StageStatus.Parameter) || statement.lookupStage(StageStatus.VariableDeclaration))
        && node.parent
        && (ts.isVariableDeclaration(node.parent) && node.parent.name === node
            || ts.isBindingElement(node.parent) && node.parent.name === node
            || ts.isParameter(node.parent) && node.parent.name === node)) {
        statement.getCurrentStack().locals.set(node.escapedText, statement.typeChecker.getSymbolAtLocation(node));
    }
    let parent = node.parent;
    if (parent && ts.isAsExpression(parent)) {
        parent = node.parent.parent;
    }
    if (node.escapedText === CTypeEnum2Type[0 /* CTypeEnum.null */]
        && !statement.lookupLocal(node.escapedText)
        && parent && (parent.initializer === node
        || ts.isBinaryExpression(parent)
        || ts.isCallExpression(parent)
        || ts.isReturnStatement(parent)
        || ts.isConditionalExpression(parent)
        || ts.isCaseClause(parent)
        || ts.isComputedPropertyName(parent)
        || ts.isArrayLiteralExpression(parent)
        || ts.isAsExpression(parent)
        || ((_a = statement.getCurrentStage()) === null || _a === void 0 ? void 0 : _a.stage) === StageStatus.SingleArrowRight && !ts.isTypeReferenceNode(parent))) {
        if (statement.cheapCompilerOptions.defined.WASM_64) {
            return createBitInt(0);
        }
        else {
            return statement.context.factory.createNumericLiteral(0);
        }
    }
    else if (is.number(Type2CTypeEnum[node.escapedText])
        && !statement.lookupLocal(node.escapedText)
        && parent && (parent.initializer === node
        || ts.isBinaryExpression(parent)
        || (ts.isCallExpression(parent) && parent.expression !== node)
        || ts.isReturnStatement(parent)
        || ts.isConditionalExpression(parent)
        || ts.isCaseClause(parent)
        || ts.isComputedPropertyName(parent)
        || ts.isElementAccessExpression(parent) && parent.argumentExpression === node
        || ((_b = statement.getCurrentStage()) === null || _b === void 0 ? void 0 : _b.stage) === StageStatus.SingleArrowRight && !ts.isTypeReferenceNode(parent))) {
        return statement.context.factory.createNumericLiteral(Type2CTypeEnum[node.escapedText]);
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function decoratorVisitor (node, visitor) {
    if (ts.isIdentifier(node.expression)) {
        const name = node.expression.escapedText;
        if (array.has(BuiltinDecorator, name)) {
            return undefined;
        }
    }
    else if (ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
        const name = node.expression.expression.escapedText;
        if (array.has(BuiltinDecorator, name)) {
            return undefined;
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}
function asyncVisitor(node, visitor) {
    if (statement.cheapCompilerOptions.defined.ENABLE_SYNCHRONIZE_API
        && node.parent
        && (ts.isFunctionDeclaration(node.parent)
            || ts.isFunctionExpression(node.parent)
            || ts.isArrowFunction(node.parent)
            || ts.isMethodDeclaration(node.parent))
        && isSynchronizeFunction(node.parent)) {
        return undefined;
    }
    return node;
}

function generateStruct(struct) {
    const definedMetaProperty$1 = statement.addIdentifierImport(definedMetaProperty, InternalPath, false);
    const symbolStruct$1 = statement.addSymbolImport(symbolStruct);
    const symbolStructMaxBaseTypeByteLength = statement.addSymbolImport(symbolStructMaxBaseTypeByteLength$1);
    const symbolStructLength = statement.addSymbolImport(symbolStructLength$1);
    const symbolStructKeysMeta$1 = statement.addSymbolImport(symbolStructKeysMeta);
    const list = [];
    // const map = new Map()
    list.push(statement.context.factory.createVariableStatement(undefined, statement.context.factory.createVariableDeclarationList([
        statement.context.factory.createVariableDeclaration(statement.context.factory.createIdentifier('map'), undefined, undefined, statement.context.factory.createNewExpression(statement.context.factory.createIdentifier('Map'), undefined, []))
    ])));
    const meta = struct.meta;
    meta.forEach((data, key) => {
        var _a;
        let type;
        if (is.func(data.getTypeMeta)) {
            if (data.typeIdentifier) {
                const targetSymbol = (_a = data.getTypeMeta()) === null || _a === void 0 ? void 0 : _a.symbol.deref();
                const targetSource = targetSymbol === null || targetSymbol === void 0 ? void 0 : targetSymbol.valueDeclaration.getSourceFile();
                if (targetSource && targetSource.fileName !== statement.currentFile.fileName) {
                    type = statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(0 /* KeyMetaKey.Type */), statement.addStructImport(targetSymbol, targetSource));
                }
                else {
                    if (statement.hasStruct(data.typeIdentifier)) {
                        type = statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(0 /* KeyMetaKey.Type */), statement.context.factory.createIdentifier(data.typeIdentifier));
                    }
                    else {
                        type = statement.context.factory.createGetAccessorDeclaration(undefined, statement.context.factory.createNumericLiteral(0 /* KeyMetaKey.Type */), [], undefined, statement.context.factory.createBlock([statement.context.factory.createReturnStatement(statement.context.factory.createIdentifier(data.typeIdentifier))], false));
                    }
                }
            }
            else {
                const inlineStruct = data.getTypeMeta();
                if (inlineStruct && inlineStruct.structType === StructType.INLINE_OBJECT) {
                    const body = generateStruct(inlineStruct);
                    body.push(statement.context.factory.createReturnStatement(statement.context.factory.createIdentifier(prototype)));
                    type = statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(0 /* KeyMetaKey.Type */), statement.context.factory.createCallExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createFunctionExpression(undefined, undefined, undefined, undefined, [
                        statement.context.factory.createParameterDeclaration(undefined, undefined, statement.context.factory.createIdentifier(prototype))
                    ], undefined, 
                    // @ts-ignore
                    statement.context.factory.createBlock(body, true))), undefined, [
                        statement.context.factory.createObjectLiteralExpression()
                    ]));
                }
                else {
                    return true;
                }
            }
        }
        else {
            type = statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(0 /* KeyMetaKey.Type */), statement.context.factory.createNumericLiteral(data[0 /* KeyMetaKey.Type */]));
        }
        list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier('map'), statement.context.factory.createIdentifier('set')), undefined, [
            statement.context.factory.createStringLiteral(key),
            statement.context.factory.createObjectLiteralExpression([
                type,
                statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(1 /* KeyMetaKey.Pointer */), statement.context.factory.createNumericLiteral(data[1 /* KeyMetaKey.Pointer */])),
                statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(2 /* KeyMetaKey.PointerLevel */), statement.context.factory.createNumericLiteral(data[2 /* KeyMetaKey.PointerLevel */])),
                statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(3 /* KeyMetaKey.Array */), statement.context.factory.createNumericLiteral(data[3 /* KeyMetaKey.Array */])),
                statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(4 /* KeyMetaKey.ArrayLength */), statement.context.factory.createNumericLiteral(data[4 /* KeyMetaKey.ArrayLength */])),
                statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(5 /* KeyMetaKey.BitField */), statement.context.factory.createNumericLiteral(data[5 /* KeyMetaKey.BitField */])),
                statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(6 /* KeyMetaKey.BitFieldLength */), statement.context.factory.createNumericLiteral(data[6 /* KeyMetaKey.BitFieldLength */])),
                statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(7 /* KeyMetaKey.BaseAddressOffset */), statement.context.factory.createNumericLiteral(data[7 /* KeyMetaKey.BaseAddressOffset */])),
                statement.context.factory.createPropertyAssignment(statement.context.factory.createNumericLiteral(8 /* KeyMetaKey.BaseBitOffset */), statement.context.factory.createNumericLiteral(data[8 /* KeyMetaKey.BaseBitOffset */]))
            ])
        ])));
    });
    // definedMetaProperty(proto, symbolStruct, true)
    list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(definedMetaProperty$1, undefined, [
        statement.context.factory.createIdentifier(prototype),
        symbolStruct$1,
        statement.context.factory.createTrue()
    ])));
    // definedMetaProperty(proto, symbolStructMaxBaseTypeByteLength, 0)
    list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(definedMetaProperty$1, undefined, [
        statement.context.factory.createIdentifier(prototype),
        symbolStructMaxBaseTypeByteLength,
        statement.context.factory.createNumericLiteral(struct.maxBaseTypeByteLength)
    ])));
    // definedMetaProperty(proto, symbolStructLength, 0)
    list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(definedMetaProperty$1, undefined, [
        statement.context.factory.createIdentifier(prototype),
        symbolStructLength,
        statement.context.factory.createNumericLiteral(struct.length)
    ])));
    // definedMetaProperty(proto, symbolStructKeysMeta, map)
    list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(definedMetaProperty$1, undefined, [
        statement.context.factory.createIdentifier(prototype),
        symbolStructKeysMeta$1,
        statement.context.factory.createIdentifier('map')
    ])));
    return list;
}

function classDeclarationVisitor (node, visitor) {
    const type = statement.typeChecker.getTypeAtLocation(node);
    const struct = getStructByType(type);
    if (struct && (!node.modifiers || !node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword))) {
        const structName = node.name.escapedText;
        if (!statement.hasStruct(structName)) {
            statement.addStruct(structName);
        }
        const newNode = [
            ts.visitEachChild(node, visitor, statement.context),
            statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createFunctionExpression(undefined, undefined, undefined, undefined, [
                statement.context.factory.createParameterDeclaration(undefined, undefined, statement.context.factory.createIdentifier(prototype))
            ], undefined, statement.context.factory.createBlock(generateStruct(struct), true))), undefined, [
                statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier(structName), statement.context.factory.createIdentifier('prototype'))
            ]))
        ];
        const item = statement.getDeclaration(structName);
        if (item) {
            newNode.push(statement.context.factory.createExpressionStatement(statement.context.factory.createBinaryExpression(statement.context.factory.createIdentifier(item.formatName), ts.SyntaxKind.EqualsToken, statement.context.factory.createIdentifier(item.name))));
        }
        return newNode;
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function check(node) {
    if (ts.isBlock(node)
        && !node.statements.some((n) => !ts.isImportDeclaration(n))) {
        if (node.statements.length === 1) {
            return node.statements[0];
        }
        return node.statements;
    }
    return node;
}
function ifStatementVisitor (node, visitor) {
    if (ts.visitNode(node.expression, hasDefined) && ts.visitNode(node.expression, checkConditionCompile)) {
        if (checkBool(node.expression, visitor)) {
            return check(ts.visitNode(node.thenStatement, visitor));
        }
        else if (node.elseStatement) {
            return check(ts.visitNode(node.elseStatement, visitor));
        }
        else {
            return undefined;
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function parameterVisitor (node, visitor) {
    statement.pushStage(StageStatus.Parameter);
    if (node.initializer && node.type && node.pos > -1) {
        const type = statement.typeChecker.getTypeAtLocation(node.type);
        if (isSizeType(type)) {
            return ts.visitNode(statement.context.factory.createParameterDeclaration(node.modifiers, node.dotDotDotToken, node.name, node.questionToken, node.type, createPointerOperand(node.initializer)), statement.visitor);
        }
    }
    const newNode = ts.visitEachChild(node, visitor, statement.context);
    statement.popStage();
    return newNode;
}

const TYPE_MISMATCH = 10000;
const INVALID_OPERATE = 20000;
const SYNTAX_ERROR = 30000;

function variableDeclarationVisitor (node, visitor) {
    statement.pushStage(StageStatus.VariableDeclaration);
    if (node.initializer && node.type && node.pos > -1) {
        const type = statement.typeChecker.getTypeAtLocation(node.type);
        const initType = statement.typeChecker.getTypeAtLocation(node.initializer);
        if (isPointerType(type, null)
            && (isBuiltinType(initType, node.initializer) || (initType.flags & ts.TypeFlags.NumberLike))
            && !isPointerType(initType, node.initializer)
            && !isNullPointer(initType, node.initializer)) {
            reportError(statement.currentFile, node, `type ${getBuiltinNameByType(initType) || 'number'} is not assignable to variable declaration of type ${getBuiltinNameByType(type)}`, TYPE_MISMATCH);
        }
        else if (isSizeType(type)) {
            return ts.visitNode(statement.context.factory.createVariableDeclaration(node.name, node.exclamationToken, node.type, createPointerOperand(node.initializer)), statement.visitor);
        }
    }
    const newNode = ts.visitEachChild(node, visitor, statement.context);
    statement.popStage();
    return newNode;
}

function functionDeclarationVisitor (node, visitor) {
    if (node.name) {
        statement.addFunc(node.name.escapedText, node);
    }
    statement.pushStack();
    let newNode = ts.visitEachChild(node, visitor, statement.context);
    statement.popStack();
    return newNode;
}

function expressionStatementVisitor (node, visitor) {
    if (ts.isCallExpression(node.expression)
        && ts.isIdentifier(node.expression.expression)
        && node.expression.expression.escapedText === assert) {
        if (statement.cheapCompilerOptions.defined['DEBUG'] && node.expression.arguments.length >= 1) {
            const newNode = ts.visitEachChild(node.expression, visitor, statement.context);
            const list = [];
            const { line } = ts.getLineAndCharacterOfPosition(statement.currentFile, node.getStart());
            const args = [
                statement.context.factory.createStringLiteral(`[${statement.currentFilePath} line: ${line + 1}]`),
                statement.context.factory.createStringLiteral(`Assertion failed: ${node.expression.arguments[0].getText()}`)
            ];
            if (newNode.arguments[1]) {
                args.push(newNode.arguments[1]);
            }
            list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier('console'), statement.context.factory.createIdentifier('error')), undefined, args)));
            list.push(statement.context.factory.createDebuggerStatement());
            return statement.context.factory.createIfStatement(statement.context.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, statement.context.factory.createParenthesizedExpression(newNode.arguments[0])), statement.context.factory.createBlock(list, true));
        }
        else {
            return undefined;
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function bigIntLiteralVisitor (node, visitor) {
    if (statement.cheapCompilerOptions.defined.BIGINT_LITERAL === false) {
        return statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('BigInt'), undefined, [
            statement.context.factory.createNumericLiteral(node.text.replace(/n$/, ''))
        ]);
    }
    return node;
}

function getStructMeta(struct, key) {
    let meta = struct.meta.get(key);
    if (meta) {
        return meta;
    }
    let next = struct.parent;
    while (next) {
        meta = next.meta.get(key);
        if (meta) {
            return meta;
        }
        next = next.parent;
    }
    return null;
}

function definedReplace(name, node) {
    if (name === LINE || name === LINE_2) {
        const { line } = ts.getLineAndCharacterOfPosition(statement.currentFile, node.getStart());
        return statement.context.factory.createNumericLiteral(line + 1);
    }
    else if (name === FILE || name === FILE_2) {
        const { formatName } = statement.addModuleDeclaration('fileName', statement.context.factory.createStringLiteral(statement.currentFilePath));
        return statement.context.factory.createIdentifier(formatName);
    }
    else if (isDef(statement.cheapCompilerOptions.defined[name])) {
        const value = statement.cheapCompilerOptions.defined[name];
        if (is.boolean(value)) {
            return value ? statement.context.factory.createTrue() : statement.context.factory.createFalse();
        }
        else if (is.number(value)) {
            return statement.context.factory.createNumericLiteral(value);
        }
        else if (is.string(value)) {
            return statement.context.factory.createStringLiteral(value);
        }
        else if (node) {
            reportError(statement.currentFile, node, `the type(${typeof value}) of defined not support`);
            return node;
        }
    }
    else if (node) {
        reportError(statement.currentFile, node, `cannot found the defined(${name})`);
        return node;
    }
}
function definedString(name, node) {
    if (name === LINE || name === LINE_2) {
        const { line } = ts.getLineAndCharacterOfPosition(statement.currentFile, node.getStart());
        return toString(line + 1);
    }
    else if (name === FILE || name === FILE_2) {
        return statement.currentFilePath;
    }
    else if (isDef(statement.cheapCompilerOptions.defined[name])) {
        const value = statement.cheapCompilerOptions.defined[name];
        return toString(value, '');
    }
    return '';
}
function hasTypeArgs(args$1) {
    if (!args$1) {
        return false;
    }
    for (let i = 0; i < args$1.length; i++) {
        const node = args$1[i];
        if (node.name.escapedText === args) {
            return true;
        }
    }
    return false;
}
function getTypeArgs(target, sig) {
    let index = -1;
    for (let i = 0; i < target.length; i++) {
        const node = target[i];
        if (node.name.escapedText === args) {
            index = i;
            break;
        }
    }
    if (index > -1) {
        return sig[index];
    }
}
function isArgsEnable(target, sig, call) {
    for (let i = 0; i < target.length; i++) {
        const node = target[i];
        if (node.name.escapedText === enableArgs && node.default) {
            const args = [];
            addArgs(args, sig[i], call);
            if (args[0].kind === ts.SyntaxKind.FalseKeyword
                || ts.isStringLiteral(args[0]) && args[0].text === ''
                || ts.isNumericLiteral(args[0]) && args[0].text === '0') {
                return false;
            }
            break;
        }
    }
    return true;
}
function addArgs(args, node, call) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (ts.isTypeReferenceNode(node)) {
        // @ts-ignore
        if (ts.isIdentifier(node.typeName) && node.typeName.symbol) {
            // @ts-ignore
            const type = statement.typeChecker.getTypeOfSymbol(node.typeName.symbol);
            // @ts-ignore
            if (isBuiltinType(type, (_a = node.typeName.symbol) === null || _a === void 0 ? void 0 : _a.valueDeclaration)) {
                // @ts-ignore
                args.push(statement.context.factory.createNumericLiteral(getBuiltinByType(type, (_b = node.typeName.symbol) === null || _b === void 0 ? void 0 : _b.valueDeclaration)));
            }
            else if (type.aliasSymbol) {
                const name = type.aliasSymbol.escapedName;
                args.push(statement.context.factory.createIdentifier(name));
            }
            else if (type.symbol && type.symbol.valueDeclaration && ts.isClassDeclaration(type.symbol.valueDeclaration)) {
                let key;
                const targetSource = (_c = type.symbol.valueDeclaration) === null || _c === void 0 ? void 0 : _c.getSourceFile();
                if (targetSource !== statement.currentFile) {
                    key = statement.addStructImport(type.symbol, targetSource);
                }
                else {
                    key = statement.context.factory.createIdentifier(type.symbol.escapedName);
                }
                args.push(key);
            }
            else if (type.symbol) {
                args.push(statement.context.factory.createIdentifier(type.symbol.escapedName));
            }
            else {
                args.push(statement.context.factory.createIdentifier('undefined'));
            }
        }
        else {
            args.push(statement.context.factory.createIdentifier('undefined'));
        }
    }
    else if (ts.isLiteralTypeNode(node)) {
        if (ts.isNumericLiteral(node.literal)) {
            args.push(statement.context.factory.createNumericLiteral(+node.literal.text));
        }
        else if (ts.isStringLiteral(node.literal)) {
            if (/^defined\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)$/.test(node.literal.text)) {
                const match = node.literal.text.match(/^defined\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)$/);
                const newNode = definedReplace(match[1], call);
                if (newNode) {
                    args.push(newNode);
                }
                else {
                    args.push(statement.context.factory.createIdentifier('undefined'));
                }
            }
            else if (/^moduleId\(([0-9]+)\)$/.test(node.literal.text)) {
                if (statement.cheapCompilerOptions.defined.ENV_WEBPACK) {
                    const match = node.literal.text.match(/^moduleId\(([0-9]+)\)$/);
                    const index = +match[1];
                    const arg = call.arguments[index];
                    if (arg) {
                        const type = statement.typeChecker.getTypeAtLocation(arg);
                        const targetSource = (_d = type.symbol.valueDeclaration) === null || _d === void 0 ? void 0 : _d.getSourceFile();
                        if (targetSource) {
                            const callType = statement.typeChecker.getTypeAtLocation(call.expression);
                            const callPath = (_f = (_e = callType === null || callType === void 0 ? void 0 : callType.symbol) === null || _e === void 0 ? void 0 : _e.valueDeclaration) === null || _f === void 0 ? void 0 : _f.getSourceFile().fileName;
                            let cheapThreadPath$1 = cheapThreadPath;
                            if (statement.options.cheapSourcePath) {
                                cheapThreadPath$1 = statement.options.cheapSourcePath + cheapThreadPath$1.replace(PACKET_NAME, '');
                            }
                            if (statement.cheapCompilerOptions.defined.ENABLE_THREADS
                                && statement.cheapCompilerOptions.defined.ENABLE_THREADS_SPLIT
                                && (callPath.indexOf(cheapThreadPath$1) >= 0
                                    || callPath.indexOf(PACKET_NAME) >= 0
                                        && callPath.indexOf(cheapThreadPath$1.replace(PACKET_NAME, '')) >= 0)
                                && (callType.symbol.escapedName === createThreadFromClass
                                    || callType.symbol.escapedName === createThreadFromFunction
                                    || callType.symbol.escapedName === createThreadFromModule)) {
                                const initType = callType.symbol.escapedName === createThreadFromClass
                                    ? 'class'
                                    : (callType.symbol.escapedName === createThreadFromModule ? 'module' : 'function');
                                let point = ts.isIdentifier(call.arguments[0]) ? call.arguments[0].escapedText
                                    : (ts.isPropertyAccessExpression(call.arguments[0]) ? call.arguments[0].name.escapedText : 'unknown');
                                if (initType === 'class' || initType === 'function') {
                                    let type;
                                    if (ts.isIdentifier(call.arguments[0])) {
                                        type = statement.typeChecker.getTypeAtLocation(call.arguments[0]);
                                    }
                                    else if (ts.isPropertyAccessExpression(call.arguments[0])) {
                                        type = statement.typeChecker.getTypeAtLocation(call.arguments[0].name);
                                    }
                                    if ((_g = type === null || type === void 0 ? void 0 : type.symbol) === null || _g === void 0 ? void 0 : _g.valueDeclaration) {
                                        if (ts.isClassDeclaration(type.symbol.valueDeclaration)) {
                                            if (type.symbol.valueDeclaration.name) {
                                                point = type.symbol.valueDeclaration.name.escapedText;
                                            }
                                            else {
                                                reportError(statement.currentFile, node, 'The thread class must have a class name');
                                                return node;
                                            }
                                        }
                                        else if (ts.isFunctionDeclaration(type.symbol.valueDeclaration)) {
                                            if (type.symbol.valueDeclaration.name) {
                                                point = type.symbol.valueDeclaration.name.escapedText;
                                            }
                                            else {
                                                reportError(statement.currentFile, node, 'The thread function must has a function name');
                                                return node;
                                            }
                                        }
                                    }
                                }
                                let name = `${point}Thread`;
                                if (call.arguments[1] && ts.isObjectLiteralExpression(call.arguments[1])) {
                                    call.arguments[1].properties.forEach((node) => {
                                        if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.escapedText === 'name') {
                                            let text = node.initializer.getText();
                                            if (text) {
                                                text = text.replace(/^['|"]/, '');
                                                text = text.replace(/['|"]$/, '');
                                                if (text) {
                                                    name = text;
                                                }
                                            }
                                        }
                                    });
                                }
                                const loader = `cheap-worker-loader?type=${initType}&point=${point}&name=${name}`;
                                const identifier = statement.addIdentifierImport('worker', `${loader}!${relativePath(statement.currentFile.fileName, targetSource.fileName)}`, true);
                                args.push(identifier);
                            }
                            else {
                                args.push(statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier('require'), statement.context.factory.createIdentifier('resolveWeak')), undefined, [
                                    statement.context.factory.createStringLiteral(relativePath(statement.currentFile.fileName, targetSource.fileName))
                                ]));
                            }
                        }
                    }
                }
                else {
                    reportError(statement.currentFile, call, 'moduleId only support in webpack');
                }
            }
            else {
                let text = node.literal.text.replace(/defined\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)/g, (s1, s2) => {
                    return definedString(s2, call);
                });
                args.push(statement.context.factory.createStringLiteral(text));
            }
        }
        else if (node.literal.kind === ts.SyntaxKind.TrueKeyword) {
            args.push(statement.context.factory.createTrue());
        }
        else if (node.literal.kind === ts.SyntaxKind.FalseKeyword) {
            args.push(statement.context.factory.createFalse());
        }
    }
    else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
        args.push(statement.context.factory.createIdentifier('undefined'));
    }
}
function accessCType(pointer, type) {
    return statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), type), undefined, [
        pointer
    ]);
}
function accessStruct(pointer, struct) {
    var _a;
    const targetStruct = struct;
    let targetSymbol = targetStruct.symbol.deref();
    let targetPath = '';
    if (targetStruct.structType === StructType.INLINE_OBJECT) {
        targetSymbol = targetStruct.definedClassParent.symbol.deref();
        targetPath = targetStruct.definedClassParent.inlineStructPathMap.get(targetStruct.symbol.deref());
    }
    const targetSource = (_a = targetSymbol.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getSourceFile();
    if (targetSource) {
        let key;
        if (targetSource !== statement.currentFile) {
            key = statement.addStructImport(targetSymbol, targetSource);
        }
        else {
            key = statement.context.factory.createIdentifier(targetSymbol.escapedName);
        }
        const args = [
            pointer,
            key
        ];
        if (targetPath) {
            args.push(statement.context.factory.createStringLiteral(targetPath));
        }
        return statement.context.factory.createCallExpression(statement.addIdentifierImport(structAccess, RootPath, false), undefined, args);
    }
}
function getTypeSize(nameType, node) {
    var _a, _b;
    if (isStructType(nameType)) {
        const struct = getStructByType(nameType);
        if (struct) {
            return struct.length;
        }
    }
    else if (isBuiltinType(nameType, node)) {
        return CTypeEnum2Bytes[getBuiltinByType(nameType, node)];
    }
    else if (nameType.aliasSymbol) {
        const type = nameType.aliasSymbol.escapedName;
        if (type === typeArray && ((_a = nameType.aliasTypeArguments[1]) === null || _a === void 0 ? void 0 : _a.isNumberLiteral())) {
            return getTypeSize(nameType.aliasTypeArguments[0], null) * nameType.aliasTypeArguments[1].value;
        }
        else if (type === typeBit && ((_b = nameType.aliasTypeArguments[1]) === null || _b === void 0 ? void 0 : _b.isNumberLiteral())) {
            return nameType.aliasTypeArguments[1].value;
        }
    }
    return 0;
}
function formatArgument(signature, args) {
    const newArgument = [];
    let hasSizeParameter = false;
    for (let i = 0; i < args.length; i++) {
        if (signature.parameters[i]) {
            const argumentType = statement.typeChecker.getTypeAtLocation(args[i]);
            const parameterType = statement.typeChecker.getTypeOfSymbol(signature.parameters[i]);
            if (isPointerType(argumentType, args[i])
                && isBuiltinType(parameterType, signature.parameters[i].valueDeclaration)
                && !isPointerType(parameterType, signature.parameters[i].valueDeclaration)
                && !isNullPointer(parameterType, signature.parameters[i].valueDeclaration)
                || isBuiltinType(argumentType, args[i])
                    && !isPointerType(argumentType, args[i])
                    && !isNullPointer(argumentType, args[i])
                    && isPointerType(parameterType, signature.parameters[i].valueDeclaration)) {
                reportError(statement.currentFile, args[i], `type ${getBuiltinNameByType(argumentType)} is not assignable to parameter of type ${getBuiltinNameByType(parameterType)}`, TYPE_MISMATCH);
            }
            if (isSizeType(parameterType)) {
                newArgument.push(createPointerOperand(args[i]));
                hasSizeParameter = true;
            }
            else {
                newArgument.push(args[i]);
            }
        }
    }
    return {
        newArgument,
        hasSizeParameter
    };
}
function callVisitor (node, visitor) {
    var _a, _b, _c, _d, _e, _f, _g;
    let callName = '';
    if (ts.isIdentifier(node.expression)) {
        callName = node.expression.escapedText;
    }
    else if (ts.isPropertyAccessExpression(node.expression)) {
        callName = node.expression.name.escapedText;
    }
    const signature = statement.typeChecker.getResolvedSignature(node);
    const target = signature === null || signature === void 0 ? void 0 : signature.getDeclaration();
    if (target && hasTypeArgs(target.typeParameters)) {
        const sig = statement.typeChecker.signatureToSignatureDeclaration(signature, ts.SyntaxKind.CallSignature, getParseTreeNode(getContainerNode(node)), ts.NodeBuilderFlags.WriteTypeArgumentsOfSignature
            | ts.NodeBuilderFlags.IgnoreErrors
            | ts.NodeBuilderFlags.WriteTypeParametersInQualifiedName
            | ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope
            | ts.NodeBuilderFlags.MultilineObjectLiterals
            | ts.NodeBuilderFlags.OmitParameterModifiers);
        if (sig === null || sig === void 0 ? void 0 : sig.typeArguments) {
            const typeNode = getTypeArgs(target.typeParameters, sig.typeArguments);
            if (typeNode && isArgsEnable(target.typeParameters, sig.typeArguments, node)) {
                const args = [];
                let padding = (((_a = target.parameters) === null || _a === void 0 ? void 0 : _a.length) || 0) - node.arguments.length;
                while (padding > 0) {
                    args.push((_b = getParameterDefaultValue(statement.typeChecker.getSymbolAtLocation(target.name), node.arguments.length + args.length)) !== null && _b !== void 0 ? _b : statement.context.factory.createIdentifier('undefined'));
                    padding--;
                }
                if (ts.isTupleTypeNode(typeNode)) {
                    typeNode.elements.forEach((item) => {
                        if (padding < 0) {
                            padding++;
                        }
                        else {
                            addArgs(args, item, node);
                        }
                    });
                }
                else {
                    if (padding < 0) {
                        padding++;
                    }
                    else {
                        addArgs(args, typeNode, node);
                    }
                }
                if (isAtomicCallExpression(node)
                    && getPointerBuiltinByType(statement.typeChecker.getTypeAtLocation(node.arguments[0]), node.arguments[0]) === 24 /* CTypeEnum.atomic_bool */) {
                    if (callName === 'load') {
                        return ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(staticCast), [
                            statement.context.factory.createTypeReferenceNode(statement.context.factory.createIdentifier(CTypeEnum2Type[24 /* CTypeEnum.atomic_bool */]), undefined)
                        ], [
                            statement.context.factory.createCallExpression(node.expression, undefined, [
                                ...node.arguments,
                                ...args
                            ])
                        ]), visitor);
                    }
                    else if (callName === 'store' || callName === 'exchange') {
                        return ts.visitNode(statement.context.factory.createCallExpression(node.expression, undefined, [
                            node.arguments[0],
                            statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(staticCast), [
                                statement.context.factory.createTypeReferenceNode(statement.context.factory.createIdentifier(CTypeEnum2Type[16 /* CTypeEnum.atomic_int32 */]), undefined)
                            ], [
                                node.arguments[1]
                            ]),
                            ...args
                        ]), visitor);
                    }
                    else if (callName === 'compareExchange') {
                        return ts.visitNode(statement.context.factory.createCallExpression(node.expression, undefined, [
                            node.arguments[0],
                            statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(staticCast), [
                                statement.context.factory.createTypeReferenceNode(statement.context.factory.createIdentifier(CTypeEnum2Type[16 /* CTypeEnum.atomic_int32 */]), undefined)
                            ], [
                                node.arguments[1]
                            ]),
                            statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(staticCast), [
                                statement.context.factory.createTypeReferenceNode(statement.context.factory.createIdentifier(CTypeEnum2Type[16 /* CTypeEnum.atomic_int32 */]), undefined)
                            ], [
                                node.arguments[2]
                            ]),
                            ...args
                        ]), visitor);
                    }
                    else {
                        reportError(statement.currentFile, node, `atomic_bool not support to ${callName} operate`);
                        return node;
                    }
                }
                return ts.visitNode(statement.context.factory.createCallExpression(node.expression, node.typeArguments, [
                    ...node.arguments,
                    ...args
                ]), visitor);
            }
        }
    }
    // 全局函数
    if (ts.isIdentifier(node.expression)) {
        if (callName === sizeof && !statement.lookupFunc(sizeof)) {
            const arg = node.arguments[0];
            let nameType = statement.typeChecker.getTypeAtLocation(arg);
            if (nameType) {
                const size = getTypeSize(nameType, arg);
                if (size) {
                    return createPointerOperand(statement.context.factory.createNumericLiteral(size));
                }
                else {
                    return statement.context.factory.createCallExpression(statement.addIdentifierImport(sizeof, RootPath, false), undefined, node.arguments);
                }
            }
        }
        else if (callName === addressof && !statement.lookupFunc(addressof)) {
            const arg = node.arguments[0];
            if (ts.isCallExpression(arg)
                // addressof(accessof(p))
                && (ts.isIdentifier(arg.expression) && arg.expression.escapedText === accessof
                    // addressof(CTypeEnumRead[type](p))
                    || ts.isElementAccessExpression(arg.expression)
                        && (ts.isIdentifier(arg.expression.expression) || ts.isPropertyAccessExpression(arg.expression.expression))
                        && statement.isIdentifier(arg.expression.expression, ctypeEnumRead, ctypeEnumReadPath, InternalPath)
                    // addressof(structAccess(p, A))
                    || (ts.isIdentifier(arg.expression) || ts.isPropertyAccessExpression(arg.expression))
                        && statement.isIdentifier(arg.expression, structAccess, structAccessPath, RootPath))) {
                return ts.visitNode(arg.arguments[0], visitor);
            }
            // addressof(struct)
            if (ts.isIdentifier(arg)) {
                // 只支持 struct 取地址
                if (!hasStruct((_c = statement.typeChecker.getTypeAtLocation(arg)) === null || _c === void 0 ? void 0 : _c.symbol)) {
                    reportError(statement.currentFile, arg, 'addressof only support with struct instance Identifier');
                    return node;
                }
                return statement.context.factory.createElementAccessExpression(ts.visitNode(arg, visitor), statement.addSymbolImport(symbolStructAddress));
            }
            // addressof(struct.p)
            else if (ts.isPropertyAccessExpression(arg)
                || ts.isCallExpression(arg) && isPointerIndexOfCall(arg)
                // pointer[x]
                || ts.isElementAccessExpression(arg) && isPointerType(statement.typeChecker.getTypeAtLocation(arg.expression), arg.expression)) {
                const newArg = ts.visitNode(arg, visitor);
                if (ts.isCallExpression(newArg)
                    && (ts.isIdentifier(newArg.expression)
                        && statement.isIdentifier(newArg.expression, structAccess, structAccessPath, RootPath)
                        || ts.isPropertyAccessExpression(newArg.expression)
                            && statement.isIdentifier(newArg.expression, structAccess, structAccessPath, RootPath))) {
                    return newArg.arguments[0];
                }
                else if (ts.isCallExpression(newArg)
                    && ts.isElementAccessExpression(newArg.expression)
                    && (ts.isIdentifier(newArg.expression.expression)
                        && statement.isIdentifier(newArg.expression.expression, ctypeEnumRead, ctypeEnumReadPath, InternalPath)
                        || ts.isPropertyAccessExpression(newArg.expression.expression)
                            && statement.isIdentifier(newArg.expression.expression, ctypeEnumRead, ctypeEnumReadPath, InternalPath))) {
                    return newArg.arguments[0];
                }
                else if (ts.isPropertyAccessExpression(newArg)) {
                    let type = statement.typeChecker.getTypeAtLocation(arg.expression);
                    let struct = getStructByType(type);
                    if (!struct) {
                        type = statement.typeChecker.getTypeAtLocation(arg);
                        struct = getStructByType(type);
                        if (struct) {
                            return statement.context.factory.createElementAccessExpression(newArg, statement.addSymbolImport(symbolStructAddress));
                        }
                        reportError(statement.currentFile, arg, 'addressof only support with struct instance or struct property');
                        return node;
                    }
                    const meta = getStructMeta(struct, newArg.name.escapedText);
                    if (!meta) {
                        reportError(statement.currentFile, node, `struct ${struct.symbol.deref().escapedName} not has property ${newArg.name.escapedText}`);
                        return node;
                    }
                    if (meta[5 /* KeyMetaKey.BitField */]) {
                        reportError(statement.currentFile, arg, 'addressof not support with bit field property');
                        return node;
                    }
                    if (meta[7 /* KeyMetaKey.BaseAddressOffset */]) {
                        return statement.context.factory.createBinaryExpression(statement.context.factory.createElementAccessExpression(newArg.expression, statement.addSymbolImport(symbolStructAddress)), ts.SyntaxKind.PlusToken, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */]));
                    }
                    else {
                        if (ts.isCallExpression(newArg.expression)
                            && ts.isIdentifier(newArg.expression.expression)
                            && newArg.expression.expression.escapedText === structAccess) {
                            return newArg.expression.arguments[0];
                        }
                        return statement.context.factory.createElementAccessExpression(newArg.expression, statement.addSymbolImport(symbolStructAddress));
                    }
                }
                else if (ts.isElementAccessExpression(newArg)
                    && ts.isCallExpression(newArg.expression)
                    && ts.isIdentifier(newArg.expression.expression)
                    && newArg.expression.expression.escapedText === structAccess) {
                    return newArg.expression.arguments[0];
                }
                else {
                    reportError(statement.currentFile, arg, 'invalid operation');
                    return node;
                }
            }
            // addressof(struct.p[x])
            else if (ts.isElementAccessExpression(arg)) {
                const address = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
                    arg.expression
                ]), visitor);
                let offset;
                let size = 0;
                const type = statement.typeChecker.getTypeAtLocation(arg);
                if (isBuiltinType(type, arg)) {
                    size = CTypeEnum2Bytes[getBuiltinByType(type, arg)];
                }
                else if (isStructType(type)) {
                    const struct = getStructByType(type);
                    size = struct.length;
                }
                else if (isArrayType(type)) {
                    size = getTypeSize(type.aliasTypeArguments[0], null) * type.aliasTypeArguments[1].value;
                }
                if (!size) {
                    reportError(statement.currentFile, arg, 'type mismatch');
                    return node;
                }
                if (ts.isNumericLiteral(arg.argumentExpression)) {
                    if (+arg.argumentExpression.text) {
                        offset = createPointerOperand(+arg.argumentExpression.text * size);
                    }
                }
                else {
                    offset = createPointerOperand(statement.context.factory.createBinaryExpression(ts.visitNode(arg.argumentExpression, visitor), ts.SyntaxKind.AsteriskToken, statement.context.factory.createNumericLiteral(size)));
                }
                if (offset) {
                    return statement.context.factory.createBinaryExpression(address, ts.SyntaxKind.PlusToken, offset);
                }
                return address;
            }
            else {
                const type = statement.typeChecker.getTypeAtLocation(arg);
                if (type.symbol && hasStruct(type.symbol)) {
                    return statement.context.factory.createElementAccessExpression(ts.visitNode(arg, visitor), statement.addSymbolImport(symbolStructAddress));
                }
                reportError(statement.currentFile, arg, 'addressof only support in related to struct');
                return node;
            }
        }
        else if (callName === accessof && !statement.lookupFunc(accessof) && isPointerNode(node.arguments[0])) {
            const arg = node.arguments[0];
            if (ts.isCallExpression(arg) && ts.isIdentifier(arg.expression) && arg.expression.escapedText === addressof) {
                return ts.visitNode(arg.arguments[0], visitor);
            }
            const type = getPointerExpressionType(arg);
            if (isPointerType(type, arg)) {
                const newArg = ts.visitNode(arg, visitor);
                if (isPointerStructType(type, arg)) {
                    const struct = getPointerStructByType(type, arg);
                    return accessStruct(newArg, struct);
                }
                else if (isPointerBuiltinType(type, arg)) {
                    return statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), getPointerBuiltinByType(type, arg)), undefined, [
                        newArg
                    ]);
                }
                else {
                    reportError(statement.currentFile, node, 'accessof only support in cheap builtin type or struct type');
                    return node;
                }
            }
            else {
                reportError(statement.currentFile, node, `the type of ${arg.getText()} is not pointer`);
                return node;
            }
        }
        else if (callName === offsetof && !statement.lookupFunc(offsetof)) {
            if (node.arguments.length === 2) {
                const type = statement.typeChecker.getTypeAtLocation(node.arguments[0]);
                if (isStructType(type) && ts.isStringLiteral(node.arguments[1])) {
                    const struct = getStructByType(type);
                    const meta = getStructMeta(struct, node.arguments[1].text);
                    if (meta) {
                        return statement.context.factory.createNumericLiteral(meta[7 /* KeyMetaKey.BaseAddressOffset */]);
                    }
                    else {
                        reportError(statement.currentFile, node, `struct ${struct.name} has not property ${node.arguments[1].text}`);
                        return node;
                    }
                }
                else {
                    reportError(statement.currentFile, node, 'offsetof invalid arguments');
                    return node;
                }
            }
            else {
                reportError(statement.currentFile, node, 'offsetof invalid arguments');
                return node;
            }
        }
        else if (callName === staticCast && !statement.lookupFunc(staticCast)) {
            const newNode = ts.visitNode(node.arguments[0], visitor);
            let sourceType = getBinaryBuiltinTypeName(node.arguments[0]);
            let targetType = node.typeArguments[0]
                && ((_e = (_d = statement.typeChecker.getTypeAtLocation(node.typeArguments[0])) === null || _d === void 0 ? void 0 : _d.aliasSymbol) === null || _e === void 0 ? void 0 : _e.escapedName) || '';
            if (!targetType && ts.isTypeReferenceNode(node.typeArguments[0]) && ts.isIdentifier(node.typeArguments[0].typeName)) {
                targetType = node.typeArguments[0].typeName.escapedText;
            }
            if (targetType === typePointer
                || targetType === typeSize) {
                targetType = statement.cheapCompilerOptions.defined.WASM_64 ? 'uint64' : 'uint32';
            }
            const argType = statement.typeChecker.getTypeAtLocation(node.arguments[0]);
            // uint 字面量直接不做转换
            if (array.has(BuiltinUint, sourceType)
                && (argType.flags & ts.TypeFlags.BigIntLiteral || argType.flags & ts.TypeFlags.NumberLiteral)
                && CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === CTypeEnum2Bytes[Type2CTypeEnum[sourceType]]) {
                sourceType = targetType;
            }
            if (array.has(BuiltinNumber, targetType)) {
                let exp = newNode;
                // float double -> int32
                // a >> 0
                if (array.has(BuiltinFloat, sourceType)) {
                    exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(statement.context.factory.createParenthesizedExpression(newNode), ts.SyntaxKind.GreaterThanGreaterThanToken, statement.context.factory.createNumericLiteral(0)));
                    sourceType = 'int32';
                }
                // uint64 int64, bigint -> int32 uint32, number
                // Number(a)
                else if (array.has(BuiltinBigInt, sourceType)) {
                    let bits = CTypeEnum2Bytes[Type2CTypeEnum[targetType]] * 8;
                    if (!array.has(BuiltinFloat, targetType)) {
                        if (array.has(BuiltinUint, targetType)) {
                            exp = statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier('BigInt'), statement.context.factory.createIdentifier('asUintN')), undefined, [
                                statement.context.factory.createNumericLiteral(bits),
                                newNode
                            ]);
                        }
                        else {
                            exp = statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier('BigInt'), statement.context.factory.createIdentifier('asIntN')), undefined, [
                                statement.context.factory.createNumericLiteral(bits),
                                newNode
                            ]);
                        }
                        exp = statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('Number'), undefined, [
                            exp
                        ]);
                    }
                    else {
                        exp = statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('Number'), undefined, [
                            newNode
                        ]);
                    }
                    sourceType = targetType;
                }
                // 8 bit
                // a & 0xff
                if (CTypeEnum2Bytes[Type2CTypeEnum[sourceType]] > 1
                    && CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 1) {
                    exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.AmpersandToken, statement.context.factory.createNumericLiteral('0xff', ts.TokenFlags.HexSpecifier)));
                    sourceType = 'uint8';
                }
                // 16 bit
                // a & 0xffff
                else if (CTypeEnum2Bytes[Type2CTypeEnum[sourceType]] > 2
                    && CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 2) {
                    exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.AmpersandToken, statement.context.factory.createNumericLiteral('0xffff', ts.TokenFlags.HexSpecifier)));
                    sourceType = 'uint16';
                }
                if (array.has(BuiltinUint, sourceType) && !array.has(BuiltinUint, targetType)) {
                    // uint -> int
                    // a >> 0
                    if (CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 1) {
                        exp = statement.context.factory.createConditionalExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.AmpersandToken, statement.context.factory.createNumericLiteral('0x80', ts.TokenFlags.HexSpecifier))), statement.context.factory.createToken(ts.SyntaxKind.QuestionToken), statement.context.factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(statement.context.factory.createNumericLiteral('0x100', ts.TokenFlags.HexSpecifier), ts.SyntaxKind.MinusToken, exp))), statement.context.factory.createToken(ts.SyntaxKind.ColonToken), exp);
                    }
                    else if (CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 2) {
                        exp = statement.context.factory.createConditionalExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.AmpersandToken, statement.context.factory.createNumericLiteral('0x80000', ts.TokenFlags.HexSpecifier))), statement.context.factory.createToken(ts.SyntaxKind.QuestionToken), statement.context.factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(statement.context.factory.createNumericLiteral('0x10000', ts.TokenFlags.HexSpecifier), ts.SyntaxKind.MinusToken, exp))), statement.context.factory.createToken(ts.SyntaxKind.ColonToken), exp);
                    }
                    else {
                        exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.GreaterThanGreaterThanToken, statement.context.factory.createNumericLiteral(0)));
                    }
                }
                else if (!array.has(BuiltinUint, sourceType) && !array.has(BuiltinBool, sourceType) && array.has(BuiltinUint, targetType)) {
                    // int -> uint
                    // a >>> 0
                    if (CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 1) {
                        exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.AmpersandToken, statement.context.factory.createNumericLiteral('0xff', ts.TokenFlags.HexSpecifier)));
                    }
                    else if (CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 2) {
                        exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.AmpersandToken, statement.context.factory.createNumericLiteral('0xffff', ts.TokenFlags.HexSpecifier)));
                    }
                    else {
                        exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, statement.context.factory.createNumericLiteral(0)));
                    }
                }
                if (array.has(BuiltinBool, sourceType)) {
                    if (exp.kind === ts.SyntaxKind.TrueKeyword) {
                        exp = statement.context.factory.createNumericLiteral(1);
                    }
                    else if (exp.kind === ts.SyntaxKind.FalseKeyword) {
                        exp = statement.context.factory.createNumericLiteral(0);
                    }
                    else {
                        exp = statement.context.factory.createConditionalExpression(statement.context.factory.createParenthesizedExpression(exp), statement.context.factory.createToken(ts.SyntaxKind.QuestionToken), statement.context.factory.createNumericLiteral(1), statement.context.factory.createToken(ts.SyntaxKind.ColonToken), statement.context.factory.createNumericLiteral(0));
                    }
                }
                if (ts.isBinaryExpression(exp) || ts.isConditionalExpression(exp)) {
                    exp = statement.context.factory.createParenthesizedExpression(exp);
                }
                return exp;
            }
            else if (array.has(BuiltinBigInt, targetType)) {
                let exp = newNode;
                const sourceBytes = CTypeEnum2Bytes[Type2CTypeEnum[sourceType]];
                // float double -> int32
                if (array.has(BuiltinFloat, sourceType)) {
                    exp = statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier('Math'), statement.context.factory.createIdentifier('floor')), undefined, [
                        exp
                    ]);
                    exp = statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('BigInt'), undefined, [
                        exp
                    ]);
                    sourceType = 'int64';
                }
                // int32 uint32 -> bigint
                if (array.has(BuiltinNumber, sourceType)) {
                    let isInt64 = false;
                    if (!array.has(BuiltinUint, sourceType)) {
                        if (array.has(BuiltinUint, targetType)) {
                            exp = statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, statement.context.factory.createNumericLiteral(0));
                        }
                        else {
                            exp = statement.context.factory.createBinaryExpression(exp, ts.SyntaxKind.GreaterThanGreaterThanToken, statement.context.factory.createNumericLiteral(0));
                            isInt64 = true;
                        }
                    }
                    exp = statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('BigInt'), undefined, [
                        exp
                    ]);
                    sourceType = isInt64 ? 'int64' : 'uint64';
                }
                if (array.has(BuiltinUint, sourceType) && !array.has(BuiltinUint, targetType) && sourceBytes === 8) {
                    // uint64 -> int64
                    exp = statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier('BigInt'), statement.context.factory.createIdentifier('asIntN')), undefined, [
                        statement.context.factory.createNumericLiteral(64),
                        exp
                    ]);
                }
                else if (!array.has(BuiltinUint, sourceType) && !array.has(BuiltinBool, sourceType) && array.has(BuiltinUint, targetType)) {
                    // int64 -> uint64
                    exp = statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.context.factory.createIdentifier('BigInt'), statement.context.factory.createIdentifier('asUintN')), undefined, [
                        statement.context.factory.createNumericLiteral(64),
                        exp
                    ]);
                }
                if (array.has(BuiltinBool, sourceType)) {
                    if (exp.kind === ts.SyntaxKind.TrueKeyword) {
                        exp = statement.context.factory.createBigIntLiteral('1n');
                    }
                    else if (exp.kind === ts.SyntaxKind.FalseKeyword) {
                        exp = statement.context.factory.createBigIntLiteral('0n');
                    }
                    else {
                        exp = statement.context.factory.createConditionalExpression(statement.context.factory.createParenthesizedExpression(exp), statement.context.factory.createToken(ts.SyntaxKind.QuestionToken), statement.context.factory.createBigIntLiteral('1n'), statement.context.factory.createToken(ts.SyntaxKind.ColonToken), statement.context.factory.createBigIntLiteral('0n'));
                    }
                }
                if (ts.isBinaryExpression(exp) || ts.isConditionalExpression(exp)) {
                    exp = statement.context.factory.createParenthesizedExpression(exp);
                }
                return exp;
            }
            else if (array.has(BuiltinFloat, targetType)) {
                let exp = newNode;
                if (array.has(BuiltinBigInt, sourceType)) {
                    exp = statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('Number'), undefined, [
                        exp
                    ]);
                }
                if (array.has(BuiltinBool, sourceType)) {
                    if (exp.kind === ts.SyntaxKind.TrueKeyword) {
                        exp = statement.context.factory.createNumericLiteral(1.0);
                    }
                    else if (exp.kind === ts.SyntaxKind.FalseKeyword) {
                        exp = statement.context.factory.createNumericLiteral(0.0);
                    }
                    else {
                        exp = statement.context.factory.createConditionalExpression(statement.context.factory.createParenthesizedExpression(exp), statement.context.factory.createToken(ts.SyntaxKind.QuestionToken), statement.context.factory.createNumericLiteral(1.0), statement.context.factory.createToken(ts.SyntaxKind.ColonToken), statement.context.factory.createNumericLiteral(0.0));
                    }
                }
                if (ts.isBinaryExpression(exp) || ts.isConditionalExpression(exp)) {
                    exp = statement.context.factory.createParenthesizedExpression(exp);
                }
                return exp;
            }
            else if (array.has(BuiltinBool, targetType)) {
                let exp = newNode;
                if (ts.isBinaryExpression(exp) || ts.isConditionalExpression(exp)) {
                    exp = statement.context.factory.createParenthesizedExpression(exp);
                }
                return statement.context.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, statement.context.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, exp));
            }
            return statement.context.factory.createParenthesizedExpression(newNode);
        }
        else if (callName === reinterpretCast && !statement.lookupFunc(reinterpretCast)) {
            if (statement.cheapCompilerOptions.defined.WASM_64) {
                let targetType = node.typeArguments[0]
                    && ((_g = (_f = statement.typeChecker.getTypeAtLocation(node.typeArguments[0])) === null || _f === void 0 ? void 0 : _f.aliasSymbol) === null || _g === void 0 ? void 0 : _g.escapedName) || '';
                // 转 size 和 pointer 64 位需要变成 bigint
                if (targetType === typeSize
                    || targetType === typePointer) {
                    const sourceType = getBinaryBuiltinTypeName(node.arguments[0]);
                    if (!array.has(BuiltinBigInt, sourceType)) {
                        return createPointerOperand(ts.visitNode(node.arguments[0], visitor));
                    }
                }
                // size 和 pointer 转 number
                const sourceType = statement.typeChecker.getTypeAtLocation(node.arguments[0]);
                if ((isSizeType(sourceType) || isPointerType(sourceType, node.arguments[0]))
                    && !array.has(BuiltinBigInt, targetType)
                    && targetType !== typePointer
                    && targetType !== typeSize) {
                    const result = ts.visitNode(node.arguments[0], visitor);
                    if (isBigIntNode(result)) {
                        return statement.context.factory.createNumericLiteral(Number(getBigIntValue(result)));
                    }
                    return statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('Number'), undefined, [
                        result
                    ]);
                }
            }
            return ts.visitNode(node.arguments[0], visitor);
        }
        else if (callName === defined
            && !statement.lookupFunc(defined)
            && node.arguments.length === 1 && ts.isIdentifier(node.arguments[0])) {
            const name = node.arguments[0].escapedText;
            return definedReplace(name, node);
        }
        else if (callName === move && !statement.lookupFunc(move)) {
            const { newArgument } = formatArgument(signature, node.arguments);
            return ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, newArgument), visitor);
        }
        else if (callName === malloc && !statement.lookupFunc(malloc)) {
            const { newArgument } = formatArgument(signature, node.arguments);
            return ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.addIdentifierImport(Allocator, InternalPath, false), statement.context.factory.createIdentifier(malloc)), undefined, newArgument), visitor);
        }
        else if (callName === calloc && !statement.lookupFunc(calloc)) {
            const { newArgument } = formatArgument(signature, node.arguments);
            return ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.addIdentifierImport(Allocator, InternalPath, false), statement.context.factory.createIdentifier(calloc)), undefined, newArgument), visitor);
        }
        else if (callName === realloc && !statement.lookupFunc(realloc)) {
            const { newArgument } = formatArgument(signature, node.arguments);
            return ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.addIdentifierImport(Allocator, InternalPath, false), statement.context.factory.createIdentifier(realloc)), undefined, newArgument), visitor);
        }
        else if (callName === alignedAlloc && !statement.lookupFunc(alignedAlloc)) {
            const { newArgument } = formatArgument(signature, node.arguments);
            return ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.addIdentifierImport(Allocator, InternalPath, false), statement.context.factory.createIdentifier('alignedAlloc')), undefined, newArgument), visitor);
        }
        else if (callName === free && !statement.lookupFunc(free)) {
            const { newArgument } = formatArgument(signature, node.arguments);
            return ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(statement.addIdentifierImport(Allocator, InternalPath, false), statement.context.factory.createIdentifier(free)), undefined, newArgument), visitor);
        }
        else if (callName === make && !statement.lookupFunc(make)) {
            if (node.arguments.length < 2) {
                if (!node.typeArguments
                    || node.typeArguments.length !== 1
                    || !ts.isTypeReferenceNode(node.typeArguments[0])
                    || !ts.isIdentifier(node.typeArguments[0].typeName)) {
                    reportError(statement.currentFile, node, 'invalid typeArguments', INVALID_OPERATE);
                    return node;
                }
                const type = statement.typeChecker.getTypeAtLocation(node.typeArguments[0].typeName);
                const isValid = type.symbol
                    && type.symbol.valueDeclaration
                    && ts.isClassDeclaration(type.symbol.valueDeclaration)
                    && hasStruct(type.symbol);
                if (!isValid) {
                    reportError(statement.currentFile, node, `invalid typeArguments, not found struct defined of ${node.typeArguments[0].typeName.escapedText}`, INVALID_OPERATE);
                    return node;
                }
            }
            const tree = ts.visitEachChild(node, statement.visitor, statement.context);
            return statement.context.factory.createCallExpression(statement.addIdentifierImport(make, RootPath, false), undefined, tree.arguments);
        }
        else if (callName === makeSharedPtr && !statement.lookupFunc(makeSharedPtr)) {
            if (node.arguments.length < 3) {
                if (!node.typeArguments
                    || node.typeArguments.length !== 1
                    || !ts.isTypeReferenceNode(node.typeArguments[0])
                    || !ts.isIdentifier(node.typeArguments[0].typeName)) {
                    reportError(statement.currentFile, node, 'invalid typeArguments', INVALID_OPERATE);
                    return node;
                }
                const type = statement.typeChecker.getTypeAtLocation(node.typeArguments[0].typeName);
                const isValid = type.symbol
                    && type.symbol.valueDeclaration
                    && ts.isClassDeclaration(type.symbol.valueDeclaration)
                    && hasStruct(type.symbol)
                    || isBuiltinType(type, null);
                if (!isValid) {
                    reportError(statement.currentFile, node, `invalid typeArguments, not found struct defined of ${node.typeArguments[0].typeName.escapedText} or ${node.typeArguments[0].typeName.escapedText} is not builtin type`, INVALID_OPERATE);
                    return node;
                }
            }
            const tree = ts.visitEachChild(node, statement.visitor, statement.context);
            return statement.context.factory.createCallExpression(statement.addIdentifierImport(makeSharedPtrImportName, InternalPath, false), undefined, tree.arguments);
        }
        else if (callName === unmake && !statement.lookupFunc(unmake)) {
            const tree = ts.visitEachChild(node, statement.visitor, statement.context);
            return statement.context.factory.createCallExpression(statement.addIdentifierImport(unmake, RootPath, false), undefined, tree.arguments);
        }
    }
    else if (ts.isPropertyAccessExpression(node.expression)) {
        if (callName === indexOf) {
            const type = statement.typeChecker.getTypeAtLocation(node.expression.expression);
            if (isPointerType(type, node.expression.expression) && node.arguments[0]) {
                let tree = ts.visitNode(node.expression.expression, visitor);
                if (isPointerStructType(type, node.expression.expression)) {
                    const struct = getPointerStructByType(type, node.expression.expression);
                    if (struct) {
                        let offset = null;
                        if (ts.isNumericLiteral(node.arguments[0])) {
                            if (+node.arguments[0].text) {
                                offset = createPointerOperand(+node.arguments[0].text * struct.length);
                            }
                        }
                        else {
                            offset = createPointerOperand(statement.context.factory.createBinaryExpression(ts.visitNode(node.arguments[0], visitor), ts.SyntaxKind.AsteriskToken, statement.context.factory.createNumericLiteral(struct.length)));
                        }
                        tree = offset ? statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, offset) : tree;
                        return accessStruct(tree, struct);
                    }
                }
                else if (isPointerBuiltinType(type, node.expression.expression)) {
                    const ctype = getPointerBuiltinByType(type, node.expression.expression);
                    const byteLength = CTypeEnum2Bytes[ctype];
                    if (byteLength) {
                        let offset = null;
                        if (ts.isNumericLiteral(node.arguments[0])) {
                            if (+node.arguments[0].text) {
                                offset = createPointerOperand(+node.arguments[0].text * byteLength);
                            }
                        }
                        else {
                            offset = createPointerOperand(statement.context.factory.createBinaryExpression(ts.visitNode(node.arguments[0], visitor), ts.SyntaxKind.AsteriskToken, statement.context.factory.createNumericLiteral(byteLength)));
                        }
                        tree = offset ? statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, offset) : tree;
                        return accessCType(tree, ctype);
                    }
                }
            }
        }
    }
    if (signature && node.arguments.length) {
        const { hasSizeParameter, newArgument } = formatArgument(signature, node.arguments);
        if (hasSizeParameter) {
            return ts.visitNode(statement.context.factory.createCallExpression(node.expression, node.typeArguments, [
                ...newArgument
            ]), visitor);
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function createPlusExpress(tree, right) {
    // 合并 a + 2 + 3
    if (ts.isBinaryExpression(tree)
        && tree.operatorToken.kind === ts.SyntaxKind.PlusToken
        && (ts.isNumericLiteral(tree.right) || isBigIntNode(tree.right)
            || ts.isNumericLiteral(tree.left) || isBigIntNode(tree.left))
        && (ts.isNumericLiteral(right) || isBigIntNode(right))) {
        if (ts.isNumericLiteral(tree.right)) {
            return statement.context.factory.createBinaryExpression(tree.left, ts.SyntaxKind.PlusToken, statement.context.factory.createNumericLiteral((+tree.right.text) + (+right.text)));
        }
        else if (isBigIntNode(tree.right)) {
            return statement.context.factory.createBinaryExpression(tree.left, ts.SyntaxKind.PlusToken, createBitInt(Number(getBigIntValue(tree.right)
                + getBigIntValue(right))));
        }
        else if (ts.isNumericLiteral(tree.left)) {
            return statement.context.factory.createBinaryExpression(statement.context.factory.createNumericLiteral((+tree.left.text) + (+right.text)), ts.SyntaxKind.PlusToken, tree.right);
        }
        else if (isBigIntNode(tree.left)) {
            return statement.context.factory.createBinaryExpression(createBitInt(Number(getBigIntValue(tree.left)
                + getBigIntValue(right))), ts.SyntaxKind.PlusToken, tree.right);
        }
    }
    return statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, createPointerOperand(right));
}
function handleMeta(node, tree, meta) {
    var _a;
    if (meta[1 /* KeyMetaKey.Pointer */]) {
        tree = statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), 20 /* CTypeEnum.pointer */), undefined, [
            meta[7 /* KeyMetaKey.BaseAddressOffset */]
                ? createPlusExpress(tree, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */]))
                : tree
        ]);
        return tree;
    }
    else if (is.number(meta[0 /* KeyMetaKey.Type */]) && !is.func(meta.getTypeMeta)) {
        tree = statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), meta[0 /* KeyMetaKey.Type */]), undefined, [
            meta[7 /* KeyMetaKey.BaseAddressOffset */]
                ? createPlusExpress(tree, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */]))
                : tree
        ]);
        if (meta[5 /* KeyMetaKey.BitField */] && !statement.lookupStage(StageStatus.AddressOf)) {
            const shift = CTypeEnum2Bytes[meta[0 /* KeyMetaKey.Type */]] * 8 - meta[8 /* KeyMetaKey.BaseBitOffset */] - meta[6 /* KeyMetaKey.BitFieldLength */];
            let isBigInt = array.has(BuiltinBigInt, CTypeEnum2Type[meta[0 /* KeyMetaKey.Type */]]);
            if (statement.cheapCompilerOptions.defined.WASM_64) {
                if (meta[0 /* KeyMetaKey.Type */] === 20 /* CTypeEnum.pointer */
                    || meta[0 /* KeyMetaKey.Type */] === 25 /* CTypeEnum.size */) {
                    isBigInt = true;
                }
            }
            const mask = Math.pow(2, meta[6 /* KeyMetaKey.BitFieldLength */]) - 1;
            tree = statement.context.factory.createBinaryExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, isBigInt
                ? createBitInt(shift)
                : statement.context.factory.createNumericLiteral(shift))), ts.SyntaxKind.AmpersandToken, isBigInt
                ? createBitInt(shift)
                : statement.context.factory.createNumericLiteral(mask));
        }
        return tree;
    }
    else if (is.func(meta.getTypeMeta)) {
        const targetStruct = meta.getTypeMeta();
        let targetSymbol = targetStruct.symbol.deref();
        let targetPath = '';
        if (targetStruct.structType === StructType.INLINE_OBJECT) {
            targetSymbol = targetStruct.definedClassParent.symbol.deref();
            targetPath = targetStruct.definedClassParent.inlineStructPathMap.get(targetStruct.symbol.deref());
        }
        const targetSource = (_a = targetSymbol.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getSourceFile();
        if (targetSource) {
            let key;
            if (targetSource !== statement.currentFile) {
                // addressof(pointer.struct) 不需要导入
                if (node.parent
                    && ts.isCallExpression(node.parent)
                    && ts.isIdentifier(node.parent.expression)
                    && node.parent.expression.escapedText === addressof
                    && !statement.lookupFunc(addressof)) {
                    key = statement.context.factory.createIdentifier('undefined');
                }
                else {
                    key = statement.addStructImport(targetSymbol, targetSource);
                }
            }
            else {
                key = statement.context.factory.createIdentifier(targetSymbol.escapedName);
            }
            const args = [
                meta[7 /* KeyMetaKey.BaseAddressOffset */]
                    ? createPlusExpress(tree, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */]))
                    : tree,
                key
            ];
            if (targetPath) {
                args.push(statement.context.factory.createStringLiteral(targetPath));
            }
            return statement.context.factory.createCallExpression(statement.addIdentifierImport(structAccess, RootPath, false), undefined, args);
        }
    }
    else {
        reportError(statement.currentFile, node, 'struct type mismatch');
        return node;
    }
}
function propertyAccessExpressionVisitor (node, visitor) {
    var _a, _b, _c, _d;
    if (isPointerNode(node)
        && !(array.has(smartPointerProperty, node.name.escapedText) && isSmartPointerNode(node.expression))) {
        if (((_a = statement.getCurrentStage()) === null || _a === void 0 ? void 0 : _a.stage) !== StageStatus.EqualLeft) {
            let root = getPropertyAccessExpressionRootNode(node);
            let tree = root;
            let next = root.parent;
            let lastIsIndexOf = false;
            let hasPointerIndex = isPointerNode(root);
            while (next !== node) {
                const type = statement.typeChecker.getTypeAtLocation(root);
                if (lastIsIndexOf
                    || isPointerType(type, root)
                    || isSmartPointerType(type)
                    || ((_b = type.aliasSymbol) === null || _b === void 0 ? void 0 : _b.escapedName) === typeArray) {
                    let struct = lastIsIndexOf
                        ? getStructByType(type)
                        : (isSmartPointerType(type)
                            ? getSmartPointerStructByType(type)
                            : (isPointerType(type, root)
                                ? getPointerStructByType(type, root)
                                : (isPointerType(type.aliasTypeArguments[0], null)
                                    ? null
                                    : getStructByType(type.aliasTypeArguments[0]))));
                    if (struct) {
                        if (ts.isPropertyAccessExpression(next)) {
                            if (ts.isCallExpression(next.parent)) {
                                next = next.parent;
                                continue;
                            }
                            else {
                                const meta = getStructMeta(struct, next.name.escapedText);
                                if (!meta) {
                                    reportError(statement.currentFile, node, `struct ${struct.symbol.deref().escapedName} not has property ${next.name.escapedText}`);
                                    return node;
                                }
                                if (isSmartPointerType(type)) {
                                    tree = statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(tree, statement.context.factory.createIdentifier('get')), undefined, []);
                                }
                                if (meta[1 /* KeyMetaKey.Pointer */] && !meta[3 /* KeyMetaKey.Array */]) {
                                    tree = statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), 20 /* CTypeEnum.pointer */), undefined, [
                                        meta[7 /* KeyMetaKey.BaseAddressOffset */]
                                            ? createPlusExpress(tree, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */]))
                                            : tree
                                    ]);
                                }
                                else if (meta[7 /* KeyMetaKey.BaseAddressOffset */]) {
                                    tree = createPlusExpress(tree, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */]));
                                }
                            }
                            lastIsIndexOf = false;
                        }
                        else if (ts.isCallExpression(next)) {
                            if (ts.isNumericLiteral(next.arguments[0]) && +next.arguments[0].text !== 0) {
                                tree = createPlusExpress(tree, createPointerOperand(+next.arguments[0].text * struct.length));
                            }
                            else if (!ts.isNumericLiteral(next.arguments[0])) {
                                tree = statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, createPointerOperand(statement.context.factory.createBinaryExpression(next.arguments[0], ts.SyntaxKind.AsteriskToken, statement.context.factory.createNumericLiteral(struct.length))));
                            }
                            lastIsIndexOf = true;
                            hasPointerIndex = true;
                        }
                        else if (ts.isElementAccessExpression(next)) {
                            if (ts.isNumericLiteral(next.argumentExpression) && +next.argumentExpression.text !== 0) {
                                tree = createPlusExpress(tree, createPointerOperand(+next.argumentExpression.text * struct.length));
                            }
                            else if (!ts.isNumericLiteral(next.argumentExpression)) {
                                tree = statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, createPointerOperand(statement.context.factory.createBinaryExpression(next.argumentExpression, ts.SyntaxKind.AsteriskToken, statement.context.factory.createNumericLiteral(struct.length))));
                            }
                            lastIsIndexOf = true;
                            hasPointerIndex = true;
                        }
                    }
                    // [] 操作
                    else if ((((_c = type.aliasSymbol) === null || _c === void 0 ? void 0 : _c.escapedName) === typeArray || isPointerType(type, root))
                        && isPointerType(type.aliasTypeArguments[0], null)
                        && ts.isElementAccessExpression(next)) {
                        if (ts.isNumericLiteral(next.argumentExpression) && +next.argumentExpression.text !== 0) {
                            tree = createPlusExpress(tree, createPointerOperand(+next.argumentExpression.text * CTypeEnum2Bytes[20 /* CTypeEnum.pointer */]));
                        }
                        else if (!ts.isNumericLiteral(next.argumentExpression)) {
                            tree = statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, createPointerOperand(statement.context.factory.createBinaryExpression(next.argumentExpression, ts.SyntaxKind.AsteriskToken, statement.context.factory.createNumericLiteral(CTypeEnum2Bytes[20 /* CTypeEnum.pointer */]))));
                        }
                        tree = statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), 20 /* CTypeEnum.pointer */), undefined, [
                            tree
                        ]);
                        hasPointerIndex = true;
                    }
                    // 指针的 indexOf
                    else if (isPointerType(type, root)
                        && ts.isPropertyAccessExpression(next) && next.name.escapedText === indexOf
                        && ts.isCallExpression(next.parent)) {
                        next = next.parent;
                        let step = 0;
                        if (isPointerType(type.aliasTypeArguments[0], null)) {
                            step = CTypeEnum2Bytes[20 /* CTypeEnum.pointer */];
                        }
                        else {
                            const struct = getStructByType(type.aliasTypeArguments[0]);
                            if (struct) {
                                step = struct.length;
                            }
                            else {
                                reportError(statement.currentFile, node, 'the pointer type only allowed in builtin type or struct type');
                                return node;
                            }
                        }
                        if (ts.isNumericLiteral(next.arguments[0]) && +next.arguments[0].text !== 0) {
                            tree = createPlusExpress(tree, createPointerOperand(+next.arguments[0].text * step));
                        }
                        else if (!ts.isNumericLiteral(next.arguments[0])) {
                            tree = statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, createPointerOperand(statement.context.factory.createBinaryExpression(next.arguments[0], ts.SyntaxKind.AsteriskToken, statement.context.factory.createNumericLiteral(step))));
                        }
                        // 二级指针
                        if (isPointerType(type.aliasTypeArguments[0], null)) {
                            tree = statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), 20 /* CTypeEnum.pointer */), undefined, [
                                tree
                            ]);
                        }
                        lastIsIndexOf = true;
                        hasPointerIndex = true;
                    }
                    else {
                        reportError(statement.currentFile, node, 'invalid pointer operate');
                        return node;
                    }
                }
                else {
                    let struct = getStructByType(type);
                    // pointer.struct.xx
                    if (struct && hasPointerIndex && ts.isPropertyAccessExpression(next)) {
                        const meta = getStructMeta(struct, next.name.escapedText);
                        if (!meta) {
                            reportError(statement.currentFile, node, `struct ${struct.symbol.deref().escapedName} not has property ${next.name.escapedText}`);
                            return node;
                        }
                        if (meta[1 /* KeyMetaKey.Pointer */] && !meta[3 /* KeyMetaKey.Array */]) {
                            tree = statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), 20 /* CTypeEnum.pointer */), undefined, [
                                meta[7 /* KeyMetaKey.BaseAddressOffset */]
                                    ? createPlusExpress(tree, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */]))
                                    : tree
                            ]);
                        }
                        else if (meta[7 /* KeyMetaKey.BaseAddressOffset */]) {
                            tree = createPlusExpress(tree, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */]));
                        }
                        lastIsIndexOf = false;
                    }
                    else {
                        tree = next;
                    }
                }
                root = next;
                next = next.parent;
            }
            if (!isPointerNode(root) && !hasPointerIndex) {
                return node;
            }
            const type = statement.typeChecker.getTypeAtLocation(root);
            let struct = isPointerType(type, root) ? getPointerStructByType(type, root) : getStructByType(type);
            if (!struct) {
                reportError(statement.currentFile, node, 'struct type mismatch');
                return node;
            }
            const meta = getStructMeta(struct, node.name.escapedText);
            if (!meta) {
                reportError(statement.currentFile, node, `struct ${struct.symbol.deref().escapedName} not has property ${node.name.escapedText}`);
                return node;
            }
            statement.pushStage(StageStatus.PointerPlusMinusIgnore);
            tree = ts.visitNode(tree, visitor);
            statement.popStage();
            if (ts.isCallExpression(tree)
                && ts.isIdentifier(tree.expression)
                && statement.isIdentifier(tree.expression, structAccess, structAccessPath, RootPath)) {
                return statement.context.factory.createPropertyAccessExpression(tree, node.name);
            }
            return handleMeta(node, tree, meta);
        }
    }
    else if (isSmartPointerNode(node)) {
        const expressionType = statement.typeChecker.getTypeAtLocation(node.expression);
        if (isSmartPointerType(expressionType)
            && ts.isIdentifier(node.name)
            && !array.has(smartPointerProperty, node.name.escapedText)
            && ((_d = expressionType.aliasTypeArguments) === null || _d === void 0 ? void 0 : _d.length) === 1) {
            const struct = getStructByType(expressionType);
            if (!struct) {
                reportError(statement.currentFile, node, 'struct type mismatch');
                return node;
            }
            const meta = getStructMeta(struct, node.name.escapedText);
            if (!meta) {
                reportError(statement.currentFile, node, `struct ${struct.symbol.deref().escapedName} not has property ${node.name.escapedText}`);
                return node;
            }
            let tree = ts.visitNode(node.expression, visitor);
            tree = statement.context.factory.createCallExpression(statement.context.factory.createPropertyAccessExpression(tree, statement.context.factory.createIdentifier('get')), undefined, []);
            return handleMeta(node, tree, meta);
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function isMergeOperator(operator) {
    return operator === ts.SyntaxKind.PlusEqualsToken
        || operator === ts.SyntaxKind.MinusEqualsToken
        || operator === ts.SyntaxKind.AsteriskEqualsToken
        || operator === ts.SyntaxKind.AsteriskAsteriskEqualsToken
        || operator === ts.SyntaxKind.SlashEqualsToken
        || operator === ts.SyntaxKind.PercentEqualsToken
        || operator === ts.SyntaxKind.LessThanLessThanEqualsToken
        || operator === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken
        || operator === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken
        || operator === ts.SyntaxKind.AmpersandEqualsToken
        || operator === ts.SyntaxKind.BarEqualsToken
        || operator === ts.SyntaxKind.CaretEqualsToken;
}

function mergeOperator2Operator(operator) {
    switch (operator) {
        case ts.SyntaxKind.PlusEqualsToken:
            return ts.SyntaxKind.PlusToken;
        case ts.SyntaxKind.MinusEqualsToken:
            return ts.SyntaxKind.MinusToken;
        case ts.SyntaxKind.AsteriskEqualsToken:
            return ts.SyntaxKind.AsteriskToken;
        case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
            return ts.SyntaxKind.AsteriskAsteriskToken;
        case ts.SyntaxKind.SlashEqualsToken:
            return ts.SyntaxKind.SlashToken;
        case ts.SyntaxKind.PercentEqualsToken:
            return ts.SyntaxKind.PercentToken;
        case ts.SyntaxKind.LessThanLessThanEqualsToken:
            return ts.SyntaxKind.LessThanLessThanToken;
        case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
            return ts.SyntaxKind.GreaterThanGreaterThanToken;
        case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
            return ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken;
        case ts.SyntaxKind.AmpersandEqualsToken:
            return ts.SyntaxKind.AmpersandToken;
        case ts.SyntaxKind.BarEqualsToken:
            return ts.SyntaxKind.BarToken;
        case ts.SyntaxKind.CaretEqualsToken:
            return ts.SyntaxKind.CaretToken;
        default:
            return ts.SyntaxKind.EqualsToken;
    }
}

function compute(a, b, token) {
    if (token === ts.SyntaxKind.PlusToken) {
        return (a + b);
    }
    else if (token === ts.SyntaxKind.MinusToken) {
        return (a - b);
    }
    else if (token === ts.SyntaxKind.AsteriskToken) {
        return (a * b);
    }
    else if (token === ts.SyntaxKind.AsteriskAsteriskToken) {
        return (Math.pow(a, b));
    }
    else if (token === ts.SyntaxKind.SlashToken) {
        return (a / b);
    }
    else if (token === ts.SyntaxKind.PercentToken) {
        return (a % b);
    }
    else if (token === ts.SyntaxKind.LessThanLessThanToken) {
        return (a << b);
    }
    else if (token === ts.SyntaxKind.GreaterThanGreaterThanToken) {
        return (a >> b);
    }
    else if (token === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken) {
        return (a >>> b);
    }
    else if (token === ts.SyntaxKind.AmpersandToken) {
        return (a & b);
    }
    else if (token === ts.SyntaxKind.BarToken) {
        return (a | b);
    }
}

function visitorLeft(node, visitor, operatorToken) {
    let push = false;
    if (operatorToken === ts.SyntaxKind.EqualsToken) {
        statement.pushStage(StageStatus.EqualLeft);
        push = true;
    }
    const newNode = ts.visitNode(node, visitor);
    if (push) {
        statement.popStage();
    }
    return newNode;
}
function visitorRight(node, visitor, operatorToken) {
    let push = false;
    if (operatorToken === ts.SyntaxKind.EqualsToken) {
        statement.pushStage(StageStatus.EqualRight);
        push = true;
    }
    const newNode = ts.visitNode(node, visitor);
    if (push) {
        statement.popStage();
    }
    return newNode;
}
function generateWritePropertyNode(address, value, meta) {
    if (meta[5 /* KeyMetaKey.BitField */]) {
        let mask1 = 0;
        let len = CTypeEnum2Bytes[meta[0 /* KeyMetaKey.Type */]] * 8;
        for (let i = 0; i < meta[6 /* KeyMetaKey.BitFieldLength */]; i++) {
            mask1 |= (1 << (len - 1 - (i + meta[8 /* KeyMetaKey.BaseBitOffset */])));
        }
        let oldValue = statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), meta[0 /* KeyMetaKey.Type */]), undefined, [
            address
        ]);
        const mask2 = (Math.pow(2, meta[6 /* KeyMetaKey.BitFieldLength */]) - 1);
        const shift = len - meta[8 /* KeyMetaKey.BaseBitOffset */] - meta[6 /* KeyMetaKey.BitFieldLength */];
        let isBigInt = array.has(BuiltinBigInt, CTypeEnum2Type[meta[0 /* KeyMetaKey.Type */]]);
        if (statement.cheapCompilerOptions.defined.WASM_64) {
            if (meta[0 /* KeyMetaKey.Type */] === 20 /* CTypeEnum.pointer */
                || meta[0 /* KeyMetaKey.Type */] === 25 /* CTypeEnum.size */) {
                isBigInt = true;
                if (meta[0 /* KeyMetaKey.Type */] === 25 /* CTypeEnum.size */) {
                    value = createPointerOperand(value);
                }
            }
        }
        value = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(value, ts.SyntaxKind.AmpersandToken, isBigInt
            ? createBitInt(mask2)
            : statement.context.factory.createNumericLiteral(mask2)));
        value = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(value, ts.SyntaxKind.LessThanLessThanToken, isBigInt
            ? createBitInt(shift)
            : statement.context.factory.createNumericLiteral(shift)));
        oldValue = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(oldValue, ts.SyntaxKind.AmpersandToken, statement.context.factory.createPrefixUnaryExpression(ts.SyntaxKind.TildeToken, isBigInt
            ? createBitInt(mask1)
            : statement.context.factory.createNumericLiteral(mask1))));
        value = statement.context.factory.createBinaryExpression(oldValue, ts.SyntaxKind.BarToken, value);
    }
    return statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumWrite), meta[1 /* KeyMetaKey.Pointer */] ? 20 /* CTypeEnum.pointer */ : meta[0 /* KeyMetaKey.Type */]), undefined, [
        address,
        value
    ]);
}
function singleArrowVisitor(node, visitor) {
    if (ts.isPrefixUnaryExpression(node.right)) {
        if (node.parent && ts.isExpressionStatement(node.parent) && ((ts.isCallExpression(node.left)
            && (ts.isIdentifier(node.left.expression) && node.left.expression.escapedText === accessof
                || ts.isPropertyAccessExpression(node.left.expression)
                    && node.left.expression.name.escapedText === indexOf
                    && isPointerNode(node.left.expression.expression)))
            || ts.isElementAccessExpression(node.left) && isPointerElementAccess(node.left))) {
            const type1 = statement.typeChecker.getTypeAtLocation(node.left);
            const type2 = statement.typeChecker.getTypeAtLocation(node.right.operand);
            if (isTypeEquals(type1, node.left, type2, node.right.operand) || isPointerType(type1, node.left) && isNullPointer(type2, node.right.operand)) {
                let left = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
                    node.left
                ]), visitor);
                if (isStructType(type1)) {
                    const struct = getStructByType(type1);
                    statement.pushStage(StageStatus.SingleArrowRight);
                    const right = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
                        node.right.operand
                    ]), visitor);
                    statement.popStage();
                    return statement.context.factory.createCallExpression(statement.addMemoryImport(memcpy), undefined, [
                        left,
                        right,
                        createPointerOperand(struct.length)
                    ]);
                }
                else if (isBuiltinType(type1, node.left)) {
                    const type = getBuiltinByType(type1, node.left);
                    statement.pushStage(StageStatus.SingleArrowRight);
                    const right = ts.visitNode(node.right.operand, visitor);
                    statement.popStage();
                    return statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumWrite), type), undefined, [
                        left,
                        right
                    ]);
                }
                else {
                    reportError(statement.currentFile, node, 'operator \'<-\' only allowed between two builtin type or struct type');
                    return node;
                }
            }
            else {
                reportError(statement.currentFile, node, 'The types on the left and right sides of the operator \'<-\' are not equal');
                return node;
            }
        }
        else {
            const type1 = statement.typeChecker.getTypeAtLocation(node.left);
            const type2 = statement.typeChecker.getTypeAtLocation(node.right.operand);
            if (isStructType(type1) && isTypeEquals(type1, node.left, type2, node.right.operand)) {
                const struct = getStructByType(type1);
                statement.pushStage(StageStatus.SingleArrowRight);
                const right = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
                    node.right.operand
                ]), visitor);
                statement.popStage();
                const left = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
                    node.left
                ]), visitor);
                return statement.context.factory.createCallExpression(statement.addMemoryImport(memcpy), undefined, [
                    left,
                    right,
                    createPointerOperand(struct.length)
                ]);
            }
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}
function equalVisitor(node, visitor) {
    var _a, _b, _c, _d, _e, _f, _g;
    const leftType = statement.typeChecker.getTypeAtLocation(node.left);
    const rightType = statement.typeChecker.getTypeAtLocation(node.right);
    if (isPointerType(leftType, node.left)
        && (isBuiltinType(rightType, node.right) || rightType.flags & ts.TypeFlags.NumberLike)
        && !isPointerType(rightType, node.right)
        && !isNullPointer(rightType, node.right)
        || isBuiltinType(leftType, node.left)
            && !isPointerType(leftType, node.left)
            && !isNullPointer(leftType, node.left)
            && isPointerType(rightType, node.right)) {
        reportError(statement.currentFile, node, `type ${getBuiltinNameByType(leftType) || 'number'} is not assignable to value of type ${getBuiltinNameByType(rightType) || 'number'}`, TYPE_MISMATCH);
        return node;
    }
    if (ts.isIdentifier(node.left) && ts.isIdentifier(node.right)) {
        return ts.visitEachChild(node, visitor, statement.context);
    }
    else {
        if (ts.isPropertyAccessExpression(node.left)
            && isExpressionPointer(node.left)
            && ts.isObjectLiteralExpression(node.right)
            && isStructType(statement.typeChecker.getTypeAtLocation(node.left))) {
            const list = [];
            const addr = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
                node.left
            ]), visitor);
            function each(base, struct, properties) {
                properties.forEach((ele) => {
                    if (ts.isPropertyAssignment(ele) && ts.isIdentifier(ele.name)) {
                        if (!struct) {
                            reportError(statement.currentFile, ele, 'struct not found ');
                            return;
                        }
                        const meta = getStructMeta(struct, ele.name.escapedText);
                        if (ts.isObjectLiteralExpression(ele.initializer) && meta.getTypeMeta) {
                            each(base + meta[7 /* KeyMetaKey.BaseAddressOffset */], meta.getTypeMeta(), ele.initializer.properties);
                        }
                        else if (is.number(meta[0 /* KeyMetaKey.Type */])) {
                            list.push(generateWritePropertyNode((ts.isBinaryExpression(addr)
                                && ts.isNumericLiteral(addr.right)
                                && addr.operatorToken.kind === ts.SyntaxKind.PlusToken)
                                ? statement.context.factory.createBinaryExpression(addr.left, ts.SyntaxKind.PlusToken, createPointerOperand((meta[7 /* KeyMetaKey.BaseAddressOffset */] + base) + (+addr.right.text)))
                                : statement.context.factory.createBinaryExpression(addr, ts.SyntaxKind.PlusToken, createPointerOperand(meta[7 /* KeyMetaKey.BaseAddressOffset */] + base)), ele.initializer, meta));
                        }
                        else {
                            reportError(statement.currentFile, ele, 'struct found invalid property value');
                        }
                    }
                    else {
                        reportError(statement.currentFile, ele, 'struct found invalid property');
                    }
                });
            }
            each(0, getStructByType(statement.typeChecker.getTypeAtLocation(node.left)), node.right.properties);
            if (list.length === 0) {
                return undefined;
            }
            if (list.length === 1) {
                return list[0];
            }
            else {
                let left = list[0];
                for (let i = 1; i < list.length; i++) {
                    left = statement.context.factory.createBinaryExpression(left, ts.SyntaxKind.CommaToken, list[i]);
                }
                return left;
            }
        }
        if (ts.isPropertyAccessExpression(node.left)
            || ts.isElementAccessExpression(node.left)) {
            const hasPointer = isExpressionPointer(node.left.expression);
            const hasSmartPointer = ts.isPropertyAccessExpression(node.left) && isSmartPointerNode(node.left.expression);
            if (hasPointer || hasSmartPointer) {
                const type1 = statement.typeChecker.getTypeAtLocation(node.left);
                const type2 = statement.typeChecker.getTypeAtLocation(node.right);
                statement.pushStage(StageStatus.AddressOf);
                const address = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
                    node.left
                ]), visitor);
                statement.popStage();
                if (isStructType(type1) && isTypeEquals(type1, node.left, type2, node.right)
                    || type1.aliasSymbol && (type1.aliasSymbol.escapedName === typeStruct
                        || (type1.aliasSymbol.escapedName === typeUnion))
                        && type1.aliasTypeArguments
                        && type2.aliasTypeArguments
                        && hasStruct(type1.aliasTypeArguments[0].symbol)
                        && isTypeEquals(type1.aliasTypeArguments[0], null, type2.aliasTypeArguments[0], null)) {
                    const struct = getStructByType(type1);
                    const valueAddress = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
                        node.right
                    ]), visitor);
                    return statement.context.factory.createCallExpression(statement.addMemoryImport(memcpy), undefined, [
                        address,
                        valueAddress,
                        createPointerOperand(struct.length)
                    ]);
                }
                else if (isBuiltinType(type1, node.left)
                    || (type1.aliasSymbol
                        && type1.aliasSymbol.escapedName === typeBit)
                    || (((_a = type1.symbol) === null || _a === void 0 ? void 0 : _a.valueDeclaration)
                        && (ts.isEnumDeclaration(type1.symbol.valueDeclaration)
                            || ts.isEnumMember(type1.symbol.valueDeclaration)))
                    || (type1.isUnion() && ((_c = (_b = type1.types[0]) === null || _b === void 0 ? void 0 : _b.symbol) === null || _c === void 0 ? void 0 : _c.valueDeclaration)
                        && (ts.isEnumDeclaration((_e = (_d = type1.types[0]) === null || _d === void 0 ? void 0 : _d.symbol) === null || _e === void 0 ? void 0 : _e.valueDeclaration)
                            || ts.isEnumMember((_g = (_f = type1.types[0]) === null || _f === void 0 ? void 0 : _f.symbol) === null || _g === void 0 ? void 0 : _g.valueDeclaration)))) {
                    let newValue = visitorRight(node.right, visitor, node.operatorToken.kind);
                    if (isSizeType(type1)) {
                        newValue = createPointerOperand(newValue);
                    }
                    if (ts.isPropertyAccessExpression(node.left)) {
                        const type = statement.typeChecker.getTypeAtLocation(node.left.expression);
                        const struct = getStructByType(type);
                        if (struct == null) {
                            reportError(statement.currentFile, node, `${node.left.expression.getText()} is not struct`);
                            return node;
                        }
                        const meta = getStructMeta(struct, node.left.name.escapedText);
                        if (!meta) {
                            reportError(statement.currentFile, node, `struct ${struct.symbol.deref().escapedName} not has property ${node.left.name.escapedText}`);
                            return node;
                        }
                        return generateWritePropertyNode(address, newValue, meta);
                    }
                    else if (ts.isElementAccessExpression(node.left)) {
                        if (isBuiltinType(type1, node.left)) {
                            return statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumWrite), getBuiltinByType(type1, node.left)), undefined, [
                                address,
                                newValue
                            ]);
                        }
                    }
                }
            }
        }
        if (isSizeType(leftType)
            && !isAllSizeOrPointer(node.right)) {
            if (ts.isNumericLiteral(node.right)) {
                return statement.context.factory.createBinaryExpression(ts.visitNode(node.left, statement.visitor), node.operatorToken, createPointerOperand(ts.visitNode(node.right, statement.visitor)));
            }
            reportError(statement.currentFile, node, `type ${getBuiltinNameByType(leftType) || 'number'} is not assignable to value of type ${getBuiltinNameByType(rightType) || 'number'}`, TYPE_MISMATCH);
            return node;
        }
        return statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), ts.SyntaxKind.EqualsToken, visitorRight(node.right, visitor, node.operatorToken.kind));
    }
}
function isAllSizeOrPointer(node) {
    if (ts.isBinaryExpression(node)) {
        if (!isAllSizeOrPointer(node.left)) {
            return false;
        }
        return isAllSizeOrPointer(node.right);
    }
    else if (ts.isParenthesizedExpression(node)) {
        return isAllSizeOrPointer(node.expression);
    }
    const type = statement.typeChecker.getTypeAtLocation(node);
    if (isSizeType(type) || isPointerType(type, node)) {
        return true;
    }
    return false;
}
function hasSizeNode(node) {
    if (ts.isBinaryExpression(node)) {
        if (hasSizeNode(node.left)) {
            return true;
        }
        return hasSizeNode(node.right);
    }
    else if (ts.isParenthesizedExpression(node)) {
        return hasSizeNode(node.expression);
    }
    const type = statement.typeChecker.getTypeAtLocation(node);
    if (isSizeType(type)) {
        return true;
    }
    return false;
}
function handle(node, visitor) {
    var _a;
    /**
     * 将多个等号变成逗号运算符
     */
    if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken
        && ts.isBinaryExpression(node.right)
        && node.right.operatorToken.kind === ts.SyntaxKind.EqualsToken
        && (isPointerNode(node.right)
            || isPointerNode(node.left))) {
        const right = getEqualsBinaryExpressionRight(node);
        let tree = statement.context.factory.createBinaryExpression(node.left, ts.SyntaxKind.EqualsToken, right);
        let next = node.right;
        while (next && ts.isBinaryExpression(next) && next.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            tree = statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.CommaToken, statement.context.factory.createBinaryExpression(next.left, ts.SyntaxKind.EqualsToken, right));
            next = next.right;
        }
        return ts.visitEachChild(tree, visitor, statement.context);
    }
    // 指针复合运算
    else if (isPointerNode(node.left) && isMergeOperator(node.operatorToken.kind)) {
        return ts.visitNode(statement.context.factory.createBinaryExpression(node.left, ts.SyntaxKind.EqualsToken, statement.context.factory.createBinaryExpression(node.left, mergeOperator2Operator(node.operatorToken.kind), node.right)), visitor);
    }
    // 赋值运算
    else if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        return equalVisitor(node, visitor);
    }
    // 单箭头运算
    else if (node.operatorToken.kind === ts.SyntaxKind.LessThanToken
        && ts.isPrefixUnaryExpression(node.right)
        && node.right.operator === ts.SyntaxKind.MinusToken) {
        return singleArrowVisitor(node, visitor);
    }
    // size 运算
    else if ((hasSizeNode(node.right) || hasSizeNode(node.left))
        && node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken
        && node.operatorToken.kind !== ts.SyntaxKind.BarBarToken
        && node.operatorToken.kind !== ts.SyntaxKind.GreaterThanToken
        && node.operatorToken.kind !== ts.SyntaxKind.GreaterThanEqualsToken
        && node.operatorToken.kind !== ts.SyntaxKind.LessThanToken
        && node.operatorToken.kind !== ts.SyntaxKind.LessThanEqualsToken) {
        if (hasSizeNode(node.left) && !isAllSizeOrPointer(node.right)) {
            if (ts.isNumericLiteral(node.right) && (!node.parent || !ts.isBinaryExpression(node.parent))) {
                return statement.context.factory.createBinaryExpression(ts.visitNode(node.left, statement.visitor), node.operatorToken.kind === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken
                    ? ts.SyntaxKind.GreaterThanGreaterThanToken
                    : node.operatorToken.kind, createPointerOperand(node.right));
            }
            reportError(statement.currentFile, node, 'size type in binary expression must convert to other base type');
            return node;
        }
        if (!isAllSizeOrPointer(node.left) && hasSizeNode(node.right)) {
            if (ts.isNumericLiteral(node.left) && (!node.parent || !ts.isBinaryExpression(node.parent))) {
                return statement.context.factory.createBinaryExpression(createPointerOperand(node.left), node.operatorToken, ts.visitNode(node.right, statement.visitor));
            }
            reportError(statement.currentFile, node, 'size type in binary expression must convert to other base type');
            return node;
        }
    }
    // 指针加减运算
    else if ((node.operatorToken.kind === ts.SyntaxKind.PlusToken
        || node.operatorToken.kind === ts.SyntaxKind.MinusToken)
        && !statement.lookupStage(StageStatus.PointerPlusMinusIgnore)) {
        const type1 = getTypeAtLocation(node.left);
        const type2 = getTypeAtLocation(node.right);
        if (isPointerType(type1, node.left)
            && (ts.isNumericLiteral(node.right)
                || type2.flags & ts.TypeFlags.NumberLike
                || array.has(BuiltinNumber, getBuiltinNameByType(type2)))) {
            let step = 1;
            if (isPointerStructType(type1, node.left)) {
                const struct = getPointerStructByType(type1, node.left);
                step = struct.length;
            }
            else if (isPointerBuiltinType(type1, node.left)) {
                step = CTypeEnum2Bytes[getPointerBuiltinByType(type1, node.left)];
            }
            if (step > 1) {
                const right = visitorRight(node.right, visitor, node.operatorToken.kind);
                return statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), node.operatorToken.kind, ts.isNumericLiteral(right)
                    ? createPointerOperand(+right.text * step)
                    : statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(createPointerOperand(right), ts.SyntaxKind.AsteriskToken, createPointerOperand(step))));
            }
            else if (statement.cheapCompilerOptions.defined.WASM_64) {
                const right = visitorRight(node.right, visitor, node.operatorToken.kind);
                return statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), node.operatorToken.kind, createPointerOperand(right));
            }
        }
        else if (isPointerType(type2, node.right)
            && (ts.isNumericLiteral(node.left)
                || type1.flags & ts.TypeFlags.NumberLike
                || array.has(BuiltinNumber, (_a = type1.aliasSymbol) === null || _a === void 0 ? void 0 : _a.escapedName))) {
            let step = 1;
            if (isPointerBuiltinType(type2, node.right)) {
                step = CTypeEnum2Bytes[getPointerBuiltinByType(type2, node.right)];
            }
            else if (isPointerStructType(type2, node.right)) {
                const struct = getPointerStructByType(type2, node.right);
                step = struct.length;
            }
            if (step > 1) {
                const left = visitorRight(node.left, visitor, node.operatorToken.kind);
                return statement.context.factory.createBinaryExpression(ts.isNumericLiteral(left)
                    ? createPointerOperand(+left.text * step)
                    : statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(createPointerOperand(left), ts.SyntaxKind.AsteriskToken, createPointerOperand(step))), node.operatorToken.kind, visitorLeft(node.right, visitor, node.operatorToken.kind));
            }
            else if (statement.cheapCompilerOptions.defined.WASM_64) {
                const left = visitorRight(node.left, visitor, node.operatorToken.kind);
                return statement.context.factory.createBinaryExpression(createPointerOperand(left), node.operatorToken.kind, visitorLeft(node.right, visitor, node.operatorToken.kind));
            }
        }
        else if (isPointerType(type1, node.left) && isPointerType(type2, node.right)) {
            if (node.operatorToken.kind === ts.SyntaxKind.MinusToken && isTypeEquals(type1, node.left, type2, node.right)) {
                let step = 1;
                if (isPointerBuiltinType(type1, node.left)) {
                    step = CTypeEnum2Bytes[getPointerBuiltinByType(type1, node.left)];
                }
                else if (isPointerStructType(type1, node.left)) {
                    const struct = getPointerStructByType(type1, node.left);
                    step = struct.length;
                }
                if (step > 1) {
                    if (step & (step - 1)) {
                        if (statement.cheapCompilerOptions.defined.WASM_64) {
                            return statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('Number'), undefined, [
                                statement.context.factory.createBinaryExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), node.operatorToken.kind, visitorRight(node.right, visitor, node.operatorToken.kind))), ts.SyntaxKind.SlashToken, createBitInt(step))
                            ]);
                        }
                        else {
                            return statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), node.operatorToken.kind, visitorRight(node.right, visitor, node.operatorToken.kind))), ts.SyntaxKind.SlashToken, statement.context.factory.createNumericLiteral(step)));
                        }
                    }
                    else {
                        let exponent = 0;
                        while (step > 1) {
                            exponent++;
                            step >>>= 1;
                        }
                        if (statement.cheapCompilerOptions.defined.WASM_64) {
                            return statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('Number'), undefined, [
                                statement.context.factory.createBinaryExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), node.operatorToken.kind, visitorRight(node.right, visitor, node.operatorToken.kind))), ts.SyntaxKind.GreaterThanGreaterThanToken, createBitInt(exponent))
                            ]);
                        }
                        return statement.context.factory.createBinaryExpression(statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), node.operatorToken.kind, visitorRight(node.right, visitor, node.operatorToken.kind))), ts.SyntaxKind.GreaterThanGreaterThanToken, statement.context.factory.createNumericLiteral(exponent));
                    }
                }
                else if (statement.cheapCompilerOptions.defined.WASM_64) {
                    return statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('Number'), undefined, [
                        statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), node.operatorToken.kind, visitorRight(node.right, visitor, node.operatorToken.kind))
                    ]);
                }
            }
            else {
                reportError(statement.currentFile, node, 'The operation between two pointer types only allowed subtraction');
            }
        }
    }
    if (statement.cheapCompilerOptions.defined.WASM_64) {
        const type1 = statement.typeChecker.getTypeAtLocation(node.left);
        if (isPointerType(type1, node.left)
            && (!ts.isIdentifier(node.right)
                || node.right.escapedText === enumPointer
                    && !statement.lookupLocal(enumPointer))) {
            if (node.operatorToken.kind === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken
                || node.operatorToken.kind === ts.SyntaxKind.PercentToken) {
                const right = visitorRight(node.right, visitor, node.operatorToken.kind);
                return statement.context.factory.createBinaryExpression(visitorLeft(node.left, visitor, node.operatorToken.kind), node.operatorToken.kind === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken
                    ? ts.SyntaxKind.GreaterThanGreaterThanToken
                    : node.operatorToken.kind, ts.isNumericLiteral(right)
                    ? createPointerOperand(+right.text)
                    : createPointerOperand(right));
            }
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}
function computeVisitor(node) {
    if (ts.isBinaryExpression(node)) {
        if (ts.isNumericLiteral(node.left) && ts.isNumericLiteral(node.right)) {
            const r = compute(+node.left.text, +node.right.text, node.operatorToken.kind);
            if (is.number(r)) {
                return statement.context.factory.createNumericLiteral(r);
            }
        }
        if (isBigIntNode(node.left) && isBigIntNode(node.right)) {
            const r = compute(getBigIntValue(node.left), getBigIntValue(node.right), node.operatorToken.kind);
            if (is.bigint(r) && r <= Number.MAX_SAFE_INTEGER && r >= Number.MIN_SAFE_INTEGER) {
                if (statement.cheapCompilerOptions.defined.BIGINT_LITERAL) {
                    return statement.context.factory.createBigIntLiteral(r.toString() + 'n');
                }
                else {
                    return statement.context.factory.createCallExpression(statement.context.factory.createIdentifier('BigInt'), undefined, [
                        statement.context.factory.createNumericLiteral(r.toString())
                    ]);
                }
            }
        }
        if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
            if (ts.isNumericLiteral(node.right) && node.right.text === '0') {
                return node.left;
            }
            else if (ts.isNumericLiteral(node.left) && node.left.text === '0') {
                return node.right;
            }
        }
        if (node.operatorToken.kind === ts.SyntaxKind.MinusToken) {
            if (ts.isNumericLiteral(node.right) && node.right.text === '0') {
                return node.left;
            }
        }
        if (node.operatorToken.kind === ts.SyntaxKind.AsteriskToken) {
            if (ts.isNumericLiteral(node.right) && node.right.text === '1') {
                return node.left;
            }
            else if (ts.isNumericLiteral(node.left) && node.left.text === '1') {
                return node.right;
            }
            if (ts.isNumericLiteral(node.right) && node.right.text === '0') {
                return node.right;
            }
            else if (ts.isNumericLiteral(node.left) && node.left.text === '0') {
                return node.left;
            }
        }
        if (node.operatorToken.kind === ts.SyntaxKind.SlashToken) {
            if (ts.isNumericLiteral(node.right) && node.right.text === '1') {
                return node.left;
            }
            if (ts.isNumericLiteral(node.left) && node.left.text === '0') {
                return node.left;
            }
        }
    }
    return ts.visitEachChild(node, computeVisitor, statement.context);
}
function binaryExpressionVisitor (node, visitor) {
    let result = handle(node, visitor);
    result = ts.isBinaryExpression(result) ? computeVisitor(result) : result;
    return result;
}

function unaryExpressionVisitor (node, visitor) {
    var _a;
    if (ts.isPrefixUnaryExpression(node) && isPointerNode(node.operand)) {
        const type = statement.typeChecker.getTypeAtLocation(node.operand);
        let step = 1;
        // if (typeUtils.isPointerType(type)) {
        //   if (typeUtils.isPointerBuiltinType(type)) {
        //     step = CTypeEnum2Bytes[typeUtils.getPointerBuiltinByType(type)]
        //   }
        //   else if (typeUtils.isPointerStructType(type)) {
        //     const struct = typeUtils.getPointerStructByType(type)
        //     step = struct.length
        //   }
        // }
        const stepNode = array.has(BuiltinBigInt, (_a = type.aliasSymbol) === null || _a === void 0 ? void 0 : _a.escapedName)
            ? statement.context.factory.createBigIntLiteral({
                negative: false,
                base10Value: toString(step)
            })
            : statement.context.factory.createNumericLiteral(step);
        if (node.operator === ts.SyntaxKind.PlusPlusToken) {
            if (ts.isExpressionStatement(node.parent)) {
                return ts.visitNode(statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.PlusEqualsToken, stepNode), visitor);
            }
            return ts.visitNode(statement.context.factory.createBinaryExpression(statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.PlusEqualsToken, stepNode), ts.SyntaxKind.CommaToken, node.operand), visitor);
        }
        else if (node.operator === ts.SyntaxKind.MinusMinusToken) {
            if (ts.isExpressionStatement(node.parent)) {
                return ts.visitNode(statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.MinusEqualsToken, stepNode), visitor);
            }
            return ts.visitNode(statement.context.factory.createBinaryExpression(statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.MinusEqualsToken, stepNode), ts.SyntaxKind.CommaToken, node.operand), visitor);
        }
        else if (node.operator !== ts.SyntaxKind.ExclamationToken) {
            reportError(statement.currentFile, node, 'The unary operation width pointer only allowed ++ -- !');
            return node;
        }
    }
    else if (ts.isPostfixUnaryExpression(node) && isPointerNode(node.operand)) {
        const type = statement.typeChecker.getTypeAtLocation(node.operand);
        let step = 1;
        // if (typeUtils.isPointerType(type)) {
        //   if (typeUtils.isPointerBuiltinType(type)) {
        //     step = CTypeEnum2Bytes[typeUtils.getPointerBuiltinByType(type)]
        //   }
        //   else if (typeUtils.isPointerStructType(type)) {
        //     const struct = typeUtils.getPointerStructByType(type)
        //     step = struct.length
        //   }
        // }
        const stepNode = array.has(BuiltinBigInt, getBuiltinNameByType(type))
            ? statement.context.factory.createBigIntLiteral({
                negative: false,
                base10Value: toString(step)
            })
            : statement.context.factory.createNumericLiteral(step);
        if (node.operator === ts.SyntaxKind.PlusPlusToken) {
            if (ts.isExpressionStatement(node.parent)) {
                return ts.visitNode(statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.PlusEqualsToken, stepNode), visitor);
            }
            return ts.visitNode(statement.context.factory.createBinaryExpression(statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.PlusEqualsToken, stepNode), ts.SyntaxKind.CommaToken, statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.MinusToken, stepNode)), visitor);
        }
        else if (node.operator === ts.SyntaxKind.MinusMinusToken) {
            if (ts.isExpressionStatement(node.parent)) {
                return ts.visitNode(statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.MinusEqualsToken, stepNode), visitor);
            }
            return ts.visitNode(statement.context.factory.createBinaryExpression(statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.MinusEqualsToken, stepNode), ts.SyntaxKind.CommaToken, statement.context.factory.createBinaryExpression(node.operand, ts.SyntaxKind.PlusToken, stepNode)), visitor);
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function elementAccessExpressionVisitor (node, visitor) {
    var _a;
    const type = statement.typeChecker.getTypeAtLocation(node.expression);
    // pointer[]
    if (isPointerElementAccess(node)
        && (!type.aliasSymbol || type.aliasSymbol.escapedName !== typeArray)) {
        return ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(accessof), undefined, [
            statement.context.factory.createBinaryExpression(node.expression, ts.SyntaxKind.PlusToken, node.argumentExpression)
        ]), visitor);
    }
    else if (isSmartPointerElementAccess(node)) {
        reportError(statement.currentFile, node, 'smart pointer not support [] operate');
        return node;
    }
    // array[]
    else if (ts.isPropertyAccessExpression(node.expression)
        && isPointerNode(node.expression.expression)
        || ts.isElementAccessExpression(node.expression)
            && isPointerNode(node.expression)) {
        const type = statement.typeChecker.getTypeAtLocation(node);
        const expressionType = statement.typeChecker.getTypeAtLocation(node.expression);
        if (isArrayType(expressionType) && ts.isNumericLiteral(node.argumentExpression)) {
            const index = +node.argumentExpression.text;
            const max = +expressionType.aliasTypeArguments[1].value;
            if (index < 0 || index >= max) {
                reportError(statement.currentFile, node, `type array access invalid index ${index}, range [0, ${max - 1}]`);
                return node;
            }
        }
        let tree = ts.visitNode(statement.context.factory.createCallExpression(statement.context.factory.createIdentifier(addressof), undefined, [
            node.expression
        ]), visitor);
        if (isStructType(type)) {
            let targetStruct = getStructByType(type);
            let targetSymbol = targetStruct.symbol.deref();
            let targetPath = '';
            if (targetStruct.structType === StructType.INLINE_OBJECT) {
                targetSymbol = targetStruct.definedClassParent.symbol.deref();
                targetPath = targetStruct.definedClassParent.inlineStructPathMap.get(targetStruct.symbol.deref());
            }
            if (!(ts.isNumericLiteral(node.argumentExpression) && (+node.argumentExpression.text) === 0)) {
                tree = statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, ts.isNumericLiteral(node.argumentExpression)
                    ? createPointerOperand(targetStruct.length * (+node.argumentExpression.text))
                    : createPointerOperand(statement.context.factory.createBinaryExpression(statement.context.factory.createNumericLiteral(targetStruct.length), ts.SyntaxKind.AsteriskToken, statement.context.factory.createParenthesizedExpression(node.argumentExpression))));
            }
            const targetSource = (_a = targetSymbol.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getSourceFile();
            if (targetSource) {
                let key;
                if (targetSource !== statement.currentFile) {
                    // addressof(array[]) 不需要导入
                    if (node.parent
                        && ts.isCallExpression(node.parent)
                        && ts.isIdentifier(node.parent.expression)
                        && node.parent.expression.escapedText === addressof
                        && !statement.lookupFunc(addressof)) {
                        key = statement.context.factory.createIdentifier('undefined');
                    }
                    else {
                        key = statement.addStructImport(targetSymbol, targetSource);
                    }
                }
                else {
                    key = statement.context.factory.createIdentifier(targetSymbol.escapedName);
                }
                const args = [
                    tree,
                    key
                ];
                if (targetPath) {
                    args.push(statement.context.factory.createStringLiteral(targetPath));
                }
                return statement.context.factory.createCallExpression(statement.addIdentifierImport(structAccess, RootPath, false), undefined, args);
            }
        }
        else if (isBuiltinType(type, node)) {
            if (!(ts.isNumericLiteral(node.argumentExpression) && (+node.argumentExpression.text) === 0)) {
                tree = statement.context.factory.createBinaryExpression(tree, ts.SyntaxKind.PlusToken, ts.isNumericLiteral(node.argumentExpression)
                    ? createPointerOperand(CTypeEnum2Bytes[getBuiltinByType(type, node)] * (+node.argumentExpression.text))
                    : createPointerOperand(statement.context.factory.createBinaryExpression(statement.context.factory.createNumericLiteral(CTypeEnum2Bytes[getBuiltinByType(type, node)]), ts.SyntaxKind.AsteriskToken, statement.context.factory.createParenthesizedExpression(node.argumentExpression))));
            }
            return statement.context.factory.createCallExpression(statement.context.factory.createElementAccessExpression(statement.addMemoryImport(ctypeEnumRead), getBuiltinByType(type, node)), undefined, [
                tree
            ]);
        }
        else {
            reportError(statement.currentFile, node, 'struct type mismatch');
            return node;
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

const input = '__cheap__transformer_tmp.wat';
const output = '__cheap__transformer_tmp.wasm';
function processAsm(template, node, wasm64) {
    let text = '';
    let startPos = node.template.getStart();
    if (ts.isNoSubstitutionTemplateLiteral(template)) {
        text = template.text;
    }
    else {
        if (template.head) {
            text += template.head.text;
        }
        for (let i = 0; i < template.templateSpans.length; i++) {
            const span = template.templateSpans[i];
            if (ts.isStringLiteral(span.expression)
                || ts.isNumericLiteral(span.expression)) {
                text += span.expression.text;
                text += span.literal.text;
            }
            else {
                reportError(statement.currentFile, span.expression, `expression ${span.expression.getText()} not support in asm`);
                return statement.context.factory.createStringLiteral('compile asm error');
            }
        }
    }
    const distPath = `${statement.options.tmpPath ? `${statement.options.tmpPath}/` : ''}`;
    if (distPath && !ts.sys.directoryExists(distPath)) {
        ts.sys.createDirectory(distPath);
    }
    const inputPath = `${distPath}${input}`;
    const outputPath = `${distPath}${output}`;
    const cmd = `${statement.options.wat2wasm} ${inputPath} --enable-all -o ${outputPath}`;
    const source = `
    (module
      (import "env" "memory" (memory${wasm64 ? ' i64 ' : ' '}1 65536 shared))
      ${text}
    )
  `;
    ts.sys.writeFile(inputPath, source);
    try {
        execSync(cmd, {
            stdio: 'pipe'
        });
        const buffer = fs.readFileSync(outputPath);
        return statement.context.factory.createStringLiteral(buffer.toString('base64'));
    }
    catch (error) {
        let messages = error.message.split('\n');
        messages.shift();
        let errorMessage = '';
        let line = 0;
        function getPos(line) {
            let pos = 0;
            while (line && pos < text.length) {
                if (text[pos++] === '\n') {
                    line--;
                }
            }
            while (pos < text.length) {
                if (!/\s/.test(text[pos])) {
                    break;
                }
                pos++;
            }
            const start = startPos + pos;
            while (pos < text.length) {
                if (text[pos] === '\n') {
                    break;
                }
                pos++;
            }
            const end = startPos + pos;
            return {
                start, end
            };
        }
        array.each(messages, (message) => {
            const match = message.match(/__cheap__transformer_tmp.wat:(\d+)/);
            if (match) {
                if (errorMessage) {
                    const { start, end } = getPos(line);
                    reportError(statement.currentFile, node, errorMessage, SYNTAX_ERROR, start, end);
                }
                errorMessage = `${message.split('error: ').pop()}`;
                line = +match[1] - 4;
            }
            else if (message) {
                errorMessage += `\n${message}`;
            }
        });
        if (errorMessage) {
            const { start, end } = getPos(line);
            reportError(statement.currentFile, node, errorMessage, SYNTAX_ERROR, start, end);
        }
        return statement.context.factory.createStringLiteral('compile asm error');
    }
}

function taggedTemplateExpressionVisitor (node, visitor) {
    if (ts.isIdentifier(node.tag) && (node.tag.escapedText === tagAsm || node.tag.escapedText === tagAsm64)) {
        const template = ts.visitNode(node.template, visitor);
        return processAsm(template, node, node.tag.escapedText === tagAsm64);
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function conditionalExpressionVisitor (node, visitor) {
    if (ts.visitNode(node.condition, hasDefined) && ts.visitNode(node.condition, checkConditionCompile)) {
        if (checkBool(node.condition, visitor)) {
            if (statement.cheapCompilerOptions.defined.WASM_64) {
                const type = statement.typeChecker.getTypeAtLocation(node.whenFalse);
                if (isSizeType(type)) {
                    return createPointerOperand(ts.visitNode(node.whenTrue, visitor));
                }
            }
            return ts.visitNode(node.whenTrue, visitor);
        }
        else {
            if (statement.cheapCompilerOptions.defined.WASM_64) {
                const type = statement.typeChecker.getTypeAtLocation(node.whenTrue);
                if (isSizeType(type)) {
                    return createPointerOperand(ts.visitNode(node.whenFalse, visitor));
                }
            }
            return ts.visitNode(node.whenFalse, visitor);
        }
    }
    if (statement.cheapCompilerOptions.defined.WASM_64) {
        const type1 = statement.typeChecker.getTypeAtLocation(node.whenTrue);
        const type2 = statement.typeChecker.getTypeAtLocation(node.whenFalse);
        if (isSizeType(type1) && !isSizeType(type2)) {
            return statement.context.factory.createConditionalExpression(ts.visitNode(node.condition, statement.visitor), node.questionToken, ts.visitNode(node.whenTrue, statement.visitor), node.colonToken, createPointerOperand(ts.visitNode(node.whenFalse, statement.visitor)));
        }
        else if (!isSizeType(type1) && isSizeType(type2)) {
            return statement.context.factory.createConditionalExpression(ts.visitNode(node.condition, statement.visitor), node.questionToken, createPointerOperand(ts.visitNode(node.whenTrue, statement.visitor)), node.colonToken, ts.visitNode(node.whenFalse, statement.visitor));
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function expressionVisitor (node, visitor) {
    var _a;
    if (ts.isBinaryExpression(node)) {
        return binaryExpressionVisitor(node, visitor);
    }
    else if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
        return unaryExpressionVisitor(node, visitor);
    }
    else if (ts.isCallExpression(node)) {
        return callVisitor(node, visitor);
    }
    else if (ts.isPropertyAccessExpression(node)) {
        return propertyAccessExpressionVisitor(node, visitor);
    }
    else if (ts.isElementAccessExpression(node)) {
        return elementAccessExpressionVisitor(node, visitor);
    }
    else if (statement.cheapCompilerOptions.defined.ENABLE_SYNCHRONIZE_API
        && ts.isAwaitExpression(node)
        && node.expression
        && ts.isCallExpression(node.expression)
        && (statement.lookupSynchronized()
            || isSynchronizeFunction((_a = statement.typeChecker.getSymbolAtLocation(ts.isPropertyAccessExpression(node.expression.expression)
                ? node.expression.expression.name
                : node.expression.expression)) === null || _a === void 0 ? void 0 : _a.valueDeclaration))) {
        return ts.visitEachChild(node.expression, visitor, statement.context);
    }
    else if (ts.isTaggedTemplateExpression(node)) {
        return taggedTemplateExpressionVisitor(node, visitor);
    }
    else if (ts.isConditionalExpression(node)) {
        return conditionalExpressionVisitor(node, visitor);
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function propertyDeclarationVisitor (node, visitor) {
    if (node.initializer && node.type && node.pos > -1) {
        const type = statement.typeChecker.getTypeAtLocation(node.type);
        const initType = statement.typeChecker.getTypeAtLocation(node.initializer);
        if (isPointerType(type, null)
            && (isBuiltinType(initType, node.initializer) || initType.flags & ts.TypeFlags.NumberLike)
            && !isPointerType(initType, node.initializer)
            && !isNullPointer(initType, node.initializer)) {
            reportError(statement.currentFile, node, `type ${getBuiltinNameByType(initType) || 'number'} is not assignable to property declaration of type ${getBuiltinNameByType(type)}`, TYPE_MISMATCH);
            return node;
        }
        else if (isSizeType(type)) {
            return ts.visitNode(statement.context.factory.createPropertyDeclaration(node.modifiers, node.name, node.questionToken || node.exclamationToken, node.type, createPointerOperand(node.initializer)), statement.visitor);
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function propertyAssignmentVisitor (node, visitor) {
    if (node.initializer && node.pos > -1) {
        const type = statement.typeChecker.getTypeAtLocation(node.name);
        const initType = statement.typeChecker.getTypeAtLocation(node.initializer);
        if (isPointerType(type, node.name)
            && (isBuiltinType(initType, node.initializer) || initType.flags & ts.TypeFlags.NumberLike)
            && !isPointerType(initType, node.initializer)
            && !isNullPointer(initType, node.initializer)) {
            reportError(statement.currentFile, node, `type ${getBuiltinNameByType(initType) || 'number'} is not assignable to property assignment of type ${getBuiltinNameByType(type)}`, TYPE_MISMATCH);
            return node;
        }
        else if (isSizeType(type, true)) {
            return statement.context.factory.createPropertyAssignment(node.name, ts.visitNode(createPointerOperand(node.initializer), statement.visitor));
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function bindingElementVisitor (node, visitor) {
    if (node.initializer && node.pos > -1) {
        const type = statement.typeChecker.getTypeAtLocation(node.name);
        if (isSizeType(type, true)) {
            return statement.context.factory.createBindingElement(node.dotDotDotToken, node.propertyName, node.name, ts.visitNode(createPointerOperand(node.initializer), statement.visitor));
        }
    }
    return ts.visitEachChild(node, visitor, statement.context);
}

function getDirname(meta) {
    if (typeof __dirname !== 'undefined') {
        // CJS 环境
        return __dirname;
    }
    return dirname(fileURLToPath(meta));
}

const importUrl = import.meta.url;
const createNumericLiteralSymbol = Symbol('createNumericLiteral');
const DefaultDefined = {
    ENV_NODE: false,
    ENV_CSP: false,
    ENV_CJS: false,
    ENABLE_THREADS: true,
    ENABLE_THREADS_SPLIT: false,
    DEBUG: false,
    BIGINT_LITERAL: true,
    CHEAP_HEAP_INITIAL: 256,
    ENABLE_SYNCHRONIZE_API: false,
    ENABLE_LOG_PATH: true,
    ENV_WEBPACK: false,
    WASM_64: false
};
function before(program, options, getProgram) {
    var _a, _b;
    if (is.func(options)) {
        getProgram = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    if (!options.projectPath) {
        options.projectPath = program.getCurrentDirectory();
    }
    if (!options.wat2wasm) {
        let wat2wasmPath = path$1.resolve(getDirname(importUrl), './asm/ubuntu') + '/wat2wasm';
        if (os.platform() === 'win32') {
            wat2wasmPath = path$1.resolve(getDirname(importUrl), './asm/win') + '/wat2wasm.exe';
        }
        else if (os.platform() === 'darwin') {
            wat2wasmPath = path$1.resolve(getDirname(importUrl), './asm/macos') + '/wat2wasm';
        }
        options.wat2wasm = wat2wasmPath;
    }
    const configFileName = ts.findConfigFile(options.projectPath, ts.sys.fileExists, 'tsconfig.json');
    const configFile = configFileName && ts.readConfigFile(configFileName, ts.sys.readFile);
    let compilerOptions = {
        defined: {},
        structPaths: {}
    };
    const defined = object.extend({}, DefaultDefined);
    const structPaths = {};
    if ((_a = configFile === null || configFile === void 0 ? void 0 : configFile.config) === null || _a === void 0 ? void 0 : _a.cheap) {
        object.extend(defined, configFile.config.cheap.defined || {});
        if (configFile.config.cheap.structPaths) {
            object.each(configFile.config.cheap.structPaths, (value, key) => {
                structPaths[path$1.resolve(path$1.dirname(configFileName), key)] = value;
            });
        }
        compilerOptions = object.extend(compilerOptions, configFile.config['cheap'] || {});
    }
    if (options.defined) {
        object.extend(defined, options.defined);
    }
    if (defined.ENV_CSP) {
        defined.ENABLE_THREADS_SPLIT = true;
    }
    compilerOptions.defined = defined;
    compilerOptions.structPaths = structPaths;
    statement.options = options;
    statement.cheapCompilerOptions = compilerOptions;
    statement.compilerOptions = program.getCompilerOptions();
    const excludes = is.array(options.exclude)
        ? options.exclude
        : (options.exclude
            ? [options.exclude]
            : []);
    setPacketName((_b = options.cheapPacketName) !== null && _b !== void 0 ? _b : '@libmedia/cheap');
    if (statement.cheapCompilerOptions.defined.WASM_64) {
        CTypeEnum2Bytes[20 /* typedef.CTypeEnum.pointer */] = 8;
        CTypeEnum2Bytes[25 /* typedef.CTypeEnum.size */] = 8;
        BuiltinBigInt.push(typeSize);
        statement.cheapCompilerOptions.defined.BIGINT_LITERAL = true;
    }
    else {
        CTypeEnum2Bytes[20 /* typedef.CTypeEnum.pointer */] = 4;
        CTypeEnum2Bytes[25 /* typedef.CTypeEnum.size */] = 4;
        array.remove(BuiltinBigInt, typeSize);
        if (defined.BIGINT_LITERAL === false) {
            statement.cheapCompilerOptions.defined.BIGINT_LITERAL = false;
        }
    }
    clearStructCache();
    return (context) => {
        statement.context = context;
        const options = context.getCompilerOptions();
        statement.moduleType = options.module;
        statement.esModuleInterop = options.esModuleInterop;
        const createNumericLiteral = context.factory.createNumericLiteral;
        if (!createNumericLiteral[createNumericLiteralSymbol]) {
            // @ts-ignore
            context.factory.createNumericLiteral = (value, numericLiteralFlags) => {
                if (is.number(value) && value < 0) {
                    return statement.context.factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, statement.context.factory.createNumericLiteral(Math.abs(value)));
                }
                return createNumericLiteral(value, numericLiteralFlags);
            };
            context.factory.createNumericLiteral[createNumericLiteralSymbol] = true;
        }
        return (file) => {
            if (excludes.some((exclude) => {
                return exclude.test(file.fileName);
            })) {
                return file;
            }
            if (getProgram) {
                statement.program = getProgram();
                statement.typeChecker = statement.program.getTypeChecker();
            }
            else {
                statement.program = program;
                statement.typeChecker = program.getTypeChecker();
            }
            statement.start(file);
            statement.visitor = (node) => {
                if (ts.isPropertyDeclaration(node)) {
                    return propertyDeclarationVisitor(node, statement.visitor);
                }
                else if (ts.isPropertyAssignment(node)) {
                    return propertyAssignmentVisitor(node, statement.visitor);
                }
                else if (ts.isBindingElement(node)) {
                    return bindingElementVisitor(node, statement.visitor);
                }
                else if (ts.isBlock(node)) {
                    return blockVisitor(node, statement.visitor);
                }
                else if (ts.isIdentifier(node)) {
                    return identifierVisitor(node, statement.visitor);
                }
                else if (ts.isDecorator(node)) {
                    return decoratorVisitor(node, statement.visitor);
                }
                else if (node.kind === ts.SyntaxKind.AsyncKeyword) {
                    return asyncVisitor(node, statement.visitor);
                }
                else if (ts.isClassDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
                    return classDeclarationVisitor(node, statement.visitor);
                }
                else if (ts.isIfStatement(node)) {
                    return ifStatementVisitor(node, statement.visitor);
                }
                else if (ts.isParameter(node)) {
                    return parameterVisitor(node, statement.visitor);
                }
                else if (ts.isVariableDeclaration(node)) {
                    return variableDeclarationVisitor(node, statement.visitor);
                }
                else if (ts.isFunctionDeclaration(node)) {
                    return functionDeclarationVisitor(node, statement.visitor);
                }
                else if (ts.isExpressionStatement(node)) {
                    return expressionStatementVisitor(node, statement.visitor);
                }
                else if (ts.isBigIntLiteral(node)) {
                    return bigIntLiteralVisitor(node, statement.visitor);
                }
                else if (ts.isExpression(node)) {
                    return expressionVisitor(node, statement.visitor);
                }
                return ts.visitEachChild(node, statement.visitor, context);
            };
            return statement.end(ts.visitEachChild(file, statement.visitor, statement.context));
        };
    };
}
function after(program, options, getProgram) {
    if (is.func(options)) {
        options = {};
    }
    if (!options) {
        options = {};
    }
    const excludes = is.array(options.exclude)
        ? options.exclude
        : (options.exclude
            ? [options.exclude]
            : []);
    return (context) => {
        return (file) => {
            if (excludes.some((exclude) => {
                return exclude.test(file.fileName);
            })) {
                return file;
            }
            const visitor = (node) => {
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitEachChild(file, visitor, context);
        };
    };
}
function afterDeclarations(program, options, getProgram) {
    if (is.func(options)) {
        options = {};
    }
    if (!options) {
        options = {};
    }
    const excludes = is.array(options.exclude)
        ? options.exclude
        : (options.exclude
            ? [options.exclude]
            : []);
    return (context) => {
        return (file) => {
            if (excludes.some((exclude) => {
                return exclude.test(file.fileName);
            })) {
                return file;
            }
            const structFileIdentifiers = getStructFileIdentifiers(file.fileName);
            const visitor = (node) => {
                if (ts.isClassDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
                    let name = node.name.escapedText;
                    if (node.modifiers && node.modifiers.some((modifier) => {
                        return modifier.kind === ts.SyntaxKind.DefaultKeyword;
                    })) {
                        name = 'default';
                    }
                    if (structFileIdentifiers && array.has(structFileIdentifiers, name)) {
                        const modifiers = node.modifiers ? [...node.modifiers] : [];
                        modifiers.unshift(context.factory.createDecorator(context.factory.createIdentifier(typeStruct)));
                        return context.factory.createClassDeclaration(modifiers, node.name, node.typeParameters, node.heritageClauses, node.members);
                    }
                }
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitEachChild(file, visitor, context);
        };
    };
}

export { after, afterDeclarations, before };
//# sourceMappingURL=transformer.mjs.map
