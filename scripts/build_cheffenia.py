"""Build MoonDB data for the Cheffenia tab (public/data/cheffenia.json).

Cheffenia's monster lists per difficulty are curated by hand (the user's list, below). Each entry
points to the original monster in db/re/mob_db.yml (the "Nightmare" variants are not in rAthena),
from which element, element level, race, size and level are read. HP is fixed at 1,000,000 for
every monster. The element table (db/re/attr_fix.yml) goes along so the frontend can show how
much each attack element hits.

Usage:
    python scripts/build_cheffenia.py [--emulator PATH]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from rodata import DEFAULT_EMU, ROOT, load_yaml  # noqa: E402

HP = 1_000_000

# --- curated by the user -----------------------------------------------------------------------
# difficulty -> [(name shown in the tab, mob_db id or None when rAthena has no data)]
# For monsters rAthena does not have, MANUAL holds what the user read in-game (marked source: game).
DIFFICULTIES = {
    'easy': [],
    'hard': [],
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
    'Reginleif': {'id': 28144, 'rathenaName': 'Reginleif', 'level': 207, 'element': 'Fire', 'elementLevel': 4,
                  'race': 'Angel', 'size': 'Medium', 'mvp': True},
    'Ingrid': {'id': 28145, 'rathenaName': 'Ingrid', 'level': 207, 'element': 'Water', 'elementLevel': 4,
               'race': 'Angel', 'size': 'Medium', 'mvp': True},
    'Himmelmez': {'id': 28158, 'rathenaName': 'Phantom Himmelmez', 'level': 195, 'element': 'Dark', 'elementLevel': 4,
                  'race': 'Demihuman', 'size': 'Medium', 'mvp': True},
}
# ----------------------------------------------------------------------------------------------


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emulator', type=Path, default=DEFAULT_EMU)
    args = ap.parse_args()
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
            if name in MANUAL and not m:
                row.update(MANUAL[name], source='game')
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
            out[diff].append(row)

    target = ROOT / 'public' / 'data' / 'cheffenia.json'
    target.write_text(json.dumps({'difficulties': out, 'attr': attr}, ensure_ascii=False, separators=(',', ':')),
                      encoding='utf-8')
    print(f'wrote {target} ({target.stat().st_size // 1024} KB); '
          + ', '.join(f'{d}: {len(r)}' for d, r in out.items()))


if __name__ == '__main__':
    main()
