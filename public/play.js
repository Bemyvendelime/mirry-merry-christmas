import * as T from 'three';
import {buildScenery} from './world-scene.js';
import {createAvatars} from './avatars.js';
import {plots} from './layout.js';
export async function startWorld(onFrame){
  const root=document.querySelector('#game');
  let renderer,software=false;
  try {renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}
  catch {const {createCanvasView}=await import('./canvas-view.js');renderer=createCanvasView(root);software=true}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));root.replaceChildren(renderer.domElement);
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(60,1,.12,360),scenery=software?{update(){}}:buildScenery(scene),avatars=software?{render:players=>renderer.setActors(players)}:createAvatars(scene);
  let heading=0,elev=.15,deltaStick={x:0,y:0},t0=performance.now(),elapsed=0,last=0,ready=false;
  const player={id:'',x:0,z:21,yaw:0,color:'#ac4f4c'},remotes=new Map(),keys=new Set(),placed=new Map();
  const templates={}, mat=c=>new T.MeshStandardMaterial({color:c,roughness:.85});
  function piece(g,m,x,y,z,group){const a=new T.Mesh(g,m);a.position.set(x,y,z);group.add(a);return a}
  for(const kind of ['pine','light','snowman','bench'])templates[kind]=new T.Group();
  for(let i=0;i<3;i++)piece(new T.ConeGeometry(.63-i*.12,.92,9),mat(0x385848+i*0x050606),0,.75+i*.44,0,templates.pine);
  piece(new T.CylinderGeometry(.10,.14,.6,8),mat(0x634438),0,.3,0,templates.pine);
  piece(new T.BoxGeometry(.12,1.35,.12),mat(0x423838),0,.67,0,templates.light);
  piece(new T.BoxGeometry(.35,.45,.35),new T.MeshBasicMaterial({color:0xffce81}),0,1.51,0,templates.light);
  piece(new T.ConeGeometry(.33,.31,4),mat(0x493d40),0,1.88,0,templates.light);
  for(const [y,r] of [[.37,.41],[.89,.31],[1.31,.24]])piece(new T.SphereGeometry(r,14,10),mat(0xe7eaf2),0,y,0,templates.snowman);
  piece(new T.CylinderGeometry(.16,.20,.22,12),mat(0x523f4c),0,1.56,0,templates.snowman);
  piece(new T.TorusGeometry(.24,.047,6,16),mat(0xab4f4f),0,1.11,0,templates.snowman).rotation.x=Math.PI/2;
  for(const x of [-.082,.082])piece(new T.SphereGeometry(.028,6,5),mat(0x302d36),x,1.35,-.215,templates.snowman);
  const bench=await fetch('/scene-assets/bench.json').then(r=>{if(!r.ok)throw Error('벤치 파일을 열 수 없어요.');return r.json()});
  for(const p of bench.parts){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.positions,3));g.computeVertexNormals();piece(g,mat(p.color),0,0,0,templates.bench)}
  const res=()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};addEventListener('resize',res);res();
  const canMove=()=>ready&&!document.querySelector('dialog').open;
  addEventListener('keydown',e=>{if(canMove()&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){keys.add(e.code);e.preventDefault()}});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
  const canvas=renderer.domElement;let drag=null;
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(!drag||!canMove())return;heading-=(e.clientX-drag.x)*.006;elev=T.MathUtils.clamp(elev+(e.clientY-drag.y)*.003,-.14,.65);drag={x:e.clientX,y:e.clientY}};
  canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
  const stick=document.querySelector('#stick');
  function stickMove(e){const b=stick.getBoundingClientRect();let x=(e.clientX-b.left-b.width/2)/38,y=(e.clientY-b.top-b.height/2)/38;const len=Math.max(1,Math.hypot(x,y));x/=len;y/=len;deltaStick={x,y};stick.firstElementChild.style.transform='translate('+x*30+'px,'+y*30+'px)'}
  stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);stickMove(e)};stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))stickMove(e)};stick.onpointerup=stick.onpointercancel=()=>{deltaStick={x:0,y:0};stick.firstElementChild.style.transform=''};
  const labels=new Map();
  function updateLabels(players){
    if(software)return;
    const nearby=new Set();
    for(const p of players){
      if(p.id===player.id||Math.hypot(p.x-player.x,p.z-player.z)>15||nearby.size>=18)continue;
      nearby.add(p.id);let label=labels.get(p.id);
      if(!label){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=72;
        const ctx=canvas.getContext('2d');ctx.font='bold 29px sans-serif';ctx.textAlign='center';
        const width=Math.min(318,ctx.measureText(p.name).width+32);
        ctx.fillStyle='#17263ed9';ctx.fillRect((320-width)/2,7,width,53);ctx.fillStyle='#fff4db';ctx.fillText(p.name,160,44,295);
        const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
        label=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));label.scale.set(2.45,.55,1);scene.add(label);labels.set(p.id,label)}
      label.position.set(p.x,2.15,p.z)}
    for(const [id,label] of labels)if(!nearby.has(id)){scene.remove(label);label.material.map.dispose();label.material.dispose();labels.delete(id)}
  }
  const desired=new T.Vector3(),look=new T.Vector3();let first=true;
  function render(t){const dt=Math.min((t-t0)/1000,.06);t0=t;elapsed+=dt;let dx=0,dz=0;
    if(canMove()){heading+=((keys.has('KeyQ')?1:0)-(keys.has('KeyE')?1:0))*dt*1.65;
      dx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+deltaStick.x;
      dz=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+deltaStick.y;}
    player.moving=Math.hypot(dx,dz)>.07;
    if(player.moving){const div=Math.max(1,Math.hypot(dx,dz)),s=Math.sin(heading),c=Math.cos(heading),vx=(c*dx+s*dz)/div,vz=(-s*dx+c*dz)/div;
      const step=dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?7:4.8);const x=T.MathUtils.clamp(player.x+vx*step,-52,52),z=T.MathUtils.clamp(player.z+vz*step,-46,46);
      if(Math.hypot(x,z)>3.7){player.x=x;player.z=z}player.yaw=Math.atan2(-vx,-vz);}
    const visible=[player];for(const r of remotes.values()){const k=Math.min(1,dt*3.6);r.moving=Math.hypot(r.tx-r.x,r.tz-r.z)>.055;r.x+=(r.tx-r.x)*k;r.z+=(r.tz-r.z)*k;r.yaw+=Math.atan2(Math.sin(r.tyaw-r.yaw),Math.cos(r.tyaw-r.yaw))*k;visible.push(r)}
    avatars.render(visible,dt);updateLabels(visible);desired.set(player.x+Math.sin(heading)*4.5,2.55+elev*4,player.z+Math.cos(heading)*4.5);
    look.set(player.x-Math.sin(heading)*5,1.8-elev*2,player.z-Math.cos(heading)*5);
    cam.position.lerp(desired,first?1:1-Math.exp(-dt*12));cam.lookAt(look);first=false;scenery.update(elapsed);renderer.render(scene,cam);
    if(t-last>200){last=t;onFrame(player)}}
  return {player,start(p){Object.assign(player,p);ready=true;renderer.setAnimationLoop(render)},apply(state){const live=new Set();
    for(const p of state.players){if(p.id===player.id)continue;live.add(p.id);const r=remotes.get(p.id)||{...p};Object.assign(r,{tx:p.x,tz:p.z,tyaw:p.yaw,color:p.color});remotes.set(p.id,r)}for(const id of remotes.keys())if(!live.has(id))remotes.delete(id);
    if(software){renderer.setObjects(state.objects);return}
    for(const o of state.objects){const key=o.plot+'-'+o.slot,old=placed.get(key);if(old?.version===o.version)continue;if(old?.mesh)scene.remove(old.mesh);let mesh=null;
      if(o.kind!=='empty'&&templates[o.kind]){const plot=plots.find(p=>p.id===o.plot);if(!plot)continue;mesh=templates[o.kind].clone();const a=plot.angle,lx=(o.slot%3-1)*1.8,lz=(Math.floor(o.slot/3)-1)*1.7;mesh.position.set(plot.x+lx*Math.cos(a)+lz*Math.sin(a),.11,plot.z-lx*Math.sin(a)+lz*Math.cos(a));mesh.rotation.y=a+o.turn*Math.PI/2;scene.add(mesh)}placed.set(key,{version:o.version,mesh})}
  }};
}
