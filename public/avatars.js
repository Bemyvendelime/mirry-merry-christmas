import * as T from 'three';
import {advanceRig,joints,headIndex,rigFinish,rodRadius} from './joint-rig.js';
import {createPhotoGeometry} from './photo-mesh.js';

const CAPACITY=160;
export function createAvatars(scene){
  const material=(color)=>new T.MeshStandardMaterial({color,roughness:.38,metalness:.24});
  function batch(geometry,colour,n,name){
    const mesh=new T.InstancedMesh(geometry,material(colour),CAPACITY*n);
    mesh.name='Winter avatars / '+name;
    mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh);return mesh;
  }
  const nodes=batch(new T.SphereGeometry(1,10,7),rigFinish.joint,joints.length,'joint hardware');
  const rods=batch(new T.CylinderGeometry(1,1,1,7),rigFinish.rod,joints.length-1,'connecting rods');
  const heads=new Map(),states=new Map(),geometries=new Map();
  const faceMaterial=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
  const local=new T.Object3D(),root=new T.Object3D(),matrix=new T.Matrix4();
  const delta=new T.Vector3(),up=new T.Vector3(0,1,0);
  function write(batch){
    local.updateMatrix();matrix.multiplyMatrices(root.matrix,local.matrix);
    batch.setMatrixAt(batch.count++,matrix);
  }
  function detach(id){
    const previous=heads.get(id);if(!previous)return;
    scene.remove(previous.mesh);heads.delete(id);
    const cached=geometries.get(previous.photo);
    if(--cached.users===0){cached.geometry?.dispose();geometries.delete(previous.photo);}
  }
  function headFor(player){
    const old=heads.get(player.id),photo=player.photo||'';
    if(old?.photo===photo)return old.mesh;
    detach(player.id);
    if(!photo)return null;
    let cached=geometries.get(photo);
    if(!cached){cached={geometry:createPhotoGeometry(photo),users:0};geometries.set(photo,cached);}
    if(!cached.geometry)return null;
    const mesh=new T.Mesh(cached.geometry,faceMaterial);
    mesh.name='Winter avatars / portrait';mesh.matrixAutoUpdate=false;scene.add(mesh);
    cached.users++;heads.set(player.id,{mesh,photo});
    return mesh;
  }
  let generation=0;
  function render(players,dt=.016){
    generation++;nodes.count=rods.count=0;
    for(const p of players.slice(0,CAPACITY)){
      const state=advanceRig(states.get(p.id),p.id,p.moving,Math.min(.1,dt));
      states.set(p.id,state);state.generation=generation;
      root.position.set(p.x,0,p.z);root.rotation.y=p.yaw||0;root.updateMatrix();
      const head=headFor(p),points=state.pose.points;
      for(let i=0;i<joints.length;i++){
        const joint=joints[i],point=points[i],parent=points[joint.parent];
        if(parent){
          delta.set(point.x-parent.x,point.y-parent.y,point.z-parent.z);
          local.position.set(parent.x+delta.x*.5,parent.y+delta.y*.5,parent.z+delta.z*.5);
          local.scale.set(rodRadius,delta.length(),rodRadius);
          local.quaternion.setFromUnitVectors(up,delta.normalize());write(rods);
        }
        local.position.set(point.x,point.y,point.z);local.quaternion.identity();
        if(i===headIndex&&head){
          local.scale.set(1,1,1);local.updateMatrix();head.matrix.multiplyMatrices(root.matrix,local.matrix);
          head.matrixWorldNeedsUpdate=true;
        }else{local.scale.setScalar(joint.r);write(nodes);}
      }
    }
    for(const [id,s] of states)if(s.generation!==generation){detach(id);states.delete(id);}
    nodes.instanceMatrix.needsUpdate=true;rods.instanceMatrix.needsUpdate=true;
  }
  function dispose(){
    for(const id of heads.keys())detach(id);
    for(const mesh of [nodes,rods]){
      scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();
    }
    faceMaterial.dispose();states.clear();
  }
  return {render,dispose};
}
