import {cottageFrame} from './room-space.js';
// Metres in the shared world. X is east, +Z is south, and shop doors face local +Z.
const streetSpecs = [
  ['A', '별빛 거리', '#bc7565', 0, ['cottage', 'A2', 'A3']],
  ['B', '금빛 종 거리', '#bb964c', -72, ['B1', 'B2', 'B3']],
  ['C', '전나무 거리', '#699b87', -144, ['A1', 'A4', 'A5']],
  ['D', '서리꽃 거리', '#7394bf', 144, ['A6', 'B4', 'B5']],
  ['E', '자두빛 거리', '#aa83aa', 72, ['B6', 'B7', 'E3']],
];
export const districts = streetSpecs.map(([zone, name, color, degrees]) => {
  const angle = degrees * Math.PI / 180;
  return {zone, name, color, dx:Math.sin(angle), dz:Math.cos(angle)};
});
export const districtColors = Object.fromEntries(districts.map(({zone,color}) => [zone,color]));
export const streetWidth = 6.4;
export const streetLength = 43;
export const plazaRadius = 13;
export function streetPoint(street, distance, side = 0) {
  return {x:street.dx*distance+street.dz*side, z:street.dz*distance-street.dx*side};
}
export const plots = districts.flatMap((street, index) => {
  const legacyKeys = streetSpecs[index][4];
  return [22, 29.9, 37.6].map((distance, slot) => {
    const side = slot === 1 ? -1 : 1;
    const isCottage = legacyKeys[slot] === 'cottage';
    const p = isCottage ? cottageFrame : streetPoint(street,distance,side*7.5);
    const angle = isCottage ? cottageFrame.angle : Math.atan2(-side*street.dz,side*street.dx);
    const door = isCottage ? {x:2.9,z:26.2} : streetPoint(street,distance,0);
    return {id:legacyKeys[slot], label:street.zone+(slot+1), zone:street.zone, ...p, angle, roadX:door.x, roadZ:door.z};
  });
});
export const districtLamps = districts.flatMap(street => [
  {...streetPoint(street,14.5,-3.65),zone:street.zone},
  streetPoint(street,22.7,-3.95),streetPoint(street,31,3.85),streetPoint(street,41.8,-3.65),
]);
export function plotMarker(plot) {
  const c=Math.cos(plot.angle),s=Math.sin(plot.angle),
    side=plot.id==='cottage'?4.8:-2.49, front=plot.id==='cottage'?4.9:3.42;
  return {x:plot.x+side*c+front*s,z:plot.z-side*s+front*c};
}
// All 15 snow lots lie outside the main street capsules. The same street
// dimensions drive the ground masks and the material heard under each step.
export function plotSize(p){
  return p.id==='cottage'?{width:11.1,depth:9.5}:{width:6.8,depth:6.1};
}
export function paintDistrictRoads(ctx,ink){
  ctx.fillStyle=ctx.strokeStyle=ink;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.arc(0,0,plazaRadius,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=streetWidth;ctx.beginPath();
  for(const street of districts){ctx.moveTo(street.dx*10,street.dz*10);ctx.lineTo(street.dx*streetLength,street.dz*streetLength);}ctx.stroke();
}
export function surfaceAt(x,z){
  if(x*x+z*z<=plazaRadius*plazaRadius)return 'road';
  for(const street of districts){
    const along=Math.max(10,Math.min(streetLength,x*street.dx+z*street.dz));
    const dx=x-along*street.dx,dz=z-along*street.dz;
    if(dx*dx+dz*dz<=streetWidth*streetWidth/4)return 'road';
  }
  return 'snow';
}
export function clearForPlanting(x,z,margin=1.1){
  if(Math.hypot(x,z)<plazaRadius+margin)return false;
  for(const road of districts){const along=x*road.dx+z*road.dz;const side=x*road.dz-z*road.dx;if(along>0&&along<streetLength+3.4+margin&&Math.abs(side)<streetWidth/2+margin)return false;}
  for(const p of plots){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle);const localX=dx*c-dz*s,localZ=dx*s+dz*c;const cottage=p.id==='cottage';if(Math.abs(localX)<(cottage?6:3.6)+margin&&Math.abs(localZ)<(cottage?5.2:3.3)+margin)return false;
    const ax=p.roadX-p.x,az=p.roadZ-p.z,t=Math.max(0,Math.min(1,(dx*ax+dz*az)/(ax*ax+az*az)));if(Math.hypot(dx-t*ax,dz-t*az)<1.65+margin)return false;}
  return true;
}
