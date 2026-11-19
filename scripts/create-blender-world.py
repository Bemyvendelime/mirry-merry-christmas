"""Build the editable OSC winter workshop courtyard and export its placeable bench.
Run from any working directory with blender -b -P scripts/create-blender-world.py.
Coordinates in this file are Blender coordinates (Z up, +Y north).
"""
import bpy
import bmesh
import json
import math
import random
import subprocess
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "scene-assets"
ASSETS.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
rng = random.Random(271126)
TAU = 2 * math.pi


def collection(name):
    col = bpy.data.collections.new(name)
    scene.collection.children.link(col)
    return col


ground = collection("01 • Snowfield, approaches and paving")
plots_collection = collection("02 • Empty team plots • A6 + B7")
festival = collection("03 • Plaza fir and folded star")
lanterns = collection("04 • Public lanterns and wayfinding")
gardens = collection("05 • Woodland and distant campus")
furniture = collection("06 • Public benches")
studio = collection("07 • Camera and blue-hour lighting")


def linear(c):
    v = int(c, 16) / 255
    return v / 12.92 if v < 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def material(name, value, rough=.78, emission=0):
    color = tuple(linear(value[i:i+2]) for i in (0, 2, 4)) + (1.0,)
    m = bpy.data.materials.new(name)
    m.diffuse_color = color
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = color
    bs.inputs["Roughness"].default_value = rough
    if emission:
        bs.inputs["Emission Color"].default_value = color
        bs.inputs["Emission Strength"].default_value = emission
    return m


snow = material("Fresh snow • cool alabaster", "dbe3ef")
stone = material("Thawing granite paving", "7e8495", .36)
edge = material("Granite kerb", "a8afbf")
brick = material("Clay plot boundary", "965f54")
pad = material("Bare plot • snow over flagstones", "c1bdc4")
timber = material("Oiled oak", "765039", .63)
benchwood = material("Warm slatted larch", "af7952", .57)
iron = material("Cast charcoal metal", "333c45", .45)
evergreen = [material("Fir needles • %s" % i, col) for i, col in enumerate(["244946","35574f","43665b"])]
bark = material("Winter bark", "736059")
gold = material("Warm lantern glass", "ffcf85", .26, 4)
star_mat = material("Folded ivory star • illuminated", "ffe2a1", .4, 2.8)
red = material("A • russet cloth", "9f4942")
blue = material("B • indigo cloth", "485d88")
cream = material("Banner lettering", "f9e9c7")
wall = material("Distant campus stone", "838698")
roof = material("Campus slate roof", "59667d")
site = bpy.data.objects
mesh_cache = {}


def object_with_data(name, data, col, xyz, scale=(1,1,1)):
    obj = site.new(name, data)
    col.objects.link(obj)
    obj.location, obj.scale = xyz, scale
    return obj


def geometry(name, vertices, faces, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.materials.append(mat)
    data.update()
    return data


def primitive(shape, mat, bevel=0.0):
    key = (shape, mat.name, bevel)
    if key in mesh_cache:
        return mesh_cache[key]
    mesh = bpy.data.meshes.new(shape + ' • ' + mat.name)
    bm = bmesh.new()
    if shape == "box":
        bmesh.ops.create_cube(bm, size=1)
        if bevel:
            bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=2, affect='EDGES')
    elif shape == "ball":
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1)
    else:
        radius2 = 0 if shape == "cone" else 1
        bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=1, radius2=radius2, depth=1)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    if shape == "ball":
        for p in mesh.polygons:
            p.use_smooth = True
    mesh_cache[key] = mesh
    return mesh


def shape(name, form, mat, col, xyz, scale, bevel=0.0):
    return object_with_data(name, primitive(form, mat, bevel), col, xyz, scale)


def box(name, mat, col, xyz, dims, angle=0, bevel=.025):
    obj = shape(name, "box", mat, col, xyz, dims, bevel)
    obj.rotation_euler.z = angle
    return obj


def branch(name, mat, col, a, b, radius):
    v = Vector(b) - Vector(a)
    obj = shape(name, "tube", mat, col, (Vector(a) + Vector(b)) * .5, (radius, radius, v.length))
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = v.to_track_quat('Z', 'Y')
    return obj


def ellipse(name, col, center, radii, width, height, mat, segments=112):
    verts = []
    for i in range(segments):
        a = TAU*i/segments
        for offset in (-width/2, width/2):
            verts.append((center[0]+(radii[0]+offset)*math.cos(a),
                          center[1]+(radii[1]+offset)*math.sin(a), height))
    faces = [(2*i,2*i+1,(2*i+3)%(segments*2),(2*i+2)%(segments*2)) for i in range(segments)]
    return object_with_data(name, geometry(name, verts, faces, mat), col, (0,0,0))


box("Campus snowfield", snow, ground, (0,6,-.37),(135,122,.65))
box("South approach", stone, ground,(0,-24,-.047),(7.4,41,.12))
for x in (-25,25):
    ellipse("District walking loop",ground,(x,8),(15,16),5.8,.046,stone)
    for delta in (-3,3):
        ellipse("Flush strip of kerbstones",ground,(x,8),(15+delta,16+delta),.15,.056,edge)
    box("Plaza walk connector", stone,ground,(x*.53,0,.024),(20,6,.07))
shape("Circular gathering plaza","tube",stone,ground,(0,0,.025),(13,10,.085))
ellipse("Inner brick circle", ground,(0,0),(6.4,6.4),.17,.082,brick)
shape("Raised fir planter","tube",edge,festival,(0,0,.23),(6.2,6.2,.48))
shape("Snow inside planter","tube",snow,festival,(0,0,.48),(6.03,6.03,.065))

# Load the same pad coordinates and visual yaw exported by the browser world.
source = ROOT / "public" / "layout.js"
result = subprocess.check_output(["node","--input-type=module","-e",
    "import fs from 'node:fs'; const code=fs.readFileSync(process.argv[1],'utf8'); const m=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64')); console.log(JSON.stringify(m.plots));", str(source)])
plot_data = json.loads(result)
for entry in plot_data:
    x, y, angle = entry['x'], -entry['z'], entry.get('angle', 0)
    label = str(entry['id'])
    box(label+" • brick plot perimeter",brick,plots_collection,(x,y,.041),(6.36,5.36,.12),angle)
    box(label+" • buildable pad",pad,plots_collection,(x,y,.102),(6.04,5.04,.045),angle)

# Layered branch crowns with a distinct snow cap above each needle layer.
def fir(name,x,y,height,col,decorated=False):
    shape(name+" • trunk","tube",bark,col,(x,y,height*.18),(.032*height,.032*height,height*.38))
    for li in range(16 if decorated else 4):
        n=16 if decorated else 4
        level=li/(n-.25)
        r=height*(.23 if decorated else .28)*(1-level*.88)
        z=height*(.10+.77*level)
        tier_h=height*(.30 if decorated else .39)*(1-level*.5)
        rot=li*.91
        for cap in (False, True):
            pts=[(0,0,tier_h+.018 if cap else tier_h)]
            for j in range(32):
                a=j*TAU/32+rot
                waved=.91+.09*math.cos(8*(a-rot))
                R=r*waved*(.82 if cap else 1)
                pts.append((R*math.cos(a),R*math.sin(a),
                            (.19*tier_h if cap else 0) + tier_h*.085*math.sin(a*8)))
            key=(li,n,cap,round(height,1))
            if key not in mesh_cache:
                mesh_cache[key]=geometry(name+" • bough geometry",pts,[(0,j+1,(j+1)%32+1) for j in range(32)],snow if cap else evergreen[li%3])
            object_with_data(name+" • "+("snow cap" if cap else "bough"),mesh_cache[key],col,(x,y,z))
    if decorated:
        for i in range(1100):
            t=i/1099
            a=TAU*18*t
            r=height*(.218*(1-t)+.012)
            shape("Honey fairy light","ball",gold,col,(x+math.cos(a)*r,y+math.sin(a)*r,.15*height+t*height*.79),(.069,)*3)

fir("Plaza fir",0,0,33.7,festival,True)
points=[(0,-.24,0),(0,.24,0)]
for i in range(16):
    a=math.pi/2 + TAU*i/16
    r=1.64 if i%2==0 else .65
    points.append((math.cos(a)*r,0,math.sin(a)*r))
faces=[(0,2+i,2+(i+1)%16) for i in range(16)]+[(1,2+(i+1)%16,2+i) for i in range(16)]
object_with_data("Folded paper star",geometry("Eight-point lantern",points,faces,star_mat),festival,(0,0,34.36))

def area_light(name, typ, xyz, color, power, radius, target=None):
    data=bpy.data.lights.new(name,typ)
    data.color=color
    data.energy=power
    if typ=='POINT': data.shadow_soft_size=radius
    if typ=='AREA': data.shape='DISK'; data.size=radius
    obj=object_with_data(name,data,studio,xyz)
    if target: obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj


def lamp(x,y,az,zone):
    def at(f,z): return (x+math.cos(az)*f,y+math.sin(az)*f,z)
    box("Timber post",timber,lanterns,at(0,1.68),(.19,.19,3.36),az)
    box("Stone post base",edge,lanterns,at(0,.17),(.43,.43,.34),az)
    box("Cantilever",timber,lanterns,at(.32,3.27),(.95,.12,.14),az)
    branch("Iron hook",iron,lanterns,at(.72,3.26),at(.72,2.98),.018)
    box("Warm lantern",gold,lanterns,at(.72,2.70),(.33,.32,.49),az)
    for z in (2.43,2.97): box("Bronze lantern cap",iron,lanterns,at(.72,z),(.46,.45,.07),az)
    for a in (-1,1):
        for b in (-1,1):
            xx,yy,z=at(.72+a*.169,2.7)
            box("Lantern mullion",iron,lanterns,(xx-math.sin(az)*b*.16,yy+math.cos(az)*b*.16,z),(.027,.027,.5),az)
    if zone:
        box("District "+zone+" banner",red if zone=='A' else blue,lanterns,at(-.42,2.28),(.62,.04,1.12),az)
    return at(.72,2.6)

for sign in (-1,1):
    for x,y,az in [(5.7,-12,0),(7.2,4,0),(12,11,0),(25,22,math.pi/2),(36,3,math.pi),(21,-6,-math.pi/2)]:
        p=lamp(sign*x,y,az+(math.pi if sign>0 else 0),'A' if sign<0 else 'B')
        if y in (-12,4,11):area_light("Lantern pool",'POINT',p,(1,.57,.27),130,1.2)
    font=bpy.data.curves.new("District letter",'FONT')
    font.body="A" if sign<0 else "B";font.align_x='CENTER';font.align_y='CENTER';font.size=.48;font.extrude=.003;font.materials.append(cream)
    letter=object_with_data("Gateway • "+font.body,font,lanterns,(sign*6.12,-12.03,2.28))
    letter.rotation_euler.x=math.pi/2

# Bench built at origin in its own reusable collection. Local forward is Blender +Y.
bench_asset = bpy.data.collections.new("Asset • 1.65 m park bench")
bench_parts=[]
def board(name, mat, xyz, dims):
    obj=box(name,mat,bench_asset,xyz,dims,bevel=.035)
    bench_parts.append(obj);return obj

for xx in (-.58,.58):
    for y in (-.19,.19):board("Forged leg",iron,(xx,y,.22),(.062,.064,.44))
    board("Seat bearer",iron,(xx,0,.424),(.085,.56,.069))
    upr=board("Back rail",iron,(xx,-.236,.625),(.055,.052,.58));upr.rotation_euler.x=.09
for j in range(4):board("Seat slat",benchwood,(0,-.19+j*.124,.466),(1.65,.111,.047))
for j in range(3):board("Back slat",benchwood,(0,-.254-j*.013,.61+j*.114),(1.65,.050,.09))
for xx in (-.77,.77):
    board("Arm riser",iron,(xx,.11,.56),(.041,.045,.18))
    board("Arm cap",benchwood,(xx,-.03,.674),(.065,.40,.044))

for x,y,a in [(-4.8,4,-.7),(4.8,4,.7),(-13,11,-1.2),(13,11,1.2),(25,20,0),(-25,20,0)]:
    obj=object_with_data("Park bench",None,furniture,(x,y,.10))
    obj.instance_type='COLLECTION';obj.instance_collection=bench_asset;obj.rotation_euler.z=a
bpy.context.view_layer.update()
parts={}
for obj in bench_parts:
    mesh=obj.data
    mesh.calc_loop_triangles()
    tone='#af7952' if mesh.materials[0]==benchwood else '#333c45'
    positions=parts.setdefault(tone,[])
    # Collection source objects are not linked directly; compute local transforms explicitly.
    from mathutils import Matrix
    M=Matrix.LocRotScale(obj.location,obj.rotation_euler.to_quaternion(),obj.scale)
    for tri in mesh.loop_triangles:
        for index in tri.vertices:
            vx,vy,vz=M@mesh.vertices[index].co
            positions.extend(round(float(k),4) for k in (vx,vz,-vy))
(ASSETS/"bench.json").write_text(json.dumps({"parts":[{"color":k,"positions":v} for k,v in parts.items()]},separators=(',',':')))

for band in (-1,1):
    for i in range(10):
        x=band*(44+rng.random()*10); y=-33+i*7+rng.random()*3
        fir("Woodland spruce",x,y,round(rng.choice([4.8,5.6,6.4]),1),gardens)
    for i in range(4):
        x=band*(9+i*10); y=41+rng.uniform(-1,2); height=rng.uniform(5,8)
        box("Campus • masonry",wall,gardens,(x,y,height/2),(9,6,height))
        box("Snowy cornice",snow,gardens,(x,y,height),(9.8,6.7,.33))
        box("Campus • attic",roof,gardens,(x,y,height+.7),(8.7,5.8,1.25))
        box("Snow coping",snow,gardens,(x,y,height+1.38),(9.2,6.4,.22))
        for floor in range(2):
            for k in range(4):
                box("Distant warm glazing",gold if rng.random()>.35 else roof,gardens,
                    (x-3+k*2,y-3.02,1.55+floor*2.45),(.69,.05,1.23))
for i in range(32):
    x=rng.uniform(-55,55);y=rng.uniform(46,57)
    fir("Far ridge spruce",x,y,rng.choice([5.6,6.4,8.0]),gardens)

for sign in (-1,1):
    for x,y in [(8,-5),(18,8),(29,6),(23,14),(8,15),(37,-10),(39,24)]:
        x*=sign;h=rng.uniform(5.2,7.8)
        branch("Bare winter tree",bark,gardens,(x,y,.05),(x,y,h*.65),.13)
        for j in range(7):
            a=j*TAU/7+rng.uniform(-.28,.28); reach=rng.uniform(.9,1.6)
            origin=(x,y,h*(.25+j*.045))
            mid=(x+math.cos(a)*reach,y+math.sin(a)*reach,h*(.5+j*.045))
            tip=(mid[0]+math.cos(a+.2)*reach*.64,mid[1]+math.sin(a+.2)*reach*.64,mid[2]+h*.2)
            branch("Branch",bark,gardens,origin,mid,.07)
            branch("Twig",bark,gardens,mid,tip,.032)
            branch("Twig tip",bark,gardens,mid,(mid[0]+.16,mid[1]+.15,mid[2]+h*.18),.026)

world=bpy.data.worlds.new("Winter twilight sky")
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.39,.62,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.48
scene.world=world
area_light("Blue sky softbox",'AREA',(-22,-8,48),(.63,.76,1),26000,47,(0,0,0))
area_light("Sunset rim",'AREA',(8,26,33),(1,.66,.53),19000,29,(0,0,0))
area_light("Fir canopy glow",'POINT',(0,-2,6.3),(1,.56,.23),430,2.4)
camera_data=bpy.data.cameras.new("Main reference camera")
camera=object_with_data("Camera • entrance aerial",camera_data,studio,(0,-64,13))
camera.rotation_euler=(Vector((0,2,16.4))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.lens=33;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.unit_settings.system='METRIC'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.shading.color_type='MATERIAL'
            area.spaces.active.shading.light='STUDIO'
            area.spaces.active.overlay.show_overlays=False
from runpy import run_path
finish_world=run_path(str(ROOT / 'scripts' / 'winter-surface-detail.py'))['finish_world']
finish_world(scene, ASSETS)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS/"starlit-courtyard.blend"),compress=True)
