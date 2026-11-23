// Run from the project with "node scripts/benchmark-crowd.mjs [seconds]".
// Runs a fixed 100-client workshop in a fresh loopback-only D1 emulator.
import {Miniflare} from 'miniflare';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const project=new URL('../',import.meta.url);
const seconds=Number(process.argv[2]??180);
if(!Number.isInteger(seconds)||seconds<10||seconds>300)throw Error('Choose a duration from 10 to 300 seconds.');
const source=path=>readFile(new URL(path,project),'utf8');
const modules=await Promise.all(['lib/world-api.mjs','public/subject-codec.js','public/room-space.js'].map(async path=>{
  let contents=await source(path);
  if(path==='lib/world-api.mjs')contents+='\nexport default {fetch(req,env){return handleWorld(req,env.DB)}}';
  return {path,type:'ESModule',contents};
}));
const emulator=new Miniflare({cf:false,host:'127.0.0.1',modules,d1Databases:['DB'],
  compatibilityDate:'2026-05-15',outboundService:()=>new Response(null,{status:403})});
const latency=new Map();
async function post(user,action,fields={}){
  const t=performance.now();
  const response=await emulator.dispatchFetch('http://localhost/api/world',{method:'POST',
    headers:{'Content-Type':'application/json',cookie:user.cookie||''},body:JSON.stringify({action,...fields})});
  const raw=await response.text(),time=performance.now()-t;
  assert.equal(response.status,200,action+' '+raw.slice(0,150));
  const tag=action==='sync'?action+'.'+fields.room:action;
  if(!latency.has(tag))latency.set(tag,{ms:[],bytes:0});
  latency.get(tag).ms.push(time);latency.get(tag).bytes+=Buffer.byteLength(raw);
  if(response.headers.has('set-cookie'))user.cookie=response.headers.get('set-cookie').split(';')[0];
  return JSON.parse(raw);
}
function photo(i){
  const w=72,h=96,mask=Buffer.alloc(w*h/8),rgb=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(((x-36)/27)**2+((y-47)/46)**2>1)continue;
    const k=y*w+x;mask[k>>3]|=1<<(k%8);
    const color=(i+x)%32<<11|(y+i)%64<<5|(y+x)%32;rgb.push(color>>8,color&255);
  }
  return 'v2.'+Buffer.concat([Buffer.from([w,h,0]),mask,Buffer.from(rgb)]).toString('base64');
}
const users=Array.from({length:100},(_,i)=>({i,seq:0,rosterKey:'',layoutRev:-1,afterMessage:0,known:new Set()}));
const team=i=>({plot:i<54?'A'+(1+Math.floor(i/9)):'B'+(1+Math.floor((i-54)/9)),code:'BENCH0001'});
const scope=u=>({room:u.pose.room,visit:u.pose.visit});
try{
  const db=await emulator.getD1Database('DB');
  const migrations=(await readdir(new URL('drizzle/',project))).filter(f=>f.endsWith('.sql')).sort();
  for(const f of migrations)for(const sql of (await source('drizzle/'+f)).split('--> statement-breakpoint')){
    if(sql.trim())await db.prepare(sql.trim()).run();
  }
  await Promise.all(users.map(async u=>{
    u.pose=await post(u,'join',{name:'겨울'+u.i,photo:photo(u.i),arrival:true});
    u.id=u.pose.id;await post(u,'claim',{...scope(u),...team(u.i)});
    await post(u,'edit',{...scope(u),...team(u.i),slot:u.i%9,kind:'pine',turn:0,version:0,op:crypto.randomUUID()});
    if(u.i<6)u.pose=(await post(u,'door',{...u.pose})).position;
  }));
  const start=performance.now();
  await Promise.all(users.map(async u=>{
    for(let n=0;n<seconds;n++){
      const due=start+1000*n+10*u.i;
      await delay(Math.max(0,due-performance.now()));
      const inside=u.pose.room==='cottage',a=n*.065+u.i,r=inside?2:10+u.i%15;
      const pose={x:Math.cos(a)*r,z:Math.sin(a)*r,yaw:a%(2*Math.PI)};
      if((n+u.i)%11===0)await post(u,'jump',{...scope(u),jumpSeq:++u.seq});
      if(inside&&(n+u.i)%17===0)await post(u,'chat',{...scope(u),op:crypto.randomUUID(),body:'겨울 인사 '+n});
      const snap=await post(u,'sync',{wire:2,...scope(u),...pose,jumpSeq:u.seq,rosterKey:u.rosterKey,layoutRev:u.layoutRev,afterMessage:u.afterMessage});
      assert.equal(snap.poses.length,inside?6:94);
      u.roster=snap.roster??u.roster;u.rosterKey=snap.rosterKey;u.layoutRev=snap.layoutRev;
      if(snap.messages.length)u.afterMessage=snap.messages.at(-1).id;
      if(!inside)assert.equal(snap.messages.length,0);
      const peers=u.roster.map(([id],j)=>({id,d:(snap.poses[j][0]/100-pose.x)**2+(snap.poses[j][1]/100-pose.z)**2}))
        .filter(p=>p.id!==u.id).sort((a,b)=>a.d-b.d);
      const nearby=peers.slice(0,12).filter(p=>p.d<=256&&!u.known.has('full'+p.id));
      const lite=!nearby.length;
      const pending=lite?peers.filter(p=>!u.known.has('full'+p.id)&&!u.known.has('lite'+p.id)):nearby;
      if(pending.length){
        const {profiles}=await post(u,'profiles',{...scope(u),lite,ids:pending.slice(0,6).map(p=>p.id)});
        for(const p of profiles){assert(p.photo.startsWith('v2.'));u.known.add((lite?'lite':'full')+p.id);}
      }
    }
  }));
  const rows={};
  for(const [action,{ms,bytes}] of latency){
    ms.sort((a,b)=>a-b);const pct=p=>+ms[Math.ceil(ms.length*p)-1].toFixed(1);
    rows[action]={requests:ms.length,p50_ms:pct(.50),p95_ms:pct(.95),p99_ms:pct(.99),response_MiB:+(bytes/1048576).toFixed(2)};
  }
  console.table(rows);
}finally{await emulator.dispose();}
