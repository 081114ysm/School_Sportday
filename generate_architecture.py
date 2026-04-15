import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
import urllib.request
import io
import numpy as np
from PIL import Image, ImageDraw, ImageFont

plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False

# ── logo fetcher ───────────────────────────────────────────────────────────────
def fetch(url, size=52):
    try:
        with urllib.request.urlopen(url, timeout=8) as r:
            img = Image.open(io.BytesIO(r.read())).convert('RGBA').resize((size,size), Image.LANCZOS)
        return np.array(img)
    except Exception as e:
        print(f'fetch fail: {e}')
        return None

def circle_crop(arr):
    if arr is None: return None
    img = Image.fromarray(arr).convert('RGBA')
    s = img.size[0]
    mask = Image.new('L', (s,s), 0)
    ImageDraw.Draw(mask).ellipse([1,1,s-1,s-1], fill=255)
    out = Image.new('RGBA', (s,s), (0,0,0,0))
    out.paste(img, mask=mask)
    return np.array(out)

def person_icon(bg_hex, icon='user', size=52):
    """Draw a person silhouette icon with PIL."""
    img = Image.new('RGBA', (size,size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    bg = tuple(int(bg_hex.lstrip('#')[i:i+2],16) for i in (0,2,4))+(255,)
    # circle background
    d.ellipse([1,1,size-1,size-1], fill=bg)
    fg = (255,255,255,255)
    # head circle
    hw = size//5
    hx, hy = size//2, size*11//32
    d.ellipse([hx-hw, hy-hw, hx+hw, hy+hw], fill=fg)
    # body arc
    bw = size*9//20
    by1 = size*19//32
    by2 = size*29//32
    d.ellipse([hx-bw, by1, hx+bw, by2+bw], fill=fg)
    # gear overlay for admin
    if icon == 'admin':
        gear_size = size//4
        gx, gy = size*3//4, size//4
        d.ellipse([gx-gear_size//2, gy-gear_size//2,
                   gx+gear_size//2, gy+gear_size//2], fill=(255,200,50,255))
        inner = gear_size//3
        d.ellipse([gx-inner, gy-inner, gx+inner, gy+inner], fill=bg)
    return np.array(img)

def pill_logo(text, bg_hex, fg_hex='#ffffff', size=52):
    img = Image.new('RGBA', (size,size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    bg = tuple(int(bg_hex.lstrip('#')[i:i+2],16) for i in (0,2,4))+(220,)
    d.ellipse([1,1,size-1,size-1], fill=bg)
    try:
        font = ImageFont.truetype('arialbd.ttf', size//3)
    except:
        font = ImageFont.load_default()
    bb = d.textbbox((0,0), text, font=font)
    d.text(((size-(bb[2]-bb[0]))//2-bb[0], (size-(bb[3]-bb[1]))//2-bb[1]),
           text, fill=fg_hex, font=font)
    return np.array(img)

print('로고 다운로드 중...')
LOGOS = {
    'nextjs':     circle_crop(fetch('https://avatars.githubusercontent.com/u/14985020?s=56')),
    'nestjs':     circle_crop(fetch('https://avatars.githubusercontent.com/u/28507035?s=56')),
    'postgresql': circle_crop(fetch('https://avatars.githubusercontent.com/u/177543?s=56')),
    'socketio':   circle_crop(fetch('https://avatars.githubusercontent.com/u/1161889?s=56')),
    'railway':    circle_crop(fetch('https://avatars.githubusercontent.com/u/66716858?s=56')),
    'vercel':     circle_crop(fetch('https://avatars.githubusercontent.com/u/14985020?s=56')),
    'user':       person_icon('#3b82f6', 'user'),
    'admin':      person_icon('#ef4444', 'admin'),
    'sw':         pill_logo('SW', '#7c3aed'),
    'score':      pill_logo('SL', '#dc2626'),
    'push':       pill_logo('P',  '#7c3aed'),
}
loaded = [k for k,v in LOGOS.items() if v is not None]
print(f'완료: {loaded}')

# ── figure ─────────────────────────────────────────────────────────────────────
BG   = '#ffffff'
CARD = '#f6f8fa'
TXT  = '#1f2328'
TXT2 = '#656d76'
BORD = '#d0d7de'

fig, ax = plt.subplots(figsize=(14, 8))
fig.patch.set_facecolor(BG)
ax.set_facecolor(BG)
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis('off')

def place(cx, cy, key, zoom=0.40):
    arr = LOGOS.get(key)
    if arr is None: return
    oi = OffsetImage(arr, zoom=zoom)
    ax.add_artist(AnnotationBbox(oi, (cx,cy), frameon=False, zorder=7))

def node(cx, cy, logo_key, name, sub, color):
    w, h = 2.05, 2.25
    # shadow
    ax.add_patch(FancyBboxPatch((cx-w/2+0.03, cy-h/2-0.03), w, h,
        boxstyle='round,pad=0,rounding_size=0.22',
        linewidth=0, facecolor='#c8d0d8', alpha=0.5, zorder=2))
    # card
    ax.add_patch(FancyBboxPatch((cx-w/2, cy-h/2), w, h,
        boxstyle='round,pad=0,rounding_size=0.22',
        linewidth=1.4, edgecolor=color, facecolor=CARD, alpha=1.0, zorder=3))
    # logo glow ring
    ax.add_patch(plt.Circle((cx, cy+0.40), 0.44, color=color, alpha=0.10, zorder=4))
    ax.add_patch(plt.Circle((cx, cy+0.40), 0.44, fill=False,
        edgecolor=color, linewidth=1.1, alpha=0.5, zorder=5))
    place(cx, cy+0.40, logo_key, zoom=0.40)
    ax.text(cx, cy-0.22, name, fontsize=8.8, color=TXT,
            ha='center', va='center', fontweight='bold', zorder=8)
    ax.text(cx, cy-0.60, sub, fontsize=7.0, color=TXT2,
            ha='center', va='center', zorder=8)

def arr(x1,y1,x2,y2,color,lbl='',rad=0.0,lw=1.3):
    ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
        arrowprops=dict(arrowstyle='->', color=color, lw=lw,
                        connectionstyle=f'arc3,rad={rad}'), zorder=2)
    if lbl:
        mx,my = (x1+x2)/2,(y1+y2)/2+0.16
        ax.text(mx,my,lbl,fontsize=6.5,color=color,ha='center',va='bottom',zorder=9,
                bbox=dict(boxstyle='round,pad=0.18',facecolor='#ffffff',
                          edgecolor=BORD, linewidth=0.5, alpha=0.95))

def bidir(x1,y1,x2,y2,color,lbl='',rad=0.18,lw=1.3):
    arr(x1,y1,x2,y2,color,lbl, rad,lw)
    arr(x2,y2,x1,y1,color,'', -rad,lw)

# ── nodes ──────────────────────────────────────────────────────────────────────
node(1.5, 6.2, 'user',     '사용자',        'Browser / PWA',       '#3b82f6')
node(1.5, 3.6, 'admin',    '관리자',        'Admin Dashboard',     '#ef4444')
node(1.5, 1.2, 'sw',       'Service Worker','PWA Push 수신',       '#7c3aed')
node(4.2, 4.9, 'nextjs',   'Next.js',       'Vercel / App Router', '#16a34a')
node(7.2, 4.9, 'nestjs',   'NestJS',        'Railway / REST + WS', '#dc2626')
node(7.2, 2.2, 'socketio', 'Socket.IO',     'Gateway / Broadcast', '#d97706')
node(10.4,6.0, 'postgresql','PostgreSQL',   'TypeORM / Railway',   '#2563eb')
node(10.4,3.4, 'score',    'ScoreLog',      '점수 이력 / Undo',     '#dc2626')
node(10.4,1.0, 'push',     'Push Service',  'VAPID / web-push',    '#7c3aed')

# ── arrows ─────────────────────────────────────────────────────────────────────
arr(1.5+1.03,6.2,  4.2-1.03,5.2,  '#3b82f6','페이지 요청',rad=-0.15)
arr(1.5+1.03,3.6,  4.2-1.03,4.6,  '#ef4444','Admin UI',   rad=0.15)
bidir(4.2+1.03,4.9,7.2-1.03,4.9,  '#16a34a','REST API',   rad=0.18)
arr(4.2+0.6, 4.9-1.13,7.2-0.9,2.2+0.8,'#d97706','WebSocket',rad=-0.2)
arr(7.2-0.9, 2.2+0.6, 4.2+0.6,4.9-1.2,'#d97706','',        rad=-0.2)
arr(7.2,     4.9-1.13,7.2,    2.2+0.8,'#d97706','',         rad=0.0)
arr(7.2+0.12,2.2+0.8, 7.2+0.12,4.9-1.13,'#d97706','',      rad=0.0)
arr(7.2+1.03,5.1,  10.4-1.03,6.0, '#2563eb','TypeORM',    rad=-0.2)
arr(7.2+1.03,4.7,  10.4-1.03,3.6, '#dc2626','write',      rad=0.2)
arr(7.2+1.03,4.6,  10.4-1.03,1.4, '#7c3aed','VAPID',      rad=0.3)
arr(10.4-1.03,1.0, 1.5+1.03,1.2,  '#7c3aed','Push 알림',  rad=-0.3)

# ── title ──────────────────────────────────────────────────────────────────────
ax.text(7.0,7.65,'2026 경소마고 체육대회  시스템 아키텍처',
        fontsize=12.5,color=TXT,ha='center',va='center',fontweight='bold',zorder=9)

# ── badges ─────────────────────────────────────────────────────────────────────
def badge(x,y,logo_key,txt,bg,fg='#ffffff'):
    ax.text(x,y,txt,fontsize=7,color=fg,ha='center',va='center',
            fontweight='bold',zorder=10,
            bbox=dict(boxstyle='round,pad=0.30',facecolor=bg,edgecolor='none'))
    place(x-0.42,y,logo_key,zoom=0.19)

badge(4.4, 7.52,'vercel', '      Vercel',  '#000000')
badge(7.4, 7.52,'railway','      Railway', '#5b00cf')

# ── legend ─────────────────────────────────────────────────────────────────────
for i,(c,t) in enumerate([('#16a34a','REST'),('#d97706','WebSocket'),
                           ('#7c3aed','Web Push'),('#2563eb','DB'),('#3b82f6','Client')]):
    lx = 1.0+i*2.5
    ax.plot([lx,lx+0.45],[0.25,0.25],color=c,lw=1.8,zorder=8)
    ax.text(lx+0.62,0.25,t,fontsize=6.8,color=TXT2,va='center',zorder=8)

plt.tight_layout(pad=0.2)
plt.savefig('architecture.png',dpi=160,bbox_inches='tight',facecolor=BG,edgecolor='none')
plt.close()
print('architecture.png saved.')
