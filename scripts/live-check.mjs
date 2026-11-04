import {readFile} from 'node:fs/promises';
import {liveSearch} from '../src/discovery.mjs';
const places = JSON.parse(await readFile(new URL('../public/places.json', import.meta.url)));
const question = 'What can I see at the Finnish Pavilion in the Giardini?';
try {
  const result = await liveSearch(question, places, {key:process.env.MODEL_API_KEY});
  if (!result.matches.length) throw Error('No cited matches for the example question.');
  console.log(JSON.stringify({question,...result}, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
