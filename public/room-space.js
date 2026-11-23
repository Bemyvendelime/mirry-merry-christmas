// Both the client and the room service measure interaction from the same sill.
export const plazaRoom='plaza', shopRoom='cottage';
export const cottageFrame={x:10.65,z:23,angle:-.96};
const sin=Math.sin(cottageFrame.angle),cos=Math.cos(cottageFrame.angle);
export function localToPlaza(x,z){
  return {x:cottageFrame.x+cos*x+sin*z,z:cottageFrame.z-sin*x+cos*z};
}
export function plazaToLocal(x,z){
  const dx=x-cottageFrame.x,dz=z-cottageFrame.z;
  return {x:cos*dx-sin*dz,z:sin*dx+cos*dz};
}
export const insideDoor={x:0,z:4.45},outsideDoor=localToPlaza(0,2.85);
// Offset arrivals across the open floor so a team entering together can see one another.
export const entrySpots=[[0,1.45],[1.45,1.3],[-1.45,2.3],[2.75,2.3],[-.55,3.4],[1.25,3.45]];
export const doorstep={...localToPlaza(0,4.35),yaw:Math.PI+cottageFrame.angle};
export function atDoor(room,x,z){
  if(room===shopRoom)return Math.hypot(x-insideDoor.x,z-insideDoor.z)<=3.25;
  const local=plazaToLocal(x,z);
  return room===plazaRoom&&local.z>=2.55&&Math.hypot(x-outsideDoor.x,z-outsideDoor.z)<=5.55;
}
export function insideHouseWall(x,z){
  const q=plazaToLocal(x,z);
  return Math.abs(q.x)<3.4&&Math.abs(q.z)<3.06;
}
export function validRoom(room){return room===plazaRoom||room===shopRoom;}
