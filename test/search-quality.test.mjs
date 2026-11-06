import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readAnswer, sampleSearch} from '../src/discovery.mjs';
import {checkLiveCase} from '../scripts/evaluate-search.mjs';
import {citedAnswer} from './support/meta.mjs';

const cases = JSON.parse(await readFile(new URL('./fixtures/search-cases.json', import.meta.url)));
const places = JSON.parse(await readFile(new URL('../public/places.json', import.meta.url)));

for (const example of cases.sample) {
  test('offline relevance — ' + example.question, () => {
    assert.deepEqual(sampleSearch(example.question, places).matches.map(match => match.id), example.ids);
  });
}

test('a valid citation can pass the parser and still fail the answer-quality evaluation', () => {
  const finland = places.find(place => place.id === 'finland');
  const falseClaim = citedAnswer(finland, 'Every visitor gets a souvenir moon rock.');
  const parsed = readAnswer(falseClaim, places);
  assert.equal(parsed.matches.length, 1);
  const unsupported = cases.live.find(example => example.question.includes('moon rock'));
  assert.throws(() => checkLiveCase(unsupported, parsed), /Expected venue IDs/);
  const none = citedAnswer(finland, '');
  none.output[1].content[0] = {type:'output_text', text:'NONE', annotations:[]};
  checkLiveCase(unsupported, readAnswer(none, places));
});

test('a relevant result must contain the expected exhibition evidence', () => {
  const finland = places.find(place => place.id === 'finland');
  const example = cases.live.find(example => example.phrase);
  checkLiveCase(example, readAnswer(citedAnswer(finland, 'See Aeolian Suite in the pavilion.'), places));
  assert.throws(() => checkLiveCase(example, readAnswer(citedAnswer(finland, 'Visit the pavilion.'), places)), /Missing expected/);
});

test('a citation on another result line cannot support the first venue', () => {
  const finland = places.find(place => place.id === 'finland');
  const data = citedAnswer(finland, 'See Aeolian Suite.');
  const block = data.output[1].content[0];
  const start = block.text.length + 1;
  block.text += '\narsenale | Different venue.';
  block.annotations[0].start_index = start + 11;
  block.annotations[0].end_index = start + 20;
  assert.throws(() => readAnswer(data, places), /usable citation/);
});
