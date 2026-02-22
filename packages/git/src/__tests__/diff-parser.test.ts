import { describe, it, expect } from "vitest";
import { parseDiff, summarizeDiff, filterDiffByStatus } from "../diff/diff-parser.js";

const singleFileDiff = `diff --git a/src/index.ts b/src/index.ts
index 1234567..abcdefg 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@ module
 const a = 1;
-const b = 2;
+const b = 3;
+const c = 4;
`;

const multiFileDiff = `diff --git a/file1.ts b/file1.ts
index 1234567..abcdefg 100644
--- a/file1.ts
+++ b/file1.ts
@@ -1,2 +1,3 @@
 line1
+added line
 line2
diff --git a/file2.ts b/file2.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/file2.ts
@@ -0,0 +1,2 @@
+new file line 1
+new file line 2
`;

const deletedFileDiff = `diff --git a/old.ts b/old.ts
deleted file mode 100644
index 1234567..0000000
--- a/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-line1
-line2
`;

describe("parseDiff", () => {
  it("parses a single file diff", () => {
    const files = parseDiff(singleFileDiff);
    expect(files).toHaveLength(1);
    expect(files[0].oldPath).toBe("src/index.ts");
    expect(files[0].newPath).toBe("src/index.ts");
    expect(files[0].status).toBe("modified");
  });

  it("counts additions and deletions", () => {
    const files = parseDiff(singleFileDiff);
    expect(files[0].additions).toBe(2);
    expect(files[0].deletions).toBe(1);
  });

  it("parses hunks with line numbers", () => {
    const files = parseDiff(singleFileDiff);
    expect(files[0].hunks).toHaveLength(1);
    const hunk = files[0].hunks[0];
    expect(hunk.oldStart).toBe(1);
    expect(hunk.newStart).toBe(1);
  });

  it("parses multiple files", () => {
    const files = parseDiff(multiFileDiff);
    expect(files).toHaveLength(2);
  });

  it("detects new file status", () => {
    const files = parseDiff(multiFileDiff);
    const newFile = files.find((f) => f.status === "added");
    expect(newFile).toBeDefined();
    expect(newFile?.newPath).toBe("file2.ts");
  });

  it("detects deleted file status", () => {
    const files = parseDiff(deletedFileDiff);
    expect(files[0].status).toBe("deleted");
  });

  it("counts additions in new files", () => {
    const files = parseDiff(multiFileDiff);
    const newFile = files.find((f) => f.status === "added");
    expect(newFile?.additions).toBe(2);
    expect(newFile?.deletions).toBe(0);
  });

  it("returns empty array for empty input", () => {
    expect(parseDiff("")).toHaveLength(0);
  });

  it("identifies context lines", () => {
    const files = parseDiff(singleFileDiff);
    const contextLines = files[0].hunks[0].lines.filter((l) => l.type === "context");
    expect(contextLines.length).toBeGreaterThan(0);
  });

  it("sets isBinary to false for text diffs", () => {
    const files = parseDiff(singleFileDiff);
    expect(files[0].isBinary).toBe(false);
  });
});

describe("summarizeDiff", () => {
  it("summarizes single file diff", () => {
    const files = parseDiff(singleFileDiff);
    const summary = summarizeDiff(files);
    expect(summary).toContain("1 file(s) changed");
    expect(summary).toContain("2 insertion(s)(+)");
    expect(summary).toContain("1 deletion(s)(-)");
  });
});

describe("filterDiffByStatus", () => {
  it("filters by modified status", () => {
    const files = parseDiff(multiFileDiff);
    const modified = filterDiffByStatus(files, "modified");
    expect(modified).toHaveLength(1);
  });

  it("filters by added status", () => {
    const files = parseDiff(multiFileDiff);
    const added = filterDiffByStatus(files, "added");
    expect(added).toHaveLength(1);
  });
});
