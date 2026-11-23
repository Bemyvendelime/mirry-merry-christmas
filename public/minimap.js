import {plots} from './layout.js';

// World X points east, world Z points south. North stays at the top.
export function createMinimap(canvas) {
  const ctx=canvas.getContext('2d');
  const scale=canvas.width/87, center=canvas.width/2;
  const roads=new Path2D(), links=new Path2D();
  for(const side of [-1,1]){
    roads.moveTo(side*25+16,-8);
    roads.ellipse(side*25,-8,16,20,0,0,2*Math.PI);
    roads.moveTo(side*6,4);roads.quadraticCurveTo(side*12,8,side*17,8.6);
    roads.moveTo(side*8,-4);roads.lineTo(side*11,-11);
  }
  roads.moveTo(0,4);roads.lineTo(0,62);
  for(const plot of plots){
    const cx=Math.sign(plot.x)*25, turn=Math.atan2((plot.z+8)/20,(plot.x-cx)/16);
    links.moveTo(plot.x,plot.z);links.lineTo(cx+16*Math.cos(turn),-8+20*Math.sin(turn));
  }
  let lastX,lastZ,lastYaw;
  return function draw(player) {
    const {x,z,yaw}=player;
    if(x===lastX&&z===lastZ&&yaw===lastYaw)return;
    lastX=x;lastZ=z;lastYaw=yaw;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();ctx.translate(center,center);ctx.scale(scale,scale);ctx.translate(-x,-z);
    ctx.lineCap='round';ctx.strokeStyle='#738990';ctx.lineWidth=5.2;ctx.stroke(roads);
    ctx.lineWidth=2.6;ctx.stroke(links);
    ctx.fillStyle='#879b9d';ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#40685f';ctx.beginPath();ctx.arc(0,0,6.1,0,Math.PI*2);ctx.fill();
    for(const plot of plots){
      ctx.save();ctx.translate(plot.x,plot.z);ctx.rotate(-plot.angle);
      ctx.fillStyle=plot.id[0]==='A'?'#bc8172':'#8496bf';ctx.fillRect(-3.4,-3,6.8,6);ctx.restore();
      ctx.font='bold 3.4px system-ui';ctx.fillStyle='#fff6e1';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(plot.id,plot.x,plot.z);
    }
    ctx.beginPath();
    for(let i=0;i<10;i++){
      const angle=-Math.PI/2+i*Math.PI/5, radius=i%2?1.55:3.45;
      const px=Math.cos(angle)*radius,py=Math.sin(angle)*radius;
      if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
    }
    ctx.closePath();ctx.fillStyle='#ffdb94';ctx.fill();
    ctx.restore();
    ctx.save();ctx.translate(center,center);ctx.rotate(-yaw);
    ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(8.6,8.5);ctx.lineTo(0,5.5);ctx.lineTo(-8.6,8.5);ctx.closePath();
    ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle='#183b45';ctx.stroke();ctx.fillStyle='#bdffe1';ctx.fill();
    ctx.restore();
    ctx.fillStyle='#fff3d7';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 19px system-ui';ctx.strokeStyle='#223443';ctx.lineWidth=3;
    ctx.strokeText('N',center,17);ctx.fillText('N',center,17);
  };
}
