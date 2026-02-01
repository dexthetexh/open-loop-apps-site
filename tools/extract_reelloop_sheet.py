from pathlib import Path
from PIL import Image
import json, zipfile

# =========================
# CONFIG
# =========================

# Point this to your source sheet image
SHEET_PATH = Path("Fish and Vistas levels 1 2.png")  # or full path if needed

# Output root (recommend within your Next.js repo)
OUT_ROOT = Path("public/games/reelloop/assets")

# If your sheet path is elsewhere, use absolute path:
# SHEET_PATH = Path(r"C:\Users\pc\Projects\open-loop-apps\path\to\sheet.png")

# =========================
# CROP BOXES (x1, y1, x2, y2)
# =========================
# IMPORTANT:
# These boxes are tuned for the sheet resolution ~2048x1117.
# If your image differs, run once, inspect results, and adjust numbers.
#
# Tip: adjust by small increments (+/- 10–30 px) until perfect.

ASSETS = {
  # --- Vista banners ---
  "vistas/vista_banner_sunny_lake": (20, 10, 760, 120),
  "vistas/vista_banner_ice_tundra": (20, 520, 820, 640),

  # --- Vista panels (top long scenes) ---
  "vistas/vista_panel_sunny_lake": (20, 135, 1340, 385),
  "vistas/vista_panel_ice_tundra": (20, 650, 1340, 900),

  # --- Reels (from gear panels) ---
  "reels/reel_sunny_lake": (1375, 125, 1635, 360),
  "reels/reel_ice_tundra": (1375, 650, 1635, 885),

  # --- Panel bobbers (optional) ---
  "bobbers/bobber_sunny_lake": (1640, 115, 1760, 360),
  "bobbers/bobber_ice_tundra": (1640, 670, 1760, 900),

  # --- Sunny Lake fish row (crop fish only, exclude labels) ---
  "fish/fish_bluegill": (60, 365, 360, 505),
  "fish/fish_yellow_perch": (380, 360, 720, 510),
  "fish/fish_rainbow_trout": (740, 360, 1160, 510),
  "fish/fish_largemouth_bass": (1200, 360, 1600, 520),
  "fish/fish_muskie": (1580, 360, 2040, 520),

  # --- Bobber row (colored set on Ice Tundra section) ---
  "bobbers/bobber_red": (80, 840, 240, 1010),
  "bobbers/bobber_green": (255, 840, 415, 1010),
  "bobbers/bobber_blue": (430, 840, 590, 1010),
  "bobbers/bobber_purple": (605, 840, 765, 1010),

  # --- Ice Tundra fish row (as shown on sheet; exclude labels) ---
  "fish/fish_frost_perch": (780, 840, 1120, 1010),
  "fish/fish_glacial_trout": (1120, 850, 1540, 1010),
  "fish/fish_legendary_frost_wyrm": (1540, 830, 2040, 1015),

  # --- Bottom scenic background cards ---
  "vistas/vista_bg_sunny_lake": (120, 1015, 980, 1115),
  "vistas/vista_bg_ice_tundra": (1080, 1015, 1940, 1115),
}

# =========================
# HELPERS
# =========================
def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def write_svg_wrapper(svg_path: Path, png_rel_path: str, width: int, height: int):
    # Minimal SVG wrapper referencing the PNG (works well for web)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <image href="{png_rel_path}" width="{width}" height="{height}" />
</svg>
'''
    svg_path.write_text(svg, encoding="utf-8")

def crop_and_save(img: Image.Image, name: str, box, out_dir: Path, asset_map: dict):
    x1, y1, x2, y2 = box
    cropped = img.crop((x1, y1, x2, y2))

    # Write PNG
    png_path = out_dir / f"{name}.png"
    ensure_dir(png_path.parent)
    cropped.save(png_path)

    # Write SVG wrapper pointing to PNG (relative path from svg to png)
    svg_path = out_dir / f"{name}.svg"
    # Make SVG reference relative within the same folder.
    png_rel = f"./{name}.png"
    write_svg_wrapper(svg_path, png_rel, cropped.size[0], cropped.size[1])

    asset_map[name] = {
        "png": str(png_path).replace("\\", "/"),
        "svg": str(svg_path).replace("\\", "/"),
        "box": [x1, y1, x2, y2],
        "size": [cropped.size[0], cropped.size[1]],
    }

def zip_folder(folder: Path, zip_path: Path):
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for p in folder.rglob("*"):
            if p.is_file():
                z.write(p, arcname=str(p.relative_to(folder.parent)))

# =========================
# MAIN
# =========================
def main():
    if not SHEET_PATH.exists():
        raise FileNotFoundError(f"Sheet not found: {SHEET_PATH.resolve()}")

    img = Image.open(SHEET_PATH).convert("RGBA")

    # Output directories
    fish_dir = OUT_ROOT / "fish"
    reels_dir = OUT_ROOT / "reels"
    bobbers_dir = OUT_ROOT / "bobbers"
    vistas_dir = OUT_ROOT / "vistas"
    export_dir = OUT_ROOT / "export"

    for d in [fish_dir, reels_dir, bobbers_dir, vistas_dir, export_dir]:
        ensure_dir(d)

    asset_map = {}

    # Crop & write assets
    for key, box in ASSETS.items():
        folder, filename = key.split("/", 1)

        if folder == "fish":
            out_dir = fish_dir
        elif folder == "reels":
            out_dir = reels_dir
        elif folder == "bobbers":
            out_dir = bobbers_dir
        elif folder == "vistas":
            out_dir = vistas_dir
        else:
            out_dir = OUT_ROOT

        crop_and_save(img, filename, box, out_dir, asset_map)

    # Write asset map
    map_path = OUT_ROOT / "asset-map.json"
    map_path.write_text(json.dumps(asset_map, indent=2), encoding="utf-8")

    # Zip export
    zip_path = export_dir / "reelloop-assets-extracted.zip"
    zip_folder(OUT_ROOT, zip_path)

    print("Done.")
    print(f"Assets: {OUT_ROOT.resolve()}")
    print(f"Zip:    {zip_path.resolve()}")

if __name__ == "__main__":
    main()
