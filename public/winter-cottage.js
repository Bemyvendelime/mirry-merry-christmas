import {cottageFrame} from './room-space.js';
import * as THREE from 'three';

// Both renderers consume these convex faces. World axes are metres, Y up.
// A local facade faces +Z. On the inside the same convention faces the room.
const TAU = 2 * Math.PI;
const palette = {
  oak:'#996944', oakDark:'#654536', oakLight:'#c18c5c', walnut:'#52392f',
  cream:'#dfc299', paper:'#f2d5a3', sage:'#5b7362', fir:'#315747',
  berry:'#af4c44', gold:'#c79552', glass:'#ffcd80', snow:'#e3e9ed', frost:'#b9c8d6'
};
const P = palette;
const tintCache = new Map();
function tint(color, amount) {
  const key = color + amount;
  if (tintCache.has(key)) return tintCache.get(key);
  const rgb = [1,3,5].map(i => Math.round(Math.min(255, parseInt(color.slice(i, i+2),16)*amount)));
  const out = '#' + rgb.map(c => c.toString(16).padStart(2,'0')).join('');
  tintCache.set(key,out);
  return out;
}

function atelier(faces, transform = p => p) {
  function face(points,color,emissive=false,detail=false) {
    faces.push({points:points.map(transform),color,emissive,detail});
  }
  function frame(x,y,z,angle=0) {
    const s=Math.sin(angle), c=Math.cos(angle);
    return atelier(faces,p=>transform([x+c*p[0]+s*p[2],y+p[1],z-s*p[0]+c*p[2]]));
  }
  function panel(x,y,z,w,h,color,emissive=false,detail=false) {
    face([[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z]],color,emissive,detail);
  }
  function box(x,y,z,w,h,d,color,detail=false) {
    const a=x-w/2,b=x+w/2,l=y-h/2,u=y+h/2,f=z+d/2,k=z-d/2;
    face([[a,l,f],[b,l,f],[b,u,f],[a,u,f]],color,false,detail);
    face([[b,l,k],[a,l,k],[a,u,k],[b,u,k]],tint(color,.91),false,detail);
    face([[b,l,f],[b,l,k],[b,u,k],[b,u,f]],tint(color,.9),false,detail);
    face([[a,l,k],[a,l,f],[a,u,f],[a,u,k]],tint(color,.84),false,detail);
    face([[a,u,f],[b,u,f],[b,u,k],[a,u,k]],tint(color,1.09),false,detail);
    face([[a,l,k],[b,l,k],[b,l,f],[a,l,f]],tint(color,.75),false,detail);
  }
  // Flat ribbon on a vertical plane, useful for timber braces, wires and trim.
  function line(x0,y0,x1,y1,z,width,color,detail=false) {
    const dx=x1-x0,dy=y1-y0,k=width*.5/(Math.hypot(dx,dy)||1),a=-dy*k,b=dx*k;
    face([[x0-a,y0-b,z],[x1-a,y1-b,z],[x1+a,y1+b,z],[x0+a,y0+b,z]],color,false,detail);
  }
  function jewel(x,y,z,w,h,color,emissive=false,detail=true) {
    face([[x-w,y,z],[x,y-h,z],[x+w,y,z],[x,y+h,z]],color,emissive,detail);
  }
  function disc(x,y,z,r,color,emissive=false,n=10) {
    for(let i=0;i<n;i++) {
      const a=i*TAU/n,b=(i+1)*TAU/n;
      face([[x,y,z],[x+r*Math.cos(a),y+r*Math.sin(a),z],[x+r*Math.cos(b),y+r*Math.sin(b),z]],color,emissive,true);
    }
  }
  function cylinder(x,y,z,rb,rt,h,color,n=8,detail=false) {
    for(let i=0;i<n;i++) {
      const a=TAU*i/n,b=TAU*(i+1)/n;
      const bot=t=>[x+rb*Math.sin(t),y,z+rb*Math.cos(t)],top=t=>[x+rt*Math.sin(t),y+h,z+rt*Math.cos(t)];
      const col=tint(color,.91+.09*Math.cos(a-.5));
      if(rt>0) {
        face([bot(a),bot(b),top(b),top(a)],col,false,detail);
        face([[x,y+h,z],top(a),top(b)],tint(color,1.08),false,detail);
      } else face([bot(a),bot(b),[x,y+h,z]],col,false,detail);
    }
  }
  return {face,frame,panel,box,line,jewel,disc,cylinder};
}

function wreath(b,x,y,z,r) {
  for(let i=0;i<15;i++){
    const a=TAU*i/15, next=a+TAU/15;
    const px=x+r*Math.cos(a), py=y+r*Math.sin(a);
    b.line(px,py,x+r*Math.cos(next),y+r*Math.sin(next),z,.15*r+.045,i%2?P.fir:'#497058',true);
    b.jewel(px+.04*Math.cos(a),py+.04*Math.sin(a),z+.006,.058,.085,i%3?'#608067':'#375942');
    if(i%3===1)b.jewel(px,py,z+.01,.03,.031,P.berry);
  }
  b.face([[x,y-r,z+.02],[x-.14,y-r+.05,z+.02],[x-.13,y-r-.07,z+.02]],P.berry,false,true);
  b.face([[x,y-r,z+.02],[x+.14,y-r-.07,z+.02],[x+.14,y-r+.05,z+.02]],P.berry,false,true);
}

function stringLights(b,width,y,z,bow,count) {
  const height = t => y - bow*4*t*(1-t);
  for(let i=0;i<count;i++) {
    const t=i/count, n=(i+1)/count, x=(t-.5)*width;
    b.line(x,height(t),(n-.5)*width,height(n),z,.019,'#4c4b41',true);
    b.line(x,height(t),x,height(t)-.065,z,.021,P.walnut,true);
    b.jewel(x,height(t)-.11,z,.048,.068,i%4?'#ffe4ab':'#ffc47a',true);
  }
}

function pine(b,x,z,height,decorated=false) {
  b.cylinder(x,.04,z,height*.12,height*.098,height*.21,'#986d4f',8);
  for(let i=0;i<4;i++) {
    const rad=height*(.26-i*.047), y=height*(.16+i*.17);
    const h=height*(.37-i*.035);
    for(let j=0;j<10;j++) {
      const a=j*TAU/10+i*.38,c=a+TAU/10,m=(a+c)/2;
      const edge = (t,r,off) => [x+Math.sin(t)*r,y+off,z+Math.cos(t)*r];
      const tip=[x,y+h,z];
      b.face([edge(a,rad*.91,.05*h),edge(m,rad,-.095*h),tip],j%2?P.fir:'#3a6451');
      b.face([edge(m,rad,-.095*h),edge(c,rad*.91,.05*h),tip],j%3?'#486c56':'#577961');
      if(!decorated && j%3!==1)b.face([edge(a,rad*.63,h*.35),edge(m,rad*.61,h*.29),tip],j%2?P.frost:P.snow,false,true);
      if(decorated && j%3===1){const [lx,ly,lz]=edge(m,rad+.015,h*.02);b.jewel(lx,ly,lz,.055,.075,j%2?P.berry:P.gold,true);}
    }
  }
  if(decorated)b.jewel(x,height*.995,z,.12,.16,'#ffe5a4',true);
}

function outerWindow(b,x,y,w,h,shutters=true) {
  b.box(x,y,.035,w+.24,h+.24,.09,P.walnut);
  b.panel(x,y,.087,w,h,'#d9a366',true);
  b.panel(x,y+.12*h,.093,w*.90,h*.62,'#ffdb98',true);
  for(const side of [-1,1]) {
    const a=x+side*w*.5;
    b.face([[a,y+h*.5,.10],[a-side*w*.31,y+h*.5,.10],[a-side*w*.10,y-.07*h,.10],[a,y-.15*h,.10]],'#e6b37d');
    if(shutters){b.panel(x+side*(w*.5+.23),y,.055,.26,h,'#526d61');
      for(let i=0;i<5;i++)b.panel(x+side*(w*.5+.23),y+h*(i/5-.38),.06,.218,.026,'#819079',false,true);}
  }
  b.panel(x,y,.113,.058,h,P.walnut);b.panel(x,y-.06,.115,w,.05,P.walnut);
  b.box(x,y-h/2-.09,.12,w+.36,.12,.31,'#936543');
  b.box(x-.015,y-h/2-.016,.12,w+.26,.046,.29,P.snow,true);
}

function houseDoor(b,inside=false) {
  const doorZ=.045,doorBottom=inside?0:.16, height=2.23;
  b.box(0,doorBottom+height/2,.012,1.48,height+.1,.10,P.walnut);
  b.panel(0,doorBottom+height/2,doorZ+.03,1.22,height,inside?'#678272':'#476b5b');
  b.panel(0,doorBottom+.81,.083,.98,1.27,'#77907a');
  b.panel(0,doorBottom+.81,.084,.85,1.11,inside?'#536d5d':'#3b5b4e');
  b.panel(0,doorBottom+1.77,.084,.77,.57,'#4e3e35');
  b.panel(0,doorBottom+1.77,.087,.66,.47,inside?'#7295a0':'#ffcb7f',!inside);
  b.panel(0,doorBottom+1.77,.09,.04,.48,P.oakDark);
  b.panel(0,doorBottom+1.77,.091,.68,.03,P.oakDark);
  wreath(b,0,doorBottom+1.13,.105,.255);
  b.panel(.432,doorBottom+.90,.10,.105,.2,P.walnut);b.jewel(.43,doorBottom+.92,.113,.053,.061,P.gold,false);
}

function exterior() {
  const faces=[],b=atelier(faces).frame(cottageFrame.x,0,cottageFrame.z,cottageFrame.angle);
  b.box(0,.23,0,6.4,.44,5.7,'#777579');
  b.box(0,1.78,0,6.28,2.8,5.57,'#d3aa82');
  const front=b.frame(0,0,2.85),back=b.frame(0,0,-2.85,Math.PI);
  const sides=[b.frame(3.18,0,0,Math.PI/2),b.frame(-3.18,0,0,-Math.PI/2)];
  for(const [index,w] of [front,back,...sides].entries()) {
    const span=index<2?6.4:5.7;
    w.panel(0,.71,0,span,.56,'#927053');
    for(let i=0;i<3;i++)w.panel(0,.50+i*.19,.004,span,.025,'#7b604e',false,true);
    for(const x of [-span/2+.075,span/2-.075])w.box(x,1.75,.035,.18,2.88,.11,'#674d40');
    w.box(0,3.08,.032,span,.2,.14,P.oakDark);
    if (index<2){
      w.face([[-3.14,3.11,.001],[3.14,3.11,.001],[0,5.22,.001]],'#dda982');
      w.panel(0,4.1,.021,.12,1.91,P.oakDark);
      for(const side of [-1,1])w.line(0,3.13,side*1.85,4.0,.021,.115,P.oakDark);
      w.jewel(0,4.34,.034,.30,.48,P.walnut,false,false);
      w.jewel(0,4.34,.039,.20,.34,'#ffd888',true,false);
      w.panel(0,4.34,.046,.035,.64,P.oakDark,true,true);
    }
  }
  houseDoor(front);
  for(const s of [-1,1]){outerWindow(front,s*1.92,1.77,1.1,1.12);outerWindow(back,s*1.5,1.72,1.23,1.03);}
  for(const s of sides) {outerWindow(s,-1.08,1.72,1.28,1.12);outerWindow(s,1.16,1.72,1.05,.94,false);}
  // A broad steep roof, broken lines of slate and powder, and scalloped eaves.
  for(const side of [-1,1]){
    const slope=(x,z,lift=0)=>[side*x,5.46-x*.676+lift,z];
    b.face([slope(0,-3.29),slope(0,3.29),slope(3.54,3.29),slope(3.54,-3.29)],'#626777');
    for(let row=0;row<5;row++){
      for(let col=0;col<8;col++){
        const z=-3.27+col*.82, r=.07+row*.685;
        const wave=Math.sin(row*11+col*4.17)*.10;
        b.face([slope(r,z,.032),slope(r,z+.806,.033),slope(r+.57+wave,z+.77,.034),slope(r+.61+wave,z+.04,.035)],
          ['#d5deea','#e5eaf0','#c6d4e2','#dce5ec'][(col+row*3+(side===1?2:0))%4],false,true);
      }
    }
    const eaveX=side*3.54;
    b.box(eaveX,2.99,0,.145,.21,6.71,'#6c4d3e');
    for(let i=0;i<10;i++){
      const z=-3.33+i*.665, h=.12+.12*(.5+.5*Math.sin(i*5+side));
      b.face([[eaveX+side*.08,3.12,z],[eaveX+side*.08,3.12,z+.665],[eaveX+side*.08,3.03-h,z+.33]],P.frost,false,true);
    }
    for(const z of [-3.31,3.31]){
      const end=b.frame(0,0,z);
      end.line(0,5.43,eaveX,3.02,0,.20,P.oakDark);
      end.line(0,5.51,eaveX,3.11,.002,.10,P.snow);
    }
  }
  b.box(0,5.48,0,.17,.12,6.75,P.snow);
  b.box(-1.72,4.99,-1.38,.70,1.6,.79,'#9e6658');
  for(let i=0;i<6;i++) {
    b.box(-1.72,4.36+i*.241,-1.38,.707,.025,.80,'#c49780',true);
    b.panel(-1.72+(i%2?.13:-.12),4.465+i*.241,-.981,.027,.20,'#c49780',false,true);
  }
  b.box(-1.72,5.84,-1.38,.89,.18,.95,P.walnut);b.box(-1.72,5.96,-1.38,.94,.11,1.0,P.snow);
  b.box(-1.72,6.019,-1.38,.51,.015,.57,'#443e41');
  b.box(0,.106,3.01,1.87,.20,.84,'#928787');b.box(0,.042,3.49,2.08,.075,.47,'#b5acaa');
  b.box(0,.215,3.0,1.45,.01,.43,P.berry);
  // A small snow-capped canopy projects over the door with open timber
  // brackets; it gives the entrance its own silhouette from the approach.
  for(const side of [-1,1]){
    const a=side*.96;
    front.face([[0,2.90,.02],[0,2.90,.61],[a,2.62,.61],[a,2.62,.02]],'#dce6eb');
    front.line(0,2.85,a,2.58,.61,.11,'#77523e');
    front.box(a,2.56,.31,.09,.09,.60,P.oak);
    const brace=front.frame(a,0,.0,Math.PI/2);
    brace.line(-.53,2.54,0,2.27,.0,.063,P.oakDark);
  }
  for(const s of [-1,1]){
    const win=s*1.92;
    for(let j=0;j<7;j++){
      const xx=win+(j-3)*.17,yy=1.142-.07*Math.sin(j*.91);
      front.jewel(xx,yy,.285,.135,.087,j%2?'#617d61':'#41654e',false,true);
      if(j%2===0)front.jewel(xx+.04,yy+.04,.29,.028,.027,P.berry);
    }
    for(let j=0;j<4;j++){
      const dx=s*(.44+j*.49), base=4.98-Math.abs(dx)*.65;
      front.line(dx,base,dx+s*.13,base-.135,.006,.036,'#c49775',true);
      front.line(dx+s*.13,base-.135,dx+s*.25,base-.135,.006,.036,'#c49775',true);
    }
    for(let j=0;j<5;j++){
      const a=s*(.98+j*.44);front.panel(a,.29,.001,.27,.038,j%2?'#999099':'#a29a98',false,true);
    }
  }
  stringLights(front,6.15,3.03,.19,.36,17);
  pine(b,2.76,3.16,1.53,false);
  b.box(-2.77,.32,3.12,.56,.54,.54,P.oakDark);
  b.box(-2.77,.61,3.12,.62,.075,.61,P.snow);
  for(let k=0;k<6;k++){
    const t=k/5,xx=-2.99+.43*t;
    front.line(-2.77,.64,xx,.71+.16*Math.sin(t*Math.PI),.30,.025,P.oakDark,true);
    front.jewel(xx,.75+.16*Math.sin(t*Math.PI),.302,.064,.073,k%2?P.fir:'#647b55');
    if(k%2)front.jewel(xx,.785+.16*Math.sin(t*Math.PI),.307,.024,.025,P.berry);
  }
  front.panel(-.91,1.72,.10,.24,.42,P.walnut);front.panel(-.91,1.72,.108,.16,.29,'#ffdf95',true);
  front.jewel(-.91,1.97,.11,.17,.105,P.gold);
  return faces;
}

function windowLandscape(w,x,y,width,height) {
  // A little winter landscape in each pane, with the painted hills, stars and
  // warm windows physically behind the sash and curtains in the room.
  const sill=y-height/2;
  w.box(x,y,.025,width+.27,height+.23,.09,P.oakDark);
  w.panel(x,y,.08,width,height,'#566f89',true);
  w.panel(x,y+height*.28,.085,width,height*.43,'#435675',true);
  const left=x-width*.5;
  for(let i=0;i<5;i++){
    const a=left+i*width/5,b=a+width/5,lo=sill+height*.32;
    const high=j=>lo+height*(.12+.16*Math.sin(j*1.8+x));
    w.face([[a,sill,.09],[b,sill,.09],[b,high(i+1),.09],[a,high(i),.09]],'#8dacc1',true);
    if(i%2){
      const px=a+width*.10,pz=.092,top=sill+height*(i===1?.59:.46);
      w.face([[px-width*.06,sill,pz],[px+width*.06,sill,pz],[px,top,pz]],'#546e78');
      w.jewel(a+width*.09,y+height*.31,.093,.021,.031,'#e5c896',true);
    }
  }
  w.disc(x+width*.32,y+height*.28,.09,.082,'#f4d3a2',true,8);
  w.panel(x,y,.108,.07,height,P.oakDark);w.panel(x,y-.13,.108,width,.057,P.oakDark);
  for(const s of [-1,1]){
    const a=x+s*(width*.5+.046);
    w.face([[a,y+height*.54,.125],[a-s*width*.29,y+height*.54,.125],[a-s*width*.09,y-.08*height,.125],[a,y-.19*height,.125]],'#ae6759');
    w.face([[a,y-.13*height,.126],[a-s*.10,y-.10*height,.126],[a-s*.18,sill-.04,.126],[a,sill-.02,.126]],'#9a5a4e');
    w.panel(a-s*.04,y-.11*height,.13,.15,.04,P.gold,false,true);
  }
  w.box(x,sill-.11,.15,width+.49,.11,.41,P.oak);
  w.box(x,y+height*.57,.15,width+.48,.07,.07,P.oakDark,true);
}

function rug(b,x,z,w,d) {
  const rect=(width,depth,y,color)=>b.face([[x-width/2,y,z+depth/2],[x+width/2,y,z+depth/2],[x+width/2,y,z-depth/2],[x-width/2,y,z-depth/2]],color);
  rect(w,d,.024,'#654c4b'); rect(w-.095,d-.095,.026,'#c79c71'); rect(w-.205,d-.205,.028,'#974f45');
  for(const s of [-1,1]){
    for(let i=0;i<10;i++){
      const xx=x+w*((i+.5)/10-.5),zz=z+s*(d/2-.24);
      b.face([[xx-.085,.030,zz],[xx,.030,zz+.11],[xx+.085,.030,zz],[xx,.030,zz-.11]],i%2?'#edcb91':'#dbab7f',false,true);
    }
  }
}

function chair(b,x,z,yaw) {
  const c=b.frame(x,0,z,yaw);
  c.box(0,.47,0,.62,.13,.61,P.oak);
  c.box(0,.555,0,.53,.05,.49,'#70806b');
  for(const side of [-1,1]){
    c.box(side*.245,.23,.219,.077,.45,.077,P.oakDark);
    c.box(side*.245,.51,-.233,.077,1.02,.077,P.oakDark);
  }
  c.box(0,.93,-.233,.60,.14,.09,'#946544');
  c.box(0,.83,-.236,.14,.16,.08,P.oak);
  c.box(0,.22,-.23,.49,.047,.05,P.oakDark,true);
}

function candle(b,x,y,z,h) {
  b.cylinder(x,y,z,.094,.074,.026,P.gold,8,true);
  b.cylinder(x,y+.026,z,.044,.044,h,'#edd4b0',7,true);
  for(const angle of [0,Math.PI/2])b.frame(x,y+.04+h,z,angle).jewel(0,.034,0,.029,.052,'#ffdf88',true);
}

function fireplace(b) {
  const x=3.91;
  b.box(x,.115,-4.32,2.73,.20,1.28,'#867a6f');
  b.box(x,1.18,-4.61,2.37,2.22,.85,'#b28365');
  const w=b.frame(x,0,-4.16);
  for(let row=0;row<7;row++){
    const yy=.31+row*.265;
    w.panel(0,yy,0,2.34,.018,'#93745e',false,true);
    for(let col=0;col<4;col++){
      const xx=-1.10+(col+.5*(row%2))*.59;
      if(xx<1.12)w.panel(xx,yy+.125,.001,.024,.23,'#93745e',false,true);
    }
  }
  w.panel(0,.94,.013,1.34,1.47,'#6c5347');w.panel(0,.9,.016,1.15,1.29,'#403431');
  w.panel(0,.48,.019,.99,.31,'#704332');
  for(let i=0;i<7;i++){
    const xx=(i-3)*.139, h=.53+.34*(.5+.5*Math.sin(i*2.6));
    w.face([[xx-.095,.45,.026],[xx+.144,.45,.026],[xx+.027,h+.29,.026]],i%2?'#ffc276':'#e98548',true);
    w.face([[xx-.069,.45,.030],[xx+.084,.45,.030],[xx+.011,h*.59+.31,.030]],'#ffda8a',true);
  }
  w.line(-.46,.37,.33,.44,.051,.119,'#704838');
  w.line(-.22,.45,.46,.37,.054,.112,'#69412f');
  for(const [xx,yy] of [[.35,.44],[-.22,.45],[.45,.37]]){
    w.disc(xx,yy,.061,.054,'#987052',false,7);
    w.disc(xx,yy,.062,.03,'#714c36',false,6);
  }
  b.box(x,2.14,-4.53,2.71,.17,1.02,P.walnut);
  b.box(x,2.26,-4.52,2.63,.10,.98,P.oak);
  b.box(x,2.96,-4.86,1.43,1.32,.34,'#c69474');
  w.disc(0,2.89,-.475,.33,P.oakDark,false,16);
  w.disc(0,2.89,-.462,.257,'#edce9e',false,16);
  w.line(0,2.89,-.10,3.00,-.452,.023,P.walnut,true);
  w.line(0,2.89,.12,2.89,-.451,.021,P.walnut,true);
  for(const s of [-1,1])candle(b,x+s*.95,2.32,-4.31,s<0?.25:.34);
  for(let i=0;i<9;i++)w.jewel((i-4)*.249,2.04-.10*Math.cos((i-4)*.36),.08,.18,.094,i%2?P.fir:'#47705b',false);
  for(const [sx,color] of [[-.68,'#a94f45'],[.66,'#718574']]){
    w.panel(sx,1.80,.09,.205,.36,color);
    w.panel(sx-.057,1.64,.09,.32,.104,color);w.panel(sx,1.96,.092,.234,.075,P.paper);
  }
}

function bookcase(b) {
  const x=-4.22,z=-4.60;
  b.box(x,1.24,z,2.33,2.42,.50,'#76523d');
  const w=b.frame(x,0,-4.33);
  w.panel(0,1.32,0,2.09,2.00,'#584338');
  const spines=['#899082','#a45e4e','#c2986d','#8d7b83','#737e87','#ac8554'];
  for(let row=0;row<2;row++){
    const y=.91+row*.60;
    for(let i=0;i<(row?6:10);i++){
      const pos=-.91+i*.151,h=.32+.14*(.5+.5*Math.sin(i*2+row));
      w.panel(pos,y+h/2,.035,.127,h,spines[(i*5+2*row)%spines.length]);
      w.panel(pos,y+.071,.040,.105,.014,P.paper,false,true);
    }
    w.box(0,y-.035,.04,2.31,.082,.20,P.oakLight);
  }
  for(const s of [-1,1]){
    w.panel(s*.54,.47,.028,.94,.61,'#937154');
    w.panel(s*.54,.47,.034,.77,.46,'#7b5c44');
    w.jewel(s*.22,.48,.043,.035,.045,P.gold);
  }
  w.box(0,2.46,.0,2.45,.12,.59,P.oakDark);
  w.box(.62,1.53,.065,.48,.067,.22,P.berry,true);w.box(.60,1.60,.04,.43,.073,.22,'#a39367',true);
  wreath(w,0,2.96,-.56,.268);
}

function interior() {
  const faces=[],b=atelier(faces),w=12.4,d=10.2;
  // Tongue-and-groove boards are laid in staggered lengths all the way to the walls.
  b.box(0,-.075,0,w,.12,d,'#745741');
  const boards=['#ad8056','#bd9064','#ad825f','#bf936b','#b48860','#b98c60'];
  for(let row=0;row<16;row++) {
    const z=-d/2+(row+.5)*d/16;
    let left=-w/2, index=0;
    while(left<w/2-.01){
      const right=Math.min(w/2,left+((index===0&&row%3!==0)?1.33+row%3*.42:2.52+(row%3)*.16));
      const z0=z-d/32+.005,z1=z+d/32-.005,a=left+.006,c=right-.006;
      b.face([[a,0,z1],[c,0,z1],[c,0,z0],[a,0,z0]],boards[(row*5+index)%boards.length]);
      if((row+index)%4===0 && c-a>.6){const x=(a+c)/2;b.face([[x-.26,.002,z],[x,.002,z+.013],[x+.29,.002,z],[x+.02,.002,z-.008]],'#967052',false,true);}
      left=right;index++;
    }
  }
  const back=b.frame(0,0,-5.10),front=b.frame(0,0,5.10,Math.PI),left=b.frame(-6.20,0,0,Math.PI/2),right=b.frame(6.20,0,0,-Math.PI/2);
  [back,front,left,right].forEach((wall,index)=>{
    const span=index<2?w:d;
    wall.panel(0,1.97,-.035,span,3.94,index===2?'#cba880':'#dabd98');
    wall.panel(0,.52,-.021,span,1.04,'#78907a');
    const count=Math.ceil(span/.56);
    for(let i=0;i<=count;i++)wall.panel((i/count-.5)*span,.51,-.012,.032,.99,'#627b66',false,true);
    wall.box(0,.11,.012,span,.17,.11,'#705441');
    wall.box(0,1.045,.015,span,.095,.13,'#997453');
    wall.box(0,3.55,.052,span,.14,.16,P.oakDark);
    for(const side of [-1,1])wall.box(side*(span/2-.11),1.81,.025,.18,3.62,.14,'#865c44');
  });
  for(const end of [front,back]){
    end.face([[-6.2,3.91,-.035],[6.2,3.91,-.035],[0,4.64,-.035]],'#bd9873');
    end.line(-6.15,3.96,0,4.67,-.018,.075,'#927152');
    end.line(0,4.67,6.15,3.96,-.018,.075,'#927152');
  }
  for(const x of [-3.80,0,3.80]){
    b.box(x,3.64,0,.14,.17,10.19,'#8d6a50');
    for(const z of [-4.98,4.98])b.box(x,3.41,z,.20,.41,.24,'#8e674b',true);
  }
  // The roof's underside rises above the beams. Slate-blue clerestory panes
  // frame a few stars directly overhead while retaining the warm timber room.
  const ceilingStart=faces.length;
  const vaultY=x=>4.62-Math.abs(x)*.116;
  for(const side of [-1,1]){
    for(let course=0;course<10;course++){
      const a=side*6.20*course/10,c=side*6.20*(course+1)/10;
      b.face([[a,vaultY(a),-5.11],[c,vaultY(c),-5.11],[c,vaultY(c),5.11],[a,vaultY(a),5.11]],
        ['#8f7158','#9a7c60','#a08266','#95785d'][course%4]);
      for(const z of [-4.34,-1.5,1.5,4.34])b.face([[a,vaultY(a)-.08,z-.057],[c,vaultY(c)-.08,z-.057],
        [c,vaultY(c)-.08,z+.057],[a,vaultY(a)-.08,z+.057]],'#785741');
    }
  }
  b.box(0,4.55,0,.15,.13,10.21,'#75513f');
  const skyPane=(x0,x1,z0,z1,lift,color,glow)=>b.face([[x0,vaultY(x0)-lift,z0],[x1,vaultY(x1)-lift,z0],
    [x1,vaultY(x1)-lift,z1],[x0,vaultY(x0)-lift,z1]],color,glow);
  skyPane(.55,2.65,-1.32,1.30,.012,'#5b4c47',false);
  skyPane(.68,2.52,-1.20,1.18,.021,'#60788b',true);
  skyPane(1.55,1.64,-1.20,1.18,.026,'#705944',false);
  skyPane(.68,2.52,-.05,.05,.029,'#705944',false);
  for(let i=0;i<6;i++){
    const x=.82+(i%3)*.59,z=-.77+Math.floor(i/3)*1.49+(i%2)*.12;
    skyPane(x,x+.022,z,z+.024,.032,'#efd9ac',true);
  }
  for(let i=ceilingStart;i<faces.length;i++)faces[i].ceiling=true;
  windowLandscape(back,-.52,2.08,3.52,1.53);
  windowLandscape(left,1.48,2.12,2.36,1.39);
  windowLandscape(right,-.88,2.16,1.98,1.37);
  windowLandscape(front,-3.54,2.08,2.14,1.29);
  houseDoor(front,true);
  front.box(0,2.37,.095,1.63,.11,.24,P.oak);
  front.box(3.57,1.77,.07,1.78,.12,.16,P.oakDark);
  for(let i=0;i<4;i++)front.jewel(3.0+i*.39,1.70,.18,.045,.078,P.gold);
  front.panel(3.34,1.28,.13,.21,.72,'#ac6159');front.panel(3.73,1.32,.13,.30,.61,P.sage);
  rug(b,-2.69,-.33,4.69,4.16);
  const tx=-2.60,tz=-.34;
  b.box(tx,.92,tz,1.63,.15,2.66,P.oak);
  for(const side of [-1,1])for(const end of [-1,1])b.box(tx+side*.62,.43,tz+end*1.13,.13,.86,.13,P.oakDark);
  b.box(tx,.32,tz,.11,.09,2.28,P.oakDark);
  b.box(tx,1.008,tz,.42,.016,2.65,'#ac6258');
  for(const side of [-1,1])for(const j of [-1,0,1])chair(b,tx+side*1.23,tz+j*.88,side<0?Math.PI/2:-Math.PI/2);
  for(let i=0;i<4;i++){
    const x=tx+(i%2?-.58:.55),z=tz+Math.floor(i/2)*1.23-.63;
    b.cylinder(x,1.008,z,.135,.128,.024,'#dcc9a5',10,true);
    b.cylinder(x,1.031,z,.075,.08,.108,i%2?'#497466':'#a46058',9,true);
    b.cylinder(x,1.142,z,.058,.059,.004,'#5d4538',9,true);
  }
  candle(b,tx,1.02,tz,.22);candle(b,tx+.10,1.02,tz+.31,.14);
  bookcase(b);fireplace(b);
  // A low wrapping bench beside the east wall leaves the centre and entrance open.
  b.box(5.32,.56,1.98,1.04,.15,2.00,P.oak);
  for(const end of [-1,1])b.box(5.32,.27,1.98+end*.78,.77,.54,.13,P.oakDark);
  for(const [offset,h,color] of [[-.42,.33,'#b26b59'],[.24,.22,'#8c9a79']]){
    b.box(5.31,.644+h/2,1.98+offset,.46,h,.39,color);
    b.box(5.31,.653+h,1.98+offset,.083,.012,.40,P.paper,true);
    b.box(5.31,.65+h/2,2.18+offset,.08,h,.012,P.paper,true);
  }
  pine(b,4.84,3.93,2.14,true);
  // Faceted enamel pendant shade over the table, warm diffuser just below the rim.
  b.cylinder(tx,2.95,tz,.027,.027,.69,'#5b4940',6,true);
  b.cylinder(tx,2.67,tz,.40,.12,.28,'#54715e',12);
  for(let i=0;i<12;i++){
    const angle=i*TAU/12,next=(i+1)*TAU/12;
    b.face([[tx,2.657,tz],[tx+.37*Math.sin(next),2.657,tz+.37*Math.cos(next)],[tx+.37*Math.sin(angle),2.657,tz+.37*Math.cos(angle)]],'#ffe3a0',true);
  }
  const garland=back.frame(-.52,0,.19);
  stringLights(garland,4.55,3.29,0,.29,16);
  return faces;
}

export const cottageExterior = exterior();
export const cottageInterior = interior();

// In metres, before applying a visitor's collision radius. The gaps either side
// of the dining group are intentional, as is the broad path from door to hearth.
export const cottageObstacles = [
  {minX:-4.14,maxX:-1.05,minZ:-1.67,maxZ:.99},
  {minX:2.54,maxX:5.28,minZ:-5.00,maxZ:-3.68},
  {minX:-5.43,maxX:-3.01,minZ:-4.97,maxZ:-4.21},
  {minX:4.80,maxX:5.84,minZ:.98,maxZ:2.98},
  {minX:4.32,maxX:5.37,minZ:3.41,maxZ:4.47}
];

export function addCottageGeometry(scene,faces) {
  const group=new THREE.Group();
  group.name=faces===cottageInterior?'Cottage interior':'Snowy workshop cottage';
  const color=new THREE.Color();
  for(const emissive of [false,true]){
    const positions=[],colors=[];
    for(const face of faces){
      if(face.emissive!==emissive)continue;
      color.set(face.color);
      for(let i=1;i+1<face.points.length;i++)for(const point of [face.points[0],face.points[i],face.points[i+1]]){
        positions.push(...point);colors.push(color.r,color.g,color.b);
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const params={vertexColors:true,side:THREE.DoubleSide};
    const material=emissive?new THREE.MeshBasicMaterial({...params,toneMapped:false}):new THREE.MeshStandardMaterial({...params,roughness:.81});
    const mesh=new THREE.Mesh(geometry,material);mesh.name=emissive?'Windows, flame and lamplight':'Woodwork and furnishings';
    mesh.castShadow=!emissive;mesh.receiveShadow=!emissive;group.add(mesh);
  }
  scene.add(group);
  return group;
}
