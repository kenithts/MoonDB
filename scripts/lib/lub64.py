import struct
def convert(data):
    out = bytearray(data[:12]); out[8] = 8  # size_t -> 8
    p = 12
    def i32():
        nonlocal p; v = struct.unpack_from('<i', data, p)[0]; p += 4; return v
    def string():
        nonlocal p; n = struct.unpack_from('<I', data, p)[0]; p += 4
        out.extend(struct.pack('<Q', n)); out.extend(data[p:p+n]); p += n
    def raw(n):
        nonlocal p; out.extend(data[p:p+n]); p += n
    def fn():
        nonlocal p
        string(); raw(8); raw(4)
        n = i32(); out.extend(struct.pack('<i', n)); raw(4*n)
        n = i32(); out.extend(struct.pack('<i', n))
        for _ in range(n):
            t = data[p]; raw(1)
            if t == 1: raw(1)
            elif t == 3: raw(8)
            elif t == 4: string()
        n = i32(); out.extend(struct.pack('<i', n))
        for _ in range(n): fn()
        n = i32(); out.extend(struct.pack('<i', n)); raw(4*n)
        n = i32(); out.extend(struct.pack('<i', n))
        for _ in range(n): string(); raw(8)
        n = i32(); out.extend(struct.pack('<i', n))
        for _ in range(n): string()
    fn(); return bytes(out)
