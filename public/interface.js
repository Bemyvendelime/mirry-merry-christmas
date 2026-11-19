import {plots} from './layout.js';
const $=id=>document.getElementById(id), panel=$('panel'), content=$('contents');
const colors=[['#ac4f4c','크랜베리'],['#395b88','인디고'],['#497765','전나무'],['#b88748','황금빛'],['#825d89','자두']];
const kinds={empty:'빈 칸',bench:'벤치',snowman:'눈사람',light:'조명',pine:'작은 전나무'};
const saved=(k,f='')=>{try{return localStorage.getItem('osc-'+k)||f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem('osc-'+k,v)}catch{}};
let color=saved('color',colors[0][0]),world,state={players:[],objects:[],claimed:[]},nearest=null,online=false,timer,settings;
if(!colors.some(([c])=>c===color))color=colors[0][0];
$('name').value=saved('name');
for(const [c,n] of colors){const b=document.createElement('button');b.type='button';b.className='swatch';b.style.setProperty('--c',c);b.title=n;b.setAttribute('aria-label',n);$('colors').append(b);const select=()=>{for(const child of $('colors').children){child.classList.remove('selected');child.setAttribute('aria-pressed','false')}b.classList.add('selected');b.setAttribute('aria-pressed','true');color=c};b.onclick=select;if(c===color)select()}
async function api(action,fields={}){const res=await fetch('/api/world',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...fields}),signal:AbortSignal.timeout(10000)});const v=await res.json();if(!res.ok){const e=new Error(v.error||'요청을 처리하지 못했어요.');e.status=res.status;throw e}return v}
function show(html){content.innerHTML=html;if(!panel.open)panel.showModal()}
$('close').onclick=()=>panel.close();panel.addEventListener('click',e=>{if(e.target===panel){const b=panel.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)panel.close()}});
function help(){show('<h2>광장 이용 안내</h2><p><b>컴퓨터</b><br>W A S D 또는 방향키로 걷고, 화면을 드래그하거나 Q · E로 시점을 돌려요. Shift를 누르면 빨리 걸어요.</p><p><b>모바일</b><br>왼쪽 조이스틱으로 걷고, 오른쪽 화면을 쓸어 시점을 돌려요.</p><p><b>팀 부지</b><br>벽돌 테두리 가까이 가면 꾸미기 버튼이 나타나요. 팀 편집 코드를 공유하면 팀원들이 같은 부지를 함께 꾸밀 수 있어요.</p><a href="/scene-assets/starlit-courtyard.blend" download>월드 블렌더 원본 받기</a>')}
$('instructions').onclick=$('help').onclick=help;
function frame(p){nearest=plots.map(v=>({...v,d:Math.hypot(p.x-v.x,p.z-v.z)})).sort((a,b)=>a.d-b.d)[0];$('location').textContent=nearest.d<6?nearest.id+' 부지':Math.abs(p.x)>12?(p.x<0?'A 산책로':'B 산책로'):'별빛광장';$('editNearby').hidden=nearest.d>6.2;$('editNearby').textContent=nearest.id+' 부지 꾸미기'}
async function sync(){let wait=900;try{const {x,z,yaw}=world.player;state=await api('sync',{x,z,yaw});world.apply(state);online=true;$('presence').textContent='접속 '+state.players.length+'명';$('notice').textContent=''}catch(e){online=false;$('presence').textContent='재연결 중';$('notice').textContent='연결을 복구하고 있어요. 팀 편집은 연결 후 사용할 수 있어요.';wait=2200;if(e.status===401)try{const v=await api('join',settings);world.player.id=v.id}catch{}}finally{timer=setTimeout(sync,wait)}}
$('join').onsubmit=async e=>{e.preventDefault();const name=$('name').value.trim();if(!name)return;$('enter').disabled=true;$('joinStatus').textContent='겨울 광장을 준비하고 있어요…';
  try{if(!world){const {startWorld}=await import('./play.js');world=await startWorld(frame)}settings={name,color};const p=await api('join',settings);save('name',name);save('color',color);
    world.start({...p,name,color});$('welcome').hidden=true;$('hud').hidden=false;await sync();
  }catch(error){$('joinStatus').textContent=/webgl/i.test(error.message)?'이 브라우저에서 3D 그래픽을 시작할 수 없어요. Safari 또는 Chrome에서 열어 주세요.':'입장하지 못했어요. '+(error.message||'연결을 확인해 주세요.');$('enter').disabled=false}};
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
    catch(e){msg.textContent=e.message;if(e.status===409){const fresh=await api('sync',{x:world.player.x,z:world.player.z,yaw:world.player.yaw});state=fresh;world.apply(state);editing(plot);$('edmsg').textContent=e.message}}
    finally{btn.disabled=false}};
}
$('editNearby').onclick=()=>{if(!online){$('notice').textContent='연결을 복구한 후 사용할 수 있어요.';return}const id=nearest.id;
  if(codeFor(id)){api('unlock',{plot:id,code:codeFor(id)}).then(()=>editing(id)).catch(e=>{if(e.status===403)save('team-'+id,'');$('notice').textContent=e.message});return}
  const claimed=state.claimed.includes(id);show('<h2>'+id+' 부지</h2><p>'+(claimed?'팀 편집 코드를 입력하면 함께 꾸밀 수 있어요.':'이 부지를 사용하면 팀원과 공유할 편집 코드가 생겨요.')+'</p>'+(claimed?'<label>팀 편집 코드<input id="codeinput" autocomplete="off" maxlength="24"></label>':'')+'<button class="primary" id="claim">'+(claimed?'팀 편집 열기':'이 부지 사용하기')+'</button><p class="msg" id="edmsg" role="status"></p>');
  if(claimed&&saved('pending-'+id))$('codeinput').value=saved('pending-'+id);
  $('claim').onclick=async()=>{const code=claimed?$('codeinput').value.trim().toUpperCase():(saved('pending-'+id)||newCode());if(!claimed)save('pending-'+id,code);$('claim').disabled=true;try{await api(claimed?'unlock':'claim',{plot:id,code});save('team-'+id,code);save('pending-'+id,'');if(!state.claimed.includes(id))state.claimed.push(id);editing(id)}catch(e){$('edmsg').textContent=e.message;$('claim').disabled=false}}};
