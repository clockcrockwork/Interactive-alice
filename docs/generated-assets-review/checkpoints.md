# アリス画像追加：一括確認入口（PR #29）

更新：2026-10-23。画像制作・統合は進行中です。**生成済み、コード統合済み、静的合成確認済み、ブラウザ確認済みは別の段階**です。旧原画を残す箇所があるため「全画像完了」ではありません。確認のためのPRはこの1本に集約しています。

## 2026-10-30 Caterpillar canopy 追加

- [上から見た樹冠の限定置換](scenery-canopy-20261030.md)。既存の葉だけをdecode成功後に差替え、巣・肩・首・空・動きを維持。静的確認のみで実ブラウザ未確認です。

## 2026-10-30 Court wall 追加

- [Court wall の限定追加と静的検証](scenery-court-wall-20261030.md)。1枚の透過版画を既存の赤い後壁へ低濃度で重ね、床・人物・カメラ・fallback を維持。実ブラウザ未確認。Caterpillar の canopy は上記の別追加です。

## 現状と確認する順番

1. **人物と持ち物の接点**：座るアリスの花、黄色runnerの指ぬき、Duchessの赤ちゃん、両手のキノコ片、Knaveの冠クッション。
2. **可動部品と場面のつながり**：Gryphonの前脚と共有opening、Catの目/消失、Billの頭、Flamingo、動物の翼/脚。元の操作・動きを残した別部品構成です。
3. **全体の画風と色**：顔・髪・衣装の一貫性、小さい表示での読みやすさ。黄青は別生成編集なので厳密な線画一致を保証しません。
4. **実ブラウザの動作**：ロード失敗時の元描画、停止中の読込、reverse/reduced motion、電話幅、接触/はみ出し。現在の証拠は静的確認とローカル検証で、ブラウザ再生合格ではありません。

## 2026-10-23 の継続作業

- PR #29 は引き続き単一の Draft PR。依存する PR #12 のブランチを base に保ち、画像の main マージや本番反映は行いません。
- 既に main に入った Node 22.23.4、Python 集計の回帰テスト、明示的な exact-head browser 検証方針をこの作業ブランチへ取り込みました。Python の競合は同じ左から順の集計を説明するコメントだけで、既存画像やアニメーションの変更はありません。
- 棚卸しを再照合し、既に実装済みの runner 接点補正・歩きの Duchess・小物を未制作キューから区別しました。拒否済みの部品は再生成せず元描画を保ちます。
- 座る Alice、座る/歩く Duchess、飛ぶ piglet、限定 falling-card の読み込み待ち・失敗 fallback と適用範囲を56件のブラウザ契約へ追加しました。2件は390×844の電話幅で、実機mobileの証明ではありません。実行結果と正本 SHA は PR 本文で照合してください。Node22.23.4で660 unit / 69 files、lint/typecheck/data/buildとfixture一致を確認しました。desktop計999件のテスト登録は再生合格ではありません。

## 最新の保存と検証

- 直前の保存：`53bf33641ff2df4088ba61b894abdd91377dc35c`。545 unit tests / 55 files等が通過した過去の基準です。今回の正本headとexact-tree結果はPR #29本文の最上段で照合してください。
- 2026-10-21 の固定snapshot検証：659 unit tests / 69 files、typecheck、lint、data、build。これは `db85a47d` の証拠であり、継続作業後のheadの証拠ではありません。
- Previewは[PR #29](https://github.com/clockcrockwork/Interactive-alice/pull/29)に記載した**同じhead**のURLを使用してください。deployment READYだけでは閲覧可能/視認済みとは言いません。
- 現時点の75 registry IDs中69 IDsには何らかの生成runtimeがあります。全色・全consumer対応数ではなく、部分対応も含む棚卸しです。

## 場面別の確認資料

| 確認対象 | 最新資料 | 実際の範囲 |
| --- | --- | --- |
| 座るアリス | [4層と花の接点](alice-sitting-20261021.md) | Riverbank、黄青 |
| 黄色runner | [受取/お辞儀/指ぬき](alice-runner-20261021.md) | Caucus Race / Pool / Mouse Tale。青は元描画 |
| 静止falling / 飛ぶpiglet | [限定consumerと残件](static-pose-consumers-20261021.md) | fallingはDrink Me/Trial、pigletはDuchessのみ |
| Gryphon | [色と前脚](gryphon-20261021.md) | 章の3層、Duchess共有opening、Trial全身 |
| 座るDuchess | [赤ちゃん支持](duchess-seated-contact-20261021.md)、[Croquet登場](duchess-croquet-arrival-20261021.md)、[歩き姿と肩接触](duchess-standing-composition-20261021.md) | Kitchenと到着場面。歩きは立ち姿専用map |
| Mushroom | [支持/操作](mushroom-support-20261021.md) | 通常engravedへ導入。比較入口も維持 |
| 既存画像の追加利用 | [5consumerの差分](actor-consumers-20261021.md) | Bill / Gryphon / Mock Turtle / Rabbit |
| Trial Mouse | [夢のMouse](trial-mouse-dream-20261021.md) | 空だった120×60描画枠への限定reuse |
| 新しい小物 | [持ち物/前景の合成](final-scene-props-20261021.md) | Hedge、左右キノコ片、冠クッション、Pool table |
| 不成立候補 | [tucked Flamingo](tucked-flamingo-20261021.md) | neck拒否後のhybrid不成立、元描画維持 |
| 全体棚卸し | [残作業と範囲](remaining-inventory.md) | source/部品/統合/検証を分離 |

## 元描画を残している主な箇所

- 青い後ろ姿・立ち姿・runner。生成結果が無いものを青新画像として扱いません。
- Mock Turtle章のflapper、Kitchenの段階的pig morph、Rabbit Holeの関節付きfalling、running-away、tucked Flamingo。拒否された部品の別手段生成や、不自然なhybridの採用は行っていません。
- 意図的なシルエット、Dinah ghosts、カード記号/数字、slates、key等の機能するSVG/Canvasは維持します。
- Duchess歩きは元のアリス/鳥を保って立ち姿のみ導入。生成fallingをこの場面に使うと鳥のbiteが胸/首へ寄るため、このconsumerでは元描画を残しています。確認待ちは他の独立制作を止める条件ではありません。

## 過去の記録（最新の合格証拠ではありません）

<details>
<summary>旧チェックポイント、旧テスト数、旧contact sheetを開く</summary>

# Consolidated generated-art review checkpoints

This is the single review checklist for Draft PR #29. It supersedes the split
review entry points in PRs #17–23, #26 and #27; it does not approve the art or
merge the branch. The owner requested on 2026-10-21 that reversible candidate
work continue and that visual decisions be collected for later review.

## Start here

Use the deployment linked from PR #29, not an older split-PR preview. The
[18-screen contact sheet](contact-sheet.png) records the earlier `58b0774d`
state; it is not evidence for later assets. Open the demo index to choose the
language, colour and art treatment, then use the routes below. Changes to the
colour choice should be made from the existing index control before opening the
scene; a coloured PNG/WebP cannot be recoloured by the page's CSS tokens.

| Checkpoint | Routes on the current preview | What to decide |
| --- | --- | --- |
| Court protagonist | `demos/witnesses/`, `demos/trial/` | Does the yellow rear view preserve the protagonist's hair, costume and proportions? Check both feet at the floor, growth and the join between scenes. The blue look is still the original drawing, not a generated blue derivative. |
| Falling protagonist | `demos/rabbit-hole/?artPreview=overhead` | Open **Compare artwork** and switch repeatedly at the same scroll position. Choose yellow and blue from the index in turn. Judge face, hair, overhead angle, fingertip framing and silhouette. The original animated figure remains available. |
| Held object | The same Rabbit Hole comparison, at the jar beat | Does the existing jar meet the candidate hand? The anchor has not been moved to pretend that the static candidate is a rig. |
| Herald identity | `demos/croquet/`, `demos/witnesses/`, `demos/trial/` | Check the narrow rabbit face, small eye, ear proportions and legibility beside the protagonist. |
| Kitchen objects | `demos/pig-and-pepper/` | Check throwing/returning objects, thin utensils, and layering against characters and captions. |
| Tea-table layers | `demos/tea-party/` | Check the teapot lid hinge, cup front/back occlusion, watch and food placement, and reverse scrolling. |
| Shore objects | `demos/lobster-quadrille/` | Check readable lobster/crab silhouettes at phone size, not only on the contact sheet. |

Every route also has a `demos/ja/…` equivalent. Review at desktop and phone width,
with ordinary motion and reduced motion. Ordinary flat/paper pages must keep their original vector paths. The explicit
`artPreview=overhead` and `artPreview=mushroom` URLs is a deliberate comparison exception, regardless of
selected treatment; it must not change ordinary pages.

## Deferred art decisions, not technical passes

- Yellow rear-view hair appears lighter than the canonical chestnut palette.
  Review this together with the overhead candidate, not as independent identities.
- Blue overhead is now a separate reference-edit candidate, not a pixel-identical
  recolour. Its 1206×1305 canvas is one pixel taller than yellow; right fingertips
  approach the image edge. Check both looks in English and Japanese.
- The overhead master is one static image. Its base and moving arms have not yet
  been delivered as a consistent same-canvas rig. No independent body-part
  generation should be assembled into an apparently finished character.
  [The local-only static rig-separation study source](rig-candidates/comparison.html) records three
  same-reference edits, raw placement and a CSS-only trial. All are 1206×1305, but
  their shoulder coordinates and arm scales differ. They remain outside runtime;
  pivots, seams, natural rotation and held-object attachment are unverified.
- A blue rear-view derivative has not been delivered. Preserve the original blue
  drawing until a valid reference-edit candidate exists.
- High-resolution illustration files are review deliveries, not a claim that
  production payload budgets or image acceptance have passed.

## Evidence and limits

The existing [CI run 39402745878](https://github.com/clockcrockwork/Interactive-alice/actions/runs/39402745878)
was inspected on 2026-10-21. It checked out merge commit `1c4a3467`, whose tree
`d6717514` matches PR head `58b0774d`. It passed 299 unit tests and 789 Desktop
Chromium E2E tests; two tilt-input cases were skipped. Both previously timed-out
Herald colour cases passed there. This is evidence for that tree, not later edits,
Phone, Firefox, WebKit, real devices or visual acceptance. The earlier local
Herald timeouts still have no established cause.

A fresh cloud baseline on 2026-10-21 passed data checks, type checks, all 299 unit
tests and build on Node 24.19.0 (outside the pinned Node 22 range). A bounded
three-case Phone Chromium preview run could not launch the installed browser:
`socket() EPERM` occurred before page assertions. The trace files were retained;
no browser security settings were changed to bypass the restriction.

The `58b0774d` branch's `checks.yml` still includes PR-triggered frontend E2E.
The older prose claiming that this branch preserves manual-only browser CI was
incorrect. This image work does not change runner policy or dispatch a workflow.

## This update's verification (2026-10-21)

Data checks, typecheck, lint, build and all 301 unit tests passed locally on
Node 24.19.0 (not the pinned Node 22). Six focused Playwright cases are registered:
four language/colour combinations, ordinary/shared-scene isolation, and failed
image fallback. They have not passed a browser run on this edited tree; the local
browser launch restriction above remains. No new CI run was dispatched.

The blue source-to-delivery check confirms identical alpha and every nontransparent
RGBA pixel after lossless encoding. The same encoding checks passed for all three
rig-study files. Their same-size canvases do not establish anatomical alignment.
The study HTML's CSS placements are unverified trial values, not accepted anchors.
The existing build chunk-size warning remains; no production size-budget pass is claimed.

The rig study is documentation, not a Vite build entry: GitHub displays its HTML
source, and it is not a deployed preview route. View its individual image files
in `rig-candidates/`, or serve the repository root locally to inspect composition.
Cloud UI could not reach the local development server, so no new runtime visual
acceptance was recorded. Previous preview URLs and the contact sheet remain
historical until an exact-new-head deployment is independently verified.

## Continuing production beyond the first checkpoint

The [complete production inventory](remaining-inventory.md) separates independent
whole drawings from coherent-layer and renderer-adapter work. The
[2026-10-21 whole-cutout batch](whole-cutout-batch-20261021.md) adds fifteen
non-protagonist illustrations (fourteen runtime sources plus one Duchess candidate) and records measured delivery sizes and source
geometry. This does not complete the image-addition task. Mushroom is an opt-in
comparison, not a default replacement; the Pig rig has a first coherent three-layer review checkpoint, while the
overhead rig still needs coherent anatomy/layers. Continue independent production rather than treating
later art review as a global stop.

Mushroom comparison: `demos/caterpillar/?artPreview=mushroom` and its Japanese
equivalent. See [measured support geometry and fallback](../generated-mushroom-preview.md).

## Expanded production checkpoint (2026-10-21 04:39 UTC)

This intermediate save has 25 registry IDs with generated whole-image sources,
including the reused runner Crab, plus a separate three-layer pig rig in its two
animated scenes. It is not 25 new illustrations and not completion of all 75 IDs.
Six additional scene props and the opt-in Mushroom comparison are included.
Duchess remains original at runtime because of measured contact mismatch.

All 391 unit tests across 36 files, typecheck, lint, data checks and production
build passed locally on Node 24.19.0 (not the pinned Node 22). Independent static
review found no high-confidence blocker in the retained runtime changes. Existing
story-staging TODO notices and the build's >500 kB chunk warning remain.

The two focused Playwright files register 196 cases across configured projects;
registration is not execution. No new-head browser/E2E, phone, Firefox or WebKit
pass is claimed. Local browser execution remains restricted. Exact preview source
SHA must be checked after publication before treating that deployment as current.
The commit uses `[skip ci]` to avoid retriggering the costly branch workflow; this
means required checks on the new head may remain pending, not satisfied.

Next independent work continues with first-person protagonist views, the standing
SVG adapter, and small-part character rigs. No final art approval is inferred.

## Static protagonist and articulated-character checkpoint (2026-10-21 05:10 UTC)

The next checkpoint adds five protagonist files: yellow/blue first-person skirt
and foot views, plus yellow standing. Standing blue retains its existing original;
there is no generated result for that attempted edit. The standing SVG adapter
keeps a fixed logical paint box for growth. Hair colour and the shifted foot
silhouette remain later visual checks, not accepted identity art.

Three animals (Tortoise master, Guinea-pig, Pigeon) and four expressive characters
(Hatter, Dormouse, Queen, Cook) now use coherent images with their existing motion
hooks, SVG facial states and scene-specific placement. All layers must decode
before generated artwork appears; an error keeps the complete original. Hidden
raster canvases do not alter the fallback's fill-box. Pig now shares that atomic
fallback. Actual scene consumers are gated; no-demo previews keep originals.

- [Protagonist crop/standing checks](alice-static-views-20261021.md)
- [Animal joints and movement limits](animal-motion-20261021.md)
- [Live expression and loading checks](live-expressions-20261021.md)
- [Production matrix with separate stages](remaining-inventory.md)

All 436 unit tests across 40 files, typecheck, lint, data checks and build passed.
The same Node24 versus pinned Node22 caveat and chunk-size advisory remain.
Independent review inspected geometry, preserved selectors, error fallback and
static SVG compositions. These compositions used source PNGs because the offline
renderer does not render WebP; they are not browser screenshots or proof of CSS
motion. Browser tests are definitions only. No new E2E/phone/Firefox/WebKit pass,
public-access guarantee, production approval or final art acceptance is claimed.

Caterpillar/Bill and the two footmen have generated layers awaiting safe composition;
image outputs alone do not complete their integration. Work continues independently.

## Continued articulation checkpoint (2026-10-21 05:38 UTC)

Fifteen further scoped actor IDs now have provisional generated rendering: the
Caterpillar, Bill, both footmen, three Cheshire Cat poses, Hedgehog, the quadrille
Mock Turtle, three gardeners, garden Rabbit/Pat and Croquet Flamingo. Registry
whole-source counts remain 28 IDs / 30 variant bindings / 29 files; scoped adapters
are separate, not a percentage-complete claim. The prior eight layered actors
bring the current scoped-adapter count to 23.

Specific source defects were repaired rather than deferred as owner decisions:
Bill's shoulder fragment and pointed neck, Caterpillar's rigid hose, footmen's
double knees and waist gaps, Cat tail spur and eye fur, gardener's second arm,
and Flamingo's dangling neck stump. All preserve complete original fallbacks
until required images decode. Original SVG pips, live pupils/tears, garments,
scene motion and interaction targets remain where applicable.

- [Caterpillar hose, Bill neck and prop contacts](caterpillar-bill-20261021.md)
- [Footmen bow, wigs and corrected trouser joins](../footmen-motion-checkpoint-2026-10-21.md)
- [Cat reveal, disappearing mask, pupils and wink](cheshire-cat-layers-20261021.md)
- [Hedgehog state switch and quadrille tears](hedgehog-and-turtle-20261021.md)
- [Gardeners' three pip counts and moving brushes](gardeners-20261021.md)
- [Garden Rabbit and Pat SVG placement](garden-figures-20261021.md)
- [Flamingo joint and protagonist garment preservation](flamingo-20261021.md)

The current local unit gate passes 502 tests across 49 files; typecheck and full
lint pass. Independent static review covered source geometry and offline
compositions. CSS imports were moved to the runtime loader rather than the
build-time art module to preserve the Vite configuration build. Full data checks and the production build also pass for this checkpoint. The
existing story TODO notices and >500 kB bundle warning remain.

The two new Cat/Flamingo browser files register 60 cases across configured
projects; registration is not execution. In particular, SVG pattern/use CSS
inheritance, late image decode during paused interaction, real scene contacts,
phone framing, Firefox and WebKit remain unverified. The new illustration bytes
increase demo payload; no performance-budget pass or art approval is claimed.

The Mock Turtle chapter remains original: its right-flapper edit returned no
image after refusal. Available base/left candidates are not assembled into an
incomplete rig and the refused operation is not repeated via another tool.
Tucked Flamingo, new protagonist poses, swimming and remaining actors continue
as separate production work. This checkpoint is not the end of image addition.

## House, hands, swimming and small actors (2026-10-21 05:56 UTC)

Five further protagonist pose IDs now have both-colour scoped rendering: House
kneeling/filling, left/right hands and Caterpillar's headless top-down shoulders.
The two hand-contact adaptations only activate after successful image decode;
original placement is retained on load/error. House growth keeps its fixed paint
box and room crop; the overhead body maps to the existing live-neck junction.

- [House, paired hands and shoulders](alice-house-hands-shoulders.md)
- [All eight swimmers through the actual Canvas path](swimming-canvas-20261021.md)
- [Bat wing designs and diving Rabbit feet](bat-diving-20261021.md)
- [Twelve live jury slates and running Rabbit](jury-running-rabbit-20261021.md)

Swimming reuses seven existing animal images and adds only Alice's two dedicated
upper-body sources. The nine assets serve eight character kinds, not nine new
characters. Direction, slope, jump, transparency, zoom, Mouse's nine bristles and
front water remain procedural; decode failure retains the original drawing.
Bat and diving Rabbit keep their distinct moving parts and original scene
contracts. Jury keeps twelve original slates/marks/pennies and unchanged buttons.
Running Rabbit retains the outer SVG used by its existing run/bounce/mirror.

The combined local gate passes 545 unit tests across 55 files, typecheck, full
lint, data checks and production build. Independent static review covered the
new geometry and fallback logic. Browser contract preparation/listing and
untouched-source offline composition are not browser execution. All real scene
playback, phone/desktop contact, browser-specific pattern/use/Canvas behavior,
reduced motion and performance remain unverified. The twenty new runtime images total 7,734,364 bytes, before reuse and review
illustrations. No performance-budget pass is claimed.

This is another intermediate save, not image-task completion. Duchess hand/chin
contacts, Mushroom cap support, Gryphon palette/paws, tucked Flamingo and remaining
protagonist motion continue. Refused standing/rear blue, Mock Turtle right flapper,
baby-pig limb and falling-leg edits are not retried through alternate tools;
only dependent rigs remain original while independent work proceeds.

## Fifth production checkpoint, 2026-10-21 (local integration)

This is an intermediate production checkpoint, not all-image completion. New
runtime deliveries currently comprise 21 unchanged-canvas WebP files (7,262,640
bytes). Raw PNG masters remain outside Git; source reuse is not new generation.

- Riverbank sitting Alice: both colours, four layers; review eyelids, head droop,
  reaching hand and flower-chain contact.
- Yellow runner Alice: rest/carry poses and ready-only natural hand/pocket
  metadata. Check receiving, bowing, storing and paused late loads. Blue and
  failed loads retain original coordinates and artwork.
- Falling cards: Drink Me and Trial only; Rabbit Hole's articulated figure and
  Duchess shoulder contact are not replaced by this whole source.
- Gryphon: mapped chapter forelegs; Duchess reuses the exact neutral chapter
  drawing for the shared opening. Trial keeps a whole dream depiction.
- Kitchen Duchess: existing baby world box/motion unchanged; fingers support its
  sides at rest. Continuous grasp while rocking is not claimed. Other consumers
  require separate composition verification.
- Flying piglet: Duchess cutaway with original paper wings. Kitchen staged morph
  remains original; unavailable limbs were not reconstructed.
- Mushroom: ordinary engraved pages now load the new source with original
  fallback. Support is checked at neutral/breath/charge poses; old spot positions
  are not an aesthetic requirement. Optional comparison remains available.
- Other source reuse preserves Bill's Witnesses motion and Trial's Mock Turtle
  and running Rabbit wrappers. Fixed raster tint differences are documented.

Original-only dependencies include blue rear/standing/runner, chapter Mock Turtle
flapper, Kitchen pig morph, articulated falling/running-away, and tucked Flamingo.
Failed hybrids are not enabled. Functional ranks/slates/key, Dinah ghosts and
intentional silhouettes do not require new raster art.

Evidence is source inspection and offline composition, not browser playback.
Pattern/use, CSS bow projection, late decode, pause/reduced motion and phone
interaction remain real-browser checkpoints. Access restrictions were not bypassed.

</details>

## 2026-10-26 — blue runner local integration

[Blue rest/carry intake](alice-runner-blue-20261026.md) adds the two selected blue
assets to the existing runner adapter; 616,608 B added, original PNGs outside Git.
Focused 72/72 unit tests pass. Browser replay and exact-head Preview remain
unverified; prior yellow-only observations must not be credited to this pair.
