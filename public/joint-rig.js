// Local-space joint asset. A pose is forward kinematics on the parent chain,
// shared by the GPU, the software view and the profile turntable. Metres, Y up.
import {avatarJobs} from './avatar-jobs.js';
import {createSubjectModel, deformSubject} from './subject-model.js';

export const isWholeSubject=token=>typeof token==='string'&&token.startsWith('v2.');

const definitions = [
  ['pelvis',null,0,0,0,.081],
  ['spine','pelvis',0,.235,0,.061],
  ['collar','spine',0,.23,0,.076],
  ['neck','collar',0,.115,0,.042],
  ['head','neck',0,.263,0,.155],
];
for (const [side, sign] of [['left',-1],['right',1]]) {
  definitions.push(
    [side+'Hip','pelvis',sign*.112,0,0,.069],
    [side+'Knee',side+'Hip',sign*.007,-.39,.012,.067],
    [side+'Ankle',side+'Knee',0,-.352,-.01,.050],
    [side+'Toe',side+'Ankle',0,-.038,-.13,.045],
    [side+'Shoulder','collar',sign*.21,-.025,0,.077],
    [side+'Elbow',side+'Shoulder',sign*.086,-.265,.023,.059],
    [side+'Wrist',side+'Elbow',sign*.026,-.235,-.055,.054]
  );
}
const ids=new Map();
export const joints=definitions.map(([name,parent,x,y,z,r],index)=>{
  ids.set(name,index);
  return {name,parent:parent===null?-1:ids.get(parent),x,y,z,r};
});
export const headIndex=ids.get('head');
export const rigFinish={joint:'#eac990',rod:'#9baeb5',edge:'#43515e',shine:'#fff0b9'};
export const rodRadius=.034;
const leftHip=ids.get('leftHip'),rightHip=ids.get('rightHip');
const leftKnee=ids.get('leftKnee'),rightKnee=ids.get('rightKnee');
const leftShoulder=ids.get('leftShoulder'),rightShoulder=ids.get('rightShoulder');
const leftElbow=ids.get('leftElbow'),rightElbow=ids.get('rightElbow');
const spine=ids.get('spine'),collar=ids.get('collar');

const jumpBend=new Float32Array(joints.length);
for(const side of ['left','right']){
  jumpBend[ids.get(side+'Hip')]=.82;
  jumpBend[ids.get(side+'Knee')]=-1.46;
  jumpBend[ids.get(side+'Ankle')]=.37;
  jumpBend[ids.get(side+'Shoulder')]=.77;
  jumpBend[ids.get(side+'Elbow')]=.83;
}
jumpBend[spine]=-.15;
jumpBend[collar]=.10;

export function createRigPose() {
  return {points:joints.map(()=>({x:0,y:0,z:0})),angles:new Float32Array(joints.length)};
}

export function solveRig(pose,phase,gait,airPose=0) {
  const {points,angles}=pose;
  const tuck=Math.max(0,Math.min(1,airPose));
  const stride=Math.sin(phase)*gait;
  const breathe=Math.sin(phase*.5)*.012;
  for (let i=0;i<joints.length;i++){
    const joint=joints[i],point=points[i];
    if(joint.parent<0){
      point.x=.015*stride;point.y=.84;point.z=0;angles[i]=0;
      continue;
    }
    const parent=points[joint.parent],a=angles[joint.parent];
    const c=Math.cos(a),s=Math.sin(a);
    point.x=parent.x+joint.x;point.y=parent.y+joint.y*c-joint.z*s;
    point.z=parent.z+joint.y*s+joint.z*c;
    let bend=0;
    if(i===leftHip)bend=.56*stride;
    if(i===rightHip)bend=-.56*stride;
    if(i===leftKnee)bend=-.66*Math.max(0,-Math.cos(phase))*gait;
    if(i===rightKnee)bend=-.66*Math.max(0,Math.cos(phase))*gait;
    if(i===leftShoulder) bend=-.66*stride-.04;
    if(i===rightShoulder) bend=.66*stride-.04;
    if(i===leftElbow||i===rightElbow)bend=.14+.15*gait;
    if(i===spine)bend=breathe-.07*gait;
    if(i===collar)bend=-breathe;
    // Blend toward a bilateral gather: thighs swing forward, calves fold
    // back, and both forearms lift. The walk returns as the feet land.
    bend+=(jumpBend[i]-bend)*tuck;
    angles[i]=a+bend;
  }
  // The stance foot determines pelvis height even as the knee folds.
  const floor=Math.min(points[ids.get('leftToe')].y,points[ids.get('rightToe')].y);
  for(const point of points)point.y+=.048-floor;
  return points;
}

export function advanceRig(state,id,moving,dt,solve=true,airPose=0){
  if(!state) {
    let seed=0;
    for(const c of String(id))seed=(seed*31+c.charCodeAt(0))|0;
    state={phase:(seed>>>0)%628/100,gait:0,pose:createRigPose()};
  }
  state.gait+=((moving?1:0)-state.gait)*(1-Math.exp(-12*dt));
  state.phase+=dt*(.9+8.3*state.gait);
  state.airPose=Math.max(0,Math.min(1,airPose||0));
  if(solve)solveRig(state.pose,state.phase,state.gait,state.airPose);
  return state;
}

// Coordinates from the caller's camera include depth and projected pixels/metre.
export function paintRig(context,pose,project){
  const points=pose.points.map(p=>project(p.x,p.y,p.z));
  const shapes=[];
  for(let i=0;i<points.length;i++){
    const p=points[i];if(!p)continue;
    const joint=joints[i],q=points[joint.parent];
    if(q)shapes.push({p,q,depth:(p.d+q.d)*.5+.003});
    shapes.push({p,joint,index:i,depth:p.d});
  }
  shapes.sort((a,b)=>b.depth-a.depth);
  context.save();
  context.lineCap='round';
  for(const {p,q,joint,index} of shapes) {
    if(q){
      const width=Math.max(.75,(p.scale+q.scale)*rodRadius);
      context.beginPath();context.moveTo(q.x,q.y);context.lineTo(p.x,p.y);
      context.lineWidth=width+Math.min(width*.35,1.6);context.strokeStyle=rigFinish.edge;context.stroke();
      context.lineWidth=width;context.strokeStyle=rigFinish.rod;context.stroke();

    }else{
      const r=Math.max(.72,joint.r*p.scale);
      context.fillStyle=rigFinish.edge;
      context.beginPath();context.arc(p.x,p.y,r,0,Math.PI*2);context.fill();
      context.fillStyle=rigFinish.joint;context.beginPath();
      context.arc(p.x-r*.12,p.y-r*.16,r*.82,0,Math.PI*2);context.fill();
      if(r>=2){context.fillStyle=rigFinish.shine;context.fillRect(p.x-r*.5,p.y-r*.54,Math.max(1,r*.56),Math.max(1,r*.29));}
    }
  }
  context.restore();
}

const TAU=Math.PI*2;
const srgb=linear=>Math.round(255*Math.max(0,Math.min(1,linear<=.0031308?12.92*linear:1.055*linear**(1/2.4)-.055)));
const period=(angle,n)=>((Math.round(angle*n/TAU)%n)+n)%n;

// Software views come from the same indexed, skinned surface as WebGL.
// Orthographic tiles use a depth buffer, so arms, legs and concave openings
// occlude in the correct order even at the rear and side of a subject.
export function projectSubject(entry,view){
  const {model,posed,projected,colours}=entry;
  const positions=deformSubject(model,view.phase,view.gait,posed,view.tuck);
  const cy=Math.cos(view.yaw),sy=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(let k=0;k<positions.length;k+=3){
    const x=positions[k],y=positions[k+1],z=positions[k+2];
    const u=cy*x+sy*z,depth=cy*z-sy*x,v=y*cp-depth*sp;
    projected[k]=u;projected[k+1]=v;projected[k+2]=y*sp+depth*cp;
    minX=Math.min(minX,u);maxX=Math.max(maxX,u);minY=Math.min(minY,v);maxY=Math.max(maxY,v);
  }
  const scale=view.resolution/Math.max(.05,maxX-minX,maxY-minY);
  const width=Math.ceil((maxX-minX)*scale)+4,height=Math.ceil((maxY-minY)*scale)+4;
  const data=new Uint8ClampedArray(width*height*4),depthBuffer=new Float32Array(width*height);
  depthBuffer.fill(-Infinity);
  for(let k=0;k<projected.length;k+=3){
    projected[k]=(projected[k]-minX)*scale+2;
    projected[k+1]=(maxY-projected[k+1])*scale+2;
  }
  const indices=model.geometry.index.array;
  for(let tri=0;tri<indices.length;tri+=3){
    const a=indices[tri]*3,b=indices[tri+1]*3,c=indices[tri+2]*3;
    const ax=projected[a],ay=projected[a+1],az=projected[a+2];
    const bx=projected[b],by=projected[b+1],bz=projected[b+2];
    const cx=projected[c],cy=projected[c+1],cz=projected[c+2];
    const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
    if(Math.abs(den)<.0001)continue;
    const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(width-1,Math.ceil(Math.max(ax,bx,cx)));
    const y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(height-1,Math.ceil(Math.max(ay,by,cy)));
    const du=(by-cy)/den,dv=(cy-ay)/den;
    for(let y=y0;y<=y1;y++){
      const Y=y+.5-cy;
      let u=(x0+.5-cx)*du+(cx-bx)*Y/den;
      let v=(x0+.5-cx)*dv+(ax-cx)*Y/den;
      for(let x=x0;x<=x1;x++,u+=du,v+=dv){
        const w=1-u-v;
        if(u<-.00002||v<-.00002||w<-.00002)continue;
        const d=az*u+bz*v+cz*w,pi=x+y*width;
        if(d<=depthBuffer[pi])continue;
        depthBuffer[pi]=d;
        const j=pi*4;
        for(let ch=0;ch<3;ch++)data[j+ch]=colours[a+ch]*u+colours[b+ch]*v+colours[c+ch]*w;
        data[j+3]=255;
      }
    }
  }
  return {rgba:data,cols:width,rows:height,left:minX-2/scale,top:maxY+2/scale,width:width/scale,height:height/scale,view};
}

export function prepareRaster(token,preview){
  const model=createSubjectModel(token,preview?undefined:{level:'low'});
  const e={token,model,views:new Map(),seen:0};
  if(model){
    const attrs=model.geometry.attributes,count=attrs.position.count;
    e.posed=new Float32Array(count*3);e.projected=new Float32Array(count*3);e.colours=new Uint8Array(count*3);
    for(let i=0;i<count;i++){
      const shade=.85+.15*Math.max(0,.48*attrs.normal.getY(i)+.78*attrs.normal.getZ(i)-.26*attrs.normal.getX(i));
      e.colours[i*3]=srgb(attrs.color.getX(i)*shade);
      e.colours[i*3+1]=srgb(attrs.color.getY(i)*shade);
      e.colours[i*3+2]=srgb(attrs.color.getZ(i)*shade);
    }
  }
  return e;
}

function tileCanvas({rgba,cols,rows,...tile}){
  const canvas=document.createElement('canvas');canvas.width=cols;canvas.height=rows;
  const ctx=canvas.getContext('2d');
  const image=ctx.createImageData(cols,rows);image.data.set(rgba);ctx.putImageData(image,0,0);
  return {...tile,canvas};
}

// Each visible subject keeps its last available projection. A shared FIFO
// advances missed angles/poses over multiple frames under a small CPU budget.
export function createSubjectPainter(preview=false){
  const subjects=new Map(),queue=new Map(),tiles=new Map();
  let remaining=0,priority=null;
  let frame=0,memory=0,disposed=false;
  const jobs=avatarJobs();
  const budget=preview?3*1024*1024:12*1024*1024;
  function removeTile(tile){
    tiles.delete(tile);
    tile.entry.views.delete(tile.key);
    memory-=tile.canvas.width*tile.canvas.height*4;
  }
  function acquire(token){
    let e=subjects.get(token);
    if(!e||e.remote){
      const old=e;e=prepareRaster(token,preview);if(old)e.views=old.views;subjects.set(token,e);
    }
    return e;
  }
  function evict(token,e){
    for(const tile of e.views.values())removeTile(tile);
    e.model?.geometry.dispose();subjects.delete(token);
  }
  function build(token,view){
    const e=acquire(token);e.seen=frame;
    if(!e.model)return null;
    const cached=e.views.get(view.key);
    if(cached)return cached;
    return remember(e,view,tileCanvas(projectSubject(e,view)));
  }
  function remember(e,view,tile){
    tile.key=view.key;tile.entry=e;e.views.set(view.key,tile);tiles.set(tile,true);
    memory+=tile.canvas.width*tile.canvas.height*4;
    while(memory>budget&&tiles.size>1)removeTile(tiles.keys().next().value);
    return tile;
  }
  function beginFrame(){
    frame++;remaining=jobs.busy?5:6;
    if(frame%60===0){
      for(const [key,e] of subjects)if(frame-e.seen>90)evict(key,e);
    }
    drain();
  }
  function drain(){
    if(disposed||jobs.busy||(jobs.supported&&remaining===0))return;
    // Prioritize the local avatar before regenerating
    // cached poses. Bound main-thread bitmap uploads on slow devices.
    const next=priority&&queue.has(priority)?priority:undefined;
    priority=null;
    const start=performance.now();
    while(queue.size){
      const key=next&&queue.has(next)?next:queue.keys().next().value;
      const job=queue.get(key);queue.delete(key);
      if(frame-job.frame>15||subjects.get(key)?.views.has(job.view.key))continue;
      if(!preview&&jobs.supported){
        const launched=jobs.run({kind:'tile',token:key,view:job.view},result=>{
          if(disposed||!result)return;
          let e=subjects.get(key);
          if(!e){e={token:key,remote:true,views:new Map()};subjects.set(key,e);}
          e.seen=frame;if(!e.views.has(job.view.key))remember(e,job.view,tileCanvas(result));
          drain();
        });
        if(launched){remaining--;break;}
      }
      build(job.token,job.view);
      if(performance.now()-start>=4)break;
    }
  }
  function get(token,yaw,pitch,phase,gait,pixels=70,immediate=false,airPose=0){
    if(!isWholeSubject(token))return null;
    const e=subjects.get(token);
    if(e){e.seen=frame;if(!e.model&&!e.remote)return null;}
    const distant=!preview&&!immediate&&pixels<32;
    const yawCount=preview?96:distant?12:24,phaseCount=preview?24:distant?3:6;
    // Two air silhouettes per view replace the walking cycle while airborne.
    // Vertical travel is projected separately and never becomes a cache key.
    const tuck=airPose>.70?1:airPose>.16?.5:0;
    const angle=period(yaw,yawCount),step=!tuck&&gait>.16?period(phase,phaseCount):0;
    const incline=Math.round(Math.max(-1.42,Math.min(1.42,pitch))/(Math.PI/24));
    const effort=tuck||gait<.16?0:gait<.66?.55:1;
    const resolution=preview?224:pixels>85?104:pixels>32?64:32;
    const key=[yawCount,angle,incline,step,effort,tuck,resolution].join('/');
    let tile=e?.views.get(key);
    if(!tile){
      const view={key,tuck,yaw:angle*TAU/yawCount,pitch:incline*Math.PI/24,phase:step*TAU/phaseCount,gait:effort,resolution};
      if(preview||(immediate&&!jobs.supported)){tile=build(token,view);}
      else{
        // One queued job per subject avoids generating stale intermediate walk poses.
        queue.set(token,{token,view,frame});
        if(immediate)priority=token;
        let score=Infinity;
        if(e)for(const candidate of e.views.values()){
          const v=candidate.view;
          const cost=4*(1-Math.cos(v.yaw-view.yaw))+Math.abs(v.pitch-view.pitch)+
            1.2*Math.abs(v.tuck-view.tuck)+.22*Math.abs(v.gait-view.gait)+.18*(1-Math.cos(v.phase-view.phase))*effort;
          if(cost<score){score=cost;tile=candidate;}
        }
      }
    }
    if(tile){tiles.delete(tile);tiles.set(tile,true);}
    return tile||null;
  }
  function dispose(){disposed=true;jobs.dispose();queue.clear();for(const [token,e] of subjects)evict(token,e);}
  return {beginFrame,get,dispose};
}

export function createRigPreview(canvas){
  const context=canvas.getContext('2d'),pose=createRigPose(),painter=createSubjectPainter(true);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let photo='',raf=0,start=performance.now(),last=-Infinity,offset=0,drag=null,manual=false,alive=true;
  canvas.style.touchAction='none';canvas.tabIndex=0;
  canvas.title='드래그하거나 좌우 방향키로 회전';
  canvas.setAttribute('aria-label','3D 캐릭터 미리보기. 드래그하거나 좌우 방향키로 360도 회전할 수 있어요.');
  function frame(t,forced=false){
    if(!alive)return;
    if(!forced&&!reduce)raf=requestAnimationFrame(frame);
    if(!forced&&t-last<70)return;
    last=t;const sec=(t-start)/1000,w=canvas.width,h=canvas.height;
    const yaw=offset+(manual||reduce?0:Math.sin(sec*.59)*.47);
    const phase=sec*5.25,gait=reduce?0:.94;
    context.clearRect(0,0,w,h);
    painter.beginFrame();
    const tile=painter.get(photo,yaw,.075,phase,gait,210,true);
    if(tile){
      const model=tile.entry.model;
      const scale=Math.min(h*.84/Math.max(.35,model.height), w*.84/Math.max(.28,model.width,model.geometry.boundingBox.max.z-model.geometry.boundingBox.min.z));
      const baseY=h*.50+model.height*scale*.47;
      context.fillStyle='rgba(13,27,49,.23)';context.beginPath();
      context.ellipse(w*.5,baseY,Math.max(3,tile.width*scale*.40),Math.max(2,scale*.035),0,0,TAU);context.fill();
      context.drawImage(tile.canvas,w*.5+tile.left*scale,baseY-tile.top*scale,tile.width*scale,tile.height*scale);
      return;
    }
    const scale=Math.min(h/2.22,w/1.1),c=Math.cos(yaw),s=Math.sin(yaw);
    context.fillStyle='rgba(13,27,49,.22)';context.beginPath();
    context.ellipse(w*.5,h*.945,.33*scale,.06*scale,0,0,TAU);context.fill();
    solveRig(pose,phase,gait);
    paintRig(context,pose,(x,y,z)=>{
      const d=z*c-x*s;
      return {x:w*.5+(x*c+z*s)*scale,y:h*.945-y*scale+d*scale*.09,d:5-d,scale};
    });
  }
  const draw=()=>frame(performance.now(),true);
  function takeControl(){
    if(!manual&&!reduce)offset+=Math.sin((performance.now()-start)/1000*.59)*.47;
    manual=true;
  }
  function down(e){if(drag||e.button!==0)return;takeControl();drag={id:e.pointerId,x:e.clientX};canvas.setPointerCapture?.(e.pointerId);}
  function move(e){if(drag?.id!==e.pointerId)return;offset+=(e.clientX-drag.x)/Math.max(100,canvas.clientWidth)*TAU;drag.x=e.clientX;draw();}
  function up(e){if(drag?.id===e.pointerId)drag=null;}
  function key(e){if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();takeControl();offset+=e.key==='ArrowLeft'?-.22:.22;draw();}
  const listeners={pointerdown:down,pointermove:move,pointerup:up,pointercancel:up,lostpointercapture:up,keydown:key};
  for(const [name,fn] of Object.entries(listeners))canvas.addEventListener(name,fn);
  raf=requestAnimationFrame(frame);
  return {setPhoto(value){
    if(photo!==(value||'')){painter.dispose();photo=value||'';offset=0;manual=false;start=performance.now();}
    draw();
  },dispose(){
    alive=false;cancelAnimationFrame(raf);painter.dispose();
    for(const [name,fn] of Object.entries(listeners))canvas.removeEventListener(name,fn);
  }};
}
