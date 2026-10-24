# 03. Habitica — タスクを「RPGの進行」にするUI

> 観察対象: `habitica.com/static/home`, `habitica.com/static/features`, `habitica.com/login`
> Evidence: `ev_83ab66e2…`, `ev_606e87a7…`, `ev_e907c690…`, `ev_01c1fefa…`

---

## 1. プロダクトの位置づけ

Habiticaは「習慣トラッカー」を装った**ターン制RPG**。タスクを完了すると経験値・ゴールド・アイテムが手に入り、
失敗するとHPが減る。UIの目的は「生産性の可視化」ではなく、**毎日戻ってきたくなる感情の設計**。

`[OBS]` コピーは "Motivate yourself to achieve your goals." / "Gamify Your Life"。
`[OBS]` ナビは `Tasks / Inventory / Shops / Party / Group / Challenges / Help`。
タスク管理の用語（Inbox, Today）ではなく、**ゲームの用語**が並ぶ。

---

## 2. 画面の解剖

### 2.1 ランディング（`evidence/habitica/screenshots/00.png`）

```
┌──────────────────────────────────────────────────────────────┐
│ 🦄 habitica   Get Started  Mobile Apps  Learn More ▾  [Log In]│ #6133B4, 100px
├──────────────────────────────────────────────────────────────┤
│  [pixel art: 3 characters]        Sign Up For Free           │
│                                                              │
│  Motivate yourself               [ Email                 ]   │
│  to achieve your                 [ Password              ]   │
│  goals.                          [ Confirm Password      ]   │
│                                   [ Continue ]               │
│  It's time to have fun…           ─────── OR ───────         │
│                                   [ Continue with Google ]   │
│                                   [ Continue with Apple  ]   │
└──────────────────────────────────────────────────────────────┘
```

- **背景は濃紫 `#2E1D5D`**、ナビは明るい紫 `#6133B4`。境界は1pxの線ではなく色面で分ける。
- **左にピクセルアート**（3体のキャラクター）。アンチエイリアスなし。画像ではなくスプライト。
- **右にサインアップ**。フォームは白背景ではなく、紫の面に白い入力欄。入力欄は高さ32pxと**かなり低い**。
- **見出しはVarela Round**（丸ゴシック）。ビジネスツール感を消すための最重要要素。
- 背景には薄いピクセルの星・宝箱・ハートが散らばる。`[INF]` パララックスではなく静的な装飾。

### 2.2 タスク画面（`evidence/habitica/screenshots-features/00.png`）

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🦄  Tasks  Inventory  Shops  Party  Group  Challenges  Help   43 31 92.23  🔔│
├──────────────────────────────────────────────────────────────────────┤
│ ┌ avatar ┐  🐉 🐉 🐉 🐉 🐉 🐉 🐉  [View Party]                       │
│ │ Lv 52  │  ███████ HP   ███████ XP   ███████ MP                       │
│ └────────┘                                                             │
│ [Search…] [Tags ▾]                                         [+ Add Task]│
│ ┌─ Habits ─────┐ ┌─ Dailies ────┐ ┌─ To Dos ─────┐ ┌─ Rewards ─────┐  │
│ │ Add a Habit  │ │ Add a daily  │ │ Add a To Do  │ │ Add a Reward  │  │
│ │▌15min clean +│ │▌Go to gym  + │ │▌Think about… │ │▌Watch episode │  │
│ │▌1h Product - │ │▌Eat healthy +│ │ │ ✓ Breakfast │ │  20 🪙       │  │
│ │▌Eat junk  + -│ │▌1h personal +│ │ │ ✓ Meditate  │ │▌Treat 10 🪙  │  │
│ └──────────────┘ └──────────────┘ └───────────────┘ └───────────────┘  │
│                    [ Begin Skills ]                                    │
└──────────────────────────────────────────────────────────────────────┘
```

- **4列ボード**。`Habits`（習慣・善悪両方）/ `Dailies`（毎日リセット）/ `To Dos`（一度きり）/ `Rewards`（報酬）。
  **タスクを1種類にしない**ことが最大の設計判断。行動の性質ごとにUIが違う。
- **HUD**: アバター、レベル、HP（赤）/ XP（橙）/ MP（青）の3本バー、ゴールド・ジェム・通知。
- **パーティストリップ**: メンバーのアバターが横に並び、クエストのモンスターが見える。社会的圧力のUI化。
- **タスク行**:
  - 左端に**難易度色の帯**（緑・青・赤・黄）。帯の幅は約8px。
  - タイトル14px、メタ情報11px（`make it easier to keep on top of`）。
  - 右端に **`+` / `-` ステッパー**（習慣は加点・減点の両方）。
  - デイリーは `+1` の連続記録、ToDoはチェックボックス + サブタスク。
  - 報酬は価格（🪙20）と購入ボタン。
- **下部バー**: `Begin Skills`。ゲームのスキル発動。タスク画面から直接戦闘に入れる。

### 2.3 機能ページ（`evidence/habitica/screenshots-features/01.png` 〜）

- `Gear up in style` / `Get rewarded for your effort` / `Battle monsters on Quests` / `Challenge each other`。
- すべて**「行動 → 報酬」の因果**を1行で説明する。
- モバイルアプリのスクリーンショット（Android/iOS）をそのまま掲載。UIの一貫性が証拠になっている。

### 2.4 ログイン（`evidence/habitica/screenshots-login/login.png`）

- ランディングと同じ構図。左にピクセルアート、右にフォーム。
- 見出しは `Log In`。入力欄は白、ボタンは `#925CF3`。
- 背景の紫は `#2E1D5D`、カードはなし。**面そのものがフォーム**。

---

## 3. デザイントークン（実測）

### 3.1 タイポグラフィ

| 役割 | 値 | 備考 |
|---|---|---|
| H1 | **56px / 400 / 63.84px** | Varela Round |
| H2 | 48px / 400 / 63.84px | |
| H3 | 32px / 400 / 54.72px | |
| Body | **14px / 400 / 20.02px** | 266要素が14px |
| Label | 12–14px / 700 | フッター見出し |
| Font | `Varela Round`（見出し）/ `Roboto`（本文） | |

**特徴**: 見出しの行間が **1.14倍**（63.84 / 56）と非常に詰まっている。本文は1.43倍。
`[INF]` ゲームのUIらしく、見出しを「ロゴ的な塊」として扱う。

### 3.2 カラー

| トークン | 値 | 用途 |
|---|---|---|
| nav | `#6133B4` | ナビ |
| bg deep | `#2E1D5D` | ページ背景 |
| bg mid | `#432874` | セクション |
| bg darkest | `#271B3D` | フッター |
| accent | `#BDA8FF` | 本文リンク・枠線 |
| primary | `#925CF3` | CTA |
| primary light | `#9A62FF` | Log In |
| text on light | `#4E4A57` | 白背景の本文 |
| white | `#FFFFFF` | フォーム・カード |

**特徴**: 紫の**明度差だけで階層**を作る（#271B3D → #2E1D5D → #432874 → #6133B4 → #925CF3 → #BDA8FF）。
色相はほぼ1つ。**モノクロームの紫**だから、ピクセルアートの多色が映える。

### 3.3 角丸・影

- radius: **4px**（ボタン・入力）、3px、2px。**ほぼ角丸を使わない**。
- shadow: `0 1px 3px rgba(26,24,29,.12), 0 1px 2px rgba(26,24,29,.24)`（カード）
- ピクセルアートは角丸ゼロ。**UIの角丸を抑えることで、ドット絵の輪郭と喧嘩しない**。

---

## 4. コンポーネント目録

| コンポーネント | 解剖 |
|---|---|
| **HUD** | アバター64px + Lv + HP/XP/MPバー + 通貨 + 通知 |
| **Stat bar** | 高さ8px、角丸4px、色は赤/橙/青、背景は暗い紫 |
| **Party strip** | モンスター + メンバーアバター + `View Party` |
| **Column** | 幅約250px、見出し + `Add a …` + タスクカード群 |
| **Task card** | 左色帯8px + タイトル + メタ + ステッパー |
| **Difficulty bar** | 緑（easy）/ 青（medium）/ 赤（hard）/ 黄（trivial） |
| **Stepper** | 24px円、`+` / `-`、ホバーで明るく |
| **Reward card** | アイコン + 名前 + 価格 + 購入 |
| **Pixel sprite** | 32–64px、`image-rendering: pixelated` |
| **Primary CTA** | `#925CF3`、白文字、高さ48px、角丸4px |
| **Ghost CTA** | 透明、2px `#BDA8FF` ボーダー、角丸2px |

---

## 5. インタラクション

| 操作 | 挙動 | 根拠 |
|---|---|---|
| 良い習慣を `+` | XP/ゴールド獲得、バーが伸びる | `[INF]` ゲーム仕様 + UI |
| 悪い習慣を `-` | HP減少 | `[INF]` |
| デイリー完了 | チェック + ストリーク増加、翌日リセット | `[INF]` |
| ToDo完了 | チェック、リストから消える（アーカイブ） | `[INF]` |
| 報酬購入 | ゴールド消費、アイテム獲得 | `[INF]` |
| レベルアップ | モーダル + 新スキル | `[INF]` |
| クエスト | パーティでモンスターにダメージ | `[PROD]` |

`[INF]` モーションは「ポンッ」と跳ねるイージング、数字のポップ、パーティクル。静的なB2Bツールとは正反対。

---

## 6. このUIの強み

1. **行動の種類をUIで分けている**。Habits / Dailies / To Dos / Rewards。1つのチェックボックスで全部を扱わない。
2. **進捗が常に見える**。HP/XP/MPバーが画面上部に固定。数字を隠さない。
3. **失敗のコストが可視化される**。悪い習慣でHPが減る。`[INF]` これは「罰」ではなく「ゲームのルール」。
4. **世界観が一貫している**。言葉・色・フォント・スプライト・効果音（推論）がすべてRPG。
5. **ソーシャル圧力**。パーティのメンバーとクエストを共有。`[PROD]` モンスターが画面に出る。

## 7. 弱点・真似しない方がいい点

- **学習コストが高い**。HP/XP/MP/ゴールド/ジェム/ストリーク/クエスト/スキル。用語が多い。
- **入力欄が32pxと低い**。モバイルのタップターゲットとして小さい（WCAG 2.5.8の24pxは満たすが余裕がない）。
- **ゲーミフィケーションは万人向けではない**。業務ツールに入れると幼稚に見えるリスク。
- **紫のコントラスト**。`#BDA8FF` on `#2E1D5D` はコントラスト比が低め。本文には不向き（推論）。

## 8. 盗むべきもの

| 原則 | 移植方法 |
|---|---|
| 行動を4種類に分ける | 「習慣（繰り返し）」「今日（デイリー）」「ToDo（単発）」「ご褒美」を分ける |
| 進捗を常時表示 | 今日の完了数 / 連続日数 / 集中時間をヘッダーに固定 |
| 失敗をルール化 | 未完了を赤で責めず「ストリークが切れる」などゲームの規則として表現 |
| 色帯で難易度 | タスク行の左端に優先度・エネルギーの色帯 |
| 報酬を先に見せる | 「これを終えたら何が得られるか」をタスクに紐づける |
| 丸ゴシックの見出し | 業務ツールでもVarela Round級の丸みで緊張を下げる |

---

## 9. 証拠へのリンク

- トップ全体: `evidence/habitica/screenshots/full-page.png`（1440×4545）
- 機能ページ: `evidence/habitica/screenshots-features/`
- ログイン: `evidence/habitica/screenshots-login/login.png`
- 公式画像: `evidence/habitica/product/`（7点）
- computed style: `evidence/habitica/audit-home.json`, `audit-features.json`
- REA: `rea-inspect-home.json`, `rea-bundle.json`（Vite / 96 routes）
