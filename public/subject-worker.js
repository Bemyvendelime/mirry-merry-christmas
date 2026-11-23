// CPU-only inference. A dedicated worker keeps the entry form responsive.
const assets=new URL('./vendor/subject-models/',self.location.href);
const models=new Map();
let runtime=null;

function progress(id,text){self.postMessage({id,progress:text});}
async function loadModel(name) {
  if(models.has(name))return models.get(name);
  if(!runtime) {
    const simd=WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));
    const stem='tflite_web_api_cc'+(simd?'_simd':'');
    importScripts(new URL(stem+'.js',assets).href);
    runtime=await tflite_web_api_ModuleFactory({locateFile:path=>new URL(path,assets).href});
  }
  const response=await fetch(new URL(name+'.tflite',assets));
  if(!response.ok)throw Error('모델을 내려받지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
  const bytes=new Uint8Array(await response.arrayBuffer());
  const ptr=runtime._malloc(bytes.length);
  runtime.HEAPU8.set(bytes,ptr);
  const status=runtime.TFLiteWebModelRunner.CreateFromBufferAndOptions(ptr,bytes.length,{
    numThreads:1,enableProfiling:false,maxProfilingBufferEntries:0
  });
  if(!status.ok()){
    runtime._free(ptr);status.delete();
    throw Error('사진 분석 모델을 시작하지 못했어요.');
  }
  const runner=status.value();status.delete();
  const inputs=runner.GetInputs(),outputs=runner.GetOutputs();
  const model={runner,input:inputs.get(0),outputs:Array.from({length:outputs.size()},(_,i)=>outputs.get(i))};
  inputs.delete();outputs.delete();models.set(name,model);return model;
}

const sigmoid=x=>1/(1+Math.exp(-x));
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));

// Local coordinates are normalized with (0,0) in the centre of this ROI.
// Keep the full calculation in source pixels to handle vertical and oblique poses.
function sampleInput(image,roi,size,channels,normalized,prior,input){
  const {width:w,height:h,data}=image;
  const cs=Math.cos(roi.angle),sn=Math.sin(roi.angle);
  for(let y=0,i=0;y<size;y++){
    const ly=((y+.5)/size-.5)*roi.h;
    for(let x=0;x<size;x++,i+=channels){
      const lx=((x+.5)/size-.5)*roi.w;
      const sx=roi.x+cs*lx-sn*ly,sy=roi.y+sn*lx+cs*ly;
      const valid=sx>=0&&sx<w&&sy>=0&&sy<h;
      const fx=clamp(sx-.5,0,w-1),fy=clamp(sy-.5,0,h-1);
      const x0=Math.floor(fx),y0=Math.floor(fy),dx=fx-x0,dy=fy-y0;
      const a=(x0+y0*w)*4,b=(Math.min(w-1,x0+1)+y0*w)*4,c=(x0+Math.min(h-1,y0+1)*w)*4,d=(Math.min(w-1,x0+1)+Math.min(h-1,y0+1)*w)*4;
      for(let k=0;k<3;k++){
        let val=valid?((data[a+k]*(1-dx)+data[b+k]*dx)*(1-dy)+(data[c+k]*(1-dx)+data[d+k]*dx)*dy)/255:0;
        input[i+k]=normalized?val*2-1:val;
      }
      if(channels===4)input[i+3]=(x-prior.x)**2+(y-prior.y)**2<25?1:0;
    }
  }
}
const anchors=[];
for(const [grid,repeats] of [[28,2],[14,2],[7,6]]){
  for(let y=0;y<grid;y++)for(let x=0;x<grid;x++)for(let n=0;n<repeats;n++)anchors.push([(x+.5)/grid,(y+.5)/grid]);
}
function pickPoses(image,score,boxes){
  const {width:w,height:h}=image,size=Math.max(w,h),hits=[];
  for(let i=0;i<score.length;i++){
    const confidence=sigmoid(score[i]);if(confidence<.49)continue;
    const ax=anchors[i][0],ay=anchors[i][1],b=i*12;
    const x=w/2+(ax+boxes[b+4]/224-.5)*size,y=h/2+(ay+boxes[b+5]/224-.5)*size;
    const dx=(boxes[b+6]-boxes[b+4])*size/224,dy=(boxes[b+7]-boxes[b+5])*size/224;
    const diameter=Math.hypot(dx,dy)*2.5;
    if(diameter<15)continue;
    hits.push({x,y,w:diameter,h:diameter,angle:Math.atan2(dx,-dy),confidence});
  }
  hits.sort((a,b)=>b.confidence-a.confidence);
  const keep=[];
  for(const hit of hits){
    if(keep.every(other=>Math.hypot(other.x-hit.x,other.y-hit.y)>.23*Math.min(hit.w,other.w)))keep.push(hit);
    if(keep.length===3)break;
  }
  return keep;
}
function projected(roi,x,y){
  const lx=(x-.5)*roi.w,ly=(y-.5)*roi.h,cs=Math.cos(roi.angle),sn=Math.sin(roi.angle);
  return [roi.x+cs*lx-sn*ly,roi.y+sn*lx+cs*ly];
}
function unpackMask(image,values,roi,dim,logits) {
  const mask=new Uint8Array(image.width*image.height);
  const cs=Math.cos(roi.angle),sn=Math.sin(roi.angle);
  for(let y=0,i=0;y<image.height;y++)for(let x=0;x<image.width;x++,i++){
    const dx=x+.5-roi.x,dy=y+.5-roi.y,fx=((dx*cs+dy*sn)/roi.w+.5)*dim-.5,fy=((-dx*sn+dy*cs)/roi.h+.5)*dim-.5;
    if(fx<0||fy<0||fx>dim-1||fy>dim-1)continue;
    const x0=Math.floor(fx),y0=Math.floor(fy),xx=fx-x0,yy=fy-y0;
    const a=x0+y0*dim,b=Math.min(dim-1,x0+1)+y0*dim,c=x0+Math.min(dim-1,y0+1)*dim,d=Math.min(dim-1,x0+1)+Math.min(dim-1,y0+1)*dim;
    const v=(values[a]*(1-xx)+values[b]*xx)*(1-yy)+(values[c]*(1-xx)+values[d]*xx)*yy;
    const probability=logits?sigmoid(v):v;
    mask[i]=Math.round(clamp((probability-.26)/.48,0,1)*255);
  }
  return mask;
}
async function humanSubject(image,hint) {
  const {width:w,height:h}=image, size=Math.max(w,h);
  const detector=await loadModel('pose_detector');
  sampleInput(image,{x:w/2,y:h/2,w:size,h:size,angle:0},224,3,true,null,detector.input.data());
  detector.runner.Infer();
  const poses=pickPoses(image,detector.outputs[1].data(),detector.outputs[0].data());
  if(!poses.length)return null;
  const landmarker=await loadModel('pose_landmarks_detector');
  for(const roi of poses){
    sampleInput(image,roi,256,3,false,null,landmarker.input.data());
    landmarker.runner.Infer();
    if(landmarker.outputs[1].data()[0]<.57)continue;
    const coords=landmarker.outputs[0].data();
    const landmarks=Array.from({length:33},(_,i)=>{
      const k=i*5,[px,py]=projected(roi,coords[k]/256,coords[k+1]/256);
      return {x:px/w,y:py/h,z:coords[k+2]*roi.w/(256*w),visibility:sigmoid(coords[k+3]),presence:sigmoid(coords[k+4])};
    });
    const mask=unpackMask(image,landmarker.outputs[2].data(),roi,256,true);
    if(hint&&mask[clamp(Math.floor(hint.y*h),0,h-1)*w+clamp(Math.floor(hint.x*w),0,w-1)]<96)continue;
    if(mask.reduce((n,a)=>n+Number(a>127),0)<w*h*.012)continue;
    return {mask,landmarks,kind:'human'};
  }
  return null;
}
function candidatePoints(image){
  const {data,width:w,height:h}=image, out=[];
  // Estimate the central subject using its colour distance from the border,
  // with a compact centre prior. The learned mask, not this prior, defines the outline.
  const border=[0,0,0];let count=0;
  for(let n=0;n<32;n++)for(const [x,y] of [[n/32,.02],[n/32,.98],[.02,n/32],[.98,n/32]]){
    const i=(Math.floor(x*w)+Math.floor(y*h)*w)*4;
    for(let k=0;k<3;k++)border[k]+=data[i+k];count++;
  }
  let best=null;
  for(let gy=2;gy<=8;gy++)for(let gx=2;gx<=8;gx++){
    const x=gx/10,y=gy/10,i=(Math.floor(x*w)+Math.floor(y*h)*w)*4;
    const dist=Math.hypot(data[i]-border[0]/count,data[i+1]-border[1]/count,data[i+2]-border[2]/count);
    const score=dist*.6+(1-Math.hypot(x-.5,y-.5))*145;
    if(!best||score>best.score)best={x,y,score};
  }
  out.push(best,{x:.5,y:.5},{x:.5,y:.37});
  return out;
}
function keepSelectedIsland(mask,w,h,point){
  const tx=clamp(Math.floor(point.x*w),0,w-1),ty=clamp(Math.floor(point.y*h),0,h-1);
  // The network may also light up other instances. Retain the component under
  // the chosen point and its antialiased fringe, so a different object is never attached.
  let seed=-1,nearest=Infinity;
  const radius=Math.max(5,Math.round(Math.min(w,h)*.08));
  for(let y=Math.max(0,ty-radius);y<=Math.min(h-1,ty+radius);y++){
    for(let x=Math.max(0,tx-radius);x<=Math.min(w-1,tx+radius);x++){
      const k=y*w+x,d=(x-tx)**2+(y-ty)**2;
      if(mask[k]>=92&&d<nearest){nearest=d;seed=k;}
    }
  }
  const out=new Uint8Array(mask.length);
  if(seed<0)return out;
  const queue=new Int32Array(mask.length);
  let start=0,end=1;queue[0]=seed;out[seed]=mask[seed];
  while(start<end){
    const i=queue[start++],x=i%w,y=(i/w)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy,j=i+dy*w+dx;
      if(xx<0||xx>=w||yy<0||yy>=h||out[j]||mask[j]<18)continue;
      out[j]=mask[j];queue[end++]=j;
    }
  }
  return out;
}
async function objectSubject(image,hint){
  const {width:w,height:h}=image,roi={x:w/2,y:h/2,w,h,angle:0};
  const model=await loadModel('magic_touch');
  for(const point of hint?[hint]:candidatePoints(image)) {
    sampleInput(image,roi,512,4,false,{x:point.x*512,y:point.y*512},model.input.data());
    model.runner.Infer();
    const mask=keepSelectedIsland(unpackMask(image,model.outputs[0].data(),roi,512,false),w,h,point);
    const n=mask.reduce((a,v)=>a+Number(v>125),0);
    if(n>Math.max(7,w*h*.0008)&&n<w*h*.97)return {mask,landmarks:null,kind:'object'};
  }
  throw Error('대상을 찾기 어려워요. 사진에서 붙일 사람이나 물체 안쪽을 눌러 주세요.');
}

async function extract({id,image,hint,alpha}) {
  progress(id,'사진에서 사람의 관절을 찾고 있어요…');
  let result;
  try{result=await humanSubject(image,hint);}
  catch(error){if(!alpha)console.warn('Pose inference unavailable:',error.message);}
  if(!result&&alpha){
    const mask=new Uint8Array(image.width*image.height);
    for(let i=0;i<mask.length;i++)mask[i]=image.data[i*4+3];
    if(hint) {
      // On a transparent sprite sheet isolate the connected object that was tapped.
      const w=image.width,h=image.height,k=clamp(Math.floor(hint.x*w),0,w-1)+w*clamp(Math.floor(hint.y*h),0,h-1);
      if(mask[k]<24)throw Error('붙일 대상의 안쪽을 눌러 주세요.');
      const chosen=new Uint8Array(mask.length),queue=new Int32Array(mask.length);let start=0,end=1;
      queue[0]=k;chosen[k]=mask[k];
      while(start<end){
        const i=queue[start++],x=i%w,y=(i/w)|0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          if(x+dx<0||x+dx>=w||y+dy<0||y+dy>=h)continue;
          const j=i+dy*w+dx;
          if(!chosen[j]&&mask[j]>=8){chosen[j]=mask[j];queue[end++]=j;}
        }
      }
      result={mask:chosen,kind:'alpha',landmarks:null};
    }else result={mask,kind:'alpha',landmarks:null};
  }
  if(!result){progress(id,'붙일 물체와 배경을 분리하고 있어요…');result=await objectSubject(image,hint);}
  if(result.kind==='human'&&alpha){
    for(let i=0;i<result.mask.length;i++)result.mask[i]=Math.min(result.mask[i],image.data[i*4+3]);
  }
  self.postMessage({id,...result},[result.mask.buffer]);
}
let work=Promise.resolve();
self.onmessage=e=>{
  work=work.then(()=>extract(e.data)).catch(error=>self.postMessage({id:e.data.id,error:error.message||'사진 분석에 실패했어요.'}));
};
