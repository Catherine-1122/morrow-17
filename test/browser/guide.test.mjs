import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {chromium} from 'playwright';
import {createApp} from '../../server.mjs';
import {citedAnswer} from '../support/meta.mjs';

const places = JSON.parse(await readFile(new URL('../../public/places.json', import.meta.url)));
const pavilion = places.find(place => place.id === 'finland');

async function openSample(t, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-browser-'));
  const server = await createApp({stateDir:dir, ...options});
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let browser;
  t.after(async () => {
    await browser?.close();
    await new Promise(done => server.close(done));
    await rm(dir, {recursive:true, force:true});
  });
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined});
  const page = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  t.after(() => assert.deepEqual(pageErrors, []));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.getByRole('link',{name:'Search',exact:true}).click();
  return page;
}

async function searchAndSave(page, query) {
  await page.getByRole('textbox').fill(query);
  await page.getByRole('button',{name:'Search places'}).click();
  await page.getByRole('button',{name:'View place'}).click();
  const details = page.getByRole('dialog',{name:'Finnish Pavilion'});
  await details.getByRole('button',{name:'Save Finnish Pavilion'}).click();
  await details.getByRole('button',{name:'Remove Finnish Pavilion'}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('link',{name:'Saved',exact:true}).click();
  await page.reload();
  await page.getByRole('heading',{name:'Finnish Pavilion'}).waitFor();
  await page.getByRole('link',{name:'Book',exact:true}).click();
  await page.getByRole('tab',{name:'Map',exact:true}).click();
  const pin = page.getByRole('button',{name:'1 · Finnish Pavilion — open guide page'});
  const box = await pin.boundingBox();
  assert.ok(box.width >= 43.9 && box.height >= 43.9, 'map pin has a 44px touch target at fit zoom');
  await pin.click();
  const reader = page.getByRole('dialog',{name:'Guide page reader'});
  await reader.getByRole('heading',{name:'Finnish Pavilion'}).waitFor();
  assert.equal(await reader.getByText(pavilion.description,{exact:true}).isVisible(), true);
  assert.equal(await reader.getByRole('link',{name:'Official listing'}).getAttribute('href'), pavilion.source);
  assert.equal(await reader.locator('details').getAttribute('open'), null);
  return reader;
}

test('offline search → save → refresh → pin 1 opens the venue page, with a separate cover', async t => {
  const page = await openSample(t);
  const reader = await searchAndSave(page, 'Aeolian Suite');
  assert.equal(await reader.getByRole('button',{name:'Next page'}).isDisabled(), true);
  await page.keyboard.press('ArrowLeft');
  await reader.getByText(/^Cover ·/).waitFor();
  await page.keyboard.press('ArrowRight');
  await reader.getByRole('heading',{name:'Finnish Pavilion'}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:'Guide',exact:true}).click();
  await page.getByRole('button',{name:'Read guide page 1: Finnish Pavilion'}).click();
  await reader.getByRole('heading',{name:'Finnish Pavilion'}).waitFor();
});

test('a simulated live result retains the explanation and official source on the first saved page', async t => {
  const reason = 'Listen to Aeolian Suite at the Finnish Pavilion.';
  const page = await openSample(t, {key:'browser-test-fixture',
    fetchImpl:async () => Response.json(citedAnswer(pavilion,reason))});
  await page.getByLabel('Research mode').selectOption('live');
  const reader = await searchAndSave(page, 'wind');
  assert.equal(await reader.getByText('Saved Muse research').isVisible(), true);
  assert.equal(await reader.getByText(reason,{exact:true}).isVisible(), true);
});
