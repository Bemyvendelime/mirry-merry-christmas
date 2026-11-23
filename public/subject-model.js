// A coloured visual hull from one segmented view. Its section at each pixel
// is the envelope of inscribed balls in the silhouette; both sides meet at
// its contour. This infers unseen depth, without a rectangular back plate.
import * as T from './vendor/three.js';
import {decodeSubject} from './subject-codec.js';
import {createRearSurface} from './subject-back.js';
import {createRigPose,solveRig,joints} from './joint-rig.js';

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const colourTable=Float32Array.from({length:256},(_,i)=>new T.Color(i/255,0,0).convertSRGBToLinear().r);

function subjectGrid(input,maxSide){
  const factor=Math.min(1,maxSide/Math.max(input.width,input.height));
  const w=Math.max(1,Math.round(input.width*factor)),h=Math.max(1,Math.round(input.height*factor));
  const W=w+2,H=h+2,rgba=new Uint8Array(W*H*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const x0=x*input.width/w,x1=(x+1)*input.width/w,y0=y*input.height/h,y1=(y+1)*input.height/h;
    let r=0,g=0,b=0,total=0;
    for(let sy=Math.floor(y0);sy<Math.ceil(y1);sy++)for(let sx=Math.floor(x0);sx<Math.ceil(x1);sx++){
      if(sx>=input.width||sy>=input.height)continue;
      const i=(sy*input.width+sx)*4;
      if(!input.rgba[i+3])continue;
      const weight=(Math.min(sx+1,x1)-Math.max(sx,x0))*(Math.min(sy+1,y1)-Math.max(sy,y0));
      total+=weight;r+=weight*input.rgba[i];g+=weight*input.rgba[i+1];b+=weight*input.rgba[i+2];
    }
    if(!total)continue;
    const i=4*((y+1)*W+x+1);
    rgba[i]=Math.round(r/total);rgba[i+1]=Math.round(g/total);rgba[i+2]=Math.round(b/total);
    rgba[i+3]=Math.round(255*Math.min(1,total/((x1-x0)*(y1-y0))));
  }
  return {w,h,W,H,rgba};
}

function depthField(grid,cut){
  const {W,H,rgba}=grid,n=W*H;
  const dist=new Float32Array(n),z=new Float32Array(n);
  for(let i=0;i<n;i++)dist[i]=rgba[4*i+3]>=cut?W+H:0;
  // An eight-neighbour Euclidean distance approximation locates the medial
  // ridges. The second pass reconstructs 3D rounded cross sections from them.
  const diag=Math.SQRT2;
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    const i=y*W+x;dist[i]=Math.min(dist[i],1+dist[i-1],1+dist[i-W],diag+dist[i-W-1],diag+dist[i-W+1]);
  }
  for(let y=H-2;y>0;y--)for(let x=W-2;x>0;x--){
    const i=y*W+x;dist[i]=Math.min(dist[i],1+dist[i+1],1+dist[i+W],diag+dist[i+W-1],diag+dist[i+W+1]);
  }
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    const i=y*W+x;if(!dist[i])continue;
    const R=Math.max(.55,dist[i]-.43);
    const rr=R*R;
    for(let yy=Math.max(1,Math.ceil(y-R));yy<=Math.min(H-2,Math.floor(y+R));yy++){
      const row=rr-(yy-y)*(yy-y),reach=Math.sqrt(Math.max(0,row));
      for(let xx=Math.max(1,Math.ceil(x-reach));xx<=Math.min(W-2,Math.floor(x+reach));xx++){
        const j=yy*W+xx,zz=row-(xx-x)*(xx-x);
        if(zz>z[j])z[j]=zz;
      }
    }
  }
  for(let i=0;i<n;i++)z[i]=Math.sqrt(z[i]);
  return z;
}

function fitRig(input,width,height){
  const lm=input.landmarks;
  const seen=i=>lm&&lm[i]?.visibility>.36&&lm[i].x>=-.04&&lm[i].x<=1.04&&lm[i].y>=-.04&&lm[i].y<=1.04;
  const shouldersSeen=seen(11)&&seen(12);
  const body=shouldersSeen&&((seen(13)||seen(14)||seen(23)||seen(24))||seen(0));
  const hasLegs=body&&[0,1].some(s=>[23,25,27].every(i=>seen(i+s)));
  const bones=[],byName=new Map(),sections=[];
  function add(name,parent,p){const i=bones.length;bones.push({name,parent,x:p.x,y:p.y,z:p.z||0});byName.set(name,i);return i;}
  function segment(start,end,radius){sections.push({start,end,radius:radius*height/1.8});}
  if(!body){
    const centers=[];
    for(const t of [.1,.43,.74,.94]){
      const row=Math.min(input.height-1,Math.floor(input.height*(1-t)));
      let sum=0,count=0;
      for(let x=0;x<input.width;x++)if(input.rgba[(row*input.width+x)*4+3]){sum+=x+.5;count++;}
      centers.push({x:count?(sum/count/input.width-.5)*width:0,y:t*height,z:0});
    }
    centers.forEach((p,i)=>add(['base','lower','upper','tip'][i],i-1,p));
    return {bones,byName,kind:'object',height,sections};
  }
  function point(i,depth=0){
    return {x:(clamp(lm[i].x,0,1)-.5)*width,y:(1-clamp(lm[i].y,0,1))*height,z:depth*height};
  }
  function average(...p){return {x:p.reduce((a,b)=>a+b.x,0)/p.length,y:p.reduce((a,b)=>a+b.y,0)/p.length,z:p.reduce((a,b)=>a+b.z,0)/p.length};}
  const shoulders=average(point(11),point(12));
  const hips=seen(23)&&seen(24)?average(point(23),point(24))
    :{x:shoulders.x,y:Math.max(0,shoulders.y-.53*height),z:0};
  const root=add('hips',-1,hips),spine=add('spine',root,average(hips,shoulders));
  const neck=add('neck',spine,shoulders);
  const face=average(...[0,1,2,3,4,5,6,7,8,9,10].map(i=>point(i,.018)));
  const head=add('head',neck,face);
  const top=add('crown',head,{...face,y:Math.min(height,face.y+height*.105)});
  segment(root,spine,.14);segment(spine,neck,.17);segment(neck,head,.068);segment(head,top,.115);
  for(const [s,side] of [[0,'left'],[1,'right']]){
    if(seen(13+s)){
      const shoulder=add(side+'Arm',spine,point(11+s));
      const elbow=add(side+'Forearm',shoulder,point(13+s,.012));
      const hand=add(side+'Hand',elbow,point(15+s,.025));
      const fingers=add(side+'Digits',hand,average(...[17+s,19+s,21+s].map(i=>point(i,.025))));
      segment(shoulder,elbow,.066);segment(elbow,hand,.048);
      if(seen(15+s))segment(hand,fingers,.048);
    }
    if(![23,25,27].every(i=>seen(i+s)))continue;
    const thigh=add(side+'Thigh',root,point(23+s));
    const shin=add(side+'Shin',thigh,point(25+s,.029));
    const foot=add(side+'Foot',shin,point(27+s,-.005));
    const toe=add(side+'Toe',foot,average(point(29+s,-.02),point(31+s,.06)));
    segment(thigh,shin,.10);segment(shin,foot,.065);segment(foot,toe,.071);
  }
  // Axis normal to each fitted limb in the image plane. An outstretched
  // arm therefore swings forward as readily as one photographed at rest.
  for(const {start,end} of sections){
    const p=bones[start],q=bones[end];
    p.axis=new T.Vector3(p.y-q.y,q.x-p.x,0);
    if(p.axis.lengthSq()<1e-8)p.axis.set(1,0,0);else p.axis.normalize();
  }
  return {bones,byName,kind:hasLegs?'person':'upper-body',height,sections};
}

function boneWeights(rig,x,y){
  if(rig.kind==='object'){
    const b=rig.bones;
    let end=1;while(end<3&&y>b[end].y)end++;
    const w=clamp((y-b[end-1].y)/(b[end].y-b[end-1].y),0,1);
    return {ids:[end-1,end,0,0],weights:[1-w,w,0,0],z:0};
  }
  const candidates=[];
  for(const {start,end,radius} of rig.sections){
    const p=rig.bones[start],q=rig.bones[end],dx=q.x-p.x,dy=q.y-p.y;
    const t=clamp(((x-p.x)*dx+(y-p.y)*dy)/(dx*dx+dy*dy+1e-8),0,1);
    const dist=Math.hypot(x-p.x-t*dx,y-p.y-t*dy);
    // Core affinity follows the actual measured limb centreline. The radius
    // allows thick clothes to follow a limb without borrowing a distant hand.
    const d=(.65*dist+.35*Math.max(0,dist-radius))/(.031*rig.height+.13*radius);
    candidates.push({id:start,score:d*d,z:p.z+t*(q.z-p.z)});
  }
  candidates.sort((a,b)=>a.score-b.score);
  const top=candidates.slice(0,4),ids=[],weights=[];
  let total=0,z=0;
  for(const c of top){const w=Math.exp(-.9*(c.score-top[0].score));ids.push(c.id);weights.push(w);total+=w;z+=w*c.z;}
  return {ids,weights:weights.map(w=>w/total),z:z/total};
}

export function createSubjectModel(token,{level='high'}={}){
  const image=decodeSubject(token);
  if(!image)return null;
  const grid=subjectGrid(image,level==='low'?31:72);
  const {w,h,W,H,rgba}=grid;
  const height=Math.min(1.8,2.15*image.height/image.width),width=height*image.width/image.height;
  const rig=fitRig(image,width,height),unit=(width/w+height/h)*.5;
  let maxAlpha=0;for(let i=3;i<rgba.length;i+=4)maxAlpha=Math.max(maxAlpha,rgba[i]);
  const cut=Math.max(1,Math.min(96,Math.round(maxAlpha*.5)));
  const depth=depthField(grid,cut);
  const rearSurface=createRearSurface(image,rig.kind!=='object');
  const corners=new Map(),edges=new Map(),positions=[],colors=[],skinIds=[],skinW=[],tris=[];
  function vertex(gx,gy,r,g,b,thickness){
    const x=((gx-.5)/w-.5)*width,y=(1-(gy-.5)/h)*height;
    const assignment=boneWeights(rig,x,y);
    const front=positions.length/3;
    function push(z,red,green,blue){
      positions.push(x,y,z+assignment.z);
      colors.push(colourTable[red],colourTable[green],colourTable[blue]);
      skinIds.push(...assignment.ids);skinW.push(...assignment.weights);
    }
    push(thickness,r,g,b);
    if(thickness>0){
      const rear=rearSurface((gx-.5)/w,(gy-.5)/h,[r,g,b]);
      push(-thickness*rear.rearDepth,...rear.rgb);
    }
    return {front,back:thickness>0?front+1:front};
  }
  function corner(i){
    if(!corners.has(i)){
      const pos=i*4,lum=(rgba[pos]*.21+rgba[pos+1]*.72+rgba[pos+2]*.07)/255;
      const depthScale=rig.kind==='object'?.87:.79;
      corners.set(i,vertex(i%W,Math.floor(i/W),rgba[pos],rgba[pos+1],rgba[pos+2],
        unit*depth[i]*depthScale*(.97+.06*lum)));
    }
    return corners.get(i);
  }
  function edge(a,b){
    const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*(W*H)+hi;
    if(!edges.has(key)){
      const alpha=rgba[a*4+3],other=rgba[b*4+3];
      const t=clamp((cut-.25-alpha)/(other-alpha),.001,.999),src=(alpha>other?a:b)*4;
      const ax=a%W,ay=Math.floor(a/W),bx=b%W,by=Math.floor(b/W);
      edges.set(key,vertex(ax+t*(bx-ax),ay+t*(by-ay),rgba[src],rgba[src+1],rgba[src+2],0));
    }
    return edges.get(key);
  }
  function triangle(a,b,c){
    const polygon=[];
    for(const [i,j] of [[a,b],[b,c],[c,a]]){
      const inside=rgba[i*4+3]>=cut;
      if(inside)polygon.push(corner(i));
      if(inside!==(rgba[j*4+3]>=cut))polygon.push(edge(i,j));
    }
    for(let i=1;i+1<polygon.length;i++){
      const p=polygon[0],q=polygon[i],r=polygon[i+1];
      tris.push(p.front,q.front,r.front,r.back,q.back,p.back);
    }
  }
  for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){
    const a=y*W+x,b=a+1,c=b+W,d=a+W;
    triangle(a,d,b);triangle(b,d,c);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIds,4));
  geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(skinW,4));
  geometry.setIndex(tris);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  // Normalize the silhouette so wide props and portraits both rest on the path.
  const bottom=geometry.boundingBox.min.y;
  geometry.translate(0,-bottom,0);
  for(const b of rig.bones)b.y-=bottom;
  if(rig.kind==='object'){
    const supports=[];
    for(let i=0;i<positions.length;i+=3){
      const x=positions[i],y=positions[i+1]-bottom;
      const bin=clamp(Math.floor((x/width+.5)*16),0,15);
      if(!supports[bin]||y<supports[bin].y)supports[bin]={x,y};
    }
    rig.supports=supports.filter(Boolean);
  }
  return {geometry,rig,width:geometry.boundingBox.max.x-geometry.boundingBox.min.x,
    height:geometry.boundingBox.max.y-geometry.boundingBox.min.y,kind:rig.kind};
}

function makeSkeleton(rig){
  const list=rig.bones.map(d=>{const b=new T.Bone();b.name=d.name;b.position.set(d.x,d.y,d.z);return b;});
  rig.bones.forEach((d,i)=>{
    if(d.parent<0)return;
    const parent=rig.bones[d.parent];
    list[i].position.sub(new T.Vector3(parent.x,parent.y,parent.z));
    list[d.parent].add(list[i]);
  });
  list[0].updateMatrixWorld(true);
  return new T.Skeleton(list);
}

// Transfer local bends from the original 19-joint asset to fitted rest
// bones. The source character faces -Z, while the uploaded subject faces +Z.
let sourceIndices,neutral;
const boneMotion=new WeakMap();
function poseRig(skeleton,rig,phase,gait,airPose=0){
  if(!sourceIndices){
    sourceIndices=new Map(joints.map((j,i)=>[j.name,i]));
    neutral=createRigPose();solveRig(neutral,0,0);
  }
  let motion=boneMotion.get(skeleton);
  if(!motion){motion=createRigPose();boneMotion.set(skeleton,motion);}
  solveRig(motion,gait?phase:0,gait,airPose);
  const {bones,byName}=rig,target=skeleton.bones,root=target[0];
  const scale=rig.height/1.8;
  const side=(motion.points[0].x-neutral.points[0].x)*scale;
  const lift=(motion.points[0].y-neutral.points[0].y)*scale;
  root.position.set(bones[0].x+side,bones[0].y+(rig.kind==='person'?lift:Math.abs(lift)*.35),bones[0].z);
  function bend(name){
    const i=sourceIndices.get(name),parent=joints[i].parent;
    return motion.angles[i]-neutral.angles[i]-(parent<0?0:motion.angles[parent]-neutral.angles[parent]);
  }
  function transfer(to,from,scale=1){
    const index=byName.get(to);
    if(index===undefined)return;
    const axis=bones[index].axis;
    if(axis)target[index].quaternion.setFromAxisAngle(axis,-bend(from)*scale);
    else target[index].rotation.x=-bend(from)*scale;
  }
  if(rig.kind==='object'){
    // A rigid prop retains its silhouette. The walking body's pelvis sway
    // drives gentle whole-object motion with progressively softer follow.
    const lean=(bend('leftHip')-bend('rightHip'))*.083+.10*airPose;
    root.rotation.z=lean;
    target[1].rotation.z=-lean*.72;
    target[2].rotation.z=-lean*.44;
    const c=Math.cos(lean),s=Math.sin(lean);
    let floor=Infinity;
    for(const p of rig.supports)floor=Math.min(floor,root.position.y+s*(p.x-bones[0].x)+c*(p.y-bones[0].y));
    if(floor<0)root.position.y-=floor;
    return;
  }
  const twist=(bend('rightHip')-bend('leftHip'))*.065;
  root.rotation.y=twist;
  transfer('spine','spine');
  transfer('neck','collar');
  for(const side of ['left','right']){
    transfer(side+'Thigh',side+'Hip');
    transfer(side+'Shin',side+'Knee');
    transfer(side+'Foot',side+'Ankle');
    transfer(side+'Arm',side+'Shoulder');
    transfer(side+'Forearm',side+'Elbow');
  }
}
const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.91,metalness:0,side:T.DoubleSide});
export function createSubjectSkin(model){
  const skeleton=makeSkeleton(model.rig),mesh=new T.SkinnedMesh(model.geometry,material);
  mesh.add(skeleton.bones[0]);mesh.bind(skeleton);
  mesh.frustumCulled=false;
  return {mesh,update(phase,gait,airPose=0){poseRig(skeleton,model.rig,phase,gait,airPose);},dispose(){skeleton.dispose();}};
}

const cpuRigs=new WeakMap();
export function deformSubject(model,phase,gait,out,airPose=0){
  const geometry=model.geometry,position=geometry.attributes.position.array;
  const result=out||new Float32Array(position.length);
  if(!gait&&!airPose){result.set(position);return result;}
  let skeleton=cpuRigs.get(model);
  if(!skeleton){skeleton=makeSkeleton(model.rig);cpuRigs.set(model,skeleton);}
  poseRig(skeleton,model.rig,phase,gait,airPose);
  skeleton.bones[0].updateMatrixWorld(true);skeleton.update();
  const matrices=skeleton.boneMatrices,weights=geometry.attributes.skinWeight.array,ids=geometry.attributes.skinIndex.array;
  for(let i=0,w=0;i<position.length;i+=3,w+=4){
    const x=position[i],y=position[i+1],z=position[i+2];
    let px=0,py=0,pz=0;
    for(let j=w;j<w+4;j++){
      const f=weights[j];if(!f)continue;
      const k=ids[j]*16;
      px+=f*(matrices[k]*x+matrices[k+4]*y+matrices[k+8]*z+matrices[k+12]);
      py+=f*(matrices[k+1]*x+matrices[k+5]*y+matrices[k+9]*z+matrices[k+13]);
      pz+=f*(matrices[k+2]*x+matrices[k+6]*y+matrices[k+10]*z+matrices[k+14]);
    }
    result[i]=px;result[i+1]=py;result[i+2]=pz;
  }
  return result;
}
