// Local-space joint asset. A pose is forward kinematics on the parent chain,
// shared by the GPU, the software view and the profile turntable. Metres, Y up.
import {paintPhoto} from './photo-mesh.js';

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

export function createRigPose() {
  return {points:joints.map(()=>({x:0,y:0,z:0})),angles:new Float32Array(joints.length)};
}

export function solveRig(pose,phase,gait) {
  const {points,angles}=pose;
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
    angles[i]=a+bend;
  }
  // The stance foot determines pelvis height even as the knee folds.
  const floor=Math.min(points[ids.get('leftToe')].y,points[ids.get('rightToe')].y);
  for(const point of points)point.y+=.048-floor;
  return points;
}

export function advanceRig(state,id,moving,dt){
  if(!state) {
    let seed=0;
    for(const c of String(id))seed=(seed*31+c.charCodeAt(0))|0;
    state={phase:(seed>>>0)%628/100,gait:0,pose:createRigPose()};
  }
  state.gait+=((moving?1:0)-state.gait)*(1-Math.exp(-12*dt));
  state.phase+=dt*(.9+8.3*state.gait);
  solveRig(state.pose,state.phase,state.gait);
  return state;
}

// Coordinates from the caller's camera include depth and projected pixels/metre.
export function paintRig(context,pose,project,photo,yaw){
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
    }else if(index===headIndex&&photo){
      paintPhoto(context,photo,p.x,p.y,.54*p.scale,.65*p.scale,yaw);
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

export function createRigPreview(canvas){
  const context=canvas.getContext('2d');
  const pose=createRigPose();
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let photo='',raf=0,start=0,last=-1;
  function frame(t){
    if(!start)start=t;
    if(!reduce)raf=requestAnimationFrame(frame);
    if(t-last<65&&last>=0)return;
    last=t;
    const w=canvas.width,h=canvas.height,scale=Math.min(h/2.22,w/1.1);
    context.clearRect(0,0,w,h);
    const seconds=(t-start)/1000;
    const yaw=.23+(reduce?0:Math.sin(seconds*.75)*.52);
    const c=Math.cos(yaw),s=Math.sin(yaw);
    context.fillStyle='rgba(13,27,49,.22)';context.beginPath();
    context.ellipse(w*.5,h*.945,.33*scale,.06*scale,0,0,2*Math.PI);context.fill();
    solveRig(pose,seconds*2.3,reduce?0:.24);
    paintRig(context,pose,(x,y,z)=>{
      const d=z*c-x*s;
      return {x:w*.5+(x*c+z*s)*scale,y:h*.945-y*scale+d*scale*.09,d:5-d,scale};
    },photo,yaw);
  }
  raf=requestAnimationFrame(frame);
  return {setPhoto(value){photo=value||'';if(reduce){last=-1;frame(performance.now());}},dispose(){cancelAnimationFrame(raf);}};
}
