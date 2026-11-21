// Trace a reflected ray through this frame's opaque scene depth. The snow mask
// and pavement normals come from the same materials used by the world itself.
import * as T from 'three';

export function createReflectedPaving(renderer, ground) {
  const size = new T.Vector2();
  const target = new T.WebGLRenderTarget(1, 1, { depthBuffer: true });
  target.depthTexture = new T.DepthTexture(1, 1, T.UnsignedIntType);
  const uniforms = {
    colour: {value: target.texture}, depthMap: {value: target.depthTexture},
    snow: {value: ground.mask}, normals: {value: null}, hasNormals: {value: false},
    viewToWorld: {value: null}, proj: {value: null}, invProj: {value: null},
    worldToView: {value: null}
  };
  const quad = new T.Scene();
  const lens = new T.Camera();
  const material = new T.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 uv0;
      void main(){ uv0=uv; gl_Position=vec4(position.xy,0.,1.); }`,
    fragmentShader: `
      uniform sampler2D colour,depthMap,snow,normals;
      uniform mat4 proj,invProj,viewToWorld,worldToView;
      uniform bool hasNormals;
      varying vec2 uv0;
      vec3 fromDepth(vec2 uv,float d){
        vec4 h=invProj*vec4(uv*2.-1.,d*2.-1.,1.);
        return h.xyz/h.w;
      }
      vec2 screenAt(vec3 p){
        vec4 h=proj*vec4(p,1.);
        return h.xy/h.w*.5+.5;
      }
      vec3 reflectPaving(vec3 base){
        vec3 pos=fromDepth(uv0,texture2D(depthMap,uv0).r);
        vec3 world=(viewToWorld*vec4(pos,1.)).xyz;
        if(abs(world.y)>.024 || max(abs(world.x),abs(world.z))>63.)return base;
        vec2 uv=vec2(world.x,-world.z)/128.+.5;
        float wet=1.-texture2D(snow,uv).r;
        if(wet<.12)return base;
        vec2 slope=hasNormals?(texture2D(normals,uv*68.).rg-.5):vec2(0.);
        vec3 normal=normalize(vec3(-slope.x*.3,1.,slope.y*.3));
        vec3 dir=reflect(normalize(pos),mat3(worldToView)*normal);
        vec3 origin=pos+mat3(worldToView)*vec3(0.,.075,0.);
        float prev=.10;
        for(int i=0;i<58;i++){
          float t=prev*1.078+.12;
          vec3 p=origin+dir*t;
          if(p.z>-.12 || t>90.)break;
          vec2 at=screenAt(p);
          if(any(lessThan(at,vec2(.002)))||any(greaterThan(at,vec2(.998))))break;
          float surfaceZ=fromDepth(at,texture2D(depthMap,at).r).z;
          if(surfaceZ>=p.z){
            float lo=prev,hi=t;
            for(int j=0;j<5;j++){
              float mid=(lo+hi)*.5;
              vec3 test=origin+dir*mid;
              vec2 q=screenAt(test);
              if(fromDepth(q,texture2D(depthMap,q).r).z>=test.z)hi=mid;else lo=mid;
            }
            vec3 hit=origin+dir*hi;
            vec2 q=screenAt(hit);
            float gap=fromDepth(q,texture2D(depthMap,q).r).z-hit.z;
            if(gap>=-.04 && gap<.25+hi*.035){
              float edge=min(min(q.x,1.-q.x),min(q.y,1.-q.y));
              float fresnel=pow(1.-abs(dot(normalize(pos),mat3(worldToView)*normal)),3.);
              float weight=wet*(.13+.48*fresnel)*smoothstep(.0,.045,edge);
              return mix(base,texture2D(colour,q).rgb,weight);
            }
          }
          prev=t;
        }
        return base;
      }
      void main(){
        gl_FragColor=vec4(reflectPaving(texture2D(colour,uv0).rgb),1.);
        #include <colorspace_fragment>
      }`
  });
  quad.add(new T.Mesh(new T.PlaneGeometry(2, 2), material));
  return function render(scene, camera) {
    renderer.getDrawingBufferSize(size);
    target.setSize(size.x, size.y);
    uniforms.proj.value=camera.projectionMatrix;
    uniforms.invProj.value=camera.projectionMatrixInverse;
    uniforms.viewToWorld.value=camera.matrixWorld;
    uniforms.worldToView.value=camera.matrixWorldInverse;
    uniforms.normals.value=ground.paving.bounds.normal;
    uniforms.hasNormals.value=!!uniforms.normals.value;
    renderer.setRenderTarget(target);
    try { renderer.render(scene, camera); }
    finally { renderer.setRenderTarget(null); }
    renderer.render(quad, lens);
  };
}
