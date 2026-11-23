// One impulse per landing. Milliseconds use the browser's monotonic clock.
export const jumpDuration=860;
const jumpHeight=1.16;

export function takeOff(actor,now){
  if(now-(actor.jumpStart??-Infinity)<jumpDuration)return false;
  actor.jumpStart=now;
  actor.jumpSeq=(actor.jumpSeq||0)+1;
  return true;
}

export function applyRemoteJump(actor,packet,serverNow,now){
  const sequence=packet.jumpSeq||0,previous=actor.jumpSeq;
  if(previous!==undefined&&sequence<=previous)return;
  actor.jumpSeq=sequence;
  const age=serverNow-packet.jumpAt;
  if(!sequence||!Number.isFinite(age)||age>2400)return;
  // A new arrival sees only the unexpired part. Established peers replay the
  // impulse even if a complete jump fell between two presence snapshots.
  if(previous===undefined){
    if(age<jumpDuration)actor.jumpStart=now-Math.max(0,age);
    return;
  }
  const active=now-(actor.jumpStart??-Infinity)<jumpDuration;
  const missed=Math.min(2,sequence-previous);
  if(!active)actor.jumpStart=now;
  actor.pendingJumps=Math.min(2,(actor.pendingJumps||0)+missed-(active?0:1));
}

export function animateJump(actor,now){
  let age=now-(actor.jumpStart??-Infinity);
  if(age>=jumpDuration&&actor.pendingJumps){
    if(age<jumpDuration*3){
      actor.jumpStart+=jumpDuration;
      age=now-actor.jumpStart;
      actor.pendingJumps--;
    }else actor.pendingJumps=0;
  }
  const t=Math.min(1,Math.max(0,age/jumpDuration));
  const arc=4*t*(1-t);
  actor.y=jumpHeight*arc;
  actor.airPose=arc;
}
