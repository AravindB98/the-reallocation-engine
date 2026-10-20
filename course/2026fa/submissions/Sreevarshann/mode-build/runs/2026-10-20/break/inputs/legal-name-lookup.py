"""Break 1 follow-up: exact-name lookups for common vs legal names (offline)."""
import sys
sys.path.insert(0, "scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor")
import lookup as L

idx = L.load_sponsor_index()
for q in ["Samsara", "Samsara Networks", "Plaid", "Plaid Technologies",
          "Instacart", "Maplebear", "One Medical", "1Life Healthcare"]:
    s = L.sponsor_lookup(q, idx)
    extra = (f"tier={s['tier']['value']} appr={s['approvals']['value']:g} den={s['denials']['value']:g}"
             if s["status"] == "found" else s.get("reason", ""))
    print(f"{q:24s} -> {s['status']:22s} {s.get('matched_name', {}).get('value', '')} {extra}")
