import * as T from 'three';
import { plots } from './layout.js';
import { setWinterSky, makeWetPaving, addLanternReflections, addEvergreenNeedles, addFirDistanceModel } from './winter-materials.js';

// Metres, +Y up. All public fixtures are local geometry and remain visible offline.
export function buildScenery(scene) {
  let seed=5647123;
  const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
  const between=(a,b)=>a+rnd()*(b-a), tau=Math.PI*2;
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  const makeCanvas=(w,h=w)=>{const c=document.createElement('canvas'); c.width=w;c.height=h;return c;};
  const texLoader=new T.TextureLoader();
  const texture=(name,repeat)=>{const t=texLoader.load(new URL('./scene-assets/'+name,import.meta.url).href);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.setScalar(repeat);t.anisotropy=4;return t;};
  scene.background=new T.Color(0x8997b5);scene.fog=new T.FogExp2(0x929bb8,.0074);
  scene.add(new T.HemisphereLight(0xd8e4ff,0x9a8993,1.42));
  const moon=new T.DirectionalLight(0xffe0bc,1.15);moon.position.set(-44,32,18);scene.add(moon);
  const fill=new T.DirectionalLight(0xadc9ff,.49);fill.position.set(18,20,-60);scene.add(fill);
  setWinterSky(scene);
  const flat=(color,opts={})=>new T.MeshLambertMaterial({color,...opts});
  const unlit=(color,opts={})=>new T.MeshBasicMaterial({color,...opts});
  const mesh=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o;};
  const scale=18,span=128,cn=makeCanvas(span*scale);const ctx=cn.getContext('2d');
  ctx.fillStyle='white';ctx.fillRect(0,0,cn.width,cn.height);ctx.translate(cn.width/2,cn.height/2);ctx.scale(scale,scale);
  function ellipse(x,z,rx,rz,width,fill=false){ctx.beginPath();ctx.ellipse(x,z,rx,rz,0,0,tau);if(fill)ctx.fill();else {ctx.lineWidth=width;ctx.stroke();}}
  ctx.fillStyle=ctx.strokeStyle='black';ctx.lineCap='round';ctx.lineJoin='round';
  ellipse(0,0,12,12,0,true);ctx.fillRect(-3.6,6,7.2,58);
  for(const sign of [-1,1]){ellipse(sign*25,-8,16,20,5.7);ctx.beginPath();ctx.moveTo(sign*6,4);ctx.quadraticCurveTo(sign*12,8,sign*17,8.6);ctx.lineWidth=6;ctx.stroke();ctx.beginPath();ctx.moveTo(sign*8,-4);ctx.lineTo(sign*11,-11);ctx.stroke();}
  for(const p of plots){ctx.save();ctx.translate(p.x,p.z);ctx.rotate(-p.angle);ctx.fillRect(-3.6,-3.4,7.2,6.8);ctx.restore();const a=Math.atan2((p.z+8)/20,(p.x-Math.sign(p.x)*25)/16);ctx.beginPath();ctx.moveTo(p.x,p.z);ctx.lineTo(Math.sign(p.x)*25+16*Math.cos(a),-8+20*Math.sin(a));ctx.lineWidth=3.2;ctx.stroke();}
  // Powder collects along the joints; a few patches also survive on the walking surface.
  ctx.fillStyle='rgba(205,205,205,.48)';for(let i=0;i<4500;i++){const x=between(-59,59),z=between(-55,55);const r=between(.025,.17);ctx.beginPath();ctx.ellipse(x,z,r*2.3,r,.3,0,tau);ctx.fill();}
  // Sample path edges to lay down irregular wind-blown fingers of snow at
  // their edge, preserving the empty paths and each team's building pad.
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  const edgeMap=makeCanvas(240), ec=edgeMap.getContext('2d',{willReadFrequently:true});
  ec.drawImage(cn,0,0,240,240);
  const alpha=ec.getImageData(0,0,240,240).data;
  const sample=(x,y)=>alpha[4*(Math.max(0,Math.min(239,x))+240*Math.max(0,Math.min(239,y)))];
  ctx.restore();
  for(let i=0;i<32000;i++){
    const x=between(-58,58),z=between(-53,53),px=Math.floor((x/span+.5)*240),py=Math.floor((z/span+.5)*240);
    if(sample(px,py)>100)continue;
    if(sample(px-2,py)+sample(px+2,py)+sample(px,py-2)+sample(px,py+2)<180)continue;
    ctx.fillStyle='rgba(240,240,240,'+between(.35,.85)+')';
    const w=between(.09,.5);ctx.beginPath();ctx.ellipse(x,z,w,w*between(.18,.52),-.37,0,tau);ctx.fill();
  }
  function footprints(cx,cz,steps,bearing){
    for(let i=0;i<steps;i++){
      const lateral=(i%2?.13:-.13)+between(-.035,.035);
      const d=i*.54;
      const x=cx+Math.sin(bearing)*d+Math.cos(bearing)*lateral;
      const z=cz+Math.cos(bearing)*d-Math.sin(bearing)*lateral;
      ctx.fillStyle='rgba(58,58,58,.52)';
      ctx.beginPath();ctx.ellipse(x,z,.075,.161,-bearing+(i%2?.07:-.07),0,tau);ctx.fill();
    }
  }
  footprints(-3.75,21,23,.018);footprints(3.72,34,12,-.04);footprints(-11.7,5.8,16,-1.2);
  const mask=new T.CanvasTexture(cn);mask.anisotropy=3;
  const paving=makeWetPaving();
  const pav=mesh(new T.PlaneGeometry(span,span),paving.material);pav.rotation.x=-Math.PI/2;
  const snow=mesh(new T.PlaneGeometry(span,span),flat(0xe2e5f2,{map:texture('snow.webp',25),alphaMap:mask,transparent:true,depthWrite:false}),0,.017,0);
  snow.rotation.x=-Math.PI/2;snow.renderOrder=1;
  const distantSnow=mesh(new T.PlaneGeometry(360,360),flat(0xc2cada),0,-.20,0);distantSnow.rotation.x=-Math.PI/2;
  // Seeded instance batches keep draw calls independent of branch, cobble, and light count.
  const cube=new T.BoxGeometry(1,1,1),stem=new T.CylinderGeometry(.88,1,1,7),rock=new T.IcosahedronGeometry(1,0),cone=new T.ConeGeometry(1,1,7),post=new T.CylinderGeometry(1,1,1,8);
  const diffuse=flat(0xffffff),lit=unlit(0xffffff), batches=new Map(), transform=new T.Object3D(), up=V(0,1,0);
  function add(g,x,y,z,sx,sy,sz,color,ry=0,mat=diffuse,quat=null){let byMat=batches.get(g);if(!byMat)batches.set(g,byMat=new Map());let batch=byMat.get(mat);if(!batch)byMat.set(mat,batch={m:[],c:[]});transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);if(quat)transform.quaternion.copy(quat);else transform.rotation.set(0,ry,0);transform.updateMatrix();batch.m.push(transform.matrix.clone());batch.c.push(new T.Color(color));}
  function limb(a,b,r,color,g=stem){const v=b.clone().sub(a);if(v.lengthSq()<.00001)return;const q=new T.Quaternion().setFromUnitVectors(up,v.clone().normalize());add(g,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,r,v.length(),r,color,0,diffuse,q);}
  const stoneColors=[0x838698,0x8d8d99,0x9d9aa3,0x847d90],choose=arr=>arr[Math.floor(rnd()*arr.length)];
  function curb(x,z,rx,rz,h=.26){const n=Math.ceil(tau*Math.max(rx,rz)/.85);for(let i=0;i<n;i++){const a=i/n*tau;const ca=Math.cos(a),sa=Math.sin(a);const tangent=tau/n*Math.hypot(rx*sa,rz*ca);const yaw=-Math.atan2(rz*ca,-rx*sa);add(cube,x+ca*rx,h/2+.02,z+sa*rz,tangent*.97,h,.3,choose(stoneColors),yaw);add(cube,x+ca*rx,h+.028,z+sa*rz,tangent*.98,.045,.32,0xe6e5ee,yaw);}}
  curb(0,0,6.20,6.20,.43);
  add(post,0,.23,0,6.13,.41,6.13,0xd6dce7);
  // Plot paving leaves an empty, level building footprint for each team.
  for(const p of plots){const width=6.8,depth=6.1;const c=Math.cos(p.angle),s=Math.sin(p.angle);const box=(lx,lz,w,d,col)=>add(cube,p.x+lx*c+lz*s,.055,p.z-lx*s+lz*c,w,.10,d,col,p.angle);for(const zz of [-1,1])for(let i=0;i<14;i++)box(-width/2+(i+.5)*width/14,zz*depth/2,width/14-.018,.23,choose([0x995e59,0x88594d,0xa36a62]));for(const xx of [-1,1])for(let i=0;i<13;i++)box(xx*width/2,-depth/2+(i+.5)*depth/13,.23,depth/13-.018,choose([0x995e59,0x88594d,0xa36a62]));}
  const glowPos=[],glowCodes=[],glowSizes=[];function glow(x,y,z,color,size){glowPos.push(x,y,z);glowCodes.push(...new T.Color(color).toArray());glowSizes.push(size);}
  
  const contactShadows=[];
  const lampLocations=[];
  const hipCap=new T.ConeGeometry(1,1,4);
  const bead=new T.SphereGeometry(1,8,7);
  const brass=0x9c7446, bronze=0x463c3b;
  function gildedHardware(x,z){
    // Four-sided hip roof, brass ridges and turned collar around each lit globe.
    add(hipCap,x+.63,3.98,z,.388,.23,.388,bronze,Math.PI/4);
    add(hipCap,x+.63,4.003,z,.32,.206,.32,0x8a7968,Math.PI/4);
    add(bead,x+.63,4.131,z,.045,.060,.045,brass);
    for(const h of [3.263,3.31,3.88]){
      add(cube,x+.63,h,z,.491,.021,.485,brass);
    }
    add(bead,x+.63,3.205,z,.044,.087,.044,brass);
    for(const side of [-1,1]){
      add(cube,x+.63,3.59,z+side*.213,.398,.018,.02,bronze);
      add(cube,x+.63+side*.215,3.59,z,.02,.018,.398,bronze);
    }
    for(const h of [.50,.57,3.94]){
      add(cube,x,h,z,.228,.038,.228,bronze);
    }
    for(const dx of [-.073,.073]){
      add(bead,x+dx,3.93,z+.107,.018,.018,.016,brass);
    }
    add(cube,x,.421,z,.303,.053,.307,0x9ca0ab);
  }
  function lamp(x,z,zone=null){lampLocations.push([x,z]);contactShadows.push([x,z,.80,.66]);gildedHardware(x,z);add(cube,x,.2,z,.62,.4,.62,0x626276);add(cube,x,2.25,z,.21,4.2,.21,0x624a44);add(cube,x+.34,4.2,z,.93,.17,.19,0x775b4a);limb(V(x+.05,3.72,z),V(x+.55,4.18,z),.064,0x584a45);add(post,x+.63,3.94,z,.032,.42,.032,0x3d3741);add(cube,x+.63,3.58,z,.41,.60,.41,0xffca7e,0,lit);for(const dx of [-.20,.20])for(const dz of [-.20,.20])add(cube,x+.63+dx,3.58,z+dz,.041,.64,.041,0x443c42);add(cube,x+.63,3.28,z,.52,.09,.52,0x45404a);glow(x+.63,3.58,z,0xffbf70,2.5);
    if(zone){const cv=makeCanvas(96,150),b=cv.getContext('2d');b.fillStyle=zone==='A'?'#94483c':'#47547a';b.beginPath();b.moveTo(0,0);b.lineTo(96,0);b.lineTo(96,150);b.lineTo(48,129);b.lineTo(0,150);b.fill();b.fillStyle='#f3e8d5';b.font='60px Georgia';b.textAlign='center';b.fillText(zone,48,81);const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;const sign=mesh(new T.PlaneGeometry(.67,1.05),unlit(0xffffff,{map:t,side:T.DoubleSide,transparent:true}),x+.56,2.55,z+.12);sign.rotation.y=x>0?-.18:.18;}}
  for(const side of [-1,1]){lamp(side*5,13,side<0?'A':'B');lamp(side*4.3,27);lamp(side*4.3,40);for(let i=0;i<8;i++){let a=(i+.25)*tau/8;lamp(side*25+13*Math.cos(a),-8+17*Math.sin(a));}lamp(side*7,-9);}
  const leafPositions=[],leafColors=[];
  function triangle(a,b,c,color,shade=1){leafPositions.push(...a,...b,...c);const v=new T.Color(color).multiplyScalar(shade);for(let i=0;i<3;i++)leafColors.push(v.r,v.g,v.b);}
  function fir(x,z,h,r,decorated){contactShadows.push([x,z,r,r*.82]);add(stem,x,h*.46,z,r*.12,h*.91,r*.12,0x59493e);const levels=decorated?43:12;for(let j=0;j<levels;j++){const f=j/levels;const y=h*((decorated?.070:.16)+(decorated?.90:.81)*f);const maxR=r*Math.pow(1-f,.86);const arms=decorated?Math.ceil(11+maxR*1.45):Math.ceil(8+maxR*2.1);const offset=between(0,tau);for(let k=0;k<arms;k++){const a=offset+k/arms*tau+between(-.065,.065);const radius=maxR*between(.84,1.13);const ca=Math.cos(a),sa=Math.sin(a);const vert=(d,w,yy)=>[x+ca*d-sa*w,yy,z+sa*d+ca*w];const shoulder=between(.1,.2)*radius;const heel=vert(.06*radius,0,y+.28);const top=vert(.49*radius,0,y+.06);const tip=vert(radius,0,y-.06*radius+between(-.14,.03));const left=vert(.55*radius,shoulder,y-.15),right=vert(.55*radius,-shoulder,y-.19);const col=choose([0x284238,0x30493f,0x365244,0x3d584d,0x42584f]);triangle(heel,left,top,col);triangle(heel,top,right,col,.87);triangle(top,left,tip,col);triangle(top,tip,right,col,.79);
    for(let n=0;n<4;n++){const t=.29+n*.15;for(const sign of [-1,1]){const a1=vert(radius*t,0,y+.035-.065*radius*t);const b1=vert(radius*(t+.065),sign*shoulder*(1-t*.65),y-.12);const c1=vert(radius*(t+.28),sign*shoulder*(1-t*.95),y-.18-.06*radius*t);triangle(a1,b1,c1,col,between(.7,.96));}}
    if(rnd()<.78){const snowCol=choose([0xacbbca,0x99a9be,0xc6d0db,0xaab8c6]);const spread=shoulder*between(.4,.95);triangle(vert(radius*.26,0,y+.14),vert(radius*.61,spread,y-.035),vert(radius*.86,0,y-.02*radius+.04),snowCol);triangle(vert(radius*.26,0,y+.14),vert(radius*.86,0,y-.02*radius+.04),vert(radius*.59,-spread*.69,y-.03),snowCol,.91);}
    if(decorated&&rnd()<.18){const yy=tip[1]+.06;add(rock,tip[0],yy,tip[2],.072,.089,.072,0xffe4af,0,lit);glow(tip[0],yy,tip[2],0xffba60,.69);}
  }}}
  const firHeight=33.8, firRadius=7.35;
  fir(0,0,firHeight,6.61,true);
  const heroNeedles=addEvergreenNeedles(scene,rnd,0,0,firHeight,firRadius);
  // Structural limbs remain visible near the enormous canopy's underside.
  for(let level=0;level<17;level++){
    const f=level/17, y=2.39+f*26.9;
    const reach=firRadius*(1-f*.87);
    for(let j=0;j<8;j++){
      const a=j*tau/8+level*.87+between(-.09,.09),l=reach*between(.76,.94);
      const inner=V(Math.cos(a)*.24,y+.27,Math.sin(a)*.24);
      const elbow=V(Math.cos(a)*l*.56,y-.36,Math.sin(a)*l*.56);
      const end=V(Math.cos(a)*l,y-.34+between(-.23,.12),Math.sin(a)*l);
      limb(inner,elbow,.16*(1-f*.75),0x51443c);
      limb(elbow,end,.085*(1-f*.65),0x4c463a);
    }
  }
  // Strings are wound round separate bough tiers; their curve sags softly
  // between branch tips and is visible from underneath as visitors approach.
  const wirePositions=[];
  const maxTurns=12.25, bulbs=640;
  const onGarland=t=>{
    const a=t*tau*maxTurns+.65;
    const y=2.11+t*30.4;
    const f=Math.max(0,(y-2.32)/30.1);
    const radius=firRadius*Math.pow(Math.max(.025,1-f),.79)*(.995+.045*Math.sin(a*7.));
    return V(Math.cos(a)*radius,y-.15*(1-Math.cos(12*a)),Math.sin(a)*radius);
  };
  for(let i=0;i<bulbs;i++){
    const t=i/(bulbs-1),pos=onGarland(t),size=.068+.029*(1-t);
    add(bead,pos.x,pos.y-.035,pos.z,size,size*1.22,size,choose([0xffe3a7,0xffda90,0xffcf7b]),0,lit);
    glow(pos.x,pos.y-.03,pos.z,choose([0xffc064,0xffce7a,0xffb76b]),.53+.34*(1-t));
    if(i+1<bulbs){const q=onGarland((i+1)/(bulbs-1));wirePositions.push(pos.x,pos.y,pos.z,q.x,q.y,q.z);}
  }
  const wireGeometry=new T.BufferGeometry();
  wireGeometry.setAttribute('position',new T.Float32BufferAttribute(wirePositions,3));
  const wire=new T.LineSegments(wireGeometry,new T.LineBasicMaterial({color:0x49453c,transparent:true,opacity:.53}));
  scene.add(wire);
  const starY=33.92, starR=2.08;
  const starSurface=(x,y,z,axis)=>axis===0?[x,y,z]:[z,y,-x];
  for(let axis=0;axis<2;axis++){
    const ratio=axis===0?1:.78, points=[];
    for(let i=0;i<16;i++){
      const a=Math.PI/2+i*Math.PI/8;
      const r=(i%2?.39:(i%4===0?1:.76))*starR*ratio;
      points.push(starSurface(Math.cos(a)*r,starY+Math.sin(a)*r,0,axis));
    }
    for(let i=0;i<16;i++){
      const a=points[i],b=points[(i+1)%16];
      triangle(starSurface(0,starY,.51*ratio,axis),a,b,i%2?0xffebb3:0xffba51,1.8);
      triangle(starSurface(0,starY,-.51*ratio,axis),b,a,i%2?0xffcf7b:0xffe4a2,1.7);
    }
  }
  glow(0,starY,0,0xffce78,8.9);
  const heroGeometry=new T.BufferGeometry();
  heroGeometry.setAttribute('position',new T.Float32BufferAttribute(leafPositions,3));
  heroGeometry.setAttribute('color',new T.Float32BufferAttribute(leafColors,3));
  heroGeometry.computeVertexNormals();
  const heroCore=mesh(heroGeometry,flat(0xffffff,{vertexColors:true,side:T.DoubleSide}));
  leafPositions.length=0;leafColors.length=0;
  addFirDistanceModel(scene,[heroCore,heroNeedles,wire],36,16.15);
  for(const side of [-1,1])for(let i=0;i<8;i++){let a=i*tau/8+.19;const x=side*25+between(4.5,8)*Math.cos(a),z=-8+between(7,11)*Math.sin(a);if(i%3===0)fir(x,z,between(3.4,5.1),between(.9,1.55),false);}
  function bareTree(x,z,h,pale=false){contactShadows.push([x,z,h*.17,h*.11]);const barks=pale?[0xb7aeb5,0xb2a4a5,0xa19aa9]:[0x685954,0x635652,0x78665a];const base=V(x,0,z);const trunkTop=V(x+between(-.24,.24),h*.66,z+between(-.24,.24));limb(base,trunkTop,h*.041,choose(barks));function branch(start,angle,length,rad,depth,upward){const horizontal=length*Math.sqrt(1-upward*upward);const end=start.clone().add(V(Math.cos(angle)*horizontal,length*upward,Math.sin(angle)*horizontal));limb(start,end,rad,choose(barks));if(rad>.10&&depth%2===0){const a=start.clone(),b=end.clone();a.x-=rad*.6;b.x-=rad*.6;limb(a,b,rad*.40,0xc6bfc5);}if(depth>0){branch(end,angle+between(-.56,.5),length*between(.64,.81),rad*.64,depth-1,between(.40,.88));branch(end,angle+choose([-1,1])*between(.58,1.7),length*between(.48,.72),rad*.51,depth-1,between(.23,.78));}else if(rnd()<.16){add(rock,end.x,end.y,end.z,.09,.035,.063,choose([0x875c44,0xa16c4c]));}}
    for(let k=0;k<7;k++){const frac=.48+.48*k/7;const pos=base.clone().lerp(trunkTop,frac);branch(pos,k*2.4+between(-.4,.4),h*between(.17,.25),h*.021,3,between(.38,.78));}branch(trunkTop,rnd()*tau,h*.17,h*.019,3,.92);}
  for(const side of [-1,1]){for(let i=0;i<8;i++){const a=i*tau/8+.1;bareTree(side*25+7.4*Math.cos(a),-8+12*Math.sin(a),between(5.6,8.2),i%4===0);}for(let i=0;i<7;i++){bareTree(side*between(47,54),-39+i*13,between(8,12),i%3===0);}for(let i=0;i<3;i++)bareTree(side*(10+i*3),20+i*9,between(7,12),i%2===0);}
  for(let i=0;i<13;i++)bareTree(-54+i*8.8,between(-49,-43),between(7,11),i%3===0);
  // Snow-covered planting beds and rounded stones supply close-up detail under the branches.
  for(const side of [-1,1]){for(let i=0;i<155;i++){const a=rnd()*tau,d=Math.sqrt(rnd());const x=side*25+9.7*d*Math.cos(a),z=-8+13*d*Math.sin(a),sz=between(.14,.7);add(rock,x,sz*.17,z,sz,sz*.56,sz*.77,choose([0x708188,0x89929f,0xa5a6b7]),a);add(rock,x-.025,sz*.30,z,sz*.93,sz*.50,sz*.70,0xdeE3ee,a);}}for(let i=0;i<138;i++){const a=rnd()*tau,d=Math.sqrt(rnd())*6.05;add(rock,d*Math.cos(a),.45,d*Math.sin(a),between(.26,.64),.22,between(.20,.44),0xd3deeb,a);}
  // Winter seed heads and thin, ice-tipped red-twig dogwood animate the
  // silhouettes of the planted islands without obstructing the perimeter plots.
  const grasses=[], grassColors=[];
  function twigLine(a,b,color){
    grasses.push(a.x,a.y,a.z,b.x,b.y,b.z);
    const c=new T.Color(color);grassColors.push(c.r,c.g,c.b,c.r,c.g,c.b);
  }
  for(const side of [-1,1]){
    for(let cluster=0;cluster<30;cluster++){
      const a=rnd()*tau,dist=between(.22,.91);
      const cx=side*25+9.6*Math.cos(a)*dist,cz=-8+13.2*Math.sin(a)*dist;
      for(let i=0;i<between(11,24);i++){
        const angle=rnd()*tau,reach=between(.17,.69),height=between(.18,.85);
        const bx=cx+between(-.15,.15),bz=cz+between(-.15,.15);
        const elbow=V(bx+Math.cos(angle)*reach*.36,height*.67,bz+Math.sin(angle)*reach*.36);
        const tip=V(bx+Math.cos(angle)*reach,height,bz+Math.sin(angle)*reach);
        const color=choose([0x9b745f,0x91594d,0x86564c,0xb08d65]);
        twigLine(V(bx,.04,bz),elbow,color);twigLine(elbow,tip,color);
        const bud=V(elbow.x+Math.cos(angle+.5)*reach*.45,elbow.y+.11,elbow.z+Math.sin(angle+.5)*reach*.45);
        twigLine(elbow,bud,color);
        if(i%5===0){add(rock,tip.x,tip.y,tip.z,.029,.039,.028,0x9c4d43);}
      }
    }
  }
  const thinGeometry=new T.BufferGeometry();
  thinGeometry.setAttribute('position',new T.Float32BufferAttribute(grasses,3));
  thinGeometry.setAttribute('color',new T.Float32BufferAttribute(grassColors,3));
  scene.add(new T.LineSegments(thinGeometry,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.73})));
  const shadowAtlas=makeCanvas(96),shadowCtx=shadowAtlas.getContext('2d');
  const vignette=shadowCtx.createRadialGradient(48,48,0,48,48,48);
  vignette.addColorStop(0,'rgba(37,38,57,.55)');vignette.addColorStop(.35,'rgba(55,61,79,.31)');vignette.addColorStop(1,'rgba(63,66,90,0)');
  shadowCtx.fillStyle=vignette;shadowCtx.fillRect(0,0,96,96);
  const shadowTexture=new T.CanvasTexture(shadowAtlas);shadowTexture.colorSpace=T.SRGBColorSpace;
  const softShadowMat=unlit(0xffffff,{map:shadowTexture,transparent:true,depthWrite:false});
  const shadows=new T.InstancedMesh(new T.PlaneGeometry(2,2).rotateX(-Math.PI/2),softShadowMat,contactShadows.length);
  contactShadows.forEach(([x,z,rx,rz],i)=>{
    transform.position.set(x+.07,.031,z-.06);transform.rotation.set(0,-.42,0);transform.scale.set(rx,1,rz);
    transform.updateMatrix();shadows.setMatrixAt(i,transform.matrix);
  });
  shadows.computeBoundingSphere();shadows.renderOrder=1.5;scene.add(shadows);
  const leaves=new T.BufferGeometry();leaves.setAttribute('position',new T.Float32BufferAttribute(leafPositions,3));leaves.setAttribute('color',new T.Float32BufferAttribute(leafColors,3));leaves.computeVertexNormals();mesh(leaves,flat(0xffffff,{vertexColors:true,side:T.DoubleSide,flatShading:true}));
  for(const [geom,materials] of batches)for(const [mat,b] of materials){const inst=new T.InstancedMesh(geom,mat,b.m.length);for(let i=0;i<b.m.length;i++){inst.setMatrixAt(i,b.m[i]);inst.setColorAt(i,b.c[i]);}inst.computeBoundingSphere();scene.add(inst);}
  const treeSpill=Array.from({length:9},(_,k)=>{
    const a=k*tau/9;
    return [Math.cos(a)*6.75-.63,Math.sin(a)*6.75];
  });
  const reflectLamps=addLanternReflections(scene,lampLocations.concat(treeSpill),paving,mask);
  const gl=new T.BufferGeometry();gl.setAttribute('position',new T.Float32BufferAttribute(glowPos,3));gl.setAttribute('tint',new T.Float32BufferAttribute(glowCodes,3));gl.setAttribute('radius',new T.Float32BufferAttribute(glowSizes,1));
  const gm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{vh:{value:innerHeight}},vertexShader:'attribute vec3 tint;attribute float radius;varying vec3 hue;uniform float vh;void main(){hue=tint;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(radius*vh*.64/max(.3,-p.z),2.,125.);}',fragmentShader:'varying vec3 hue;void main(){float rr=length(gl_PointCoord-.5)*2.;if(rr>1.)discard;float a=.27*pow(1.-rr,3.)+.36*pow(1.-rr,15.);gl_FragColor=vec4(hue,a);}'});const halo=new T.Points(gl,gm);halo.renderOrder=4;scene.add(halo);
  const flakes=new Float32Array(420*3);for(let i=0;i<flakes.length;i+=3){flakes[i]=between(-56,56);flakes[i+1]=between(0,18);flakes[i+2]=between(-44,45);}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(flakes,3));const sm=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'uniform float time;void main(){vec3 q=position;q.y=mod(q.y-time*.36,18.);q.x+=.5*sin(time*.4+q.y*.45+q.z);vec4 v=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(31./max(1.,-v.z),1.,2.5);}',fragmentShader:'void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(.93,.94,1.,.46*(1.-smoothstep(.15,.5,r)));}'});scene.add(new T.Points(sg,sm));
  return {ground:{mask,paving},update(time){sm.uniforms.time.value=time;gm.uniforms.vh.value=innerHeight;reflectLamps();}};
}
