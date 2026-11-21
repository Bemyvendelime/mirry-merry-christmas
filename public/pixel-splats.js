// Volumetric surface samples of this courtyard, with the MIT-licensed pixel
// art pass from cobanov/pixelart-gaussiansplat (see vendor/…/SOURCE.txt).
import * as T from 'three';
import {createPost} from './vendor/pixelart-gaussiansplat/render/post.js';
import {mulberry32} from './vendor/pixelart-gaussiansplat/noise.js';

export const winterPalette = [
  '#171c30','#222943','#303650','#434962','#585e78','#707991','#8f9ab1',
  '#aab7c9','#c3d0df','#dce4ed','#f2f2ef','#fff9e9',
  '#182e33','#203d3e','#2b5048','#3b6557','#527c69','#719381','#99b2a2',
  '#2b272e','#42333b','#5b4144','#79514c','#996657','#bb8670','#d4a88c',
  '#544052','#735061','#986476','#c58a98','#5a4742','#786041','#a27b4c',
  '#c99554','#e9b465','#ffd385','#ffe8b1','#fff2cc',
  '#62608b','#8284a4','#9691a5','#b4a6b5','#ccbbc6'
];

function sampleWorld(scene) {
  const random = mulberry32(0x534e4f57);
  const centers = [], tangents = [], normals = [], shapes = [], colours = [];
  const hidden = new Set();
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  const u = new T.Vector3(), v = new T.Vector3(), normal = new T.Vector3();
  const tangent = new T.Vector3(), center = new T.Vector3(), vertexColor = new T.Color();
  const instance = new T.Matrix4(), transform = new T.Matrix4(), baseColor = new T.Color();
  const moon = new T.Vector3(-.55,.72,.43).normalize();
  scene.updateMatrixWorld(true);
  scene.traverse(mesh => {
    if (!mesh.isMesh || mesh.name.startsWith('Winter avatars / ') || mesh.isSkinnedMesh) return;
    const material = mesh.material, geometry = mesh.geometry;
    const position = geometry.getAttribute('position');
    if (!position || !material.isMeshLambertMaterial || material.transparent) return;
    // The high-frequency needles are cutout cards. The coloured triangles
    // below them describe the real snow-covered branches without atlas voids.
    if (material.map) {
      if (material.vertexColors && material.alphaTest > 0) hidden.add(mesh);
      return;
    }
    const foliage = !mesh.isInstancedMesh && material.vertexColors;
    const fixture = mesh.isInstancedMesh && !!mesh.instanceColor;
    if (!foliage && !fixture) return;
    if (foliage) hidden.add(mesh);
    const coloursAttr = geometry.getAttribute('color'), ids = geometry.index;
    const triangleVertices = ids ? ids.count : position.count;
    const density = foliage ? 37 : 12;
    const sigma = foliage ? .133 : .145;
    const count = mesh.isInstancedMesh ? mesh.count : 1;
    for (let item = 0; item < count; item++) {
      if (mesh.isInstancedMesh) {
        mesh.getMatrixAt(item, instance);
        transform.multiplyMatrices(mesh.matrixWorld, instance);
        mesh.getColorAt(item, baseColor);
        baseColor.multiply(material.color);
      } else {
        transform.copy(mesh.matrixWorld);
        baseColor.copy(material.color);
      }
      for (let i = 0; i < triangleVertices; i += 3) {
        const ia = ids ? ids.getX(i) : i;
        const ib = ids ? ids.getX(i + 1) : i + 1;
        const ic = ids ? ids.getX(i + 2) : i + 2;
        a.fromBufferAttribute(position, ia).applyMatrix4(transform);
        b.fromBufferAttribute(position, ib).applyMatrix4(transform);
        c.fromBufferAttribute(position, ic).applyMatrix4(transform);
        u.subVectors(b, a);
        v.subVectors(c, a);
        normal.crossVectors(u, v);
        const twiceArea = normal.length();
        const samples = Math.floor(twiceArea * .5 * density + random());
        if (!samples) continue;
        normal.multiplyScalar(1 / twiceArea);
        tangent.copy(u.lengthSq() > v.lengthSq() ? u : v);
        const crossWidth = twiceArea / Math.max(.00001, tangent.length());
        tangent.normalize();
        // Fine timber remains underneath the flecks. Offset along the face
        // keeps their nearby outlines independent of depth precision.
        const relief = fixture ? .012 : 0;
        for (let n = 0; n < samples; n++) {
          const r = Math.sqrt(random()), s = random(), wb = r*(1-s), wc = r*s;
          center.copy(a).addScaledVector(u, wb).addScaledVector(v, wc).addScaledVector(normal, relief);
          centers.push(center.x, center.y, center.z);
          tangents.push(tangent.x, tangent.y, tangent.z);
          normals.push(normal.x, normal.y, normal.z);
          const size = sigma*(.8+.37*random());
          const width = fixture ? Math.min(size*.79, Math.max(.006,crossWidth*.42)) : size*.79;
          shapes.push(size*1.45, width, Math.min(size*.33,width*.53));
          if (coloursAttr && material.vertexColors) {
            const wa = 1-r;
            vertexColor.setRGB(
              coloursAttr.getX(ia)*wa+coloursAttr.getX(ib)*wb+coloursAttr.getX(ic)*wc,
              coloursAttr.getY(ia)*wa+coloursAttr.getY(ib)*wb+coloursAttr.getY(ic)*wc,
              coloursAttr.getZ(ia)*wa+coloursAttr.getZ(ib)*wb+coloursAttr.getZ(ic)*wc
            ).multiply(baseColor);
          } else vertexColor.copy(baseColor);
          const light = (.83 + .35 * Math.abs(normal.dot(moon))) * (.85+.29*random());
          colours.push(vertexColor.r*light,vertexColor.g*light,vertexColor.b*light);
        }
      }
    }
  });
  const quad = new T.InstancedBufferGeometry();
  quad.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));
  quad.setIndex([0,1,2,0,2,3]);
  for (const [name, values] of Object.entries({center:centers,axis:tangents,face:normals,sigma:shapes,tint:colours})) {
    quad.setAttribute(name, new T.InstancedBufferAttribute(new Float32Array(values),3));
  }
  quad.instanceCount = centers.length/3;
  return {quad, hidden};
}

const cloudVertex = `
  attribute vec3 center, axis, face, sigma, tint;
  uniform vec2 viewportSize;
  varying vec2 gaussianCoord;
  varying vec3 tone;
  // Project the three world-space covariance axes through the perspective
  // Jacobian. Their screen covariance gives an ellipse from every viewpoint.
  vec2 projectAxis(vec3 axisView, vec3 p) {
    return .5 * viewportSize * vec2(projectionMatrix[0][0], projectionMatrix[1][1])
         * (axisView.xy - p.xy * axisView.z / p.z) / -p.z;
  }
  void main() {
    vec3 p = (viewMatrix * vec4(center,1.)).xyz;
    float support = 3.*max(sigma.x,max(sigma.y,sigma.z));
    vec2 focal = vec2(projectionMatrix[0][0],projectionMatrix[1][1]);
    vec2 frustum = (-p.z+support)/focal + support;
    if(p.z >= -.09 || any(greaterThan(abs(p.xy),frustum))) {
      gl_Position=vec4(2.,2.,2.,1.); return;
    }
    vec2 a = projectAxis(mat3(viewMatrix)*axis*sigma.x,p);
    vec2 b = projectAxis(mat3(viewMatrix)*cross(face,axis)*sigma.y,p);
    vec2 c = projectAxis(mat3(viewMatrix)*face*sigma.z,p);
    float xx = a.x*a.x+b.x*b.x+c.x*c.x+.16;
    float yy = a.y*a.y+b.y*b.y+c.y*c.y+.16;
    float xy = a.x*a.y+b.x*b.y+c.x*c.y;
    float halfTrace = .5*(xx+yy);
    float root = length(vec2(.5*(xx-yy),xy));
    float major = halfTrace+root;
    vec2 along = abs(xy)>.00001 ? normalize(vec2(major-yy,xy)) : (xx>=yy?vec2(1.,0.):vec2(0.,1.));
    vec2 across = vec2(-along.y,along.x);
    gaussianCoord = 2.3*position.xy;
    vec2 delta = gaussianCoord.x*sqrt(max(.16,major))*along
               + gaussianCoord.y*sqrt(max(.16,halfTrace-root))*across;
    vec4 clip = projectionMatrix*vec4(p,1.);
    clip.xy += 2.*delta/viewportSize*clip.w;
    gl_Position=clip;
    float fog = 1.0-exp(-.00005476*dot(p,p));
    tone = mix(tint,vec3(.287,.326,.48),fog);
  }`;
const cloudFragment = `
  varying vec2 gaussianCoord;
  varying vec3 tone;
  void main() {
    float response=exp(-.5*dot(gaussianCoord,gaussianCoord));
    if(response < .13) discard;
    // Crisp mode keeps each splat's core opaque for stable depth against
    // avatars and editable props. The Gaussian supplies its tonal falloff.
    gl_FragColor=vec4(tone*(.83+.27*response),1.);
  }`;

export function createPixelSplats(renderer, scene) {
  const {quad, hidden} = sampleWorld(scene);
  const viewportSize = new T.Vector2();
  const material = new T.ShaderMaterial({
    uniforms:{viewportSize:{value:viewportSize}}, vertexShader:cloudVertex, fragmentShader:cloudFragment,
    depthTest:true, depthWrite:true
  });
  const cloud = new T.Mesh(quad,material);
  cloud.frustumCulled=false;
  cloud.visible=false;
  cloud.name='Courtyard Gaussian surface samples';
  scene.add(cloud);

  const post=createPost();
  post.setPalette(winterPalette);
  post.setBackground(winterPalette[0]);
  post.setCrisp(true);
  const source=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter});
  const pixels=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false});
  const copyGeometry=new T.PlaneGeometry(2,2);
  const copyMaterial=new T.ShaderMaterial({
    uniforms:{image:{value:pixels.texture}},depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 coord; void main(){ coord=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader:'uniform sampler2D image; varying vec2 coord; void main(){gl_FragColor=texture2D(image,coord);}'
  });
  const view=new T.Scene(), blit=new T.Mesh(copyGeometry,copyMaterial), flat=new T.Camera();
  blit.frustumCulled=false;
  view.add(blit);
  const bufferSize=new T.Vector2(), previousVis=new Map();
  const glows=scene.children.filter(o=>o.isPoints&&o.material.uniforms?.vh);
  function mask(object) {
    if (!previousVis.has(object)) previousVis.set(object,object.visible);
    object.visible=false;
  }
  return {
    render(camera) {
      renderer.getDrawingBufferSize(bufferSize);
      const scale=Math.max(2,Math.ceil(Math.max(bufferSize.x/540,bufferSize.y/390)));
      const width=Math.max(1,Math.ceil(bufferSize.x/scale)), height=Math.max(1,Math.ceil(bufferSize.y/scale));
      if (pixels.width!==width || pixels.height!==height) {
        source.setSize(width*2,height*2);
        pixels.setSize(width,height);
        viewportSize.set(source.width,source.height);
        post.setSizes(width,height,1,2);
      }
      const previousTarget=renderer.getRenderTarget();
      const glowValues=glows.map(o=>o.material.uniforms.vh.value);
      try {
        for (const obj of hidden) mask(obj);
        // The photographic distant LOD is attached asynchronously by the
        // normal renderer. Pixel art uses the same volumetric cloud at range.
        for (const obj of scene.children) {
          if (obj.isLOD && obj.levels.some(level=>level.object.children.some(child=>hidden.has(child)))) mask(obj);
        }
        glows.forEach(o=>{o.material.uniforms.vh.value=source.height;});
        cloud.visible=true;
        renderer.setRenderTarget(source);
        renderer.render(scene,camera);
        renderer.setRenderTarget(pixels);
        post.render(renderer,source.texture,true,.44);
        renderer.setRenderTarget(previousTarget);
        renderer.render(view,flat);
      } finally {
        cloud.visible=false;
        for (const [mesh,visible] of previousVis) mesh.visible=visible;
        previousVis.clear();
        glows.forEach((o,i)=>{o.material.uniforms.vh.value=glowValues[i];});
        renderer.setRenderTarget(previousTarget);
      }
    },
    dispose() {
      scene.remove(cloud);quad.dispose();material.dispose();
      source.dispose();pixels.dispose();copyGeometry.dispose();copyMaterial.dispose();post.dispose();
    }
  };
}
