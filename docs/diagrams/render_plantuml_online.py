"""Render a local PlantUML source through the official PlantUML PNG endpoint."""

from pathlib import Path
from urllib.request import Request, urlopen
import sys
import zlib


def encode6bit(value: int) -> str:
    if value < 10:
        return chr(48 + value)
    value -= 10
    if value < 26:
        return chr(65 + value)
    value -= 26
    if value < 26:
        return chr(97 + value)
    value -= 26
    if value == 0:
        return "-"
    if value == 1:
        return "_"
    return "?"


def append3bytes(b1: int, b2: int, b3: int) -> str:
    c1 = b1 >> 2
    c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
    c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
    c4 = b3 & 0x3F
    return "".join(encode6bit(value) for value in (c1, c2, c3, c4))


def plantuml_encode(source: str) -> str:
    compressed = zlib.compress(source.encode("utf-8"), 9)[2:-4]
    encoded = []
    for index in range(0, len(compressed), 3):
        chunk = compressed[index:index + 3]
        b1 = chunk[0]
        b2 = chunk[1] if len(chunk) > 1 else 0
        b3 = chunk[2] if len(chunk) > 2 else 0
        encoded.append(append3bytes(b1, b2, b3))
    return "".join(encoded)


source_path = Path(sys.argv[1]).resolve()
target_path = source_path.with_suffix(".png")
url = "https://www.plantuml.com/plantuml/png/" + plantuml_encode(source_path.read_text(encoding="utf-8"))
request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urlopen(request, timeout=60) as response:
    target_path.write_bytes(response.read())
print(target_path)
