# 04 実装メモ

Phase 03 設計に従って src/ 配下に 5 ファイルを実装した。

## 成果物

| ファイル | LOC | 役割 |
| --- | --- | --- |
| src/index.html | 76 | 構造とボタン配置、3 つの script タグで JS を順次読み込み |
| src/styles.css | 53 | グリッドレイアウト・ダークテーマ |
| src/engine.js | 170 | tokenize / toRpn / evalRpn / evaluate / applyFunction / format |
| src/state.js | 133 | create / input / equals / applyUnary / memory* / toggleAngle |
| src/ui.js | 76 | DOM 結線、data-action ディスパッチャ、keydown ハンドラ |
| **合計** | **508** | ~510 LOC 制約に適合 |

## 実装上の判断

- 単項マイナス: tokenize 段階で「直前が op/lparen/func/式頭」の場合に 0 を補い、二項減算として処理
- ゼロ除算: evalRpn 末尾で isFinite チェック → `Error: Div by zero` を throw
- 定義域外 (asin(2) など): 同様に NaN チェック → `Error: Domain`
- format: 0 / 整数 / 指数表記 / 12 桁丸めの 4 ケース分岐
- 履歴: state.equals 成功時のみ `[{expr,result}]` を unshift し HISTORY_MAX=10 で切り捨て
- キーボード: 'm'/'M' で memory recall、Enter/= で評価、Escape で全クリア
