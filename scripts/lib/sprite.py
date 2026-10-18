"""Render a monster's idle pose from the client's .spr/.act files (first frame of action 0).

SPR holds the images (palette-indexed, RLE since 2.1, plus RGBA frames since 2.0); ACT says which
images (layers) form each frame, with offsets, mirroring, scale and tint. The layers are composed
around the sprite origin and the result is cropped to its content.
"""
import struct

from PIL import Image


def read_spr(data):
    if data[:2] != b'SP':
        raise ValueError('not a SPR file')
    ver = data[2] | (data[3] << 8)
    pos = 4
    n_idx = struct.unpack_from('<H', data, pos)[0]
    pos += 2
    n_rgba = 0
    if ver >= 0x200:
        n_rgba = struct.unpack_from('<H', data, pos)[0]
        pos += 2
    raw = []
    for _ in range(n_idx):
        w, h = struct.unpack_from('<HH', data, pos)
        pos += 4
        if ver >= 0x201:
            size = struct.unpack_from('<H', data, pos)[0]
            pos += 2
            src = data[pos:pos + size]
            pos += size
            out = bytearray()
            i = 0
            while i < len(src):
                b = src[i]
                if b == 0 and i + 1 < len(src):
                    out.extend(b'\0' * src[i + 1])
                    i += 2
                else:
                    out.append(b)
                    i += 1
            pix = bytes(out[:w * h]).ljust(w * h, b'\0')
        else:
            pix = data[pos:pos + w * h]
            pos += w * h
        raw.append(('idx', w, h, pix))
    for _ in range(n_rgba):
        w, h = struct.unpack_from('<HH', data, pos)
        pos += 4
        raw.append(('rgba', w, h, data[pos:pos + w * h * 4]))
        pos += w * h * 4
    palette = data[-1024:]

    images = []
    for kind, w, h, pix in raw:
        if w == 0 or h == 0:
            images.append(None)
            continue
        if kind == 'idx':
            rgba = bytearray(w * h * 4)
            for i, c in enumerate(pix):
                if c:
                    rgba[i * 4:i * 4 + 4] = bytes((palette[c * 4], palette[c * 4 + 1], palette[c * 4 + 2], 255))
            images.append(Image.frombytes('RGBA', (w, h), bytes(rgba)))
        else:
            # ABGR, de baixo para cima
            img = Image.frombytes('RGBA', (w, h), pix)
            r, g, b, a = img.split()
            images.append(Image.merge('RGBA', (a, b, g, r)).transpose(Image.FLIP_TOP_BOTTOM))
    return images, n_idx


def first_frame_layers(data):
    """Layers of action 0 / frame 0: [(x, y, spr_index, mirror, scale_x, scale_y, color, spr_type)]."""
    if data[:2] != b'AC':
        raise ValueError('not an ACT file')
    ver = data[2] | (data[3] << 8)
    n_actions = struct.unpack_from('<H', data, 4)[0]
    if not n_actions:
        return []
    pos = 16
    n_frames = struct.unpack_from('<I', data, pos)[0]
    pos += 4
    if not n_frames:
        return []
    pos += 32  # unused ranges
    n_layers = struct.unpack_from('<I', data, pos)[0]
    pos += 4
    layers = []
    for _ in range(n_layers):
        x, y, idx, mirror = struct.unpack_from('<iiii', data, pos)
        pos += 16
        color, sx, sy, spr_type = (255, 255, 255, 255), 1.0, 1.0, 0
        if ver >= 0x200:
            color = tuple(data[pos:pos + 4])
            pos += 4
            if ver >= 0x204:
                sx, sy = struct.unpack_from('<ff', data, pos)
                pos += 8
            else:
                sx = sy = struct.unpack_from('<f', data, pos)[0]
                pos += 4
            pos += 4  # rotation
            spr_type = struct.unpack_from('<i', data, pos)[0]
            pos += 4
            if ver >= 0x205:
                pos += 8  # width, height
        layers.append((x, y, idx, mirror, sx, sy, color, spr_type))
    return layers


def render_idle(spr_data, act_data):
    """Idle pose as a cropped RGBA image, or None."""
    images, n_idx = read_spr(spr_data)
    try:
        layers = first_frame_layers(act_data) if act_data else []
    except (ValueError, struct.error):
        layers = []
    if not layers:
        img = next((i for i in images if i is not None), None)
        return img
    size = 1024
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cx = cy = size // 2
    for x, y, idx, mirror, sx, sy, color, spr_type in layers:
        if idx < 0:
            continue
        real = idx + (n_idx if spr_type == 1 else 0)
        if real >= len(images) or images[real] is None:
            continue
        img = images[real]
        if mirror:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        if (sx, sy) != (1.0, 1.0) and sx > 0 and sy > 0:
            img = img.resize((max(1, round(img.width * sx)), max(1, round(img.height * sy))), Image.NEAREST)
        if color != (255, 255, 255, 255):
            r, g, b, a = img.split()
            r = r.point(lambda v, f=color[0]: v * f // 255)
            g = g.point(lambda v, f=color[1]: v * f // 255)
            b = b.point(lambda v, f=color[2]: v * f // 255)
            a = a.point(lambda v, f=color[3]: v * f // 255)
            img = Image.merge('RGBA', (r, g, b, a))
        left = cx + x - img.width // 2
        top = cy + y - img.height // 2
        canvas.alpha_composite(img, (max(0, left), max(0, top)))
    box = canvas.getbbox()
    return canvas.crop(box) if box else None
