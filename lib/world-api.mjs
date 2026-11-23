import {validSubject} from '../public/subject-codec.js';
const json=(body,status=200,headers={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
const colorSet=new Set(['#ac4f4c','#395b88','#497765','#b88748','#825d89']);
const validPlot=id=>typeof id==='string'&&/^(A[1-6]|B[1-7])$/.test(id);
const validCode=code=>typeof code==='string'&&/^[A-Z0-9]{8,24}$/.test(code);
const uid=()=>crypto.randomUUID();
async function hash(s){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('')}
function cleanPose(p){return [Number.isFinite(p.x)&&Math.abs(p.x)<=53,Number.isFinite(p.z)&&Math.abs(p.z)<=47,Number.isFinite(p.yaw)&&Math.abs(p.yaw)<=20].every(Boolean)}
export async function handleWorld(request,binding){
  if(request.method!=='POST')return json({error:'POST required'},405);
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origin mismatch'},403);
  let p;try{p=await request.json()}catch{return json({error:'잘못된 요청이에요.'},400)}
  if(!p||typeof p!=='object')return json({error:'잘못된 요청이에요.'},400);
  const db=binding.withSession?binding.withSession('first-primary'):binding;
  const stmt=(s,...v)=>db.prepare(s).bind(...v);
  const now=Date.now();
  let token=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)osc_key=([\da-f-]{36})(?:;|$)/)?.[1];
  if(!token&&p.action!=='join')return json({error:'다시 입장해 주세요.'},401);
  token??=uid();const id=(await hash(token)).slice(0,32);
  if(p.action==='join'){
    const name=String(p.name||'').trim().slice(0,12);
    const color=p.color??'#ac4f4c', photo=p.photo??'', bio=p.bio??'';
    if(!name||!colorSet.has(color))return json({error:'이름을 확인해 주세요.'},400);
    if(typeof bio!=='string'||bio.length>200||typeof photo!=='string'||(photo!==''&&!validSubject(photo)&&!/^v1\.[A-Za-z0-9+/]{2880}$/.test(photo)))return json({error:'사진 또는 자기소개를 확인해 주세요.'},400);
    const profileKey=photo||bio?(await hash(JSON.stringify([photo,bio]))).slice(0,24):'';
    const x=(Math.random()-.5)*6,z=30.5+Math.random()*1.5;
    // An explicit entrance click frames the plaza from its approach. A reconnect keeps the walker's position.
    const arrivalPose=p.arrival===true?',x=excluded.x,z=excluded.z,yaw=0':'';
    const res=await db.batch([stmt('DELETE FROM visitors WHERE seen < ?',now-86400000),
      stmt('INSERT INTO visitors(id,name,color,x,z,yaw,seen,photo,bio,profile_key) VALUES(?,?,?,?,?,0,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,color=excluded.color,seen=excluded.seen,photo=excluded.photo,bio=excluded.bio,profile_key=excluded.profile_key'+arrivalPose,id,name,color,x,z,now,photo,bio,profileKey),
      stmt('SELECT x,z,yaw FROM visitors WHERE id=?',id)]);
    return json({id,...res[2].results[0]},200,{'Set-Cookie':'osc_key='+token+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400'+(new URL(request.url).protocol==='https:'?'; Secure':'')});
  }
  if(p.action==='sync'){
    if(!cleanPose(p))return json({error:'좌표 오류'},400);
    const result=await db.batch([
      stmt('UPDATE visitors SET x=?,z=?,yaw=?,seen=? WHERE id=?',p.x,p.z,p.yaw,now,id),
      stmt('SELECT id,name,color,x,z,yaw,profile_key AS profileKey FROM visitors WHERE seen >= ? ORDER BY seen DESC LIMIT 200',now-20000),
      stmt('SELECT plot,slot,kind,turn,version FROM objects'),
      stmt('SELECT plot FROM teams')]);
    if(!result[0].meta.changes)return json({error:'다시 입장해 주세요.'},401);
    return json({players:result[1].results,objects:result[2].results,claimed:result[3].results.map(t=>t.plot)});
  }
  if(!(await stmt('SELECT id FROM visitors WHERE id=?',id).first()))return json({error:'다시 입장해 주세요.'},401);
  if(p.action==='profiles'){
    if(!Array.isArray(p.ids)||p.ids.length>32||p.ids.some(id=>typeof id!=='string'||!/^[a-f0-9]{32}$/.test(id)))return json({error:'프로필 요청을 확인해 주세요.'},400);
    if(!p.ids.length)return json({profiles:[]});
    const result=await stmt('SELECT id,photo,bio,profile_key AS profileKey FROM visitors WHERE seen>=? AND id IN ('+p.ids.map(()=>'?').join(',')+')',now-20000,...p.ids).all();
    return json({profiles:result.results});
  }
  if(p.action==='leave'){await stmt('UPDATE visitors SET seen=0 WHERE id=?',id).run();return json({ok:true})}
  if(!validPlot(p.plot)||!validCode(p.code))return json({error:'부지와 팀 편집 코드를 확인해 주세요.'},400);
  const keyhash=await hash(p.plot+':'+p.code);
  if(p.action==='claim')await stmt('INSERT INTO teams(plot,keyhash) VALUES(?,?) ON CONFLICT(plot) DO NOTHING',p.plot,keyhash).run();
  if(!(await stmt('SELECT plot FROM teams WHERE plot=? AND keyhash=?',p.plot,keyhash).first()))return json({error:'이 자리는 다른 팀이 사용 중이에요. 팀 편집 코드를 입력해 주세요.'},403);
  if(p.action==='claim'||p.action==='unlock')return json({ok:true});
  if(p.action!=='edit'||!Number.isInteger(p.slot)||p.slot<0||p.slot>8||!['empty','bench','snowman','light','pine'].includes(p.kind)||!Number.isInteger(p.turn)||p.turn<0||p.turn>3||!Number.isSafeInteger(p.version)||p.version<0||typeof p.op!=='string'||!/^[\da-f-]{36}$/.test(p.op))return json({error:'편집 값을 확인해 주세요.'},400);
  const key=p.plot+'-'+p.slot;
  // Tombstones keep a cell's revision after its decoration is removed.
  const q=p.version===0?stmt('INSERT INTO objects(id,plot,slot,kind,turn,version,op) VALUES(?,?,?,?,?,1,?) ON CONFLICT(id) DO NOTHING',key,p.plot,p.slot,p.kind,p.turn,p.op):
    stmt('UPDATE objects SET kind=?,turn=?,version=version+1,op=? WHERE id=? AND version=?',p.kind,p.turn,p.op,key,p.version);
  const result=await db.batch([q,stmt('SELECT version,op FROM objects WHERE id=?',key)]);
  const current=result[1].results[0];
  return current?.op===p.op?json({version:current.version}):json({error:'팀원이 이 칸을 먼저 수정했어요. 최신 배치를 확인하고 다시 저장해 주세요.'},409);
}
