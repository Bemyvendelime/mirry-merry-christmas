"""Attach the full winter sky, physical paving, snow microstructure and fir sprays
to the authored Blender scene. Called by create-blender-world.py before saving."""
import bpy
import math
import random
from mathutils import Vector

def finish_world(scene, assets):
    def image_file(name):
        image = bpy.data.images.load(str(assets/name), check_existing=True)
        image.pack()
        return image

    world = scene.world
    sky = world.node_tree.nodes.new('ShaderNodeTexEnvironment')
    sky.image = image_file('winter-dome.webp')
    sky.interpolation = 'Linear'
    world.node_tree.links.new(sky.outputs['Color'], world.node_tree.nodes['Background'].inputs[0])
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .82

    stone = bpy.data.materials['Thawing granite paving']
    nodes, links = stone.node_tree.nodes, stone.node_tree.links
    pos = nodes.new('ShaderNodeNewGeometry')
    xy = nodes.new('ShaderNodeVectorMath')
    xy.operation = 'MULTIPLY'
    xy.inputs[1].default_value = (.52,.52,0)
    links.new(pos.outputs['Position'], xy.inputs[0])
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = image_file('wet-setts.webp')
    tex.extension = 'REPEAT'
    links.new(xy.outputs[0], tex.inputs['Vector'])
    shader = nodes['Principled BSDF']
    links.new(tex.outputs['Color'], shader.inputs['Base Color'])
    shader.inputs['Coat Weight'].default_value=.44
    shader.inputs['Coat Roughness'].default_value=.15
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color=(.14,.14,.14,1)
    ramp.color_ramp.elements[1].color=(.64,.64,.64,1)
    links.new(tex.outputs[0],ramp.inputs[0]);links.new(ramp.outputs[0],shader.inputs['Roughness'])
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.29;bump.inputs['Distance'].default_value=.036
    links.new(tex.outputs[0],bump.inputs['Height']);links.new(bump.outputs[0],shader.inputs['Normal'])
    snow=bpy.data.materials['Fresh snow • cool alabaster']
    nodes,links=snow.node_tree.nodes,snow.node_tree.links
    pos=nodes.new('ShaderNodeNewGeometry');grains=nodes.new('ShaderNodeTexNoise')
    grains.inputs['Scale'].default_value=108;grains.inputs['Detail'].default_value=3
    links.new(pos.outputs['Position'],grains.inputs[0])
    bump=nodes.new('ShaderNodeBump');bump.inputs['Distance'].default_value=.008;bump.inputs['Strength'].default_value=.24
    links.new(grains.outputs[0],bump.inputs['Height'])
    links.new(bump.outputs[0],nodes['Principled BSDF'].inputs['Normal'])
    nodes['Principled BSDF'].inputs['Subsurface Weight'].default_value=.11
    nodes['Principled BSDF'].inputs['Subsurface Radius'].default_value=(.12,.17,.26)

    col=bpy.data.collections['03 • Plaza fir and folded star']
    rng=random.Random(19351)
    vertices=[];faces=[];indices=[]
    for tier in range(58):
        f=tier/58
        for j in range(int(13+26*(1-f))):
            angle=2*math.pi*(j/((13+26*(1-f)))+rng.uniform(-.018,.018)) + tier*.53
            forward=Vector((math.cos(angle),math.sin(angle),0));side=Vector((-forward.y,forward.x,0))
            outer=7.95*((1-f)**.86)*rng.uniform(.83,1.09)
            root=Vector((0,0,2.2+30.1*f))
            for n in range(19):
                t=n/19
                mid=root+forward*outer*(.14+.86*t)
                mid.z+=.13*math.sin(t*math.pi)-.28*t
                for sign in (-1,1):
                    end=mid+forward*outer*.13+sign*side*outer*(.038+.093*(1-t))
                    end.z+=rng.uniform(-.10,.05)
                    width=max(.009,outer*.016)*(1-t*.55)
                    i=len(vertices)
                    vertices.extend([mid,mid+side*width+forward*.032,end,mid-side*width+forward*.025])
                    faces.extend([(i,i+1,i+2),(i,i+2,i+3)])
                    k=3 if rng.random()<.20 else rng.randrange(3)
                    indices.extend([k,k])
    mesh=bpy.data.meshes.new('Spruce tips and snow flecks')
    mesh.from_pydata(vertices,[],faces)
    for i in range(3): mesh.materials.append(bpy.data.materials['Fir needles • %s'%i])
    mesh.materials.append(snow)
    mesh.polygons.foreach_set('material_index',indices)
    col.objects.link(bpy.data.objects.new('Fir • fine winter branchlets',mesh))
    scene.use_nodes=True
    tree=scene.node_tree
    tree.nodes.clear()
    render=tree.nodes.new('CompositorNodeRLayers')
    bloom=tree.nodes.new('CompositorNodeGlare');bloom.glare_type='FOG_GLOW';bloom.quality='HIGH';bloom.threshold=1.8;bloom.size=7
    output=tree.nodes.new('CompositorNodeComposite')
    tree.links.new(render.outputs['Image'],bloom.inputs['Image']);tree.links.new(bloom.outputs['Image'],output.inputs['Image'])
