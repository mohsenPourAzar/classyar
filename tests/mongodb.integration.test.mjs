import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {MongoClient} from 'mongodb';
import {openStore} from '../server/mongodb.mjs';
import {createApplication} from '../server.mjs';
import {config} from '../server/config.mjs';

test('MongoDB stores all collections, rejects stale/invalid writes, and survives API/store restart',async t=>{
  const database='classyar_test_'+process.pid+'_'+Date.now();
  assert.match(database,/^classyar_test_\d+_\d+$/);
  const settings={uri:process.env.MONGODB_TEST_URI||config.uri,database};
  const context=vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(new URL('../src/seed.js',import.meta.url),'utf8'),context);
  const initial=JSON.parse(JSON.stringify(context.window.CLASSYAR_SEED));
  let store,server;
  const stop=async()=>{if(server){await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});server=null;}await store?.close();store=null;};
  const start=async()=>{store=await openStore(settings);server=createApplication(store);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;};
  try{
    let url=await start();await store.initialize(initial);
    const entry=fileURLToPath(new URL('../server.mjs',import.meta.url));
    const occupied=spawnSync(process.execPath,[entry],{encoding:'utf8',timeout:15000,env:{...process.env,MONGODB_URI:settings.uri,MONGODB_DB:database,PORT:String(server.address().port)}});
    assert.equal(occupied.status,1);assert.match(occupied.stderr,new RegExp('HTTP port '+server.address().port+' is already in use'));
    const malformed=spawnSync(process.execPath,[entry],{encoding:'utf8',timeout:15000,env:{...process.env,MONGODB_URI:'mongodb://private-user:do-not-print-this@[invalid',MONGODB_DB:database,PORT:'0'}});
    assert.equal(malformed.status,1);assert.match(malformed.stderr,/invalid MongoDB configuration/);assert.doesNotMatch(malformed.stderr,/private-user|do-not-print-this/);
    const health=await fetch(url+'/api/health').then(r=>r.json());assert.equal(health.storage,'mongodb');
    const first=await fetch(url+'/api/state');assert.equal(first.headers.get('etag'),'"0"');
    const before=await first.json();assert.equal(before.revision,0);
    const state=JSON.parse(JSON.stringify(initial));
    state.sessions.push({id:'integration-session',classId:'class-10',moduleId:'module-10-1',title:'جلسه آزمایشی',date:'۱۴۰۵/۰۸/۱۱'});
    state.assessments.push({id:'integration-assessment',moduleId:'module-10-1',componentId:'component-10-exam',title:'آزمون نمونه',maxScore:20});
    state.attendance.push({sessionId:'integration-session',studentId:state.students[0].id,status:'present'});
    state.marks.push({assessmentId:'integration-assessment',studentId:state.students[0].id,score:0});
    const put=(data,revision=0)=>fetch(url+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','If-Match':'"'+revision+'"'},body:typeof data==='string'?data:JSON.stringify(data)});
    assert.equal((await fetch(url+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)})).status,428);
    assert.equal((await put('{')).status,400);
    assert.equal((await put({...state,students:[null]})).status,400);
    const saved=await put(state);assert.equal(saved.status,200);assert.equal((await saved.json()).revision,1);
    assert.equal((await put(initial)).status,409);
    const current=await fetch(url+'/api/state').then(r=>r.json());
    for(const key of ['classes','students','modules','components','sessions','attendance','assessments','marks'])assert.deepEqual(current[key],state[key]);
    assert.equal(current.marks[0].score,0);
    await store.initialize(initial);assert.equal((await store.read()).revision,1);
    await stop();url=await start();
    const restarted=await fetch(url+'/api/state').then(r=>r.json());assert.equal(restarted.revision,1);assert.deepEqual(restarted.marks,state.marks);
    const font=await fetch(url+'/vendor/fonts/Vazirmatn-Variable.woff2');assert.equal(font.status,200);assert.equal(font.headers.get('content-type'),'font/woff2');
    for(const resource of ['/data/store.json','/.env','/server/config.mjs','/node_modules/mongodb/package.json'])assert.equal((await fetch(url+resource)).status,404);
    await store.close();assert.equal((await fetch(url+'/api/state')).status,503);assert.equal((await fetch(url+'/api/health')).status,503);
    t.diagnostic('Verified real MongoDB write/read/reconnect, atomic revision conflicts, zero grades, private-file exclusion, and availability errors.');
  }finally{
    await stop();
    const cleanup=new MongoClient(settings.uri,{serverSelectionTimeoutMS:5000});
    try{await cleanup.connect();await cleanup.db(database).dropDatabase();}finally{await cleanup.close();}
  }
});
