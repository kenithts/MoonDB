"""Build MoonDB equipment data from the rAthena emulator + the kRO client.

Outputs:
    public/data/equips.json       all equipment: weapons, armors, shadow gear, costumes and ammo
    public/img/items/<id>.webp    item illustrations (data.grf collection image, item icon as fallback)

Sources:
    rAthena  db/re/item_db_equip.yml + item_db_etc.yml (Ammo), db/pre-re only for ids missing in
             renewal; db/re/mob_db.yml for drops
    client   System/LuaFiles514/itemInfo.lua (English descriptions), itemInfo_true.lub (kRO names and
             resource names), data.grf (images)

Usage:
    python scripts/build_equips.py [--emulator PATH] [--client PATH] [--no-images]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from rodata import (  # noqa: E402
    DEFAULT_CLIENT, DEFAULT_EMU, ROOT, ClientText, load_all_items, load_drops, load_group_sources,
    item_image, load_items, open_grf,
)

EQUIP_TYPES = {'Weapon', 'Armor', 'ShadowGear', 'Shadowgear', 'Ammo'}

# rAthena job keys, in display order. Spirit_Handler is folded into Summoner (Doram).
JOBS = [
    'Novice', 'SuperNovice', 'Swordman', 'Knight', 'Crusader', 'Mage', 'Wizard', 'Sage', 'Archer',
    'Hunter', 'BardDancer', 'Acolyte', 'Priest', 'Monk', 'Merchant', 'Blacksmith', 'Alchemist', 'Thief',
    'Assassin', 'Rogue', 'Taekwon', 'StarGladiator', 'SoulLinker', 'Ninja', 'KagerouOboro', 'Gunslinger',
    'Rebellion', 'Summoner',
]
JOB_ALIASES = {'Spirit_Handler': 'Summoner'}

CLASS_TIERS = ['Normal', 'Upper', 'Baby', 'Third', 'Third_Upper', 'Third_Baby', 'Fourth']
CLASS_GROUPS = {
    'All': CLASS_TIERS,
    'All_Upper': ['Upper', 'Third_Upper'],
    'All_Baby': ['Baby', 'Third_Baby'],
    'All_Third': ['Third', 'Third_Upper', 'Third_Baby'],
}

ARMOR_CATEGORY = [  # first match wins
    ('Costume', ('Costume_Head_Top', 'Costume_Head_Mid', 'Costume_Head_Low', 'Costume_Garment')),
    ('Headgear', ('Head_Top', 'Head_Mid', 'Head_Low')),
    ('Shield', ('Left_Hand',)),
    ('Armor', ('Armor',)),
    ('Garment', ('Garment',)),
    ('Shoes', ('Shoes',)),
    ('Accessory', ('Both_Accessory', 'Right_Accessory', 'Left_Accessory')),
]


def resolve(flags, universe, groups=None, aliases=None):
    """rAthena Jobs/Classes map -> sorted list of the members that can equip.

    Missing map means everyone; 'All: true' plus 'X: false' means everyone but X.
    """
    if not flags:
        return list(universe)
    groups = groups or {'All': universe}
    allowed = set()
    for key, value in flags.items():  # groups first, so specific keys can override them
        if key in groups:
            allowed = allowed | set(groups[key]) if value else allowed - set(groups[key])
    for key, value in flags.items():
        if key in groups:
            continue
        key = (aliases or {}).get(key, key)
        if value:
            allowed.add(key)
        else:
            allowed.discard(key)
    return [u for u in universe if u in allowed]


def all_or(members, universe):
    """None when every member of universe is allowed (keeps the JSON small)."""
    return None if len(members) == len(universe) else members


def category(it):
    t = it['Type']
    if t == 'Weapon':
        return 'Weapon'
    if t == 'Ammo':
        return 'Ammo'
    if t.lower() == 'shadowgear':
        return 'Shadow'
    locs = {k for k, v in (it.get('Locations') or {}).items() if v}
    for cat, keys in ARMOR_CATEGORY:
        if locs & set(keys):
            return cat
    return 'Other'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emulator', type=Path, default=DEFAULT_EMU)
    ap.add_argument('--client', type=Path, default=DEFAULT_CLIENT)
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()
    db = args.emulator / 'db'

    items = load_items(db, ['item_db_equip.yml', 'item_db_etc.yml'], lambda it: it.get('Type') in EQUIP_TYPES)
    drops = load_drops(db)
    sources = load_group_sources(db, load_all_items(db))
    text = ClientText(args.client)
    print(f'equipment: {len(items)}')

    equips = []
    for item_id, (it, modes) in items.items():
        def script(key):
            return (it.get(key) or '').strip() or None

        equips.append({
            'id': item_id,
            'aegis': it['AegisName'],
            'name': it['Name'],
            'category': category(it),
            'subType': it.get('SubType'),
            'locations': [k for k, v in (it.get('Locations') or {}).items() if v],
            'slots': it.get('Slots', 0),
            'weight': it.get('Weight', 0) / 10,
            'buy': it.get('Buy'),
            'attack': it.get('Attack'),
            'magicAttack': it.get('MagicAttack'),
            'defense': it.get('Defense'),
            'range': it.get('Range'),
            'weaponLevel': it.get('WeaponLevel'),
            'armorLevel': it.get('ArmorLevel'),
            'levelMin': it.get('EquipLevelMin'),
            'levelMax': it.get('EquipLevelMax'),
            'refineable': bool(it.get('Refineable')),
            'gradable': bool(it.get('Gradable')),
            'gender': it.get('Gender') if it.get('Gender') in ('Female', 'Male') else None,
            'jobs': all_or(resolve(it.get('Jobs'), JOBS, aliases=JOB_ALIASES), JOBS),
            'classes': all_or(resolve(it.get('Classes'), CLASS_TIERS, groups=CLASS_GROUPS), CLASS_TIERS),
            'script': script('Script'),
            'equipScript': script('EquipScript'),
            'unequipScript': script('UnEquipScript'),
            'modes': modes,
            'droppedBy': drops.get(it['AegisName'].lower(), []),
            'obtainedFrom': sources.get(it['AegisName'].lower(), []),
            'description': text.description(item_id),
            'krName': text.kr_name(item_id),
            '_res': text.resource_name(item_id),
        })
    print(f'without English description: {sum(1 for e in equips if not e["description"])}')
    print(f'usable by nobody (check resolve): {sum(1 for e in equips if e["jobs"] == [])}')

    # --- images: collection illustration, falling back to the inventory icon ---
    grf = open_grf(args.client)
    img_dir = ROOT / 'public' / 'img' / 'items'
    img_dir.mkdir(parents=True, exist_ok=True)
    for e in equips:
        out = img_dir / f'{e["id"]}.webp'
        e['image'] = item_image(grf, e.pop('_res'), out, extract=not args.no_images)
    print(f'with image: {sum(1 for e in equips if e["image"])}')

    out = ROOT / 'public' / 'data' / 'equips.json'
    equips.sort(key=lambda e: e['id'])
    # Null fields are omitted; the frontend treats a missing key as null.
    equips = [{k: v for k, v in e.items() if v is not None} for e in equips]
    out.write_text(json.dumps(equips, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'wrote {out} ({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
