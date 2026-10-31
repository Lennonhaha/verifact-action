// SPDX-License-Identifier: Apache-2.0
// Recomputes the SHA-256 of every vendored file against verifact/VENDORED.json.
// A mismatch means the copy was edited here; upstream it instead, or the two
// trees will disagree about what the checker does.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'verifact/VENDORED.json'), 'utf8'));

let bad = 0;
let checked = 0;
for (const [rel, want] of Object.entries(manifest.files)) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error('MISSING', rel);
    bad++;
    continue;
  }
  const got = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  checked++;
  if (got !== want) {
    console.error('MODIFIED', rel, got, '!=', want);
    bad++;
  }
}
console.log('vendored from', manifest.upstream, 'at', manifest.commit);
console.log('checked', checked, 'files,', bad, 'problems');
process.exit(bad === 0 ? 0 : 1);
