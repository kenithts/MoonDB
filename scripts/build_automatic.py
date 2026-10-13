"""Build MoonDB data for the Automatic equipment modules (Episode 17.2, Sage's Legacy).

A module (Type: Etc, e.g. 1000161 "Automatic Module(Cannon Tornado)") is enchanted by the NPC Lisa
onto Automatic equipment, where it becomes an "Automatic Orb" enchant (Type: Card) with the effect.
Grades, allowed pieces and the module -> orb mapping are not in the item db: they come from
npc/re/merchants/enchan_sage_legacy_17_2.txt and are mirrored below.

Outputs:
    public/data/automatic.json
    public/img/items/<id>.webp

Usage:
    python scripts/build_automatic.py [--emulator PATH] [--client PATH] [--no-images]
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from rodata import (  # noqa: E402
    DEFAULT_CLIENT, DEFAULT_EMU, ROOT, ClientText, item_image, load_all_items, load_drops, load_group_sources,
    load_items, open_grf, strip_colors,
)

# --- mirrored from enchan_sage_legacy_17_2.txt ---------------------------------------------
GRADES = {
    'normal': list(range(1000105, 1000113)),
    'rare': list(range(1000113, 1000128)),
    'unique': list(range(1000128, 1000144)) + [1000207, 1000208],
    'legendary': list(range(1000144, 1000150)),
    'epic1': list(range(1000152, 1000169)),
    'epic2': list(range(1000169, 1000186)),
    'epic3': list(range(1000186, 1000203)),
}

# piece -> {module: max copies on that piece}
PIECES = {
    'Garment': {1000105: 3, 1000106: 3, 1000125: 2, 1000126: 2, 1000127: 2, 1000135: 1, 1000142: 1, 1000208: 1},
    'Armor': {1000105: 3, 1000106: 3, 1000122: 2, 1000123: 2, 1000124: 2, 1000128: 1, 1000129: 1, 1000130: 1,
              1000131: 1, 1000132: 1, 1000133: 1, 1000207: 1, 1000140: 1,
              **{m: 2 for m in range(1000152, 1000203)}},  # epic: max 2 of the same
    'Shoes': {1000105: 3, 1000106: 3, 1000119: 2, 1000120: 2, 1000121: 2, 1000134: 1, 1000141: 1,
              **{m: 1 for m in range(1000144, 1000150)}},  # legendary: unique on the legs
    'Accessory': {1000107: 3, 1000108: 3, 1000109: 3, 1000110: 3, 1000111: 3, 1000112: 3, 1000113: 2, 1000114: 2,
                  1000115: 1, 1000116: 1, 1000117: 1, 1000118: 1, 1000136: 1, 1000137: 1, 1000138: 1, 1000139: 1,
                  1000143: 1},
}

# Equipment that accepts the modules, per piece (Type A/B; boosters and battle chips for accessories).
EQUIPMENT = {
    'Garment': [480020, 480021],
    'Armor': [450127, 450128],
    'Shoes': [470022, 470023],
    'Accessory': [490024, 490025, 490026, 490027],
}


def orb_ids():
    """Module -> orb enchant id, exactly as the NPC computes it."""
    out, n = {}, 0
    for module in range(1000105, 1000203):
        if module in (1000150, 1000151):
            continue
        out[module] = 310082 + n
        n += 1
    out[1000207] = 310178
    out[1000208] = 310179
    return out
# ----------------------------------------------------------------------------------------------


def trim_description(lines):
    """Drop the '[Enchantable Equipment]' block; the pieces are rendered from PIECES."""
    for i, line in enumerate(lines):
        if strip_colors(line).strip().lower().startswith('[enchantable equipment]'):
            lines = lines[:i]
            break
    while lines and (not strip_colors(lines[-1]).strip() or re.fullmatch(r'_{8,}', strip_colors(lines[-1]).strip())):
        lines = lines[:-1]
    return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emulator', type=Path, default=DEFAULT_EMU)
    ap.add_argument('--client', type=Path, default=DEFAULT_CLIENT)
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()
    db = args.emulator / 'db'

    grade_of = {m: g for g, ms in GRADES.items() for m in ms}
    orbs = orb_ids()
    items = load_items(db, ['item_db_etc.yml'], lambda it: it['Id'] in grade_of or it['Id'] in orbs.values())
    all_items = load_all_items(db)
    drops = load_drops(db)
    sources = load_group_sources(db, all_items)
    text = ClientText(args.client)
    equipment = {i: all_items_by_id(all_items, i) for ids in EQUIPMENT.values() for i in ids}

    grf = open_grf(args.client)
    img_dir = ROOT / 'public' / 'img' / 'items'
    img_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    for module, grade in grade_of.items():
        if module not in items:
            print(f'module {module} missing from item db, skipped')
            continue
        it, modes = items[module]
        orb_id = orbs[module]
        orb = items.get(orb_id, (None,))[0]
        pieces = [{'piece': p, 'max': allowed[module], 'equipment': [{'id': e, 'name': equipment[e]} for e in EQUIPMENT[p]]}
                  for p, allowed in PIECES.items() if module in allowed]
        aegis = it['AegisName'].lower()
        rows.append({
            'id': module,
            'aegis': it['AegisName'],
            'name': it['Name'],
            'grade': grade,
            'orb': {'id': orb_id, 'name': orb['Name'], 'script': (orb.get('Script') or '').strip() or None} if orb else None,
            'pieces': pieces,
            'weight': it.get('Weight', 0) / 10,
            'buy': it.get('Buy'),
            'modes': modes,
            'droppedBy': drops.get(aegis, []),
            'obtainedFrom': sources.get(aegis, []),
            'description': trim_description(text.description(module)),
            'krName': text.kr_name(module),
            'image': item_image(grf, text.resource_name(module), img_dir / f'{module}.webp', extract=not args.no_images),
        })

    order = list(GRADES)
    rows.sort(key=lambda r: (order.index(r['grade']), r['id']))
    print(f'modules: {len(rows)}; without orb: {sum(1 for r in rows if not r["orb"])}; '
          f'without piece: {sum(1 for r in rows if not r["pieces"])}; without description: '
          f'{sum(1 for r in rows if not r["description"])}; with image: {sum(1 for r in rows if r["image"])}')

    out = ROOT / 'public' / 'data' / 'automatic.json'
    rows = [{k: v for k, v in r.items() if v is not None} for r in rows]
    out.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'wrote {out} ({out.stat().st_size // 1024} KB)')


def all_items_by_id(all_items, item_id):
    return next((name for (i, name, _) in all_items.values() if i == item_id), str(item_id))


if __name__ == '__main__':
    main()
