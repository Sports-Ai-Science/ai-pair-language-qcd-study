"""Empirically measure alpha_token_eff for English vs Japanese.

Uses tiktoken with Claude-compatible encoding (cl100k_base is closest
public-available proxy). Outputs the calibrated parameter values to be
loaded into the SD model.

Run: python analysis/scripts/measure_token_density.py
"""
from __future__ import annotations

import json
from pathlib import Path

import tiktoken

REPORT_PATH = Path(__file__).resolve().parents[1] / "reports" / "tiktoken_calibration.json"

EN_SAMPLES = [
    "The quick brown fox jumps over the lazy dog.",
    "We are building a scientific calculator that runs locally in a browser. "
    "It supports basic arithmetic, trigonometric functions, logarithms, and memory.",
    "Acceptance Criteria: When the user presses Enter, the calculator must evaluate "
    "the current expression and display the result within 100 milliseconds. "
    "Division by zero should display 'Error' and not crash the application.",
    "Phase 4 Implementation: write the arithmetic engine first, then the keypad UI, "
    "then keyboard event handlers. Test coverage target is 80 percent for branches.",
    "The experiment compares two output languages to understand which combination "
    "of cost, quality, and delivery is best for a Japanese-native engineer.",
]

JA_SAMPLES = [
    "素早い茶色のキツネが怠けた犬を飛び越える。",
    "ブラウザでローカルに動作する関数電卓を構築しています。"
    "四則演算、三角関数、対数、メモリ機能をサポートします。",
    "受け入れ基準: ユーザーが Enter キーを押したとき、電卓は現在の式を評価し、"
    "100 ミリ秒以内に結果を表示しなければならない。"
    "ゼロ除算は「エラー」を表示し、アプリケーションがクラッシュしないこと。",
    "フェーズ 4 実装: 最初に算術エンジンを書き、次にキーパッド UI、"
    "そしてキーボードイベントハンドラを書く。テストカバレッジ目標はブランチ 80% です。",
    "本実験は、出力言語を 2 通り変えて、日本語ネイティブのエンジニアにとって"
    "コスト・品質・納期のバランスがよい組み合わせを明らかにします。",
]


def measure(samples: list[str], enc: tiktoken.Encoding) -> dict:
    total_chars = sum(len(s) for s in samples)
    total_tokens = sum(len(enc.encode(s)) for s in samples)
    density = total_tokens / total_chars
    return {
        "n_samples": len(samples),
        "total_chars": total_chars,
        "total_tokens": total_tokens,
        "alpha_token_eff": density,
    }


def main() -> None:
    enc = tiktoken.get_encoding("cl100k_base")
    en = measure(EN_SAMPLES, enc)
    ja = measure(JA_SAMPLES, enc)
    report = {
        "encoding": "cl100k_base (OpenAI; proxy for Claude)",
        "english": en,
        "japanese": ja,
        "ratio_ja_over_en": ja["alpha_token_eff"] / en["alpha_token_eff"],
        "notes": (
            "cl100k_base is used as a public proxy; Claude's actual tokenizer may "
            "differ in absolute values but the EN/JA ratio is typically preserved "
            "within ~10%."
        ),
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
