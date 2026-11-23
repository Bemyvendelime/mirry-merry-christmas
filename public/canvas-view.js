import * as T from 'three';
import {advanceRig,paintRig,isWholeSubject,createSubjectPainter} from './joint-rig.js';
import {plots} from './layout.js';
import {paintFirSplats,paintPixelPalette} from './software-pixelart.js';
import {createLandscape} from './software-landscape.js';

// CPU perspective renderer for browsers without a WebGL context. Camera pose, entity
// positions, editable slots, and multiplayer state are shared with the WebGL scene.
export function createCanvasView(root) {
  const make=(w,h=w)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  const canvas=make(8), ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true}), scene=new T.Scene();
  root.replaceChildren(canvas);let style='raytracing',viewW=8,viewH=8,W=8,H=8,hideSelf=false,actors=[],objects=[],loop=null,raf=0;
  let seed=49285;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296),tau=Math.PI*2;
  const textures=new Map(),props=[], pi=Math.PI;
  const treeRect=make(390,630),tree=treeRect.getContext('2d');
  const poly=(c,pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  tree.fillStyle='#624a42';tree.fillRect(183,200,23,420);
  const leaves=['#263f3a','#314e42','#435c4e','#536857','#314b47'];
  const snow=['#c7d2e1','#d6deea','#9daec4','#b4c4d7','#e2e5ee'];
  for(let j=0;j<80;j++){const u=j/80, y=578-u*504,r=174*(1-u)**.85+3;for(let i=0;i<11;i++){const a=rnd()*tau,d=.45+.56*rnd(),tip=195+Math.cos(a)*r*d,dy=y+10+12*rnd(),x=195+Math.cos(a)*r*.21,side=Math.sign(tip-x)||1;poly(tree,[[x,y-21],[x+(tip-x)*.63,y-12],[tip,dy],[tip-side*14,dy-2],[x+(tip-x)*.46,dy-2],[x,y+4]],leaves[Math.floor(rnd()*leaves.length)]);if(rnd()<.74)poly(tree,[[x+(tip-x)*.10,y-16],[x+(tip-x)*.51,y-15],[tip,dy-2],[x+(tip-x)*.58,y-6],[x+(tip-x)*.44,y-9]],snow[Math.floor(rnd()*snow.length)]);}}
  function light(c,x,y,r,col){const g=c.createRadialGradient(x,y,.1,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(255,192,100,0)');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);}
  for(let i=0;i<169;i++){const t=rnd(),yy=95+t*487,xx=195+(rnd()*2-1)*(11+t*153);light(tree,xx,yy,7,'rgba(255,194,99,.82)');tree.fillStyle='#ffe8ac';tree.fillRect(xx-1,yy-1,2.5,2.5);}
  light(tree,195,52,42,'rgba(255,203,110,.7)');const star=[];for(let i=0;i<10;i++){let a=i*pi/5-pi/2,r=i%2?11:31;star.push([195+Math.cos(a)*r,54+Math.sin(a)*r]);}for(let i=0;i<10;i++)poly(tree,[[195,54],star[i],star[(i+1)%10]],i%2?'#fff1b3':'#edbd73');textures.set('tree',treeRect);
  for(let n=0;n<3;n++){const b=make(270,340),c=b.getContext('2d');function branch(x,y,a,l,rad,d){const nx=x+Math.cos(a)*l,ny=y+Math.sin(a)*l;c.lineCap='round';c.lineWidth=rad;c.strokeStyle=d>2?'#6a5e63':'#736a72';c.beginPath();c.moveTo(x,y);c.lineTo(nx,ny);c.stroke();if(rad>2){c.lineWidth=rad*.25;c.strokeStyle='#c3c7d3';c.beginPath();c.moveTo(x-rad*.24,y);c.lineTo(nx-rad*.24,ny);c.stroke();}if(d){branch(nx,ny,a+(rnd()-.52)*.57,l*(.66+rnd()*.14),rad*.65,d-1);branch(nx,ny,a+(rnd()>.5?1:-1)*(.36+rnd()*.65),l*(.58+rnd()*.22),rad*.54,d-1);}}
   branch(136,339,-pi/2+(rnd()-.55)*.12,92,13,7);for(let k=0;k<7;k++)branch(136,298-k*13,-pi/2+(k%2?1:-1)*(.55+rnd()*.47),48+rnd()*18,6,5);textures.set('bare'+n,b);}
  function lampSprite(zone){const b=make(136,300),c=b.getContext('2d');c.fillStyle='#625255';c.fillRect(49,39,10,252);c.fillStyle='#8b7061';c.fillRect(50,39,3,250);c.fillStyle='#51484c';c.fillRect(46,39,53,8);c.fillRect(87,44,3,19);c.fillStyle='#d8d9e4';c.fillRect(46,38,53,3);poly(c,[[71,70],[88,58],[104,70]],'#4a4649');light(c,88,82,44,'rgba(255,187,95,.91)');c.fillStyle='#493d43';c.fillRect(74,69,28,33);c.fillStyle='#ffe3a3';c.fillRect(77,72,10,26);c.fillRect(90,72,9,26);if(zone){poly(c,[[58,119],[98,119],[98,178],[78,169],[58,178]],zone==='A'?'#a15c4c':'#4d6086');c.fillStyle='#f4e6d0';c.font='27px Georgia';c.textAlign='center';c.fillText(zone,78,153);}c.fillStyle='#7f7e8b';c.fillRect(43,288,21,12);return b;}
  for(const k of ['','A','B'])textures.set('lamp'+k,lampSprite(k));
  props.push({x:0,z:0,h:36,w:16,k:'tree'});
  for(const s of [-1,1]){props.push({x:s*5,z:13,h:4.8,w:2.16,k:'lamp'+(s<0?'A':'B')});for(const z of [27,40])props.push({x:s*4.3,z,h:4.8,w:2.16,k:'lamp'});for(let i=0;i<8;i++){let a=(i+.25)*tau/8;props.push({x:s*25+13*Math.cos(a),z:-8+17*Math.sin(a),h:4.8,w:2.16,k:'lamp'});a=i*tau/8;props.push({x:s*25+7.4*Math.cos(a),z:-8+12*Math.sin(a),h:5.6+3*rnd(),w:5.7,k:'bare'+i%3});}for(let i=0;i<8;i++)props.push({x:s*(46+3*rnd()),z:-40+12*i,h:7+3*rnd(),w:6.3,k:'bare'+i%3});for(let j=0;j<3;j++)props.push({x:s*(10+j*3),z:20+j*9,h:8,w:6.5,k:'bare'+j});}
  const crownBranches=[];
  for(let level=0;level<8;level++)for(let j=0;j<7;j++){
    const a=(j/7+level*.091)*tau,levelY=4.1+level*3.18,rad=6.8*(1-levelY/36)**.87;
    crownBranches.push({x:Math.cos(a)*rad,z:Math.sin(a)*rad,y:levelY-.75+rnd()*.48,h:2.4-level*.10,w:4.3-level*.28,variant:(j+level)%4,k:'crown'});
  }
  const drawLandscape=createLandscape(props,textures);
  const detailed=new Set();
  function portrait(file,kind){const img=new Image();img.onload=()=>{const aspect=img.naturalWidth/img.naturalHeight;const h=Math.min(kind==='tree'?1800:1200,img.naturalHeight),w=Math.round(h*aspect);const c=make(w,h),q=c.getContext('2d',{willReadFrequently:true});q.drawImage(img,0,0,w,h);const rgba=q.getImageData(0,0,w,h).data;let l=w,r=0,t=h,b=0;for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){if(rgba[(y*w+x)*4+3]>25){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}}if(b<=t||r<=l)return;const pad=3;l=Math.max(0,l-pad);r=Math.min(w-1,r+pad);t=Math.max(0,t-pad);b=Math.min(h-1,b+pad);const cropped=make(r-l+1,b-t+1);cropped.getContext('2d').drawImage(c,l,t,cropped.width,cropped.height,0,0,cropped.width,cropped.height);textures.set(kind,cropped);detailed.add(kind);
      if(kind==='tree'){
        for(let n=0;n<4;n++){
          const branch=make(350,170),c=branch.getContext('2d'),sx=(n%2?.45:.10)*cropped.width,sy=(.55+n*.069)*cropped.height;
          c.drawImage(cropped,sx,sy,cropped.width*.42,cropped.height*.105,0,0,350,170);
          c.globalCompositeOperation='destination-in';c.save();c.translate(175,85);c.scale(178,88);const mask=c.createRadialGradient(0,0,.3,0,0,1);mask.addColorStop(0,'#000');mask.addColorStop(.72,'rgba(0,0,0,.85)');mask.addColorStop(1,'transparent');c.fillStyle=mask;c.fillRect(-1,-1,2,2);c.restore();textures.set('crown'+n,branch);
        }
      }};img.src=new URL('./scene-assets/'+file,import.meta.url).href;}
  portrait('fir-portrait.webp','tree');portrait('lantern-portrait.webp','lamp');
  // Sparse shrubs and stone curbs give the planted islands a readable ground edge up close.
  for(let k=0;k<4;k++){const shrub=make(128,88),c=shrub.getContext('2d');for(let i=0;i<58;i++){const base=48+(rnd()-.5)*45,tx=11+rnd()*108,ty=22+rnd()*46;c.strokeStyle=i%3?'#53655f':'#715954';c.lineWidth=.8+rnd()*1.6;c.beginPath();c.moveTo(base,85);c.quadraticCurveTo((base+tx)/2,ty+5,tx,ty);c.stroke();for(let n=0;n<3;n++){let xx=tx+rnd()*9-5,yy=ty-rnd()*4;c.fillStyle=['#516659','#6f8271','#879a83','#c1cfdb'][i%4];c.beginPath();c.ellipse(xx,yy,2.4+rnd()*5,1+rnd()*2.5,-.48,0,tau);c.fill();}}textures.set('shrub'+k,shrub);}
  for(const side of [-1,1])for(let i=0;i<57;i++){const a=rnd()*tau,d=Math.sqrt(rnd());props.push({x:side*25+9.3*d*Math.cos(a),z:-8+13*d*Math.sin(a),h:.23+rnd()*.47,w:.56+rnd()*.84,k:'shrub'+i%4});}
  for(let i=0;i<15;i++){const a=rnd()*tau,d=2+rnd();props.push({x:d*Math.cos(a),z:d*Math.sin(a),w:.70+rnd()*.52,h:.28+rnd()*.35,k:'shrub'+i%4});}
  for(let n=0;n<2;n++){const c=make(145,70),q=c.getContext('2d');q.fillStyle='#969ca9';q.beginPath();q.moveTo(4,51);q.quadraticCurveTo(24,28,66,30);q.quadraticCurveTo(132,28,142,52);q.quadraticCurveTo(77,63,4,58);q.fill();const d=q.createLinearGradient(0,21,0,54);d.addColorStop(0,'#e7e9ed');d.addColorStop(.5,'#d4dce6');d.addColorStop(1,'#aab7c8');q.fillStyle=d;q.beginPath();q.moveTo(2,54);q.bezierCurveTo(14,47,23,30,43,28);q.bezierCurveTo(81,18,125,25,142,50);q.quadraticCurveTo(74,61,2,54);q.fill();textures.set('ridge'+n,c);}
  for(const s of [-1,1])for(let i=0;i<57;i++){const a=i/57*tau,rad=rnd()*.47;props.push({x:s*25+(12.8+rad)*Math.cos(a),z:-8+(16.7+rad)*Math.sin(a),h:.20+rnd()*.27,w:.5+rnd()*1.1,k:'ridge'+i%2});}
  const motes=Array.from({length:110},()=>({x:rnd()*90-45,z:rnd()*85-42,y:rnd()*12,s:rnd()}));
  const rigStates=new Map(), subjects=createSubjectPainter();
  let previousPoseTime=performance.now(),poseFrame=0;
  function decor(k){const b=make(100,130),c=b.getContext('2d');if(k==='pine'){c.fillStyle='#726253';c.fillRect(45,105,10,25);for(let j=0;j<4;j++)poly(c,[[50,8+j*17],[50-(19+j*8),49+j*22],[50+(19+j*8),49+j*22]],j%2?'#415b4d':'#526e5a');}else if(k==='snowman'){for(const [y,r] of [[101,28],[65,23],[33,17]]){c.beginPath();c.arc(50,y,r,0,tau);c.fillStyle='#e9edf3';c.fill();c.strokeStyle='#acb7c7';c.stroke();}c.fillStyle='#47404b';c.fillRect(34,15,32,4);c.fillRect(41,1,18,16);c.fillRect(44,30,3,3);c.fillRect(55,30,3,3);c.fillStyle='#9a4d50';c.fillRect(33,47,35,5);}else if(k==='bench'){c.fillStyle='#69534c';c.fillRect(8,61,84,11);c.fillRect(8,76,84,8);c.fillRect(8,94,84,10);c.fillStyle='#494852';c.fillRect(16,65,6,61);c.fillRect(78,65,6,61);}return b;}
  for(const k of ['pine','bench','snowman'])textures.set(k,decor(k));
  return {scene,domElement:canvas,dispose(){loop=null;cancelAnimationFrame(raf);rigStates.clear();subjects.dispose();},setStyle(value){style=value;this.setSize(viewW,viewH)},setPixelRatio(){},setSize(w,h){viewW=w;viewH=h;W=Math.max(1,Math.round(w));H=Math.max(1,Math.round(h));const pixel=style==='gaussian-pixelart';const factor=pixel?Math.min(1,520/W,330/H):Math.min(1,1280/W,850/H);canvas.style.imageRendering=pixel?'pixelated':'auto';canvas.width=Math.round(W*factor);canvas.height=Math.round(H*factor);canvas.style.width=W+'px';canvas.style.height=H+'px';W=canvas.width;H=canvas.height;},setActors(list,hideLocal=false){actors=list||[];hideSelf=hideLocal;},setObjects(list){objects=list||[];},setAnimationLoop(fn){loop=fn;cancelAnimationFrame(raf);const tick=t=>{if(loop){loop(t);raf=requestAnimationFrame(tick);}};if(fn)raf=requestAnimationFrame(tick);},render(_scene,camera){
    camera.updateMatrixWorld();const m=camera.matrixWorld.elements,pr=camera.projectionMatrix.elements,f=pr[5];drawLandscape(ctx,m,pr,W,H,style);
    const draw=props.slice();const treeDistance=Math.hypot(m[12],m[14]);const closeFoliage=Math.max(0,Math.min(1,(22-treeDistance)/12));if(style!=='gaussian-pixelart'&&closeFoliage&&detailed.has('tree'))draw.push(...crownBranches);
    const now=performance.now(),poseDt=Math.min(.1,(now-previousPoseTime)/1000);previousPoseTime=now;poseFrame++;
    subjects.beginFrame();
    for(const [idx,actor] of actors.entries()){
      const state=advanceRig(rigStates.get(actor.id),actor.id,actor.moving,poseDt,!isWholeSubject(actor.photo));
      rigStates.set(actor.id,state);state.frame=poseFrame;
      if(hideSelf&&idx===0)continue;
      draw.push({x:actor.x,z:actor.z,h:2.06,w:isWholeSubject(actor.photo)?2.4:.82,actor,state,local:idx===0,label:idx?actor.name:''});
    }
    for(const [id,state] of rigStates)if(state.frame!==poseFrame)rigStates.delete(id);
    for(const obj of objects){if(obj.kind==='empty')continue;const p=plots.find(q=>q.id===obj.plot);if(!p)continue;const lx=(obj.slot%3-1)*1.8,lz=(Math.floor(obj.slot/3)-1)*1.7;draw.push({x:p.x+lx*Math.cos(p.angle)+lz*Math.sin(p.angle),z:p.z-lx*Math.sin(p.angle)+lz*Math.cos(p.angle),h:obj.kind==='bench'?1.4:2,w:obj.kind==='bench'?1.9:1.3,k:obj.kind==='light'?'lamp':obj.kind});}
    let items=[];const inv=camera.matrixWorldInverse.elements;function project(x,y,z){const depth=-(inv[2]*x+inv[6]*y+inv[10]*z+inv[14]);if(depth<.25)return null;return {x:W/2+(inv[0]*x+inv[4]*y+inv[8]*z+inv[12])*pr[0]/depth*W*.5,y:H/2-(inv[1]*x+inv[5]*y+inv[9]*z+inv[13])*f/depth*H*.5,d:depth};}
    // Keep each branch band in world space. At extreme pitch the top and bottom
    // can lie on opposite sides of the near plane; visible bands are still drawn.
    function depthAt(x,y,z){return -(inv[2]*x+inv[6]*y+inv[10]*z+inv[14]);}
    function drawFirBand(o,tex){
      const y0=o.y||0,d0=depthAt(o.x,y0,o.z),d1=depthAt(o.x,y0+o.h,o.z),near=.27;
      if(Math.max(d0,d1)<=near)return;
      let low=0,high=1;
      if(d0<near)low=(near-d0)/(d1-d0);
      if(d1<near)high=(near-d0)/(d1-d0);
      const n=o.k==='tree'?Math.min(180,Math.max(52,Math.round(880/Math.max(4,treeDistance)))):8;
      let prev=project(o.x,y0+o.h*low,o.z);
      if(!prev)return;
      for(let i=1;i<=n;i++){
        const ta=low+(high-low)*(i-1)/n,tb=low+(high-low)*i/n;
        const next=project(o.x,y0+o.h*tb,o.z);if(!next)continue;
        const midDepth=(prev.d+next.d)*.5,w=pr[0]*W*o.w/(2*midDepth),left=(next.x+prev.x-w)*.5;
        const y=Math.min(prev.y,next.y),h=Math.abs(prev.y-next.y);
        if(h>.035&&y<H&&y+h>0&&left<W&&left+w>0){
          const sy=(1-tb)*tex.height,srcH=(tb-ta)*tex.height;
          if(next.y<=prev.y)ctx.drawImage(tex,0,Math.max(0,sy),tex.width,srcH,left,y,w,h+.60);
          else{ctx.save();ctx.translate(0,y+h);ctx.scale(1,-1);ctx.drawImage(tex,0,Math.max(0,sy),tex.width,srcH,left,0,w,h+.60);ctx.restore();}
        }
        prev=next;
      }
    }
    // Layer close branches on pitched radial planes. Seen from below, the full
    // photographed needles remain visible even when the central trunk is edge-on.
    function drawCrown(o,tex){
      const distance=Math.hypot(o.x,o.z)||1,rx=o.x/distance,rz=o.z/distance;
      const point=(tx,tz,dh)=>project(o.x-rz*tx+rx*tz,o.y+dh,o.z+rx*tx+rz*tz);
      const quad=[point(-o.w*.5,-o.h*.6,o.h*.70),point(o.w*.5,-o.h*.6,o.h*.70),point(o.w*.5,o.h*.7,0),point(-o.w*.5,o.h*.7,0)];
      if(!quad.every(Boolean))return;
      if(quad.every(q=>q.x<0)||quad.every(q=>q.x>W)||quad.every(q=>q.y<0)||quad.every(q=>q.y>H))return;
      function part(a,b,c,second){ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();if(second)ctx.transform((b.x-c.x)/tex.width,(b.y-c.y)/tex.width,(c.x-a.x)/tex.height,(c.y-a.y)/tex.height,a.x,a.y);else ctx.transform((b.x-a.x)/tex.width,(b.y-a.y)/tex.width,(c.x-b.x)/tex.height,(c.y-b.y)/tex.height,a.x,a.y);ctx.drawImage(tex,0,0);ctx.restore();}
      part(quad[0],quad[1],quad[2],false);part(quad[0],quad[2],quad[3],true);
    }
    for(const o of draw){
      if(o.k==='tree'||o.k==='crown'){
        const tex=textures.get(o.k==='tree'?'tree':'crown'+o.variant);if(!tex)continue;
        const y=o.y||0,baseDepth=depthAt(o.x,y,o.z),topDepth=depthAt(o.x,y+o.h,o.z);
        if(Math.max(baseDepth,topDepth)>.27)items.push({o,tex,base:{d:Math.max(.27,depthAt(o.x,y+Math.min(o.h*.16,3),o.z))}});
        continue;
      }
      const base=project(o.x,0,o.z),top=project(o.x,o.h,o.z);if(!base||!top)continue;const tall=base.y-top.y,isLamp=o.k?.startsWith('lamp'),key=isLamp&&detailed.has('lamp')?'lamp':o.k,tex=textures.get(key);if((!tex&&!o.actor)||tall<2||tall>H*8||base.y<0||top.y>H||(m[9]<-.93&&base.y>H&&top.y>H*.91))continue;const actual=isLamp&&detailed.has('lamp')||o.k==='tree'&&detailed.has('tree');const ww=tall*(actual?tex.width/tex.height:o.w/o.h);if(base.x+ww<0||base.x-ww>W)continue;items.push({o,base,top,tall,ww,tex,isLamp});}items.sort((a,b)=>b.base.d-a.base.d);
    // The tree bed has a raised stone edge, including a snow cap and distinct joints.
    const curbs=[];for(let i=0;i<46;i++){const a=i*tau/46,b=(i+.96)*tau/46;const x=3.30*Math.cos(a),z=3.30*Math.sin(a),ex=3.30*Math.cos(b),ez=3.30*Math.sin(b);const points=[[x,0,z],[ex,0,ez],[ex,.31,ez],[x,.31,z]].map(p=>project(...p));if(points.every(Boolean))curbs.push({points,depth:points[0].d,i});}curbs.sort((a,b)=>b.depth-a.depth);
    function drawCurb(c){const p=c.points.map(q=>[q.x,q.y]);poly(ctx,p,['#8c8995','#9695a1','#9f9ca5','#8e8e9c'][c.i%4]);ctx.lineWidth=Math.max(1,H/c.depth*.004);ctx.strokeStyle='#d5d9df';ctx.beginPath();ctx.moveTo(p[2][0],p[2][1]);ctx.lineTo(p[3][0],p[3][1]);ctx.stroke();}
    for(const c of curbs)if(c.depth>=(project(0,0,0)?.d||0))drawCurb(c);
    for(const {o,base,top,tall,ww,tex,isLamp} of items){
      if(o.k==='tree'||o.k==='crown'){
        if(o.k==='crown'){ctx.globalAlpha=closeFoliage*.90;drawCrown(o,tex);}else if(style==='gaussian-pixelart'){drawFirBand(o,tex);ctx.globalAlpha=.83;paintFirSplats(ctx,tex,camera,project,W,H,H*f*.5);}else drawFirBand(o,tex);ctx.globalAlpha=1;
        if(o.k==='tree'){
          const star=project(o.x,o.h*.969,o.z);if(star&&star.d>1){const rad=Math.max(2,Math.min(72,H*f*.74/star.d));light(ctx,star.x,star.y,rad,'rgba(255,204,110,.24)');}
        }continue;
      }
      const left=base.x-ww/2;const shrub=o.k?.startsWith('shrub'),ridge=o.k?.startsWith('ridge');
      if(!shrub&&!ridge){const shadow=Math.max(1,Math.min(ww*.40,H/base.d*.30)),height=Math.max(1,Math.min(shadow*.36,12));ctx.save();ctx.translate(base.x,base.y+1);ctx.scale(shadow,height);const fog=ctx.createRadialGradient(0,0,0,0,0,1);fog.addColorStop(0,'rgba(43,47,67,.34)');fog.addColorStop(1,'rgba(43,47,67,0)');ctx.fillStyle=fog;ctx.fillRect(-1,-1,2,2);ctx.restore();}
      if(o.actor){
        const actor=o.actor,angle=actor.yaw||0,cos=Math.cos(angle),sin=Math.sin(angle);
        if(isWholeSubject(actor.photo)){
          const dx=m[12]-o.x,dz=m[14]-o.z,distance=Math.hypot(dx,dz);
          const facing=angle+Math.PI-Math.atan2(dx,dz);
          const pitch=Math.atan2(m[13]-.9,Math.max(.01,distance));
          const scale=H*f*.5/base.d;
          const tile=subjects.get(actor.photo,facing,pitch,o.state.phase,o.state.gait,tall,o.local);
          if(tile)ctx.drawImage(tile.canvas,base.x+tile.left*scale,base.y-tile.top*scale,tile.width*scale,tile.height*scale);
        }else{
          paintRig(ctx,o.state.pose,(x,y,z)=>{
            const pt=project(o.x+x*cos+z*sin,y,o.z-x*sin+z*cos);
            if(pt)pt.scale=H*f*.5/pt.d;
            return pt;
          });
        }
      }else ctx.drawImage(tex,left,top.y,ww,tall);
      if(isLamp&&detailed.has('lamp')&&(o.k==='lampA'||o.k==='lampB')){const a=o.k==='lampA',bw=tall*.117,bh=tall*.198,bx=left+ww*.76-bw,by=top.y+tall*.48;ctx.lineWidth=Math.max(1,tall*.008);ctx.strokeStyle='#6e5c49';ctx.beginPath();ctx.moveTo(bx-ww*.04,by);ctx.lineTo(bx+bw+ww*.06,by);ctx.stroke();poly(ctx,[[bx,by],[bx+bw,by],[bx+bw*.98,by+bh],[bx+bw*.5,by+bh*.88],[bx,by+bh]],a?'#935843':'#445575');ctx.fillStyle='#eee6d0';ctx.font=`${Math.round(tall*.085)}px Georgia`;ctx.textAlign='center';ctx.fillText(a?'A':'B',bx+bw*.5,by+bh*.65);}
      if(o.label&&base.d<20){ctx.font='600 12px system-ui';ctx.textAlign='center';const lw=ctx.measureText(o.label).width+12;ctx.fillStyle='#343545aa';ctx.fillRect(base.x-lw/2,top.y-16,lw,16);ctx.fillStyle='#fff5e2';ctx.fillText(o.label,base.x,top.y-4);}}
    for(const c of curbs)if(c.depth<(project(0,0,0)?.d||0))drawCurb(c);
    const sec=performance.now()*.001;for(const v of motes){const q=project(v.x+Math.sin(sec*.22+v.z)*.32,((v.y-sec*(.18+v.s*.12))%12+12)%12,v.z);if(!q||q.d>46||q.x<0||q.x>W||q.y<0||q.y>H)continue;const radius=Math.max(.48,Math.min(1.6,8/q.d));ctx.fillStyle='rgba(244,244,244,'+(.22+v.s*.31)+')';ctx.beginPath();ctx.arc(q.x,q.y,radius,0,tau);ctx.fill();}
    if(style==='gaussian-pixelart')paintPixelPalette(ctx,W,H);
  }};
}
