# Data provenance — cap-exempt triage

## Executive summary

This file records where each dataset in this folder came from, when it was downloaded, and the fingerprint (SHA-256) of the exact file, so anyone can check the data was not changed. The raw downloads are not committed; the compact extracts are. Re-run `ingest.py` to rebuild them.

## Sources

| Source | URL | Downloaded | Raw SHA-256 | Extract | Extract SHA-256 | Rows in → out |
|---|---|---|---|---|---|---|
| NCES IPEDS HD2024 (institutional characteristics directory) | https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip | 2026-10-21 | `d98425c123d7c0e872aec6e83960dfb501884818bf17385c340790f3d1f28345` | `extracts/ipeds_hd2024.csv` | `265825dbdd07ce169ffc204fac97afefae69984f380d2952258801cc5e8a67d1` | 6,072 → 6,072 |
| USCIS H-1B Employer Data Hub, FY2023 | https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2023.csv | 2026-10-21 | `96f42309393249a7368bd418b2b2c5111b45acc7ccec487a0f024dfa07d71931` | `extracts/uscis_h1b_hub_fy2023.csv` | `96f42309393249a7368bd418b2b2c5111b45acc7ccec487a0f024dfa07d71931` | 33,332 → 33,332 |
