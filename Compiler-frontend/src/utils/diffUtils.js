/**
 * Computes an LCS-based line-by-line diff between two strings.
 * Returns an array of objects: { type: 'added' | 'removed' | 'unchanged', text: string, oldLineNumber, newLineNumber }
 */
export function computeLineDiff(oldText = "", newText = "") {
  const oldLines = oldText ? oldText.split(/\r?\n/) : [];
  const newLines = newText ? newText.split(/\r?\n/) : [];

  const m = oldLines.length;
  const n = newLines.length;

  // Build DP table for LCS
  const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build diff
  let i = m;
  let j = n;
  const rawDiff = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      rawDiff.push({
        type: "unchanged",
        text: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({
        type: "added",
        text: newLines[j - 1],
        oldLineNumber: null,
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({
        type: "removed",
        text: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: null,
      });
      i--;
    }
  }

  return rawDiff.reverse();
}
