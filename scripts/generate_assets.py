from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "stickers"
OUT.mkdir(parents=True, exist_ok=True)
ICON = ROOT / "assets" / "icons"
ICON.mkdir(parents=True, exist_ok=True)
W=512

COLORS={
 "ink":"#17152B", "cream":"#FFF7E6", "purple":"#6C4CF5", "pink":"#FF4E91",
 "yellow":"#FFD33D", "cyan":"#37D5D3", "green":"#63E69B", "orange":"#FF8A3D", "white":"#FFFFFF"
}
try:
    BOLD=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",48)
    SMALL=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",34)
except:
    BOLD=SMALL=ImageFont.load_default()

def base(bg=None):
    return Image.new("RGBA",(W,W),bg or (0,0,0,0))

def outline_text(d, pos, text, font, fill, anchor="mm"):
    d.text(pos,text,font=font,fill=fill,stroke_width=8,stroke_fill=COLORS['ink'],anchor=anchor)

def save_all(name, im):
    im.save(OUT/f"{name}.png", optimize=True)
    im.save(OUT/f"{name}.webp", format="WEBP", lossless=True, quality=90, method=6)

def cosmic_cat(phase=0):
    im=base(); d=ImageDraw.Draw(im)
    # orbit
    d.ellipse((56,125,456,377),outline=COLORS['cyan'],width=16)
    # tail
    d.arc((315,230,470,430),250,95,fill=COLORS['ink'],width=38)
    d.arc((315,230,470,430),250,95,fill=COLORS['pink'],width=24)
    # head + ears
    d.polygon([(150,145),(190,68),(230,145)],fill=COLORS['purple'],outline=COLORS['ink'])
    d.polygon([(282,145),(330,72),(365,170)],fill=COLORS['purple'],outline=COLORS['ink'])
    d.rounded_rectangle((135,125,375,345),60,fill=COLORS['purple'],outline=COLORS['ink'],width=14)
    # face
    blink=phase in (2,3)
    if blink:
        d.line((195,230,232,230),fill=COLORS['ink'],width=12)
        d.line((285,230,322,230),fill=COLORS['ink'],width=12)
    else:
        d.ellipse((190,205,235,255),fill=COLORS['yellow'],outline=COLORS['ink'],width=9)
        d.ellipse((282,205,327,255),fill=COLORS['yellow'],outline=COLORS['ink'],width=9)
    d.polygon([(250,260),(267,260),(258,275)],fill=COLORS['pink'])
    d.arc((233,270,258,295),0,100,fill=COLORS['ink'],width=5); d.arc((258,270,283,295),80,180,fill=COLORS['ink'],width=5)
    # stars
    for i,(x,y,c) in enumerate([(85,95,'yellow'),(425,110,'pink'),(90,360,'green'),(420,370,'orange')]):
        r=10+(phase+i)%3*3
        d.regular_polygon((x,y,r),5,fill=COLORS[c],outline=COLORS['ink'])
    outline_text(d,(256,440),"MODO FRIKI",SMALL,COLORS['white'])
    return im

def d20(phase=0):
    im=base(); d=ImageDraw.Draw(im)
    bob=int(math.sin(phase*math.pi/3)*10)
    pts=[(256,65+bob),(420,180+bob),(360,385+bob),(152,385+bob),(92,180+bob)]
    d.polygon(pts,fill=COLORS['cyan'],outline=COLORS['ink'])
    d.line([pts[0],(256,300+bob),pts[1]],fill=COLORS['ink'],width=12)
    d.line([pts[4],(256,300+bob),pts[3]],fill=COLORS['ink'],width=12)
    d.line([pts[2],(256,300+bob)],fill=COLORS['ink'],width=12)
    d.line([pts[4],pts[1]],fill=COLORS['ink'],width=12)
    outline_text(d,(256,210+bob),"20",BOLD,COLORS['cream'])
    outline_text(d,(256,445),"CRÍTICO!",SMALL,COLORS['yellow'])
    return im

def joystick(phase=0):
    im=base(); d=ImageDraw.Draw(im)
    glow=12+(phase%3)*5
    d.rounded_rectangle((70,180,442,370),70,fill=COLORS['orange'],outline=COLORS['ink'],width=16)
    # stick
    d.line((175,230,175,125),fill=COLORS['ink'],width=30)
    d.ellipse((125,73,225,173),fill=COLORS['pink'],outline=COLORS['ink'],width=14)
    d.ellipse((292,235,342,285),fill=COLORS['yellow'],outline=COLORS['ink'],width=9)
    d.ellipse((350,285,400,335),fill=COLORS['green'],outline=COLORS['ink'],width=9)
    d.ellipse((78-glow,180-glow,442+glow,370+glow),outline=COLORS['yellow'],width=6)
    outline_text(d,(256,440),"1UP MADRID",SMALL,COLORS['white'])
    return im

def robot(phase=0):
    im=base(); d=ImageDraw.Draw(im)
    d.line((256,105,256,65),fill=COLORS['ink'],width=15)
    d.ellipse((238,42,274,78),fill=COLORS['pink'],outline=COLORS['ink'],width=8)
    d.rounded_rectangle((105,110,407,350),55,fill=COLORS['cream'],outline=COLORS['ink'],width=16)
    eye=COLORS['pink'] if phase%2 else COLORS['cyan']
    d.rounded_rectangle((155,180,225,245),18,fill=eye,outline=COLORS['ink'],width=10)
    d.rounded_rectangle((287,180,357,245),18,fill=eye,outline=COLORS['ink'],width=10)
    d.arc((205,240,307,310),0,180,fill=COLORS['ink'],width=10)
    # ears
    d.rounded_rectangle((72,175,115,285),15,fill=COLORS['yellow'],outline=COLORS['ink'],width=10)
    d.rounded_rectangle((397,175,440,285),15,fill=COLORS['yellow'],outline=COLORS['ink'],width=10)
    outline_text(d,(256,432),"BEEP BEEP",SMALL,COLORS['green'])
    return im

def portal(phase=0):
    im=base(); d=ImageDraw.Draw(im)
    for i in range(7,0,-1):
        r=40+i*25+((phase*5+i*3)%12)
        c=[COLORS['purple'],COLORS['pink'],COLORS['cyan'],COLORS['yellow']][i%4]
        d.ellipse((256-r,245-r,256+r,245+r),outline=c,width=15)
    d.ellipse((215,205,297,287),fill=COLORS['ink'])
    outline_text(d,(256,440),"NOS VEMOS ALLÍ",SMALL,COLORS['white'])
    return im

def pixel_heart(phase=0):
    im=base(); d=ImageDraw.Draw(im)
    s=32; ox=96; oy=86
    pattern=["01100110","11111111","11111111","01111110","00111100","00011000"]
    pulse=1.0+(0.08 if phase in (1,2) else 0)
    coords=[]
    for y,row in enumerate(pattern):
        for x,v in enumerate(row):
            if v=='1': coords.append((x,y))
    for x,y in coords:
        x0=256+(ox+x*s-224-256)*pulse; y0=215+(oy+y*s-170-215)*pulse
        d.rectangle((x0,y0,x0+s*pulse,y0+s*pulse),fill=COLORS['pink'],outline=COLORS['ink'],width=5)
    outline_text(d,(256,420),"PLANAZO",BOLD,COLORS['yellow'])
    return im

makers={"gato-cosmico":cosmic_cat,"dado-critico":d20,"arcade-madrid":joystick,"robot-amigo":robot,"portal-plan":portal,"corazon-pixel":pixel_heart}
for name,fn in makers.items():
    frames=[fn(i) for i in range(6)]
    save_all(name,frames[0])
    frames[0].save(OUT/f"{name}.gif",save_all=True,append_images=frames[1:],duration=160,loop=0,optimize=True,disposal=2)

# App icons
for size in (192,512):
    im=Image.new('RGBA',(size,size),COLORS['ink']); d=ImageDraw.Draw(im)
    pad=size//9
    d.rounded_rectangle((pad,pad,size-pad,size-pad),size//5,fill=COLORS['purple'])
    d.ellipse((size*.22,size*.22,size*.78,size*.78),fill=COLORS['yellow'],outline=COLORS['ink'],width=max(6,size//35))
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',int(size*.34))
    d.text((size/2,size*.52),'F',font=font,fill=COLORS['ink'],anchor='mm')
    im.save(ICON/f'icon-{size}.png',optimize=True)

# Social preview / hero
im=Image.new('RGB',(1200,630),COLORS['ink']); d=ImageDraw.Draw(im)
for x,y,r,c in [(930,90,260,'purple'),(1050,450,300,'pink'),(760,520,230,'cyan')]: d.ellipse((x-r,y-r,x+r,y+r),fill=COLORS[c])
d.rounded_rectangle((70,80,780,550),50,fill=COLORS['cream'])
font1=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',96)
font2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',42)
d.text((130,180),'FRIKIMADRID',font=font1,fill=COLORS['ink'])
d.text((135,310),'Tiendas · sitios · eventos · stickers',font=font2,fill=COLORS['purple'])
d.text((135,395),'Tu mapa para una aventura épica',font=font2,fill=COLORS['ink'])
im.save(ROOT/'assets'/'social-preview.jpg',quality=90,optimize=True)
print('Assets generated:', len(list(OUT.iterdir())))
