"""Build MoonDB data for the Gray Wolf equipment enchants (Episode 18, Gray Wolf Village).

The NPC Emmet (wolfvill 164,137, npc/re/quests/quests_18.txt) opens the enchant UI with
item_enchant(1..5), one id per piece; ids 137..141 are the same pieces enchanted with a
Special Amethyst Fragment (direct choice). Costs, order, odds and the orb pool come from
db/re/item_enchant.yml; the equipment price comes from the barter shops of the same NPCs
(npc/re/merchants/barters/quests_18.yml). Only the id -> piece mapping is mirrored below.

Outputs:
    public/data/gray_wolf.json
    public/img/items/<id>.webp

Usage:
    python scripts/build_gray_wolf.py [--emulator PATH] [--client PATH] [--no-images]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from rodata import (  # noqa: E402
    DEFAULT_CLIENT, DEFAULT_EMU, ROOT, ClientText, item_image, load_all_items, load_group_sources, load_items, load_yaml,
    open_grf,
)

# --- mirrored from quests_18.txt (Emmet#emet) -------------------------------------------------
# piece -> (item_enchant id with Amethyst Fragment, item_enchant id with Special Amethyst Fragment)
PIECES = {
    'Armor': (1, 137),
    'Garment': (2, 138),
    'Shoes': (3, 139),
    'AccR': (4, 140),
    'AccL': (5, 141),
}
SHOPS = ('barter_ep18_1', 'barter_ep18_2', 'barter_ep18_3')
# ----------------------------------------------------------------------------------------------

AMETHYST = 'ep18_amethyst_fragment'
SPECIAL = 'sp_amethyst_fragment'


def amethyst_cost(materials, aegis=AMETHYST):
    """Amount of the given fragment in a Materials list; any other material is unexpected."""
    total = 0
    for m in materials or []:
        if m['Material'].lower() != aegis:
            raise SystemExit(f'unexpected enchant material {m["Material"]} (expected {aegis})')
        total += m.get('Amount', 1)
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emulator', type=Path, default=DEFAULT_EMU)
    ap.add_argument('--client', type=Path, default=DEFAULT_CLIENT)
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()
    db = args.emulator / 'db'

    enchant_db = {e['Id']: e for e in load_yaml(db / 're' / 'item_enchant.yml')}
    all_items = load_all_items(db)
    text = ClientText(args.client)
    grf = open_grf(args.client)
    img_dir = ROOT / 'public' / 'img' / 'items'
    img_dir.mkdir(parents=True, exist_ok=True)

    def item_ref(aegis):
        item_id, name, _ = all_items[aegis.lower()]
        return {'id': item_id, 'name': name}

    def image(item_id):
        return item_image(grf, text.resource_name(item_id), img_dir / f'{item_id}.webp', extract=not args.no_images)

    # orb aegis (lower) -> [{piece, step, chance?, perfect?, special?}]
    options = {}
    pieces = []
    for piece, (normal_id, special_id) in PIECES.items():
        normal, special = enchant_db[normal_id], enchant_db.get(special_id)
        steps_of = {o['Slot']: i + 1 for i, o in enumerate(normal['Order'])}
        reset = normal.get('Reset') or {}
        steps = []
        for slot in sorted(normal['Slots'], key=lambda s: steps_of[s['Slot']]):
            step = steps_of[slot['Slot']]
            pool = [x for g in slot.get('Enchants') or [] if g['Enchantgrade'] == 0 for x in g['Items']]
            total = sum(x['Chance'] for x in pool) or 1
            for x in pool:
                options.setdefault(x['Item'].lower(), []).append(
                    {'piece': piece, 'step': step, 'chance': round(x['Chance'] / total * 100, 3)})
            perfect = slot.get('PerfectEnchants') or []
            for x in perfect:
                opt = next((o for o in options.setdefault(x['Item'].lower(), [])
                            if o['piece'] == piece and o['step'] == step), None)
                cost = {'zeny': x.get('Price', 0), 'amethyst': amethyst_cost(x.get('Materials'))}
                if opt:
                    opt['perfect'] = cost
                else:
                    options[x['Item'].lower()].append({'piece': piece, 'step': step, 'perfect': cost})
            special_slot = next((s for s in (special or {}).get('Slots', []) if s['Slot'] == slot['Slot']), None)
            special_pool = (special_slot or {}).get('PerfectEnchants') or []
            for x in special_pool:
                amount = amethyst_cost(x.get('Materials'), SPECIAL)
                opt = next((o for o in options.setdefault(x['Item'].lower(), [])
                            if o['piece'] == piece and o['step'] == step), None)
                if opt:
                    opt['special'] = amount
                else:
                    options[x['Item'].lower()].append({'piece': piece, 'step': step, 'special': amount})
            steps.append({
                'step': step,
                'slot': slot['Slot'] + 1,
                'zeny': slot.get('Price', 0),
                'amethyst': amethyst_cost(slot.get('Materials')),
                'successRate': slot.get('Chance', 100000) / 1000,
                'random': len(pool),
                'perfect': len(perfect),
                'perfectCost': ({'zeny': perfect[0].get('Price', 0), 'amethyst': amethyst_cost(perfect[0].get('Materials'))}
                                if perfect else None),
                'special': len(special_pool),
            })
        equipment = [{**item_ref(a), 'image': image(item_ref(a)['id'])} for a in normal['TargetItems']]
        pieces.append({
            'piece': piece,
            'enchantId': normal_id,
            'equipment': equipment,
            'minRefine': normal.get('MinimumRefine', 0),
            'reset': {'zeny': reset.get('Price', 0), 'amethyst': amethyst_cost(reset.get('Materials')),
                      'chance': reset.get('Chance', 0) / 1000} if reset else None,
            'steps': steps,
        })

    # Barter shops of the Gray Wolf NPCs that take Amethyst Fragments.
    shop = []
    for s in load_yaml(args.emulator / 'npc' / 're' / 'merchants' / 'barters' / 'quests_18.yml'):
        if s['Name'] not in SHOPS:
            continue
        for entry in s['Items']:
            req = entry.get('RequiredItems') or []
            if len(req) != 1 or req[0]['Item'].lower() != AMETHYST:
                continue
            ref = item_ref(entry['Item'])
            if any(r['id'] == ref['id'] and r['amethyst'] == req[0].get('Amount', 1) for r in shop):
                continue
            shop.append({**ref, 'amethyst': req[0].get('Amount', 1), 'image': image(ref['id'])})

    items = load_items(db, ['item_db_etc.yml'], lambda it: it['AegisName'].lower() in options)
    rows = []
    for item_id, (it, modes) in items.items():
        rows.append({
            'id': item_id,
            'aegis': it['AegisName'],
            'name': it['Name'],
            'script': (it.get('Script') or '').strip() or None,
            'options': options[it['AegisName'].lower()],
            'weight': it.get('Weight', 0) / 10,
            'modes': modes,
            'droppedBy': [],
            'obtainedFrom': [],
            'description': text.description(item_id),
            'krName': text.kr_name(item_id),
            'image': image(item_id),
        })
    missing = set(options) - {r['aegis'].lower() for r in rows}
    if missing:
        print(f'orbs missing from item db: {sorted(missing)}')
    rows.sort(key=lambda r: r['id'])

    def fragment(aegis):
        ref = item_ref(aegis)
        return {**ref, 'description': text.description(ref['id']), 'image': image(ref['id']),
                'obtainedFrom': sources.get(aegis, [])}

    sources = load_group_sources(db, all_items)

    data = {
        'amethyst': fragment(AMETHYST),
        'special': fragment(SPECIAL),
        'pieces': pieces,
        'shop': shop,
        'enchants': [{k: v for k, v in r.items() if v is not None} for r in rows],
    }
    print(f'orbs: {len(rows)}; without description: {sum(1 for r in rows if not r["description"])}; '
          f'with image: {sum(1 for r in rows if r["image"])}; shop entries: {len(shop)}')

    out = ROOT / 'public' / 'data' / 'gray_wolf.json'
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'wrote {out} ({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
