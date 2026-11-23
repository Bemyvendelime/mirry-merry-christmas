import {BufferGeometry, BufferAttribute, Color} from './vendor/three.js';
import {processImage, buildMesh} from './vendor/lithophane-studio/mesh.js';

const cols = 30, rows = 36;
const pixels = cols * rows, width = .54, height = .65;
const tokenPattern = /^v1\.[A-Za-z0-9+/]{2880}$/;

function makeCanvas(w, h) {
  return Object.assign(document.createElement('canvas'), {width:w, height:h});
}

// Wire format v1: cropped RGB565 samples, row major, two bytes per sample.
// The same payload recreates the mesh on every client, without shipping the photo file.
export async function photoToModel(file) {
  if (!(file instanceof Blob) || !file.size) throw Error('사진 파일을 선택해 주세요.');
  if (file.size > 32 * 1024 * 1024) throw Error('32MB 이하의 사진을 선택해 주세요.');
  if (file.type === 'image/svg+xml') throw Error('JPG나 PNG 같은 사진 파일을 선택해 주세요.');
  const image = new Image();
  const url = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(Error('사진을 열 수 없어요. JPG, PNG 또는 WebP 파일을 선택해 주세요.'));
      image.src = url;
    });
    const iw = image.naturalWidth, ih = image.naturalHeight;
    if (!iw || !ih) throw Error('사진 크기를 읽을 수 없어요.');
    const ratio = Math.min(iw / cols, ih / rows);
    const cropW = cols * ratio, cropH = rows * ratio;
    let cx = iw * .5, cy = ih * .45;
    // Use a locally available detector when the browser ships one. Other
    // browsers apply a deterministic, slightly high portrait crop.
    if (typeof FaceDetector === 'function') {
      try {
        const faces = await new FaceDetector({fastMode:true,maxDetectedFaces:1}).detect(image);
        const box = faces[0]?.boundingBox;
        if (box) { cx = box.x + box.width / 2; cy = box.y + box.height / 2; }
      } catch {}
    }
    const sx = Math.min(iw-cropW, Math.max(0,cx-cropW/2));
    const sy = Math.min(ih-cropH, Math.max(0,cy-cropH/2));
    const canvas = makeCanvas(cols, rows), ctx = canvas.getContext('2d', {willReadFrequently:true});
    ctx.fillStyle = '#dbd2c2';
    ctx.fillRect(0,0,cols,rows);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image,sx,sy,cropW,cropH,0,0,cols,rows);
    const rgba = ctx.getImageData(0,0,cols,rows).data;
    const bytes = new Uint8Array(pixels*2);
    for (let i=0; i<pixels; i++) {
      const j=i*4;
      const value=(rgba[j]>>3)<<11|(rgba[j+1]>>2)<<5|(rgba[j+2]>>3);
      bytes[i*2]=value>>8;
      bytes[i*2+1]=value&255;
    }
    return 'v1.' + btoa(String.fromCharCode(...bytes));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cached(cache, key, maxSize, build) {
  if (cache.has(key)) {
    const value=cache.get(key);
    cache.delete(key);
    cache.set(key,value);
    return value;
  }
  const value=build();
  cache.set(key,value);
  if (cache.size>maxSize) cache.delete(cache.keys().next().value);
  return value;
}

const dataCache=new Map();
function meshData(token) {
  if (typeof token!=='string' || !tokenPattern.test(token)) return null;
  return cached(dataCache,token,24,()=>{
    const bytes=atob(token.slice(3)), rgba=new Uint8ClampedArray(pixels*4);
    for(let i=0;i<pixels;i++) {
      const v=bytes.charCodeAt(i*2)*256+bytes.charCodeAt(i*2+1);
      rgba.set([Math.round((v>>11)*255/31),Math.round(((v>>5)&63)*255/63),Math.round((v&31)*255/31),255],i*4);
    }
    const {thick}=processImage(rgba,cols,rows,{mirror:false,blur:0,bri:0,con:0,gam:1,invert:true,
      border:0,widthMM:540,minT:5,maxT:36});
    const {positions,index,size}=buildMesh(thick,cols,rows,{shape:'flat',widthMM:540});
    const colour=new Color(), linear=new Float32Array(positions.length);
    const srgb=new Uint8Array(positions.length);
    for(let v=0;v<pixels*2;v++){
      const i=v%pixels, j=v*3, front=v<pixels;
      const x=positions[j]/(size[0]/2), y=positions[j+1]/(size[1]/2);
      const dome=Math.sqrt(Math.max(0,(1-x*x)*(1-y*y)));
      positions[j]=x*width*.5*(1-.32*y*y)*(1-.09*Math.max(0,-y));
      positions[j+1]=y*height*.5*(1-.12*x*x);
      // Lift the relief above a rounded shell. The rear bears the portrait as
      // well, so the player's normal third-person view shows their chosen photo.
      const pixelX=i%cols;
      const reverseIndex=i-pixelX+cols-1-pixelX;
      const colourIndex=front?i:reverseIndex;
      const raised=front?positions[j+2]:thick[reverseIndex];
      const depth=.024+.082*dome+raised*.001*(.35+.65*dome);
      positions[j+2]=(front?1:-1)*depth;
      const k=colourIndex*4;
      srgb[j]=rgba[k]; srgb[j+1]=rgba[k+1]; srgb[j+2]=rgba[k+2];
      colour.setRGB(rgba[k]/255,rgba[k+1]/255,rgba[k+2]/255).convertSRGBToLinear().toArray(linear,j);
    }
    return {positions,index:new Uint16Array(index),linear,srgb};
  });
}

// Geometry and its GPU buffers belong to the caller. CPU attribute arrays are immutable.
export function createPhotoGeometry(token) {
  const m=meshData(token);
  if(!m) return null;
  const g=new BufferGeometry();
  g.setAttribute('position',new BufferAttribute(m.positions,3));
  g.setAttribute('color',new BufferAttribute(m.linear,3));
  g.setIndex(new BufferAttribute(m.index,1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

const spriteCache=new Map(), directions=24;
function renderPortrait(data,angle) {
  // A small depth-buffered orthographic render is cached for software-only
  // browsers. Barycentric colour interpolation uses both real mesh surfaces.
  const sw=76, sh=90, canvas=makeCanvas(sw,sh);
  const ctx=canvas.getContext('2d');
  const image=ctx.createImageData(sw,sh), raster=image.data;
  const zbuf=new Float32Array(sw*sh).fill(-Infinity);
  const {positions:p,index,srgb}=data;
  const view=new Float32Array(p.length), sn=Math.sin(angle), cs=Math.cos(angle);
  for(let i=0;i<p.length;i+=3) {
    view[i]=sw*.5+(p[i]*cs+p[i+2]*sn)*(sw-2)/width;
    view[i+1]=sh*.5-p[i+1]*(sh-2)/height;
    view[i+2]=p[i+2]*cs-p[i]*sn;
  }
  for(let i=0;i<index.length;i+=3) {
    const a=index[i]*3,b=index[i+1]*3,c=index[i+2]*3;
    const ax=view[a],ay=view[a+1],bx=view[b],by=view[b+1],cx=view[c],cy=view[c+1];
    const det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
    if(det>=-.00001) continue;
    const minX=Math.max(0,Math.floor(Math.min(ax,bx,cx))),maxX=Math.min(sw-1,Math.ceil(Math.max(ax,bx,cx)));
    const minY=Math.max(0,Math.floor(Math.min(ay,by,cy))),maxY=Math.min(sh-1,Math.ceil(Math.max(ay,by,cy)));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const wa=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/det;
      const wb=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/det;
      const wc=1-wa-wb;
      if(wa<-.00001 || wb<-.00001 || wc<-.00001)continue;
      const k=y*sw+x,z=wa*view[a+2]+wb*view[b+2]+wc*view[c+2];
      if(z<=zbuf[k])continue;
      zbuf[k]=z;
      for(let ch=0;ch<3;ch++)raster[k*4+ch]=srgb[a+ch]*wa+srgb[b+ch]*wb+srgb[c+ch]*wc;
      raster[k*4+3]=255;
    }
  }
  ctx.putImageData(image,0,0);
  return canvas;
}

export function paintPhoto(ctx,token,x,y,w,h,yaw=0) {
  if(!token || w<=0 || h<=0) return;
  const bin=(Math.round(yaw*directions/(2*Math.PI))%directions+directions)%directions;
  const img=cached(spriteCache,token+':'+bin,256,()=>{
    const m=meshData(token);
    return m?renderPortrait(m,bin*2*Math.PI/directions):null;
  });
  if(img)ctx.drawImage(img,x-w/2,y-h/2,w,h);
}

export function previewPhoto(canvas,token,angle=0) {
  const ctx=canvas.getContext('2d');
  const w=canvas.width,h=canvas.height,heightPx=Math.min(h*.89,w*height/width*.89);
  ctx.clearRect(0,0,w,h);
  ctx.imageSmoothingEnabled=false;
  paintPhoto(ctx,token,w*.5,h*.5,heightPx*width/height,heightPx,angle);
}
