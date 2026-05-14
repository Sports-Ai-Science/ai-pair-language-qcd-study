# Phase 10 — 振り返り — Run-4 (日本語出力, ABAB position 4)

## Keep
- 4 Run を通じて IIFE classic script パターンが file:// 起動を確実に支えた
- 日本語出力でも体系的な技術文書化が可能（専門用語の英語残しが鍵）
- Run-2 と同一構造の踏襲で再現性確保

## Problem
- L2 隔離破れによる carryover が累積、本 Run は最も「学習済み」な状態
- ABAB 4 Run の所要時間モノトニック減少（118 → 65 → 28 → 18 分）が観測され、純粋な言語効果分離不能
- N=4 + 同一セッションでは ANOVA の position 効果と language 効果の分離は限定的

## Try
- 別セッションで Run-1' を再実行し、現在の「学習済み Claude」と「fresh Claude」の差を測定
- それにより carryover 量を定量化し、本セッションの 4 Run データから言語効果を補正

## 定量メモ
- 経過: ~18 分（最短）
- 56/56 テスト PASS、10/10 AC、0 バグ、0 介入
- 推定トークン: ~70K（日本語 × Run-2 と同水準）
