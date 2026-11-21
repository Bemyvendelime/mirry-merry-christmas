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
export function paintPixelPalette(ctx,w,h){
  const im=ctx.getImageData(0,0,w,h),p=im.data;
  const clamp=v=>Math.max(0,Math.min(255,v));
  for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){
    const d=(bayer[(y&3)*4+(x&3)]-7.5)*.91;
    const c=palette[shade(clamp(p[i]+d),clamp(p[i+1]+d),clamp(p[i+2]+d))];
    p[i]=c[0];p[i+1]=c[1];p[i+2]=c[2];
  }
  ctx.putImageData(im,0,0);
}

const sampled=new WeakMap(),stamps=new Map();
function splatStamp(index){
  if(stamps.has(index))return stamps.get(index);
  const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d');
  const grad=g.createRadialGradient(12,12,0,12,12,12),rgb=palette[index].join(',');
  for(const [t,a] of [[0,1],[.32,.97],[.59,.68],[.82,.23],[1,0]])grad.addColorStop(t,'rgba('+rgb+','+a+')');
  g.fillStyle=grad;g.fillRect(0,0,24,24);stamps.set(index,c);return c;
}
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
  sampled.set(image,points);return points;
}
export function paintFirSplats(ctx,texture,camera,project,w,h,focal){
  const points=firSamples(texture),inv=camera.matrixWorldInverse.elements;
  // Traverse sixteen depth buckets back to front. All rings stay fixed as the viewer walks.
  const center=-inv[14],buckets=Array.from({length:24},()=>[]);
  for(const [x,y,z,index] of points){
    const q=project(x,y,z);if(!q||q.x< -20||q.x>w+20||q.y< -20||q.y>h+20)continue;
    const bucket=Math.max(0,Math.min(23,Math.floor((q.d-center+36)/2)));
    buckets[bucket].push([q,index]);
  }
  for(let j=buckets.length-1;j>=0;j--)for(const [q,index] of buckets[j]){
    const radius=Math.max(1,Math.min(22,focal*.31/q.d));
    ctx.drawImage(splatStamp(index),q.x-radius,q.y-radius*.66,radius*2,radius*1.32);
  }
}
