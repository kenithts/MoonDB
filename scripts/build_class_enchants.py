"""Build MoonDB class enchant data: the job stones compounded on costume gear.

Each class stone exists twice in rAthena:
    - Type: Etc   -> the stone item the player receives (e.g. 25706 High Priest Stone (Upper))
    - Type: Card, SubType: Enchant -> the enchant with the actual effect script (e.g. 29513)
Entries are the Card/Enchant versions, linked to their Etc twin by name. Stones that only exist
as Etc (no effect implemented in rAthena) are kept too, with their client description.

Outputs:
    public/data/class_enchants.json
    public/img/items/<id>.webp

Usage:
    python scripts/build_class_enchants.py [--emulator PATH] [--client PATH] [--no-images]
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from rodata import (  # noqa: E402
    DEFAULT_CLIENT, DEFAULT_EMU, ROOT, ClientText, item_image, load_all_items, load_drops, load_group_sources,
    load_items, load_yaml, open_grf,
)

# "<Class> Stone [II] (<slot>)"; some rAthena names lack the space ("SuraStone").
STONE_NAME = re.compile(r'^(?P<cls>.+?)\s*Stone(?P<two>\s+II)?\s*\((?P<slot>[A-Za-z]+)\)', re.I)

SLOTS = {'upper': 'Upper', 'top': 'Upper', 'middle': 'Middle', 'mid': 'Middle', 'lower': 'Lower',
         'low': 'Lower', 'bottom': 'Lower', 'garment': 'Garment', 'robe': 'Garment'}

# Class name as written in the item name -> (display class, rAthena job key, tier).
# Several rAthena names are wrong/placeholder; those were checked against the skills their
# scripts use (e.g. "Generic" uses GN_ skills = Genetic, "Holy Emperor" uses SJ_ = Star Emperor).
_T, _3, _4, _X = 'trans', 'third', 'fourth', 'expanded'
CLASSES = {
    'lord knight': ('Lord Knight', 'Knight', _T),
    'rune knight': ('Rune Knight', 'Knight', _3),
    'dragon knight': ('Dragon Knight', 'Knight', _4),
    'paladin': ('Paladin', 'Crusader', _T),
    'royal guard': ('Royal Guard', 'Crusader', _3),
    'imperial guard': ('Imperial Guard', 'Crusader', _4),
    'high wizard': ('High Wizard', 'Wizard', _T),
    'warlock': ('Warlock', 'Wizard', _3),
    'arch mage': ('Arch Mage', 'Wizard', _4),
    'archmage': ('Arch Mage', 'Wizard', _4),
    'professor': ('Professor', 'Sage', _T),
    'scholar': ('Professor', 'Sage', _T),
    'sorcerer': ('Sorcerer', 'Sage', _3),
    'elemental master': ('Elemental Master', 'Sage', _4),
    'sniper': ('Sniper', 'Hunter', _T),
    'ranger': ('Ranger', 'Hunter', _3),
    'windhawk': ('Windhawk', 'Hunter', _4),
    'clown gypsy': ('Clown & Gypsy', 'BardDancer', _T),
    'trentini gypsy': ('Clown & Gypsy', 'BardDancer', _T),
    'wanderer minstrel': ('Minstrel & Wanderer', 'BardDancer', _3),
    'wanderer maestro': ('Minstrel & Wanderer', 'BardDancer', _3),
    'wander mins': ('Minstrel & Wanderer', 'BardDancer', _3),
    "wanderer's": ('Minstrel & Wanderer', 'BardDancer', _3),
    'troubadour & trouvere': ('Troubadour & Trouvère', 'BardDancer', _4),
    'high priest': ('High Priest', 'Priest', _T),
    'archbishop': ('Arch Bishop', 'Priest', _3),
    'cardinal': ('Cardinal', 'Priest', _4),
    'champion': ('Champion', 'Monk', _T),
    'sura': ('Sura', 'Monk', _3),
    'inquisitor': ('Inquisitor', 'Monk', _4),
    'whitesmith': ('Whitesmith', 'Blacksmith', _T),
    'mastersmith': ('Whitesmith', 'Blacksmith', _T),
    'mechanic': ('Mechanic', 'Blacksmith', _3),
    'meister': ('Meister', 'Blacksmith', _4),
    'creator': ('Creator', 'Alchemist', _T),
    'genetic': ('Genetic', 'Alchemist', _3),
    'generic': ('Genetic', 'Alchemist', _3),
    'biolo': ('Biolo', 'Alchemist', _4),
    'assassin cross': ('Assassin Cross', 'Assassin', _T),
    'guillotine cross': ('Guillotine Cross', 'Assassin', _3),
    'shadow cross': ('Shadow Cross', 'Assassin', _4),
    'stalker': ('Stalker', 'Rogue', _T),
    'shadow chaser': ('Shadow Chaser', 'Rogue', _3),
    'abyss chaser': ('Abyss Chaser', 'Rogue', _4),
    'star gladiator': ('Star Gladiator', 'StarGladiator', _X),
    'star emperor': ('Star Emperor', 'StarGladiator', _3),
    'holy emperor': ('Star Emperor', 'StarGladiator', _3),
    'sky emperor': ('Sky Emperor', 'StarGladiator', _4),
    'celestial': ('Sky Emperor', 'StarGladiator', _4),
    'soul linker': ('Soul Linker', 'SoulLinker', _X),
    'soul reaper': ('Soul Reaper', 'SoulLinker', _3),
    'soul ascetic': ('Soul Ascetic', 'SoulLinker', _4),
    'ninja': ('Ninja', 'Ninja', _X),
    'kagerou': ('Kagerou', 'KagerouOboro', _3),
    'oboro': ('Oboro', 'KagerouOboro', _3),
    'shinkiro': ('Shinkiro', 'KagerouOboro', _4),
    'shiranui': ('Shiranui', 'KagerouOboro', _4),
    'gunslinger': ('Gunslinger', 'Gunslinger', _X),
    'rebellion': ('Rebellion', 'Rebellion', _3),
    'nightwatch': ('Night Watch', 'Rebellion', _4),
    'super novice': ('Super Novice', 'SuperNovice', _X),
    'hyper novice': ('Hyper Novice', 'SuperNovice', _4),
    'summoner': ('Summoner', 'Summoner', _X),
    'doram': ('Summoner', 'Summoner', _X),
    'spirit handler': ('Spirit Handler', 'Summoner', _4),
}

SLOT_ORDER = {'Upper': 0, 'Middle': 1, 'Lower': 2, 'Garment': 3}
TIER_ORDER = {_X: 0, _T: 1, _3: 2, _4: 3}


def parse(name):
    """-> (class info, slot, generation 1|2) or None if the item is not a class stone."""
    m = STONE_NAME.match(name)
    if not m:
        return None
    info = CLASSES.get(re.sub(r'\s+', ' ', m.group('cls').strip().lower()))
    slot = SLOTS.get(m.group('slot').lower())
    if not info or not slot:
        return None
    return info, slot, 2 if m.group('two') else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emulator', type=Path, default=DEFAULT_EMU)
    ap.add_argument('--client', type=Path, default=DEFAULT_CLIENT)
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()
    db = args.emulator / 'db'

    enchants = load_items(db, ['item_db_etc.yml'],
                          lambda it: it.get('Type') == 'Card' and it.get('SubType') == 'Enchant' and parse(it['Name']))
    stones = load_items(db, ['item_db_etc.yml'], lambda it: it.get('Type') == 'Etc' and parse(it['Name']))
    all_items = load_all_items(db)
    drops = load_drops(db)
    sources = load_group_sources(db, all_items)
    text = ClientText(args.client)

    # Etc stone <-> Card enchant twins share (class, slot, generation).
    def key(name):
        (cls, _, _), slot, gen = parse(name)
        return cls, slot, gen

    stones_by_key = {}
    for sid, (st, _) in sorted(stones.items()):
        stones_by_key.setdefault(key(st['Name']), []).append((sid, st))

    # One row per Card/Enchant; Etc stones of a key without any enchant become a row themselves.
    entries = [(item_id, it, modes, stones_by_key.get(key(it['Name']), [])) for item_id, (it, modes) in enchants.items()]
    enchant_keys = {key(it['Name']) for it, _ in enchants.values()}
    for k, group in stones_by_key.items():
        if k not in enchant_keys:
            (sid, st), rest = group[0], group[1:]
            entries.append((sid, st, stones[sid][1], rest))

    rows = []
    for item_id, it, modes, twins in entries:
        (cls, job, tier), slot, gen = parse(it['Name'])
        aegis = it['AegisName'].lower()
        description = text.description(item_id)
        resource = text.resource_name(item_id)
        box = sources.get(aegis, [])
        for sid, st in twins:
            description = description or text.description(sid)
            resource = resource or text.resource_name(sid)
            box = box or sources.get(st['AegisName'].lower(), [])
        rows.append({
            'id': item_id,
            'aegis': it['AegisName'],
            'name': it['Name'],
            'className': cls,
            'job': job,
            'tier': tier,
            'slot': slot,
            'generation': gen,
            # Etc "stone" items the player actually receives (same class/slot/generation).
            'stones': [{'id': sid, 'name': st['Name']} for sid, st in twins],
            'implemented': it['Type'] == 'Card',
            'weight': it.get('Weight', 0) / 10,
            'buy': it.get('Buy'),
            'script': (it.get('Script') or '').strip() or None,
            'modes': modes,
            'droppedBy': drops.get(aegis, []),
            'obtainedFrom': box,
            'description': description,
            'krName': text.kr_name(item_id),
            'combos': [],
            '_res': resource,
        })

    # --- combos that involve a class enchant ---
    by_aegis = {r['aegis'].lower(): r for r in rows}
    for combo in load_yaml(db / 're' / 'item_combos.yml'):
        script = (combo.get('Script') or '').strip()
        for group in combo['Combos']:
            members = [a.lower() for a in group['Combo']]
            for a in members:
                row = by_aegis.get(a)
                if not row:
                    continue
                row['combos'].append({
                    'items': [{'id': all_items[m][0], 'name': all_items[m][1]} for m in members
                              if m != a and m in all_items],
                    'script': script,
                })

    grf = open_grf(args.client)
    img_dir = ROOT / 'public' / 'img' / 'items'
    img_dir.mkdir(parents=True, exist_ok=True)
    for r in rows:
        r['image'] = item_image(grf, r.pop('_res'), img_dir / f'{r["id"]}.webp', extract=not args.no_images)

    rows.sort(key=lambda r: (r['job'], TIER_ORDER[r['tier']], r['className'], r['generation'], SLOT_ORDER[r['slot']], r['id']))
    print(f'class enchants: {len(rows)} ({sum(r["implemented"] for r in rows)} with effect script, '
          f'{sum(1 for r in rows if r["stones"])} linked to their stone item)')
    print(f'with combos: {sum(1 for r in rows if r["combos"])}, without description: '
          f'{sum(1 for r in rows if not r["description"])}, with image: {sum(1 for r in rows if r["image"])}')

    out = ROOT / 'public' / 'data' / 'class_enchants.json'
    rows = [{k: v for k, v in r.items() if v is not None} for r in rows]
    out.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'wrote {out} ({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
