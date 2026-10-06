// moss-editor-host.js: the pure host helpers of the @moss-multi/editor contract, API 1 (contract.ts,
// MossEditorHostModule). One self-contained ES2022 module with no imports; it uses only the globals
// TextEncoder and crypto.subtle. Each helper reproduces Moss desktop's own rule at
// brsbl/moss@762abb777 (packages/desktop/src/main/storage/note-store.ts and main/ipc-handlers.ts; line
// numbers below are to those files), and moss-editor-host.test.ts holds it to desktop's code byte for byte.

export const MOSS_EDITOR_API = 1;

export const MOSS_EDITOR_INFO = Object.freeze(
  /** @type {const} */ ({ api: 1, version: '0.1.0', features: Object.freeze([]) }),
);

export const MOSS_NOTE_FILES = Object.freeze(
  /** @type {const} */ ({
    notesRoot: 'Notes',
    trashRoot: 'Trash',
    externalFolder: 'External',
    meta: 'meta.json',
    comments: 'comments.json',
    layout: 'layout.json',
    legacyMarkdown: 'note.md',
    folderMeta: '.folder.json',
    assetsDir: 'assets',
  }),
);

// note-store.ts:96-98, 101, 649-651
const NOTE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// eslint-disable-next-line no-control-regex -- Moss strips control characters
const INVALID_PATH_CHARACTERS = /[<>:"/\\|?*\u0000-\u001F]/g;
const MAX_FOLDER_ALLOCATION_ATTEMPTS = 1000;
const MAX_FILENAME_COMPONENT_BYTES = 255;
const MAX_FOLDER_NAME_BYTES = 252;
const UNTITLED_NOTE_TITLE = 'Untitled';
const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown']);
// note-store.ts:144 EXCLUDED_DIRECTORY_NAMES: Moss's scanner skips these and dot folders (4376-4380), so a note
// folder with such a name would vanish from Moss.
const SKIPPED_FOLDER_NAMES = new Set(['node_modules', '__pycache__', 'bower_components']);
// ipc-handlers.ts:1162-1165
const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mov']);
const FILENAME_UNICODE_WHITESPACE = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;

const encoder = new TextEncoder();

/** @param {string} value */
const byteLength = (value) => encoder.encode(value).length;

/**
 * note-store.ts:653-660 `truncateToByteLimit`: cut to `maxBytes` UTF-8 bytes, then drop a trailing partial
 * character (decoded as U+FFFD) and trailing whitespace.
 * @param {string} value
 * @param {number} maxBytes
 */
const truncateToByteLimit = (value, maxBytes) => {
  if (byteLength(value) <= maxBytes) return value;
  // Whole code points that fit; a lone surrogate encodes as U+FFFD. Decoding the cut bytes, as desktop does, gives
  // the same prefix plus U+FFFD for a partial character, which the replace below drops either way.
  let sliced = '';
  let used = 0;
  for (const char of value) {
    const code = /** @type {number} */ (char.codePointAt(0));
    const lone = code >= 0xd800 && code <= 0xdfff;
    const size = lone ? 3 : code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (used + size > maxBytes) break;
    sliced += lone ? '\uFFFD' : char;
    used += size;
  }
  return sliced.replace(/\uFFFD+$/, '').trimEnd();
};

/**
 * note-store.ts:635-647 `sanitizeFolderComponent` and 662-667 `toFolderBaseName`.
 * @param {string} value
 */
const toFolderBaseName = (value) => {
  let sanitized = value.replace(INVALID_PATH_CHARACTERS, '').replace(/\s+/g, ' ').trim();
  if (sanitized === '.' || sanitized === '..' || sanitized.includes('/') || sanitized.includes('\\')) sanitized = '';
  if (sanitized.length === 0) return UNTITLED_NOTE_TITLE;
  const truncated = truncateToByteLimit(sanitized, MAX_FOLDER_NAME_BYTES);
  return truncated.length > 0 ? truncated : UNTITLED_NOTE_TITLE;
};

/**
 * ipc-handlers.ts:1185-1191 `sanitizeFilename`.
 * @param {string} name
 */
const sanitizeFilename = (name) =>
  name
    .normalize('NFKC')
    .replace(FILENAME_UNICODE_WHITESPACE, ' ')
    // eslint-disable-next-line no-control-regex -- Moss strips control characters
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/^\.+/, '');

/**
 * Node's path.posix.extname for a single path component.
 * @param {string} name
 */
const extname = (name) => {
  let startDot = -1;
  let preDotState = 0;
  for (let i = name.length - 1; i >= 0; i -= 1) {
    if (name[i] === '.') {
      if (startDot === -1) startDot = i;
      else if (preDotState !== 1) preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }
  if (startDot === -1 || preDotState === 0 || (preDotState === 1 && startDot === name.length - 1 && startDot === 1)) return '';
  return name.slice(startDot);
};

/**
 * `assertValidNoteId`'s test (note-store.ts:588-599): the trimmed value matches NOTE_ID_PATTERN.
 * @param {string} value
 */
export function isMossNoteId(value) {
  return typeof value === 'string' && NOTE_ID_PATTERN.test(value.trim());
}

/**
 * The trimmed id, case preserved: desktop keys notePathIndex by it and compares meta.json `id` with ===.
 * @param {string} noteId
 */
export function noteIdKey(noteId) {
  return String(noteId).trim();
}

/**
 * note-store.ts:682-701 `getContentPathCandidates`, as names in the note folder.
 * @param {{ folderName: string; noteId: string }} input
 * @returns {readonly string[]}
 */
export function markdownCandidates({ folderName, noteId }) {
  const normalizedName = folderName.trim();
  const candidates = [`${normalizedName.length > 0 ? normalizedName : UNTITLED_NOTE_TITLE}.md`];
  // Only a valid id names a file; any other string could carry a separator.
  if (typeof noteId === 'string' && isMossNoteId(noteId)) candidates.push(`${noteId.trim()}.md`);
  candidates.push(MOSS_NOTE_FILES.legacyMarkdown);
  return [...new Set(candidates)];
}

/**
 * note-store.ts:714-741, the listing fallback of `resolveContentPathForRead`.
 * @param {readonly { name: string; isFile: boolean; mtimeMs: number }[]} entries
 * @returns {string | null}
 */
export function pickMarkdownFallback(entries) {
  const markdown = entries.filter((entry) => entry.isFile && MARKDOWN_EXTENSIONS.has(extname(entry.name).toLowerCase()));
  if (markdown.length === 0) return null;
  if (markdown.length === 1) return markdown[0].name;
  const sorted = markdown
    .map((entry) => ({ name: entry.name, mtimeMs: entry.mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs || a.name.localeCompare(b.name));
  return sorted[0].name;
}

/**
 * Whether `name` may be a note folder name: a fixed point of desktop's `toFolderBaseName` (so no separator, NUL
 * or control character, not `.` or `..`, no outer or repeated whitespace, at most 252 UTF-8 bytes), and not a name
 * Moss's own scanner skips (a leading dot, node_modules, __pycache__, bower_components).
 * @param {string} name
 */
export function isMossFolderName(name) {
  return (
    typeof name === 'string' &&
    toFolderBaseName(name) === name &&
    !name.startsWith('.') &&
    !SKIPPED_FOLDER_NAMES.has(name)
  );
}

/**
 * Whether `name` may be an asset file name: `<base><ext>` with `ext` one of Moss's media extensions, `base` a
 * fixed point of desktop's `sanitizeFilename` (NFKC, no separator, NUL, control or reserved punctuation, no
 * leading dot), no `..` anywhere (the renderer's `isSafeFilename`), and at most 255 UTF-8 bytes.
 * @param {string} name
 */
export function isMossAssetName(name) {
  if (typeof name !== 'string' || name.includes('..') || byteLength(name) > MAX_FILENAME_COMPONENT_BYTES) return false;
  const ext = extname(name);
  if (!ASSET_EXTENSIONS.has(ext)) return false;
  const base = name.slice(0, name.length - ext.length);
  return base.trim().length > 0 && sanitizeFilename(base) === base;
}

/**
 * note-store.ts:4898-4911 `buildFolderName`.
 * @param {string} base
 * @param {number} suffix
 */
const buildFolderName = (base, suffix) => {
  if (suffix === 0) return truncateToByteLimit(base, MAX_FOLDER_NAME_BYTES);
  const suffixLabel = ` (${suffix})`;
  const maxBaseBytes = Math.max(0, MAX_FOLDER_NAME_BYTES - byteLength(suffixLabel));
  const truncatedBase = truncateToByteLimit(base, maxBaseBytes);
  return `${truncatedBase.length > 0 ? truncatedBase : UNTITLED_NOTE_TITLE}${suffixLabel}`;
};

/**
 * Default APFS and HFS+ compare names case- and normalization-insensitively.
 * @param {string} name
 * @param {boolean} caseInsensitive
 */
const volumeKey = (name, caseInsensitive) => (caseInsensitive ? name.normalize('NFD').toLowerCase() : name);

/**
 * note-store.ts:4943-4985 `allocateFolder` with `noteId`: the first `buildFolderName(desiredName, n)` that is free
 * or is the note's own folder. Throws if `desiredName` fails `isMossFolderName`.
 * @param {{ desiredName: string; currentName: string; siblingNames: readonly string[]; caseInsensitive: boolean }} input
 * @returns {string}
 */
export function allocateFolderName({ desiredName, currentName, siblingNames, caseInsensitive }) {
  if (!isMossFolderName(desiredName)) throw new RangeError(`desiredName ${JSON.stringify(desiredName)} fails isMossFolderName`);
  const own = volumeKey(currentName, caseInsensitive);
  const taken = new Set(siblingNames.map((name) => volumeKey(name, caseInsensitive)));
  for (let attempt = 0; attempt < MAX_FOLDER_ALLOCATION_ATTEMPTS; attempt += 1) {
    const folderName = buildFolderName(desiredName, attempt);
    const key = volumeKey(folderName, caseInsensitive);
    if (key === own) return folderName;
    if (!taken.has(key)) return folderName;
  }
  throw new Error('Unable to allocate a folder for this note');
}

/**
 * note-store.ts:3915-3936 `resolveFolderPathForDirectory`: the note folder's parent relative to the workspace
 * root, segments trimmed, empty segments dropped, joined by `/`.
 * @param {readonly string[]} workspaceSegments the note folder's path relative to the workspace root
 */
export function folderPathFor(workspaceSegments) {
  if (workspaceSegments.length === 0) throw new RangeError('workspaceSegments is empty');
  const normalized = workspaceSegments
    .slice(0, -1)
    .join('/')
    .split(/[/\\]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join('/');
  if (normalized.length > 0) return normalized;
  return workspaceSegments[0] === MOSS_NOTE_FILES.notesRoot ? MOSS_NOTE_FILES.notesRoot : MOSS_NOTE_FILES.trashRoot;
}

/**
 * note-store.ts:1823-1832, `persistFile`'s temp name, for the temp (`tmp`) and holding (`displaced`) files.
 * @param {string} targetName
 * @param {string} uuid a random UUID (crypto.randomUUID())
 * @param {'tmp' | 'displaced'} suffix
 */
export function sidecarFileName(targetName, uuid, suffix) {
  if (!NOTE_ID_PATTERN.test(uuid)) throw new RangeError('uuid must be a UUID');
  if (suffix !== 'tmp' && suffix !== 'displaced') throw new RangeError(`unknown suffix ${JSON.stringify(suffix)}`);
  const tail = `.${uuid}.${suffix}`;
  const maxBaseBytes = Math.max(0, MAX_FILENAME_COMPONENT_BYTES - 1 - byteLength(tail));
  return `.${truncateToByteLimit(targetName, maxBaseBytes) || 'note'}${tail}`;
}

/**
 * `sha256:` + hex sha256 over, for each part: role || 0x00 || (absent ? "-" : decimal byteLength || 0x00 || bytes) || 0x00.
 * @param {readonly { role: string; bytes: Uint8Array | null }[]} parts
 * @returns {Promise<string>}
 */
export async function versionToken(parts) {
  const chunks = [];
  for (const part of parts) {
    chunks.push(encoder.encode(part.role), new Uint8Array([0]));
    if (part.bytes === null) chunks.push(encoder.encode('-'));
    else chunks.push(encoder.encode(String(part.bytes.byteLength)), new Uint8Array([0]), part.bytes);
    chunks.push(new Uint8Array([0]));
  }
  const total = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    total.set(chunk, offset);
    offset += chunk.length;
  }
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', total));
  return `sha256:${Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The API 1 scope rule (docs/design/editor-embed.md section 3). A note is editable only when it is an adopted internal
 * note: under `Notes` but not `Notes/External`, with a meta.json desktop's `readMetadata` accepts (a JSON object
 * with a truthy `id` and `title`, note-store.ts:997-1006) whose `id` is a valid, untrimmed-equal note id.
 * @param {{ workspaceSegments: readonly string[] | null; metaText: string | null; hasMarkdown: boolean }} input
 */
export function noteEditability({ workspaceSegments, metaText, hasMarkdown }) {
  /** @param {'external' | 'unadopted' | 'trashed' | 'noMarkdown' | 'outsideNotes' | 'unreadableMeta'} reason */
  const refuse = (reason) => /** @type {const} */ ({ kind: 'notEditable', reason });
  if (workspaceSegments === null) return refuse('outsideNotes');
  if (workspaceSegments[0] === MOSS_NOTE_FILES.trashRoot) return refuse('trashed');
  if (workspaceSegments[0] !== MOSS_NOTE_FILES.notesRoot || workspaceSegments.length < 2) return refuse('outsideNotes');
  if (workspaceSegments[1] === MOSS_NOTE_FILES.externalFolder) return refuse('external');
  if (metaText === null) return refuse('unadopted');
  let meta;
  try {
    meta = JSON.parse(metaText);
  } catch {
    return refuse('unreadableMeta');
  }
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) return refuse('unreadableMeta');
  if (!meta.id || !meta.title) return refuse('unadopted');
  // A padded id never equals desktop's trimmed lookup key, so desktop cannot find or rename the note by it.
  if (typeof meta.id !== 'string' || !isMossNoteId(meta.id) || meta.id !== meta.id.trim()) return refuse('unadopted');
  if (meta.systemNoteType === 'external' || (typeof meta.externalFilePath === 'string' && meta.externalFilePath.length > 0)) {
    return refuse('external');
  }
  if (meta.trashedAt) return refuse('trashed');
  if (!hasMarkdown) return refuse('noMarkdown');
  return /** @type {const} */ ({ kind: 'editable' });
}
