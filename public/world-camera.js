import {shopRoom,plazaToLocal,cottageFrame} from './room-space.js';
import {decodeSubject} from './subject-codec.js';

const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const wrapAngle=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
export const modes=['rear','first','front'];

const maxMovementAngle=Math.PI/18;
export function movementCameraOffset(previous,side,mode,dt){
  if(mode==='first')return 0;
  const target=-clamp(side,-1,1)*maxMovementAngle;
  return previous+(target-previous)*(-Math.expm1(-9*dt));
}

export function avatarEyeHeight(token){
  const subject=decodeSubject(token);
  if(!subject)return 1.59;
  const height=Math.min(1.8,2.15*subject.height/subject.width);
  const eyes=(subject.landmarks||[]).filter((p,i)=>(i===2||i===5)&&p.visibility>.45&&p.y>=0&&p.y<1);
  const fraction=eyes.length?1-eyes.reduce((sum,p)=>sum+p.y,0)/eyes.length:.79;
  return Math.max(.25,height*clamp(fraction,.12,.97));
}

// Clip the horizontal camera arm against the central tree before positioning
// it. Checking the full segment also covers a player walking past the trunk.
function cameraArm(x,z,sin,cos,length){
  const away=x*sin+z*cos,disc=away*away-(x*x+z*z-4.7*4.7);
  if(away>=0||disc<=0)return length;
  const entry=-away-Math.sqrt(disc);
  return clamp(entry-.18,.12,length);
}

function roomArm(x,z,sin,cos,arm){
  const edge=(position,dir,radius)=>Math.abs(dir)<.0001?Infinity:((dir>0?radius:-radius)-position)/dir;
  return clamp(Math.min(arm,edge(x,sin,5.99),edge(z,cos,4.89)),.10,arm);
}
function exteriorArm(x,z,sin,cos,arm){
  const q=plazaToLocal(x,z),a=cottageFrame.angle;
  const vx=Math.cos(a)*sin-Math.sin(a)*cos,vz=Math.sin(a)*sin+Math.cos(a)*cos;
  let near=0,far=arm;
  for(const [origin,dir,half] of [[q.x,vx,3.3],[q.z,vz,2.98]]){
    if(Math.abs(dir)<.00001){if(Math.abs(origin)>half)return arm;continue;}
    const t0=(-half-origin)/dir,t1=(half-origin)/dir;
    near=Math.max(near,Math.min(t0,t1));far=Math.min(far,Math.max(t0,t1));
    if(near>far)return arm;
  }
  return clamp(near-.1,.1,arm);
}
export function placeCamera(camera,target,player,mode,azimuth,tilt,eye,dt,snap){
  // A negative tilt looks up in all views. +Z is behind a player at yaw zero.
  const angle=azimuth+(mode==='front'?Math.PI:0);
  const sin=Math.sin(angle),cos=Math.cos(angle),slope=Math.sin(tilt),horizon=Math.cos(tilt);
  const fp=mode==='first';
  const distance=mode==='front'?3.85:4.75;
  const armMax=distance*horizon;
  const horizontal=fp?0:player.room===shopRoom?roomArm(player.x,player.z,sin,cos,armMax):
    exteriorArm(player.x,player.z,sin,cos,cameraArm(player.x,player.z,sin,cos,armMax));
  const focus=Math.max(.35,eye*.78);
  // Smooth the length of the arm, keeping the bearing independent of travel.
  // Shorten immediately near the tree and ease back out into open space.
  const prior=camera.userData.armLength??horizontal;
  const k=1-Math.exp(-dt*16);
  const arm=snap||horizontal<=prior?horizontal:prior+(horizontal-prior)*k;
  camera.userData.armLength=arm;
  const y=fp?eye:Math.max(.25,focus+slope*arm/horizon);
  const lift=(player.y||0)*(fp?1:.42);
  camera.position.set(player.x+sin*arm,y+lift,player.z+cos*arm);
  if(!fp && y>.251){
    const framing=mode==='rear'?.19*arm:0;
    target.set(player.x,focus+framing+lift,player.z);
  }else{
    target.set(camera.position.x-sin*horizon,camera.position.y-slope,camera.position.z-cos*horizon);
  }
  camera.lookAt(target);
}
