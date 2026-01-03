# Social Security Trade-off Calculator (Python)

A small CLI tool to compare **Social Security claiming ages** by computing **cumulative benefits** (or **NPV**) through a target age and optionally plotting the results.

It supports:
- Entering benefits via an in-script table or a CSV (`age,monthly`)
- Evaluating totals through a given age (e.g. `--through-age 85`)
- Plotting cumulative benefits vs age (`--plot`)
- Optional assumptions: **COLA**, **discount rate (NPV)**, **effective tax**
- Finding **break-even age** between two claim strategies (`--compare 62 70`)
- Exporting plotted series to CSV (`--out series.csv`)

---

## Requirements

- Python 3.x
- `matplotlib` (only required if using `--plot`)

Install matplotlib:
```bash
python3 -m pip install matplotlib
```

---

## Web version (static)

Open `index.html` in a browser or deploy the repository as a static site on Vercel.

Local preview:
```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
