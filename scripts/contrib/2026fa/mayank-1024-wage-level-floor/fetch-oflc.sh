#!/usr/bin/env bash
# fetch-oflc.sh — ingest step (the only step of this mode besides fetch-pay-ranges.mjs
# that touches the network). Downloads one DOL OFLC wage-year zip from flag.dol.gov,
# records its sha256, and unpacks the two files the extract needs into the gitignored
# raw folder. It never edits the files.
#
#   bash scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-oflc.sh            # 2026-27
#   bash scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-oflc.sh 2025-26
#
# Then: node scripts/contrib/2026fa/mayank-1024-wage-level-floor/extract-oflc.mjs
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

WY="${1:-2026-27}"
case "$WY" in [0-9][0-9][0-9][0-9]-[0-9][0-9]) ;; *) echo "wage year must look like 2026-27" >&2; exit 2;; esac

RAW="data/dol/oflc/raw/$WY"
URL="https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_${WY}.zip"
mkdir -p "$RAW"
curl -fsSL -A "Mozilla/5.0 (compatible; The-Reallocation-Engine/1.0)" -o "$RAW/OFLC_Wages_${WY}.zip" "$URL"
( cd "$RAW" && unzip -o -q "OFLC_Wages_${WY}.zip" ALC_Export.csv Geography.csv )

SHA_ZIP=$(shasum -a 256 "$RAW/OFLC_Wages_${WY}.zip" | cut -d' ' -f1)
SHA_ALC=$(shasum -a 256 "$RAW/ALC_Export.csv" | cut -d' ' -f1)
SHA_GEO=$(shasum -a 256 "$RAW/Geography.csv" | cut -d' ' -f1)
cat > "$RAW/fetch.json" <<EOF
{
  "source_url": "$URL",
  "wage_year": "$WY",
  "fetched_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sha256": { "zip": "$SHA_ZIP", "ALC_Export.csv": "$SHA_ALC", "Geography.csv": "$SHA_GEO" }
}
EOF
echo "fetched $URL"
echo "  zip sha256 $SHA_ZIP"
echo "  wrote $RAW/{ALC_Export.csv,Geography.csv,fetch.json}"
