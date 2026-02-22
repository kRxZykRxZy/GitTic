// --- Existing modules ---
export { CollaborationManager } from "./collaboration.js";
export type { YjsRoomState } from "./collaboration.js";
export {
  getLanguageFromExtension,
  DEFAULT_EDITOR_CONFIG,
  DEFAULT_EDITOR_LAYOUT,
} from "./editor-config.js";
export type {
  FileTreeNode,
  EditorConfig,
  EditorPanel,
  EditorLayout,
} from "./editor-config.js";
export {
  DEFAULT_LANGUAGE_SERVERS,
  getLanguageServerConfig,
} from "./language-server.js";
export type {
  LanguageServerConfig,
  LspMessage,
} from "./language-server.js";

// --- Core ---
export { EditorState } from "./core/editor-state.js";
export type { OpenFileState, ViewportState, EditorStateSnapshot } from "./core/editor-state.js";
export { TextBuffer } from "./core/buffer.js";
export type { BufferPosition, BufferRange, BufferChange } from "./core/buffer.js";
export { CursorManager } from "./core/cursor.js";
export type { CursorPos, EditorCursor, CursorDirection, CursorMoveUnit } from "./core/cursor.js";
export { UndoRedoHistory, DEFAULT_HISTORY_CONFIG } from "./core/history.js";
export type { HistoryOperation, OperationData, HistoryConfig } from "./core/history.js";
export { SelectionManager } from "./core/selection.js";
export type { SelectionRange, NormalizedRange, WordBoundary } from "./core/selection.js";

// --- Files ---
export { FileManager, DEFAULT_FILE_MANAGER_CONFIG } from "./files/file-manager.js";
export type { ManagedFile, FileManagerConfig } from "./files/file-manager.js";
export { FileWatcher, createFileWatcher, DEFAULT_WATCHER_CONFIG } from "./files/file-watcher.js";
export type { FileChangeType, FileChangeEvent, FileWatcherConfig } from "./files/file-watcher.js";
export { FileTreeBuilder, countTreeNodes, findNodeByPath, flattenFiles, DEFAULT_FILE_TREE_OPTIONS } from "./files/file-tree.js";
export type { FileTreeOptions, DirectoryEntry, ReadDirFn } from "./files/file-tree.js";
export { FileSearchEngine, DEFAULT_FILE_SEARCH_CONFIG } from "./files/file-search.js";
export type { FileSearchResult, FileSearchConfig } from "./files/file-search.js";
export {
  detectEncoding,
  isValidUtf8,
  stripBom,
  addUtf8Bom,
  decodeBuffer,
  encodeString,
  detectLineEnding,
  normalizeLineEndings,
} from "./files/encoding.js";
export type { FileEncoding, EncodingDetectionResult } from "./files/encoding.js";

// --- Workspace ---
export { TabManager } from "./workspace/tab-manager.js";
export type { EditorTab, ClosedTabEntry } from "./workspace/tab-manager.js";
export { WorkspaceState, DEFAULT_SIDEBAR_STATE, DEFAULT_BOTTOM_PANEL_STATE } from "./workspace/workspace-state.js";
export type { PersistedFileState, SidebarState, BottomPanelState, WorkspaceSnapshot } from "./workspace/workspace-state.js";
export { SplitViewManager } from "./workspace/split-view.js";
export type { SplitDirection, SplitPane, SplitGroup, SplitViewSnapshot } from "./workspace/split-view.js";
export { RecentFilesTracker, DEFAULT_RECENT_FILES_CONFIG } from "./workspace/recent-files.js";
export type { RecentFileEntry, RecentFilesSnapshot, RecentFilesConfig } from "./workspace/recent-files.js";

// --- Search ---
export { TextSearchEngine, DEFAULT_TEXT_SEARCH_OPTIONS } from "./search/text-search.js";
export type { TextSearchMatch, FileSearchResults, TextSearchResults, TextSearchOptions } from "./search/text-search.js";
export { FindReplace, DEFAULT_FIND_REPLACE_OPTIONS } from "./search/find-replace.js";
export type { FindMatch, FindReplaceOptions, ReplaceResult } from "./search/find-replace.js";
export { SemanticSearchEngine, DEFAULT_SEMANTIC_SEARCH_OPTIONS } from "./search/semantic-search.js";
export type { SymbolKind, SemanticMatch, SemanticSearchOptions } from "./search/semantic-search.js";

// --- Themes ---
export { ThemeManager, DARK_THEME, LIGHT_THEME, HIGH_CONTRAST_THEME } from "./themes/theme-manager.js";
export type { EditorTheme, ThemeColors } from "./themes/theme-manager.js";
export { SyntaxColorManager, DARK_SYNTAX_COLORS, LIGHT_SYNTAX_COLORS } from "./themes/syntax-colors.js";
export type { TokenType, TokenStyle, TokenColorRule, SyntaxColorScheme } from "./themes/syntax-colors.js";
export { IconSet, DEFAULT_FILE_ICON, DEFAULT_FOLDER_ICON, DEFAULT_FOLDER_OPEN_ICON } from "./themes/icon-set.js";
export type { IconKind, FileIcon, IconRule } from "./themes/icon-set.js";

// --- Commands ---
export { CommandPalette, DEFAULT_PALETTE_CONFIG } from "./commands/command-palette.js";
export type { PaletteItem, PaletteConfig } from "./commands/command-palette.js";
export { KeybindingManager, parseKeyChord, chordToString } from "./commands/keybindings.js";
export type { Platform, KeyChord, KeybindingEntry, KeybindingConflict } from "./commands/keybindings.js";
export { CommandRegistry, normalizeKeybinding } from "./commands/command-registry.js";
export type { EditorCommand, CommandHandler, RegisterCommandOptions } from "./commands/command-registry.js";

// --- Snippets ---
export { SnippetManager } from "./snippets/snippet-manager.js";
export type { Snippet, SnippetInsertionResult, SnippetVariables } from "./snippets/snippet-manager.js";
export { parseSnippet, validateSnippet } from "./snippets/snippet-parser.js";
export type { SnippetTokenType, SnippetToken, SnippetVariable, SnippetParseResult } from "./snippets/snippet-parser.js";

// --- Git ---
export { GitPanel, DEFAULT_GIT_PANEL_CONFIG } from "./git/git-panel.js";
export type { GitFileStatus, StagingState, GitFileEntry, DiffDisplayMode, GitPanelConfig } from "./git/git-panel.js";
export { InlineBlame, DEFAULT_INLINE_BLAME_CONFIG } from "./git/inline-blame.js";
export type { LineBlameInfo, FileBlameData, InlineBlameConfig } from "./git/inline-blame.js";

// --- Terminal ---
export { TerminalManager, DEFAULT_TERMINAL_CONFIG } from "./terminal/terminal-manager.js";
export type { ShellType, TerminalConfig, TerminalInstance } from "./terminal/terminal-manager.js";
export { TerminalSession } from "./terminal/terminal-session.js";
export type { CommandHistoryEntry, TerminalLine, TerminalDimensions, TerminalSessionSnapshot } from "./terminal/terminal-session.js";

// --- Diff ---
export { DiffViewer, DEFAULT_DIFF_VIEWER_CONFIG } from "./diff/diff-viewer.js";
export type { DiffLineType, DiffLine, DiffHunk, DiffResult, CollapsibleRegion, DiffViewerConfig } from "./diff/diff-viewer.js";
export { MergeEditor } from "./diff/merge-editor.js";
export type { MergeConflict, ConflictResolution, MergeConflictFile } from "./diff/merge-editor.js";

// --- Utils ---
export { EditorEventEmitter, editorEventBus } from "./utils/editor-events.js";
export type {
  EditorEventMap,
  FileOpenedEvent,
  FileClosedEvent,
  FileSavedEvent,
  FileModifiedEvent,
  CursorMovedEvent,
  SelectionChangedEvent,
  TabActivatedEvent,
  TabClosedEvent,
  ThemeChangedEvent,
  CommandExecutedEvent,
  SearchCompletedEvent,
  TerminalCreatedEvent,
  TerminalClosedEvent,
  WorkspaceRestoredEvent,
  GitStatusChangedEvent,
} from "./utils/editor-events.js";
