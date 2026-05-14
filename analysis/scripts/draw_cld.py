"""Causal Loop Diagram (CLD) auto-rendered via networkx + graphviz layout.

Each edge carries polarity (+ / -). simple_cycles() identifies feedback
loops automatically; we label them R/B based on the product of polarities
along each cycle.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import networkx as nx

OUT_PATH = Path(__file__).resolve().parents[1] / "reports" / "cld.png"
LOOPS_PATH = Path(__file__).resolve().parents[1] / "reports" / "cld_loops.txt"

EDGES = [
    # (source, target, polarity)
    ("output_lang", "alpha_token_eff", "+"),
    ("output_lang", "user_read_speed", "-"),
    ("output_lang", "claude_write_quality", "+"),
    ("output_rate", "read_burden_rate", "+"),
    ("user_read_speed", "read_burden_rate", "-"),
    ("read_burden_rate", "cognitive_load", "+"),
    ("cognitive_load", "load_decay", "+"),
    ("load_decay", "cognitive_load", "-"),  # B-loop: load drains itself
    ("cognitive_load", "redirect_count", "+"),
    ("cognitive_load", "fatigue", "+"),
    ("fatigue", "load_decay", "+"),
    ("fatigue", "fatigue_suppression", "-"),
    ("fatigue_suppression", "clarification_count", "+"),
    ("fatigue_suppression", "correction_count", "+"),
    ("fatigue_suppression", "redirect_count", "+"),
    ("claude_write_quality", "effective_communication", "+"),
    ("effective_communication", "shared_understanding", "+"),
    ("shared_understanding", "effective_communication", "-"),  # B: saturation
    ("shared_understanding", "correction_count", "-"),
    ("shared_understanding", "approval_count", "+"),
    ("correction_count", "shared_understanding", "-"),  # corrections consume U
    ("read_burden_rate", "clarification_count", "+"),
    ("shared_understanding", "defect_intro", "-"),
    ("output_rate", "defect_intro", "+"),
    ("defect_intro", "latent_defects", "+"),
    ("latent_defects", "defect_discovery", "+"),
    ("shared_understanding", "defect_discovery", "+"),
    ("defect_discovery", "latent_defects", "-"),  # drains latent
    ("defect_discovery", "known_defects", "+"),
    ("output_rate", "token_rate", "+"),
    ("alpha_token_eff", "token_rate", "+"),
    ("token_rate", "cumulative_tokens", "+"),
]

EXOGENOUS = {"output_lang", "output_rate"}


def loop_polarity(graph: nx.DiGraph, cycle: list[str]) -> str:
    """Compute polarity of a feedback loop: product of edge polarities.
    R (reinforcing) if even number of '-'; B (balancing) if odd.
    """
    neg = 0
    n = len(cycle)
    for i in range(n):
        u, v = cycle[i], cycle[(i + 1) % n]
        if graph[u][v]["polarity"] == "-":
            neg += 1
    return "R" if neg % 2 == 0 else "B"


def main() -> None:
    G = nx.DiGraph()
    for u, v, p in EDGES:
        G.add_edge(u, v, polarity=p)

    # Find all simple feedback loops
    cycles = list(nx.simple_cycles(G))
    cycles.sort(key=len)
    with LOOPS_PATH.open("w") as f:
        f.write(f"Total simple cycles: {len(cycles)}\n\n")
        for i, c in enumerate(cycles, 1):
            polarity = loop_polarity(G, c)
            f.write(f"Loop {i:>3} ({polarity}, len={len(c)}): {' -> '.join(c)} -> {c[0]}\n")
    print(f"Detected {len(cycles)} feedback loops; details in {LOOPS_PATH}")

    # Render
    fig, ax = plt.subplots(figsize=(16, 11))
    try:
        pos = nx.nx_agraph.graphviz_layout(G, prog="dot")
    except (ImportError, Exception):
        pos = nx.spring_layout(G, seed=42, k=1.5, iterations=80)

    exo_nodes = [n for n in G.nodes if n in EXOGENOUS]
    endo_nodes = [n for n in G.nodes if n not in EXOGENOUS]
    nx.draw_networkx_nodes(G, pos, nodelist=exo_nodes, node_color="#ffd966",
                            node_size=2500, edgecolors="black", ax=ax)
    nx.draw_networkx_nodes(G, pos, nodelist=endo_nodes, node_color="#a4c2f4",
                            node_size=2200, edgecolors="black", ax=ax)
    pos_edges = [(u, v) for u, v, d in G.edges(data=True) if d["polarity"] == "+"]
    neg_edges = [(u, v) for u, v, d in G.edges(data=True) if d["polarity"] == "-"]
    nx.draw_networkx_edges(G, pos, edgelist=pos_edges, edge_color="#1a7f37",
                            arrows=True, arrowsize=14, width=1.2, ax=ax)
    nx.draw_networkx_edges(G, pos, edgelist=neg_edges, edge_color="#cf222e",
                            arrows=True, arrowsize=14, width=1.2,
                            style="dashed", ax=ax)
    nx.draw_networkx_labels(G, pos, font_size=7, ax=ax)
    ax.set_title(
        "Causal Loop Diagram — Output Language Experiment\n"
        "yellow=exogenous, blue=endogenous, green solid='+', red dashed='-'",
        fontsize=11,
    )
    ax.axis("off")
    fig.tight_layout()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT_PATH, dpi=110)
    print(f"CLD plot saved: {OUT_PATH}")


if __name__ == "__main__":
    main()
