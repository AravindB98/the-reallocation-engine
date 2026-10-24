#!/usr/bin/env bash
# One documented command, from the repo root:
#   bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh
#
# 1. pick sponsor companies from the 80 Days CSV            (select_sponsors.py)
# 2. fetch their real postings with the repo's own fetcher  (scripts/ats/fetch-real-postings.py; network)
# 3. keep US postings with descriptions, split by family    (split_families.py)
# 4. count skills per family with the repo's own monitor    (npm run skill-demand)
# 5. compare the families and apply the visa-timeline gate  (compare_families.py)
#
# Raw postings stay in private/ (gitignored). Only counts and reports go to run/.
# Re-runs on the same date reuse that day's fetch; SKILL_GAP_DATE=YYYY-MM-DD reuses an earlier one. Needs a python3 with `requests`
# (scripts/ats/requirements.txt). Override with PYTHON=/path/to/python3.
set -euo pipefail

HERE="scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap"
RUN="$HERE/run"
PRIV="private/real-postings/skill-gap"
PYTHON="${PYTHON:-python3}"
DATE="${SKILL_GAP_DATE:-$(date +%F)}"
POSTINGS="$PRIV/postings-$DATE.json"
# Defaults are the FICTIONAL persona Aarav Patel (search/examples/aarav-patel/profile.yml): F-1 STEM OPT,
# EAD from 2026-07-01, OPT end 2029-06-30, 0 of 150 unemployment days used. A real student points these
# at their own values and keeps their own profile in private/ (DATA_CONTRACT: no real immigration details
# or profiles in tracked files). OPT_END_DATE empty = EAD start + 12 months.
PROFILE="${PROFILE:-$HERE/profile/aarav-patel.json}"
EAD_START="${EAD_START:-2026-07-01}"
OPT_END_DATE="${OPT_END_DATE:-2029-06-30}"
UNEMPLOYMENT_DAYS_USED="${UNEMPLOYMENT_DAYS_USED:-0}"
UNEMPLOYMENT_LIMIT="${UNEMPLOYMENT_LIMIT:-150}"
TOP="${TOP:-40}"

mkdir -p "$RUN" "$PRIV"
"$PYTHON" "$HERE/select_sponsors.py" --top "$TOP" --out-dir "$RUN"

if [ ! -f "$POSTINGS" ]; then
  NAMES=()
  while IFS= read -r name; do [ -n "$name" ] && NAMES+=("$name"); done < "$RUN/sponsors.txt"
  ( cd scripts/ats && "$PYTHON" fetch-real-postings.py --greenhouse "${NAMES[@]}" --lever "${NAMES[@]}" -o "../../$POSTINGS" )
else
  echo "reusing $POSTINGS (already fetched for $DATE; no network call)"
fi

"$PYTHON" "$HERE/split_families.py" --postings "$POSTINGS" --private-dir "$PRIV" --summary "$RUN/families-summary.json"

for fam in swe ai devops; do
  # --taxonomy is passed explicitly: the monitor's default path breaks when the repo path contains spaces
  npm run --silent skill-demand -- "$PRIV/family-$fam.json" \
    --taxonomy "$HERE/taxonomy/swe-ai-devops-skills.json" \
    --profile "$PROFILE" \
    --min-sample 20 --out-dir "$RUN/$fam"
done

"$PYTHON" "$HERE/compare_families.py" --run-dir "$RUN" --private-dir "$PRIV" \
  --profile "$PROFILE" --ead-start "$EAD_START" --unemployment-days-used "$UNEMPLOYMENT_DAYS_USED" \
  --unemployment-limit "$UNEMPLOYMENT_LIMIT" ${OPT_END_DATE:+--opt-end-date "$OPT_END_DATE"} --fetched-on "$DATE"
