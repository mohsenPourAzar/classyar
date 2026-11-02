/* Local classroom API: MongoDB snapshots with optimistic revision checks. */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {config,root} from './server/config.mjs';
import {openStore} from './server/mongodb.mjs';
import {normalizeState,validateState} from './server/state.mjs';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'};
const dirs=['/index.html','/src/seed.js','/src/logic.js','/src/app.js','/src/styles.css','/src/theme.css','/src/fonts.css','/src/preferences.js','/src/export.js','/vendor/react.production.min.js','/vendor/react-dom.production.min.js',
  '/vendor/fonts/Vazirmatn-Variable.woff2','/vendor/fonts/Parastoo.woff2','/vendor/fonts/Parastoo-Bold.woff2','/vendor/fonts/IRANSans-Regular.woff2','/vendor/fonts/IRANSans-Bold.woff2'];
const maxBodyBytes=12_000_000;
function respond(res,status,body,type='application/json; charset=utf-8',headers={}){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(body);}
export function createApplication(store){return http.createServer(async (req,res)=>{
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/api/health'&&req.method==='GET'){
      await store.ping();respond(res,200,JSON.stringify({ok:true,version:2,storage:'mongodb'}));return;
    }
    if(pathname==='/api/state' && req.method==='GET'){
      const state=await store.read();
      if(!state){respond(res,404,'{"error":"not_initialized"}');return;}
      respond(res,200,JSON.stringify(state),'application/json; charset=utf-8',{ETag:'"'+state.revision+'"'});return;
    }
    if(pathname==='/api/state' && req.method==='PUT'){
      if(!(req.headers['content-type']||'').startsWith('application/json')){respond(res,415,'{"error":"json_required"}');return;}
      const match=req.headers['if-match'];
      if(!match||!/^"\d+"$/.test(match)){respond(res,428,'{"error":"revision_required"}');return;}
      const revision=Number(match.slice(1,-1));
      if(!Number.isSafeInteger(revision)){respond(res,400,'{"error":"invalid_revision"}');return;}
      let tooLarge=false;const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>maxBodyBytes){tooLarge=true;break;}chunks.push(chunk);}
      if(tooLarge){respond(res,413,'{"error":"too_large"}');return;}
      const data=Buffer.concat(chunks).toString('utf8');
      let payload;try{payload=JSON.parse(data);}catch{respond(res,400,'{"error":"invalid_json"}');return;}
      if(!validateState(payload)){respond(res,400,'{"error":"invalid_schema"}');return;}
      const nextRevision=await store.write(payload,revision);
      if(nextRevision===null){respond(res,409,'{"error":"revision_conflict"}');return;}
      respond(res,200,JSON.stringify({ok:true,storage:'mongodb',revision:nextRevision}));return;
    }
    if(req.method!=='GET' && req.method!=='HEAD'){respond(res,405,'{"error":"method_not_allowed"}');return;}
    const resource=pathname==='/'?'/index.html':pathname;
    if(!dirs.includes(resource)){respond(res,404,'Not Found','text/plain; charset=utf-8');return;}
    const full=path.join(root,resource);
    let content;
    try{content=await fs.readFile(full);}catch(err){if(err.code==='ENOENT'){respond(res,404,'Not Found','text/plain; charset=utf-8');return;}throw err;}
    res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?'':content);
  }catch(error){
    // Driver error messages can contain connection details; never return or log them.
    if(error.code===10334||error.name==='BSONError'){respond(res,413,'{"error":"too_large"}');return;}
    if(error.name?.startsWith('Mongo')){respond(res,503,'{"error":"database_unavailable"}');return;}
    respond(res,500,'{"error":"internal_error"}');
  }
});}

export async function initialState(){
  try{
    const legacy=JSON.parse(await fs.readFile(path.join(root,'data','store.json'),'utf8'));
    if(!validateState(legacy))throw new Error('Invalid legacy state. Preserve data/store.json and repair it before migrating.');
    return {state:normalizeState(legacy),source:'existing local JSON records'};
  }catch(error){if(error.code!=='ENOENT')throw error;}
  const context=vm.createContext({window:{}});
  vm.runInContext(await fs.readFile(path.join(root,'src','seed.js'),'utf8'),context);
  const state=JSON.parse(JSON.stringify(context.window.CLASSYAR_SEED));
  if(!validateState(state))throw new Error('Invalid demo state.');
  return {state,source:'anonymous demo records'};
}

export async function startServer(){
  let store;
  try{
    store=await openStore(config);
    if(!await store.read()){
      const initial=await initialState();await store.initialize(initial.state);
      console.log('MongoDB initialized from '+initial.source+'.');
    }
    const server=createApplication(store);
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,'127.0.0.1',resolve);});
    console.log('Classyar running at http://127.0.0.1:'+server.address().port+' (MongoDB)');
    const close=()=>{server.close(()=>store.close().then(()=>process.exit(0)));server.closeIdleConnections();};
    process.once('SIGINT',close);process.once('SIGTERM',close);
    return {server,store};
  }catch{
    await store?.close();
    console.error('Startup failed. Check MongoDB, .env configuration, legacy data validity, and whether the port is available.');
    process.exitCode=1;
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await startServer();
