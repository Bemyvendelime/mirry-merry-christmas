import {DirectionalLight, GLTFModel, HDRIEnvironment, PerspectiveCamera, PointLight, Scene, Texture} from '@threert/scene';

export default function build() {
  const scene = new Scene();
  const courtyard = new GLTFModel('assets/courtyard.glb');
  courtyard.name = 'OSC winter workshop courtyard';
  scene.add(courtyard);
  scene.environment = new HDRIEnvironment(new Texture('assets/winter-sky.hdr', 'linear'), 100);

  const moon = new DirectionalLight(0xbccfff, 18);
  moon.name = 'Blue-hour moon';
  moon.setSunAngles(30, -53);
  scene.add(moon);

  // Centres of the twelve lanterns in the Blender map. The light exits just
  // below the metal cap. The tree bulbs and cut-paper star emit from the GLB.
  for (const side of [-1, 1]) {
    const lanterns = [[4.98, 12], [6.48, -4], [11.28, -11],
      [25, -22 + side * .72], [36.72, -3], [21, 6 - side * .72]];
    for (const [x, z] of lanterns) {
      const light = new PointLight(0xffca82, 115, 15);
      light.name = `Lantern ${side * x}, ${z}`;
      light.position.set(side * x, 2.37, z);
      light.radius = .12;
      scene.add(light);
    }
  }
  const camera = new PerspectiveCamera(60, 16 / 9, .08, 300);
  camera.name = 'South approach';
  camera.position.set(0, 2.35, 43);
  camera.lookAt(0, 14.5, 0);
  camera.setManualExposure(5.2);
  scene.add(camera);
  return {scene, camera, options: {name: 'osc-starlit-courtyard'}};
}
