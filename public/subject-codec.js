// Share a cropped subject, its silhouette, and optional pose measurements.
// Pixel colours are RGB565, sparse over a one-bit coverage mask.
const maxSide=128;
const poseBytes=33*5;
const maxBytes=3+poseBytes+maxSide*maxSide*2+maxSide*maxSide/8;
function parse(token){
  if(typeof token!=='string'||!token.startsWith('v2.')||token.length>3+4*Math.ceil(maxBytes/3))return null;
  const encoded=token.slice(3);
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)||encoded.length%4)return null;
  let packed;
  try{packed=atob(encoded);}catch{return null;}
  const w=packed.charCodeAt(0),h=packed.charCodeAt(1),hasPose=packed.charCodeAt(2);
  if(!w||!h||w>maxSide||h>maxSide||(hasPose!==0&&hasPose!==1))return null;
  const start=3+hasPose*poseBytes;
  const rgb=start+Math.ceil(w*h/8);
  if(rgb>packed.length)return null;
  let count=0;
  for(let i=0;i<w*h;i++)count+=(packed.charCodeAt(start+(i>>3))>>(i%8))&1;
  if(!count||rgb+count*2!==packed.length)return null;
  return {w,h,hasPose,start,rgb,packed};
}
export function validSubject(token){return !!parse(token);}
export function encodeSubject({canvas,landmarks}){
  const scale=maxSide/Math.max(canvas.width,canvas.height);
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(canvas.width*scale));c.height=Math.max(1,Math.round(canvas.height*scale));
  const ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.imageSmoothingQuality='high';ctx.drawImage(canvas,0,0,c.width,c.height);
  const pixels=ctx.getImageData(0,0,c.width,c.height).data;
  const hasPose=landmarks?.length===33?1:0;
  const start=3+hasPose*poseBytes,maskSize=Math.ceil(c.width*c.height/8);
  const out=new Uint8Array(start+maskSize+c.width*c.height*2);
  out.set([c.width,c.height,hasPose]);
  if(hasPose){
    const view=new DataView(out.buffer);
    for(let i=0;i<33;i++){
      const point=landmarks[i],at=3+i*5;
      for(const [off,key] of [[0,'x'],[2,'y']]){
        const coord=Math.max(-4,Math.min(4,point[key]));
        view.setInt16(at+off,Math.round(coord*4096),true);
      }
      out[at+4]=Math.round(Math.max(0,Math.min(1,point.visibility??0))*255);
    }
  }
  let end=start+maskSize;
  for(let i=0;i<c.width*c.height;i++){
    const p=i*4;
    if(pixels[p+3]<110)continue;
    out[start+(i>>3)]|=1<<(i%8);
    const color=(pixels[p]>>3)<<11 | (pixels[p+1]>>2)<<5 | pixels[p+2]>>3;
    out[end++]=color>>8;out[end++]=color&255;
  }
  if(end===start+maskSize)throw Error('선택한 피사체가 너무 작아요. 원본에서 다시 선택해 주세요.');
  let binary='';
  for(let i=0;i<end;i+=8192)binary+=String.fromCharCode(...out.subarray(i,Math.min(i+8192,end)));
  return 'v2.'+btoa(binary);
}
export function decodeSubject(token){
  const parsed=parse(token);
  if(!parsed)return null;
  const {w,h,hasPose,start,rgb,packed}=parsed;
  let offset=rgb,landmarks=null;
  if(hasPose){
    landmarks=[];
    const coord=i=>((packed.charCodeAt(i)|(packed.charCodeAt(i+1)<<8))<<16>>16)/4096;
    for(let i=0;i<33;i++){const at=3+5*i;landmarks.push({x:coord(at),y:coord(at+2),visibility:packed.charCodeAt(at+4)/255});}
  }
  const rgba=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<w*h;i++){
    if(!(packed.charCodeAt(start+(i>>3))&(1<<(i%8))))continue;
    const col=packed.charCodeAt(offset++)*256+packed.charCodeAt(offset++);
    rgba.set([(col>>11)*255/31,((col>>5)&63)*255/63,(col&31)*255/31,255],i*4);
  }
  return {width:w,height:h,rgba,landmarks};
}

// Downsample RGB565 colour and silhouette in the original coordinate space.
// Pose landmarks remain valid because the crop and aspect ratio stay fixed.
export function previewSubject(token){
  const src=parse(token);
  if(!src||Math.max(src.w,src.h)<=36)return token;
  const ratio=36/Math.max(src.w,src.h),w=Math.max(1,Math.round(src.w*ratio)),h=Math.max(1,Math.round(src.h*ratio));
  const n=w*h,counts=new Uint16Array(n),occupied=new Uint16Array(n),sums=new Uint32Array(n*3);
  let read=src.rgb;
  for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){
    const i=y*src.w+x,j=Math.floor(y*h/src.h)*w+Math.floor(x*w/src.w);
    counts[j]++;
    if(!((src.packed.charCodeAt(src.start+(i>>3))>>(i%8))&1))continue;
    const rgb=src.packed.charCodeAt(read++)*256+src.packed.charCodeAt(read++);
    occupied[j]++;sums[3*j]+=rgb>>11;sums[3*j+1]+=(rgb>>5)&63;sums[3*j+2]+=rgb&31;
  }
  const start=src.start,mask=Math.ceil(n/8),bytes=new Uint8Array(start+mask+n*2);
  bytes.set([w,h,src.hasPose]);for(let i=3;i<start;i++)bytes[i]=src.packed.charCodeAt(i);
  let write=start+mask;
  for(let i=0;i<n;i++){
    const used=occupied[i];if(!used||used*3<counts[i])continue;
    bytes[start+(i>>3)]|=1<<(i%8);
    const rgb=Math.round(sums[i*3]/used)<<11|Math.round(sums[i*3+1]/used)<<5|Math.round(sums[i*3+2]/used);
    bytes[write++]=rgb>>8;bytes[write++]=rgb&255;
  }
  return write===start+mask?token:'v2.'+btoa(String.fromCharCode(...bytes.subarray(0,write)));
}
