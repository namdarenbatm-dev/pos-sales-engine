const ts = require("typescript");
const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
}

const root = path.join(__dirname, "..");
const files = [];
walk(path.join(root, "src"), files);
walk(path.join(root, "tests"), files);

let totalErrors = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const anyErrors = sf.parseDiagnostics || [];
  if (anyErrors.length > 0) {
    totalErrors += anyErrors.length;
    console.log(`\n✗ ${path.relative(root, file)}`);
    for (const d of anyErrors) {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      const pos = sf.getLineAndCharacterOfPosition(d.start || 0);
      console.log(`   line ${pos.line + 1}, col ${pos.character + 1}: ${msg}`);
    }
  } else {
    console.log(`✓ ${path.relative(root, file)}`);
  }
}
console.log(`\n${files.length} files checked, ${totalErrors} syntax errors`);
process.exit(totalErrors > 0 ? 1 : 0);
