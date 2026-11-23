export function setupChat(send,getContext,focusWorld){
  const el=id=>document.getElementById(id),panel=el('roomChat'),list=el('chatLog'),open=el('chatOpen');
  const input=el('chatInput'),status=el('chatStatus'),submit=el('chatSend');
  let active=false,pending=null,lastId=0,visit=0;
  function show(focus){
    panel.hidden=false;open.hidden=true;
    if(focus)input.focus();
  }
  open.onclick=()=>{if(active)show(true)};
  el('chatClose').onclick=()=>{panel.hidden=true;open.hidden=false;focusWorld()};
  input.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();input.blur();focusWorld();}};
  function display(messages){
    if(!active)return;
    const nearEnd=list.scrollHeight-list.clientHeight-list.scrollTop<20;
    for(const m of messages||[]){
      if(m.id<=lastId)continue;
      const row=document.createElement('li'),name=document.createElement('b');
      name.textContent=m.name;row.append(name,document.createTextNode(m.body));list.append(row);lastId=m.id;
      if(list.children.length>50)list.firstElementChild.remove();
    }
    el('chatEmpty').hidden=!!list.childElementCount;
    if(nearEnd)list.scrollTop=list.scrollHeight;
  }
  el('chatForm').onsubmit=async e=>{
    e.preventDefault();const body=input.value.trim(),scope=getContext(),generation=visit;
    if(!body||!active||submit.disabled)return;
    if(pending?.body!==body)pending={body,op:crypto.randomUUID()};
    submit.disabled=true;status.textContent='';
    try{
      await send('chat',{...scope,...pending});
      // The next ordered room snapshot includes the acknowledgement and any
      // earlier messages from other participants in their original order.
      if(visit===generation){if(input.value.trim()===body)input.value='';pending=null;input.focus();}
    }catch(error){if(visit===generation)status.textContent=error.message;}
    finally{if(visit===generation)submit.disabled=false;}
  };
  return {display,enter(inside){
    visit++;active=inside;lastId=0;pending=null;list.replaceChildren();input.value='';status.textContent='';submit.disabled=false;
    el('chatEmpty').hidden=false;panel.hidden=true;open.hidden=true;
    if(inside)show(false);
  }};
}
