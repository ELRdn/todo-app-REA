# 07. 再構築仕様（実装可能な形）

`docs/06-synthesis.md` の設計を、そのまま実装できる粒度に落とす。
対象は **Spine v0.1**（Web、個人向け、ローカルファースト）。

---

## 1. 情報アーキテクチャ

```
/                     → Today（Day view）
/inbox                → Inbox（未分類）
/upcoming             → 7日間
/context/:id          → コンテキスト別リスト
/habits               → 習慣（繰り返し）
/review               → 週次レビュー
/settings             → 設定
```

- ルーティングは `/` を Day view に固定。Todoアプリの9割は「今日」を見に来る。
- モーダルはルートではなく `?task=:id` のクエリで開く（戻るボタンで閉じる）。
- モバイルの下部タブは `Today / Inbox / Habits / Search`。

---

## 2. データモデル

```ts
type ID = string;

interface Task {
  id: ID;
  title: string;
  notes?: string;
  status: "open" | "done" | "archived";
  createdAt: string;        // ISO
  updatedAt: string;
  completedAt?: string;

  // 時間
  date?: string;            // YYYY-MM-DD（終日タスクは null）
  start?: string;           // HH:mm
  durationMin?: number;     // 15刻みを推奨
  dueAt?: string;           // ISO（締切）

  // 文脈
  contextId?: ID;           // Area / Project
  tags: string[];
  energy?: "low" | "medium" | "high";
  priority?: 0 | 1 | 2 | 3; // 0=none
  recurrence?: RecurrenceRule;

  // 構造
  parentId?: ID;
  order: number;
}

interface Context {
  id: ID;
  name: string;
  color: "indigo" | "sage" | "clay" | "plum" | "mustard" | "slate";
  kind: "area" | "project";
}

interface Habit {
  id: ID;
  title: string;
  polarity: "positive" | "negative";
  targetPerWeek?: number;
  history: Record<string, number>; // YYYY-MM-DD → count
}

interface RecurrenceRule {
  freq: "daily" | "weekly" | "weekdays" | "monthly";
  byDay?: number[];         // 0-6
  interval?: number;
  until?: string;
}
```

**設計判断**

- `Task` は「日付 + 開始時刻 + 所要時間」を持つ。**期限（dueAt）と予定（date/start）を分離**。
  Asanaの「期限」とStructuredの「ブロック」は別物なので、同じフィールドにしない。
- `contextId` は1つだけ。Togglのようにプロジェクト色が増えすぎるのを防ぐ。
- `recurrence` はタスクに持たせ、完了時に次回を生成する（HabiticaのDailies方式）。

---

## 3. 状態モデル

```
Task.status: open ──toggle──▶ done ──undo──▶ open
                 └──archive──▶ archived
```

タイマー:

```
idle ──start──▶ running ──pause──▶ paused ──resume──▶ running
                    └──stop──▶ idle（記録を保存）
```

同期（将来）:

```
local ──push──▶ pending ──ack──▶ synced
                    └──fail──▶ conflict ──resolve──▶ synced
```

- すべての書き込みは**楽観的**。UIは即座に更新し、失敗時はロールバック + 5秒のUndo。
- `status` の変更はイベントログに残す（週次レビューで使う）。

---

## 4. 画面仕様

### 4.1 Today（Day view）

| 要素 | 仕様 |
|---|---|
| ヘッダー | 日付（`10月25日（土）`）、ビュー切替、検索、`⌘K` |
| 進捗 | `8 / 12 完了` + バー + 連続日数 |
| タイムライン | 06:00–24:00、1時間 = 72px、30分に薄い線 |
| Now line | 現在時刻に `--accent` の2px線 + 時刻ラベル |
| ブロック | 時間 × 1.2px/分、最小44px |
| 空き | 15分以上の空白に FreeSlotCard |
| 終日 | タイムライン上部に横並びチップ |
| FAB | モバイルのみ |

**空状態**: タイムラインに「今日はまだ何もありません」+ 3つの提案
（`深い作業 90m` / `散歩 30m` / `受信トレイを空にする`）。

**エラー**: 保存失敗時はブロックに赤い左ボーダー + トースト + 再試行。

### 4.2 Inbox

- 日付未定のタスク。リストのみ。
- 各行に「今日へ」「日付を選ぶ」ボタン。
- 空状態: 「Inboxは空です。新しいタスクは `N` で追加できます。」

### 4.3 Upcoming

- 7日分を横に並べた列（モバイルは縦）。
- 各日の合計時間を表示（`4h 30m`）。Togglの容量感。

### 4.4 Habits

- 週のグリッド（7列）。各習慣の行に完了ドット。
- 連続日数は数字ではなく**ドットの連なり**で表示。Habiticaのストリークを控えめに。
- 失敗を赤で塗らない。空欄のまま。

### 4.5 Review

- 今週の完了数、集中時間、延期回数、空き時間。
- 1画面に数字は3つまで。TogglのKPI乱立を避ける。

---

## 5. コンポーネント契約

```ts
// Checkbox
interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;            // aria-label
  size?: 20 | 24 | 32;
  disabled?: boolean;
}

// TaskRow
interface TaskRowProps {
  task: Task;
  context?: Context;
  onToggle: (id: ID) => void;
  onOpen: (id: ID) => void;
  onSnooze?: (id: ID) => void;
  selected?: boolean;
}

// TaskBlock
interface TaskBlockProps {
  task: Task;
  context?: Context;
  top: number;              // px
  height: number;           // px
  lane: number;             // 0..2
  lanes: number;            // 1..3
  onMove: (id: ID, start: string) => void;
  onResize: (id: ID, durationMin: number) => void;
  onToggle: (id: ID) => void;
}

// FreeSlotCard
interface FreeSlotProps {
  start: string;
  durationMin: number;
  suggestions: Array<{ label: string; durationMin: number }>;
  onPick: (suggestion: string) => void;
  onDismiss: () => void;
}
```

**不変条件**

1. ブロックの `top` は `(start - 06:00) * 1.2`。`height` は `max(44, durationMin * 1.2)`。
2. 重なりは開始時刻順にソートし、空いているレーンに割り当てる（最大3）。
3. 15分未満のタスクはブロックにせず、行内のチップにフォールバック。
4. `durationMin` は15の倍数に丸める（ドラッグ時）。
5. 完了してもブロックは消さない（`opacity .6`）。消すと「やった感」が消える。

---

## 6. クイック追加のパーサ

入力例:

```
明日 15:00 30m 歯医者 #health !high
```

| トークン | 解釈 |
|---|---|
| `明日` / `today` / `10/26` | `date` |
| `15:00` / `3pm` | `start` |
| `30m` / `1h` / `1h30` | `durationMin` |
| `#health` | `tags` / `contextId` |
| `!high` `!low` | `priority` / `energy` |
| 残り | `title` |

- パースは決定的。LLM不要。
- プレビューを入力欄の下に1行で表示（`10/26 15:00–15:30 · health · high`）。
- 失敗時は生の文字列をタイトルとして保存（入力を失わせない）。

---

## 7. レスポンシブ

| ブレークポイント | レイアウト |
|---|---|
| `≥ 1280px` | Rail + Sidebar + Main + Drawer |
| `1024–1279px` | Rail + Sidebar + Main（Drawerはオーバーレイ） |
| `768–1023px` | Rail + Main（Sidebarはドロワー） |
| `< 768px` | Main + BottomNav + FAB |

- タイムラインの時刻ガターは 64px → 52px。
- 1時間の高さは 72px → 64px（モバイル）。
- 横スクロールは週表示のみ。

---

## 8. パフォーマンス予算

| 指標 | 目標 |
|---|---|
| LCP | < 1.8s（4G） |
| INP | < 200ms |
| CLS | < 0.05 |
| 初期JS | < 120KB gzip |
| フォント | 2ファミリー、`font-display: swap` |
| 画像 | なし（アイコンはSVG） |
| アニメーション | transform / opacity のみ |

- 動画ヒーローは使わない（Structuredの反面教師）。
- タイムラインは仮想化しない（1日 < 100ブロックを想定）。週表示は仮想化。

---

## 9. アクセプタンス基準

- [ ] 起動して3秒以内に「今日」のタイムラインが見える
- [ ] `N` → 入力 → Enter で、今日の末尾にタスクが追加される
- [ ] タスクをクリックすると詳細ドロワーが開き、`Esc` で閉じる
- [ ] チェックで完了し、5秒以内なら `⌘Z` で戻せる
- [ ] 15分以上の空きにFreeSlotCardが出る
- [ ] ブロックをドラッグすると15分単位で移動する
- [ ] 週表示に切り替えても同じタスクが見える
- [ ] キーボードだけで全操作ができる
- [ ] 色覚異常シミュレーションでカテゴリが区別できる（色 + 名前）
- [ ] `prefers-reduced-motion` でアニメーションが止まる
- [ ] ライト/ダークでコントラスト比 4.5:1 以上

---

## 10. 実装フェーズ

| Phase | 内容 | 完了条件 |
|---|---|---|
| 0 | トークン + AppShell | `tokens.css` が当たり、3ペインが表示される |
| 1 | Today + QuickAdd + Checkbox | タスクを追加・完了できる |
| 2 | TaskBlock + drag/resize | 時間を変更できる |
| 3 | Inbox / Upcoming | 日付移動ができる |
| 4 | FreeSlot + FocusTimer | 空き時間の提案と集中計測 |
| 5 | Habits / Review | 週次で振り返れる |
| 6 | 永続化（IndexedDB） | リロードしても残る |
| 7 | a11y / perf 監査 | アクセプタンス基準を満たす |

---

## 11. テスト

- **Unit**: クイック追加パーサ、時間→px変換、レーン割当、繰り返し生成。
- **Integration**: 追加→完了→Undo、ドラッグ→保存、日付変更→再描画。
- **E2E**（Playwright）: 上記アクセプタンス基準を1本ずつ。
- **Visual**: ライト/ダーク × 3画面のスクリーンショット比較。
- **A11y**: axe-core で 0 violations。キーボードのみのシナリオ。

---

## 12. 計測（プロダクト）

| イベント | 目的 |
|---|---|
| `task_created` | 追加の導線が機能しているか |
| `task_completed` | 完了率 |
| `task_snoozed` | 延期の頻度（多すぎる＝設計の問題） |
| `free_slot_shown` / `free_slot_accepted` | 空き時間提案の価値 |
| `timer_started` / `timer_stopped` | 集中時間 |
| `view_switched` | リストとタイムラインの比率 |

**見ない数字**: ページビュー、滞在時間。Todoアプリの成功は「早く終わって閉じる」こと。
