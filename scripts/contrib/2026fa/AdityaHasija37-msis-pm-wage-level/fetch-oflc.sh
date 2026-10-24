#!/usr/bin/env bash
# Fetch one OFLC wage year (DOL FLAG): fetch-oflc.sh 2026-27  → <this dir>/raw/2026-27/
# Same pattern as scripts/fetch/fetch-oews.sh, but the checksum is pinned in
# this directory (checksums.lock) because student PRs may not edit data/.
# The raw files are gitignored here; only data/oflc-<year>-pm-extract.csv is committed.
set -euo pipefail
cd "$(dirname "$0")"
WY="${1:?usage: fetch-oflc.sh <wage year, e.g. 2026-27>}"
URL="https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_${WY}.zip"
LOCK="checksums.lock"; KEY="OFLC_Wages_${WY}.zip"; DEST="raw/${WY}"; TMP="$(mktemp -d)"
echo "fetching $URL"
curl -fL -A "reallocation-engine-course (contact: repo README)" "$URL" -o "$TMP/o.zip"
SUM=$(shasum -a 256 "$TMP/o.zip" | awk '{print $1}')
if grep -q "^$KEY " "$LOCK" 2>/dev/null; then
  PIN=$(grep "^$KEY " "$LOCK" | awk '{print $2}')
  [ "$SUM" = "$PIN" ] || { echo "CHECKSUM MISMATCH for $KEY: got $SUM want $PIN — refusing."; rm -rf "$TMP"; exit 1; }
  echo "checksum OK ($SUM)"
else
  echo "$KEY $SUM" >> "$LOCK"
  echo "FIRST FETCH — recorded checksum $SUM in $LOCK"
fi
mkdir -p "$DEST"; unzip -q -o "$TMP/o.zip" -d "$DEST"; cp "$TMP/o.zip" "raw/$KEY"; rm -rf "$TMP"; echo "→ $DEST"
