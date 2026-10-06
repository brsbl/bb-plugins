/**
 * @moss-multi/editor: public host contract, API version 1.
 *
 * This file holds types only. The runtime values it describes
 * (`MOSS_EDITOR_API`, `MOSS_EDITOR_INFO`, `mountMossEditor` and the pure host
 * helpers) are exported by `src/index.ts` (frame entry `moss-editor.js`) and
 * `src/host/moss-editor-host.js` (host entry `moss-editor-host.js`, one
 * self-contained module with no imports). The rationale is in
 * docs/design/editor-embed.md. Line references are to brsbl/moss@762abb777,
 * `packages/desktop/src`.
 *
 * Division of labour:
 * - The editor (this package, running in the bb plugin frame) owns every byte
 *   written to a note. It runs moss's own editor at the vendored pin. It also
 *   ports the main-process steps Moss desktop applies on read (editor-read
 *   migrations, the comment-sidecar fallback) and on save (the legacy footer
 *   strip, marker migration, the meta.json rewrite, the folder-rename
 *   decision). It hands the host final file text that matches Moss desktop's
 *   output exactly.
 * - The host (the bb Moss plugin on the Mac) owns paths, its per-note lock,
 *   version checks, lossless verified replacement of files, the folder rename,
 *   exclusive asset creation, change detection, asset serving and retention
 *   of save receipts. It never parses, normalizes, re-encodes or reformats
 *   note files.
 *
 * What API 1 guarantees about concurrent Moss desktop writes:
 * - bb never destroys bytes Moss wrote. Every byte sequence a bb write
 *   displaces is either verified as the expected state, put back, or kept as
 *   a preserved file that is reported to the editor (`MossNoteWrite`).
 * - bb cannot stop Moss from replacing bytes bb wrote. Moss checks its
 *   expected content under an in-process lock and then renames
 *   unconditionally, an unbounded time later, and a Moss window holding
 *   unsaved edits rebases "user wins" on its next save by design. So a bb
 *   save can be replaced by Moss at any later time, including after the
 *   editor has unmounted. API 1 makes such a loss recoverable, not
 *   impossible: every `saved` result and event carries a `receipt` (the exact
 *   bytes saved) that the host retains, and a mounted editor additionally
 *   shows a best-effort notice when a replacement arrives within
 *   `recentSaveGuardMs` of its save. Neither is a detection guarantee.
 *
 * Compatibility rules for API 1:
 * - `MOSS_EDITOR_API` stays `1` for every release that implements this file.
 *   Removing or renaming a field, narrowing a type, or changing a default or a
 *   meaning is a breaking change and requires API 2.
 * - Additive changes keep API 1. They are negotiated by feature strings, not
 *   assumed:
 *   - The editor declares its features in `MOSS_EDITOR_INFO.features`, which
 *     is also published in `editor.json` `features`. A host may return a new
 *     result `kind` or `reason`, or send a new notification `kind`, only if
 *     the editor it mounted lists the feature that introduced it.
 *   - The host declares its features in `MossEditorBridge.features`. The
 *     editor sends a new write op, calls a new optional bridge method, or
 *     relies on a new host behaviour only if the bridge lists the feature that
 *     introduced it.
 *   - The editor adds a new `MossEditorEvent` kind, a new `MossFlushResult`
 *     kind or a new `MossReloadResult` kind only behind a host feature string
 *     the host listed. Hosts may therefore switch exhaustively on every union
 *     in this file.
 *   - API 1's baseline has no feature strings. Everything in this file is
 *     required of both sides unless it is marked optional.
 * - Hosts must ignore unknown event fields and unknown manifest fields. The
 *   editor ignores unknown option fields.
 * - A result `kind` the editor does not know is treated as an error for that
 *   operation, and the edits stay unsaved. Feature negotiation exists so that
 *   this never happens between compliant peers.
 */
/** The contract version. Always `1` for releases that implement this file. */
export type MossEditorApiVersion = 1;
/**
 * A feature string introduced by a later API-1 release, for example
 * `'scope.external'`. The baseline defines none. Each feature is documented
 * where it is introduced, together with the kinds, ops or methods it unlocks.
 */
export type MossEditorFeature = string;
/** Identity of a built editor. Equal to the matching fields of `editor.json`. */
export interface MossEditorInfo {
    readonly api: MossEditorApiVersion;
    /** Package semver, for example `0.1.0`. */
    readonly version: string;
    /** Features this editor implements. Empty in the baseline. */
    readonly features: readonly MossEditorFeature[];
}
/**
 * Exports of the frame entry `moss-editor.js`. Importing it also loads
 * `moss-editor.css` and the Prism global as side effects, as the viewer does.
 */
export interface MossEditorModule {
    readonly MOSS_EDITOR_API: MossEditorApiVersion;
    readonly MOSS_EDITOR_INFO: MossEditorInfo;
    readonly mountMossEditor: MountMossEditor;
}
/**
 * Exports of the host entry `moss-editor-host.js`: one ES2022 module with no
 * imports, whose only globals are `TextEncoder` and `crypto.subtle`. It runs
 * in any ES2022 runtime (Node, Bun, a JSC context). These pure functions
 * encode Moss desktop's file rules at the pin, so the host does not
 * reimplement them; CI holds each one to desktop's own code. None of them
 * touches the filesystem: where desktop asks the filesystem, the host does
 * the probing and the helper supplies the order and the rules. It ships as
 * the `moss-editor-host` artifact (`editor-host.json` records its version,
 * API, source commit and per-file SHA-256).
 */
export interface MossEditorHostModule {
    readonly MOSS_EDITOR_API: MossEditorApiVersion;
    readonly MOSS_EDITOR_INFO: MossEditorInfo;
    /** File and folder names Moss uses. */
    readonly MOSS_NOTE_FILES: MossNoteFileNames;
    /**
     * Moss's `NOTE_ID_PATTERN` test after trimming, as `assertValidNoteId` does
     * (note-store.ts:96-97, 588-598): 8-4-4-4-12 hex, either case, any UUID
     * version.
     */
    isMossNoteId(value: string): boolean;
    /**
     * The lookup key for a note id: the id trimmed, with case preserved. This
     * matches Moss desktop, which keys `notePathIndex` by the trimmed id and
     * compares meta.json `id` with strict equality (note-store.ts:4990-5032).
     * Two ids that differ only in case are two different notes. The host keys
     * its id-to-folder index by this value and applies it to every incoming
     * `noteId`. If two folders carry the same key, the note is not editable
     * (`duplicateId`).
     */
    noteIdKey(noteId: MossNoteId): string;
    /**
     * Step 1 of Moss's markdown-file resolution (`getContentPathCandidates`,
     * note-store.ts:688-701): the candidate names, in order and de-duplicated:
     * `<trimmed folderName or 'Untitled'>.md`, then `<trimmed noteId>.md`, then
     * `note.md`. The id candidate appears only when `isMossNoteId(noteId)`.
     *
     * The host probes each candidate in order with `stat` on the note folder
     * (desktop's `pathExists`, note-store.ts:669-677: ENOENT means absent,
     * symlinks followed) and takes the first that exists. It must probe rather
     * than compare names against a directory listing, because on a
     * case-insensitive volume (default APFS and HFS+) the filesystem decides:
     * `Plan.md` exists when the entry is spelled `plan.md`. The resolved name
     * is the candidate's own spelling (`Plan.md`), exactly as desktop returns
     * the candidate path; it goes into `MossNoteLocation.markdownName`.
     *
     * Only if no candidate exists does the host list the folder and call
     * `pickMarkdownFallback`.
     */
    markdownCandidates(input: MossMarkdownCandidatesInput): readonly string[];
    /**
     * Step 2 of Moss's markdown-file resolution, used only when no candidate
     * from `markdownCandidates` exists (note-store.ts:714-741): among the
     * folder's regular files whose lowercased extension is `.md` or
     * `.markdown`, the only one, or else the newest by `mtimeMs` with ties
     * broken by `localeCompare` of the name. Returns the entry's name as
     * listed, or null if there is none.
     */
    pickMarkdownFallback(entries: readonly MossFolderEntry[]): string | null;
    /**
     * Moss's unique-folder-name allocation (`allocateFolder` with `noteId`,
     * note-store.ts:4943-4985, and `buildFolderName`'s ` (n)` suffixes within
     * the 252-byte folder limit, 4898-4911). Truncation is by UTF-8 bytes, and
     * a character cut in half (U+FFFD) and trailing whitespace are dropped
     * before the suffix, as `truncateToByteLimit` does. Returns the name to
     * rename to. It equals `currentName` when no rename is needed. Throws a
     * RangeError if `desiredName` fails `isMossFolderName`. See
     * `MossFolderRename` for how the host applies it.
     */
    allocateFolderName(input: MossAllocateFolderNameInput): string;
    /**
     * Moss's `folderPath` for a note folder (`resolveFolderPathForDirectory`):
     * the parent directory relative to the workspace root, as POSIX segments
     * joined by `/`. For example `Notes/Projects` for `~/Moss/Notes/Projects/Plan`.
     */
    folderPathFor(workspaceSegments: readonly string[]): string;
    /**
     * The temp, holding or preserved file name for `targetName`, exactly as
     * `persistFile` builds its temp name (note-store.ts:1819-1832):
     * `.<base><suffix>`, where `suffix` is `.<uuid>.tmp` (temp) or
     * `.<uuid>.displaced` (holding and preserved files), and `base` is
     * `targetName` truncated by UTF-8 bytes so that the whole name fits in 255
     * bytes, with a trailing partial multibyte sequence (U+FFFD) and trailing
     * whitespace removed, as `truncateToByteLimit` does (note-store.ts:653-660).
     * An empty base becomes `note`. `uuid` must be a UUID
     * (`crypto.randomUUID()`); anything else throws a RangeError. Hosts must use this; a naive
     * `.<name>.<uuid>.tmp` overflows the 255-byte limit for valid 252-byte
     * folder names and fails every save with ENAMETOOLONG.
     */
    sidecarFileName(targetName: string, uuid: string, suffix: 'tmp' | 'displaced'): string;
    /**
     * The recommended version token over the given byte states, computed with
     * `crypto.subtle` and therefore asynchronous (see
     * `MossNoteVersion`, `MossMetaVersion` and `MossCompanionVersion` for which
     * states go in). Hosts may use any other deterministic token.
     */
    versionToken(parts: readonly MossVersionPart[]): Promise<string>;
    /**
     * Whether API 1 may edit a note under the v0 scope rules. The host must call
     * this before mounting, and `read`, `write` and `assets.put` must apply the
     * same answer. It covers file rules only; the host adds `duplicateId` and
     * `hostUnsupported` itself.
     */
    noteEditability(input: MossEditabilityInput): MossEditability;
    /**
     * The filename check every `MossFolderRename.desiredName` must pass; the
     * host re-validates and never trusts the editor's string. True exactly when
     * `name` is a fixed point of desktop's `toFolderBaseName`
     * (`sanitizeFolderComponent`, note-store.ts:635-667): no `/`, `\`, NUL,
     * control or `<>:"|?*` character, not `.` or `..`, no leading, trailing or
     * repeated whitespace, at most 252 UTF-8 bytes. It also refuses a leading
     * dot and `node_modules`, `__pycache__` and `bower_components`, which
     * desktop would create but its own scanner then skips (4376-4380).
     */
    isMossFolderName(name: string): boolean;
    /**
     * The filename check every asset `name` (`MossAssetPut`, `MossAssetCopy`)
     * must pass; the host re-validates. True exactly when `name` is
     * `<base><ext>` with `ext` a `MossAssetExtension`, `base` a fixed point of
     * desktop's `sanitizeFilename` (ipc-handlers.ts:1185-1191: NFKC, no
     * separator, NUL, control, `<>:"|?*` or Unicode space, no leading dot) with
     * non-blank content, no `..` anywhere (the renderer's `isSafeFilename`) and
     * at most 255 UTF-8 bytes. Every name `buildImageFilename` produces passes,
     * except one whose original base contains `..` or that overflows 255 bytes;
     * for those the editor names the file from the base `image`.
     */
    isMossAssetName(name: string): boolean;
}
export interface MossNoteFileNames {
    /** Moss workspace subfolder holding live notes: `~/Moss/Notes`. */
    readonly notesRoot: 'Notes';
    /** Moss workspace subfolder holding trashed notes: `~/Moss/Trash`, a sibling of `Notes`. */
    readonly trashRoot: 'Trash';
    /** Subfolder of `Notes` holding external-file mirrors. */
    readonly externalFolder: 'External';
    readonly meta: 'meta.json';
    readonly comments: 'comments.json';
    readonly layout: 'layout.json';
    readonly legacyMarkdown: 'note.md';
    readonly folderMeta: '.folder.json';
    /** Asset directory inside the note folder. References are `assets/<name>`. */
    readonly assetsDir: 'assets';
}
export interface MossMarkdownCandidatesInput {
    /** Basename of the note folder. */
    folderName: string;
    /** meta.json `id`. */
    noteId: MossNoteId;
}
/** A direct entry of the note folder, as listed by the host. */
export interface MossFolderEntry {
    name: string;
    /** False for directories, symlinks to directories and other non-regular entries. */
    isFile: boolean;
    /** 0 if the host could not stat the entry, as desktop does. */
    mtimeMs: number;
}
export interface MossAllocateFolderNameInput {
    /** `MossFolderRename.desiredName`. */
    desiredName: string;
    /** The note folder's current basename. */
    currentName: string;
    /** Every other entry in the note folder's parent, excluding the note's own folder. */
    siblingNames: readonly string[];
    /**
     * Whether the parent's volume compares names case- and
     * normalization-insensitively (default APFS and HFS+ do). When true, names
     * compare by `normalize('NFD').toLowerCase()`: a sibling that differs only
     * in case or Unicode normalization is taken, and a desired name that
     * differs from `currentName` only that way is returned as is (a case-only
     * rename), as desktop's `pathExists` plus same-id check produce.
     */
    caseInsensitive: boolean;
}
/** One input to `versionToken`: a role name and its byte state (`null` = absent). */
export interface MossVersionPart {
    role: string;
    bytes: Uint8Array | null;
}
export interface MossEditabilityInput {
    /**
     * Path of the note folder relative to the Moss workspace root (`~/Moss`),
     * as POSIX segments. For example `['Notes', 'Projects', 'Plan']` for
     * `~/Moss/Notes/Projects/Plan`, or `['Trash', 'Old']` for a trashed note.
     * Null if the folder is not inside the workspace root.
     */
    workspaceSegments: readonly string[] | null;
    /** Raw meta.json text, or null if the folder has no meta.json. */
    metaText: string | null;
    /** Whether the two-step markdown resolution found a markdown file. */
    hasMarkdown: boolean;
}
export type MossEditability = {
    kind: 'editable';
} | {
    kind: 'notEditable';
    reason: MossNotEditableReason;
};
/**
 * Why API 1 refuses to edit a note. Hosts should show such notes in the
 * read-only viewer instead.
 * - `external`: meta.json has `systemNoteType: 'external'` or
 *   `externalFilePath`, or the folder is under `Notes/External`. Sidecars are
 *   split between the source folder and the mirror folder, and markdown image
 *   refs are delocalized on save. Gated behind a future `'scope.external'`
 *   feature.
 * - `unadopted`: no meta.json; or meta.json lacks a truthy `id` or `title`,
 *   which desktop's `readMetadata` rejects (note-store.ts:1003-1005); or `id`
 *   fails `isMossNoteId` or has surrounding whitespace (desktop compares the
 *   raw `id` with the trimmed key, so it cannot find or rename such a note).
 *   Moss would adopt the note on open, which rewrites its frontmatter. bb
 *   must not do that.
 * - `trashed`: the folder is under `~/Moss/Trash` (`workspaceSegments[0]` is
 *   `'Trash'`), or meta.json `trashedAt` is truthy, as desktop tests it. A user folder named
 *   `Notes/Trash` is an ordinary folder and is editable.
 * - `noMarkdown`: the folder has no resolvable markdown file.
 * - `outsideNotes`: not under `~/Moss/Notes`, for example a loose `.md`
 *   anywhere else, or `workspaceSegments` is null. It is also returned for the
 *   `Notes` root itself and for folder containers, which Moss never adopts.
 * - `unreadableMeta`: meta.json exists but is not a JSON object (including a
 *   leading BOM, which `JSON.parse` rejects as desktop's read does).
 * - `duplicateId`: (host) two folders carry the same `noteIdKey`.
 * - `hostUnsupported`: (host) the host cannot perform the verified
 *   replacement `MossNoteWrite` requires (an atomic exchange of two paths and
 *   an exclusive rename) on the note's volume, for example on a filesystem
 *   that returns ENOTSUP for `renamex_np(RENAME_SWAP)`, or on a platform
 *   without an equivalent. Such a host must not offer editing at all.
 */
export type MossNotEditableReason = 'external' | 'unadopted' | 'trashed' | 'noMarkdown' | 'outsideNotes' | 'unreadableMeta' | 'duplicateId' | 'hostUnsupported';
/**
 * Mounts moss's editor for one note into `element` and returns at once. The
 * first read and render happen asynchronously; await `handle.ready`.
 * A page may hold several mounts for different notes. A host must not mount
 * the same note (by `noteIdKey`) twice at the same time, because the two
 * mounts would conflict with each other like two separate apps.
 */
export type MountMossEditor = (element: HTMLElement, options: MossEditorOptions) => MossEditorHandle;
export type MossEditorTheme = 'light' | 'dark';
/**
 * meta.json `id`: an 8-4-4-4-12 hex string (Moss's `NOTE_ID_PATTERN`). It is
 * the only key that stays stable when Moss desktop or this editor renames a
 * note's folder and markdown file after a title edit. The editor never parses
 * it as a path and passes it to the bridge exactly as given. The host looks it
 * up by `noteIdKey` (trimmed, case preserved) on every bridge call.
 */
export type MossNoteId = string;
export interface MossEditorOptions {
    /** meta.json `id` of the note to edit. */
    noteId: MossNoteId;
    /** File access for this note. One bridge object may serve every mount on the page. */
    bridge: MossEditorBridge;
    /** Default `'light'`. */
    theme?: MossEditorTheme;
    /** Optional host services, with the same shapes as the viewer's. */
    services?: MossEditorServices;
    /**
     * URL of the host-served moss-html frame: the tarball's
     * `editor.json` `htmlFrame.file`, served with the response header
     * `Content-Security-Policy: <htmlFrame.policy>` (`sandbox allow-scripts`).
     * moss-html blocks load it and receive their HTML by `postMessage`, the same
     * protocol as moss-multi's web `/frame/html` (SP13). A `data:` frame
     * inherits the editor frame's CSP, so a block's own scripts cannot run
     * there. If omitted, moss-html blocks render in moss's `data:` frames with
     * their scripts blocked.
     */
    htmlFrameUrl?: string;
    /**
     * Receives every editor event from mount until `unmount()` tears down. It is
     * called synchronously inside the editor. Exceptions it throws are caught
     * and logged, and never affect saving.
     */
    onEvent?: (event: MossEditorEvent) => void;
    /**
     * Edits to reopen: a `draft` from a failed `MossFlushResult`, a `reloaded`
     * event's `overwrittenSave`, or a `receipt` the host retained from a
     * `saved` result or event. The editor reads the note, then:
     * - if every content file on disk equals the draft's bytes, it opens clean
     *   (the draft is already on disk) and re-applies only the draft's
     *   `intents` if they differ from meta.json;
     * - else if the disk content version equals `draft.baseVersion` and every
     *   companion version matches, it opens with the draft as dirty edits;
     * - otherwise it opens in `conflict` (cause `external`), with the draft as
     *   the local side, so the user can Reload or Overwrite.
     * It is ignored, with an `error` event (`op: 'read'`), if `draft.noteId`
     * names another note.
     */
    restoreDraft?: MossDraft;
}
/** Services the editor may call outside the file bridge. Every member is optional; a missing one disables its feature. */
export interface MossEditorServices {
    /** Notes that wiki links and the `[[` picker resolve against. `id` is meta.json `id`. */
    notes?(): readonly MossEditorNote[] | Promise<readonly MossEditorNote[]>;
    /** The user followed a wiki link or a web link (Cmd+click or the link card). */
    navigate?(target: MossEditorTarget): void;
    /** Link-card and embed metadata. The frame has no network access of its own. */
    unfurl?(url: string): Promise<MossEditorUnfurl | null>;
}
/** Same shape as `MossViewerNote`. */
export interface MossEditorNote {
    id: MossNoteId;
    title: string;
    /** Moss folder path (`Notes/...`). */
    folderPath?: string;
    /** Unix seconds. */
    updatedAt?: number;
    headings?: readonly string[];
}
/** Same shape as `MossViewerTarget`. */
export type MossEditorTarget = {
    kind: 'note';
    noteId: MossNoteId;
    heading: string | null;
} | {
    kind: 'url';
    url: string;
    title: string;
};
/** Same shape as `MossViewerUnfurl`. `image` and `siteIcon` resolve through `bridge.assets.url`. */
export interface MossEditorUnfurl {
    status?: 'resolved' | 'unavailable';
    title?: string;
    description?: string;
    providerName?: string;
    authorName?: string;
    image?: string;
    siteIcon?: string;
    height?: number;
}
/**
 * Save state as the host UI should show it.
 * - `loading`: the first read is in progress. The editor is not editable, so
 *   no edits can exist yet.
 * - `notLoaded`: the first read failed (`ready` rejected). Nothing was read,
 *   nothing can be edited, and nothing will be written.
 * - `clean`: the editor matches the last version read or saved.
 * - `dirty`: unsaved edits; an autosave is scheduled.
 * - `saving`: a write is in flight.
 * - `conflict`: unsaved edits, and the files changed on disk. The editor shows
 *   "Changed in Moss" and keeps the edits unsaved until the user chooses.
 * - `error`: the last read or write failed, or meta retries ran out. Edits are
 *   kept and retried.
 * - `removed`: the note no longer exists or is no longer editable. The editor
 *   is read-only. Any unsaved edits remain in memory and are returned as a
 *   draft by `flush()` and `unmount()`.
 * - `unmounted`: `unmount()` has torn the editor down.
 */
export type MossEditorStatus = 'loading' | 'notLoaded' | 'clean' | 'dirty' | 'saving' | 'conflict' | 'error' | 'removed' | 'unmounted';
export interface MossEditorHandle {
    readonly info: MossEditorInfo;
    readonly noteId: MossNoteId;
    /** Current status. Changes are also announced through `onEvent`. */
    readonly status: MossEditorStatus;
    /** Where the note sits now: from the last read, or from the last `saved` result after a rename. Null until the first read succeeds. */
    readonly location: MossNoteLocation | null;
    /**
     * Resolves when the note has been read and its body rendered, and the editor
     * accepts input. Rejects with a `MossEditorError`: `notFound`,
     * `notEditable`, `apiMismatch` or `readFailed` if the first read failed
     * (status `notLoaded`, the element holds an error placeholder), or
     * `unmounted` if `unmount()` was called first.
     */
    readonly ready: Promise<void>;
    setTheme(theme: MossEditorTheme): void;
    /**
     * Saves now, bypassing the debounce, and resolves when every edit present
     * at the moment of the call is on disk or has definitively failed to save.
     *
     * Before the first read settles, it waits for `ready`. If the first read
     * failed (status `notLoaded`), it resolves `{kind: 'notLoaded'}` at once.
     *
     * Coverage: before taking its snapshot, the editor commits pending drafts
     * that Moss desktop also commits before saving (a focused title field and
     * decorator drafts such as an open table cell or code block). The call
     * covers the resulting revision R. If a write that started before R is in
     * flight, the editor waits for it and then writes again if R is not yet
     * covered. Two calls made at the same revision share one write. A `saved`
     * result guarantees that R was on disk when the write completed; edits made
     * after the call may still be pending, in which case `status` is `dirty`.
     *
     * Never rejects. Call it before hiding, suspending or destroying the frame,
     * and on app quit. It replaces Moss desktop's awaited `onRequestFlush`.
     */
    flush(): Promise<MossFlushResult>;
    /**
     * Re-reads the note from the bridge and replaces the editor content,
     * keeping selection and scroll where the new text allows. If the editor has
     * unsaved edits, it refuses unless `discardUnsaved` is true. Before the
     * first read settles, it waits for `ready`; after a failed first read it
     * resolves `{kind: 'notLoaded'}` (remount to retry).
     */
    reload(options?: MossReloadOptions): Promise<MossReloadResult>;
    /**
     * Flushes and, only if nothing is left unsaved, tears down.
     *
     * 1. Makes the editor read-only.
     * 2. Flushes, as `flush()`.
     * 3. If the flush result is `clean`, `saved` or `notLoaded`, or
     *    `discardUnsaved` is true: unsubscribes from `bridge.watch`, tears down
     *    React and listeners, clears `element`, and resolves
     *    `{kind: 'unmounted', flush}`.
     * 4. Otherwise it does not tear down. It makes the editor editable again
     *    (unless the status is `removed`), leaves the conflict or error UI in
     *    place, and resolves `{kind: 'kept', flush}`. The failed flush result
     *    carries a `draft` the host can store and pass back as
     *    `restoreDraft` on a later mount.
     *
     * While the first read is still in progress, `unmount` abandons it (any
     * late result is discarded, nothing is written), `ready` rejects with code
     * `unmounted`, and it resolves `{kind: 'unmounted', flush: {kind:
     * 'notLoaded'}}`.
     *
     * Concurrent calls share one attempt. After `kept`, a later call makes a
     * new attempt. After `unmounted`, every call returns the same result.
     * The host must keep `element` in the DOM and the bridge alive until the
     * promise settles. Recommended host sequence: `flush()`, inspect the
     * result, resolve or store the draft, then `unmount()`.
     *
     * After teardown the editor no longer watches the note. Protection of the
     * last save against a later Moss overwrite is the host's `receipt`
     * retention (see the file header), not the editor's.
     */
    unmount(options?: MossUnmountOptions): Promise<MossUnmountResult>;
}
export interface MossReloadOptions {
    /** Default false. */
    discardUnsaved?: boolean;
}
export interface MossUnmountOptions {
    /**
     * Default false. When true, `unmount` tears down even if the final flush
     * failed. The failed result still carries the `draft`, so the host can
     * keep it.
     */
    discardUnsaved?: boolean;
}
export type MossUnmountResult = {
    kind: 'unmounted';
    flush: MossFlushResult;
}
/** The final flush left edits unsaved and `discardUnsaved` was not set. The editor is still mounted. */
 | {
    kind: 'kept';
    flush: MossFlushFailure;
};
export type MossReloadResult = {
    kind: 'reloaded';
    version: MossNoteVersion;
} | {
    kind: 'refused';
    reason: 'dirty';
} | {
    kind: 'removed';
    reason: 'notFound' | MossNotEditableReason;
}
/** The first read failed; the mount never loaded a note. */
 | {
    kind: 'notLoaded';
} | {
    kind: 'error';
    error: unknown;
};
/**
 * meta.json inputs that cannot be recovered from the three content files.
 * Desktop's renderer sends them as separate `updateNote` inputs on every save
 * (CanvasAreaContent.tsx:2645-2652, 2849-2853). The editor keeps them as
 * inputs, not as meta.json bytes, and re-derives meta.json from the latest
 * meta.json text on every write, so a meta-conflict retry or a restored
 * draft never reverts metadata changed elsewhere. The two fields follow
 * desktop's two different rules:
 */
export interface MossMetaIntents {
    /**
     * Pending per-field frontmatter provenance, MERGED into meta.json
     * `frontmatterMeta` key by key (note-store.ts:10307-10314). Empty when
     * nothing is pending. Same shape as desktop's `FrontmatterMetaMap`.
     */
    frontmatterMetaUpdates: Record<string, MossFrontmatterFieldMeta>;
    /**
     * The full color map of the editor's current comments: every comment id
     * with a color, mapped to its color index. It REPLACES meta.json
     * `commentColors` on every write (desktop filters the map to non-negative
     * integers and assigns it without spreading the old map,
     * note-store.ts:10356-10363). An empty object writes `commentColors: {}`,
     * for example after the last colored comment is deleted.
     */
    commentColors: Record<string, number>;
}
/** Desktop's `FrontmatterFieldMeta` (noteTypes.ts:293-301). */
export interface MossFrontmatterFieldMeta {
    source: 'user' | 'inferred' | 'user-removed';
    /** Unix seconds. */
    lastModified: number;
    missedInferenceCount?: number;
}
/**
 * A complete set of editor content, so edits survive the editor. Content
 * texts are final bytes, as they would go to `write`; meta.json is carried
 * as intents and re-derived on restore. Used for unsaved edits (`draft`) and
 * for the bytes of a completed save (`receipt`).
 */
export interface MossDraft {
    noteId: MossNoteId;
    /**
     * The content version the edits were made on. For a `receipt`, the version
     * the save replaced, so restoring a receipt over a later disk state opens
     * in `conflict` rather than overwriting silently.
     */
    baseVersion: MossNoteVersion;
    /** The companion versions the migrated markdown was built from. */
    companions: readonly MossCompanionExpectation[];
    /** The full note content as the editor holds it. `null` sidecars would be deleted. */
    files: {
        markdown: string;
        comments: string | null;
        layout: string | null;
    };
    /** meta.json inputs, as of the draft. */
    intents: MossMetaIntents;
    /** `Date.now()` when the draft was taken. */
    at: number;
}
export type MossFlushResult = 
/** Nothing was pending. */
{
    kind: 'clean';
    version: MossNoteVersion;
}
/**
 * Every edit present at the call is on disk. `receipt` holds the exact
 * bytes of the last write that covered them; the host should retain it
 * (see `saved` events).
 */
 | {
    kind: 'saved';
    version: MossNoteVersion;
    receipt: MossDraft;
}
/** The first read failed or was abandoned; there was never anything to save. */
 | {
    kind: 'notLoaded';
} | MossFlushFailure;
/** A flush that left edits unsaved. Each variant carries the unsaved draft. */
export type MossFlushFailure = 
/** The files changed on disk, before or during the write; the user must choose. */
{
    kind: 'conflict';
    draft: MossDraft;
    preserved: readonly string[];
}
/** The note is gone or no longer editable. */
 | {
    kind: 'removed';
    reason: 'notFound' | MossNotEditableReason;
    draft: MossDraft;
}
/**
 * The write failed with an I/O error or the bridge rejected, or meta
 * retries ran out. `failure` is the host's typed `failed` write result when
 * there was one (null for a rejection or exhausted meta retries); its
 * `preserved` files hold displaced Moss bytes and must be shown to the user.
 */
 | {
    kind: 'error';
    error: unknown;
    failure: MossWriteFailed | null;
    draft: MossDraft;
};
/**
 * Thrown from `ready`. Its `name` is `'MossEditorError'`. When `cause` is set,
 * it is the bridge's original error.
 */
export interface MossEditorError extends Error {
    readonly name: 'MossEditorError';
    readonly code: 'notFound' | 'notEditable' | 'apiMismatch' | 'readFailed' | 'unmounted';
    /** Set when `code` is `notEditable`. */
    readonly reason?: MossNotEditableReason;
}
/**
 * Editor events, delivered through `MossEditorOptions.onEvent`. Every event
 * carries `noteId` and the resulting `status`.
 */
export type MossEditorEvent = 
/** First unsaved edit after a clean state. Not repeated on later keystrokes. */
{
    kind: 'dirty';
    noteId: MossNoteId;
    status: 'dirty';
} | {
    kind: 'saving';
    noteId: MossNoteId;
    status: 'saving';
}
/**
 * A write succeeded. `status` is `dirty` if the user typed during the write.
 * `files` lists the files the write touched, so the host can log them.
 * The host should retain `receipt` per note (at least the latest one, for
 * a host-defined period that outlives the mount) and offer it as
 * `restoreDraft` if the user reports or the host notices that Moss
 * replaced the save.
 */
 | {
    kind: 'saved';
    noteId: MossNoteId;
    status: 'clean' | 'dirty';
    version: MossNoteVersion;
    files: readonly MossNoteFile[];
    /** Where the note sits after the write. */
    location: MossNoteLocation;
    /** True if the folder (and so the markdown file) was renamed by this write. */
    renamed: boolean;
    /** The exact bytes this write put on disk, as a draft based on the replaced version. */
    receipt: MossDraft;
    /** `Date.now()` when the bridge confirmed. */
    at: number;
}
/**
 * The disk changed under unsaved edits. `cause` `external` comes from
 * `bridge.watch` or a stale `restoreDraft`; `refused` comes from a write the
 * host refused (`content`, `companion`) or detected as `raced`. A `meta`
 * conflict never produces this event.
 */
 | {
    kind: 'conflict';
    noteId: MossNoteId;
    status: 'conflict';
    cause: 'external' | 'refused';
    /** Paths of displaced bytes the host preserved during a `raced` write, relative to the note folder. */
    preserved: readonly string[];
}
/**
 * The conflict ended. `reloaded` dropped the local edits. `overwritten`
 * saved them over the disk version at the user's explicit request.
 */
 | {
    kind: 'conflictResolved';
    noteId: MossNoteId;
    status: 'clean' | 'dirty' | 'saving';
    resolution: 'reloaded' | 'overwritten';
}
/**
 * The content was replaced from disk: an external change into a clean
 * editor, or `handle.reload()`.
 * `overwrittenSave` is a best-effort heuristic, not a guarantee: it is
 * non-null when an external change replaced content this editor saved less
 * than `recentSaveGuardMs` earlier, the typical signature of Moss desktop
 * finishing a save it had checked before bb's write landed. The editor
 * shows a non-blocking "Moss replaced your last save" notice with Restore,
 * which re-applies the draft on the new version (opening a conflict if
 * needed). A later replacement, or one after unmount, is not flagged; the
 * host's retained `receipt` covers those.
 */
 | {
    kind: 'reloaded';
    noteId: MossNoteId;
    status: 'clean';
    version: MossNoteVersion;
    cause: 'external' | 'host' | 'conflict';
    overwrittenSave: MossDraft | null;
} | {
    kind: 'removed';
    noteId: MossNoteId;
    status: 'removed';
    reason: 'notFound' | MossNotEditableReason;
    hadUnsavedEdits: boolean;
}
/**
 * A bridge call rejected, returned `failed`, returned a `kind` the editor
 * does not know, or meta retries ran out (`op: 'write'`, `message` names
 * it). The first read failing is reported by `ready`, with this event
 * (`op: 'read'`, `willRetry: false`). `willRetry` is true for writes: the
 * editor keeps the edits and retries on the next edit, the next flush, or
 * after `errorRetryMs`. `failure` carries a typed `failed` write result;
 * the editor shows its `preserved` paths to the user.
 */
 | {
    kind: 'error';
    noteId: MossNoteId;
    status: 'error' | 'notLoaded';
    op: 'read' | 'readCompanion' | 'write' | 'assetPut' | 'assetCopy';
    message: string;
    error: unknown;
    failure: MossWriteFailed | null;
    willRetry: boolean;
};
/**
 * Autosave timing constants. They are fixed by the editor and not
 * configurable in API 1. The type of each member is its value.
 */
export interface MossEditorTiming {
    /** 1500 ms. Each edit restarts the idle save timer (`EDIT_IDLE_AUTOSAVE_DELAY_MS`). */
    readonly idleSaveMs: 1500;
    /**
     * 15000 ms (`EDIT_MAX_UNSAVED_WINDOW_MS`), applied exactly as desktop does
     * (CanvasAreaContent.tsx:1242-1265): when an edit arrives and at least this
     * long has passed since the first unsaved edit, it saves immediately
     * instead of restarting the idle timer. It is checked only on edits, so
     * the longest gap before a save is just under `maxUnsavedMs + idleSaveMs`
     * (an edit at 14.9 s saves at about 16.4 s). It is not a hard deadline.
     */
    readonly maxUnsavedMs: 15000;
    /** 1800000 ms. Safety-net save while dirty (`PERIODIC_SAVE_INTERVAL_MS`). */
    readonly periodicSaveMs: 1800000;
    /** 200 ms. Debounce applied to `bridge.watch` notifications before re-reading. */
    readonly externalChangeDebounceMs: 200;
    /** 5000 ms. Retry delay after a write fails or meta retries run out. */
    readonly errorRetryMs: 5000;
    /** 3. Immediate automatic re-read, re-derive and retry attempts after a `meta` conflict. */
    readonly metaConflictRetries: 3;
    /**
     * 5000 ms. An external change this soon after a save carries
     * `overwrittenSave`. A heuristic window only; Moss can replace a bb save
     * later than this.
     */
    readonly recentSaveGuardMs: 5000;
}
/**
 * Note file roles. The host maps each role to a path in the note folder
 * (`~/Moss/Notes/.../<Folder>/` for an internal note):
 * - `markdown`: read from the two-step resolution (`markdownCandidates`
 *   probed in order, then `pickMarkdownFallback`); always written to
 *   `<folderName>.md` (see `MossNoteWrite`).
 * - `comments`: `comments.json`.
 * - `layout`: `layout.json`.
 * - `meta`: `meta.json`.
 */
export type MossNoteFile = 'markdown' | 'comments' | 'layout' | 'meta';
/** Sidecars that may be absent and that a save may delete. */
export type MossDeletableNoteFile = 'comments' | 'layout';
/**
 * Opaque token for the note's content state. It covers exactly three byte
 * states, each including whether the file exists:
 * 1. the markdown file the resolution chose (its bytes, not its name);
 * 2. `<note folder>/comments.json`;
 * 3. `<note folder>/layout.json`.
 * Nothing else: not meta.json, not file names or mtimes, not assets, not
 * companion files. Recommended: `versionToken([{role:'markdown',…},
 * {role:'comments',…}, {role:'layout',…}])`. The editor only compares tokens
 * for equality and echoes them back. Identical bytes must yield the same token.
 */
export type MossNoteVersion = string;
/**
 * Opaque token over exactly two states: meta.json's bytes, and the note's
 * `folderPath` (`folderPathFor`) as UTF-8. Recommended:
 * `versionToken([{role:'meta',…}, {role:'folderPath',…}])`. Moss derives
 * meta.json `folderPath` from where the folder actually sits, so a note moved
 * in Finder needs new meta.json bytes even when every file is unchanged.
 */
export type MossMetaVersion = string;
/**
 * Opaque token over one companion file's byte state (absence included).
 * Recommended: `versionToken([{role:'companion', bytes}])`.
 */
export type MossCompanionVersion = string;
/**
 * Raw file text. The host decodes bytes as UTF-8 exactly as Node's
 * `buffer.toString('utf8')` does: it keeps a leading BOM as U+FEFF, replaces
 * invalid sequences with U+FFFD, and leaves line endings untouched.
 * `null` means the file does not exist. An empty file is `''`, not `null`.
 */
export interface MossNoteFiles {
    markdown: string;
    comments: string | null;
    layout: string | null;
    meta: string;
}
/** Where the note sits. Returned by `read` and by every `saved` write. */
export interface MossNoteLocation {
    /** `folderPathFor(...)` of the note folder's parent, for example `Notes/Projects`. A rename does not change it. */
    folderPath: string;
    /** Basename of the note folder. */
    folderName: string;
    /**
     * Basename of the markdown file. After `read`: the spelling of the first
     * candidate from `markdownCandidates` that exists (so `Plan.md` even when
     * the entry is spelled `plan.md` on a case-insensitive volume, as desktop
     * resolves it), or else the entry name `pickMarkdownFallback` returned.
     * After a `saved` write: always `<folderName>.md`.
     */
    markdownName: string;
}
/**
 * The subset of Moss desktop's note IO that file-backed editing needs. One
 * object may serve many mounts; every call names its note.
 *
 * Error rule:
 * - Expected outcomes are returned as `kind`-tagged results: stale base,
 *   raced write, missing note, not editable, name taken, refused asset.
 * - `write` returns I/O failures it detects (EACCES, ENOSPC, EIO, a failed
 *   fsync other than the ignored codes, a lock timeout, and so on) as a
 *   typed `failed` result, because a failed write may have moved or
 *   preserved files and the editor must be told which. It rejects only when
 *   it cannot even say that (a crashed helper, a broken transport); the
 *   editor then treats the disk state as unknown and re-reads before its
 *   next write.
 * - `read`, `readCompanion` and the asset methods reject on I/O failures
 *   with an `Error`, `code` set to the POSIX code when known. They change no
 *   note file. A `read` that rejects fails the mount (`readFailed`); unlike
 *   desktop, an unreadable (EACCES) `comments.json` does not fall back to the
 *   legacy footer.
 * - Every `write` outcome, including a rejection, must uphold the lossless
 *   invariant in `MossNoteWrite`.
 */
export interface MossEditorBridge {
    /** Must be `1`. `ready` rejects with `apiMismatch` otherwise. */
    readonly api: MossEditorApiVersion;
    /** Host features; see the compatibility rules at the top. Default `[]`. */
    readonly features?: readonly MossEditorFeature[];
    read(noteId: MossNoteId): Promise<MossReadResult>;
    /**
     * Reads a note-relative companion file, for Moss's editor-read migrations
     * (the legacy mockup migration reads `assets/<name>-mockup.html`,
     * common/legacy-mockup-migration.ts:207-229). Same rules as desktop's
     * `readNoteRelativeCompanionFile` (note-store.ts:3047-3069): resolve
     * `relativePath` against the note folder, realpath both, and return
     * `absent` if the target is outside the note folder or does not exist.
     * Other I/O errors reject. The editor calls this only while reading, and
     * sends each returned version back in `MossNoteWrite.companions`.
     */
    readCompanion(noteId: MossNoteId, relativePath: string): Promise<MossCompanionRead>;
    write(noteId: MossNoteId, write: MossNoteWrite): Promise<MossWriteResult>;
    /**
     * Subscribes to on-disk changes to the note's markdown, comments, layout or
     * meta.json, or its location, made by anyone other than this bridge's own
     * `write`s, and to removal. Companion files are not watched (desktop does
     * not watch them either); they are checked at write time. Returns an
     * unsubscriber, which the editor calls on unmount. Notifications may be
     * coalesced and may repeat a version the editor already has; the editor
     * ignores those. The host must not deliver a notification synchronously
     * from inside `watch`.
     */
    watch(noteId: MossNoteId, listener: (change: MossExternalChange) => void): () => void;
    readonly assets: MossAssetBridge;
}
export type MossReadResult = {
    kind: 'note';
    files: MossNoteFiles;
    location: MossNoteLocation;
    version: MossNoteVersion;
    metaVersion: MossMetaVersion;
} | {
    kind: 'notFound';
} | {
    kind: 'notEditable';
    reason: MossNotEditableReason;
};
export type MossCompanionRead = {
    kind: 'file';
    text: string;
    version: MossCompanionVersion;
} | {
    kind: 'absent';
    version: MossCompanionVersion;
};
/** A companion file the editor's read migrations consumed, and the state it saw. */
export interface MossCompanionExpectation {
    relativePath: string;
    version: MossCompanionVersion;
}
/**
 * One save.
 *
 * What the editor sends:
 * - Nothing, if no file's bytes differ from the last version it read or saved
 *   and no rename or markdown normalization is due (desktop's idempotent
 *   skip).
 * - Otherwise `meta` always, plus `markdown` when its bytes differ, OR
 *   `rename` is non-null, OR `location.markdownName` is not
 *   `<location.folderName>.md`. The last case reproduces desktop's
 *   `ensureContentFile`, which every save calls and which moves a legacy
 *   `note.md` or `<id>.md` to `<folderName>.md` (note-store.ts:5116-5148).
 *   Names are compared as strings, as desktop does; because `markdownName`
 *   is the candidate spelling, a case-variant entry (`plan.md` in folder
 *   `Plan`) is not normalized, matching desktop.
 * - `comments` and `layout` puts or deletes when their bytes or presence differ.
 *
 * What the host must do, in order:
 * 1. Take its per-note lock and resolve `noteId` by `noteIdKey`. Return
 *    `notFound` if no folder has it, `notEditable` (`duplicateId`) if two do,
 *    `notEditable` if `noteEditability` refuses it, and `notEditable`
 *    (`hostUnsupported`) if the volume cannot do step 4.
 * 2. Read the current files, resolving the markdown with the two-step
 *    resolution. Compute the content version, each companion's version, and
 *    the meta version. Check, in this order, and write nothing on a
 *    mismatch: content version ≠ `baseVersion` → `conflict` `content`; any
 *    companion version ≠ expected → `conflict` `companion`; meta version ≠
 *    `baseMetaVersion` → `conflict` `meta`. Keep the bytes just read as the
 *    expected state E of every target (absence is a state), and record the
 *    markdown file's `(dev, ino)`.
 * 3. If `rename` is non-null: `allocateFolderName`; if the result equals the
 *    current name, skip. A case-only change on a case-insensitive volume is a
 *    plain `rename(2)`. Otherwise rename the folder exclusively
 *    (`renamex_np(RENAME_EXCL)` or `renameat2(RENAME_NOREPLACE)`); on EEXIST,
 *    re-list siblings and allocate once more, then return `raced`. The
 *    folder rename is never rolled back. All later paths are in the new
 *    folder.
 * 4. Apply the ops in order markdown, comments, layout, meta, each as a
 *    verified replacement. Temp and holding names come from
 *    `sidecarFileName`. Fsync each temp before it is moved and the folder
 *    after each move; ignore EINVAL, ENOTSUP, EPERM and ENOSYS from fsync.
 *    - put, target present in E: write the temp; atomically exchange temp
 *      and target (`renamex_np(RENAME_SWAP)` or
 *      `renameat2(RENAME_EXCHANGE)`). The temp path now holds the displaced
 *      bytes D. If D = E, keep it as the holding file. If D ≠ E, another
 *      writer landed after step 2: exchange back, then go to step 5.
 *    - put, target absent in E: write the temp; move it to the target
 *      exclusively (`link(2)` then unlink the temp, or `RENAME_EXCL`). On
 *      EEXIST go to step 5.
 *    - delete, target present in E: rename the target to a holding name. If
 *      the held bytes ≠ E, move them back exclusively and go to step 5.
 *    - delete, target absent in E: succeed if it is still absent; otherwise
 *      go to step 5.
 *    - Markdown target and the old file. The put targets
 *      `<folderName>.md` (the final name after step 3). Before the put, the
 *      host `lstat`s that path. If it resolves to the `(dev, ino)` recorded
 *      in step 2, the old file and the target are the same file (a case-only
 *      retitle or a case-variant name on a case-insensitive volume): treat
 *      the target as present in E, exchange onto it, and delete nothing.
 *      After the exchange, if the directory entry's spelling differs from
 *      `<folderName>.md` only in case, rename(2) the entry to that exact
 *      spelling (a same-inode case-only rename replaces no other file).
 *      Only if the old file is a different file from the target does the
 *      host delete it afterwards, as a verified delete. Desktop reaches the
 *      same result by re-resolving after the folder rename and comparing
 *      paths (note-store.ts:5121-5148).
 * 5. On any mismatch (`raced`): roll back every file this write already
 *    replaced, in reverse order, by exchanging its holding file back, but
 *    only where the target still holds this write's bytes. Return
 *    `conflict` `raced`.
 * 6. Re-read every file and recompute both versions. If they differ from the
 *    versions of the bytes this write produced, another writer replaced one
 *    of them after the swap; return `conflict` `raced` with no rollback.
 *    Otherwise remove the holding files, fsync the folder, and return
 *    `saved`. Remember the returned versions so `watch` does not report this
 *    write back.
 *
 * I/O failure at any step after step 2: attempt the step-5 rollback, then
 * return `failed` with the files that still hold this write's bytes in
 * `applied`, every preserved file in `preserved`, and the current
 * `location`. A holding file whose bytes equal E may be removed only after
 * its target is confirmed restored or written; otherwise it is preserved.
 *
 * Lossless invariant: the host never deletes bytes it did not write unless
 * they equal E. Every displaced byte sequence that is not E is either back
 * at its path or kept as a preserved holding file
 * (`.<name>.<uuid>.displaced`) and reported in `preserved` of a `conflict`
 * or `failed` result. The host never deletes preserved files on its own.
 *
 * The host writes `text` as UTF-8 exactly as given, with no BOM added or
 * removed, no newline normalization and no trailing-newline fix-up.
 *
 * Editor rule after `failed`, a rejection or a lost reply: before the next
 * write it re-reads. If each content file on disk equals either its base
 * bytes or the bytes this editor last sent, the disk state is the editor's
 * own: it adopts the new versions as its base and writes the remainder,
 * with no conflict. Any other difference is a `content` conflict.
 */
export interface MossNoteWrite {
    baseVersion: MossNoteVersion;
    baseMetaVersion: MossMetaVersion;
    /** Companion files the current markdown's migrations consumed. Usually empty. */
    companions: readonly MossCompanionExpectation[];
    /**
     * Non-null exactly when the first H1 of the new markdown differs from
     * meta.json `title`; this is when desktop calls `renameNoteFolder`
     * (note-store.ts:10639-10650). A rename always comes with a markdown put.
     */
    rename: MossFolderRename | null;
    /**
     * At most one op per file, in the order markdown, comments, layout, meta.
     * Files with no op are left untouched. `meta` is present on every write.
     * meta.json does not contain the folder name, so its bytes do not depend on
     * the name the host allocates.
     */
    ops: readonly MossFileOp[];
}
/**
 * Example: the user retitles "Plan" to "Q3 Plan" in
 * `~/Moss/Notes/Projects/Plan/Plan.md`, and a sibling `Q3 Plan` exists.
 * write: `{baseVersion, baseMetaVersion, companions: [], rename:
 * {kind:'renameFolder', desiredName:'Q3 Plan'}, ops: [{kind:'put',
 * file:'markdown', text:'# Q3 Plan\n\n…'}, {kind:'put', file:'meta',
 * text:'{\n  "id": …,\n  "title": "Q3 Plan", …}'}]}`.
 * Host: `allocateFolderName` → `Q3 Plan (1)`; renames the folder; writes
 * `Q3 Plan (1)/Q3 Plan (1).md`; `Plan.md` is a different file, so it is
 * verified-deleted; writes meta.json. Result location:
 * `{folderPath:'Notes/Projects', folderName:'Q3 Plan (1)',
 * markdownName:'Q3 Plan (1).md'}`.
 *
 * Case-only example on APFS: "Plan" → "plan". The folder is renamed
 * `Plan` → `plan` with rename(2). `plan/plan.md` resolves to the same inode
 * as the old `Plan.md`, so the put exchanges onto it, the entry is renamed
 * to the spelling `plan.md`, and nothing is deleted. Location:
 * `{folderName:'plan', markdownName:'plan.md'}`.
 */
export interface MossFolderRename {
    kind: 'renameFolder';
    /**
     * Desktop's `toFolderBaseName(title)` for the new H1 title: the sanitized
     * folder name truncated to 252 UTF-8 bytes, or `Untitled`, before
     * uniqueness allocation. It must pass `isMossFolderName`; the host checks
     * it before any change and otherwise returns `failed` with code `EINVAL`,
     * writing nothing.
     */
    desiredName: string;
}
export type MossFileOp = {
    kind: 'put';
    file: MossNoteFile;
    text: string;
}
/**
 * Remove the sidecar. Moss deletes `comments.json` when no comments remain
 * and `layout.json` when no widths remain; it never writes `{}`.
 */
 | {
    kind: 'delete';
    file: MossDeletableNoteFile;
};
/**
 * A write the host could not complete because of an I/O failure. The host
 * attempted the step-5 rollback first.
 */
export interface MossWriteFailed {
    kind: 'failed';
    /** POSIX code when known, for example `ENOSPC`. */
    code: string | null;
    /** Human-readable, for logs and the error UI. */
    message: string;
    /** Files that still hold this write's bytes after rollback. */
    applied: readonly MossNoteFile[];
    /** Note-folder-relative paths of preserved holding files (displaced bytes that are not E). */
    preserved: readonly string[];
    /** The location now; it reflects a folder rename that already happened. */
    location: MossNoteLocation;
}
export type MossWriteResult = {
    kind: 'saved';
    version: MossNoteVersion;
    metaVersion: MossMetaVersion;
    /** The note's location after the write; `markdownName` is `<folderName>.md`. */
    location: MossNoteLocation;
}
/**
 * The write did not land as a whole. `version` and `metaVersion` describe
 * the disk now.
 * - `content`: refused in step 2 because markdown, comments or layout
 *   changed. Nothing written. The editor enters `conflict` (cause
 *   `refused`, user-visible), unless the disk is its own state (see the
 *   editor rule on `MossNoteWrite`); then it adopts the version silently.
 * - `companion`: refused in step 2 because a companion file the migrated
 *   markdown was built from changed. Nothing written. Desktop detects this
 *   too, because its CAS compares migrated content. The editor enters
 *   `conflict` (cause `refused`, user-visible).
 * - `meta`: refused in step 2 because only meta.json or the location
 *   changed (Moss stamped `lastOpenedAt`, pinned the note, collapsed a
 *   heading, or the folder moved). Nothing written. Not user-visible: the
 *   editor re-reads, re-derives meta.json from the new meta.json text plus
 *   its `MossMetaIntents` and the new location, and retries at once, up to
 *   `metaConflictRetries` times. If the re-read shows a content change, it
 *   is handled as `content`. If retries run out, the editor reports an
 *   `error` event and retries after `errorRetryMs`; it never shows the
 *   conflict banner for meta.
 * - `raced`: another writer changed a file during steps 3-6. `applied`
 *   lists the files that still hold this write's bytes after rollback
 *   (usually empty for step-5 races). `preserved` lists displaced bytes the
 *   host kept. The editor enters `conflict` (cause `refused`), and the user
 *   chooses Reload, Keep editing or Overwrite.
 */
 | {
    kind: 'conflict';
    reason: 'content' | 'companion' | 'meta' | 'raced';
    version: MossNoteVersion;
    metaVersion: MossMetaVersion;
    applied: readonly MossNoteFile[];
    /** Note-folder-relative paths of preserved holding files. Empty unless `raced`. */
    preserved: readonly string[];
    /** The location now; it reflects a folder rename that happened before the race. */
    location: MossNoteLocation;
} | MossWriteFailed | {
    kind: 'notFound';
} | {
    kind: 'notEditable';
    reason: MossNotEditableReason;
};
export type MossExternalChange = 
/** Some file or the location changed. The editor re-reads; a meta-only change just refreshes the meta baseline. */
{
    kind: 'changed';
    version: MossNoteVersion;
    metaVersion: MossMetaVersion;
}
/** The id no longer resolves to an editable folder (deleted, trashed, or moved out of scope). */
 | {
    kind: 'removed';
    reason: 'notFound' | MossNotEditableReason;
};
/** `video` for mp4, webm and mov references (the URL must answer HTTP Range requests with 206); otherwise `image`. */
export type MossAssetKind = 'image' | 'video';
/**
 * Extensions the editor stores, matching Moss desktop's media allow-list.
 * Pasted data whose image MIME type is unknown is stored as `.png`, as Moss
 * does.
 */
export type MossAssetExtension = '.png' | '.jpg' | '.jpeg' | '.gif' | '.webp' | '.svg' | '.mp4' | '.webm' | '.mov';
/** A note-relative asset reference as it appears in markdown and in comment `imageUrls`. */
export type MossAssetRef = `assets/${string}`;
export interface MossAssetBridge {
    /**
     * Stores a new asset file in `<note folder>/assets/`, creating the
     * directory if needed. Used for pasted, dropped and picked body media and
     * for comment image attachments.
     *
     * The editor chooses the final file name with Moss's `buildImageFilename`
     * (ipc-handlers.ts:2532-2545):
     * `<sanitized-base>-<Date.now()>-<first 8 hex of a UUID><ext>`, or
     * `<base>-<ms>-<uuid8>-mockup<ext>` when the sanitized base ends in
     * `-mockup`. The host must not rename it. It must create the file
     * exclusively: a temp file, then `link(2)` (or `RENAME_EXCL`) to the
     * target. If the name is taken, return `exists`; the editor generates a
     * new name once and retries.
     */
    put(noteId: MossNoteId, asset: MossAssetPut): Promise<MossAssetPutResult>;
    /**
     * Copies an asset from another note into this note's `assets/`, as Moss
     * desktop's `images.copyFromNoteAsset` does for a cross-note paste. The
     * source is confined to the source note's folder (realpath), and the target
     * is created exclusively under `name`, as in `put`. The source note may be
     * any note the host can resolve, editable or not. If the copy fails, the
     * editor removes the unresolved reference from the pasted content, as
     * desktop does.
     */
    copyFromNote(noteId: MossNoteId, copy: MossAssetCopy): Promise<MossAssetPutResult>;
    /**
     * A URL the frame may load for `ref` as the markdown wrote it: `assets/x.png`,
     * a relative or absolute path, or a remote URL. Returns null for moss's
     * missing-media state. Must be synchronous, because moss resolves media
     * while rendering. Same semantics as the viewer's `assetUrl`, scoped to a
     * note. URLs must stay valid across a folder rename (key them by note id).
     */
    url(noteId: MossNoteId, ref: string, kind: MossAssetKind): string | null;
    /**
     * The inverse of `url`, for URLs this host issued: returns the note and
     * reference that `url` was built from, or null for any other URL. Must be
     * synchronous. The editor uses it to recognise assets pasted from another
     * editor or viewer frame. It recognises Moss desktop's own `moss-asset://`
     * URLs itself.
     */
    parseUrl(url: string): {
        noteId: MossNoteId;
        ref: MossAssetRef;
    } | null;
}
export interface MossAssetPut {
    /** Final file name, without a directory; must pass `isMossAssetName`. */
    name: string;
    data: Blob;
    /** The MIME type the editor inferred, for example `image/png`. */
    mimeType: string;
    /** Where the reference will be stored. Informational; both purposes use the same folder. */
    purpose: 'body' | 'comment';
}
export interface MossAssetCopy {
    sourceNoteId: MossNoteId;
    sourceRef: MossAssetRef;
    /** Final file name in the destination, chosen as in `put`; must pass `isMossAssetName`. */
    name: string;
}
export type MossAssetPutResult = {
    kind: 'stored';
    ref: MossAssetRef;
} | {
    kind: 'exists';
}
/**
 * The host declined the file. Moss desktop sets no size limit, so the
 * editor sets none either. A host limit is the host's own policy, and the
 * editor shows it as an inline media error.
 */
/** `name`: the name fails `isMossAssetName`; nothing was created. */
 | {
    kind: 'refused';
    reason: 'tooLarge' | 'type' | 'noSpace' | 'name';
    maxBytes?: number;
}
/** The destination note, or for `copyFromNote` the source asset, does not exist. */
 | {
    kind: 'notFound';
} | {
    kind: 'notEditable';
    reason: MossNotEditableReason;
};
/**
 * `editor.json`, shipped at the tarball root (`moss-editor/editor.json`) and
 * as a separate release asset. It is a superset of `viewer.json`'s fields.
 */
export interface MossEditorManifest {
    name: '@moss-multi/editor';
    /** Package semver, for example `0.1.0`. Equals `MOSS_EDITOR_INFO.version`. */
    version: string;
    api: MossEditorApiVersion;
    /** Equals `MOSS_EDITOR_INFO.features`. Hosts gate new kinds on this list. */
    features: readonly MossEditorFeature[];
    /** Frame entry: `moss-editor.js`. */
    entry: string;
    /** Frame stylesheet: `moss-editor.css`. */
    css: string;
    /** Host helper entry: `moss-editor-host.js`. */
    hostEntry: string;
    /**
     * The moss-html frame document. The host serves `file` and passes its URL
     * as `MossEditorOptions.htmlFrameUrl`, with the response header
     * `Content-Security-Policy: <policy>`.
     */
    htmlFrame: {
        file: 'moss-html-frame.html';
        policy: 'sandbox allow-scripts';
    };
    /** From vendor/moss/PORTED.json: the moss source whose desktop bytes this release reproduces. */
    moss: {
        upstream: string;
        pin: string;
        commit: string;
    };
    source: {
        repo: 'brsbl/moss-multi';
        commit: string;
        headSha: string;
        dirty: boolean;
        diffHash: string;
    };
    /** The CI run that built this tarball, for example `https://github.com/brsbl/moss-multi/actions/runs/<id>`. */
    build: {
        run: string;
    };
    /** sha256 over the sorted `fileName\0byteLength\0bytes` of every file in `files`. */
    bundleHash: string;
    files: Record<string, {
        bytes: number;
        sha256: string;
    }>;
    /** Note scopes this release may edit. The baseline lists only `'internal'`. */
    editableScopes: readonly ('internal' | 'external')[];
    /**
     * The editor frame's CSP requirements. Each key is a directive; each value
     * lists the sources the editor itself requires. `<asset-origin>` and
     * `<html-frame-origin>` are placeholders for the host's asset and
     * `htmlFrameUrl` origins. CI's end-to-end suite runs under exactly this
     * policy.
     */
    csp: Record<string, readonly string[]>;
}
