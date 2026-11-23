import {validSubject,previewSubject} from '../public/subject-codec.js';
import {plazaRoom,shopRoom,entrySpots,doorstep,atDoor,validRoom} from '../public/room-space.js';
const json=(body,status=200,headers={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
const colorSet=new Set(['#ac4f4c','#395b88','#497765','#b88748','#825d89']);
const validPlot=id=>typeof id==='string'&&/^(A[1-6]|B[1-7]|E3)$/.test(id);
const validCode=code=>typeof code==='string'&&/^[A-Z0-9]{8,24}$/.test(code);
const uid=()=>crypto.randomUUID();
async function hash(s){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('')}
const validJump=n=>Number.isSafeInteger(n)&&n>=0&&n<=2147483647;
function cleanPose(p){return [Number.isFinite(p.x)&&Math.abs(p.x)<=53,Number.isFinite(p.z)&&Math.abs(p.z)<=47,Number.isFinite(p.yaw)&&Math.abs(p.yaw)<=20].every(Boolean)}
// The sorted roster is immutable between membership/profile changes. The key
// works across Worker isolates and reconnects, regardless of poll ordering.
const rosterCache=new Map();
async function packPresence(rows,room,known,now){
  rows.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const roster=rows.map(p=>[p.id,p.name,p.color,p.profileKey]);
  const signature=JSON.stringify(roster);
  let entry=rosterCache.get(room);
  if(entry?.signature!==signature){
    entry={signature,key:(await hash(signature)).slice(0,24)};
    rosterCache.set(room,entry);
  }
  const poses=rows.map(p=>{
    const pose=[Math.round(p.x*100),Math.round(p.z*100),Math.round(p.yaw*1000)];
    if(p.jumpSeq&&p.jumpAt>=now-2400)pose.push(p.jumpSeq,p.jumpAt);
    return pose;
  });
  return {rosterKey:entry.key,...(entry.key===known?{}:{roster}),poses};
}
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
    const preview=photo?previewSubject(photo):'';
    const x=3.01+Math.random()*.14,z=25.65+Math.random()*.26;
    // An explicit entrance click frames the plaza from its approach. A reconnect keeps the walker's position.
    const arrivalPose=p.arrival===true?",x=excluded.x,z=excluded.z,yaw=0,room='plaza',visit=visit+1":'';
    const res=await db.batch([stmt('DELETE FROM visitors WHERE seen < ?',now-86400000),
      stmt('INSERT INTO visitors(id,name,color,x,z,yaw,seen,photo,bio,profile_key) VALUES(?,?,?,?,?,0,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,color=excluded.color,seen=excluded.seen,photo=excluded.photo,bio=excluded.bio,profile_key=excluded.profile_key'+arrivalPose,id,name,color,x,z,now,'','',profileKey),
      stmt('INSERT INTO visitor_appearances(id,profile_key,photo,preview,bio) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET profile_key=excluded.profile_key,photo=excluded.photo,preview=excluded.preview,bio=excluded.bio WHERE profile_key!=excluded.profile_key',id,profileKey,photo,preview,bio),
      stmt('SELECT x,z,yaw,room,visit,jump_seq AS jumpSeq FROM visitors WHERE id=?',id)]);
    return json({id,...res[3].results[0]},200,{'Set-Cookie':'osc_key='+token+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400'+(new URL(request.url).protocol==='https:'?'; Secure':'')});
  }
  const room=p.room??plazaRoom, visit=p.visit??null;
  if(!validRoom(room)||(visit!==null&&(!Number.isSafeInteger(visit)||visit<0)))return json({error:'공간 정보를 확인해 주세요.'},400);
  // Pre-room clients may continue in the plaza. New requests must match the
  // exact visit to prevent delayed movement or chat from crossing a doorway.
  const gate="room=? AND (visit=? OR (? IS NULL AND room='plaza'))";
  const context=[room,visit,visit];
  const location=()=>stmt('SELECT room,visit,x,z,yaw,jump_seq AS jumpSeq FROM visitors WHERE id=?',id).first();
  async function changed(){
    const position=await location();
    return position?json({error:'공간을 다시 연결하고 있어요.',position},409):json({error:'다시 입장해 주세요.'},401);
  }
  if(p.action==='door'){
    if(visit===null||!Number.isFinite(p.x)||!Number.isFinite(p.z)||!atDoor(room,p.x,p.z))return json({error:'출입문 가까이에서 이용해 주세요.'},400);
    const entering=room===plazaRoom, next=entering?shopRoom:plazaRoom;
    // Choose an unoccupied arrival point within the same atomic write that
    // moves the visitor. Concurrent clicks cannot reserve the same first spot.
    const spots=entrySpots.map(([x,z],i)=>'('+i+','+x+','+z+')').join(',');
    const landing=entering?'(WITH pads(n,px,pz) AS (VALUES '+spots+'), choices AS (SELECT n,px,pz,(SELECT count(*) FROM visitors WHERE room=? AND seen>=? AND (x-px)*(x-px)+(z-pz)*(z-pz)<0.84) AS occupied FROM pads) SELECT px,pz FROM choices ORDER BY occupied,n LIMIT 1)':'(?,?)';
    const landingArgs=entering?[shopRoom,now-20000]:[doorstep.x,doorstep.z];
    const result=await db.batch([
      stmt('UPDATE visitors SET room=?,visit=visit+1,(x,z)='+landing+',yaw=?,seen=?,jump_at=0 WHERE id=? AND '+gate,next,...landingArgs,entering?0:doorstep.yaw,now,id,...context),
      stmt('SELECT room,visit,x,z,yaw,jump_seq AS jumpSeq FROM visitors WHERE id=?',id)
    ]);
    const position=result[1].results[0];
    if(result[0].meta.changes||(position?.room===next&&position.visit===visit+1))return json({position});
    return changed();
  }
  if(p.action==='sync'){
    const seq=p.jumpSeq??0;
    if(!cleanPose(p)||!validJump(seq)||(room===shopRoom&&(Math.abs(p.x)>6.2||Math.abs(p.z)>5.1)))return json({error:'좌표 오류'},400);
    const reads=[
      stmt('UPDATE visitors SET x=?,z=?,yaw=?,seen=?,jump_at=CASE WHEN jump_seq<? THEN ? ELSE jump_at END,jump_seq=MAX(jump_seq,?) WHERE id=? AND '+gate,p.x,p.z,p.yaw,now,seq,now,seq,id,...context),
      stmt('SELECT id,name,color,x,z,yaw,jump_seq AS jumpSeq,jump_at AS jumpAt,profile_key AS profileKey FROM visitors WHERE room=? AND seen>=? ORDER BY seen DESC LIMIT 200',room,now-20000)
    ];
    const compact=p.wire===2;
    const revisionQuery='SELECT COALESCE(SUM(version),0)+(SELECT count(*) FROM teams) AS rev FROM objects';
    const knownRev=Number.isSafeInteger(p.layoutRev)?p.layoutRev:-1;
    if(room===plazaRoom){
      if(compact){
        // Placement revisions only increase, including edits that empty a slot.
        reads.push(stmt("SELECT rev, CASE WHEN rev!=? THEN (SELECT json_group_array(json_object('plot',plot,'slot',slot,'kind',kind,'turn',turn,'version',version)) FROM objects) END AS objects, CASE WHEN rev!=? THEN (SELECT json_group_array(plot) FROM teams) END AS teams FROM ("+revisionQuery+")",knownRev,knownRev));
      }else reads.push(stmt('SELECT plot,slot,kind,turn,version FROM objects'),stmt('SELECT plot FROM teams'));
    }else{
      const after=compact&&Number.isSafeInteger(p.afterMessage)&&p.afterMessage>=0?p.afterMessage:0;
      reads.push(stmt('SELECT id,sender,name,body,sent FROM room_messages WHERE room=? AND id>? AND sent>=? ORDER BY id DESC LIMIT 50',room,after,now-86400000));
    }
    const result=await db.batch(reads);
    if(!result[0].meta.changes)return changed();
    const rows=result[1].results;
    const messages=room===shopRoom?result[2].results.reverse():[];
    if(compact){
      const layout=room===plazaRoom?result[2].results[0]:null;
      const changes=layout?.objects?{objects:JSON.parse(layout.objects),claimed:JSON.parse(layout.teams)}:{};
      return json({room,serverNow:now,...await packPresence(rows,room,p.rosterKey,now),layoutRev:layout?.rev??-1,...changes,messages});
    }
    return json({room,serverNow:now,players:rows,objects:room===plazaRoom?result[2].results:[],
      claimed:room===plazaRoom?result[3].results.map(t=>t.plot):[],messages});
  }
  if(p.action==='chat'){
    const body=typeof p.body==='string'?p.body.trim():'';
    if(room!==shopRoom||visit===null||!body||body.length>240||typeof p.op!=='string'||!/^[a-f0-9-]{36}$/i.test(p.op))return json({error:'240자 이내의 대화를 입력해 주세요.'},400);
    const result=await db.batch([
      stmt('INSERT INTO room_messages(room,sender,name,body,op,sent) SELECT room,id,name,?,?,? FROM visitors WHERE id=? AND '+gate+' ON CONFLICT(sender,op) DO NOTHING',body,p.op,now,id,...context),
      stmt('SELECT m.id,m.sender,m.name,m.body,m.sent FROM room_messages m JOIN visitors v ON v.id=m.sender AND v.room=m.room WHERE v.id=? AND v.visit=? AND v.room=? AND m.op=?',id,visit,room,p.op),
      stmt('DELETE FROM room_messages WHERE room=? AND (sent<? OR id < COALESCE((SELECT id FROM room_messages WHERE room=? ORDER BY id DESC LIMIT 1 OFFSET 119),0))',room,now-86400000,room)
    ]);
    const message=result[1].results[0];
    return message?json({message}):changed();
  }
  if(p.action==='jump'){
    if(!validJump(p.jumpSeq)||!p.jumpSeq)return json({error:'점프 값을 확인해 주세요.'},400);
    await stmt('UPDATE visitors SET jump_seq=?,jump_at=? WHERE id=? AND '+gate+' AND jump_seq<?',p.jumpSeq,now,id,...context,p.jumpSeq).run();
    return json({ok:true});
  }
  if(p.action==='profiles'){
    if(!Array.isArray(p.ids)||p.ids.length>32||p.ids.some(id=>typeof id!=='string'||!/^[a-f0-9]{32}$/.test(id)))return json({error:'프로필 요청을 확인해 주세요.'},400);
    if(!p.ids.length)return json({profiles:[]});
    // Rows created before the appearance table keep their original portrait
    // until their next join. A room-scoped reader can request a lighter portrait.
    const column=p.lite===true?'a.preview':'a.photo';
    const result=await stmt('SELECT v.id,COALESCE('+column+',v.photo) AS photo,COALESCE(a.bio,v.bio) AS bio,v.profile_key AS profileKey FROM visitors v LEFT JOIN visitor_appearances a ON a.id=v.id AND a.profile_key=v.profile_key WHERE v.seen>=? AND v.room=(SELECT room FROM visitors WHERE id=? AND '+gate+') AND v.id IN ('+p.ids.map(()=>'?').join(',')+')',now-20000,id,...context,...p.ids).all();
    return json({profiles:result.results});
  }
  if(p.action==='leave'){await stmt('UPDATE visitors SET seen=0 WHERE id=? AND '+gate,id,...context).run();return json({ok:true});}
  if(room!==plazaRoom||!(await stmt('SELECT id FROM visitors WHERE id=? AND '+gate,id,...context).first()))return changed();
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
