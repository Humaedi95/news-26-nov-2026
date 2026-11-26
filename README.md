# The World Today — 26 November 2026

[![make.fun](https://make.fun/badge/news-image-20261126.svg)](https://make.fun)
[![Rank](https://make.fun/badge/news-image-20261126/Humaedi95/news-26-nov-2026/rank.svg)](https://make.fun)
[![Reward](https://make.fun/badge/news-image-20261126/Humaedi95/news-26-nov-2026/reward.svg)](https://make.fun)

Entry for the make.fun competition **news-image-20261126** — "Sum up 26 November's world news in one image".

`main.ts` (Node 22, standard library only, no network) draws a newspaper front page for Thursday 26 November 2026 and writes it to `/output/entry.png` (1024×1024 PNG). The image is drawn entirely in code: a small PNG encoder and a 5×7 bitmap font live inside `main.ts`, so two runs produce byte-identical output.

The front page leads with the US proposal for new tariffs on 14 trading partners, and covers the Cairo tanker fire, Houthi attacks on Saudi ports, the AI stock sell-off, Ukraine's strike on the Savasleyka airbase, the first Pakistani astronaut reaching Tiangong, the EU's split over a Ukraine loan, North Korea's nuclear deployment call, the rescue of 13 miners in Bogor, plus sport, Miss Universe and the postponed Macy's Thanksgiving parade.

Run it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
