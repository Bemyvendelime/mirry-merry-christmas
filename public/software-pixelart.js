// Software path for devices that cannot create WebGL2. Wrap the fir silhouette
// in rings of coloured surface samples and project each Gaussian in world space.
const colours = [
  0x171d31,0x25314a,0x344363,0x465678,0x5f7296,0x889bc0,0xa8bdd8,0xcad9e8,0xeff1ed,
  0x213735,0x32483f,0x466051,0x65816a,0x899d85,0x493c43,0x645052,0x82625b,0xa57965,
  0x723e4b,0xa15452,0xc67865,0xcc955f,0xe3b77d,0xf6d6a0,0xffebc0,0xfff7dc,
  0x42394c,0x60516c,0x857191,0xaa91a6,0xb2afb5,0xd6ccd3
];
const palette = colours.map(c=>[c>>16,c>>8&255,c&255]);
const lut = new Uint8Array(32768);
for(let r=0;r<32;r++)for(let g=0;g<32;g++)for(let b=0;b<32;b++){
  let best=Infinity;
  for(const [i,p] of palette.entries()){
    const d=.30*(r*8+4-p[0])**2+.52*(g*8+4-p[1])**2+.18*(b*8+4-p[2])**2;
    if(d<best){best=d;lut[(r<<10)|(g<<5)|b]=i;}
  }
}
const shade=(r,g,b)=>lut[(r>>3)<<10|(g>>3)<<5|(b>>3)];
const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
// Cache the Bayer offset and clamped 5-bit value for each channel. The order
// and colours match the original dither, including partially transparent pixels.
const quantized = new Uint8Array(16*256);
for(let phase=0;phase<16;phase++)for(let value=0;value<256;value++){
  quantized[phase*256+value]=Math.max(0,Math.min(255,value+(bayer[phase]-7.5)*.91))>>3;
}
const littleEndian=new Uint8Array(new Uint32Array([1]).buffer)[0]===1;
const alphaMask=littleEndian?0xff000000:0xff;
const packedColours=Uint32Array.from(lut,index=>{
  const [r,g,b]=palette[index];
  return littleEndian?r|(g<<8)|(b<<16):(r<<24)|(g<<16)|(b<<8);
});
export function paintPixelPalette(ctx,w,h){
  const im=ctx.getImageData(0,0,w,h),bytes=im.data;
  const words=new Uint32Array(bytes.buffer,bytes.byteOffset,w*h);
  for(let y=0,pixel=0;y<h;y++){
    const row=(y&3)<<10;
    for(let x=0;x<w;x++,pixel++){
      const phase=row+((x&3)<<8),i=pixel*4;
      const bin=(quantized[phase+bytes[i]]<<10)|(quantized[phase+bytes[i+1]]<<5)|quantized[phase+bytes[i+2]];
      words[pixel]=(words[pixel]&alphaMask)|packedColours[bin];
    }
  }
  ctx.putImageData(im,0,0);
}

const sampled=new WeakMap();
function firSamples(image){
  if(sampled.has(image))return sampled.get(image);
  const c=document.createElement('canvas');c.width=160;c.height=320;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0,160,320);
  const bytes=g.getImageData(0,0,160,320).data,points=[];
  for(let y=19;y<320;y+=2){
    let lo=0,hi=159;
    while(lo<hi&&bytes[(y*160+lo)*4+3]<60)lo++;
    while(hi>lo&&bytes[(y*160+hi)*4+3]<60)hi--;
    if(hi<=lo)continue;
    const radius=(hi-lo)*.05,count=Math.max(6,Math.ceil(radius*10));
    for(let n=0;n<count;n++){
      const a=(n/count+y*.381966)*2*Math.PI;
      const x=Math.round((hi+lo)*.5+Math.sin(a)*(hi-lo)*.48);
      const i=(y*160+x)*4;
      if(bytes[i+3]<60)continue;
      const jitter=.91+.09*Math.sin(y*.83+n*2.31);
      points.push([Math.sin(a)*radius*jitter,(1-y/320)*36,Math.cos(a)*radius*jitter,shade(bytes[i],bytes[i+1],bytes[i+2])]);
    }
  }
  const n=points.length;
  const tree={x:new Float32Array(n),y:new Float32Array(n),z:new Float32Array(n),hue:new Uint8Array(n)};
  for(let i=0;i<n;i++)[tree.x[i],tree.y[i],tree.z[i],tree.hue[i]]=points[i];
  sampled.set(image,tree);
  return tree;
}

// The original 24-pixel radial stamp, sampled by squared distance to avoid a
// square root for every covered pixel. Composition below uses premultiplied RGB.
const kernel=new Float32Array(1024);
const stops=[[0,1],[.32,.97],[.59,.68],[.82,.23],[1,0]];
for(let i=0,segment=1;i<kernel.length;i++){
  const r=Math.sqrt(i/(kernel.length-1));
  while(r>stops[segment][0])segment++;
  const [a,start]=stops[segment-1], [b,end]=stops[segment];
  kernel[i]=start+(end-start)*(r-a)/(b-a);
}
const unpremultiply=new Uint8ClampedArray(65536);
for(let a=1;a<256;a++)for(let c=0;c<=a;c++)unpremultiply[(a<<8)|c]=255*c/a;
const overlays=new WeakMap();
function createOverlay(tree,w,h){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d'),n=tree.x.length;
  return {tree,canvas,ctx,im:ctx.createImageData(w,h),matrix:new Float64Array(16),rect:null,
    sx:new Float32Array(n),sy:new Float32Array(n),radius:new Float32Array(n),
    bucket:new Uint8Array(n),counts:new Uint32Array(24),order:new Uint32Array(n),visible:new Uint32Array(n),
    opacity:-1,falloff:new Uint8Array(kernel.length)};
}

function rasterize(overlay,camera,w,h,focal,focalX){
  const {tree,sx,sy,radius,bucket,counts,order,visible,im,falloff}=overlay;
  const m=camera.matrixWorldInverse.elements,center=-m[14];
  let xmin=w,ymin=h,xmax=0,ymax=0,count=0;
  counts.fill(0);
  // Resolve every point in full perspective, even when the trunk crosses the
  // near plane at steep pitch. Reuse buffers for projection and depth sorting.
  for(let i=0;i<tree.x.length;i++){
    const x=tree.x[i],y=tree.y[i],z=tree.z[i];
    const depth=-(m[2]*x+m[6]*y+m[10]*z+m[14]);
    if(depth<.25)continue;
    const px=w*.5+(m[0]*x+m[4]*y+m[8]*z+m[12])*focalX/depth;
    const py=h*.5-(m[1]*x+m[5]*y+m[9]*z+m[13])*focal/depth;
    const rx=Math.max(1,Math.min(22,focal*.31/depth)),ry=rx*.66;
    if(px+rx<0||px-rx>=w||py+ry<0||py-ry>=h)continue;
    sx[i]=px;sy[i]=py;radius[i]=rx;
    xmin=Math.min(xmin,px-rx);xmax=Math.max(xmax,px+rx);
    ymin=Math.min(ymin,py-ry);ymax=Math.max(ymax,py+ry);
    const depthBin=Math.max(0,Math.min(23,Math.floor((depth-center+36)*.5)));
    bucket[i]=depthBin;counts[depthBin]++;visible[count++]=i;
  }
  if(!count){overlay.rect=null;return;}
  const x0=Math.max(0,Math.floor(xmin)),y0=Math.max(0,Math.floor(ymin));
  const x1=Math.min(w,Math.ceil(xmax)),y1=Math.min(h,Math.ceil(ymax));
  const data=im.data;
  for(let y=y0;y<y1;y++)data.fill(0,(y*w+x0)*4,(y*w+x1)*4);
  let start=0;
  for(let b=counts.length-1;b>=0;b--){const size=counts[b];counts[b]=start;start+=size;}
  for(let j=0;j<count;j++){
    const i=visible[j];order[counts[bucket[i]]++]=i;
  }
  for(let k=0;k<count;k++){
    const i=order[k],cx=sx[i],cy=sy[i],rx=radius[i],ry=rx*.66;
    const left=Math.max(0,Math.ceil(cx-rx-.5)),right=Math.min(w-1,Math.floor(cx+rx-.5));
    const top=Math.max(0,Math.ceil(cy-ry-.5)),bottom=Math.min(h-1,Math.floor(cy+ry-.5));
    const kx=1023/(rx*rx),ky=1023/(ry*ry),color=palette[tree.hue[i]];
    for(let y=top;y<=bottom;y++){
      const dy=y+.5-cy,vertical=dy*dy*ky;
      for(let x=left,p=(w*y+left)*4;x<=right;x++,p+=4){
        const dx=x+.5-cx,dist=vertical+dx*dx*kx;
        if(dist>=1023)continue;
        const alpha=falloff[dist|0],keep=255-alpha;
        data[p]=(alpha*color[0]+keep*data[p]+127)/255|0;
        data[p+1]=(alpha*color[1]+keep*data[p+1]+127)/255|0;
        data[p+2]=(alpha*color[2]+keep*data[p+2]+127)/255|0;
        data[p+3]=alpha+((keep*data[p+3]+127)/255|0);
      }
    }
  }
  for(let y=y0;y<y1;y++)for(let p=(y*w+x0)*4,end=(y*w+x1)*4;p<end;p+=4){
    const a=data[p+3];if(a===0||a===255)continue;
    const base=a<<8;
    data[p]=unpremultiply[base|data[p]];data[p+1]=unpremultiply[base|data[p+1]];data[p+2]=unpremultiply[base|data[p+2]];
  }
  overlay.ctx.putImageData(im,0,0,x0,y0,x1-x0,y1-y0);
  overlay.rect=[x0,y0,x1-x0,y1-y0];
}

export function paintFirSplats(ctx,texture,camera,_project,w,h,focal){
  const tree=firSamples(texture),matrix=camera.matrixWorldInverse.elements;
  let overlay=overlays.get(ctx);
  if(!overlay||overlay.tree!==tree||overlay.canvas.width!==w||overlay.canvas.height!==h){
    overlay=createOverlay(tree,w,h);overlays.set(ctx,overlay);
  }
  const alpha=ctx.globalAlpha,focalX=camera.projectionMatrix.elements[0]*w*.5;
  let dirty=overlay.opacity!==alpha||overlay.focal!==focal||overlay.focalX!==focalX;
  for(let i=0;!dirty&&i<16;i++)dirty=overlay.matrix[i]!==matrix[i];
  if(dirty){
    if(overlay.opacity!==alpha){
      overlay.opacity=alpha;
      for(let i=0;i<kernel.length;i++)overlay.falloff[i]=Math.round(255*alpha*kernel[i]);
    }
    overlay.matrix.set(matrix);overlay.focal=focal;overlay.focalX=focalX;
    rasterize(overlay,camera,w,h,focal,focalX);
  }
  if(!overlay.rect)return;
  const [x,y,width,height]=overlay.rect;
  // Per-splat opacity is already in the cached pixels. Draw through the
  // caller's current clip, which changes when an avatar or building occludes it.
  ctx.globalAlpha=1;
  ctx.drawImage(overlay.canvas,x,y,width,height,x,y,width,height);
  ctx.globalAlpha=alpha;
}
