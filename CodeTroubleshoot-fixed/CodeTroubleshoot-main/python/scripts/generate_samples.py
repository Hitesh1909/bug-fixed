from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "samples"
FONT_CANDIDATES = [
    Path(r"C:\Windows\Fonts\segoepr.ttf"),
    Path(r"C:\Windows\Fonts\segoesc.ttf"),
    Path(r"C:\Windows\Fonts\inkfree.ttf"),
    Path(r"C:\Windows\Fonts\comic.ttf"),
]


def load_font(size):
    for candidate in FONT_CANDIDATES:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def render(name, lines, size):
    font = load_font(64)
    padding = 48
    line_gap = 28
    widths = []
    heights = []
    for line in lines:
        box = font.getbbox(line)
        widths.append(box[2] - box[0])
        heights.append(box[3] - box[1])
    width = max(widths) + padding * 2
    height = sum(heights) + line_gap * (len(lines) - 1) + padding * 2
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    top = padding
    for line, line_height in zip(lines, heights):
        draw.text((padding, top), line, fill="black", font=font)
        top += line_height + line_gap
    image = image.resize(size, Image.Resampling.LANCZOS)
    image.save(SAMPLES / name, format="PNG")


def main():
    SAMPLES.mkdir(parents=True, exist_ok=True)
    render("note_clear.png", ["The quick brown fox jumps"], (1000, 360))
    render(
        "note_lines.png",
        ["Hello from the workshop", "Please review this note", "Thank you"],
        (1100, 760),
    )
    render("note_wide.png", ["Wide sample line"], (1400, 280))
    render("note_tall.png", ["Tall", "sample", "page"], (480, 1200))


if __name__ == "__main__":
    main()
