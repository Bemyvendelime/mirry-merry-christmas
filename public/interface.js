import {plots} from './layout.js';
import {createMinimap,plazaMapMarkup} from './minimap.js';
import {atDoor,plazaRoom,shopRoom} from './room-space.js';
import {createFootsteps} from './footsteps.js';
import {setupChat} from './room-chat.js';
const $=id=>document.getElementById(id), panel=$('panel'), content=$('contents');
const kinds={empty:'빈 칸',bench:'벤치',snowman:'눈사람',light:'조명',pine:'작은 전나무'};
const saved=(k,f='')=>{try{return localStorage.getItem('osc-'+k)||f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem('osc-'+k,v)}catch{}};
let world,state={players:[],objects:[],claimed:[]},nearest=null,online=false,timer,settings;
const profileCache=new Map();
const footsteps=createFootsteps($('footSound'));
let epoch=0,doorPending=false,loadingProfiles=false;
let rosterKey='',roster=[],layoutRev=-1,afterMessage=0;
const roomContext=()=>({room:world?.player.room??plazaRoom,visit:world?.player.visit??0});
const chat=setupChat(api,roomContext,()=>world?.focus());
let profilePhoto='',photoRequest=0,preview,previewModule,converting=false,joining=false;
$('name').value=saved('name');
$('bio').value=saved('bio');
async function startPreview(){
  previewModule ||= import('./joint-rig.js').catch(error=>{previewModule=null;throw error});
  const {createRigPreview}=await previewModule;
  if($('profile').hidden)return;
  preview ||= createRigPreview($('rigPreview'));
  preview.setPhoto(profilePhoto);
}
$('openProfile').onclick=()=>{
  $('welcome').hidden=true;$('profile').hidden=false;
  $('portrait').focus();
  startPreview().catch(()=>{$('photoStatus').textContent='미리보기를 열지 못했어요.'});
};
$('back').onclick=()=>{
  if(joining)return;
  $('profile').hidden=true;$('welcome').hidden=false;
  preview?.dispose();preview=null;$('openProfile').focus();
};
let sourceFile=null,sourceURL='',working=Promise.resolve();
let pointer={x:.5,y:.5},selectedSubject=null,adding=false;
let bodyOverride=null,bodyApplied=false,bodyTools;
async function loadBodyTools(){
  if(!bodyTools){
    const [codec,body]=await Promise.all([import('./subject-codec.js'),import('./subject-body.js')]);
    bodyTools={encode:codec.encodeSubject,detect:body.shouldCompleteBody,build:body.completeBody};
  }
}
function buildPhoto(subject){
  const useBody=bodyOverride??bodyTools.detect(subject);
  const token=bodyTools.encode(useBody?bodyTools.build(subject):subject);
  bodyApplied=useBody;profilePhoto=token;selectedSubject=subject;
  $('buildBody').checked=useBody;
}
function previewMessage(){
  return bodyApplied?'얼굴에 어울리는 몸통과 다리를 만들었어요.':'움직이는 피사체를 확인해 주세요.';
}
$('buildBody').onchange=()=>{
  if(!selectedSubject||converting||joining)return;
  const previous=bodyOverride;
  bodyOverride=$('buildBody').checked;
  try{
    buildPhoto(selectedSubject);preview?.setPhoto(profilePhoto);
    $('photoStatus').textContent=previewMessage();
  }catch(error){
    bodyOverride=previous;$('buildBody').checked=bodyApplied;
    $('photoStatus').textContent=error.message||'몸통을 만들지 못했어요.';
  }
};
function picker(open){
  $('subjectPicker').hidden=!open;
  $('rigPreview').hidden=open;
  $('refineSubject').hidden=open;
  $('addRegion').hidden=open||!selectedSubject;
  $('bodyControl').hidden=open||!selectedSubject;
  if(open){
    $('pickPoint').style.setProperty('--px',pointer.x*100+'%');
    $('pickPoint').style.setProperty('--py',pointer.y*100+'%');
  }
}
function resetSource(){
  sourceFile=null;
  if(sourceURL)URL.revokeObjectURL(sourceURL);
  sourceURL='';$('sourcePhoto').removeAttribute('src');$('photoActions').hidden=true;
  selectedSubject=null;bodyOverride=null;bodyApplied=false;adding=false;profilePhoto='';preview?.setPhoto('');picker(false);
}
// Each extraction reports bounds in original-photo coordinates, so a second
// tap can restore disconnected details (e.g. a lantern hanging from its post).
function combineRegions(first,extra){
  const a=first.bounds,b=extra.bounds,x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);
  const width=Math.max(a.x+a.width,b.x+b.width)-x,height=Math.max(a.y+a.height,b.y+b.height)-y;
  const scale=first.canvas.width/a.width;
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  const ctx=canvas.getContext('2d');
  for(const part of [extra,first]){
    const r=part.bounds;
    ctx.drawImage(part.canvas,(r.x-x)/width*canvas.width,(r.y-y)/height*canvas.height,r.width/width*canvas.width,r.height/height*canvas.height);
  }
  const fitted=first.landmarks?first:extra;
  const landmarks=fitted.landmarks?.map(l=>({...l,x:(l.x*fitted.bounds.width+fitted.bounds.x-x)/width,y:(l.y*fitted.bounds.height+fitted.bounds.y-y)/height}))??null;
  return {...first,canvas,bounds:{x,y,width,height},landmarks};
}
async function choosePhoto(file,hint=null){
  if(!file||joining)return;
  const seq=++photoRequest;
  if(sourceFile!==file){
    resetSource();sourceFile=file;sourceURL=URL.createObjectURL(file);
    $('sourcePhoto').src=sourceURL;pointer={x:.5,y:.5};
  }
  converting=true;$('enter').disabled=true;$('buildBody').disabled=true;
  $('photoActions').hidden=false;$('refineSubject').disabled=true;$('addRegion').disabled=true;
  $('photoStatus').textContent='사진에서 피사체를 찾고 있어요…';
  const progress=text=>{if(seq===photoRequest)$('photoStatus').textContent=text;};
  const run=async()=>{
    if(seq!==photoRequest)return;
    const [{extractSubject}]=await Promise.all([import('./subject-extract.js'),loadBodyTools()]);
    const extracted=await extractSubject(file,hint,progress);
    if(seq!==photoRequest)return;
    const subject=adding&&selectedSubject?combineRegions(selectedSubject,extracted):extracted;
    if(hint&&!adding)bodyOverride=null;
    buildPhoto(subject);adding=false;picker(false);
    await startPreview();
    if(seq!==photoRequest)return;
    $('photoStatus').textContent=previewMessage();
  };
  working=working.catch(()=>{}).then(run);
  try{await working;}
  catch(e){if(seq===photoRequest){
    if(!selectedSubject){profilePhoto='';preview?.setPhoto('');}
    picker(!!$('sourcePhoto').naturalWidth);
    $('photoStatus').textContent=(e.message||'피사체를 찾지 못했어요.')+($('subjectPicker').hidden?'':' 원본에서 사용할 대상을 눌러 주세요.');
  }}
  finally{if(seq===photoRequest){converting=false;$('buildBody').disabled=false;$('refineSubject').disabled=false;$('addRegion').disabled=false;$('enter').disabled=joining||!profilePhoto;}}
}
$('addRegion').onclick=()=>{adding=true;picker(true);$('pickPoint').focus();$('photoStatus').textContent='빠진 부분을 원본 사진에서 눌러 주세요.';};
$('refineSubject').onclick=()=>{adding=false;picker(true);$('pickPoint').focus();$('photoStatus').textContent='원본 사진에서 움직일 사람이나 사물을 눌러 주세요.';};
$('pickPoint').onkeydown=e=>{
  const shift={ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowDown:[0,.04],ArrowUp:[0,-.04]}[e.key];
  if(!shift)return;
  e.preventDefault();pointer={x:Math.max(0,Math.min(1,pointer.x+shift[0])),y:Math.max(0,Math.min(1,pointer.y+shift[1]))};picker(true);
};
$('pickPoint').onclick=e=>{
  if(converting)return;
  const rect=$('sourcePhoto').getBoundingClientRect();
  if(e.detail&&rect.width&&rect.height)pointer={x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))};
  picker(true);choosePhoto(sourceFile,pointer);
};
$('removePhoto').onclick=()=>{
  if(joining)return;
  ++photoRequest;resetSource();converting=false;$('enter').disabled=false;$('photoStatus').textContent='';
};
$('portrait').onchange=e=>{const file=e.target.files[0];e.target.value='';choosePhoto(file)};
const drop=$('drop');
for(const type of ['dragenter','dragover'])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('drag')});
drop.addEventListener('dragleave',e=>{if(!drop.contains(e.relatedTarget))drop.classList.remove('drag')});
drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');choosePhoto(e.dataTransfer.files[0])});
async function api(action,fields={}){const res=await fetch('/api/world',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...(action==='join'?{}:roomContext()),...fields}),signal:AbortSignal.timeout(10000)});const v=await res.json();if(!res.ok){const e=new Error(v.error||'요청을 처리하지 못했어요.');e.status=res.status;e.position=v.position;throw e}return v}
function show(html){content.innerHTML=html;if(!panel.open)panel.showModal()}
$('close').onclick=()=>panel.close();panel.addEventListener('click',e=>{if(e.target===panel){const b=panel.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)panel.close()}});
function help(){show('<h2>월드 이용 안내</h2><p><b>다섯 거리와 오두막</b><br>중앙 트리에서 뻗은 다섯 거리에 가게 자리가 세 곳씩 있어요. 별빛 거리 A1 오두막의 문 앞에서 E를 누르거나 출입 버튼을 터치하세요. 실내에서 Enter를 누르면 같은 방 사람에게 메시지를 쓸 수 있어요. 남쪽 문으로 나가면 광장으로 돌아와요.</p><p><b>컴퓨터</b><br>WASD 또는 방향키로 걷고, 드래그로 둘러보세요. Space로 점프하고 Shift로 빨리 걸어요. Tab은 후방 3인칭, 1인칭, 정면 3인칭을 차례로 전환해요.</p><p><b>모바일</b><br>왼쪽 조이스틱으로 걷고 점프 버튼으로 뛰어오르세요. 화면을 드래그하면 주위를 둘러볼 수 있어요.</p><p><b>팀 부지</b><br>빈 부지의 표지판 가까이에서 꾸미기 버튼을 누르세요. 팀 편집 코드를 공유하면 팀원이 함께 꾸밀 수 있어요.</p><div class="native-links"><a href="/scene-assets/starlit-courtyard.blend" download>이전 광장 블렌더 파일</a><a href="threerts://osc-starlit-courtyard.bentivoglio0806.chatgpt.site/scene-assets/threert/" target="_blank" rel="noopener">이전 광장 ThreeRT에서 열기</a><a href="/scene-assets/starlit-threert.zip" download>이전 ThreeRT 장면 받기</a></div>')}
$('help').onclick=help;
const drawMinimap=createMinimap($('minimap'));
function frame(p){
  drawMinimap(p);
  const indoors=p.room===shopRoom,door=$('doorAction');
  door.hidden=!atDoor(p.room,p.x,p.z);door.disabled=doorPending;
  const doorText=indoors?'광장으로 나가기':'오두막 들어가기';
  if(door.textContent!==doorText)door.textContent=doorText;
  let place=null,distance=Infinity;
  if(!indoors)for(const plot of plots){
    const d=Math.hypot(p.x-plot.x,p.z-plot.z);
    if(d<distance){place=plot;distance=d;}
  }
  if(place&&place!==nearest)$('editNearby').textContent=place.label+' 부지 꾸미기';
  nearest=place;$('editNearby').hidden=indoors||!place||place.id==='cottage'||distance>6.2;
}
function applyProfiles(snapshot){
  for(const player of snapshot.players){
    const cached=profileCache.get(player.id);
    player.photo=cached?.profileKey===player.profileKey?cached.photo:'';
  }
  world.apply(snapshot);
}
async function syncProfiles(generation){
  if(loadingProfiles)return;
  const me=world.player;
  const distance=p=>(p.x-me.x)**2+(p.z-me.z)**2;
  const ordered=state.players.filter(p=>p.id!==me.id&&p.profileKey).sort((a,b)=>distance(a)-distance(b));
  // Full portraits go to the nearest group. A compact volumetric subject keeps
  // every other visitor recognizable and is upgraded when they approach.
  const close=ordered.slice(0,12).filter(p=>distance(p)<=16*16);
  const needs=(p,full)=>{
    const prev=profileCache.get(p.id);
    return prev?.profileKey!==p.profileKey||(full&&prev.lite);
  };
  let missing=close.filter(p=>needs(p,true));
  const lite=!missing.length;
  if(lite)missing=ordered.filter(p=>needs(p,false));
  if(!missing.length)return;
  loadingProfiles=true;
  try{
    const {profiles}=await api('profiles',{ids:missing.slice(0,6).map(p=>p.id),lite});
    if(generation!==epoch)return;
    for(const p of profiles){
      profileCache.delete(p.id);profileCache.set(p.id,{...p,lite});
      if(profileCache.size>160)profileCache.delete(profileCache.keys().next().value);
    }
    if(profiles.length)applyProfiles(state);
    if(profiles.length)setTimeout(()=>{if(generation===epoch&&!doorPending)syncProfiles(generation);},240);
  }catch{}finally{loadingProfiles=false;}
}
function unpackSnapshot(packet){
  if(packet.players)return packet;
  if(packet.roster){rosterKey=packet.rosterKey;roster=packet.roster;}
  if(rosterKey!==packet.rosterKey||roster.length!==packet.poses.length){
    rosterKey='';throw Error('참가자 목록을 다시 받고 있어요.');
  }
  const players=packet.poses.map(([x,z,yaw,jumpSeq=0,jumpAt=0],i)=>{
    const [id,name,color,profileKey]=roster[i];
    return {id,name,color,profileKey,x:x/100,z:z/100,yaw:yaw/1000,jumpSeq,jumpAt};
  });
  layoutRev=packet.layoutRev;
  if(packet.messages.length)afterMessage=packet.messages.at(-1).id;
  return {...packet,players,objects:packet.objects??state.objects,claimed:packet.claimed??state.claimed};
}
function roomHUD(room){
  const indoor=room===shopRoom;
  document.body.dataset.room=room;
  $('openmap').setAttribute('aria-label',indoor?'오두막 미니맵 · 실내 지도 열기':'내 위치 미니맵 · 전체 지도 열기');
  $('presence').textContent=(indoor?'오두막':'광장')+' · 연결 중';
  chat.enter(indoor);frame(world.player);
}
function changeRoom(position){
  epoch++;clearTimeout(timer);online=false;rosterKey='';roster=[];layoutRev=-1;afterMessage=0;
  state={players:[],objects:[],claimed:[],messages:[]};
  world.setRoom(position);roomHUD(position.room);
}
function scheduleSync(delay){
  clearTimeout(timer);timer=setTimeout(sync,delay);
}
async function sync(){
  const generation=epoch;
  let wait=850+Math.random()*100;
  try{
    const {x,z,yaw,jumpSeq,jumpStart}=world.player;
    const packet=await api('sync',{wire:2,rosterKey,layoutRev,afterMessage,x,z,yaw,jumpSeq:performance.now()-jumpStart<2400?jumpSeq:0});
    if(generation!==epoch||doorPending)return;
    const snapshot=unpackSnapshot(packet);state=snapshot;applyProfiles(snapshot);online=true;
    $('presence').textContent=(snapshot.room===shopRoom?'오두막':'광장')+' · '+snapshot.players.length+'명';
    $('notice').textContent='';chat.display(snapshot.messages);
    syncProfiles(generation);
  }catch(e){
    if(generation!==epoch||doorPending)return;
    online=false;$('presence').textContent='재연결 중';$('notice').textContent='월드에 다시 연결하고 있어요.';wait=2200;
    try{
      const position=e.position||(e.status===401?await api('join',settings):null);
      if(position&&generation===epoch){changeRoom(position);scheduleSync(0);}
    }catch{}
  }finally{if(generation===epoch&&!doorPending)scheduleSync(wait);}
}
$('doorAction').onclick=async()=>{
  const p=world?.player;
  if(!p||doorPending||!atDoor(p.room,p.x,p.z))return;
  doorPending=true;epoch++;clearTimeout(timer);world.freeze(true);$('doorAction').disabled=true;
  try{
    const {position}=await api('door',{x:p.x,z:p.z});changeRoom(position);
    $('notice').textContent='';
  }catch(e){
    if(e.position)changeRoom(e.position);
    else $('notice').textContent=e.message;
  }finally{
    doorPending=false;world.freeze(false);frame(world.player);world.focus();scheduleSync(0);
  }
};
$('join').onsubmit=async e=>{
  e.preventDefault();
  const name=$('name').value.trim(),bio=$('bio').value.trim();
  if(!name||converting||joining||(sourceFile&&!profilePhoto))return;
  footsteps.unlock();
  joining=true;$('buildBody').disabled=true;$('enter').disabled=true;$('back').disabled=true;$('portrait').disabled=true;
  $('joinStatus').textContent='광장을 열고 있어요…';
  try{
    settings={name,bio,photo:profilePhoto,color:'#ac4f4c'};
    if(!world){const {startWorld}=await import('./play.js');world=await startWorld(frame,seq=>{api('jump',{jumpSeq:seq}).catch(()=>{})},footsteps);}
    const p=await api('join',{...settings,arrival:true});
    save('name',name);save('bio',bio);
    world.start({...p,...settings});roomHUD(p.room);
    $('profile').hidden=true;$('hud').hidden=false;
    preview?.dispose();preview=null;await sync();
  }catch(error){$('joinStatus').textContent='입장하지 못했어요. '+(error.message||'연결을 확인해 주세요.');}
  finally{joining=false;$('buildBody').disabled=false;$('enter').disabled=false;$('back').disabled=false;$('portrait').disabled=false;}
};
function map(){
  const p=world.player,indoors=p.room===shopRoom;
  const title=indoors?'A1 눈꽃 오두막':'광장 지도';
  const legend=indoors?'● 내 위치 · 남쪽 문은 광장으로 이어져요.':'✴ 중앙 트리　● 내 위치　⌂ A1 눈꽃 오두막';
  const description=indoors?'':'<p>각 거리에 팀 부지가 세 곳씩 있어요. 별빛 거리 A1 오두막은 지금 들어갈 수 있어요.</p>';
  show('<h2>'+title+'</h2>'+plazaMapMarkup(p)+'<div class="legend">'+legend+'</div>'+description);
}
$('openmap').onclick=map;
const plotLabel=id=>plots.find(p=>p.id===id)?.label||id;
function codeFor(id){return saved('team-'+id)}
function newCode(){return Array.from(crypto.getRandomValues(new Uint8Array(7)),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()}
function editing(plot){
  const cells=Array.from({length:9},(_,i)=>state.objects.find(o=>o.plot===plot&&o.slot===i)||{slot:i,kind:'empty',turn:0,version:0});let slot=0;
  show('<h2>'+plotLabel(plot)+' 부지 꾸미기</h2><p>배치할 칸과 장식을 골라 주세요.</p><div class="grid" id="cells"></div><div class="row"><label>장식<select id="kind">'+Object.entries(kinds).map(([k,n])=>'<option value="'+k+'">'+n+'</option>').join('')+'</select></label><label>방향<select id="turn">'+[0,90,180,270].map((t,i)=>'<option value="'+i+'">'+t+'°</option>').join('')+'</select></label></div><button class="primary" id="commit">배치 저장</button><p class="msg" id="edmsg" role="status"></p><details><summary>팀 편집 코드</summary><p>같은 부지를 꾸밀 팀원에게 알려 주세요.</p><span class="teamcode" id="teamkey"></span></details>');
  $('teamkey').textContent=codeFor(plot);
  function pick(i){slot=i;[...$('cells').children].forEach((b,j)=>b.classList.toggle('sel',i===j));$('kind').value=cells[i].kind;$('turn').value=cells[i].turn}
  for(let i=0;i<9;i++){const b=document.createElement('button');b.textContent=(i+1)+' · '+kinds[cells[i].kind];b.onclick=()=>pick(i);$('cells').append(b)}pick(0);
  $('commit').onclick=async()=>{const btn=$('commit'),msg=$('edmsg'),i=slot,kind=$('kind').value,turn=Number($('turn').value);btn.disabled=true;try{
    const r=await api('edit',{plot,slot:i,kind,turn,version:cells[i].version,op:crypto.randomUUID(),code:codeFor(plot)});cells[i]={slot:i,kind,turn,version:r.version};
    const old=state.objects.find(o=>o.plot===plot&&o.slot===i);if(!old||old.version<r.version){state.objects=state.objects.filter(o=>o!==old);state.objects.push({...cells[i],plot});world.apply(state)}
    $('cells').children[i].textContent=(i+1)+' · '+kinds[kind];msg.textContent='저장했어요.'}
    catch(e){msg.textContent=e.message;if(e.status===409){const fresh=await api('sync',{x:world.player.x,z:world.player.z,yaw:world.player.yaw});state=fresh;applyProfiles(state);editing(plot);$('edmsg').textContent=e.message}}
    finally{btn.disabled=false}};
}
$('editNearby').onclick=()=>{if(!nearest||nearest.id==='cottage'||world.player.room!==plazaRoom||doorPending)return;if(!online){$('notice').textContent='연결을 복구한 후 사용할 수 있어요.';return}const id=nearest.id;
  if(codeFor(id)){api('unlock',{plot:id,code:codeFor(id)}).then(()=>editing(id)).catch(e=>{if(e.status===403)save('team-'+id,'');$('notice').textContent=e.message});return}
  const claimed=state.claimed.includes(id);show('<h2>'+plotLabel(id)+' 부지</h2><p>'+(claimed?'팀 편집 코드를 입력하면 함께 꾸밀 수 있어요.':'이 부지를 사용하면 팀원과 공유할 편집 코드가 생겨요.')+'</p>'+(claimed?'<label>팀 편집 코드<input id="codeinput" autocomplete="off" maxlength="24"></label>':'')+'<button class="primary" id="claim">'+(claimed?'팀 편집 열기':'이 부지 사용하기')+'</button><p class="msg" id="edmsg" role="status"></p>');
  if(claimed&&saved('pending-'+id))$('codeinput').value=saved('pending-'+id);
  $('claim').onclick=async()=>{const code=claimed?$('codeinput').value.trim().toUpperCase():(saved('pending-'+id)||newCode());if(!claimed)save('pending-'+id,code);$('claim').disabled=true;try{await api(claimed?'unlock':'claim',{plot:id,code});save('team-'+id,code);save('pending-'+id,'');if(!state.claimed.includes(id))state.claimed.push(id);editing(id)}catch(e){$('edmsg').textContent=e.message;$('claim').disabled=false}}};
