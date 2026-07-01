# Level Design — Proposal (pending approval)

Goals (from the brief):
- A ladder of levels (configurable, ~10–50). ~20 questions each (configurable),
  rising over time.
- Early levels: mostly **multiple choice** + **find on map**.
- **"Type the state"** is introduced for states the player gets right
  consistently; by the final level the player types all 50.
- Build some levels around **well-known patterns** (New England, the Great Plains
  vertical stack, Four Corners, …).

## Shared mechanics (apply to every option)

**Per-state modality ramp (reuses the SM-2 memory we already store).** Each
state advances through modalities as the player proves they know it:
1. **Multiple choice** (recognition) — brand-new states.
2. **Find on map** (locate) — once the state is *learned* (reps ≥ 2).
3. **Type the state** (recall) — once the state is *strong* (e.g., reps ≥ 4 with
   no recent miss).
So typing appears exactly for states answered right consistently, and by the time
all 50 are strong, every question is typed. A level can also cap the top modality
(e.g., "no typing before level N") so early levels stay gentle.

**Question count scaling.** `count(level) = clamp(BASE + floor(level / STEP), … , MAX)`.
Defaults (all configurable): BASE 12, +1 every 3 levels, MAX 30. (A flat 20 is
also fine — configurable.)

**Configurability.** Number of levels, questions-per-level curve, modality
thresholds, and which content pack — all in one config file.

**Progress.** A level "passes" at an accuracy threshold (e.g., ≥ 85%); passing
unlocks the next. Missed states flow back via the existing spaced-repetition
scheduler.

---

## Option A — Region Ladder
Levels walk the map region-by-region (cumulative), easy → hard, ending on New
England, then cumulative-review levels to fill out to the level cap.

Example (12 intro levels, then review levels 13→N):
1 Pacific + iconic (WA OR CA AK HI TX FL) · 2 Four Corners (AZ NM UT CO NV) ·
3 Northern Rockies (ID MT WY) · 4 Great Plains stack (ND SD NE KS OK) ·
5 South-Central (TX AR LA) · 6 Upper Midwest/MIMAL (MN IA MO WI) ·
7 Great Lakes (IL IN MI OH) · 8 Appalachia (KY TN WV VA) ·
9 Deep South (MS AL GA) · 10 Southeast coast (NC SC FL) ·
11 Mid-Atlantic (NY NJ PA DE MD) · 12 New England (ME NH VT MA RI CT) ·
13…N cumulative review (all learned states, counts rising, modality → typing).

- Pros: pedagogically clean; the map "fills in"; easy to reason about.
- Cons: less playful; region membership is fixed.

## Option B — Difficulty Tiers
Ignore geography; introduce ~4–5 new states per level strictly easiest → hardest
(Tier 1 → Tier 4 from `difficulty.md`). Modality ramps by level band globally.

- Pros: simplest; smooth difficulty curve.
- Cons: adjacent states aren't grouped, so the map builds up "randomly"; less thematic.

## Option C — Themed Milestones + Mastery-Driven Modality  ⭐ recommended
A sequence of **themed "unit" levels** (each a famous pattern), interleaved with
**cumulative review levels**, expanding to the level cap. Modality is driven
per-state by mastery (shared mechanics above), so typing ramps in naturally.

Themed units (ordered easy → hard), each ~4–8 states:
1. **West Coast** — WA OR CA (+ AK HI)
2. **Four Corners** — CO UT AZ NM (+ NV)
3. **Northern Rockies** — ID MT WY
4. **Great Plains Stack** — ND SD NE KS OK  *(the straight line down the middle)*
5. **Lone Star & the Delta** — TX AR LA
6. **MIMAL / Upper Midwest** — MN IA MO WI
7. **Great Lakes** — IL IN MI OH
8. **Appalachia** — KY TN WV VA
9. **Deep South** — MS AL GA
10. **Southeast Coast** — NC SC FL
11. **Mid-Atlantic / I-95** — NY NJ PA DE MD
12. **New England (final boss)** — ME NH VT MA RI CT

…with review levels after every few units (and filling out to level 20/50), where
counts rise and everything the player has learned is mixed — trending to all-typing.

Special "pattern" levels can also appear as challenges: *Rectangle States*,
*The Dakota Twins*, *Panhandles*, *Name the New England 6*.

- Pros: most fun and varied; directly uses the patterns in the brief; the typing
  ramp falls out of the memory system we already built.
- Cons: most to build (theme list + review interleaving + level map UI).

---

## Open decisions for approval
1. **Structure**: A, B, or C (recommend **C**).
2. **Level cap**: fixed campaign (~20) vs. stretch to 50 via review levels vs. endless.
3. **Questions/level**: rising curve (recommend) vs. flat 20.
4. **Typing trigger**: per-state mastery (recommend) vs. level-banded (all states
   become typeable at level N).
5. **Level select UI**: a simple vertical "path" of level nodes (Duolingo-style),
   or a plain list to start.
