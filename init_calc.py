#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import math

try:
    import matplotlib.pyplot as plt
except ModuleNotFoundError:
    plt = None


DEFAULT_BENEFITS: Dict[int, float] = {
    62: 2632,
    63: 2846,
    64: 3080,
    65: 3378,
    66: 3677,
    67: 3966,
    68: 4093,
    69: 4433,
    70: 4988,
}


@dataclass(frozen=True)
class Option:
    claim_age: float
    monthly: float


def load_benefits_from_csv(path: str) -> Dict[int, float]:
    out: Dict[int, float] = {}
    with open(path, "r", newline="") as f:
        reader = csv.DictReader(f)
        if "age" not in reader.fieldnames or "monthly" not in reader.fieldnames:
            raise ValueError("CSV must have headers: age,monthly")
        for row in reader:
            age = int(row["age"])
            monthly = float(row["monthly"])
            out[age] = monthly
    if not out:
        raise ValueError("CSV contained no rows.")
    return out


def to_options(benefits: Dict[int, float]) -> List[Option]:
    return [Option(claim_age=float(age), monthly=benefits[age]) for age in sorted(benefits.keys())]


def monthly_payment_at_time(
    base_monthly: float,
    months_since_claim: int,
    cola_annual: float,
) -> float:
    """
    Apply COLA as an annual step-up once per 12 months after claiming.
    cola_annual is decimal (e.g. 0.02 for 2%).
    """
    if cola_annual <= 0:
        return base_monthly
    years = months_since_claim // 12
    return base_monthly * ((1.0 + cola_annual) ** years)


def discount_factor_for_month(month_index_from_start: int, discount_annual: float) -> float:
    """
    Discount cashflows back to start-age (month 0) using monthly compounding.
    discount_annual is decimal (e.g. 0.04 for 4%).
    """
    if discount_annual <= 0:
        return 1.0
    r_m = (1.0 + discount_annual) ** (1.0 / 12.0) - 1.0
    return 1.0 / ((1.0 + r_m) ** month_index_from_start)


def cumulative_series(
    option: Option,
    start_age: float,
    through_age: float,
    step_months: int,
    cola_annual: float,
    interest_annual: float,
    tax_rate: float,
) -> Tuple[List[float], List[float]]:
    """
    Returns (ages, balances) sampled every step_months from start_age..through_age.
    "balances" is the invested account balance at each sample age.
    """
    if step_months <= 0:
        raise ValueError("--step-months must be >= 1")

    start_month = int(round(start_age * 12))
    end_month = int(round(through_age * 12))
    claim_month = int(round(option.claim_age * 12))

    # monthly interest rate from annual (effective monthly)
    r_m = 0.0
    if interest_annual > 0:
        r_m = (1.0 + interest_annual) ** (1.0 / 12.0) - 1.0

    ages: List[float] = []
    balances: List[float] = []
    balance = 0.0

    # We simulate month-by-month; for plotting we record every step_months.
    # We'll treat each "month" as:
    #   1) apply interest to existing balance
    #   2) add this month's deposit (if claimed)
    # This is a reasonable convention and consistent across strategies.
    last_recorded_month = start_month

    for t in range(start_month, end_month + 1, step_months):
        prev_t = t - step_months
        if prev_t < start_month:
            prev_t = start_month

        for m in range(prev_t, t):
            # grow balance for the month
            if r_m > 0:
                balance *= (1.0 + r_m)

            # add deposit at month m if claimed
            if m >= claim_month:
                months_since_claim = m - claim_month
                payment = monthly_payment_at_time(option.monthly, months_since_claim, cola_annual)
                payment_after_tax = payment * (1.0 - tax_rate)
                balance += payment_after_tax

        ages.append(t / 12.0)
        balances.append(balance)

    return ages, balances


def total_at_through_age(
    option: Option,
    start_age: float,
    through_age: float,
    cola_annual: float,
    interest_annual: float,
    tax_rate: float,
) -> float:
    ages, balances = cumulative_series(
        option=option,
        start_age=start_age,
        through_age=through_age,
        step_months=12,  # yearly sampling; internally month-by-month
        cola_annual=cola_annual,
        interest_annual=interest_annual,
        tax_rate=tax_rate,
    )
    return balances[-1] if balances else 0.0


def break_even_age(
    a: Option,
    b: Option,
    start_age: float,
    max_age: float,
    cola_annual: float,
    interest_annual: float,
    tax_rate: float,
) -> Optional[float]:
    step_months = 1
    ages_a, bal_a = cumulative_series(a, start_age, max_age, step_months, cola_annual, interest_annual, tax_rate)
    ages_b, bal_b = cumulative_series(b, start_age, max_age, step_months, cola_annual, interest_annual, tax_rate)

    for age, va, vb in zip(ages_a, bal_a, bal_b):
        if vb >= va and age >= max(a.claim_age, b.claim_age):
            return age
    return None


def _parse_claim_age(label: str) -> float:
    # label looks like: "Claim 62 ($2,632/mo)"
    # this pulls the number after "Claim "
    return float(label.split("Claim ")[1].split(" ")[0])

def find_intersection_age(
    ages: List[float],
    y1: List[float],
    y2: List[float],
    min_age: float,
) -> Optional[Tuple[float, float]]:
    """
    Returns (age, y) where y1 crosses y2 for the first time at/after min_age.
    Uses linear interpolation between samples.
    """
    if len(ages) < 2:
        return None

    # Find first index where ages[i] >= min_age
    start_i = 0
    while start_i < len(ages) and ages[start_i] < min_age:
        start_i += 1

    if start_i >= len(ages) - 1:
        return None

    # Helper: diff at i
    def diff(i: int) -> float:
        return y1[i] - y2[i]

    # Establish a non-zero starting diff (skip initial equals/flat regions)
    i = start_i
    while i < len(ages) and abs(diff(i)) < 1e-9:
        i += 1
    if i >= len(ages):
        return None

    prev_i = i
    prev_d = diff(prev_i)

    for cur_i in range(prev_i + 1, len(ages)):
        cur_d = diff(cur_i)

        # Exact hit
        if abs(cur_d) < 1e-9:
            return (ages[cur_i], y1[cur_i])

        # Sign change => crossing between prev_i and cur_i
        if prev_d * cur_d < 0:
            a0, a1 = ages[prev_i], ages[cur_i]
            # linear interpolation fraction
            t = abs(prev_d) / (abs(prev_d) + abs(cur_d))
            age = a0 + (a1 - a0) * t
            y = y1[prev_i] + (y1[cur_i] - y1[prev_i]) * t
            return (age, y)

        prev_i, prev_d = cur_i, cur_d

    return None


def print_table(options, start_age, through_age, cola, interest, tax):
    rows = []
    for o in options:
        total = total_at_through_age(o, start_age, through_age, cola, interest, tax)
        rows.append((o.claim_age, o.monthly, total))

    rows_sorted = sorted(rows, key=lambda r: r[2], reverse=True)

    label = "Balance" if interest > 0 else "Total"
    print(f"\n{label} benefits from age {start_age:.1f} through age {through_age:.1f}")
    if cola > 0:
        print(f"Assumptions: COLA={cola*100:.2f}%/yr")
    if interest > 0:
        print(f"Assumptions: Interest={interest*100:.2f}%/yr (monthly comp)")
    if tax > 0:
        print(f"Assumptions: Tax={tax*100:.2f}% effective on benefits")

    print(f"\n{'Claim Age':>9}  {'Monthly ($)':>12}  {(label + ' thru age X ($)'):>20}")
    print("-" * 46)
    for age, monthly, total in rows_sorted:
        print(f"{age:>9.0f}  {monthly:>12,.0f}  {total:>20,.0f}")

    best = rows_sorted[0]
    print(f"\nBest by age {through_age:.1f}: claim at {best[0]:.0f} ({label} {best[2]:,.0f})\n")



def write_csv(out_path: str, series_by_age: Dict[str, Tuple[List[float], List[float]]]) -> None:
    # assume all age grids are identical
    labels = list(series_by_age.keys())
    ages = series_by_age[labels[0]][0]

    with open(out_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["age"] + labels)
        for i, age in enumerate(ages):
            row = [f"{age:.4f}"]
            for lab in labels:
                row.append(f"{series_by_age[lab][1][i]:.2f}")
            writer.writerow(row)


def plot(
    series_by_age: Dict[str, Tuple[List[float], List[float]]],
    title: str,
    ylabel: str,
    be_pairs: Optional[List[List[int]]] = None,
    by_claim_age: Optional[Dict[int, Tuple[List[float], List[float]]]] = None,
) -> None:
    if plt is None:
        print("Plotting requested, but matplotlib isn't installed. Install with: python3 -m pip install matplotlib")
        return

    fig, ax = plt.subplots()

    # Plot all curves and keep references + data
    labels = list(series_by_age.keys())
    plotted = []  # list of (label, ages, ys)
    for label in labels:
        ages, ys = series_by_age[label]
        ax.plot(ages, ys, label=label)
        plotted.append((label, ages, ys))

    # --- Annotate break-even intersections if requested (your existing logic) ---
    if by_claim_age is None:
        by_claim_age = {}

    def annotate_pair(ax_age: int, bx_age: int):
        if ax_age not in by_claim_age or bx_age not in by_claim_age:
            print(f"  (skipping {ax_age} vs {bx_age}: missing age in benefit table)")
            return

        ages, y_a = by_claim_age[ax_age]
        _, y_b = by_claim_age[bx_age]

        min_age = max(ax_age, bx_age)
        inter = find_intersection_age(ages, y_a, y_b, min_age=min_age)
        if inter is None:
            print(f"  {ax_age} vs {bx_age}: no break-even up to plotted range")
            return

        age_x, y_x = inter
        ax.scatter([age_x], [y_x], marker="o")
        ax.axvline(age_x, linestyle="--", linewidth=1)

        txt = f"BE {ax_age}↔{bx_age} ~ {age_x:.1f}"
        ax.annotate(txt, (age_x, y_x), textcoords="offset points", xytext=(6, 6))

        print(f"  Claim {ax_age} vs Claim {bx_age}: {age_x:.2f}")

    if be_pairs:
        print("\nBreak-even (intersection) points shown on chart:")
        for pair in be_pairs:
            annotate_pair(pair[0], pair[1])

    # --- Hover tooltip showing ALL series values at the hovered age ---
    # Assumption: all series share the same age grid (true in this script)
    base_ages = plotted[0][1] if plotted else []
    if not base_ages:
        return

    # vertical guide line
    vline = ax.axvline(base_ages[0], linestyle=":", linewidth=1, alpha=0.7)
    vline.set_visible(False)

    # tooltip box in the top-left of the axes (stable position)
    tooltip = ax.text(
        0.02, 0.98, "",
        transform=ax.transAxes,
        va="top", ha="left",
        fontsize=14,
        color="white",
        bbox=dict(boxstyle="round", facecolor="black", edgecolor="none", alpha=0.85),
    )
    tooltip.set_visible(False)

    def fmt_money(v: float) -> str:
        return f"${v:,.0f}"

    def on_move(event):
        if event.inaxes != ax or event.xdata is None:
            if vline.get_visible() or tooltip.get_visible():
                vline.set_visible(False)
                tooltip.set_visible(False)
                fig.canvas.draw_idle()
            return

        x = float(event.xdata)

        # Snap to 1-year increments (whole years)
        snapped_age = int(round(x))

        # Clamp to plot range
        snapped_age = max(int(math.ceil(base_ages[0])), snapped_age)
        snapped_age = min(int(math.floor(base_ages[-1])), snapped_age)

        # Find nearest index to the snapped whole-year age
        nearest_i = min(range(len(base_ages)), key=lambda i: abs(base_ages[i] - snapped_age))
        age = base_ages[nearest_i]

        # Build tooltip content with all series values at this index
        lines = [f"Age: {int(round(age))}"]
        values = []
        for label, ages, ys in plotted:
            # ages grids should match, but we’ll still index ys by nearest_i
            val = ys[nearest_i]
            values.append(val)
            lines.append(f"{label}: {fmt_money(val)}")

        if values:
            diff = max(values) - min(values)
            lines.append(f"Top vs bottom diff: {fmt_money(diff)}")

        tooltip.set_text("\n".join(lines))
        tooltip.set_visible(True)

        vline.set_xdata([age, age])
        vline.set_visible(True)

        fig.canvas.draw_idle()

    fig.canvas.mpl_connect("motion_notify_event", on_move)

    # Labels, legend, etc.
    ax.set_xlabel("Age")
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.legend()
    fig.tight_layout()
    plt.show()


def main() -> None:
    p = argparse.ArgumentParser(description="Social Security trade-off calculator + graph")
    p.add_argument("--through-age", type=float, default=85.0, help="Evaluate cumulative benefits through this age (default: 85)")
    p.add_argument("--start-age", type=float, default=None, help="Start age for evaluation/plot (default: min claim age)")
    p.add_argument("--max-age", type=float, default=100.0, help="Max age shown on plot / break-even search (default: 100)")
    p.add_argument("--step-months", type=int, default=12, help="Sampling granularity for plot (1=monthly, 12=yearly). Default: 12")
    p.add_argument("--csv", type=str, default=None, help="Optional CSV file (headers: age,monthly)")
    p.add_argument("--plot", action="store_true", help="Show cumulative benefit plot")
    p.add_argument("--out", type=str, default=None, help="Write plotted series to CSV file")

    # New tunables
    p.add_argument("--cola", type=float, default=2.0, help="Annual COLA percent (e.g. 2.5 for 2.5%%). Default: 2")
    p.add_argument(
        "--interest",
        type=float,
        default=0.0,
        help="Annual interest rate percent earned on invested benefits (e.g. 5 for 5%%). Default: 0",
    )
    p.add_argument("--tax", type=float, default=0.0, help="Effective tax rate percent on benefits (e.g. 10 for 10%%). Default: 0")

    p.add_argument("--compare", nargs=2, type=int, metavar=("AGE_A", "AGE_B"), help="Print break-even age between two claim ages")

    p.add_argument(
        "--be",
        nargs=2,
        type=int,
        action="append",
        metavar=("AGE_X", "AGE_Y"),
        help="Annotate break-even intersection(s) between two claim ages. Repeatable: --be 62 70 --be 67 70",
    )

    args = p.parse_args()

    plot_only_ages: Optional[set[int]] = None
    if args.be:
        plot_only_ages = set()
        for x, y in args.be:
            plot_only_ages.add(int(x))
            plot_only_ages.add(int(y))

    benefits = load_benefits_from_csv(args.csv) if args.csv else DEFAULT_BENEFITS
    options = to_options(benefits)

    start_age = args.start_age
    if start_age is None:
        start_age = min(o.claim_age for o in options)

    cola = args.cola / 100.0
    interest = args.interest / 100.0
    tax = args.tax / 100.0

    print_table(options, start_age, args.through_age, cola, interest, tax)

    if args.compare:
        a_age, b_age = args.compare
        if a_age not in benefits or b_age not in benefits:
            raise ValueError(f"--compare ages must be in benefits table. Got {a_age}, {b_age}.")
        a = Option(float(a_age), benefits[a_age])
        b = Option(float(b_age), benefits[b_age])
        be = break_even_age(a, b, start_age, args.max_age, cola, interest, tax)
        if be is None:
            print(f"No break-even found up to age {args.max_age:.1f} between claim {a_age} and {b_age}.")
        else:
            print(f"Break-even age between claim {a_age} and {b_age}: {be:.2f}")

    if args.plot or args.out:
        series_by_age: Dict[str, Tuple[List[float], List[float]]] = {}
        series_by_claim_age: Dict[int, Tuple[List[float], List[float]]] = {}
        

        for o in options:
            claim_age_int = int(o.claim_age)

            # If --be was provided, only include ages involved in comparisons
            if plot_only_ages is not None and claim_age_int not in plot_only_ages:
                continue
            
            ages, totals = cumulative_series(
                option=o,
                start_age=start_age,
                through_age=args.max_age,
                step_months=args.step_months,
                cola_annual=cola,
                interest_annual=interest,
                tax_rate=tax,
            )
            label = f"Claim {claim_age_int} (${o.monthly:,.0f}/mo)"
            series_by_age[label] = (ages, totals)
            series_by_claim_age[claim_age_int] = (ages, totals)

        ylabel = "Invested Balance ($)" if interest > 0 else "Cumulative Benefits ($)"
        title = "Social Security Cumulative Benefits by Claim Age"

        if args.plot:
            plot(series_by_age, title=title, ylabel=ylabel, be_pairs=args.be, by_claim_age=series_by_claim_age)

        if args.out:
            write_csv(args.out, series_by_age)
            print(f"Wrote series to {args.out}")


if __name__ == "__main__":
    main()
