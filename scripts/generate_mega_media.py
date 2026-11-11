from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, json, colorsys, zipfile, shutil

ROOT=Path(__file__).resolve().parents[1]
IMG_DIR=ROOT/'assets'/'media'/'images'
GIF_DIR=ROOT/'assets'/'media'/'gifs'
for p in (IMG_DIR,GIF_DIR): p.mkdir(parents=True,exist_ok=True)

W=256
FONT_PATH='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

themes=[
 ('Cine','Ópera espacial','🚀'),('Cine','Arqueología aventurera','🏺'),('Cine','Cazafantasmas','👻'),('Cine','Dinosaurios en fuga','🦖'),('Cine','Kaiju contra ciudad','🐲'),
 ('Cine','Academia de magia','🪄'),('Cine','Fantasía épica','⚔️'),('Cine','Vampiros góticos','🧛'),('Cine','Apocalipsis zombi','🧟'),('Cine','Invasión alienígena','👽'),
 ('Cine','Robots rebeldes','🤖'),('Cine','Espías tecnológicos','🕶️'),('Cine','Piratas fantásticos','🏴‍☠️'),('Cine','Viajes temporales','⏳'),('Cine','Simulación virtual','💊'),
 ('Cine','Superhéroes multiversales','🦸'),('Cine','Mechas gigantes','🦾'),('Cine','Noir futurista','🌃'),('Cine','Terror cósmico','🐙'),('Cine','Mutantes y poderes','🧬'),
 ('Cine','Mundos postapocalípticos','☢️'),('Cine','Criaturas del bosque','🌲'),('Cine','Hechicería urbana','🔮'),('Cine','Misterio paranormal','🕯️'),('Cine','Videojuego cinematográfico','🎮'),
 ('Series','Tripulación estelar','🖖'),('Series','Misterios ochenteros','📼'),('Series','Reinos en guerra','👑'),('Series','Oficina paranormal','🗃️'),('Series','Supervivencia distópica','🎒'),
 ('Series','Detectives sobrenaturales','🔍'),('Series','Héroes disfuncionales','💥'),('Series','Parque de androides','🎩'),('Series','Hackers clandestinos','💻'),('Series','Cazadores de monstruos','🐺'),
 ('Series','Animación multiversal','🌀'),('Series','Academia de héroes','🎓'),('Series','Imperio galáctico','🌌'),('Series','Misterio de pueblo','🏚️'),('Series','Brujas contemporáneas','🌙'),
 ('Series','Samuráis del futuro','🗡️'),('Series','Ciencia imposible','🧪'),('Series','Familia monstruosa','🦇'),('Series','Exploradores del tiempo','⌚'),('Series','Detective androide','🦿'),
 ('Series','Rebelión de clones','🧫'),('Series','Comedia espacial','🛸'),('Series','Dragones y profecías','🐉'),('Series','Agencia secreta','📡'),('Series','Realidad alternativa','🪞')
]
reactions=[
 ('PLANAZO','Hoy se sale'),('SIN SPOILERS','Promesa de honor'),('MARATÓN','Un capítulo más'),('EPISODIO ÉPICO','Necesito hablar'),('SUBE DE NIVEL','Experiencia +100'),
 ('MISIÓN ACEPTADA','Forma la party'),('OTRO UNIVERSO','Vuelvo enseguida'),('PLOT TWIST','No me lo esperaba'),('FANDOM ON','Modo comunidad'),('MODO LEYENDA','Final desbloqueado')
]
palettes=[('#17152B','#6C4CF5','#FFD33D','#FFF7E6'),('#18132D','#FF4E91','#37D5D3','#FFFFFF'),('#102536','#37D5D3','#FF8A3D','#FFF7E6'),('#29132A','#FF8A3D','#FFD33D','#FFFFFF'),('#13291F','#63E69B','#A999FF','#FFF7E6')]

def fonts(size): return ImageFont.truetype(FONT_PATH,size),ImageFont.truetype(FONT_REG,max(10,size-5))

def fit(text,max_width,start=27,min_size=14):
 for s in range(start,min_size-1,-1):
  f=ImageFont.truetype(FONT_PATH,s)
  if f.getbbox(text)[2]<=max_width:return f
 return ImageFont.truetype(FONT_PATH,min_size)

def star(draw,x,y,r,fill,rot=0):
 pts=[]
 for i in range(10):
  a=math.radians(rot-90+i*36);rr=r if i%2==0 else r*.42
  pts.append((x+math.cos(a)*rr,y+math.sin(a)*rr))
 draw.polygon(pts,fill=fill)

def render(idx,group,theme,emoji,reaction,sub,frame=0):
 bg,accent,pop,paper=palettes[(idx+frame//2)%len(palettes)]
 im=Image.new('RGB',(W,W),bg);d=ImageDraw.Draw(im)
 # cinematic rays / moving orbit
 cx=128+int(math.sin(frame*math.pi/2)*4);cy=108
 for n in range(8):
  a=math.radians(n*45+frame*7);r=145
  x=cx+math.cos(a)*r;y=cy+math.sin(a)*r
  d.line((cx,cy,x,y),fill=accent,width=5)
 d.ellipse((32,12,224,204),fill=accent,outline=paper,width=4)
 d.ellipse((48,28,208,188),outline=bg,width=4)
 # symbolic central motif (emoji fallback may be monochrome/not present); use theme initials + geometry
 initials=''.join(w[0] for w in theme.split()[:2]).upper()
 d.rounded_rectangle((70,50,186,158),26,fill=bg,outline=pop,width=6)
 fbig=fit(initials,92,46,30)
 d.text((128,104),initials,font=fbig,fill=paper,anchor='mm')
 # animated stars and comet
 for k in range(5):
  ang=math.radians(k*72+frame*12);rr=88+(k%2)*8
  star(d,cx+math.cos(ang)*rr,cy+math.sin(ang)*rr,7+(k%2)*2,pop,frame*10)
 comet_x=25+((frame*47+idx*11)%210)
 d.ellipse((comet_x,27,comet_x+12,39),fill=paper)
 d.line((comet_x-20,33,comet_x,33),fill=pop,width=4)
 # captions
 d.rounded_rectangle((13,170,243,244),16,fill=paper)
 fr=fit(reaction,205,25,14)
 d.text((128,192),reaction,font=fr,fill=bg,anchor='mm')
 ft=fit(theme.upper(),205,12,9)
 d.text((128,218),theme.upper(),font=ft,fill=accent,anchor='mm')
 badge_font=ImageFont.truetype(FONT_PATH,9)
 d.rounded_rectangle((13,10,61,28),8,fill=pop)
 d.text((37,19),group.upper(),font=badge_font,fill=bg,anchor='mm')
 return im

items=[]
idx=0
for group,theme,emoji in themes:
 for reaction,sub in reactions:
  idx+=1;mid=f'm{idx:03d}'
  frames=[render(idx,group,theme,emoji,reaction,sub,f) for f in range(4)]
  frames[0].save(IMG_DIR/f'{mid}.png',optimize=True)
  frames[0].save(GIF_DIR/f'{mid}.gif',save_all=True,append_images=frames[1:],duration=[150,150,150,300],loop=0,optimize=True)
  items.append({'id':mid,'group':group,'theme':theme,'reaction':reaction,'subtitle':sub,'emoji':emoji,'image':f'assets/media/images/{mid}.png','gif':f'assets/media/gifs/{mid}.gif'})

assert idx==500
manifest='window.FRIKI_MEDIA='+json.dumps(items,ensure_ascii=False,separators=(',',':'))+';\n'
(ROOT/'media-manifest.js').write_text(manifest,encoding='utf-8')
# Split packs, plus complete packs, for manageable downloads
packs=ROOT/'assets'/'media'/'packs';packs.mkdir(exist_ok=True)
for old in packs.glob('*.zip'): old.unlink()
for start in range(0,500,100):
 with zipfile.ZipFile(packs/f'frikimadrid-media-{start+1:03d}-{start+100:03d}.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for item in items[start:start+100]:
   z.write(ROOT/item['image'],Path('imagenes')/Path(item['image']).name)
   z.write(ROOT/item['gif'],Path('gifs')/Path(item['gif']).name)
with zipfile.ZipFile(packs/'frikimadrid-500-imagenes.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for item in items:z.write(ROOT/item['image'],Path(item['image']).name)
with zipfile.ZipFile(packs/'frikimadrid-500-gifs.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for item in items:z.write(ROOT/item['gif'],Path(item['gif']).name)
print(json.dumps({'images':len(list(IMG_DIR.glob('*.png'))),'gifs':len(list(GIF_DIR.glob('*.gif'))),'items':len(items)},ensure_ascii=False))
