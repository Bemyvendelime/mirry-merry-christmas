import * as T from 'three';

const asset = name => new URL('./scene-assets/' + name, import.meta.url).href;

function canvas(w, h = w) {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  return el;
}

// Draw the whole panorama in eye space. The background has no world-space
// rim, and small capture differences at longitude zero feather into each other.
export function setWinterSky(scene) {
  const uniforms = { atlas: {value: null}, ready: {value: 0} };
  const material = new T.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, side: T.BackSide, fog: false,
    vertexShader: `
      varying vec3 direction;
      void main(){
        direction=position;
        vec4 clip=projectionMatrix*vec4(mat3(viewMatrix)*position,1.);
        gl_Position=clip.xyww;
      }`,
    fragmentShader: `
      uniform sampler2D atlas; uniform float ready;
      varying vec3 direction;
      void main(){
        vec3 d=normalize(direction);
        float u=fract(atan(d.x,-d.z)*0.1591549431+.5);
        float v=asin(clamp(d.y,-1.,1.))*.3183098862+.5;
        vec3 fallback=mix(vec3(.32,.35,.48),vec3(.044,.079,.17),smoothstep(0.,.88,d.y));
        vec3 col=fallback;
        if(ready>.5){
          vec3 original=texture2D(atlas,vec2(u,v)).rgb;
          float edge=min(u,1.-u);
          float seam=.5*(1.-smoothstep(0.,.039,edge));
          col=mix(original,texture2D(atlas,vec2(1.-u,v)).rgb,seam);
        }
        gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }`
  });
  const sky = new T.Mesh(new T.SphereGeometry(7,60,36),material);
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  scene.add(sky);
  const loader = new T.TextureLoader();
  loader.load(asset('winter-dome.webp'), tex => {
    tex.colorSpace = T.SRGBColorSpace;
    tex.wrapS = T.RepeatWrapping;
    uniforms.atlas.value = tex;
    uniforms.ready.value = 1;
    const mini = canvas(256,128);
    mini.getContext('2d').drawImage(tex.image,0,0,256,128);
    const irradiance = new T.CanvasTexture(mini);
    irradiance.colorSpace = T.SRGBColorSpace;
    irradiance.mapping = T.EquirectangularReflectionMapping;
    scene.environment = irradiance;
    scene.environmentIntensity = .51;
  });
}

// Derive pavement microroughness and normals from the actual photographic
// setts. This keeps the fine chipped edges in register with their colour.
export function makeWetPaving() {
  const material = new T.MeshStandardMaterial({color:0xc7c7d2,metalness:.07,roughness:.62,envMapIntensity:.88});
  const loader = new T.TextureLoader();
  const configure = tex => {
    tex.wrapS=tex.wrapT=T.RepeatWrapping;
    tex.repeat.set(68,68);
    tex.anisotropy=6;
    return tex;
  };
  const bounds = { normal: null, rough: null };
  loader.load(asset('wet-setts.webp'), tex => {
    configure(tex);
    tex.colorSpace=T.SRGBColorSpace;
    const size=512, bitmap=canvas(size), ctx=bitmap.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(tex.image,0,0,size,size);
    const raw=ctx.getImageData(0,0,size,size).data;
    const normals=new Uint8Array(size*size*4), param=new Uint8Array(size*size*4);
    const luminance=(x,y)=>{
      const i=4*((x+size)%size+size*((y+size)%size));
      return (.26*raw[i]+.57*raw[i+1]+.17*raw[i+2])/255;
    };
    for(let y=0;y<size;y++) for(let x=0;x<size;x++){
      const l=luminance(x,y), i=4*(x+y*size);
      const dx=(luminance(x+2,y)-luminance(x-2,y))*.92;
      const dy=(luminance(x,y+2)-luminance(x,y-2))*.92;
      const inv=1/Math.hypot(dx,dy,1);
      normals[i]=128-dx*inv*126;normals[i+1]=128+dy*inv*126;normals[i+2]=128+inv*126;normals[i+3]=255;
      const r=170-74*Math.min(1,Math.max(0,(l-.12)*1.8));
      param[i]=param[i+1]=param[i+2]=r;param[i+3]=255;
    }
    const dataTex=array=>{
      const t=new T.DataTexture(array,size,size);
      t.flipY=true;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;
      t.needsUpdate=true;
      return configure(t);
    };
    material.map=tex;
    bounds.normal=material.normalMap=dataTex(normals);
    bounds.rough=material.roughnessMap=dataTex(param);
    material.normalScale.set(.74,.74);
    material.roughness=.84;
    material.needsUpdate=true;
  });
  return {material, bounds};
}

// Camera-relative highlights are anchored to each physical lamp. Wet stone
// microfacets interrupt the reflected streak instead of painting a flat disc.
export function addLanternReflections(scene, lamps, paving, snowMask) {
  const uniforms={normalField:{value:null},snowMask:{value:snowMask},ready:{value:0}};
  const surface=new T.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`
      attribute vec2 lightCentre;
      varying vec3 groundPosition;
      varying vec2 centre;
      void main(){
        centre=lightCentre;
        vec4 p=instanceMatrix*vec4(position,1.);
        groundPosition=p.xyz;
        gl_Position=projectionMatrix*viewMatrix*p;
      }`,
    fragmentShader:`
      varying vec3 groundPosition;varying vec2 centre;
      uniform sampler2D normalField;uniform sampler2D snowMask;uniform float ready;
      void main(){
        vec2 rel=groundPosition.xz-centre;
        float range=length(rel);
        vec2 uv=vec2(groundPosition.x,-groundPosition.z)*(68./128.)+.5;
        vec2 slope=(ready>.5?texture2D(normalField,uv).rg-.5:vec2(0.));
        vec3 normal=normalize(vec3(-slope.x*1.8,1.,slope.y*1.8));
        vec3 toEye=normalize(cameraPosition-groundPosition);
        vec3 toBulb=normalize(vec3(-rel.x,3.58,-rel.y));
        float nDotH=max(0.,dot(normal,normalize(toBulb+toEye)));
        float lum=(pow(nDotH,31.)*.10+pow(nDotH,125.)*.32+pow(nDotH,480.)*.66)
                   *3.8/(1.+range*.29)*(1.-smoothstep(9.,14.,range));
        float grazing=1.-max(0.,dot(normal,toEye));
        float groundLight=.038*exp(-range*range*.14);
        float snowCover=texture2D(snowMask,vec2(groundPosition.x,-groundPosition.z)/128.+.5).r;
        float intensity=(lum*(.5+.5*grazing)*(1.-snowCover*.94)+groundLight);
        gl_FragColor=vec4(vec3(1.,.46,.13),min(1.,intensity));
        #include <colorspace_fragment>
      }`
  });
  const g = new T.PlaneGeometry(28,28).rotateX(-Math.PI/2);
  const centers=[];
  const patches=new T.InstancedMesh(g,surface,lamps.length);
  for(let i=0;i<lamps.length;i++){
    const [x,z]=lamps[i];
    centers.push(x+.63,z);
    patches.setMatrixAt(i,new T.Matrix4().makeTranslation(x+.63,.041,z));
  }
  g.setAttribute('lightCentre',new T.InstancedBufferAttribute(new Float32Array(centers),2));
  patches.renderOrder=2;
  patches.computeBoundingSphere();
  scene.add(patches);
  return () => {
    if(paving.bounds.normal&&!uniforms.ready.value){
      uniforms.normalField.value=paving.bounds.normal;uniforms.ready.value=1;
    }
  };
}

function boughAtlas(random) {
  const c=canvas(256,256), p=c.getContext('2d');
  p.lineCap='round';p.lineJoin='round';
  const stroke=(x0,y0,x1,y1,width,col)=>{
    p.lineWidth=width;p.strokeStyle=col;p.beginPath();p.moveTo(x0,y0);p.lineTo(x1,y1);p.stroke();
  };
  const pine=['#374d46','#53695a','#3b594f','#62735b','#758372'];
  const snow=['#f1f0eb','#d0dbe6','#aebfca','#dce6eb'];
  const pick=colors=>colors[Math.floor(random()*colors.length)];
  function twig(ax,ay,bx,by,width,needles) {
    stroke(ax,ay,bx,by,width,'#485043');
    const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),tx=dx/len,ty=dy/len;
    for(let i=0;i<needles;i++){
      const f=i/needles, baseX=ax+dx*f,baseY=ay+dy*f;
      for(const sign of [-1,1]){
        const reach=(4+random()*7)*(1-f*.7);
        const advance=3+random()*6;
        stroke(baseX,baseY,baseX+tx*advance-ty*reach*sign,baseY+ty*advance+tx*reach*sign,1+random()*1.4,pick(pine));
      }
      if(i%2===0&&random()<.50){
        const dx0=random()*5-2.5,dy0=random()*3;
        p.fillStyle=pick(snow);
        p.beginPath();p.ellipse(baseX+dx0,baseY-dy0,1.9+random()*3.3,.8+random()*1.55,-.18,0,2*Math.PI);p.fill();
      }
    }
  }
  twig(128,245,126,15,3,65);
  for(let i=0;i<17;i++){
    const f=i/17,by=232-207*f,reach=88*Math.pow(Math.sin(.38+f*2.65),.65)*(1-.28*f);
    for(const sign of [-1,1]){
      const ey=by-(32+18*(1-f)),ex=127+sign*reach*(.78+.23*random());
      twig(127,by,ex,ey,2.1,22);
      for(let j=1;j<7;j++){
        const a=j/7,bx=127+(ex-127)*a,yy=by+(ey-by)*a;
        twig(bx,yy,bx+sign*(9+7*random()),yy-12-random()*11,1.6,6);
      }
    }
  }
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}

export function addEvergreenNeedles(scene, random, x,z,height,radius) {
  const texture=boughAtlas(random), positions=[], colors=[], uvs=[], indices=[];
  function spray(a,b,halfWidth,roll,brightness) {
    const start=new T.Vector3(...a), end=new T.Vector3(...b);
    const d=end.clone().sub(start).normalize();
    const across=new T.Vector3(-d.z,0,d.x).normalize().applyAxisAngle(d,roll).multiplyScalar(halfWidth);
    const mid=start.clone().lerp(end,.50);mid.y+=halfWidth*.14;
    const base=positions.length/3;
    const pieces=[[start,0,.24],[mid,.51,1],[end,1,.38]];
    for(const [p,v,width] of pieces){
      for(const [side,u] of [[-1,0],[1,1]]){
        const q=p.clone().addScaledVector(across,side*width);
        positions.push(q.x,q.y,q.z);uvs.push(u,v);colors.push(brightness,brightness,brightness);
      }
    }
    indices.push(base,base+2,base+1,base+1,base+2,base+3,base+2,base+4,base+3,base+3,base+4,base+5);
  }
  const levels=height>20?49:27;
  for(let j=0;j<levels;j++){
    const f=j/levels,level=height*(.068+.90*f),levelRadius=radius*Math.pow(1-f,.79);
    const count=Math.round(13+11*(1-f)),offset=random()*2*Math.PI;
    for(let n=0;n<count;n++){
      const angle=offset+n*2*Math.PI/count+(random()-.5)*.14;
      const reach=levelRadius*(.83+.20*random()),drop=.18+reach*.12;
      const local=(along,side,y)=>[x+Math.cos(angle)*along-Math.sin(angle)*side,level+y,z+Math.sin(angle)*along+Math.cos(angle)*side];
      const span=Math.max(.15,reach*.19);
      for(let k=0;k<3;k++){
        const t=.16+k*.22,h=.03+Math.sin(t*Math.PI)*.15-t*drop;
        for(const sign of [-1,1]){
          const endF=t+.30+random()*.12;
          spray(local(t*reach,0,h),local(endF*reach,sign*span*(1.5-t),h-.10-drop*.22),
            span*(.83-.37*t),sign*(.28+random()*.55),.75+random()*.27);
        }
      }
      if(j<levels*.67){
        for(const sign of [-1,1]){
          const from=local(reach*.49,span*.38*sign,-drop*.25);
          const to=local(reach*.85,span*sign,-drop-.33);
          spray(from,to,span*.66,sign*(.88+random()*.55),.66+random()*.25);
        }
      }
      spray(local(reach*.65,0,.01-drop*.43),local(reach*1.10,0,-drop),span*.61,random()*.6-.3,.80+random()*.21);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();
  const m=new T.MeshLambertMaterial({map:texture,side:T.DoubleSide,vertexColors:true,alphaTest:.26,color:0xd6dcd5});
  const mesh=new T.Mesh(g,m);scene.add(mesh);return mesh;
}

// A single tree remains fully volumetric at walking distance. The distant
// camera view uses the photographic crown, which preserves its small needles
// at subpixel sizes while the surrounding lights and planter stay in 3D.
export function addFirDistanceModel(scene, realTree, height, width) {
  const loader=new T.TextureLoader();
  loader.load(asset('fir-portrait.webp'), source=>{
    const pic=source.image;
    const small=canvas(128,Math.max(1,Math.round(128*pic.height/pic.width)));
    const ctx=small.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(pic,0,0,small.width,small.height);
    const bytes=ctx.getImageData(0,0,small.width,small.height).data;
    let left=small.width,right=-1,top=small.height,bottom=-1,transparent=0;
    for(let y=0;y<small.height;y++) for(let x=0;x<small.width;x++){
      if(bytes[4*(y*small.width+x)+3]<35){transparent++;continue;}
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<left||transparent<small.width*small.height*.13){source.dispose();return;}
    const sx=Math.max(0,(left-1)*pic.width/small.width),sy=Math.max(0,(top-1)*pic.height/small.height);
    const ex=Math.min(pic.width,(right+2)*pic.width/small.width),ey=Math.min(pic.height,(bottom+2)*pic.height/small.height);

    source.repeat.set((ex-sx)/pic.width,(ey-sy)/pic.height);
    source.offset.set(sx/pic.width,1-ey/pic.height);
    source.colorSpace=T.SRGBColorSpace;
    const material=new T.SpriteMaterial({map:source,alphaTest:.23,transparent:false,fog:true});
    const cutout=new T.Sprite(material);
    cutout.scale.set(width,height,1);cutout.position.set(0,.12,0);cutout.center.set(.5,0);
    const lod=new T.LOD();
    const near=new T.Group();
    for(const mesh of realTree)near.add(mesh);
    lod.addLevel(near,0);
    lod.addLevel(cutout,Math.max(42,height*1.35),.10);
    scene.add(lod);
  });
}
