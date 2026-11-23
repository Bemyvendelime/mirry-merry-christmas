import {createSubjectModel} from './subject-model.js';
import {prepareRaster,projectSubject} from './joint-rig.js';

const cache=new Map();let weight=0;
self.onmessage=({data:{kind,token,level,view}})=>{
  if(kind==='tile'){
    let entry=cache.get(token);
    if(!entry){
      entry=prepareRaster(token,false);
      if(!entry.model){self.postMessage(null);return;}
      entry.bytes=entry.posed.byteLength+entry.colours.byteLength+entry.projected.byteLength+
        Object.values(entry.model.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+entry.model.geometry.index.array.byteLength;
      weight+=entry.bytes;
    }
    cache.delete(token);cache.set(token,entry);
    while(weight>48*1024*1024&&cache.size>1){
      const key=cache.keys().next().value,old=cache.get(key);
      weight-=old.bytes;old.model.geometry.dispose();cache.delete(key);
    }
    const tile=projectSubject(entry,view);
    self.postMessage(tile,[tile.rgba.buffer]);return;
  }
  const model=createSubjectModel(token,{level});
  if(!model){self.postMessage(null);return;}
  const {geometry,...rest}=model,attributes={},index=geometry.index.array,transfer=[index.buffer];
  for(const [name,attr] of Object.entries(geometry.attributes)){
    attributes[name]={array:attr.array,itemSize:attr.itemSize};transfer.push(attr.array.buffer);
  }
  self.postMessage({...rest,index,attributes},transfer);
};
