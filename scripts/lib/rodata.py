"""Shared readers for the MoonDB data pipeline: rAthena (db/re) + the kRO client.

MoonDB is a generic, up-to-date RO database: official renewal data only. db/import and the
kenithRO server's custom client content are deliberately ignored (see CLAUDE.md).
"""
import io
import re
from pathlib import Path

import yaml
from PIL import Image
import lupa.lua51 as lua51

from grf import Grf
from lub64 import convert as lub_to_64

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_EMU = Path(r'C:\Users\Kenit\Desktop\kenithRO\emulator')
DEFAULT_CLIENT = Path(r'C:\Users\Kenit\Desktop\kenithRO\ReturnToProntera')

UI_DIR = 'data\\texture\\유저인터페이스\\'

_COLOR = re.compile(r'\^[0-9a-fA-F]{6}')
_SEPARATOR = re.compile(r'_{8,}')
# First lines of the client's trailing "item info" block, which we render from rAthena ourselves.
_META_START = re.compile(r'(Type|Item Type|Compound on|Weight|Location|Position|Requirement|Attack|Defense'
                         r'|Weapon Level|Armor Level)\s*:')


def load_yaml(path):
    with open(path, encoding='utf-8') as f:
        return yaml.load(f, Loader=yaml.CSafeLoader).get('Body') or []


def load_items(db, filenames, accept):
    """rAthena items from db/re, with db/pre-re only filling ids that renewal lacks.

    Returns {id: (item, modes)} for the items where accept(item) is true.
    """
    out = {}
    for mode in ('re', 'pre-re'):
        for name in filenames:
            path = db / mode / name
            if not path.exists():
                continue
            for it in load_yaml(path):
                if not accept(it):
                    continue
                if it['Id'] in out:
                    out[it['Id']][1].append(mode)
                else:
                    out[it['Id']] = (it, [mode])
    return out


def _mob_drops(path, pre_re):
    drops = {}
    for mob in load_yaml(path):
        is_mvp = bool((mob.get('Modes') or {}).get('Mvp')) or bool(mob.get('MvpExp'))
        for kind in ('Drops', 'MvpDrops'):
            for drop in mob.get(kind) or []:
                if not drop.get('Rate'):
                    continue
                row = {
                    'id': mob['Id'],
                    'name': mob['Name'],
                    'level': mob.get('Level', 1),
                    'rate': drop['Rate'] / 100,
                    'mvp': is_mvp,
                    'boss': mob.get('Class') == 'Boss',
                    'mvpReward': kind == 'MvpDrops',
                }
                if pre_re:
                    row['preRe'] = True
                drops.setdefault(str(drop['Item']).lower(), []).append(row)
    return drops


def load_drops(db):
    """{aegis name (lower): [drop, ...]} with base (1x) rates.

    Renewal mob_db first. Items that no monster drops in renewal fall back to their pre-renewal
    drops (flagged preRe), e.g. Deviling Card, which renewal removed from Deviling.
    """
    drops = _mob_drops(db / 're' / 'mob_db.yml', pre_re=False)
    for item, rows in _mob_drops(db / 'pre-re' / 'mob_db.yml', pre_re=True).items():
        drops.setdefault(item, rows)
    for rows in drops.values():
        rows.sort(key=lambda d: (-d['rate'], d['level']))
    return drops


_GROUP_REF = re.compile(r'\bIG_([A-Za-z0-9_]+)')


def load_group_sources(db, items_by_aegis):
    """{aegis name (lower): [{id, name, chance}]} — boxes/albums (item groups) that give the item.

    A group is attributed to every item whose script opens it (getrandgroupitem(IG_X), ...).
    chance is the % inside its SubGroup: 100 for Algorithm All, else Rate / sum(Rates).
    items_by_aegis: {aegis (lower): (id, name)} of all renewal items, used to name the openers.
    """
    openers = {}
    for aegis, (item_id, name, script) in items_by_aegis.items():
        for group in _GROUP_REF.findall(script or ''):
            rows = openers.setdefault(group.lower(), [])
            if all(r['id'] != item_id for r in rows):
                rows.append({'id': item_id, 'name': name})

    sources = {}
    for group in load_yaml(db / 're' / 'item_group_db.yml'):
        boxes = openers.get(group['Group'].lower())
        if not boxes:
            continue
        for sub in group.get('SubGroups') or []:
            entries = sub.get('List') or []
            total = sum(e.get('Rate', 0) for e in entries)
            for e in entries:
                if sub.get('Algorithm') == 'All' or not total:
                    chance = 100.0
                else:
                    chance = round(e.get('Rate', 0) / total * 100, 4)
                rows = sources.setdefault(str(e['Item']).lower(), [])
                for box in boxes:
                    if all(r['id'] != box['id'] for r in rows):
                        rows.append({**box, 'chance': chance})
    for rows in sources.values():
        rows.sort(key=lambda r: (-r['chance'], r['name']))
    return sources


def load_all_items(db):
    """{aegis (lower): (id, name, script)} of every renewal item (pre-re fills missing ids)."""
    out = {}
    for mode in ('re', 'pre-re'):
        for name in ('item_db_usable.yml', 'item_db_etc.yml', 'item_db_equip.yml'):
            path = db / mode / name
            if path.exists():
                for it in load_yaml(path):
                    out.setdefault(it['AegisName'].lower(), (it['Id'], it['Name'], it.get('Script')))
    return out


def decode(b):
    return b.decode('cp949', 'replace') if isinstance(b, bytes) else b


def strip_colors(text):
    return _COLOR.sub('', text)


def strip_meta_block(lines):
    """Drop the client's trailing 'Type: / Weight: / Requirement:' block (kept: effect blocks)."""
    plain = [strip_colors(line).strip() for line in lines]
    for i, p in enumerate(plain):
        if not _SEPARATOR.fullmatch(p):
            continue
        nxt = next((q for q in plain[i + 1:] if q), '')
        if _META_START.match(nxt):
            lines = lines[:i]
            break
    while lines and (not strip_colors(lines[-1]).strip() or _SEPARATOR.fullmatch(strip_colors(lines[-1]).strip())):
        lines = lines[:-1]
    return lines


class ClientText:
    """English descriptions + kRO names/resource names from the client's item info tables."""

    def __init__(self, client):
        system = client / 'System'
        self.rt = lua51.LuaRuntime(encoding=None)
        # Current ROenglishRE translation first; the legacy 2019 file only fills gaps.
        self.en = [self._table((system / 'LuaFiles514' / 'itemInfo.lua').read_bytes())]
        legacy = system / 'itemInfo_EN.lua'
        if legacy.exists():
            self.en.append(self._table(legacy.read_bytes()))
        self.kr = self._table(lub_to_64((system / 'itemInfo_true.lub').read_bytes()))

    def _table(self, source):
        fn = self.rt.eval('function(s) local f, e = loadstring(s) if not f then error(e) end f() return tbl end')
        return fn(source)

    @staticmethod
    def _lines(t):
        if t is None or lua51.lua_type(t) != 'table':
            return []
        return [decode(t[i]) for i in range(1, len(t) + 1)]

    def description(self, item_id):
        for t in self.en:
            e = t[item_id]
            lines = self._lines(e[b'identifiedDescriptionName']) if e else []
            if lines:
                return strip_meta_block(lines)
        return []

    def kr_name(self, item_id):
        k = self.kr[item_id]
        return decode(k[b'identifiedDisplayName']) if k else None

    def resource_name(self, item_id):
        for t in [self.kr, *self.en]:
            e = t[item_id]
            if e and e[b'identifiedResourceName']:
                return decode(e[b'identifiedResourceName'])
        return None


def read_table(grf, name):
    """Parse a client 'id#value#' text table from a GRF."""
    out = {}
    if name not in grf:
        return out
    for line in grf.read(name).decode('cp949', 'replace').splitlines():
        parts = line.split('#')
        if len(parts) >= 2 and parts[0].strip().isdigit():
            out[int(parts[0])] = parts[1].strip()
    return out


def open_grf(client, name='data.grf'):
    return Grf(str(client / name))


def item_image(grf, resource, out, extract=True):
    """Item illustration ('collection', 75x100) or inventory icon fallback -> out (.webp).

    Returns 'collection', 'icon' or None. Existing files are never re-extracted.
    """
    for kind, folder in (('collection', 'collection'), ('icon', 'item')):
        path = f'{UI_DIR}{folder}\\{resource}.bmp' if resource else None
        if path and path in grf:
            if extract and not out.exists():
                save_webp(grf.read(path), out, transparent_magenta=True)
            return kind
    return None


def save_webp(data, out, transparent_magenta=False, quality=85):
    img = Image.open(io.BytesIO(data))
    if transparent_magenta:
        img = img.convert('RGBA')
        px = img.load()
        for y in range(img.height):
            for x in range(img.width):
                r, g, b, _ = px[x, y]
                # The client keys out (near-)magenta as transparency.
                if r >= 0xF0 and g <= 0x10 and b >= 0xF0:
                    px[x, y] = (0, 0, 0, 0)
    else:
        img = img.convert('RGB')
    img.save(out, 'WEBP', quality=quality)
