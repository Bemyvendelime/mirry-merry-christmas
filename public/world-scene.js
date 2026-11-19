import * as T from 'three';
import { plots } from './layout.js';

// Metres, +Y up. All public fixtures are local geometry and remain visible offline.
export function buildScenery(scene) {
  let seed=5647123;
  const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
  const between=(a,b)=>a+rnd()*(b-a), tau=Math.PI*2;
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  const makeCanvas=(w,h=w)=>{const c=document.createElement('canvas'); c.width=w;c.height=h;return c;};
  const texLoader=new T.TextureLoader();
  const texture=(name,repeat)=>{const t=texLoader.load(new URL('./scene-assets/'+name,import.meta.url).href);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.setScalar(repeat);t.anisotropy=4;return t;};
  scene.background=new T.Color(0x8494b8);scene.fog=new T.FogExp2(0x8792b0,.0065);
  scene.add(new T.HemisphereLight(0xe1e7ff,0x8e858e,1.7));
  const moon=new T.DirectionalLight(0xffe1c5,1.3);moon.position.set(-40,45,20);scene.add(moon);
  const fill=new T.DirectionalLight(0xbbd1ff,.55);fill.position.set(18,20,-60);scene.add(fill);
  const flat=(color,opts={})=>new T.MeshLambertMaterial({color,...opts});
  const unlit=(color,opts={})=>new T.MeshBasicMaterial({color,...opts});
  const mesh=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o;};
  // Preserve the brushwork of the reference in the distant horizon while all accessible land is fully 3D.
  const horizon=texLoader.load(new URL('./scene-assets/winter-horizon.webp',import.meta.url).href);horizon.colorSpace=T.SRGBColorSpace;horizon.wrapS=T.MirroredRepeatWrapping;horizon.repeat.x=4;
  const horizonM=unlit(0xffffff,{map:horizon,side:T.BackSide,fog:false});
  const backdrop=mesh(new T.CylinderGeometry(175,175,38,128,1,true),horizonM,0,15,0);backdrop.rotation.y=Math.PI*.73;
  const skyGeometry=new T.SphereGeometry(245,32,18);const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 d;void main(){ d=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 d;void main(){float a=clamp((normalize(d).y-.08)*1.65,0.,1.);vec3 col=mix(vec3(.375,.438,.635),vec3(.105,.171,.325),a);gl_FragColor=vec4(col,1.); }'});mesh(skyGeometry,skyMat);
  const scale=18,span=128,cn=makeCanvas(span*scale);const ctx=cn.getContext('2d');
  ctx.fillStyle='white';ctx.fillRect(0,0,cn.width,cn.height);ctx.translate(cn.width/2,cn.height/2);ctx.scale(scale,scale);
  function ellipse(x,z,rx,rz,width,fill=false){ctx.beginPath();ctx.ellipse(x,z,rx,rz,0,0,tau);if(fill)ctx.fill();else {ctx.lineWidth=width;ctx.stroke();}}
  ctx.fillStyle=ctx.strokeStyle='black';ctx.lineCap='round';ctx.lineJoin='round';
  ellipse(0,0,12,12,0,true);ctx.fillRect(-3.6,6,7.2,58);
  for(const sign of [-1,1]){ellipse(sign*25,-8,16,20,5.7);ctx.beginPath();ctx.moveTo(sign*6,4);ctx.quadraticCurveTo(sign*12,8,sign*17,8.6);ctx.lineWidth=6;ctx.stroke();ctx.beginPath();ctx.moveTo(sign*8,-4);ctx.lineTo(sign*11,-11);ctx.stroke();}
  for(const p of plots){ctx.save();ctx.translate(p.x,p.z);ctx.rotate(-p.angle);ctx.fillRect(-3.6,-3.4,7.2,6.8);ctx.restore();const a=Math.atan2((p.z+8)/20,(p.x-Math.sign(p.x)*25)/16);ctx.beginPath();ctx.moveTo(p.x,p.z);ctx.lineTo(Math.sign(p.x)*25+16*Math.cos(a),-8+20*Math.sin(a));ctx.lineWidth=3.2;ctx.stroke();}
  // Powder collects along the joints; a few patches also survive on the walking surface.
  ctx.fillStyle='rgba(205,205,205,.48)';for(let i=0;i<4500;i++){const x=between(-59,59),z=between(-55,55);const r=between(.025,.17);ctx.beginPath();ctx.ellipse(x,z,r*2.3,r,.3,0,tau);ctx.fill();}
  const mask=new T.CanvasTexture(cn);mask.anisotropy=2;
  const pav=mesh(new T.PlaneGeometry(span,span),new T.MeshStandardMaterial({map:texture('granite.webp',39),color:0xb5aac0,roughness:.68,metalness:.14}));pav.rotation.x=-Math.PI/2;
  const snow=mesh(new T.PlaneGeometry(span,span),flat(0xe0e6fc,{map:texture('snow.webp',13),alphaMap:mask,transparent:true,depthWrite:false}),0,.017,0);snow.rotation.x=-Math.PI/2;snow.renderOrder=1;
  // Seeded instance batches keep draw calls independent of branch, cobble, and light count.
  const cube=new T.BoxGeometry(1,1,1),stem=new T.CylinderGeometry(.88,1,1,7),rock=new T.IcosahedronGeometry(1,0),cone=new T.ConeGeometry(1,1,7),post=new T.CylinderGeometry(1,1,1,8);
  const diffuse=flat(0xffffff),lit=unlit(0xffffff), batches=new Map(), transform=new T.Object3D(), up=V(0,1,0);
  function add(g,x,y,z,sx,sy,sz,color,ry=0,mat=diffuse,quat=null){let byMat=batches.get(g);if(!byMat)batches.set(g,byMat=new Map());let batch=byMat.get(mat);if(!batch)byMat.set(mat,batch={m:[],c:[]});transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);if(quat)transform.quaternion.copy(quat);else transform.rotation.set(0,ry,0);transform.updateMatrix();batch.m.push(transform.matrix.clone());batch.c.push(new T.Color(color));}
  function limb(a,b,r,color,g=stem){const v=b.clone().sub(a);if(v.lengthSq()<.00001)return;const q=new T.Quaternion().setFromUnitVectors(up,v.clone().normalize());add(g,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,r,v.length(),r,color,0,diffuse,q);}
  const stoneColors=[0x838698,0x8d8d99,0x9d9aa3,0x847d90],choose=arr=>arr[Math.floor(rnd()*arr.length)];
  function curb(x,z,rx,rz,h=.26){const n=Math.ceil(tau*Math.max(rx,rz)/.85);for(let i=0;i<n;i++){const a=i/n*tau;const ca=Math.cos(a),sa=Math.sin(a);const tangent=tau/n*Math.hypot(rx*sa,rz*ca);const yaw=-Math.atan2(rz*ca,-rx*sa);add(cube,x+ca*rx,h/2+.02,z+sa*rz,tangent*.97,h,.3,choose(stoneColors),yaw);add(cube,x+ca*rx,h+.028,z+sa*rz,tangent*.98,.045,.32,0xe6e5ee,yaw);}}
  curb(0,0,3.3,3.3,.34);
  // Plot paving leaves an empty, level building footprint for each team.
  for(const p of plots){const width=6.8,depth=6.1;const c=Math.cos(p.angle),s=Math.sin(p.angle);const box=(lx,lz,w,d,col)=>add(cube,p.x+lx*c+lz*s,.055,p.z-lx*s+lz*c,w,.10,d,col,p.angle);for(const zz of [-1,1])for(let i=0;i<14;i++)box(-width/2+(i+.5)*width/14,zz*depth/2,width/14-.018,.23,choose([0x995e59,0x88594d,0xa36a62]));for(const xx of [-1,1])for(let i=0;i<13;i++)box(xx*width/2,-depth/2+(i+.5)*depth/13,.23,depth/13-.018,choose([0x995e59,0x88594d,0xa36a62]));}
  const glowPos=[],glowCodes=[],glowSizes=[];function glow(x,y,z,color,size){glowPos.push(x,y,z);glowCodes.push(...new T.Color(color).toArray());glowSizes.push(size);}
  const pools=[];function pool(x,z,strength,rx,rz){pools.push([x,z,strength,rx,rz]);}
  const lampLocations=[];
  function lamp(x,z,zone=null){lampLocations.push([x,z]);add(cube,x,.2,z,.62,.4,.62,0x626276);add(cube,x,2.25,z,.21,4.2,.21,0x624a44);add(cube,x+.34,4.2,z,.93,.17,.19,0x775b4a);limb(V(x+.05,3.72,z),V(x+.55,4.18,z),.064,0x584a45);add(post,x+.63,3.94,z,.032,.42,.032,0x3d3741);add(cube,x+.63,3.58,z,.41,.60,.41,0xffca7e,0,lit);for(const dx of [-.20,.20])for(const dz of [-.20,.20])add(cube,x+.63+dx,3.58,z+dz,.041,.64,.041,0x443c42);add(cube,x+.63,3.28,z,.52,.09,.52,0x45404a);add(cone,x+.63,3.99,z,.41,.28,.41,0x443d46,Math.PI*.25);glow(x+.63,3.58,z,0xffbf70,2.5);pool(x+.63,z,.5,2.2,4.1);
    if(zone){const cv=makeCanvas(96,150),b=cv.getContext('2d');b.fillStyle=zone==='A'?'#94483c':'#47547a';b.beginPath();b.moveTo(0,0);b.lineTo(96,0);b.lineTo(96,150);b.lineTo(48,129);b.lineTo(0,150);b.fill();b.fillStyle='#f3e8d5';b.font='60px Georgia';b.textAlign='center';b.fillText(zone,48,81);const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;const sign=mesh(new T.PlaneGeometry(.67,1.05),unlit(0xffffff,{map:t,side:T.DoubleSide,transparent:true}),x+.56,2.55,z+.12);sign.rotation.y=x>0?-.18:.18;}}
  for(const side of [-1,1]){lamp(side*5,13,side<0?'A':'B');lamp(side*4.3,27);lamp(side*4.3,40);for(let i=0;i<8;i++){let a=(i+.25)*tau/8;lamp(side*25+13*Math.cos(a),-8+17*Math.sin(a));}lamp(side*7,-9);}
  const leafPositions=[],leafColors=[];
  function triangle(a,b,c,color,shade=1){leafPositions.push(...a,...b,...c);const v=new T.Color(color).multiplyScalar(shade);for(let i=0;i<3;i++)leafColors.push(v.r,v.g,v.b);}
  function fir(x,z,h,r,decorated){add(stem,x,h*.46,z,r*.12,h*.91,r*.12,0x59493e);const levels=decorated?23:12;for(let j=0;j<levels;j++){const f=j/levels;const y=h*(.16+.81*f);const maxR=r*Math.pow(1-f,.86);const arms=Math.ceil(8+maxR*2.1);const offset=between(0,tau);for(let k=0;k<arms;k++){const a=offset+k/arms*tau+between(-.065,.065);const radius=maxR*between(.84,1.13);const ca=Math.cos(a),sa=Math.sin(a);const vert=(d,w,yy)=>[x+ca*d-sa*w,yy,z+sa*d+ca*w];const shoulder=between(.1,.2)*radius;const heel=vert(.06*radius,0,y+.28);const top=vert(.49*radius,0,y+.06);const tip=vert(radius,0,y-.06*radius+between(-.14,.03));const left=vert(.55*radius,shoulder,y-.15),right=vert(.55*radius,-shoulder,y-.19);const col=choose([0x284238,0x30493f,0x365244,0x3d584d,0x42584f]);triangle(heel,left,top,col);triangle(heel,top,right,col,.87);triangle(top,left,tip,col);triangle(top,tip,right,col,.79);
    for(let n=0;n<4;n++){const t=.29+n*.15;for(const sign of [-1,1]){const a1=vert(radius*t,0,y+.035-.065*radius*t);const b1=vert(radius*(t+.065),sign*shoulder*(1-t*.65),y-.12);const c1=vert(radius*(t+.28),sign*shoulder*(1-t*.95),y-.18-.06*radius*t);triangle(a1,b1,c1,col,between(.7,.96));}}
    if(rnd()<.78){const snowCol=choose([0xc9d3e6,0xadbcd6,0xe0e1ed,0xc1cfde]);const spread=shoulder*between(.4,.95);triangle(vert(radius*.26,0,y+.14),vert(radius*.61,spread,y-.035),vert(radius*.86,0,y-.02*radius+.04),snowCol);triangle(vert(radius*.26,0,y+.14),vert(radius*.86,0,y-.02*radius+.04),vert(radius*.59,-spread*.69,y-.03),snowCol,.91);}
    if(decorated&&rnd()<.26){const yy=tip[1]+.06;add(rock,tip[0],yy,tip[2],.044,.054,.044,0xffda8e,0,lit);glow(tip[0],yy,tip[2],0xffbc58,.48);}
  }}}
  fir(0,0,10.7,3.34,true);
  function star(x,y,z){const pts=[];for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.37:.9;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}for(let i=0;i<10;i++){const a=pts[i],b=pts[(i+1)%10];triangle([x,y,z+.21],[x+a[0],y+a[1],z],[x+b[0],y+b[1],z],i%2?0xffe7a0:0xffc56a,1.65);triangle([x,y,z-.21],[x+b[0],y+b[1],z],[x+a[0],y+a[1],z],0xffdb85,1.9);}glow(x,y,z,0xffd887,4.3);}
  star(0,10.94,0);
  for(const side of [-1,1])for(let i=0;i<8;i++){let a=i*tau/8+.19;const x=side*25+between(4.5,8)*Math.cos(a),z=-8+between(7,11)*Math.sin(a);if(i%3===0)fir(x,z,between(3.4,5.1),between(.9,1.55),false);}
  function bareTree(x,z,h,pale=false){const barks=pale?[0xb7aeb5,0xb2a4a5,0xa19aa9]:[0x685954,0x635652,0x78665a];const base=V(x,0,z);const trunkTop=V(x+between(-.24,.24),h*.66,z+between(-.24,.24));limb(base,trunkTop,h*.041,choose(barks));function branch(start,angle,length,rad,depth,upward){const horizontal=length*Math.sqrt(1-upward*upward);const end=start.clone().add(V(Math.cos(angle)*horizontal,length*upward,Math.sin(angle)*horizontal));limb(start,end,rad,choose(barks));if(rad>.10&&depth%2===0){const a=start.clone(),b=end.clone();a.x-=rad*.6;b.x-=rad*.6;limb(a,b,rad*.40,0xc6bfc5);}if(depth>0){branch(end,angle+between(-.56,.5),length*between(.64,.81),rad*.64,depth-1,between(.40,.88));branch(end,angle+choose([-1,1])*between(.58,1.7),length*between(.48,.72),rad*.51,depth-1,between(.23,.78));}else if(rnd()<.16){add(rock,end.x,end.y,end.z,.09,.035,.063,choose([0x875c44,0xa16c4c]));}}
    for(let k=0;k<7;k++){const frac=.48+.48*k/7;const pos=base.clone().lerp(trunkTop,frac);branch(pos,k*2.4+between(-.4,.4),h*between(.17,.25),h*.021,3,between(.38,.78));}branch(trunkTop,rnd()*tau,h*.17,h*.019,3,.92);}
  for(const side of [-1,1]){for(let i=0;i<8;i++){const a=i*tau/8+.1;bareTree(side*25+7.4*Math.cos(a),-8+12*Math.sin(a),between(5.6,8.2),i%4===0);}for(let i=0;i<7;i++){bareTree(side*between(47,54),-39+i*13,between(8,12),i%3===0);}for(let i=0;i<3;i++)bareTree(side*(10+i*3),20+i*9,between(7,12),i%2===0);}
  for(let i=0;i<13;i++)bareTree(-54+i*8.8,between(-49,-43),between(7,11),i%3===0);
  // Snow-covered planting beds and rounded stones supply close-up detail under the branches.
  for(const side of [-1,1]){for(let i=0;i<155;i++){const a=rnd()*tau,d=Math.sqrt(rnd());const x=side*25+9.7*d*Math.cos(a),z=-8+13*d*Math.sin(a),sz=between(.14,.7);add(rock,x,sz*.17,z,sz,sz*.56,sz*.77,choose([0x708188,0x89929f,0xa5a6b7]),a);add(rock,x-.025,sz*.30,z,sz*.93,sz*.50,sz*.70,0xdeE3ee,a);}}for(let i=0;i<54;i++){const a=rnd()*tau,d=rnd()*3.10;add(rock,d*Math.cos(a),.27,d*Math.sin(a),between(.26,.64),.22,between(.20,.44),0xd3deeb,a);}
  // Warm window rhythm belongs to the surrounding permanent campus, outside editable plots.
  function building(x,z,w,h,d){const stone=choose([0x8f8b9c,0x959299,0x858497]);add(cube,x,h/2,z,w,h,d,stone);add(cube,x,h+.13,z,w+.36,.26,d+.36,0xc8cedc);for(let j=0;j<Math.floor((h-1)/1.9);j++)for(let k=1;k<Math.floor(w/1.8);k++){let xx=x-w/2+k*1.8,yy=1.7+j*1.9;let bright=rnd()<.25;add(cube,xx,yy,z+d/2+.02,.71,1.12,.08,0x566376);add(cube,xx,yy,z+d/2+.07,.52,.89,.075,bright?0xffca81:0x728096,0,bright?lit:diffuse);}}
  building(-31,-61,27,8,8);building(-39,-60,6,12,8.4);building(-22,-60,5.6,10.5,8.4);building(23,-64,27,7,9);building(45,-66,17,8,9);
  const leaves=new T.BufferGeometry();leaves.setAttribute('position',new T.Float32BufferAttribute(leafPositions,3));leaves.setAttribute('color',new T.Float32BufferAttribute(leafColors,3));leaves.computeVertexNormals();mesh(leaves,flat(0xffffff,{vertexColors:true,side:T.DoubleSide,flatShading:true}));
  for(const [geom,materials] of batches)for(const [mat,b] of materials){const inst=new T.InstancedMesh(geom,mat,b.m.length);for(let i=0;i<b.m.length;i++){inst.setMatrixAt(i,b.m[i]);inst.setColorAt(i,b.c[i]);}inst.computeBoundingSphere();scene.add(inst);}
  const poolCanvas=makeCanvas(128);const pc=poolCanvas.getContext('2d'),gg=pc.createRadialGradient(64,64,0,64,64,64);gg.addColorStop(0,'rgba(255,178,103,.67)');gg.addColorStop(.23,'rgba(250,178,118,.40)');gg.addColorStop(1,'rgba(255,190,133,0)');pc.fillStyle=gg;pc.fillRect(0,0,128,128);const poolTex=new T.CanvasTexture(poolCanvas);poolTex.colorSpace=T.SRGBColorSpace;pool(0,0,.68,7,7);
  const pm=unlit(0xffffff,{map:poolTex,depthWrite:false,transparent:true,blending:T.AdditiveBlending,opacity:.54});const pmesh=new T.InstancedMesh(new T.PlaneGeometry(2,2),pm,pools.length);for(let i=0;i<pools.length;i++){const [x,z,,rx,rz]=pools[i];transform.position.set(x,.037,z);transform.rotation.set(-Math.PI/2,0,0);transform.scale.set(rx,rz,1);transform.updateMatrix();pmesh.setMatrixAt(i,transform.matrix);}pmesh.renderOrder=2;scene.add(pmesh);
  const gl=new T.BufferGeometry();gl.setAttribute('position',new T.Float32BufferAttribute(glowPos,3));gl.setAttribute('tint',new T.Float32BufferAttribute(glowCodes,3));gl.setAttribute('radius',new T.Float32BufferAttribute(glowSizes,1));
  const gm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{vh:{value:innerHeight}},vertexShader:'attribute vec3 tint;attribute float radius;varying vec3 hue;uniform float vh;void main(){hue=tint;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(radius*vh*.64/max(.3,-p.z),2.,125.);}',fragmentShader:'varying vec3 hue;void main(){float rr=length(gl_PointCoord-.5)*2.;if(rr>1.)discard;float a=.27*pow(1.-rr,3.)+.36*pow(1.-rr,15.);gl_FragColor=vec4(hue,a);}'});const halo=new T.Points(gl,gm);halo.renderOrder=4;scene.add(halo);
  const flakes=new Float32Array(420*3);for(let i=0;i<flakes.length;i+=3){flakes[i]=between(-56,56);flakes[i+1]=between(0,18);flakes[i+2]=between(-44,45);}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(flakes,3));const sm=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'uniform float time;void main(){vec3 q=position;q.y=mod(q.y-time*.36,18.);q.x+=.5*sin(time*.4+q.y*.45+q.z);vec4 v=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(31./max(1.,-v.z),1.,2.5);}',fragmentShader:'void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(.93,.94,1.,.46*(1.-smoothstep(.15,.5,r)));}'});scene.add(new T.Points(sg,sm));
  return {update(time){sm.uniforms.time.value=time;gm.uniforms.vh.value=innerHeight;}};
}
