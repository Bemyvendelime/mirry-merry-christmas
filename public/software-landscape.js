// Software ray sampler for the shared world. The floor, including its high-frequency
// texture, lives in metres; walking and looking around never slide a screen overlay.
import {reflectedSprites} from './software-reflections.js';
import {plots, plotSize, districts, streetPoint, paintDistrictRoads} from './layout.js';
const TAU=Math.PI*2, SPAN=144, SIZE=1024, PIXELS=SIZE/SPAN;
const make=(w,h=w)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
function loadTexture(name,ready){const img=new Image();img.onload=()=>ready(img);img.src=new URL('./scene-assets/'+name,import.meta.url).href;}
function readPixels(image,w,h){const c=make(w,h),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,w,h);return ctx.getImageData(0,0,w,h);}
function tiledMaterial(image){const out=[];for(let n=1024;n>=2;n>>=1){const data=readPixels(image,n,n);out.push({size:n,mask:n-1,rgb:new Uint32Array(data.data.buffer)});}return out;}
function preparePano(image){const width=2048,height=1024,im=readPixels(image,width,height),b=im.data;
  // Crossfade both outer azimuths into their shared edge. The horizon occurs once around 360°.
  const overlap=40;for(let y=0;y<height;y++)for(let x=0;x<overlap;x++){const i=(y*width+x)*4,j=(y*width+width-x-1)*4;const amount=.5*(1-x/overlap)**2;for(let k=0;k<3;k++){const da=(b[j+k]-b[i+k])*amount;b[i+k]+=da;b[j+k]-=da;}}
  return {width,height,pixels:new Uint32Array(im.data.buffer)};
}
function siteMap(props){const c=make(SIZE),g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#000';g.fillRect(0,0,SIZE,SIZE);g.translate(SIZE/2,SIZE/2);g.scale(PIXELS,PIXELS);paintDistrictRoads(g,'#fff');const ellipse=(x,z,rx,rz)=>{g.beginPath();g.ellipse(x,z,rx,rz,0,0,TAU);};
  for(const p of plots){g.save();g.translate(p.x,p.z);g.rotate(-p.angle);g.fillStyle='#000';const {width:w,depth:d}=plotSize(p);g.fillRect(-w/2,-d/2,w,d);g.strokeStyle='#780000';g.lineWidth=.14;g.strokeRect(-w/2,-d/2,w,d);g.restore();}g.fillStyle='#000';ellipse(0,0,6.15,6.15);g.fill();g.strokeStyle='#c90000';g.lineWidth=.28;g.stroke();
  const data=g.getImageData(0,0,SIZE,SIZE).data,stone=new Uint8Array(SIZE*SIZE),brick=new Uint8Array(stone.length);for(let i=0;i<stone.length;i++){stone[i]=data[i*4+1];brick[i]=Math.max(0,data[i*4]-data[i*4+1]);}
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,SIZE,SIZE);g.translate(SIZE/2,SIZE/2);g.scale(PIXELS,PIXELS);
  let seed=13872;const r=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  function puddle(x,z,intensity,rx,rz){g.save();g.translate(x,z);g.scale(rx,rz);const glow=g.createRadialGradient(0,0,0,0,0,1);glow.addColorStop(0,'rgba(255,255,255,'+intensity+')');glow.addColorStop(.3,'rgba(255,255,255,'+intensity*.52+')');glow.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=glow;g.fillRect(-1,-1,2,2);g.restore();}
  for(const p of props.filter(q=>q.k.startsWith('lamp')||q.k==='tree')){const star=p.k==='tree';puddle(p.x+.29,p.z+.3,star?.80:.72,star?9.4:3.9,star?11:5.1);for(let i=0;i<(star?690:115);i++){const d=r(),spread=star?5.0:1.5,x=p.x+.35+(r()-.5)*(spread+2*d),z=p.z+1+d*(star?24:5.7);puddle(x,z,(1-d)*(.12+r()*.53),.09+r()*(star?.71:.41),.035+r()*.10);}
    if(star){for(let i=0;i<15;i++){const angle=TAU*i/15;puddle(4.9*Math.sin(angle),4.9*Math.cos(angle),.32+r()*.19,1.15,1.8);}}}
  const out=g.getImageData(0,0,SIZE,SIZE).data,light=new Uint8Array(stone.length);for(let i=0;i<stone.length;i++)light[i]=out[i*4];
  g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,SIZE,SIZE);g.restore();
  g.lineWidth=.21;g.lineCap='butt';for(const street of districts){g.strokeStyle=street.color;
    for(const side of [-1,1])for(let d=13.5;d<42;d+=.98){const a=streetPoint(street,d,side*2.97),b=streetPoint(street,d+.88,side*2.97);g.beginPath();g.moveTo(a.x,a.z);g.lineTo(b.x,b.z);g.stroke();}}
  const accents=new Uint32Array(g.getImageData(0,0,SIZE,SIZE).data.buffer);return {stone,brick,light,accents};
}
export function createLandscape(props,textures){const trace=reflectedSprites(props,textures);const masks=siteMap(props),surface=make(8),sctx=surface.getContext('2d',{alpha:false});let pano,wet,powder,epoch=0,data,buf,cache='',lastCamera='',stableAt=0,frameScale=.83,paintedAt=0;
  loadTexture('winter-dome.webp',i=>{pano=preparePano(i);epoch++;});loadTexture('wet-setts.webp',i=>{wet=tiledMaterial(i);epoch++;});loadTexture('snow.webp',i=>{powder=tiledMaterial(i);epoch++;});
  function refresh(w,h){surface.width=w;surface.height=h;data=sctx.createImageData(w,h);buf=new Uint32Array(data.data.buffer);}
  return function draw(ctx,m,projection,W,H,style){const t=performance.now(),key=style+'/'+[W,H,epoch,m[8],m[9],m[10],m[12],m[13],m[14],projection[0],projection[5]].map(v=>Math.round(v*5000)).join('/');if(key!==lastCamera){stableAt=t;lastCamera=key;}const stable=t-stableAt>165, quality=stable?1:frameScale,SK=key+'/'+quality.toFixed(2);
    if(SK===cache||(!stable&&t-paintedAt<23&&data)){ctx.drawImage(surface,0,0,W,H);return;}
    paintedAt=t;const sw=Math.max(4,Math.round(W*quality)),sh=Math.max(4,Math.round(H*quality));if(!data||sw!==surface.width||sh!==surface.height)refresh(sw,sh);
    const px=m[12],py=m[13],pz=m[14],iv=1/projection[5],iu=1/projection[0],stepX=2*iu/sw,st=masks.stone,br=masks.brick,lt=masks.light;
    const reflectRow=style==='raytracing'?trace(m,sw):null;
    for(let y=0;y<sh;y++){const v=(1-(y+.5)*2/sh)*iv,u0=(-1+1/sw)*iu,dy=m[5]*v-m[9];const rayX=m[4]*v-m[8],rayZ=m[6]*v-m[10],start=y*sw;const dist=dy<-.0001?-py/dy:Infinity,fullSky=dist>97;
      if(fullSky||dist>49){if(pano){const P=pano.pixels,PW=pano.width,PH=pano.height;let left=0;function uv(i){const u=u0+stepX*i,x=m[0]*u+rayX,z=m[2]*u+rayZ,ry=m[1]*u+dy;return [(.5+Math.atan2(x,-z)/TAU)*PW,(.5-Math.atan2(ry,Math.hypot(x,z))/Math.PI)*PH];}let [a,b]=uv(0);while(left<sw){const right=Math.min(left+20,sw),[endU,endV]=uv(right);let delta=endU-a;if(delta>PW/2)delta-=PW;if(delta<-PW/2)delta+=PW;const du=delta/(right-left),dv=(endV-b)/(right-left);let xx=a,yy=b;for(let i=left;i<right;i++,xx+=du,yy+=dv)buf[start+i]=P[(Math.min(PH-1,Math.max(0,yy|0))*PW)+((xx|0)&(PW-1))];a=endU;b=endV;left=right;}}
        else {const s=Math.min(1,Math.max(0,.58-dy)),R=65+88*s|0,G=86+74*s|0,B=132+52*s|0;buf.fill(0xff000000|R|G<<8|B<<16,start,start+sw);}}
      if(fullSky)continue;
      const footprint=dist*stepX,level=Math.max(0,Math.min(9,Math.log2(Math.max(1,footprint*(stable?180:265)))|0)),pav=wet?.[level],sn=powder?.[level];const pS=pav?pav.size/3:0,sS=sn?sn.size/3.8:0;
      let xw=px+(m[0]*u0+rayX)*dist,zw=pz+(m[2]*u0+rayZ)*dist;const dx=m[0]*stepX*dist,dz=m[2]*stepX*dist;
      const traced=reflectRow?.(rayX,dy,rayZ,dist,u0,stepX);
      for(let x=0;x<sw;x++,xw+=dx,zw+=dz){const mx=(xw+SPAN*.5)*PIXELS|0,mz=(zw+SPAN*.5)*PIXELS|0,inside=mx>=0&&mz>=0&&mx<SIZE&&mz<SIZE;const mi=inside?mz*SIZE+mx:0;let road=inside?st[mi]:0,brick=inside?br[mi]:0,heat=inside?lt[mi]:0;
        const pa=pav?pav.rgb[((zw*pS|0)&pav.mask)*pav.size+((xw*pS|0)&pav.mask)]:0xff928384;const so=sn?sn.rgb[((zw*sS|0)&sn.mask)*sn.size+((xw*sS|0)&sn.mask)]:0xffddd8d2;
        let sr=(so&255)*.84,sg=(so>>8&255)*.87,sb=(so>>16&255)*.93;let r=(pa&255)*.84+9,g=(pa>>8&255)*.84+12,b=(pa>>16&255)*.89+13;
        // Per-stone specular roughness breaks the lantern pools up between the joints.
        const reflect=.21+((pa&255)+(pa>>8&255))*.0027;r+=heat*reflect*.88;g+=heat*reflect*.49;b+=heat*reflect*.16;
        if(traced && traced[x] && road){const hit=traced[x],fresnel=.17+.31*(1-Math.min(1,-dy))**3;
          const weight=(hit>>>24)/255*fresnel*(.57+.43*(pa&255)/255);
          r+=((hit&255)-r)*weight;g+=((hit>>8&255)-g)*weight;b+=((hit>>16&255)-b)*weight;}
        sr+=heat*.33;sg+=heat*.16;sb+=heat*.036;const f=road/255;r=sr+(r-sr)*f;g=sg+(g-sg)*f;b=sb+(b-sb)*f;if(brick){const a=brick/255;r+=(115+(pa&255)*.21-r)*a;g+=(78+(pa>>8&255)*.17-g)*a;b+=(77+(pa>>16&255)*.14-b)*a;}
        const trim=inside?masks.accents[mi]:0;if(trim){const t=(trim>>>24)/360;r+=((trim&255)-r)*t;g+=((trim>>8&255)-g)*t;b+=((trim>>16&255)-b)*t;}
        if(dist>49){const old=buf[start+x],fog=Math.min(1,(dist-49)/48);const smooth=fog*fog*(3-2*fog);r+=((old&255)-r)*smooth;g+=((old>>8&255)-g)*smooth;b+=((old>>16&255)-b)*smooth;}buf[start+x]=0xff000000|Math.min(255,r)|Math.min(255,g)<<8|Math.min(255,b)<<16;
      }
    }sctx.putImageData(data,0,0);ctx.drawImage(surface,0,0,W,H);cache=SK;const cost=performance.now()-t;if(!stable){if(cost>32)frameScale=Math.max(.55,frameScale-.06);else if(cost<14)frameScale=Math.min(.94,frameScale+.013);}
  };
}
