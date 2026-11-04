import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdir, readFile, readdir} from 'node:fs/promises';
import {dirname, join, relative, extname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {liveSearch, sampleSearch, SearchError, validateQuery} from './src/discovery.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const publicRoot = join(root, 'public');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain'};
const send = (res,status,data) => {
  res.writeHead(status, {'Content-Type':'application/json'});
  res.end(JSON.stringify(data));
};

async function readBody(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new SearchError('Send JSON.',415);
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 4096) throw new SearchError('Request too large.',413);
    chunks.push(chunk);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch {}
  throw new SearchError('Invalid JSON object.',400);
}

export async function createApp({stateDir=join(root,'.atlas'),key='',fetchImpl=fetch}={}) {
  const places = JSON.parse(await readFile(join(publicRoot,'places.json'),'utf8'));
  const placeIds = new Set(places.map(p=>p.id));
  const files = new Map();
  for (const entry of await readdir(publicRoot, {recursive:true,withFileTypes:true})) {
    if (!entry.isFile() || !mime[extname(entry.name)]) continue;
    const file = join(entry.parentPath,entry.name);
    files.set('/'+relative(publicRoot,file).split('\\').join('/'),file);
  }
  files.set('/',join(publicRoot,'index.html'));
  await mkdir(stateDir,{recursive:true,mode:0o700});
  const db = new DatabaseSync(join(stateDir,'saved.sqlite'));
  db.exec('CREATE TABLE IF NOT EXISTS saves (position INTEGER PRIMARY KEY, place_id TEXT NOT NULL UNIQUE)');
  const saved = () => db.prepare('SELECT place_id FROM saves ORDER BY position').all().map(row=>row.place_id);
  let lastLive = 0, researching = false;
  const server = http.createServer(async (req,res) => {
    try {
      res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'");
      res.setHeader('X-Content-Type-Options','nosniff');
      res.setHeader('Referrer-Policy','no-referrer');
      res.setHeader('Cache-Control','no-store');
      const host = req.headers.host, port = server.address().port;
      if (![ '127.0.0.1:'+port,'localhost:'+port ].includes(host)) throw new SearchError('Invalid host.',403);
      const path = new URL(req.url,'http://'+host).pathname;
      if (req.method === 'GET') {
        if (path === '/api/state') return send(res,200,{saved:saved(),liveAvailable:Boolean(key)});
        const file = files.get(path);
        if (!file) throw new SearchError('Page unavailable.',404);
        const bytes = await readFile(file);
        res.writeHead(200,{'Content-Type':mime[extname(file)]});
        return res.end(bytes);
      }
      if (req.method !== 'POST') throw new SearchError('Unsupported method.',405);
      if (req.headers.origin !== 'http://'+host || req.headers['sec-fetch-site'] === 'cross-site') {
        throw new SearchError('Open Atlas locally to make changes.',403);
      }
      const data = await readBody(req);
      if (path === '/api/saved') {
        if (!placeIds.has(data.id) || typeof data.saved !== 'boolean') throw new SearchError('Unknown place or save action.',400);
        if (data.saved) db.prepare('INSERT OR IGNORE INTO saves(place_id) VALUES(?)').run(data.id);
        else db.prepare('DELETE FROM saves WHERE place_id=?').run(data.id);
        return send(res,200,{saved:saved()});
      }
      if (path !== '/api/search') throw new SearchError('Page unavailable.',404);
      const question = validateQuery(data.question);
      if (data.mode === 'sample') return send(res,200,sampleSearch(question,places));
      if (data.mode !== 'live') throw new SearchError('Choose Sample or Live Meta.',400);
      if (!key) throw new SearchError('Set MODEL_API_KEY on the server to enable Live Meta.',503);
      if (researching || Date.now()-lastLive < 5000) throw new SearchError('A recent Meta request is still settling. Try again shortly.',429);
      researching = true;
      lastLive = Date.now();
      try { return send(res,200,await liveSearch(question,places,{key,fetchImpl})); }
      finally { researching = false; }
    } catch (error) {
      if (!res.headersSent) send(res,error.status || 500,{error:error instanceof SearchError ? error.message : 'The local app could not complete this request.'});
    }
  });
  server.on('close',()=>db.close());
  return server;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid PORT');
  const server = await createApp({key:process.env.MODEL_API_KEY || ''});
  server.listen(port,'127.0.0.1',()=>console.log('Atlas is ready at http://127.0.0.1:'+port));
}
