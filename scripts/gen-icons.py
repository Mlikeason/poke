#!/usr/bin/env python3
"""Generate classic Pokeball icons (red/black/white) at multiple sizes."""
from PIL import Image, ImageDraw
import math

SIZES = {
    "public/apple-touch-icon.png": 180,
    "public/icon-512.png": 512,
    "public/icon-192.png": 192,
    "public/favicon-32.png": 32,
}

RED = (238, 21, 21)
BLACK = (20, 20, 20)
WHITE = (255, 255, 255)

def make_pokeball(size):
    # Render at 4x then downsample for smooth edges
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    cx = cy = s // 2
    r = s // 2 - 2  # outer radius with 2px margin

    # Red top half (pie slice)
    d.pieslice([cx - r, cy - r, cx + r, cy + r], start=180, end=360, fill=RED)
    # White bottom half
    d.pieslice([cx - r, cy - r, cx + r, cy + r], start=0, end=180, fill=WHITE)

    # Black outer ring
    ring_w = max(2, int(s * 0.06))
    for i in range(ring_w):
        d.ellipse(
            [cx - r + i, cy - r + i, cx + r - i, cy + r - i],
            outline=BLACK, width=1
        )

    # Black horizontal band
    band_h = max(3, int(s * 0.09))
    d.rectangle([cx - r + ring_w, cy - band_h // 2, cx + r - ring_w, cy + band_h // 2], fill=BLACK)

    # Center button: black outer circle
    btn_r = int(s * 0.16)
    d.ellipse(
        [cx - btn_r, cy - btn_r, cx + btn_r, cy + btn_r],
        fill=BLACK
    )

    # White inner circle
    inner_r = int(s * 0.11)
    d.ellipse(
        [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
        fill=WHITE
    )

    # Black center dot
    dot_r = int(s * 0.045)
    d.ellipse(
        [cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r],
        fill=BLACK
    )

    # Downsample with LANCZOS for anti-aliased edges
    img = img.resize((size, size), Image.LANCZOS)
    return img


for path, size in SIZES.items():
    img = make_pokeball(size)
    img.save(path, "PNG")
    print(f"wrote {path} ({size}x{size})")
