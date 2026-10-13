"""Minimal GRF 0x200 reader, including the DES "mixed" decryption.

Port of rAthena src/common/grfio.cpp + des.cpp.

    g = Grf('data.grf')
    data = g.read('data\\sprite\\몬스터\\poring.spr')
"""
import struct
import zlib

_MASK = (0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01)
_IP = (58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
       62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
       57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
       61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7)
_FP = (40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
       38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
       36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
       34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25)
_TP = (16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10,
       2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25)
_S = (
    bytes.fromhex('ef0341fdd8741e4726effb22b3d8841e39aca76062c1cdba5c969059053b7a85'
                  '40fd1ec8e78a8b21da43649f2d14b172f55bc8b69c3776ec39a0a305526e0fd9'),
    bytes.fromhex('a7dd0d789e0be395603636 4ff9605aa31124d287c85275ecbbc14cba24fe8f19'.replace(' ', '') +
                  'da1366af49d090068c6afb91378d0d78bf4911f423e5ce3b55bca257e82274ce'),
    bytes.fromhex('2ceac1bf4a241fc27947a27cb6d96815 80565d0133fdf4aede30079be5839b68'.replace(' ', '') +
                  '49b42e831fc2b57ca219d8e57c2f83daf76b90fec4015a9761a63d400b58e63d'),
    bytes.fromhex('4dd1b20f28bde478f64a0f938b17d1a43aecc93593567ecb5520a0fe6c891762'
                  '17624bb1b4ded187c9143c4a7ea8e27da09ff65c6a098df00fe35325953628cb'),
)
_SUBST = {0x00: 0x2B, 0x2B: 0x00, 0x6C: 0x80, 0x01: 0x68, 0x68: 0x01, 0x48: 0x77, 0x60: 0xFF,
          0x77: 0x48, 0xB9: 0xC0, 0xC0: 0xB9, 0xFE: 0xEB, 0xEB: 0xFE, 0x80: 0x6C, 0xFF: 0x60}


def _perm(src, table):
    out = bytearray(8)
    for i, t in enumerate(table):
        j = t - 1
        if src[(j >> 3) & 7] & _MASK[j & 7]:
            out[(i >> 3) & 7] |= _MASK[i & 7]
    return out


def _des_block(b):
    b = _perm(b, _IP)
    t = bytearray(8)  # E (optimized form from des.cpp)
    t[0] = ((b[7] << 5) | (b[4] >> 3)) & 0x3f
    t[1] = ((b[4] << 1) | (b[5] >> 7)) & 0x3f
    t[2] = ((b[4] << 5) | (b[5] >> 3)) & 0x3f
    t[3] = ((b[5] << 1) | (b[6] >> 7)) & 0x3f
    t[4] = ((b[5] << 5) | (b[6] >> 3)) & 0x3f
    t[5] = ((b[6] << 1) | (b[7] >> 7)) & 0x3f
    t[6] = ((b[6] << 5) | (b[7] >> 3)) & 0x3f
    t[7] = ((b[7] << 1) | (b[4] >> 7)) & 0x3f
    s = bytearray(8)
    for i in range(4):
        s[i] = (_S[i][t[i * 2]] & 0xf0) | (_S[i][t[i * 2 + 1]] & 0x0f)
    tp = bytearray(8)
    for i, v in enumerate(_TP):
        j = v - 1
        if s[j >> 3] & _MASK[j & 7]:
            tp[(i >> 3) + 4] |= _MASK[i & 7]
    for i in range(4):
        b[i] ^= tp[4 + i]
    return _perm(b, _FP)


def _shuffle_dec(b):
    return bytearray((b[3], b[4], b[6], b[0], b[1], b[2], b[5], _SUBST.get(b[7], b[7])))


def _decode(buf, flags, srclen):
    n = len(buf) // 8
    if flags & 0x02:
        digits = 1
        i = 10
        while i <= srclen:
            digits += 1
            i *= 10
        cycle = 1 if digits < 3 else digits + 1 if digits < 5 else digits + 9 if digits < 7 else digits + 15
        for i in range(min(20, n)):
            buf[i * 8:i * 8 + 8] = _des_block(buf[i * 8:i * 8 + 8])
        j = -1
        for i in range(20, n):
            if i % cycle == 0:
                buf[i * 8:i * 8 + 8] = _des_block(buf[i * 8:i * 8 + 8])
                continue
            j += 1
            if j % 7 == 0 and j != 0:
                buf[i * 8:i * 8 + 8] = _shuffle_dec(buf[i * 8:i * 8 + 8])
    elif flags & 0x04:
        for i in range(min(20, n)):
            buf[i * 8:i * 8 + 8] = _des_block(buf[i * 8:i * 8 + 8])


class Grf:
    def __init__(self, path):
        self.path = path
        self.entries = {}
        with open(path, 'rb') as f:
            hdr = f.read(46)
            ver = struct.unpack('<I', hdr[42:46])[0]
            if ver == 0x200:
                off = struct.unpack('<I', hdr[30:34])[0]
                f.seek(46 + off)
                entry_fmt = '<IIIBI'
            elif ver == 0x300:
                # 2024+ kRO: 64-bit table/file offsets, 4 extra bytes before the table
                off = struct.unpack('<Q', hdr[30:38])[0]
                f.seek(46 + off + 4)
                entry_fmt = '<IIIBQ'
            else:
                raise ValueError(f'unsupported GRF version {ver:#x}')
            csz, _ = struct.unpack('<II', f.read(8))
            table = zlib.decompress(f.read(csz))
        self.version = ver
        entry_len = struct.calcsize(entry_fmt)
        pos = 0
        while pos < len(table):
            end = table.index(b'\0', pos)
            name = table[pos:end].decode('cp949', 'replace')
            pos = end + 1
            srclen, aligned, declen, flags, offset = struct.unpack(entry_fmt, table[pos:pos + entry_len])
            pos += entry_len
            if flags & 0x01:
                self.entries[name.lower()] = (srclen, aligned, declen, flags, offset)

    def __contains__(self, name):
        return name.lower() in self.entries

    def read(self, name):
        srclen, aligned, declen, flags, offset = self.entries[name.lower()]
        with open(self.path, 'rb') as f:
            f.seek(46 + offset)
            buf = bytearray(f.read(aligned))
        _decode(buf, flags, srclen)
        return zlib.decompress(bytes(buf[:srclen]))
