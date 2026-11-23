// All image data and learned inference stay on the device. Only the downstream
// reduced avatar representation is shared when the player enters the plaza.
let worker=null,seq=0,idleTimer=null;
const pending=new Map();
function stopWorker(message){
  clearTimeout(idleTimer);
  worker?.terminate();
  worker=null;
  for(const req of pending.values()){clearTimeout(req.timeout);req.reject(Error(message));}
  pending.clear();
}
function getWorker(){
  if(worker)return worker;
  worker=new Worker(new URL('./subject-worker.js',import.meta.url));
  worker.onerror=()=>stopWorker('사진 분석을 시작하지 못했어요. 다시 시도해 주세요.');
  worker.onmessage=({data})=>{
    const req=pending.get(data.id);
    if(!req)return;
    if(data.progress){req.progress(data.progress);return;}
    pending.delete(data.id);clearTimeout(req.timeout);
    if(data.error)req.reject(Error(data.error));
    else req.resolve(data);
    if(!pending.size)idleTimer=setTimeout(()=>stopWorker(''),90000);
  };
  return worker;
}
function runInference(image,hint,alpha,progress){
  clearTimeout(idleTimer);
  const target=getWorker(),id=++seq;
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>stopWorker('사진 분석이 오래 걸리고 있어요. 더 작은 사진으로 다시 시도해 주세요.'),135000);
    pending.set(id,{resolve,reject,progress,timeout});
    target.postMessage({id,image:{width:image.width,height:image.height,data:image.data},hint,alpha});
  });
}
const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
export async function extractSubject(file,hint=null,progress=()=>{}){
  if(!(file instanceof Blob)||!file.size)throw Error('사진을 선택해 주세요.');
  if(file.size>32*1024*1024)throw Error('32MB 이하의 사진을 선택해 주세요.');
  if(file.type==='image/svg+xml')throw Error('JPG나 PNG 같은 사진 파일을 선택해 주세요.');
  if(hint&&(!Number.isFinite(hint.x)||!Number.isFinite(hint.y)||hint.x<0||hint.x>1||hint.y<0||hint.y>1))throw Error('사진 안에서 대상을 선택해 주세요.');
  progress('사진을 열고 있어요…');
  const url=URL.createObjectURL(file),image=new Image();
  try{
    await new Promise((resolve,reject)=>{
      image.onload=resolve;
      image.onerror=()=>reject(Error('사진을 열 수 없어요. JPG, PNG 또는 WebP 파일을 선택해 주세요.'));
      image.src=url;
    });
    const sourceWidth=image.naturalWidth,sourceHeight=image.naturalHeight;
    if(!sourceWidth||!sourceHeight)throw Error('사진의 크기를 읽지 못했어요.');
    const scale=Math.min(1,560/Math.max(sourceWidth,sourceHeight)),w=Math.max(1,Math.round(sourceWidth*scale)),h=Math.max(1,Math.round(sourceHeight*scale));
    const surface=canvas(w,h),ctx=surface.getContext('2d',{willReadFrequently:true});
    ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,w,h);
    const input=ctx.getImageData(0,0,w,h);
    let transparent=0;
    for(let i=3;i<input.data.length;i+=4)if(input.data[i]<16)transparent++;
    const alpha=transparent>w*h*.025;
    const result=await runInference(input,hint,alpha,progress);
    let left=w,top=h,right=-1,bottom=-1;
    for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i++){
      const a=Math.min(input.data[i*4+3],result.mask[i]);
      input.data[i*4+3]=a<10?0:a;
      if(a<=14)continue;
      left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
    }
    if(right<=left||bottom<=top)throw Error('대상을 찾지 못했어요. 사진에서 대상을 한 번 눌러 주세요.');
    left=Math.max(0,left-1);top=Math.max(0,top-1);right=Math.min(w-1,right+1);bottom=Math.min(h-1,bottom+1);
    const cw=right-left+1,ch=bottom-top+1;
    ctx.putImageData(input,0,0);
    const cutout=canvas(cw,ch);
    cutout.getContext('2d').drawImage(surface,left,top,cw,ch,0,0,cw,ch);
    const landmarks=result.landmarks?.map(l=>({...l,x:(l.x*w-left)/cw,y:(l.y*h-top)/ch,z:l.z*w/cw}))||null;
    return {canvas:cutout,kind:result.kind,landmarks,sourceWidth,sourceHeight,
      bounds:{x:left/w*sourceWidth,y:top/h*sourceHeight,width:cw/w*sourceWidth,height:ch/h*sourceHeight}};
  }finally{URL.revokeObjectURL(url);}
}
