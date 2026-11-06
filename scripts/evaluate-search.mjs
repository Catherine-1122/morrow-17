import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {liveSearch} from '../src/discovery.mjs';

export function checkLiveCase(example, result) {
  const ids = result.matches.map(match => match.id).sort();
  if (JSON.stringify(ids) !== JSON.stringify([...example.ids].sort())) {
    throw Error('Expected venue IDs ' + JSON.stringify(example.ids) + ', received ' + JSON.stringify(ids));
  }
  if (example.phrase && !result.matches.some(match => match.reason.toLowerCase().includes(example.phrase.toLowerCase()))) {
    throw Error('Missing expected exhibition phrase: ' + example.phrase);
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const cases = JSON.parse(await readFile(new URL('../test/fixtures/search-cases.json', import.meta.url)));
  const places = JSON.parse(await readFile(new URL('../public/places.json', import.meta.url)));
  const key = process.env.MODEL_API_KEY;
  if (!key) throw Error('Set MODEL_API_KEY to run the three live evaluation requests.');
  for (const example of cases.live) {
    const result = await liveSearch(example.question, places, {key});
    try {
      checkLiveCase(example, result);
      console.log('PASS', example.question);
    } catch (error) {
      console.error('FAIL', example.question, error.message);
      process.exitCode = 1;
    }
  }
}
