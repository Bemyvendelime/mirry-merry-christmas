import {districts, districtColors, plots, plazaRadius, streetWidth, streetLength, streetPoint, paintDistrictRoads} from './layout.js';

const north = '#ecdfbe', paper = '#e4e3d8', blue = '#223e48', gold = '#ffdc8e';
const current = '#2e786b', sceneInk = '#49686b';
const rnd = n => Math.round(n * 100) / 100;
const num = v => Number.isFinite(v) ? v : 0;
const star = Array.from({length:10},(_,i) => {
  const a=i*Math.PI/5-Math.PI/2, r=i%2?1.37:3.15;
  return [Math.cos(a)*r,Math.sin(a)*r];
});
function playerShape(p,scale=1){return `<g transform="translate(${rnd(num(p?.x))} ${rnd(num(p?.z))}) rotate(${rnd(-num(p?.yaw)*180/Math.PI)}) scale(${scale})"><circle r="2.48" fill="#fff" stroke="#376960" stroke-width=".35"/><path d="M0-1.88 1.31 1.21 0 .70 -1.31 1.21Z" fill="${current}"/></g>`;}
function compass(){return `<g transform="translate(43,-40)" fill="${blue}" font-family="system-ui" text-anchor="middle"><text y="-2" font-size="2.9" font-weight="700">N</text><path d="M0 0 1.3 4.2 0 3.4 -1.3 4.2Z"/></g>`;}
function outdoorMap(p){
  const legs=plots.map(plot=>`M${rnd(plot.x)} ${rnd(plot.z)}L${rnd(plot.roadX)} ${rnd(plot.roadZ)}`).join(' ');
  const streets=districts.map(d=>{const tip=streetPoint(d,streetLength),entry=streetPoint(d,9);return `<g><path d="M${rnd(entry.x)} ${rnd(entry.z)}L${rnd(tip.x)} ${rnd(tip.z)}" stroke="${d.color}" stroke-width="${streetWidth+1.1}"/><path d="M${rnd(entry.x)} ${rnd(entry.z)}L${rnd(tip.x)} ${rnd(tip.z)}" stroke="#f6efdc" stroke-width="${streetWidth-1.0}"/></g>`;}).join('');
  const stops=plots.map(plot=>{const cottage=plot.id==='cottage';return `<g transform="translate(${rnd(plot.x)} ${rnd(plot.z)})"><rect x="-3.32" y="-2.18" width="6.64" height="4.36" rx=".88" fill="${cottage?'#fff8df':'#e9eae4'}" stroke="${cottage?districtColors.A:'#9eaaa2'}" stroke-width="${cottage?.62:.28}" ${cottage?'':'stroke-dasharray=".94 .55"'}/><text y=".12" fill="${cottage?'#733c32':sceneInk}" font-size="2.72" font-weight="${cottage?750:550}" dominant-baseline="central">${plot.label}</text></g>`;}).join('');
  const ends=districts.map(d=>{const q=streetPoint(d,streetLength+1);return `<g transform="translate(${rnd(q.x)} ${rnd(q.z)})"><circle r="2.9" fill="${d.color}" stroke="${paper}" stroke-width=".45"/><text fill="#172e35" font-size="3.1" font-weight="750" dominant-baseline="central">${d.zone}</text></g>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="plotmap" viewBox="-52 -46 104 96" role="img" aria-label="중앙 트리와 다섯 거리, A1부터 E3까지의 부지와 현재 위치" style="background:${paper}"><g fill="none" stroke="${blue}" opacity=".1" stroke-width=".21"><circle r="17"/><circle r="30"/><circle r="42"/></g><g stroke-linecap="round" fill="none"><path d="${legs}" stroke="#a8afa6" stroke-width=".7" stroke-dasharray=".7 .8"/>${streets}</g><circle r="${plazaRadius}" fill="#ece5d2" stroke="#bab29b" stroke-width=".42"/><circle r="9.4" fill="none" stroke="#c6bdab" stroke-dasharray=".75 .48" stroke-width=".27"/><circle r="6.15" fill="#526f65"/><polygon points="${star.map(a=>a.join(',')).join(' ')}" fill="${gold}"/><g text-anchor="middle" font-family="system-ui, sans-serif">${stops}${ends}</g>${compass()}${playerShape(p)}</svg>`;
}
function interiorMap(p){
  return `<svg xmlns="http://www.w3.org/2000/svg" class="plotmap" viewBox="-8 -6.5 16 14" role="img" aria-label="A1 오두막 실내, 남쪽 출구와 현재 위치" style="background:${paper}"><path d="M-.92 5H-6V-5H6V5H.92" fill="#f3eddd" stroke="${districtColors.A}" stroke-width=".31" stroke-linejoin="round"/><path d="M-.84 4.55H.84" stroke="${current}" stroke-width=".22"/><text x="0" y="6.1" text-anchor="middle" fill="${blue}" font-size=".67" font-family="system-ui">출구 · 광장</text>${playerShape(p,.24)}</svg>`;
}
export function plazaMapMarkup(player){return player?.room==='cottage'?interiorMap(player):outdoorMap(player);}

// North is fixed. A close local view makes it possible to approach the A1 door by its threshold.
export function createMinimap(canvas){
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  let last='';
  function marker(x,z,yaw){ctx.save();ctx.translate(x,z);ctx.rotate(-yaw);ctx.strokeStyle='#254c4a';ctx.lineWidth=2.4;ctx.fillStyle='#dbf9dc';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(6.3,7);ctx.lineTo(0,4.6);ctx.lineTo(-6.3,7);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();}
  function drawRoom(p){const scale=Math.min(w/16,h/15),ox=w/2,oy=h/2;ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.beginPath();ctx.moveTo(-.94,5);ctx.lineTo(-6,5);ctx.lineTo(-6,-5);ctx.lineTo(6,-5);ctx.lineTo(6,5);ctx.lineTo(.94,5);ctx.lineWidth=.21;ctx.strokeStyle='#b18a78';ctx.fillStyle='#4e534c';ctx.fill();ctx.stroke();ctx.strokeStyle='#f3dc8d';ctx.beginPath();ctx.moveTo(-.9,4.45);ctx.lineTo(.9,4.45);ctx.stroke();ctx.restore();marker(ox+num(p.x)*scale,oy+num(p.z)*scale,num(p.yaw));}
  return p=>{const indoor=p.room==='cottage',x=num(p.x),z=num(p.z),yaw=num(p.yaw);const key=`${indoor}/${x}/${z}/${yaw}`;if(key===last)return;last=key;ctx.clearRect(0,0,w,h);ctx.fillStyle='#213844';ctx.fillRect(0,0,w,h);
    if(indoor)drawRoom(p);else{
      const scale=Math.min(w,h)/80;ctx.save();ctx.translate(w/2,h/2);ctx.scale(scale,scale);ctx.translate(-x,-z);
      paintDistrictRoads(ctx,'#79908d');
      for(const d of districts){const a=streetPoint(d,13),b=streetPoint(d,streetLength);ctx.beginPath();ctx.moveTo(a.x,a.z);ctx.lineTo(b.x,b.z);ctx.lineWidth=1.2;ctx.strokeStyle=d.color;ctx.stroke();}
      ctx.fillStyle='#3e645a';ctx.beginPath();ctx.arc(0,0,6.15,0,2*Math.PI);ctx.fill();ctx.beginPath();star.forEach(([sx,sz],i)=>i?ctx.lineTo(sx,sz):ctx.moveTo(sx,sz));ctx.fillStyle=gold;ctx.fill();
      ctx.textAlign='center';ctx.textBaseline='middle';for(const p of plots){const active=p.id==='cottage';ctx.fillStyle=active?'#fff3d0':districtColors[p.zone];ctx.fillRect(p.x-3.4,p.z-2.15,6.8,4.3);ctx.fillStyle='#183039';ctx.font=`${active?800:600} 2.9px system-ui`;ctx.fillText(p.label,p.x,p.z);}
      ctx.restore();marker(w/2,h/2,yaw);
    }
    ctx.font='bold 17px system-ui';ctx.fillStyle=north;ctx.strokeStyle='#20343c';ctx.lineWidth=4;ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeText('N',w/2,16);ctx.fillText('N',w/2,16);
  };
}
