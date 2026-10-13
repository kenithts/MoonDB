# MoonDB

Database web **geral** de Ragnarok Online — tudo do mais atualizado que já existiu, até a 4ª classe
(dados oficiais renewal). A marca exibida no site é "Database do Moonlight".

> **Escopo dos dados (decisão do usuário, não perguntar de novo):** o MoonDB **não** é o database de
> um servidor específico. O kenithRO é só a fonte dos arquivos (rAthena + client kRO). Use `db/re`
> (com `db/pre-re` apenas completando IDs ausentes), **não** aplique `db/import`, ignore que o
> servidor do kenithRO roda pre-renewal com 10x de drop (mostre as taxas base do rAthena) e ignore
> conteúdo custom do servidor (`itemInfo_C.lua`, itens em português do `rtp.grf`).

Site estático: Vite + React + TypeScript, hospedado no **GitHub Pages**. Não existe backend — todo dado
vem de JSON pré-gerado em `public/data/`.

## Comandos

```bash
npm run dev        # dev server em http://localhost:5173
npm run build      # tsc -b && vite build -> dist/  (precisa passar sem erros de TS)
npm run lint       # oxlint
npm run preview    # serve o dist/ localmente

python scripts/build_cards.py               # public/data/cards.json + public/img/cards/*.webp
python scripts/build_equips.py              # public/data/equips.json + public/img/items/*.webp
python scripts/build_class_enchants.py      # public/data/class_enchants.json + public/img/items/*.webp
python scripts/build_automatic.py           # public/data/automatic.json + public/img/items/*.webp
python scripts/build_<x>.py --no-images     # só o JSON (imagens existentes nunca são reextraídas)
```

Dependências Python do pipeline: `pyyaml`, `pillow`, `lupa`.

## Arquitetura

Duas metades independentes:

1. **Pipeline de dados (Python, roda local, offline)** — `scripts/`
   Lê o rAthena e o client do kenithRO e gera JSON + imagens em `public/`. O resultado é **commitado**;
   o GitHub Pages nunca roda Python e não tem acesso ao kenithRO.
2. **Frontend (React)** — `src/`
   Faz `fetch` dos JSONs em runtime e renderiza. Sem API, sem banco.

### Fontes de referência: `C:\Users\Kenit\Desktop\kenithRO`

O kenithRO é o projeto de servidor do usuário; aqui ele serve **só como fonte de arquivos**
(ver "Escopo dos dados" acima). Trate-o como **somente leitura** — nunca edite, mova ou apague nada lá.

- `emulator/` — rAthena (PACKETVER 20211103, renewal)
  - `db/re/*.yml` e `db/pre-re/*.yml` — base oficial (itens, mobs, skills, jobs, combos, refine...)
  - `db/import/*.yml` — customizações do servidor kenithRO (Orbes custom, drops alterados).
    **Não usar** no MoonDB.
- `ReturnToProntera/` — client
  - `System/LuaFiles514/itemInfo.lua` — tradução inglesa atual (ROenglishRE, `tbl`). É a que o client
    carrega (via `System/itemInfo.lua`). O `System/itemInfo_C.lua` (`tbl_custom`) é do servidor
    kenithRO — não usar.
  - `System/itemInfo_EN.lua` — tradução **antiga** (2019/2021); usar só como fallback.
  - `System/itemInfo_true.lub` — nomes kRO (bytecode Lua 5.1 32-bit; converter com `scripts/lib/lub64.py`)
  - `data.grf`, `rtp_lang.grf`, `rtp.grf` — sprites, ilustrações, tabelas (ler com `scripts/lib/grf.py`)
  - Strings do client são **cp949**; caminhos dentro do GRF usam `\` e nomes coreanos
    (ex.: `data\texture\유저인터페이스\cardbmp\`).

### Pipeline (`scripts/`)

- `lib/rodata.py` — **base comum** de todos os pipelines: `load_items` (re + pre-re preenchendo),
  `load_drops` (mob_db re, taxa base, MVP = `Modes.Mvp`/`MvpExp`, `MvpDrops` marcados como
  `mvpReward`), `ClientText` (descrição EN, nome KR, resource name), `strip_meta_block`, GRF/webp.
  Novos pipelines devem usar esta lib em vez de reimplementar.
- `build_cards.py` — cartas (`Type: Card`, exceto `SubType: Enchant`) + ilustração do `cardbmp`.
- `build_equips.py` — equipamentos (`item_db_equip`: Weapon/Armor/ShadowGear; `item_db_etc`: Ammo;
  pet eggs/armors fora). Categoria derivada de `Locations` (Costume_* -> Visual). `Jobs`/`Classes`
  resolvidos para listas (`Spirit_Handler` vira `Summoner`/Doram). Imagem = `collection` do
  `data.grf` (fundo branco), fallback ícone do inventário.
- `build_class_enchants.py` — pedras de classe (job stones) encaixadas em **costume**
  (topo/meio/baixo/capa). Cada pedra existe 2x no rAthena: `Etc` (o item que o jogador recebe, sem
  script, ex. 25706) e `Card/Enchant` (o efeito, ex. 29513); o JSON tem uma linha por Enchant com
  `stones[]` apontando os Etc (pode haver vários com o mesmo nome). Classe/slot vêm do nome
  (`<Classe> Stone [II] (<slot>)`) via tabela `CLASSES` — vários nomes do rAthena estão errados
  ("Generic" = Genetic, "Holy Emperor" = Star Emperor, "Celestial" = Sky Emperor), conferidos pelas
  skills do script. `combos[]` vem do `item_combos.yml`.
- `build_automatic.py` — módulos dos equipamentos Automatic (Ep 17.2). Raridade (Normal/Rare/Unique/
  Legendary/Epic I-III), peças aceitas + máximo de cópias e o mapeamento módulo (Etc) -> Orb (Card,
  `310082 + índice`) **não estão no item_db**: vêm do NPC `npc/re/merchants/enchan_sage_legacy_17_2.txt`
  e estão espelhados no topo do script. Se o rAthena atualizar o NPC, atualize as tabelas.
- `lib/grf.py` — leitor de GRF 0x200 com decriptação DES (port do `grfio.cpp` do rAthena).
- `lib/lub64.py` — converte bytecode Lua 32-bit -> 64-bit para carregar com `lupa`.

Ao adicionar uma nova seção (itens, monstros, skills, classes...), crie um `scripts/build_<coisa>.py`
no mesmo estilo: caminhos default apontando para o kenithRO com `--emulator`/`--client` para
sobrescrever, saída em `public/data/<coisa>.json` (compacto, `ensure_ascii=False`, ordenado por id)
e imagens em `public/img/<coisa>/<id>.webp`. Só reextraia imagens que ainda não existem.

### Formato dos dados

Os tipos TS em `src/lib/types.ts` (`CardItem`, `EquipItem`, `Drop`) são a referência do formato —
mantenha-os em sincronia com os scripts.

- `description[]`: linhas do client com códigos de cor `^RRGGBB`; linhas `____` separam blocos
  (bônus de refino, combos) e são renderizadas como `<hr>`. O bloco final de metadados do client
  (`Type:`/`Weight:`/`Requirement:`) é removido — esses dados vêm do rAthena.
- `droppedBy[].rate`: % base do rAthena (1x). Se nenhum monstro dropa o item no renewal, usa-se o
  drop do `db/pre-re/mob_db.yml` marcado `preRe: true` (ex.: Deviling Card, removida do Deviling no RE).
- `obtainedFrom[]`: caixas/álbuns (`db/re/item_group_db.yml`) que dão o item — o grupo é atribuído
  a todo item cujo script referencia `IG_<grupo>`; `chance` = % no sorteio do SubGroup (100 = `All`).
  ~380 cartas novas/"Sealed" não têm fonte em nenhum db (vêm de quests/NPCs).
- `equips.json` (~11 MB, ~1,4 MB gzip) omite campos nulos; `jobs`/`classes` ausentes = todos.

## Frontend

- React 19, TypeScript estrito (`noUnusedLocals`/`noUnusedParameters` — imports não usados quebram o build).
- Tailwind v4 via `@tailwindcss/vite` (sem `tailwind.config`; tema em `src/index.css`).
- shadcn/ui estilo `base-nova` sobre **Base UI** (`@base-ui/react`), não Radix. Componentes em
  `src/components/ui/` — adicione novos com `npx shadcn@latest add <nome>`.
- `cn` vem do pacote `cn` (do shadcn, substitui clsx + tailwind-merge), reexportado em `@/lib/utils`.
- Ícones: `lucide-react`. Alias `@/` -> `src/`.
- Roteamento: `react-router` (instalado, ainda não configurado).
- Estrutura das abas: cada tipo de item usa as peças compartilhadas —
  `components/browse-layout.tsx` (busca + painel de filtros + grid com scroll infinito),
  `components/filter-group.tsx` + `lib/facets.ts` (filtro facetado genérico: OR dentro do grupo,
  AND entre grupos, contadores consideram as outras facetas) e `components/item-detail.tsx`
  (modal com abas Descrição/Script e lista de drops). A aba só define facetas, tile e metadados.
- `lib/data.ts` faz cache dos JSONs por sessão (trocar de aba não rebaixa/reparseia).
- Não exporte constantes/funções de arquivos `.tsx` de componentes (quebra o fast refresh) —
  coloque em `src/lib/`.
- Os warnings `only-export-components` do oxlint nos componentes shadcn são esperados.
- Descrições do client contêm códigos `^RRGGBB` (cor) e `^000000` (reset): renderize como
  spans coloridos, não exiba o código cru.

## GitHub Pages — regras obrigatórias

- Site: **https://kenithts.github.io/MoonDB/** (GitHub Pages gratuito, repo público
  `kenithts/MoonDB`). O `base` do `vite.config.ts` é `/MoonDB/` no build e no `vite preview` e `/`
  no dev. **Nunca** use caminhos absolutos fixos como `/data/cards.json`:
  use `` `${import.meta.env.BASE_URL}data/cards.json` `` (o mesmo vale para imagens em `public/`).
- Pages não tem fallback de SPA: use `HashRouter` (ou `createHashRouter`) para que links diretos
  e refresh funcionem.
- Deploy: `.github/workflows/deploy.yml` faz build e publica a cada push na `main` (ou manual pela
  aba Actions). Requer Settings > Pages > Source = "GitHub Actions". `dist/` está no `.gitignore`.
- Para testar como no Pages: `npm run build && npm run preview` -> http://localhost:4173/MoonDB/.
- Fique atento ao tamanho de `public/`: JSONs grandes devem ser divididos ou carregados sob demanda.

## Estado atual

- Feito: pipeline de cartas (1546 cartas, 1276 com ilustração; 139 sem descrição em inglês em
  nenhum arquivo do client — o modal mostra o script nesses casos).
- Feito: pipeline de equipamentos (12.911 itens, 9.085 com imagem; ~2.600 sem descrição — itens
  iRO/jRO do rAthena que não existem no client kRO).
- Home (`src/App.tsx`): header + abas (`Tabs` variante `line`).
  - **Cartas** (`src/components/cards/`): busca por texto, filtros "Onde equipa" e "Dropada por".
  - **Equipamentos** (`src/components/equips/`, rótulos/jobs em `src/lib/equips.ts`): filtros
    "Tipo", "Tipo de arma" (só com Arma marcada), "Classe" (rotulada pela 4ª classe, agrupada por
    família) e "Dropado por"; modal com atributos, quem equipa e restrição de tier.
  - **Encantamentos Classe** (`src/components/class-enchants/`): filtros "Classe" (linha do job,
    rótulo da 4ª), "Geração da classe" e "Posição no costume"; grid agrupado por classe
    (`groupOf`/`renderGroup` do `BrowseLayout`); tile mostra os parceiros de combo; modal lista
    combos com script e o item da pedra.
  - **Automatic Armor** (`src/components/automatic/`): filtros "Raridade" e "Onde equipa"; grid agrupado por
    raridade; quadro explicativo (`intro` do `BrowseLayout`) com regras do NPC Lisa e tabela de
    limites calculada dos dados (`pieceLimits` em `src/lib/automatic.ts`).
  - Busca: nome, ID, aegis, nome KR, descrição (+ prefixo/tipo); sem acento/caixa; todos os termos.
- Tema escuro "lua" fixo (`class="dark"` no `index.html`, tokens em `.dark` no `src/index.css`).
- Pendente: demais tipos de item e seções (monstros, skills, classes 4ª); HashRouter quando houver
  rotas (hoje as abas não mudam a URL). Repositório: https://github.com/kenithts/MoonDB (branch `main`).

## Convenções

- Converse com o usuário em português. Textos da UI seguem o idioma dos dados (inglês do client),
  salvo pedido contrário.
- Não invente dados: tudo exibido deve vir do rAthena/client via pipeline.
