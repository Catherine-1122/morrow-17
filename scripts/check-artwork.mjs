import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('docs/artwork-provenance.json', root), 'utf8'));
const places = JSON.parse(await readFile(new URL('public/places.json', root), 'utf8'));
assert.equal(manifest.schema_version, 1);
assert.equal(manifest.assets.length, places.length, 'Each place needs a generation record');
assert.equal(new Set(manifest.assets.map(a => a.place_id)).size, places.length, 'Duplicate artwork records');
const expectedPaths = [];
for (const place of places) {
  const record = manifest.assets.find(a => a.place_id === place.id);
  assert.ok(record, 'Missing generation record: ' + place.id);
  assert.equal(record.provider, 'meta', 'Meta-only artwork requirement: ' + place.id);
  assert.equal(record.api_host, 'https://api.meta.ai');
  assert.ok(record.model && record.endpoint && Number.isFinite(Date.parse(record.generated_at)));
  assert.match(record.original_output_sha256, /^[a-f0-9]{64}$/);
  assert.match(record.reference.sha256, /^[a-f0-9]{64}$/);
  assert.equal(record.reference.source_url, place.credit.source);
  assert.equal(record.reference.license, place.credit.license);
  const path = 'public/assets/art/' + place.id + '.webp';
  assert.equal('public' + place.image, path);
  assert.equal(record.published_asset.path, path);
  const bytes = await readFile(new URL(path, root));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), record.published_asset.sha256,
    'Artwork differs from its generation record: ' + path);
  expectedPaths.push(place.id + '.webp');
}
assert.deepEqual((await readdir(new URL('public/assets/art/', root))).sort(), expectedPaths.sort(),
  'Unrecorded files in the artwork directory');
console.log('Verified ' + places.length + ' bundled artworks against their Meta records and file hashes.');
