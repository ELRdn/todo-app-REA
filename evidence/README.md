# Evidence

5アプリのUI調査で取得した一次資料。すべて公開ページから取得し、認証後の画面は含まない。

## フォルダ

```
<app>/
  screenshots/            トップページ（850px刻み + full-page）
  screenshots-login/      ログイン画面
  screenshots-product/    プロダクトページ（Asana）
  screenshots-features/   機能ページ（Habitica）
  screenshots-todo-list/  ToDo特集ページ（Tiimo）
  product/                公式サイト埋め込みのプロダクト画像
  audit-*.json            computed style の実測（色・書体・余白・角丸・影）
  rea-inspect-*.json      REA Evidence（DOM / a11y / resources / storage keys）
  rea-bundle.json         REA Evidence（静的JS解析・フレームワーク指紋）
  images.json             ページ内画像のinventory
```

## 読み方

- `manifest.json` — 全ファイルの SHA-256、サイズ、撮影時刻、URL、REA Evidence ID
- `MANIFEST.md` — 人間向けの一覧
- `audit-*.json` の `palette` — 出現頻度順の色・サイズ・角丸・影
- `audit-*.json` の `cssVariables` — サイトが実際に使っているデザイントークン
- `rea-inspect-*.json` の `normalized_result.dom` — ノードツリー
- `rea-bundle.json` の `normalized_result.inferences` — フレームワークの指紋

## 注意

- `screenshots/*.png` は **850px スクロール + 865px ビューポート**のため、15px 重複する。
- sticky ヘッダーは各ショットに写り込む。
- Asana の Leslie AI ウィジェットはページ常駐のため、一部ショットを覆っている。
- Cookieバナーは証拠撮影前に「拒否 / 同意」で閉じている（DOM操作はこの操作のみ）。
- 画像の著作権は各社に帰属する。`NOTICE.md` を参照。
