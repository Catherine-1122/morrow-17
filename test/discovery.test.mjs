import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {liveSearch,readAnswer,sampleSearch,MODEL} from '../src/discovery.mjs';
const places=JSON.parse(await readFile(new URL('../public/places.json',import.meta.url)));
const finland=places.find(p=>p.id==='finland');
function fixture(url=finland.source,id='finland') {
  const text=id+' | A test sentence about the pavilion.';
  return {status:'completed',output:[{type:'web_search_call',status:'completed'},
    {type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text,
    annotations:[{type:'url_citation',url,start_index:9,end_index:19}]}]}]};
}
test('sample search uses public catalog order, supports zero matches and requires a question',()=>{
  assert.deepEqual(sampleSearch('design in San Marco',places).matches,[{id:'olivetti'}]);
  assert.equal(sampleSearch('architecture',places).matches.length,3);
  assert.equal(sampleSearch('glaciers',places).matches.length,0);
  assert.throws(()=>sampleSearch(' ',places));
});
test('live request uses server auth, known candidate ids, and native citations',async()=>{
  const fetchImpl=async (url,opts)=>{
    assert.equal(url,'https://api.meta.ai/v1/responses');
    assert.equal(opts.headers.Authorization,'Bearer unit-fixture');
    const body=JSON.parse(opts.body);assert.equal(body.model,MODEL);assert.equal(body.store,false);assert.equal(body.tools[0].type,'web_search');
    return Response.json(fixture());
  };
  const r=await liveSearch('sound in Venice',places,{key:'unit-fixture',fetchImpl});
  assert.equal(r.mode,'live');assert.equal(r.matches[0].id,'finland');
});
test('reject unknown places, citations on another line, wrong sources and incomplete web searches',()=>{
  for(const data of [fixture(finland.source,'unknown'),fixture('https://example.org/page'),fixture(places[0].source),
                    {...fixture(),status:'incomplete'}, {status:'completed',output:[]}])assert.throws(()=>readAnswer(data,places));
  const noSpan=fixture();noSpan.output[1].content[0].annotations[0].start_index=500;assert.throws(()=>readAnswer(noSpan,places));
});
test('provider failures cannot masquerade as offline matches or expose upstream errors',async()=>{
  await assert.rejects(liveSearch('a',places,{}),/key/);
  await assert.rejects(liveSearch('a',places,{key:'unit-fixture',fetchImpl:async()=>new Response('private upstream body',{status:401})}),/declined/);
});
