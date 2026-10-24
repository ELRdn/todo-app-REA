# 調査方法（再現可能な手順）

REA（Reverse Engineer Anything）6.4.0 の考え方に従い、
**観察（observed） / 公式画像からの復元（product imagery） / 推論（inferred）** を分離して記録した。

---

## 1. 対象の同定

| 指定 | 同定した対象 | 根拠 |
|---|---|---|
| Asana | `asana.com` / `app.asana.com` | マーケティングサイトとログイン画面のタイトル・ロゴ |
| Toggl | `toggl.com` / `accounts.toggl.com/track/login` | 同上 |
| Habitica | `habitica.com` | 同上 |
| Timo | **Tiimo** `tiimoapp.com` / `webapp.tiimoapp.com` | 「Timo」の該当プロダクトはTiimoのみ。公式サイトの表記は `tiimo` |
| Structured | `structured.app` / `web.structured.app` | 同上 |

> 「Timo」は検索APIが利用不可だったため、名称・カテゴリ（Todo/プランナー）・公式表記から同定した。
> 異なるプロダクトを指している場合は `docs/04-tiimo.md` を差し替える必要がある。

---

## 2. 環境

| 項目 | 値 |
|---|---|
| Browser | Google Chrome 156.0.8078.47（`--headless=new`） |
| Viewport | 1440 × 960（実効 1424 × 865、スクロールバー 16px） |
| DPR | 1 |
| Locale | en-US |
| UA | 通常の Chrome UA に `Emulation.setUserAgentOverride` で上書き |
| CDP | `http://127.0.0.1:9223` |
| REA | 6.4.0（`npx -y rea-agents@6.4.0`） |

ヘッドレス起動:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless=new --remote-debugging-port=9223 --remote-allow-origins=* `
  --user-data-dir="$env:TEMP\rea-chrome" --window-size=1440,960 `
  --force-device-scale-factor=1 --hide-scrollbars `
  --disable-blink-features=AutomationControlled `
  --lang=en-US --no-first-run --no-default-browser-check about:blank
```

---

## 3. キャプチャ手順

### 3.1 タブ生成とUA上書き

`tools/cdp.mjs` は `about:blank` でタブを作り、`Emulation.setUserAgentOverride` と
`Emulation.setDeviceMetricsOverride` を適用してから遷移する。
これにより `HeadlessChrome` UAによる簡易ブロックを避け、通常のChromeと同じレイアウトを得る。

```powershell
node tools/cdp.mjs new https://asana.com/ 6000
node tools/cdp.mjs list
```

### 3.2 Cookieバナー

証拠としてのUIを汚さないため、以下のボタンをページ内クリックで閉じた（DOM操作はこれのみ）。

- Toggl: `Deny`
- Habitica: `Deny Non-Essential Cookies`
- Tiimo: `Accept all`

### 3.3 セクション別スクリーンショット

`Page.bringToFront` を各操作の前に行う（ヘッドレスのバックグラウンドタブはフリーズするため）。
スクロールは 850px 刻み。ビューポート 865px に対して 15px オーバーラップさせ、取りこぼしを防ぐ。

```powershell
node tools/cdp.mjs scroll <targetId> 1700
node tools/cdp.mjs shot   <targetId> evidence/tiimo/screenshots/02.png
```

### 3.4 全ページ画像

`Page.captureScreenshot` の `captureBeyondViewport: true` + `clip` で1枚に合成。
Chromeのテクスチャ上限（16,384px）を超える Structured（18,168px）のみ2分割。

```powershell
node tools/cdp.mjs clipshot <targetId> evidence/asana/screenshots/full-page.png 0 8253
```

### 3.5 computed style の抽出

`tools/page-audit.js` を `Runtime.evaluate` で実行し、以下をJSON化する。

- 色 / 背景色 / ボーダー / 角丸 / 影 / gap / font-size / weight / line-height / letter-spacing の**出現頻度**
- `:root` の CSSカスタムプロパティ（同一オリジンのスタイルシートのみ）
- 見出し・ボタン・ランドマークの実測値
- 読み込まれているフォントフェイスと `@font-face` の実体
- 画像・CSS・JSのURL一覧

```powershell
node tools/extract.mjs <targetId> evidence/asana/audit-home.json
node tools/summarize.mjs evidence/asana/audit-home.json
```

> `getComputedStyle` は読み取りのみ。ページの状態は変更しない。

### 3.6 REAによるパッシブ検査

```powershell
npx -y rea-agents@6.4.0 inspect-web-page http://127.0.0.1:9223 <targetId> `
  --observation-ms 1500 --include-storage-keys --format json `
  > evidence/asana/rea-inspect-home.json
```

取得されるもの:

- DOMツリー（node type / tag / 属性名）
- アクセシビリティツリー（role / name / state）
- スクリプト・リソース・CSP・storage key（値は取得しない）
- attach以降のネットワーク/コンソールメタデータ

**制約**: 観察はアタッチ後に開始されるため、初回ロードのネットワークは含まれない（`prior_activity_available: false`）。
このため通信内容は「UIの証拠」としては使っていない。

### 3.7 JSバンドルの静的解析

```powershell
npx -y rea-agents@6.4.0 analyze-web-bundle http://127.0.0.1:9223 <targetId> `
  --format json > evidence/asana/rea-bundle.json
```

フレームワーク指紋（Next.js / React / Vite）、ルート候補、エンドポイント候補、
スクリプト間の import グラフを取得。**スクリプトは実行しない**。

結果:

| アプリ | scripts | 指紋 |
|---|---|---|
| Asana | 79 | Next.js (high) + React (medium) |
| Toggl | 9 | なし（Webflow製マーケティングサイト） |
| Habitica | 13 | Vite (medium)、96 routes / 50 endpoints |
| Tiimo | 8 | なし（Webflow製） |
| Structured | 15 | Next.js (high) + React (medium) |

---

## 4. 証拠の構造

```
evidence/
  <app>/
    screenshots/             ← トップページのセクション別 + full-page
    screenshots-login/       ← ログイン画面
    screenshots-product/     ← プロダクトページ（Asana）
    screenshots-features/    ← 機能ページ（Habitica）
    screenshots-todo-list/   ← ToDo特集ページ（Tiimo）
    product/                 ← 公式サイトに埋め込まれたプロダクト画像
    audit-home.json          ← computed style 実測
    audit-login.json
    rea-inspect-home.json    ← REA Evidence（DOM/a11y/resources）
    rea-bundle.json          ← REA Evidence（静的バンドル解析）
    images.json              ← ページ内画像のinventory
```

`evidence/manifest.json` に全ファイルの SHA-256・サイズ・撮影時刻・URLを記録。
`evidence/MANIFEST.md` は人間向けの一覧。

---

## 5. 検証

```powershell
# マニフェスト再生成（ハッシュ更新）
node tools/manifest.mjs

# JSONの妥当性
Get-ChildItem evidence -Recurse -Filter *.json | ForEach-Object {
  Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null
}

# 画像の寸法
Add-Type -AssemblyName System.Drawing
Get-ChildItem evidence -Recurse -Filter *.png | ForEach-Object {
  $i=[System.Drawing.Image]::FromFile($_.FullName); "$($_.Name) $($i.Width)x$($i.Height)"; $i.Dispose()
}
```

---

## 6. 限界（明示）

1. **認証後UIは未観察**。アカウントを作成していないため、Asanaの実際のタスク詳細、Togglのタイマー操作、
   Habiticaのパーティ機能、Tiimoの設定画面、Structuredの同期設定は確認していない。
2. **公式プロダクト画像はベンダーが演出したもの**。実際のデータ密度・空状態・エラー状態とは異なる可能性がある。
3. **マーケティングサイトのCSSはアプリ本体のCSSではない**。AsanaのマーケティングはNext.js、アプリは別系統。
   トークンの一致は保証されない（ただしAsanaのCSS変数はプロダクトのデザインシステムと強く一致する）。
4. **スクロール位置は 850px 固定**。sticky要素が各ショットに重複して写る。
5. **動的コンテンツ**（A/Bテスト、パーソナライズ、AIチャットウィジェット）は撮影時点の状態。
   Asanaの「Leslie AI」ウィジェットはページに常駐し、一部ショットを覆っている。
6. **色の名称は近似**。CSS変数があるものは正確、スクリーンショットから読んだものは近似値。
