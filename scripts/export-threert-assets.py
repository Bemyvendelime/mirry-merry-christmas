"""Run in Blender with the authored starlit-courtyard.blend open. Exports glTF and a linear RGBE sky."""
from pathlib import Path
import bpy

root = Path(__file__).resolve().parents[1] / 'public' / 'scene-assets'
out = root / 'threert' / 'assets'
out.mkdir(parents=True, exist_ok=True)
stone = bpy.data.materials['Thawing granite paving']
# Bake the original world-space texture coordinates into UVs for glTF.
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH' or stone.name not in obj.data.materials:
        continue
    obj.data = obj.data.copy()
    uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='Winter paving')
    for loop in obj.data.loops:
        pos = obj.matrix_world @ obj.data.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = (pos.x * .52, pos.y * .52)

shader = stone.node_tree.nodes['Principled BSDF']
for name in ('Normal', 'Roughness'):
    for link in list(shader.inputs[name].links):
        stone.node_tree.links.remove(link)
shader.inputs['Roughness'].default_value = .24
shader.inputs['Metallic'].default_value = .09
texture = next(n for n in stone.node_tree.nodes if n.type == 'TEX_IMAGE')
for link in list(texture.inputs['Vector'].links):
    stone.node_tree.links.remove(link)
# Calibrate physical emission for the native renderer's exposure in EV100.
for name, value in [('Warm lantern glass', 145), ('Folded ivory star • illuminated', 190)]:
    bpy.data.materials[name].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = value
sky = bpy.data.images['winter-dome.webp'].copy()
sky.scale(1024, 512)
sky.filepath_raw = str(out / 'winter-sky.hdr')
sky.file_format = 'HDR'
sky.save()
bpy.ops.export_scene.gltf(filepath=str(out / 'courtyard.glb'), export_cameras=False,
    export_lights=False, export_animations=False, export_skins=False, export_morph=False,
    export_yup=True, export_extras=False, export_image_format='JPEG', export_jpeg_quality=89)
