import sys
from rembg import remove, new_session
from PIL import Image

SRC = "/app/frontend/public/logo.png"
OUT = "/app/frontend/public/logo-transparent.png"

img = Image.open(SRC).convert("RGBA")
# u2net general model with alpha matting for clean, halo-free edges
session = new_session("u2net")
out = remove(
    img,
    session=session,
    alpha_matting=True,
    alpha_matting_foreground_threshold=240,
    alpha_matting_background_threshold=15,
    alpha_matting_erode_size=10,
)

# Trim fully-transparent margins so the emblem fills the frame (appears larger)
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)

# Pad to a square with transparent background for consistent layout
w, h = out.size
side = max(w, h)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.paste(out, ((side - w) // 2, (side - h) // 2), out)
canvas.save(OUT)
print("saved", OUT, canvas.size)
