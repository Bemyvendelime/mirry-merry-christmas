import * as T from 'three';
import {advanceRig, joints, rigFinish, rodRadius, isWholeSubject} from './joint-rig.js';
import {createSubjectModel, createSubjectSkin} from './subject-model.js';

const CAPACITY = 160;
const NEAR_SKINS = 10;

export function createAvatars(scene) {
  function batch(geometry, colour, size, name) {
    const material = new T.MeshStandardMaterial({color:colour,roughness:.38,metalness:.24});
    const mesh = new T.InstancedMesh(geometry,material,CAPACITY*size);
    mesh.name='Avatar / '+name;
    mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh);return mesh;
  }
  const nodes=batch(new T.SphereGeometry(1,10,7),rigFinish.joint,joints.length,'default joints');
  const rods=batch(new T.CylinderGeometry(1,1,1,7),rigFinish.rod,joints.length-1,'default rods');
  const states=new Map(), subjects=new Map(), modelCache={high:new Map(),low:new Map()};
  const local=new T.Object3D(), root=new T.Object3D(), matrix=new T.Matrix4();
  const axis=new T.Vector3(), up=new T.Vector3(0,1,0);

  function release(id) {
    const actor=subjects.get(id);
    if(!actor)return;
    if(actor.skin){scene.remove(actor.skin.mesh);actor.skin.dispose();}
    if(--actor.entry.users===0){
      actor.entry.model?.geometry.dispose();
      modelCache[actor.level].delete(actor.token);
    }
    subjects.delete(id);
  }

  function bind(player,level) {
    const token=player.photo;
    let entry=modelCache[level].get(token);
    if(!entry){
      entry={model:createSubjectModel(token,level==='low'?{level:'low'}:undefined),users:0};
      modelCache[level].set(token,entry);
    }
    entry.users++;
    const skin=entry.model?createSubjectSkin(entry.model):null;
    release(player.id);
    if(skin){
      skin.mesh.name='Avatar / colour subject';
      // Animated extremities can temporarily extend past the rest-pose sphere.
      skin.mesh.frustumCulled=false;
      scene.add(skin.mesh);
    }
    const actor={token,level,entry,skin};
    subjects.set(player.id,actor);
    return actor;
  }

  function write(batch){
    local.updateMatrix();matrix.multiplyMatrices(root.matrix,local.matrix);
    batch.setMatrixAt(batch.count++,matrix);
  }
  function drawDefault(p,state){
    root.position.set(p.x,0,p.z);root.rotation.y=p.yaw||0;root.updateMatrix();
    const points=state.pose.points;
    for(let i=0;i<joints.length;i++){
      const joint=joints[i],end=points[i],start=points[joint.parent];
      if(start){
        axis.set(end.x-start.x,end.y-start.y,end.z-start.z);
        local.position.set(start.x+axis.x*.5,start.y+axis.y*.5,start.z+axis.z*.5);
        local.scale.set(rodRadius,axis.length(),rodRadius);
        local.quaternion.setFromUnitVectors(up,axis.normalize());write(rods);
      }
      local.position.set(end.x,end.y,end.z);local.quaternion.identity();local.scale.setScalar(joint.r);
      write(nodes);
    }
  }
  let generation=0;
  function render(players,dt=.016,hideSelf=false) {
    generation++;nodes.count=rods.count=0;
    const origin=players[0];
    const visible=players.slice(0,CAPACITY).map((player,i)=>({
      player,distance:i?Math.hypot(player.x-origin.x,player.z-origin.z):0
    })).sort((a,b)=>a.distance-b.distance);
    const start=performance.now();
    let highCount=0,builds=0;
    for(const {player:p,distance} of visible){
      let actor=subjects.get(p.id);
      if(actor&&actor.token!==p.photo){release(p.id);actor=null;}
      const custom=isWholeSubject(p.photo);
      if(custom){
        const near=distance<(actor?.level==='high'?16:13)&&highCount<NEAR_SKINS;
        if(near)highCount++;
        const level=near?'high':'low';
        // Keep animation smooth during a wave of profile arrivals. Continue
        // displaying the previous resolution while a new LOD is queued.
        if((!actor||actor.level!==level)&&(!builds||performance.now()-start<5)){
          actor=bind(p,level);builds++;
        }
      }
      const bare=!custom||Boolean(actor&&!actor.skin);
      const state=advanceRig(states.get(p.id),p.id,p.moving,Math.min(.1,Math.max(0,dt)),bare);
      states.set(p.id,state);state.generation=generation;
      if(actor?.skin){
        const {mesh}=actor.skin;
        mesh.visible=!(hideSelf&&p.id===origin.id);
        mesh.position.set(p.x,0,p.z);
        // Subject input faces +Z. Walking yaw 0 faces the world's -Z.
        mesh.rotation.y=(p.yaw||0)+Math.PI;
        actor.skin.update(state.phase,state.gait);
      }else if(bare&&!(hideSelf&&p.id===origin.id)){
        drawDefault(p,state);
      }
    }
    for(const [id,state] of states)if(state.generation!==generation){release(id);states.delete(id);}
    nodes.instanceMatrix.needsUpdate=true;rods.instanceMatrix.needsUpdate=true;
  }
  function dispose(){
    for(const id of subjects.keys())release(id);
    for(const mesh of [nodes,rods]){
      scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();
    }
    states.clear();
  }
  return {render,dispose};
}
