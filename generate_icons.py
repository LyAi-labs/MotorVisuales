import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_master_icon(size=1024, is_maskable=False):
    # Master high-res image
    img = Image.new("RGBA", (size, size), (5, 5, 8, 255))
    draw = ImageDraw.Draw(img)
    center = size / 2

    # Safe zone scale for maskable icon (safe zone is 80% circle, so 0.72 scale keeps everything well inside)
    scale = 0.72 if is_maskable else 0.88
    r_max = (size / 2) * scale

    # 1. Subtle radial gradient glow in background
    glow_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    for r in range(int(r_max * 1.1), 0, -8):
        alpha = int(45 * (1.0 - r / (r_max * 1.1))**1.8)
        # Shift slightly toward cyan/indigo
        glow_draw.ellipse([center - r, center - r, center + r, center + r], 
                          fill=(0, 240, 255, alpha))
    for r in range(int(r_max * 0.6), 0, -6):
        alpha = int(60 * (1.0 - r / (r_max * 0.6))**2)
        glow_draw.ellipse([center - r, center - r, center + r, center + r], 
                          fill=(255, 0, 128, alpha))
    img = Image.alpha_composite(img, glow_img)
    draw = ImageDraw.Draw(img)

    # 2. Outer Cyber Dial Ring
    ring_r = r_max * 0.95
    ring_thickness = int(size * 0.012)
    draw.ellipse([center - ring_r, center - ring_r, center + ring_r, center + ring_r], 
                 outline=(0, 240, 255, 120), width=ring_thickness)
    
    # Tick marks around the ring
    num_ticks = 36
    for i in range(num_ticks):
        angle = i * (2 * math.pi / num_ticks)
        r_inner = ring_r - (size * 0.035 if i % 3 == 0 else size * 0.018)
        x1 = center + ring_r * math.cos(angle)
        y1 = center + ring_r * math.sin(angle)
        x2 = center + r_inner * math.cos(angle)
        y2 = center + r_inner * math.sin(angle)
        tick_color = (0, 240, 255, 230) if i % 3 == 0 else (120, 160, 220, 140)
        draw.line([(x1, y1), (x2, y2)], fill=tick_color, width=max(2, int(size * 0.005)))

    # 3. Audio Frequency Stem Bars (Circle / Radial Waveform)
    num_bars = 24
    bar_base_r = ring_r * 0.68
    for i in range(num_bars):
        angle = -math.pi/2 + (i / num_bars) * 2 * math.pi
        # Synthetic EQ heights symmetric or wave-like
        wave = math.sin(i * 0.8) * 0.5 + 0.5
        bar_len = (size * 0.05) + wave * (size * 0.12)
        
        # Color gradient: Cyan (#00f0ff) -> Magenta (#ff007f)
        ratio = i / num_bars
        cr = int(0 * (1 - ratio) + 255 * ratio)
        cg = int(240 * (1 - ratio) + 20 * ratio)
        cb = int(255 * (1 - ratio) + 160 * ratio)

        x_start = center + bar_base_r * math.cos(angle)
        y_start = center + bar_base_r * math.sin(angle)
        x_end = center + (bar_base_r + bar_len) * math.cos(angle)
        y_end = center + (bar_base_r + bar_len) * math.sin(angle)
        draw.line([(x_start, y_start), (x_end, y_end)], fill=(cr, cg, cb, 220), width=int(size * 0.016))

    # 4. Center Geometric "MV" Cyber Emblem
    # Central dark circular core
    core_r = bar_base_r * 0.82
    draw.ellipse([center - core_r, center - core_r, center + core_r, center + core_r], 
                 fill=(12, 16, 26, 255), outline=(0, 240, 255, 180), width=int(size * 0.008))

    # Inner hexagon/triangle accent
    pts = []
    for k in range(6):
        ang = k * (math.pi / 3) - math.pi / 6
        pts.append((center + (core_r * 0.88) * math.cos(ang), center + (core_r * 0.88) * math.sin(ang)))
    draw.polygon(pts, outline=(255, 0, 128, 90), width=int(size * 0.004))

    # Modern Stylized Geometric MV Glyph
    # "M" on left, "V" intertwined on right / unified cyber crest
    # Points of M:
    m_w = core_r * 0.65
    m_h = core_r * 0.55
    y_top = center - m_h * 0.5
    y_bot = center + m_h * 0.5

    # Bold neon M & V polygon strokes
    # Draw "M": Left leg, center V peak, right leg
    stroke_w = int(size * 0.038)
    
    # Cyan Glow pass behind glyph
    glyph_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gg_draw = ImageDraw.Draw(glyph_glow)
    
    # Points for stylized cyber "M":
    p1 = (center - m_w * 0.75, y_bot)
    p2 = (center - m_w * 0.75, y_top)
    p3 = (center - m_w * 0.22, y_bot * 0.85)
    p4 = (center + m_w * 0.22, y_top)
    
    # Points for "V" intersecting:
    v1 = (center - m_w * 0.15, y_top * 1.05)
    v2 = (center + m_w * 0.35, y_bot)
    v3 = (center + m_w * 0.85, y_top * 0.95)

    # Glow lines
    for p in [(p1, p2), (p2, p3), (p3, p4), (v1, v2), (v2, v3)]:
        gg_draw.line(p, fill=(0, 240, 255, 180), width=stroke_w + int(size * 0.02))
    glyph_glow = glyph_glow.filter(ImageFilter.GaussianBlur(radius=int(size * 0.018)))
    img = Image.alpha_composite(img, glyph_glow)
    draw = ImageDraw.Draw(img)

    # Foreground Sharp Crisp Glyph
    # Draw M in neon cyan
    draw.line([p1, p2], fill=(255, 255, 255, 255), width=stroke_w)
    draw.line([p2, p3], fill=(0, 240, 255, 255), width=stroke_w)
    draw.line([p3, p4], fill=(0, 240, 255, 255), width=stroke_w)

    # Draw V in hot fuchsia / magenta
    draw.line([v1, v2], fill=(255, 0, 128, 255), width=stroke_w)
    draw.line([v2, v3], fill=(255, 255, 255, 255), width=stroke_w)

    # Central quantum core bead
    bead_r = size * 0.02
    draw.ellipse([center - bead_r, center - bead_r, center + bead_r, center + bead_r], 
                 fill=(255, 255, 255, 255), outline=(0, 240, 255, 255), width=3)

    return img

def main():
    icons_dir = "icons"
    os.makedirs(icons_dir, exist_ok=True)

    print("Generando iconos de alta fidelidad para MotorVisuales PWA...")
    
    # Standard Icons (any)
    master_std = create_master_icon(size=1024, is_maskable=False)
    icon_512 = master_std.resize((512, 512), Image.Resampling.LANCZOS)
    icon_192 = master_std.resize((192, 192), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(icons_dir, "icon-512.png"), "PNG")
    icon_192.save(os.path.join(icons_dir, "icon-192.png"), "PNG")

    # Maskable Icons (safe zone padding for Android 8+)
    master_mask = create_master_icon(size=1024, is_maskable=True)
    mask_512 = master_mask.resize((512, 512), Image.Resampling.LANCZOS)
    mask_192 = master_mask.resize((192, 192), Image.Resampling.LANCZOS)
    mask_512.save(os.path.join(icons_dir, "icon-maskable-512.png"), "PNG")
    mask_192.save(os.path.join(icons_dir, "icon-maskable-192.png"), "PNG")

    # Favicon ICO with multiple sizes
    master_std.resize((64, 64), Image.Resampling.LANCZOS).save(
        os.path.join(icons_dir, "favicon.ico"), 
        format="ICO", 
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )

    # SVG Icon
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.3"/>
      <stop offset="60%" stop-color="#ff007f" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#050508" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#00f0ff"/>
    </linearGradient>
    <linearGradient id="fuchsiaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff007f"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="110" fill="#050508"/>
  <circle cx="256" cy="256" r="220" fill="url(#bgGlow)"/>

  <!-- Outer Dial Ring -->
  <circle cx="256" cy="256" r="200" fill="none" stroke="#00f0ff" stroke-width="4" stroke-opacity="0.5" stroke-dasharray="12 6"/>
  <circle cx="256" cy="256" r="170" fill="#0c101a" stroke="#ff007f" stroke-width="3" stroke-opacity="0.4"/>

  <!-- Audio Stem Waves -->
  <g stroke-linecap="round" filter="url(#glow)">
    <line x1="130" y1="256" x2="130" y2="210" stroke="#00f0ff" stroke-width="6"/>
    <line x1="150" y1="256" x2="150" y2="180" stroke="#00f0ff" stroke-width="6"/>
    <line x1="170" y1="256" x2="170" y2="140" stroke="#00f0ff" stroke-width="6"/>
    <line x1="342" y1="256" x2="342" y2="150" stroke="#ff007f" stroke-width="6"/>
    <line x1="362" y1="256" x2="362" y2="190" stroke="#ff007f" stroke-width="6"/>
    <line x1="382" y1="256" x2="382" y2="230" stroke="#ff007f" stroke-width="6"/>
  </g>

  <!-- Cyber MV Monogram -->
  <g filter="url(#glow)">
    <polyline points="180,310 180,200 230,270 270,200" fill="none" stroke="url(#cyanGrad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="250,210 295,310 345,200" fill="none" stroke="url(#fuchsiaGrad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Center Core Quantum Singularity -->
  <circle cx="256" cy="256" r="7" fill="#ffffff" filter="url(#glow)"/>
</svg>'''
    with open(os.path.join(icons_dir, "icon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)

    print("Iconos generados exitosamente:")
    for fn in os.listdir(icons_dir):
        print(f" - {fn}")

if __name__ == "__main__":
    main()
