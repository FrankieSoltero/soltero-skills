---
name: legacy-scraper
description: Use when pulling listings from the partner catalog site — drives the scraping scripts.
last-verified: 2025-01-10
---

# Legacy Scraper

## Overview

Drives the catalog scraping pipeline.

## How

1. Activate the Python 2.7 virtualenv (`source venv2/bin/activate`).
2. Run `python scrape.py --all` (uses `urllib2` and BeautifulSoup 3).
3. Post-process with the `request` npm package (deprecated upstream but pinned here).
