"""BLS wage context (Q11): case-insensitive substring of the target title in the BLS `title`
field only. No alternate-title matching. Context only — never scored."""


def lookup(target_title, bls_rows):
    if not target_title:
        return []
    t = target_title.lower()
    return [{"onet_soc_code": r["onet_soc_code"], "bls_soc_code": r["bls_soc_code"], "title": r["title"],
             "annual_median_wage": r["annual_median_wage"] or None, "oews_year": r["oews_year"]}
            for r in bls_rows if t in r["title"].lower()]
