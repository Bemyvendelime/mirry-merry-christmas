// Generate short mono foley samples once. Snow has a pressed layer followed by
// granular friction on release. A setted street gives a short heel and toe tap.
function makeSample(ctx, snow, variation){
  const rate=24000, duration=snow?.37:.18;
  const buffer=ctx.createBuffer(1,Math.ceil(duration*rate),rate);
  const channel=buffer.getChannelData(0);
  let seed=96381+variation*1027+(snow?0:9341);
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const toe=.042+random()*.018;
  let fine=0,low=0,mid=0,impact=0;
  const grains=[];
  if(snow){
    for(let i=0;i<55;i++){
      const t=(i%4===0?.15+.16*random():.012+.17*random()**1.6);
      grains.push({at:Math.round(t*rate),strength:.025+.13*random(),decay:.009+.012*random()});
    }
    grains.sort((a,b)=>a.at-b.at);
  }
  let next=0,crackle=0,crackleDecay=.99;
  const pitch=83+random()*16;
  for(let i=0;i<channel.length;i++){
    const t=i/rate,noise=random()*2-1;
    low+=.048*(noise-low);mid+=.21*(noise-mid);fine+=.73*(noise-fine);
    let value;
    if(snow){
      if(next<grains.length&&i>=grains[next].at){
        const g=grains[next++];crackle+=g.strength;crackleDecay=Math.exp(-1/(rate*g.decay));
      }
      crackle*=crackleDecay;
      const press=(1-Math.exp(-t/.014))*Math.exp(-t/.082);
      const u=Math.max(0,t-.105),slide=(1-Math.exp(-u/.049))*Math.exp(-u/.073);
      value=(1.55*low+.33*(mid-low))*press+.62*(mid-low)*slide+(fine-mid)*crackle;
    }else{
      const u=Math.max(0,t-toe), heel=(1-Math.exp(-t/.0017))*Math.exp(-t/.022);
      const ball=(1-Math.exp(-u/.0023))*Math.exp(-u/.024);
      impact+=.11*(mid-impact);
      const heelTone=Math.sin(2*Math.PI*(pitch*t+.75*(1-Math.exp(-t/.013))));
      const toeTone=Math.sin(2*Math.PI*(pitch*1.38*u+.42*(1-Math.exp(-u/.009))));
      value=(.38*heelTone+1.24*impact+.30*mid+.12*(fine-mid))*heel
          +(.23*toeTone+.85*impact+.30*mid)*ball;
    }
    channel[i]=value*Math.min(1,(channel.length-1-i)/180);
  }
  return buffer;
}
export function createFootsteps(control){
  let ctx=null,banks=null,gain=null,travel=0,variant=0,enabled=true;
  try{enabled=localStorage.getItem('osc-footsteps')!=='off';}catch{}
  function updateControl(){
    control.setAttribute('aria-pressed',String(enabled));
    control.setAttribute('aria-label',enabled?'내 발소리 끄기':'내 발소리 켜기');
    control.title=control.getAttribute('aria-label');
  }
  function unlock(){
    if(!enabled)return;
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    try{
      if(!ctx){
        ctx=new Context();gain=ctx.createGain();gain.gain.value=.72;gain.connect(ctx.destination);
      }
      if(ctx.state!=='running')ctx.resume().catch(()=>{});
    }catch{}
  }
  updateControl();
  control.onclick=()=>{
    enabled=!enabled;travel=0;
    try{localStorage.setItem('osc-footsteps',enabled?'on':'off');}catch{}
    if(enabled)unlock();
    if(gain)gain.gain.setTargetAtTime(enabled?.72:0,ctx.currentTime,.012);
    updateControl();document.querySelector('#game canvas')?.focus({preventScroll:true});
  };
  return {unlock,reset(){travel=0;},walk(distance,grounded,running,surface){
    if(!enabled||!ctx||ctx.state!=='running'||!grounded||distance<.0005||document.hidden){travel=0;return;}
    const stride=running?1.87:1.98;
    // The first foot touches soon after starting. Remaining beats follow the
    // distance actually travelled, even at a low frame rate or beside a wall.
    if(!travel)travel=stride*.77;
    travel+=distance;
    if(travel<stride)return;
    travel=Math.max(.001,travel-stride);
    if(!banks)banks={
      snow:Array.from({length:6},(_,i)=>makeSample(ctx,true,i)),
      road:Array.from({length:6},(_,i)=>makeSample(ctx,false,i))
    };
    const node=ctx.createBufferSource();
    node.buffer=banks[surface()][variant++%6];
    node.playbackRate.value=(running?1.06:1)*(.97+.06*Math.random());
    node.connect(gain);node.onended=()=>node.disconnect();node.start();
  }};
}
