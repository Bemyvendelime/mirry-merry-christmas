// Complete a tightly cropped character head in the same coordinate space as
// a normal cutout. The original head remains the source of face pixels.
const analyses=new WeakMap();
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>a.map((v,k)=>Math.round(lerp(v,b[k],t)));
const ink=c=>'rgb('+c.map(Math.round).join(',')+')';
const luma=c=>c[0]*.28+c[1]*.56+c[2]*.16;
const usable=p=>p&&p.visibility>.43&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
function palette(samples,fallback){
  if(!samples.length)return fallback;
  // Select an observed swatch. Blending skin, fur, fur markings and background
  // fringe into a single mean often loses the character's defining colour.
  const hist=new Map();
  for(const c of samples){
    const k=(c[0]>>5)*64+(c[1]>>5)*8+(c[2]>>5);
    const b=hist.get(k)||{n:0,s:[0,0,0]};b.n++;
    for(let i=0;i<3;i++)b.s[i]+=c[i];hist.set(k,b);
  }
  const best=[...hist.values()].sort((a,b)=>b.n-a.n)[0];
  return best.s.map(v=>Math.round(v/best.n));
}
function analyze(subject){
  if(analyses.has(subject.canvas))return analyses.get(subject.canvas);
  const pic=subject.canvas,w=64,h=64,s=document.createElement('canvas');
  s.width=w;s.height=h;
  const c=s.getContext('2d',{willReadFrequently:true});c.drawImage(pic,0,0,w,h);
  const rgb=c.getImageData(0,0,w,h).data,top=Array(w).fill(h);
  const observed=[],green=[],skin=[],bottom=[],sideColors=[],widths=new Uint8Array(h);
  let left=w,right=-1,minY=h,maxY=0;
  let leftDark=0,rightDark=0,leftEyeLight=0,rightEyeLight=0,lastRows=0;
  const isSkin=(r,g,b)=>r>49&&r>g*1.035&&g>b*.94&&r-b>11&&r/b<3.2;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=4*(x+y*w);if(rgb[p+3]<140)continue;
    const color=[rgb[p],rgb[p+1],rgb[p+2]],lum=luma(color);
    left=Math.min(left,x);right=Math.max(right,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);top[x]=Math.min(top[x],y);
    observed.push(color);widths[y]++;
    if(color[1]>color[0]*1.17&&color[1]>color[2]*1.30&&color[1]>45)green.push(color);
    if(isSkin(...color)&&y>h*.21&&y<h*.84&&x>w*.19&&x<w*.81)skin.push(color);
    if(x<w*.25||x>w*.75||y<h*.14)sideColors.push(color);
    if(y>h*.87){bottom.push(color);lastRows++;}
    if(y>h*.12&&y<h*.62&&x>w*.12&&x<w*.88){
      if(lum<93){if(x<w*.49)leftDark++;else if(x>w*.51)rightDark++;}
      if(lum>181){if(x<w*.49)leftEyeLight++;else if(x>w*.51)rightEyeLight++;}
    }
  }
  const n=observed.length||1,m=subject.landmarks||[];
  const aspect=pic.width/pic.height;
  const foot=[27,28,29,30,31,32].some(i=>usable(m[i]));
  const limbs=([13,14,15,16,23,24]).filter(i=>usable(m[i])).length;
  const eyes=usable(m[2])&&usable(m[5])&&usable(m[0]);
  const shoulder=usable(m[11])&&usable(m[12]);
  const headSpan=eyes?Math.hypot((m[2].x-m[5].x)*aspect,m[2].y-m[5].y):0;
  const eyeLine=eyes?(m[2].y+m[5].y)*.5:0;
  const framedPortrait=eyes&&(headSpan>.11||eyeLine>.25);
  const topAt=(a,b)=>Math.min(...top.slice(Math.floor(w*a),Math.ceil(w*b)));
  const earL=topAt(.05,.37),earR=topAt(.63,.95),middle=topAt(.44,.56);
  const pairedTips=Math.min(middle-earL,middle-earR)>h*.083&&Math.abs(earL-earR)<h*.20;
  const contrastEyes=leftDark>3&&rightDark>3;
  const broad=aspect>.77&&aspect<2.25;
  const frog=green.length/n>.22&&broad&&contrastEyes&&leftEyeLight>3&&rightEyeLight>3;
  const cat=pairedTips&&aspect>.72&&aspect<1.9&&contrastEyes;
  const skinTone=palette(skin,[185,138,108]);
  const portraitLike=aspect>.56&&aspect<1.48&&skin.length/n>.165&&contrastEyes&&
    (leftEyeLight>2&&rightEyeLight>2||subject.kind==='human')&&lastRows<h*w*.099;
  const type=frog?'frog':cat?'cat':(eyes||subject.kind==='human'||portraitLike)?'person':'mascot';
  // The lower half of a full animal often has two feet with a transparent
  // gap. A photographed bust tends to grow wider again below the chin.
  let splitRows=0;
  for(let y=Math.floor(h*.64);y<=h*.94;y++){
    const spans=[];let x=0;
    while(x<w){
      while(x<w&&rgb[4*(y*w+x)+3]<140)x++;
      const start=x;while(x<w&&rgb[4*(y*w+x)+3]>=140)x++;
      if(x-start>=w*.095)spans.push([start,x]);
    }
    if(spans.some((run,i)=>i>0&&run[0]-spans[i-1][1]>.087*w))splitRows++;
  }
  const bandWidth=(lo,hi)=>{
    const band=widths.slice(Math.floor(h*lo),Math.ceil(h*hi));
    return band.reduce((a,b)=>a+b,0)/band.length;
  };
  const flaresAtBase=bandWidth(.79,.91)>bandWidth(.38,.60)*1.19;
  const shoulderAt=shoulder?(m[11].y+m[12].y)*.5:1;
  const headOnly=!foot&&limbs<2&&shoulderAt>.84&&splitRows<h*.075&&!flaresAtBase&&
    (frog||cat||framedPortrait||portraitLike);
  const box=right<left?{x:0,y:0,w:pic.width,h:pic.height}:{
    x:Math.floor(left/w*pic.width),y:Math.floor(minY/h*pic.height),
    w:Math.min(pic.width-Math.floor(left/w*pic.width),Math.ceil((right-left+1)/w*pic.width)),
    h:Math.min(pic.height-Math.floor(minY/h*pic.height),Math.ceil((maxY-minY+1)/h*pic.height))
  };
  const fur=palette(sideColors,palette(observed,[138,122,101]));
  const result={headOnly,type,skin:type==='frog'?palette(green,[85,148,69]):type==='person'?skinTone:fur,
    fur,bottom:palette(bottom,fur),box};
  analyses.set(subject.canvas,result);return result;
}
export function shouldCompleteBody(subject){return !!subject?.canvas&&analyze(subject).headOnly;}

function landmarksFor(subject,box,head,points,W,H){
  const lm=Array(33);
  const face=[[.50,.52],[.413,.39],[.392,.385],[.369,.393],[.587,.39],[.608,.385],[.631,.393],
    [.24,.49],[.76,.49],[.429,.666],[.572,.666]];
  for(let i=0;i<11;i++){
    const original=subject.landmarks?.[i];
    const [u,v]=usable(original)?[
      clamp((original.x*subject.canvas.width-box.x)/box.w,0,1),
      clamp((original.y*subject.canvas.height-box.y)/box.h,0,1)]:face[i];
    lm[i]={x:(head.x+u*head.w)/W,y:(head.y+v*head.h)/H,visibility:.99,z:0};
  }
  for(let i=11;i<33;i++){const [x,y]=points[i];lm[i]={x:x/W,y:y/H,visibility:.99,z:0};}
  return lm;
}

export function completeBody(subject){
  const {box,type,skin,fur,bottom}=analyze(subject),frog=type==='frog',cat=type==='cat',human=type==='person';
  const W=256,H=352,c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d'),headH=human?102:cat?120:128;
  const scale=Math.min(headH/box.h,(human?112:cat?166:203)/box.w);
  const hw=box.w*scale,hh=box.h*scale;
  const head={x:(W-hw)*.5,y:7,w:hw,h:hh};
  // Proportions follow the visible head rather than a fixed generic stick rig.
  const shoulderY=head.y+hh-4,hipY=lerp(shoulderY,330,.48);
  const torsoHalf=clamp(hw*(human?.73:cat?.34:.315),32,55);
  const legSpread=torsoHalf*(cat?.52:.56),legRadius=cat?12:human?12:14;
  const sleeveRadius=cat?12:human?11:13,bodyCentre=128;
  const side=(v,sg)=>bodyCentre+sg*v;
  const base=cat?fur:frog?[62,105,145]:human?[59,89,104]:mix(fur,[57,82,106],.67);
  // A recognisable coloured collar in a real portrait may continue as fabric.
  const colouredFabric=human&&Math.max(...bottom)-Math.min(...bottom)>25&&
    (bottom[2]>bottom[0]*1.08||bottom[1]>bottom[0]*1.08);
  const cloth=colouredFabric?bottom:base;
  const lining=cat?mix(fur,[237,219,180],.49):mix(cloth,[219,222,194],.56);
  const seam=cat?mix(fur,[66,48,48],.48):mix(cloth,[28,38,53],.59);
  const trouser=cat?mix(fur,[101,80,65],.16):mix(cloth,[34,42,58],.67);
  const dark=c=>mix(c,[26,30,37],.45),bright=c=>mix(c,[247,235,200],.28);
  function ellipse(x,y,rx,ry,color){
    g.fillStyle=ink(color);g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();
  }
  function stroke(points,colour,width){
    g.strokeStyle=ink(colour);g.lineWidth=width;g.lineJoin=g.lineCap='round';
    g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.stroke();
  }
  function limb(a,b,end,r,color){
    stroke([a,b,end],dark(color),2*r+2);
    stroke([a,b,end],color,2*r-2);
    const path=[a,b,end].map(([x,y])=>[x-r*.38,y-1]);
    stroke(path,bright(color),Math.max(2,r*.38));
  }
  const pts=[];
  for(const [index,sg] of [[0,-1],[1,1]]){
    const shoulder=[side(torsoHalf*.83,sg),shoulderY+9];
    const elbow=[side(torsoHalf+17,sg),lerp(shoulderY,hipY,.49)];
    const wrist=[side(torsoHalf+27,sg),hipY-2];
    const palm=[wrist[0]+sg*1.3,wrist[1]+8];
    const hip=[side(legSpread,sg),hipY-2],knee=[side(legSpread+3,sg),lerp(hipY,326,.51)];
    const ankle=[side(legSpread+6,sg),323],toe=[ankle[0]+sg*8,335];
    for(const [i,p] of [[11,shoulder],[13,elbow],[15,wrist],[17,palm],[19,palm],[21,[palm[0]-sg*4,palm[1]-2]],
      [23,hip],[25,knee],[27,ankle],[29,[ankle[0]-sg*3,331]],[31,toe]])pts[i+index]=p;
    limb(hip,knee,ankle,legRadius,trouser);
    const shoe=cat?bright(fur):frog?skin:mix(seam,[89,66,53],.55);
    ellipse(toe[0]-sg*1.5,333,cat?17:19,9,dark(shoe));
    ellipse(toe[0]-sg*2,330,cat?16:18,9,shoe);
    if(frog||cat)for(let n=-1;n<=1;n++)ellipse(toe[0]+n*6,334,5,3.4,bright(shoe));
    else stroke([[toe[0]-9,334],[toe[0]+10,334]],lining,2.6);
    limb(shoulder,elbow,wrist,sleeveRadius,cloth);
    if(!cat)stroke([[wrist[0]-6,wrist[1]-4],[wrist[0]+6,wrist[1]-3]],lining,4);
    ellipse(palm[0],palm[1],cat?10.4:8.6,cat?11:12,dark(skin));
    ellipse(palm[0]-.8,palm[1]-1.4,cat?9.4:7.7,cat?10:11,skin);
    if(frog){
      for(let n=-1;n<=1;n++)ellipse(palm[0]+n*4.7,palm[1]+6.4+Math.abs(n)*1.4,3.4,4.7,bright(skin));
    }else if(cat){for(let n=-1;n<=1;n++)ellipse(palm[0]+n*4,palm[1]+6,2.4,2.6,bright(skin));}
  }
  const top=shoulderY-1,hem=hipY+7,sw=torsoHalf;
  g.beginPath();g.moveTo(128,top-8);
  g.bezierCurveTo(128-sw*.59,top-9,128-sw*1.07,top+4,128-sw,top+22);
  g.bezierCurveTo(128-sw*.896,lerp(top,hem,.48),128-sw*.93,hem-13,128-sw*.87,hem-3);
  g.quadraticCurveTo(128,hem+8,128+sw*.87,hem-3);
  g.bezierCurveTo(128+sw*.93,hem-13,128+sw*.9,lerp(top,hem,.48),128+sw,top+22);
  g.bezierCurveTo(128+sw*1.07,top+4,128+sw*.59,top-9,128,top-8);g.closePath();
  const weave=g.createLinearGradient(128-sw,0,128+sw,0);
  weave.addColorStop(0,ink(dark(cloth)));weave.addColorStop(.23,ink(cloth));
  weave.addColorStop(.53,ink(mix(cloth,bright(cloth),.72)));weave.addColorStop(1,ink(dark(cloth)));
  g.fillStyle=weave;g.fill();g.strokeStyle=ink(seam);g.lineWidth=2.8;g.stroke();
  if(cat){
    // A tapered bib and broken flank markings echo the sampled coat.
    g.beginPath();g.moveTo(128-sw*.43,top+8);g.quadraticCurveTo(128-sw*.51,top+31,128-sw*.19,hem-23);
    g.lineTo(128,hem-13);g.quadraticCurveTo(128+sw*.52,top+38,128+sw*.36,top+9);g.closePath();g.fillStyle=ink(lining);g.fill();
    for(let n=0;n<3;n++)for(const sg of [-1,1]){
      const y=lerp(top,hem,.37+n*.142);
      stroke([[128+sg*sw*.88,y],[128+sg*sw*(.62+n*.044),y+2.6]],seam,3.9-n*.45);
    }
  }else{
    // Knit waist, raglan seams and a small cable stripe stay readable at 128 pixels.
    g.strokeStyle=ink(lining);g.lineWidth=4;g.beginPath();g.moveTo(128-sw*.84,hem-8);g.quadraticCurveTo(128,hem-1,128+sw*.84,hem-8);g.stroke();
    for(let x=128-sw*.77;x<=128+sw*.77;x+=5.3)stroke([[x,hem-7],[x+.3,hem-3]],seam,1.4);
    for(const sg of [-1,1])stroke([[128+sg*16,top+4],[128+sg*(sw*.74),top+25]],mix(cloth,lining,.66),2.4);
    if(human){
      const y=top+22;
      stroke([[128,y],[128,hem-12]],mix(cloth,lining,.38),2.7);
      for(let i=0;i<3;i++)ellipse(128,y+8+i*16,2.2,2.1,lining);
    }
  }
  ellipse(128,top+5,sw*.47,9,cat?lining:seam);
  ellipse(128,top+2,sw*.40,8,cat?fur:lining);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(subject.canvas,box.x,box.y,box.w,box.h,head.x,head.y,head.w,head.h);
  return {...subject,kind:'human',canvas:c,landmarks:landmarksFor(subject,box,head,pts,W,H)};
}
