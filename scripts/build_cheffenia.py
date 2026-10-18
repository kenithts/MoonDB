"""Build MoonDB data for the Cheffenia tab (public/data/cheffenia.json).

Cheffenia's monster lists per difficulty are curated by hand (the user's list, below). Each entry
points to the original monster in db/re/mob_db.yml (the "Nightmare" variants are not in rAthena),
from which element, element level, race, size and level are read. HP is fixed at 1,000,000 for
every monster. The element table (db/re/attr_fix.yml) goes along so the frontend can show how
much each attack element hits.

Sprites: monster id -> sprite name comes from the client's npcidentity.lub + jobname.lub (data.grf);
the idle pose (action 0, frame 0) of data/sprite/<monster>/<name>.spr + .act is saved to
public/img/mobs/<id>.webp. Existing images are never re-extracted.

Usage:
    python scripts/build_cheffenia.py [--emulator PATH] [--client PATH] [--no-images]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'lib'))
import lupa.lua51 as lua51  # noqa: E402
from lub64 import convert as lub_to_64  # noqa: E402
from rodata import DEFAULT_CLIENT, DEFAULT_EMU, ROOT, decode, load_yaml, open_grf  # noqa: E402
from sprite import render_idle  # noqa: E402

HP = 1_000_000

# --- curated by the user -----------------------------------------------------------------------
# difficulty -> [(name shown in the tab, mob_db id or None when rAthena has no data)]
# For monsters rAthena does not have, MANUAL holds what the user read in-game (marked source: game).
DIFFICULTIES = {
    'easy': [],
    'hard': [
        ('Amon-Ra', 1511),
        ('Sentinela Cecil', 3222),       # Ranger Cecil (MVP)
        ('Renegada Gertie', 3244),       # Shadow Chaser Gertie (MVP)
        ('Hatii', 1252),
        ('Pesar Noturno', 1768),         # Gloom Under Night
        ('Senhor das Trevas', 1272),     # Dark Lord
        ('Doppelganger', 1046),
        ('Drácula', 1389),
        ('Drake', 1112),
        ('Detardeurus', 1719),
        ('Maya', 1147),
        ('Abelha-Rainha', 1059),         # Mistress
        ('Bafomé', 1039),                # Baphomet
        ('Egnigem Cenia', 1658),         # Egnigem Cenia (MVP)
        ('Atroce', 1785),
        ('Vesper', 1685),
        ('Eddga', 1115),
        ('Osíris', 1038),
        ('Senhor dos Orcs', 1190),       # Orc Lord
        ('Orc Herói', 1087),             # Orc Hero
        ('Samurai Encarnado', 1492),     # Samurai Specter
        ('Flor do Luar', 1150),          # Moonlight Flower
        ('Senhor dos Mortos', 1373),     # Lord of the Dead
        ('Ktullanux', 1779),
        ('Kiel D-01', 1734),
        ('Memória de Thanatos', 1708),   # Thanatos Phantom
        ('Lady Tanee', 1688),
        ('Tao Gunka', 1583),
        ('General Tartaruga', 1312),     # Turtle General
        ('Faraó', 1157),                 # Pharaoh
        ('Cavaleiro da Tempestade', 1251),  # Stormy Knight
        ('Bispo Decadente', 1871),       # Falling Bishop
        ('Freeoni', 1159),               # Phreeoni
        ('Besouro-Ladrão Dourado', 1086),  # Golden Thief Bug
        ('Serpente Suprema', 1418),      # Evil Snake Lord
        ('RSX-0806', 1623),
        ('Beelzebub', 1874),
        ('Randgris', 1751),              # Valkyrie Randgris
        ('Ifrit', 1832),
        ('Amdarais', 2476),
    ],
    'nightmare': [
        ('Fenrir', 2564),
        ('Bijou', 3450),
        ('Jitterbug', 3108),
        ('Charleston', 3124),            # Charleston 3 (MVP)
        ('Morroc', 3097),                # Despair God Morroc (MVP)
        ('Reginleif', None),             # only commented out in mob_db.yml -> MANUAL
        ('Ingrid', None),                # only commented out in mob_db.yml -> MANUAL
        ('Scaraba', 2087),               # Scaraba Queen
        ('Muspellskoll', 20419),         # Rigid Muspellskoll (MVP)
        ('Jungoliant', 20601),           # Jewel Ungoliant
        ('Senhor das Trevas', 1272),     # Dark Lord
        ('Flor do Luar', 1150),          # Moonlight Flower
        ('Ktullanux', 1779),
        ('Drácula', 1389),
        ('General Tartaruga', 1312),     # Turtle General
        ('Ursinho Brilhante', 20260),    # Shining Teddy Bear
        ('Wootan Ancião', 20277),        # Ancient Wootan Defender (MVP)
        ('Presa Flamejante', 21301),     # Burning Fang
        ('Deusa Freya', 21317),          # Twisted God Freyja (MVP)
        ('Amdarais', 2476),
        ('Himmelmez', None),             # not in rAthena -> MANUAL
        ('Bestia', 20381),               # R48-85-Bestia
        ('Bestia R001', 20934),          # R001-Bestia
    ],
    'hallucination': [],
}

MANUAL = {
    # @mi in-game (print sent by the user)
    # 'sprite' = client sprite of the same monster (jobname.lub: JT_REGINLEIF, JT_INGRID, JT_MD_C_HEMEL)
    'Reginleif': {'id': 28144, 'rathenaName': 'Reginleif', 'level': 207, 'element': 'Fire', 'elementLevel': 4,
                  'race': 'Angel', 'size': 'Medium', 'mvp': True, 'sprite': 'reginleif'},
    'Ingrid': {'id': 28145, 'rathenaName': 'Ingrid', 'level': 207, 'element': 'Water', 'elementLevel': 4,
               'race': 'Angel', 'size': 'Medium', 'mvp': True, 'sprite': 'ingrid'},
    'Himmelmez': {'id': 28158, 'rathenaName': 'Phantom Himmelmez', 'level': 195, 'element': 'Dark', 'elementLevel': 4,
                  'race': 'Demihuman', 'size': 'Medium', 'mvp': True, 'sprite': 'c_himel'},
}
# ----------------------------------------------------------------------------------------------


SPRITE_DIR = 'data\\sprite\\몬스터\\'


def sprite_names(grf):
    """{monster id: sprite name} from npcidentity.lub (JT_X = id) + jobname.lub (JobNameTable)."""
    rt = lua51.LuaRuntime(encoding=None)
    run = rt.eval('function(s) local f, e = loadstring(s) if not f then error(e) end f() end')
    base = 'data\\luafiles514\\lua files\\datainfo\\'
    for name in ('npcidentity.lub', 'jobname.lub'):
        data = grf.read(base + name)
        try:
            data = lub_to_64(data)
        except Exception:
            pass  # already loadable (text or 64-bit)
        run(data)
    jt, table = rt.globals()[b'jobtbl'], rt.globals()[b'JobNameTable']
    out = {}
    for key, value in jt.items():
        spr = table[value]
        if spr:
            out[int(value)] = decode(spr).lower()
    return out


def extract_sprite(grf, name, out):
    """Idle pose -> out (.webp). Returns True if the image exists afterwards."""
    if out.exists():
        return True
    spr, act = SPRITE_DIR + name + '.spr', SPRITE_DIR + name + '.act'
    if spr not in grf:
        return False
    img = render_idle(grf.read(spr), grf.read(act) if act in grf else None)
    if img is None:
        return False
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, 'WEBP', lossless=True)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emulator', type=Path, default=DEFAULT_EMU)
    ap.add_argument('--client', type=Path, default=DEFAULT_CLIENT)
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()
    grf = open_grf(args.client)
    sprites = sprite_names(grf)
    img_dir = ROOT / 'public' / 'img' / 'mobs'
    db = args.emulator / 'db'

    mobs = {m['Id']: m for m in load_yaml(db / 're' / 'mob_db.yml')}
    attr = {}
    for lv in load_yaml(db / 're' / 'attr_fix.yml'):
        attr[str(lv['Level'])] = {atk: dict(defs) for atk, defs in lv.items() if atk != 'Level'}

    out = {}
    for diff, rows in DIFFICULTIES.items():
        out[diff] = []
        for name, mob_id in rows:
            m = mobs.get(mob_id) if mob_id else None
            if mob_id and not m:
                raise SystemExit(f'{name}: mob {mob_id} not found in mob_db.yml')
            row = {'name': name, 'hp': HP}
            sprite = None
            if name in MANUAL and not m:
                manual = dict(MANUAL[name])
                sprite = manual.pop('sprite', None)
                row.update(manual, source='game')
            if m:
                row.update({
                    'id': m['Id'],
                    'rathenaName': m['Name'],
                    'level': m.get('Level'),
                    'element': m.get('Element', 'Neutral'),
                    'elementLevel': m.get('ElementLevel', 1),
                    'race': m.get('Race'),
                    'size': m.get('Size'),
                    'mvp': bool(m.get('MvpExp')) or bool((m.get('Modes') or {}).get('Mvp')),
                })
                sprite = sprites.get(m['Id']) or m['AegisName'].lower()
            if sprite and row.get('id'):
                out_img = img_dir / f'{row["id"]}.webp'
                row['sprite'] = out_img.exists() if args.no_images else extract_sprite(grf, sprite, out_img)
                if not row['sprite']:
                    print(f'{name}: sprite {sprite} not found')
            out[diff].append(row)

    target = ROOT / 'public' / 'data' / 'cheffenia.json'
    target.write_text(json.dumps({'difficulties': out, 'attr': attr}, ensure_ascii=False, separators=(',', ':')),
                      encoding='utf-8')
    print(f'wrote {target} ({target.stat().st_size // 1024} KB); '
          + ', '.join(f'{d}: {len(r)}' for d, r in out.items()))


if __name__ == '__main__':
    main()
