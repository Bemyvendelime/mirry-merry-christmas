// World-space polygons shared with the WebGL cottage, rasterized into a
// transparent layer with a reciprocal-depth buffer for software sprite occlusion.
const NEAR=.10;
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
const packed=(r,g,b)=>(255<<24)|(clamp(Math.round(b),0,255)<<16)|(clamp(Math.round(g),0,255)<<8)|clamp(Math.round(r),0,255);

function compile(faces,indoor) {
  const points=[],indices=new Map();
  function vertex(p){
    const key=p.join(',');
    if(!indices.has(key)){indices.set(key,points.length);points.push(p);}
    return indices.get(key);
  }
  const surfaces=faces.map(face=>{
    const [a,b,c]=face.points;
    const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    const length=Math.hypot(...n)||1;
    const norm=n.map(x=>x/length);
    const rgb=parseInt(face.color.replace('#',''),16);
    const count=face.points.length;
    const centre=[0,0,0];for(const p of face.points)for(let k=0;k<3;k++)centre[k]+=p[k]/count;
    const light=indoor?
      .84+.10*Math.abs(norm[1])+.07*Math.max(0,-norm[0]*.70-norm[2]*.42):
      .77+.17*Math.max(0,norm[1])+.14*Math.max(0,-norm[0]*.62+norm[2]*.51);
    const warmth=indoor?Math.max(0,1-Math.hypot(centre[0]*.35,centre[1]*.15,centre[2]*.31)/3):0;
    const gain=face.emissive?1.08:light;
    const tone=packed((rgb>>16)*gain+8*warmth,((rgb>>8)&255)*gain+3*warmth,(rgb&255)*gain);
    return {ix:face.points.map(vertex),color:tone,detail:face.detail,centre};
  });
  return {points,surfaces,xyz:new Float64Array(points.length*3),outcodes:new Uint8Array(points.length)};
}

export function createCottageCanvas(exterior,interior) {
  const scenes={plaza:compile(exterior,false),cottage:compile(interior,true)};
  const layer=document.createElement('canvas');
  const painter=layer.getContext('2d');
  let image,rgba,depth,width=0,height=0,screenW=1,screenH=1,oldRoom=null,lastCamera=[];
  let bounds=[0,0,0,0];
  const occluded=[];
  function resize(w,h){
    const factor=Math.min(1,768/w,480/h);
    const nextW=Math.max(1,Math.round(w*factor)),nextH=Math.max(1,Math.round(h*factor));
    if(nextW===width&&nextH===height)return false;
    width=layer.width=nextW;height=layer.height=nextH;
    image=painter.createImageData(width,height);
    rgba=new Uint32Array(image.data.buffer);
    depth=new Float32Array(width*height);
    return true;
  }
  // Intersection of each scanline with a clipped convex face gives one
  // span. Reciprocal view-space depth is affine across the projected face.
  function fillFace(poly,color){
    let minY=Infinity,maxY=-Infinity;
    for(const v of poly){minY=Math.min(minY,v[1]);maxY=Math.max(maxY,v[1]);}
    const start=Math.max(0,Math.ceil(minY-.5)),end=Math.min(height-1,Math.floor(maxY-.5));
    for(let y=start;y<=end;y++){
      const scan=y+.5;
      let left=Infinity,right=-Infinity,leftD=0,rightD=0;
      for(let i=0,j=poly.length-1;i<poly.length;j=i++){
        const a=poly[j],b=poly[i];
        if((a[1]>scan)===(b[1]>scan))continue;
        const f=(scan-a[1])/(b[1]-a[1]);
        const x=a[0]+f*(b[0]-a[0]),d=a[2]+f*(b[2]-a[2]);
        if(x<left){left=x;leftD=d;}
        if(x>right){right=x;rightD=d;}
      }
      const x0=Math.max(0,Math.ceil(left-.5)),x1=Math.min(width-1,Math.floor(right-.5));
      if(x0>x1)continue;
      const delta=(rightD-leftD)/Math.max(1e-8,right-left);
      let d=leftD+(x0+.5-left)*delta,index=y*width+x0;
      for(let x=x0;x<=x1;x++,index++,d+=delta){
        if(d+1.e-8<depth[index])continue;
        depth[index]=d;rgba[index]=color;
      }
      bounds[0]=Math.min(bounds[0],x0);bounds[1]=Math.min(bounds[1],y);
      bounds[2]=Math.max(bounds[2],x1);bounds[3]=Math.max(bounds[3],y);
    }
  }

  function rebuild(kind,inv,proj){
    const indoor=kind==='cottage';
    rgba.fill(indoor?packed(61,46,52):0);depth.fill(0);
    bounds=[width,height,-1,-1];
    const {points,surfaces,xyz,outcodes}=scenes[kind],px=proj[0],py=proj[5];
    for(let i=0;i<points.length;i++){
      const [x,y,z]=points[i],j=3*i;
      const vx=inv[0]*x+inv[4]*y+inv[8]*z+inv[12];
      const vy=inv[1]*x+inv[5]*y+inv[9]*z+inv[13];
      const d=-(inv[2]*x+inv[6]*y+inv[10]*z+inv[14]);
      xyz[j]=vx;xyz[j+1]=vy;xyz[j+2]=d;
      outcodes[i]=(d<NEAR?1:0)|(vx*px<-d?2:0)|(vx*px>d?4:0)|(vy*py<-d?8:0)|(vy*py>d?16:0);
    }
    for(const face of surfaces){
      let common=31;
      for(const i of face.ix)common&=outcodes[i];
      if(common)continue;
      if(face.detail&&!indoor){
        const [x,y,z]=face.centre;
        if(-(inv[2]*x+inv[6]*y+inv[10]*z+inv[14])>42)continue;
      }
      const poly=[];
      const append=(x,y,d)=>poly.push([(1+x*px/d)*width*.5,(1-y*py/d)*height*.5,1/d]);
      for(let i=0,j=face.ix.length-1;i<face.ix.length;j=i++){
        const a=3*face.ix[j],b=3*face.ix[i],da=xyz[a+2],db=xyz[b+2];
        if((da>=NEAR)!==(db>=NEAR)){
          const t=(NEAR-da)/(db-da);
          append(xyz[a]+(xyz[b]-xyz[a])*t,xyz[a+1]+(xyz[b+1]-xyz[a+1])*t,NEAR);
        }
        if(db>=NEAR)append(xyz[b],xyz[b+1],db);
      }
      if(poly.length>=3)fillFace(poly,face.color);
    }
    painter.putImageData(image,0,0);
  }
  function paint(ctx,kind,inv,proj,w,h){
    screenW=w;screenH=h;
    const changed=resize(w,h)||oldRoom!==kind||lastCamera[16]!==proj[0]||lastCamera[17]!==proj[5]||
      inv.some((v,i)=>Math.abs(v-lastCamera[i])>1e-7);
    if(changed){
      rebuild(kind,inv,proj);oldRoom=kind;lastCamera=[...inv,proj[0],proj[5]];
    }
    if(kind==='cottage'||bounds[2]>=0)ctx.drawImage(layer,0,0,w,h);
  }

  function visiblePoint(x,y,d){
    const ix=Math.floor(x*width/screenW),iy=Math.floor(y*height/screenH);
    if(ix<bounds[0]||ix>bounds[2]||iy<bounds[1]||iy>bounds[3])return true;
    return depth[iy*width+ix]<=1/Math.max(NEAR,d-.055);
  }
  // Public drawing contract: 0 = fully hidden, 1 = visible, 2 = clipped.
  // A caller receiving 2 restores its context after drawing. The short
  // row runs describe only the overlap with the architecture on screen.
  function clip(ctx,left,top,right,bottom,base,head=base){
    if(bounds[2]<0)return 1;
    const sx=width/screenW,sy=height/screenH;
    const x0=Math.max(0,Math.floor(left*sx)),x1=Math.min(width-1,Math.ceil(right*sx));
    const y0=Math.max(0,Math.floor(top*sy)),y1=Math.min(height-1,Math.ceil(bottom*sy));
    if(x0>x1||y0>y1)return 0;
    const xa=Math.max(x0,bounds[0]),xb=Math.min(x1,bounds[2]),ya=Math.max(y0,bounds[1]),yb=Math.min(y1,bounds[3]);
    if(xa>xb||ya>yb)return 1;
    const dBase=1/Math.max(NEAR,base.d-.055),dHead=1/Math.max(NEAR,head.d-.055);
    const dy=head.y-base.y;
    let count=0;occluded.length=0;
    for(let y=ya;y<=yb;y++){
      const t=Math.abs(dy)>.1?clamp(((y+.5)/sy-base.y)/dy,0,1):0;
      const test=dBase+(dHead-dBase)*t,offset=y*width;
      let start=-1;
      for(let x=xa;x<=xb+1;x++){
        if(x<=xb&&depth[offset+x]>test){if(start<0)start=x;}
        else if(start>=0){occluded.push(start,y,x);count+=x-start;start=-1;}
      }
    }
    if(!count)return 1;
    if(count===(x1-x0+1)*(y1-y0+1))return 0;
    ctx.save();ctx.beginPath();ctx.rect(0,0,screenW,screenH);
    for(let i=0;i<occluded.length;i+=3){
      const x=Math.round(occluded[i]/sx),y=Math.round(occluded[i+1]/sy);
      ctx.rect(x,y,Math.round(occluded[i+2]/sx)-x,Math.round((occluded[i+1]+1)/sy)-y);
    }
    ctx.clip('evenodd');return 2;
  }
  return {paint,clip,visiblePoint};
}
