/**
 * One-shot codemod: classic global scripts → ES modules with imports/exports.
 * Run from Client/: node scripts/convert-to-esm.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import MagicString from "magic-string";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const GAME_FILES = [
    "Assets/utils/indexDB.js",
    "Assets/utils/globals.js",
    "Assets/utils/keyBindings.js",
    "Assets/utils/input.js",
    "Assets/utils/classes.js",
    "Assets/game/camera.js",
    "Assets/utils/object.js",
    "Assets/game/sounds.js",
    "Assets/game/music.js",
    "Assets/game/lootTable.js",
    "Assets/game/item.js",
    "Assets/game/items.js",
    "Assets/world/block.js",
    "Assets/world/blocks.js",
    "Assets/world/particle.js",
    "Assets/world/particleEmitter.js",
    "Assets/world/chestLoot.js",
    "Assets/world/trees.js",
    "Assets/utils/noise.js",
    "Assets/world/biome.js",
    "Assets/world/dimension.js",
    "Assets/world/structure.js",
    "Assets/world/structures.js",
    "Assets/world/chunk.js",
    "Assets/game/inventoryItem.js",
    "Assets/game/recipe.js",
    "Assets/game/recipes.js",
    "Assets/game/skinPreview.js",
    "Assets/game/inventory.js",
    "Assets/game/hotbar.js",
    "Assets/utils/renderer.js",
    "Assets/world/generator.js",
    "Assets/world/world.js",
    "Assets/world/saving.js",
    "Assets/game/body.js",
    "Assets/game/entity.js",
    "Assets/entities/drop.js",
    "Assets/entities/mob.js",
    "Assets/entities/projectile.js",
    "Assets/entities/projectiles/snowBall.js",
    "Assets/entities/mobs/pig.js",
    "Assets/entities/mobs/cow.js",
    "Assets/entities/mobs/sheep.js",
    "Assets/entities/mobs/zombie.js",
    "Assets/entities/mobs/creeper.js",
    "Assets/entities/mobs/wither_skeleton.js",
    "Assets/entities/fallingBlock.js",
    "Assets/entities/TNT.js",
    "Assets/entities/entities.js",
    "Assets/entities/player.js",
    "Assets/game/chat.js",
    "Assets/game/pauseMenu.js",
    "Assets/game/deathScreen.js",
    "Assets/game/game.js",
    "main.js",
    "debug.js",
    "buttonUtils.js",
    "Assets/utils/texturePackLoader.js",
    "Assets/multiplayer/messageHandler.js",
    "Assets/multiplayer/server.js",
    "Assets/utils/screenshotChunks.js",
];

const ALL_FILES = [...GAME_FILES, "menu.js"];

/** Bindings reassigned from outside their defining file (+ game singleton). */
const RUNTIME_SYMBOLS = new Set([
    "deltaTime",
    "isTexturePackLoaded",
    "passedTime",
    "time",
    "day",
    "globalFrame",
    "GAMERULES",
    "server",
    "game",
    "world",
    "hotbar",
    "cursorInRange",
    "drawingChunkBorders",
    "drawCameraOverlay",
    "drawHeightOverlay",
    "drawDebugMouseBlockOverlay",
    "drawFileSizeOverlay",
    "drawFpsOverlay",
    "drawHitbox",
    "drawCoordinatesOverlay",
]);

const NPM_IMPORTS = {
    JSZip: "jszip",
    tooloud: "tooloud",
};

const BROWSER_GLOBALS = new Set([
    "window",
    "document",
    "console",
    "Math",
    "JSON",
    "Object",
    "Array",
    "String",
    "Number",
    "Boolean",
    "Promise",
    "Error",
    "TypeError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "Symbol",
    "Reflect",
    "Proxy",
    "Date",
    "RegExp",
    "Infinity",
    "NaN",
    "undefined",
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "encodeURI",
    "decodeURI",
    "encodeURIComponent",
    "decodeURIComponent",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "fetch",
    "URL",
    "URLSearchParams",
    "Blob",
    "File",
    "FileReader",
    "Image",
    "Audio",
    "AudioContext",
    "webkitAudioContext",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "location",
    "navigator",
    "history",
    "performance",
    "crypto",
    "btoa",
    "atob",
    "alert",
    "confirm",
    "prompt",
    "HTMLElement",
    "Event",
    "CustomEvent",
    "MouseEvent",
    "KeyboardEvent",
    "PointerEvent",
    "WheelEvent",
    "DOMParser",
    "FormData",
    "Headers",
    "Request",
    "Response",
    "AbortController",
    "TextEncoder",
    "TextDecoder",
    "Uint8Array",
    "Int8Array",
    "Uint16Array",
    "Int16Array",
    "Uint32Array",
    "Int32Array",
    "Float32Array",
    "Float64Array",
    "ArrayBuffer",
    "DataView",
    "WebSocket",
    "Worker",
    "structuredClone",
    "queueMicrotask",
    "CSS",
    "getComputedStyle",
    "matchMedia",
    "MutationObserver",
    "ResizeObserver",
    "IntersectionObserver",
    "Node",
    "NodeList",
    "Element",
    "DocumentFragment",
    "Path2D",
    "OffscreenCanvas",
    "ImageData",
    "ImageBitmap",
    "createImageBitmap",
    "devicePixelRatio",
    "innerWidth",
    "innerHeight",
    "screen",
    "self",
    "globalThis",
    "parent",
    "top",
    "opener",
    "origin",
    "BigInt",
    "Intl",
    "CanvasRenderingContext2D",
    "WebGLRenderingContext",
    "True",
    "False",
    "null",
    "arguments",
    "eval",
    "Unevaluated",
]);

function parse(src, sourceType = "module") {
    return acorn.parse(src, {
        ecmaVersion: "latest",
        sourceType,
        locations: true,
        allowHashBang: true,
    });
}

function getTopLevelBindings(ast) {
    const names = [];
    function addDecl(stmt, exported) {
        if (stmt.type === "FunctionDeclaration" && stmt.id)
            names.push({ name: stmt.id.name, node: stmt, exported });
        else if (stmt.type === "ClassDeclaration" && stmt.id)
            names.push({ name: stmt.id.name, node: stmt, exported });
        else if (stmt.type === "VariableDeclaration") {
            for (const d of stmt.declarations) {
                if (d.id.type === "Identifier")
                    names.push({
                        name: d.id.name,
                        node: stmt,
                        declarator: d,
                        exported,
                    });
            }
        }
    }
    for (const stmt of ast.body) {
        if (stmt.type === "ExportNamedDeclaration" && stmt.declaration) {
            addDecl(stmt.declaration, true);
        } else {
            addDecl(stmt, false);
        }
    }
    return names;
}

function relImport(from, to) {
    let rel = path.relative(path.dirname(from), to).replace(/\\/g, "/");
    if (!rel.startsWith(".")) rel = "./" + rel;
    return rel;
}

function collectUsedSymbols(ast, localBindingNames, symbolToFile) {
    const used = new Set();
    const local = new Set(localBindingNames);

    walk.recursive(ast, new Set(local), {
        Function(node, st, c) {
            const news = new Set(st);
            if (node.id && node.type === "FunctionDeclaration")
                news.add(node.id.name);
            for (const p of node.params) {
                walk.simple(p, {
                    Identifier(id) {
                        news.add(id.name);
                    },
                });
            }
            if (node.body) c(node.body, news);
        },
        ClassDeclaration(node, st, c) {
            const news = new Set(st);
            if (node.id) news.add(node.id.name);
            if (node.superClass) c(node.superClass, st);
            for (const m of node.body.body) c(m, news);
        },
        ClassExpression(node, st, c) {
            const news = new Set(st);
            if (node.id) news.add(node.id.name);
            if (node.superClass) c(node.superClass, st);
            for (const m of node.body.body) c(m, news);
        },
        VariableDeclarator(node, st, c) {
            if (node.id.type === "Identifier") st.add(node.id.name);
            else
                walk.simple(node.id, {
                    Identifier(id) {
                        st.add(id.name);
                    },
                });
            if (node.init) c(node.init, st);
        },
        CatchClause(node, st, c) {
            const news = new Set(st);
            if (node.param && node.param.type === "Identifier")
                news.add(node.param.name);
            c(node.body, news);
        },
        MemberExpression(node, st, c) {
            c(node.object, st);
            if (node.computed) c(node.property, st);
        },
        Property(node, st, c) {
            if (node.computed) c(node.key, st);
            if (node.shorthand && node.key.type === "Identifier") {
                const n = node.key.name;
                if (
                    !st.has(n) &&
                    (symbolToFile.has(n) || RUNTIME_SYMBOLS.has(n) || NPM_IMPORTS[n])
                )
                    used.add(n);
            } else if (node.value) c(node.value, st);
        },
        LabelledStatement(node, st, c) {
            c(node.body, st);
        },
        Identifier(node, st) {
            const n = node.name;
            if (st.has(n) || local.has(n) || BROWSER_GLOBALS.has(n)) return;
            if (symbolToFile.has(n) || RUNTIME_SYMBOLS.has(n) || NPM_IMPORTS[n])
                used.add(n);
        },
    });
    return used;
}

/** Rewrite free identifiers that are runtime symbols → runtime.X */
function rewriteRuntimeIdents(ast, ms, localNames) {
    const local = new Set(localNames);
    const edits = [];

    walk.recursive(ast, new Set(local), {
        Function(node, st, c) {
            const news = new Set(st);
            if (node.id && node.type === "FunctionDeclaration")
                news.add(node.id.name);
            for (const p of node.params) {
                walk.simple(p, {
                    Identifier(id) {
                        news.add(id.name);
                    },
                });
            }
            if (node.body) c(node.body, news);
        },
        ClassDeclaration(node, st, c) {
            const news = new Set(st);
            if (node.id) news.add(node.id.name);
            if (node.superClass) c(node.superClass, st);
            for (const m of node.body.body) c(m, news);
        },
        ClassExpression(node, st, c) {
            const news = new Set(st);
            if (node.id) news.add(node.id.name);
            if (node.superClass) c(node.superClass, st);
            for (const m of node.body.body) c(m, news);
        },
        VariableDeclarator(node, st, c) {
            // Visit init before adding binding so RHS can use outer scope
            if (node.init) c(node.init, st);
            if (node.id.type === "Identifier") st.add(node.id.name);
            else
                walk.simple(node.id, {
                    Identifier(id) {
                        st.add(id.name);
                    },
                });
        },
        CatchClause(node, st, c) {
            const news = new Set(st);
            if (node.param && node.param.type === "Identifier")
                news.add(node.param.name);
            c(node.body, news);
        },
        MemberExpression(node, st, c) {
            c(node.object, st);
            if (node.computed) c(node.property, st);
        },
        Property(node, st, c) {
            if (node.computed) c(node.key, st);
            if (node.shorthand && node.key.type === "Identifier") {
                const n = node.key.name;
                if (!st.has(n) && RUNTIME_SYMBOLS.has(n)) {
                    edits.push({
                        start: node.start,
                        end: node.end,
                        text: `${n}: runtime.${n}`,
                    });
                }
            } else if (node.value) c(node.value, st);
        },
        AssignmentExpression(node, st, c) {
            if (
                node.left.type === "Identifier" &&
                RUNTIME_SYMBOLS.has(node.left.name) &&
                !st.has(node.left.name)
            ) {
                edits.push({
                    start: node.left.start,
                    end: node.left.end,
                    text: `runtime.${node.left.name}`,
                });
                c(node.right, st);
                return;
            }
            c(node.left, st);
            c(node.right, st);
        },
        UpdateExpression(node, st, c) {
            if (
                node.argument.type === "Identifier" &&
                RUNTIME_SYMBOLS.has(node.argument.name) &&
                !st.has(node.argument.name)
            ) {
                edits.push({
                    start: node.argument.start,
                    end: node.argument.end,
                    text: `runtime.${node.argument.name}`,
                });
                return;
            }
            c(node.argument, st);
        },
        Identifier(node, st) {
            const n = node.name;
            if (st.has(n) || !RUNTIME_SYMBOLS.has(n)) return;
            edits.push({
                start: node.start,
                end: node.end,
                text: `runtime.${n}`,
            });
        },
    });

    // Apply from end so offsets stay valid
    edits.sort((a, b) => b.start - a.start);
    for (const e of edits) ms.overwrite(e.start, e.end, e.text);
    return edits.length > 0;
}

function convertFile(file, symbolToFile, fileLocals) {
    const abs = path.join(ROOT, file);
    let src = fs.readFileSync(abs, "utf8");

    // Special-case screenshotChunks: unwrap IIFE so exports work
    if (file === "Assets/utils/screenshotChunks.js") {
        src = convertScreenshotChunks(src);
    }

    if (file === "Assets/utils/indexDB.js") {
        src = src.replace(
            "(window.ldb = {",
            "(window.ldb = globalThis.ldb = {",
        );
        if (!src.includes("export const ldb")) {
            src += "\n\nexport const ldb = window.ldb;\n";
        }
    }

    const ast = parse(src);
    const topBindings = getTopLevelBindings(ast);
    const localNames = topBindings.map((b) => b.name);
    const ms = new MagicString(src);

    // Turn owning VariableDeclarations for runtime symbols into assignments / drops
    for (const b of topBindings) {
        if (!RUNTIME_SYMBOLS.has(b.name)) continue;
        const owner = symbolToFile.get(b.name);
        const isOwner =
            owner === file ||
            (file === "main.js" && (b.name === "game" || b.name === "world"));
        if (!isOwner) continue;
        if (b.node.type !== "VariableDeclaration" || !b.declarator) continue;

        const decl = b.node;
        const d = b.declarator;
        if (decl.declarations.length === 1) {
            if (d.init) {
                const initSrc = src.slice(d.init.start, d.init.end);
                ms.overwrite(
                    decl.start,
                    decl.end,
                    `runtime.${b.name} = ${initSrc};`,
                );
            } else {
                // bare `let deltaTime;` — runtime already has the field
                let end = decl.end;
                if (src[end] === "\n") end++;
                ms.remove(decl.start, end);
            }
        }
    }

    const mid = ms.toString();
    const ast2 = parse(mid);
    const top2 = getTopLevelBindings(ast2);
    const localNames2 = top2.map((b) => b.name);
    // Treat runtime.X left-hand inits as non-local so reads still rewrite
    const ms2 = new MagicString(mid);
    rewriteRuntimeIdents(ast2, ms2, localNames2);

    let body = ms2.toString();
    body = body.replace(/\bruntime\.runtime\./g, "runtime.");

    // Add export keywords to top-level declarations
    {
        const msExport = new MagicString(body);
        const astExp = parse(body);
        for (const stmt of astExp.body) {
            if (
                stmt.type === "ExportNamedDeclaration" ||
                stmt.type === "ExportDefaultDeclaration"
            )
                continue;
            if (
                stmt.type === "FunctionDeclaration" ||
                stmt.type === "ClassDeclaration"
            ) {
                if (stmt.id && RUNTIME_SYMBOLS.has(stmt.id.name)) continue;
                msExport.appendLeft(stmt.start, "export ");
            } else if (stmt.type === "VariableDeclaration") {
                const names = stmt.declarations
                    .filter((d) => d.id.type === "Identifier")
                    .map((d) => d.id.name);
                if (names.length && names.every((n) => RUNTIME_SYMBOLS.has(n)))
                    continue;
                msExport.appendLeft(stmt.start, "export ");
            }
        }
        body = msExport.toString();
    }

    // Collect imports from rewritten body
    const ast4 = parse(body);
    const locals4 = getTopLevelBindings(ast4).map((b) => b.name);
    const used = collectUsedSymbols(ast4, locals4, symbolToFile);

    const importMap = new Map(); // file -> Set of names
    let needsRuntime = false;
    const npmImports = new Map();

    for (const sym of used) {
        if (RUNTIME_SYMBOLS.has(sym)) {
            needsRuntime = true;
            continue;
        }
        if (NPM_IMPORTS[sym]) {
            npmImports.set(sym, NPM_IMPORTS[sym]);
            continue;
        }
        if (locals4.includes(sym)) continue;
        const owner = symbolToFile.get(sym);
        if (!owner || owner === file) continue;
        if (!importMap.has(owner)) importMap.set(owner, new Set());
        importMap.get(owner).add(sym);
    }

    // Also detect runtime usage via string search after rewrite
    if (/\bruntime\./.test(body)) needsRuntime = true;

    const importLines = [];
    if (needsRuntime) {
        importLines.push(
            `import { runtime } from "${relImport(file, "Assets/utils/runtime.js")}";`,
        );
    }
    for (const [name, pkg] of npmImports) {
        importLines.push(`import ${name} from "${pkg}";`);
    }
    for (const [owner, names] of [...importMap.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
    )) {
        const list = [...names].sort().join(", ");
        importLines.push(
            `import { ${list} } from "${relImport(file, owner)}";`,
        );
    }

    if (file === "Assets/utils/indexDB.js" && !body.includes("export const ldb")) {
        body += "\nexport const ldb = window.ldb;\n";
    }

    if (importLines.length) {
        body = importLines.join("\n") + "\n\n" + body;
    }

    fs.writeFileSync(abs, body);
    return { imports: importLines.length, locals: locals4.length };
}

function convertScreenshotChunks(src) {
    let s = src.trim();
    if (s.startsWith("(function")) {
        s = s.replace(/^\(function\s*\(\s*\)\s*\{/, "");
        s = s.replace(/\}\s*\)\s*\(\s*\)\s*;?\s*$/, "");
    }
    // Hoist nested function declarations that should be exported
    // screenshotNearestChunks is a function declaration inside the former IIFE — now top-level
    // Keep window bridge
    if (!s.includes("window.screenshotNearestChunks")) {
        s +=
            "\nwindow.screenshotNearestChunks = screenshotNearestChunks;\n";
    }
    // Nested helper functions (createGradientForDimension, hexToRgb, interpolateColor) stay module-local
    // Promote screenshotNearestChunks if it's nested — check indentation; if still nested, leave as-is
    // After unwrap, function decls at indent level become top-level once we dedent? acorn is fine with indented decls.
    return s;
}

// --- main ---
process.chdir(ROOT);

// Write runtime.js first
const runtimeInit = `/** Mutable cross-module session state (replaces ambient globals). */
export const runtime = {
    deltaTime: undefined,
    isTexturePackLoaded: false,
    passedTime: 0,
    time: 1,
    day: true,
    globalFrame: 0,
    GAMERULES: {
        keepInventory: false,
        doDaylightCycle: true,
        doMobSpawning: true,
        doMobLoot: true,
        doTileDrops: true,
        doFireTick: true,
        doMobGriefing: true,
    },
    server: null,
    game: null,
    world: null,
    hotbar: null,
    cursorInRange: false,
    drawingChunkBorders: false,
    drawCameraOverlay: false,
    drawHeightOverlay: false,
    drawDebugMouseBlockOverlay: false,
    drawFileSizeOverlay: false,
    drawFpsOverlay: true,
    drawHitbox: false,
    drawCoordinatesOverlay: true,
};
`;
fs.writeFileSync(path.join(ROOT, "Assets/utils/runtime.js"), runtimeInit);

// Build symbol map (first declaration wins for duplicates like hexToRgb)
const symbolToFile = new Map();
const fileLocals = new Map();
for (const f of ALL_FILES) {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    let ast;
    try {
        ast = parse(src);
    } catch (e) {
        console.error("parse fail", f, e.message);
        continue;
    }
    const bindings = getTopLevelBindings(ast).map((b) => b.name);
    // screenshotChunks: also register inner function if IIFE
    if (f === "Assets/utils/screenshotChunks.js") {
        bindings.push("screenshotNearestChunks");
    }
    fileLocals.set(f, bindings);
    for (const b of bindings) {
        if (!symbolToFile.has(b)) symbolToFile.set(b, f);
    }
}
symbolToFile.set("ldb", "Assets/utils/indexDB.js");
symbolToFile.set("screenshotNearestChunks", "Assets/utils/screenshotChunks.js");

// Convert globals.js mutables that stay as non-runtime (lighting, updatingBlocks, etc.) normally

for (const f of ALL_FILES) {
    try {
        const r = convertFile(f, symbolToFile, fileLocals);
        console.log("converted", f, r);
    } catch (e) {
        console.error("FAIL", f, e);
        throw e;
    }
}

console.log("Done.");
