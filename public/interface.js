import {plots} from './layout.js';
import {createMinimap} from './minimap.js';
const $=id=>document.getElementById(id), panel=$('panel'), content=$('contents');
const kinds={empty:'빈 칸',bench:'벤치',snowman:'눈사람',light:'조명',pine:'작은 전나무'};
const saved=(k,f='')=>{try{return localStorage.getItem('osc-'+k)||f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem('osc-'+k,v)}catch{}};
let world,state={players:[],objects:[],claimed:[]},nearest=null,online=false,timer,settings;
const profileCache=new Map();
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
async function api(action,fields={}){const res=await fetch('/api/world',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...fields}),signal:AbortSignal.timeout(10000)});const v=await res.json();if(!res.ok){const e=new Error(v.error||'요청을 처리하지 못했어요.');e.status=res.status;throw e}return v}
function show(html){content.innerHTML=html;if(!panel.open)panel.showModal()}
$('close').onclick=()=>panel.close();panel.addEventListener('click',e=>{if(e.target===panel){const b=panel.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)panel.close()}});
function help(){show('<h2>광장 이용 안내</h2><p><b>컴퓨터</b><br>W A S D 또는 방향키로 걷고, 화면을 드래그해 둘러보세요. 스페이스바를 누르면 점프하고 Shift를 누르면 빨리 걷고, Tab을 누를 때마다 후방 3인칭, 1인칭, 정면 3인칭 순서로 바뀌어요. Esc를 누르면 오른쪽 위 메뉴로 이동해요.</p><p><b>모바일</b><br>왼쪽 조이스틱으로 걷고 오른쪽 아래 점프 버튼으로 뛰어오르세요. 화면을 드래그하면 주위를 둘러볼 수 있어요. 오른쪽 위에서 후방 3인칭, 1인칭, 정면 3인칭을 선택할 수 있어요.</p><p><b>팀 부지</b><br>벽돌 테두리 가까이 가면 꾸미기 버튼이 나타나요. 팀 편집 코드를 공유하면 팀원들이 같은 부지를 함께 꾸밀 수 있어요.</p><a href="/scene-assets/starlit-courtyard.blend" download>월드 블렌더 원본 받기</a><p><b>ThreeRT 네이티브 장면</b><br>하드웨어 레이트레이싱으로 광장을 둘러볼 수 있어요. 팀 부지 편집은 웹 광장에서 진행해요.</p><div class="native-links"><a href="threerts://osc-starlit-courtyard.bentivoglio0806.chatgpt.site/scene-assets/threert/" target="_blank" rel="noopener">ThreeRT 앱에서 열기</a><a href="/scene-assets/starlit-threert.zip" download>장면 파일 받기</a></div>')}
$('help').onclick=help;
const drawMinimap=createMinimap($('minimap'));
function frame(p){
  drawMinimap(p);
  let place=null,distance=Infinity;
  for(const plot of plots){
    const d=Math.hypot(p.x-plot.x,p.z-plot.z);
    if(d<distance){place=plot;distance=d;}
  }
  if(place!==nearest)$('editNearby').textContent=place.id+' 부지 꾸미기';
  nearest=place;$('editNearby').hidden=distance>6.2;
}
function applyProfiles(snapshot){
  for(const player of snapshot.players){
    const cached=profileCache.get(player.id);
    player.photo=cached?.profileKey===player.profileKey?cached.photo:'';
  }
  world.apply(snapshot);
}
async function syncProfiles(snapshot){
  const ids=new Set(snapshot.players.map(p=>p.id));
  for(const id of profileCache.keys())if(!ids.has(id))profileCache.delete(id);
  const pending=snapshot.players.filter(p=>p.id!==world.player.id&&p.profileKey&&profileCache.get(p.id)?.profileKey!==p.profileKey);
  for(let i=0;i<pending.length;i+=32){
    const {profiles}=await api('profiles',{ids:pending.slice(i,i+32).map(p=>p.id)});
    for(const p of profiles)profileCache.set(p.id,p);
  }
  if(pending.length)applyProfiles(state);
}
async function sync(){let wait=900;try{const {x,z,yaw,jumpSeq,jumpStart}=world.player;state=await api('sync',{x,z,yaw,jumpSeq:performance.now()-jumpStart<2400?jumpSeq:0});applyProfiles(state);online=true;$('presence').textContent='접속 '+state.players.length+'명';$('notice').textContent='';await syncProfiles(state).catch(()=>{})}catch(e){online=false;$('presence').textContent='재연결 중';$('notice').textContent='연결을 복구하고 있어요. 팀 편집은 연결 후 사용할 수 있어요.';wait=2200;if(e.status===401)try{const v=await api('join',settings);world.player.id=v.id}catch{}}finally{timer=setTimeout(sync,wait)}}
$('join').onsubmit=async e=>{
  e.preventDefault();
  const name=$('name').value.trim(),bio=$('bio').value.trim();
  if(!name||converting||joining||(sourceFile&&!profilePhoto))return;
  joining=true;$('buildBody').disabled=true;$('enter').disabled=true;$('back').disabled=true;$('portrait').disabled=true;
  $('joinStatus').textContent='광장을 열고 있어요…';
  try{
    settings={name,bio,photo:profilePhoto,color:'#ac4f4c'};
    if(!world){const {startWorld}=await import('./play.js');world=await startWorld(frame,seq=>{api('jump',{jumpSeq:seq}).catch(()=>{})});}
    const p=await api('join',{...settings,arrival:true});
    save('name',name);save('bio',bio);
    world.start({...p,...settings});frame(world.player);
    $('profile').hidden=true;$('hud').hidden=false;
    preview?.dispose();preview=null;await sync();
  }catch(error){$('joinStatus').textContent='입장하지 못했어요. '+(error.message||'연결을 확인해 주세요.');}
  finally{joining=false;$('buildBody').disabled=false;$('enter').disabled=false;$('back').disabled=false;$('portrait').disabled=false;}
};
function map(){const p=world.player;const dots=plots.map(v=>'<g><rect x="'+(v.x-2.7)+'" y="'+(v.z-2.7)+'" width="5.4" height="5.4" rx=".8" fill="'+(v.id[0]==='A'?'#a76657':'#64769f')+'"/><text x="'+v.x+'" y="'+(v.z+1)+'" text-anchor="middle" fill="#fff9e8" font-size="2.6">'+v.id+'</text></g>').join('');
  show('<h2>광장 지도</h2><svg class="plotmap" viewBox="-55 -43 110 89" role="img" aria-label="서쪽 A구역 6부지, 동쪽 B구역 7부지, 중앙 별 트리"><g fill="none" stroke="#839099" stroke-width="2"><ellipse cx="-25" cy="-8" rx="16" ry="20"/><ellipse cx="25" cy="-8" rx="16" ry="20"/><circle r="10"/><path d="M0 10V39"/></g>'+dots+'<text x="0" y="2" text-anchor="middle" fill="#f8dba2" font-size="7">✴</text><circle cx="'+p.x+'" cy="'+p.z+'" r="2.1" fill="#95f5cb" stroke="#172c38" stroke-width=".5"/></svg><div class="legend"><span>✴ 중앙 트리</span><span>● 내 위치</span></div><p>왼쪽은 A구역, 오른쪽은 B구역이에요. 꾸밀 부지까지 걸어가세요.</p>')}
$('openmap').onclick=map;
function codeFor(id){return saved('team-'+id)}
function newCode(){return Array.from(crypto.getRandomValues(new Uint8Array(7)),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()}
function editing(plot){
  const cells=Array.from({length:9},(_,i)=>state.objects.find(o=>o.plot===plot&&o.slot===i)||{slot:i,kind:'empty',turn:0,version:0});let slot=0;
  show('<h2>'+plot+' 부지 꾸미기</h2><p>배치할 칸과 장식을 골라 주세요.</p><div class="grid" id="cells"></div><div class="row"><label>장식<select id="kind">'+Object.entries(kinds).map(([k,n])=>'<option value="'+k+'">'+n+'</option>').join('')+'</select></label><label>방향<select id="turn">'+[0,90,180,270].map((t,i)=>'<option value="'+i+'">'+t+'°</option>').join('')+'</select></label></div><button class="primary" id="commit">배치 저장</button><p class="msg" id="edmsg" role="status"></p><details><summary>팀 편집 코드</summary><p>같은 부지를 꾸밀 팀원에게 알려 주세요.</p><span class="teamcode" id="teamkey"></span></details>');
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
$('editNearby').onclick=()=>{if(!online){$('notice').textContent='연결을 복구한 후 사용할 수 있어요.';return}const id=nearest.id;
  if(codeFor(id)){api('unlock',{plot:id,code:codeFor(id)}).then(()=>editing(id)).catch(e=>{if(e.status===403)save('team-'+id,'');$('notice').textContent=e.message});return}
  const claimed=state.claimed.includes(id);show('<h2>'+id+' 부지</h2><p>'+(claimed?'팀 편집 코드를 입력하면 함께 꾸밀 수 있어요.':'이 부지를 사용하면 팀원과 공유할 편집 코드가 생겨요.')+'</p>'+(claimed?'<label>팀 편집 코드<input id="codeinput" autocomplete="off" maxlength="24"></label>':'')+'<button class="primary" id="claim">'+(claimed?'팀 편집 열기':'이 부지 사용하기')+'</button><p class="msg" id="edmsg" role="status"></p>');
  if(claimed&&saved('pending-'+id))$('codeinput').value=saved('pending-'+id);
  $('claim').onclick=async()=>{const code=claimed?$('codeinput').value.trim().toUpperCase():(saved('pending-'+id)||newCode());if(!claimed)save('pending-'+id,code);$('claim').disabled=true;try{await api(claimed?'unlock':'claim',{plot:id,code});save('team-'+id,code);save('pending-'+id,'');if(!state.claimed.includes(id))state.claimed.push(id);editing(id)}catch(e){$('edmsg').textContent=e.message;$('claim').disabled=false}}};
