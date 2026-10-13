"""Build MoonDB card data from the rAthena emulator + the kRO client.

Outputs:
    public/data/cards.json        all cards (Type: Card, excluding SubType: Enchant)
    public/img/cards/<id>.webp    card illustrations (from data.grf cardbmp)

Sources:
    rAthena  db/re/item_db_etc.yml (+ db/pre-re for ids missing in renewal), db/re/mob_db.yml
    client   System/LuaFiles514/itemInfo.lua (English descriptions; legacy itemInfo_EN.lua as fallback)
             System/itemInfo_true.lub (kRO Korean names, 32-bit Lua 5.1 bytecode)
             data.grf / rtp_lang.grf (illustrations, prefix/postfix tables)

Usage:
    python scripts/build_cards.py [--emulator PATH] [--client PATH] [--no-images]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from rodata import (  # noqa: E402
    DEFAULT_CLIENT, DEFAULT_EMU, ROOT, UI_DIR, ClientText, load_all_items, load_drops, load_group_sources,
    load_items, open_grf, read_table,
    save_webp,
)

CARDBMP_DIR = UI_DIR + 'cardbmp\\'

# rAthena Locations -> slot the card is compounded on
SLOT_BY_LOCATION = {
    'Right_Hand': 'Weapon',
    'Both_Hand': 'Weapon',
    'Left_Hand': 'Shield',
    'Armor': 'Armor',
    'Garment': 'Garment',
    'Shoes': 'Shoes',
    'Head_Top': 'Headgear',
    'Head_Mid': 'Headgear',
    'Head_Low': 'Headgear',
    'Both_Accessory': 'Accessory',
    'Right_Accessory': 'Accessory',
    'Left_Accessory': 'Accessory',
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emulator', type=Path, default=DEFAULT_EMU)
    ap.add_argument('--client', type=Path, default=DEFAULT_CLIENT)
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()
    db = args.emulator / 'db'

    items = load_items(db, ['item_db_etc.yml'],
                       lambda it: it.get('Type') == 'Card' and it.get('SubType') != 'Enchant')
    drops = load_drops(db)
    sources = load_group_sources(db, load_all_items(db))
    text = ClientText(args.client)
    print(f'cards: {len(items)}')

    cards = []
    for item_id, (it, modes) in items.items():
        locs = [k for k, v in (it.get('Locations') or {}).items() if v]
        cards.append({
            'id': item_id,
            'aegis': it['AegisName'],
            'name': it['Name'],
            'slots': sorted({SLOT_BY_LOCATION.get(k, k) for k in locs}),
            'weight': it.get('Weight', 0) / 10,
            'buy': it.get('Buy'),
            'flags': sorted(k for k, v in (it.get('Flags') or {}).items() if v),
            'script': (it.get('Script') or '').strip() or None,
            'unequipScript': (it.get('UnEquipScript') or '').strip() or None,
            'modes': modes,
            'droppedBy': drops.get(it['AegisName'].lower(), []),
            'obtainedFrom': sources.get(it['AegisName'].lower(), []),
            'description': text.description(item_id),
            'krName': text.kr_name(item_id),
        })
    print(f'without English description: {sum(1 for c in cards if not c["description"])}')

    # --- client: prefixes, illustrations ---
    data_grf = open_grf(args.client)
    lang_grf = open_grf(args.client, 'rtp_lang.grf')
    prefixes = read_table(lang_grf, 'data\\cardprefixnametable.txt')
    postfix = set(read_table(data_grf, 'data\\cardpostfixnametable.txt'))
    illust = read_table(data_grf, 'data\\num2cardillustnametable.txt')

    img_dir = ROOT / 'public' / 'img' / 'cards'
    img_dir.mkdir(parents=True, exist_ok=True)
    for c in cards:
        c['prefix'] = prefixes.get(c['id'])
        c['postfix'] = c['id'] in postfix
        name = illust.get(c['id'])
        path = f'{CARDBMP_DIR}{name}.bmp' if name else None
        c['image'] = bool(path and path in data_grf)
        out = img_dir / f'{c["id"]}.webp'
        if c['image'] and not args.no_images and not out.exists():
            save_webp(data_grf.read(path), out)
    print(f'with illustration: {sum(1 for c in cards if c["image"])}')

    out = ROOT / 'public' / 'data' / 'cards.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    cards.sort(key=lambda c: c['id'])
    out.write_text(json.dumps(cards, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'wrote {out} ({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
