"""
Process profile photo:
1. Remove background using rembg
2. Crop to bust framing
3. Composite onto a dark gradient matching the site theme
4. Save as profile.png in docs/images/
"""
from rembg import remove
from PIL import Image, ImageFilter, ImageDraw
import io

SRC = "content/profile/서승범_증명사진.jpg"
DST = "docs/images/profile.png"

# Load and remove background
with open(SRC, "rb") as f:
    input_bytes = f.read()
output_bytes = remove(input_bytes)
fg = Image.open(io.BytesIO(output_bytes)).convert("RGBA")

print(f"Cutout size: {fg.size}")

# Find the bounding box of non-transparent pixels for tight crop
bbox = fg.getbbox()
print(f"Subject bbox: {bbox}")
fg_cropped = fg.crop(bbox)

# Target output dimensions (matches CSS frame ~ 240x280, 6:7-ish)
# We use higher resolution for retina (2x = 480x560)
OUT_W, OUT_H = 480, 560

# Scale subject so face fills nicely - aim for subject height ~ 90% of canvas
subj_w, subj_h = fg_cropped.size
scale = (OUT_H * 0.95) / subj_h
new_w = int(subj_w * scale)
new_h = int(subj_h * scale)
fg_resized = fg_cropped.resize((new_w, new_h), Image.LANCZOS)

# Create dark gradient background matching site theme
# Site colors: --bg-card #131926 to --bg-card-hover #1a2235, with subtle blue glow
def make_gradient_bg(w, h):
    bg = Image.new("RGB", (w, h), (19, 25, 38))  # base #131926
    draw = ImageDraw.Draw(bg)

    # Radial-ish gradient: lighter in upper-center (behind face)
    cx, cy = w // 2, int(h * 0.35)
    max_r = max(w, h)

    pixels = bg.load()
    for y in range(h):
        for x in range(w):
            dx = x - cx
            dy = y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            t = min(dist / max_r, 1.0)
            # Interpolate from a slightly lifted blue-tinted color to deep navy
            # Center: #1e2a44 (lifted with blue tint), Edge: #0a0e17
            r = int(30 + (10 - 30) * t)
            g = int(42 + (14 - 42) * t)
            b = int(68 + (23 - 68) * t)
            pixels[x, y] = (r, g, b)
    return bg

print("Generating gradient background...")
bg = make_gradient_bg(OUT_W, OUT_H).convert("RGBA")

# Add subtle blue glow halo behind subject
glow = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
gx, gy = OUT_W // 2, int(OUT_H * 0.38)
for r in range(220, 80, -10):
    alpha = int(8 * (1 - (r - 80) / 140))
    glow_draw.ellipse(
        [gx - r, gy - r, gx + r, gy + r],
        fill=(59, 130, 246, alpha),
    )
glow = glow.filter(ImageFilter.GaussianBlur(radius=30))
bg = Image.alpha_composite(bg, glow)

# Center subject horizontally, anchor to bottom
paste_x = (OUT_W - new_w) // 2
paste_y = OUT_H - new_h - 10  # small bottom margin

# Slightly soften the alpha edges for natural blend
alpha = fg_resized.split()[3]
alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.8))
fg_resized.putalpha(alpha)

# Composite
bg.paste(fg_resized, (paste_x, paste_y), fg_resized)

# Save
bg.convert("RGB").save(DST, "PNG", optimize=True)
print(f"Saved: {DST} ({OUT_W}x{OUT_H})")
