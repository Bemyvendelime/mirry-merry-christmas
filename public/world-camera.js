import {decodeSubject} from './subject-codec.js';

const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const wrapAngle=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
export const modes=['rear','first','front'];

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

export function placeCamera(camera,target,player,mode,azimuth,tilt,eye,dt,snap){
  // A negative tilt looks up in all views. +Z is behind a player at yaw zero.
  const angle=azimuth+(mode==='front'?Math.PI:0);
  const sin=Math.sin(angle),cos=Math.cos(angle),slope=Math.sin(tilt),horizon=Math.cos(tilt);
  const fp=mode==='first';
  const distance=mode==='front'?3.85:4.75;
  const horizontal=fp?0:cameraArm(player.x,player.z,sin,cos,distance*horizon);
  const focus=Math.max(.35,eye*.78);
  const k=fp||snap?1:1-Math.exp(-dt*16);
  const x=player.x+sin*horizontal,z=player.z+cos*horizontal;
  const y=fp?eye:Math.max(.25,focus+slope*horizontal/horizon);
  camera.position.x+=(x-camera.position.x)*k;
  camera.position.y+=(y-camera.position.y)*k;
  camera.position.z+=(z-camera.position.z)*k;
  // Aim from the smoothed position at the avatar, including during sharp turns.
  // Extra upward tilt lets players see the tree crown even at the ground limit.
  if(!fp && y>.251){
    const framing=mode==='rear'?.19*horizontal:0;
    target.set(player.x,focus+framing,player.z);
  }else{
    target.set(camera.position.x-sin*horizon,camera.position.y-slope,camera.position.z-cos*horizon);
  }
  camera.lookAt(target);
}
