// Continue the observed material around the silhouette into the unseen view.
// Only side strips and (when tracked) the hairline/crown supply appearance.
// Work in the uploaded mask's coordinates so both mesh LODs see the same coat.
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const fade=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const gauss=x=>Math.exp(-x*x);
const luminance=c=>.25*c[0]+.59*c[1]+.16*c[2];

function patch(samples){
  // The middle samples reject bright fringe pixels and isolated details like
  // an earring or whisker. Keep actual correlated RGB triplets from the coat.
  samples.sort((a,b)=>luminance(a)-luminance(b));
  const mid=(samples.length-1)*.5;
  return {base:samples[Math.round(mid)],dark:samples[Math.round(mid*.46)],light:samples[Math.round(mid*1.54)]};
}

function makeHead(image,human,colourAt){
  if(!human||!image.landmarks)return null;
  const {landmarks:lm,width:w,height:h}=image;
  const point=i=>({x:lm[i].x*w,y:lm[i].y*h});
  if(lm[0].visibility<.36||lm[2].visibility<.30||lm[5].visibility<.30)return null;
  const left=point(7),right=point(8),eyeL=point(2),eyeR=point(5),nose=point(0);
  const radius=Math.max(Math.hypot(left.x-right.x,left.y-right.y)*.56,Math.abs(eyeL.x-eyeR.x)*1.43,w*.075,2.3);
  const cx=(nose.x+(left.x+right.x)*.5)*.5,eyeY=(eyeL.y+eyeR.y)*.5;
  const crown=[],temples=[];
  for(let y=Math.max(0,Math.floor(eyeY-1.85*radius));y<Math.min(h,eyeY+radius*.5);y++){
    for(let x=Math.max(0,Math.floor(cx-radius));x<Math.min(w,cx+radius);x++){
      const c=colourAt(x,y);if(!c)continue;
      const dx=Math.abs((x+.5-cx)/radius);
      if(y<eyeY-.39*radius&&dx<.84)crown.push(c);
      else if(dx>.76)temples.push(c);
    }
  }
  if(crown.length<2&&temples.length<2)return null;
  const crownPatch=patch(crown.length>=2?crown:temples);
  return {cx,cy:eyeY-.10*radius,radius,crown:crownPatch,temple:temples.length?patch(temples):crownPatch};
}

export function createRearSurface(image,human){
  const {width:w,height:h,rgba}=image;
  function colourAt(x,y){
    const i=4*(y*w+x);
    return rgba[i+3]>0?[rgba[i],rgba[i+1],rgba[i+2]]:null;
  }
  const rows=Array.from({length:h},()=>[]);
  for(let y=0;y<h;y++){
    let x=0;
    while(x<w){
      while(x<w&&!rgba[(y*w+x)*4+3])x++;
      if(x===w)break;
      const left=x++;while(x<w&&rgba[(y*w+x)*4+3])x++;
      rows[y].push({left,right:x-1});
    }
  }
  function spanAt(y,x){
    let best=null,distance=Infinity;
    for(const run of rows[y]){
      const d=Math.max(0,run.left-x,x-run.right);
      if(d<distance){best=run;distance=d;}
      if(!d)break;
    }
    return best;
  }
  const band=Math.max(1,Math.round(h*.025));
  for(let y=0;y<h;y++)for(const run of rows[y]){
    const width=run.right-run.left+1;
    for(const side of ['left','right']){
      const samples=[];
      for(let dy=-band;dy<=band;dy++){
        const yy=y+dy;if(yy<0||yy>=h)continue;
        const xCenter=(run.left+run.right)*.5;
        const next=spanAt(yy,xCenter);
        // Keep the two sides of a separated leg/handle independent, even
        // beside a row where the pieces overlap or leave the frame.
        if(!next||next.right<run.left||next.left>run.right)continue;
        if(Math.abs(next[side]-run[side])>Math.max(3,width*.36))continue;
        for(const t of [.045,.095,.145,.195]){
          const inset=Math.round(t*(next.right-next.left));
          samples.push(colourAt(side==='left'?next.left+inset:next.right-inset,yy));
        }
      }
      run[side+'Patch']=patch(samples);
    }
  }
  const head=makeHead(image,human,colourAt);
  const shoulder=human&&image.landmarks?(image.landmarks[11].y+image.landmarks[12].y)*.5:.38;
  const pelvis=human&&image.landmarks?(image.landmarks[23].y+image.landmarks[24].y)*.5:.73;
  return function sample(nx,ny,fallback){
    const x=clamp(nx*w-.5,0,w-1),iy=clamp(Math.floor(ny*h),0,h-1);
    let run=spanAt(iy,x);
    // Subpixel film and antialiased silhouettes at low LOD can bridge a row.
    if(!run&&iy>0)run=spanAt(iy-1,x);
    if(!run&&iy<h-1)run=spanAt(iy+1,x);
    if(!run)return {rgb:fallback,rearDepth:1.12};
    const u=clamp((x-run.left)/Math.max(1,run.right-run.left),0,1),across=u*2-1;
    const left=run.leftPatch,right=run.rightPatch;
    const bend=.057*Math.sin(ny*11.7)+.025*Math.sin(nx*10.3+ny*7.1);
    const side=fade((u-.20+bend)/.60);
    // Modulate by the range actually present in these two material swatches.
    // A solid-coloured prop remains solid. Fabric/fur variation follows the
    // silhouette in broad patches rather than duplicating frontal markings.
    const flow=Math.sin(23*ny+9*nx+3*Math.sin(7*nx-3*ny));
    const grain=.55*flow+.30*Math.sin(40*nx+17*ny+flow)+.15*Math.sin(39*ny-22*nx);
    function channel(p,k){
      return grain>0?mix(p.base[k],p.light[k],grain*.62):mix(p.base[k],p.dark[k],-grain*.62);
    }
    const rgb=[0,1,2].map(k=>mix(channel(left,k),channel(right,k),side));
    const core=1-across*across;
    let rearDepth;
    if(human){
      // Scapulae are broader than the waist, the occiput fuller than the
      // nape. These offsets alter the 3D surface; they are not painted shade.
      const backY=(ny-shoulder)/Math.max(.12,pelvis-shoulder);
      const shoulderBlade=gauss((Math.abs(across)-.39)/.31)*gauss((backY-.25)/.40);
      const waist=gauss((backY-.84)/.28)*core;
      rearDepth=1.02+.30*shoulderBlade-.17*waist+.12*gauss((backY-1.23)/.36)*core;
      if(head){
        const dx=(nx*w-head.cx)/head.radius,dy=(ny*h-head.cy)/head.radius;
        // Fill the back of the head with crown/temple material even if the
        // front has a prominent eye, nose, glasses or a beard.
        const mask=1-fade((Math.hypot(dx,dy/1.42)-.72)/.49);
        const hairSide=fade((Math.abs(dx)-.55)/.48)*.57;
        for(let k=0;k<3;k++)rgb[k]=mix(rgb[k],mix(channel(head.crown,k),channel(head.temple,k),hairSide),mask);
        rearDepth=mix(rearDepth,1.14+.28*gauss(dx/.72)*gauss((dy+.17)/.82)-.19*gauss((dy-1.13)/.38),mask);
      }
    }else{
      // Continuous, shape-dependent convex rear for animals or objects. A
      // thin handle/ear retains its thickness as it follows the input contour.
      const central=gauss((across+.12*Math.sin(ny*4))/.72);
      rearDepth=1.04+.24*central+.25*central*gauss((ny-.61)/.29);
    }
    return {rgb:rgb.map(c=>Math.round(clamp(c,0,255))),rearDepth};
  };
}
