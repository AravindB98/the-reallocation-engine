# Domain justification — cogpivot-unprofiled

**Who.** Priya Nair (fictional persona, `search/examples/priya-nair/`): F-1,
post-completion OPT year 1, Boston, 34 of 90 unemployment days used, targeting AI
Engineer / ML Engineer and Data Engineer roles. She has weeks, not months, and must
choose which title to aim at before she can tailor anything.

**The asymmetry.** She can see what each occupation pays — BLS publishes it. What
she cannot see is which of those titles is work that survives automation. The
Cognitive Pivot layer exists to answer exactly that, scoring occupations on nine
O*NET ability and skill levels.

Running it over the shipped table shows it cannot answer for **122 of 1,016
occupations (12%)**, where none of the nine inputs are present. Two different
causes: **119** are aggregate `.00` rows whose detailed `.0X` children *are*
profiled, so the data exists one level down; **3** are detailed rows with no profile
at any level. Data Scientists (15-2051.00) is in the first group — its children
score 3.738 and 3.903.

So the asymmetry is not that the answer is unknown. It is that **the table presents
an empty aggregate row identically to a genuinely undescribed occupation**, and a
reader cannot tell which they are looking at. One admits a fallback; the other does
not.

**Engine layer.** The Cognitive Pivot — `data/bls/compact/soc_occupation_compact.csv`,
with the formula reproduced from `scripts/bls/extract-soc-occupation-table.py:128`
and cross-checked by recomputation rather than read from the shipped column.

**Failure mode 1 — a silence read as a verdict.** The shape: an unprofiled
occupation gets scored `0.0` by a tool that treats missing as zero, and `0.0` on
this scale reads as *maximally replaceable*. A candidate drops a viable career
direction on the strength of an absent row. Hardest to catch for someone new to the
field, who has no independent sense of whether the work is cognitively demanding and
so cannot tell a low score from a missing one. This mode emits `null` and refuses.

**Failure mode 2 — a borrowed score inherited silently.** The shape: the fallback
band is taken as the occupation's own score. Business Intelligence Analyst is not
Data Scientist; borrowing 3.903 looks like evidence and is a judgment. Hardest to
catch for a career-changer, who cannot judge whether two adjacent SOC codes describe
similar work and will accept the catalogue's adjacency as a claim about the job.
This mode labels the band `model-judgment` and names every peer so the substitution
can be refused.
