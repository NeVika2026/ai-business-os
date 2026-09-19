import os
import sys
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

SCOUT_ROOT = Path(os.environ.get("SCOUT_ROOT", "/opt/scout"))
sys.path.insert(0, str(SCOUT_ROOT))

from app.scrapers import (
    scrape_github,
    scrape_instagram,
    scrape_linkedin,
    scrape_linkbio,
    scrape_pinterest,
    scrape_tiktok,
    scrape_twitch,
    scrape_youtube,
)
from app.scrapers.enrichment import LeadEnricher

app = FastAPI(title="Business Zavod Scout Worker", version="1.0.0")

Platform = Literal[
    "instagram",
    "tiktok",
    "linkedin",
    "github",
    "youtube",
    "twitch",
    "linkbio",
    "pinterest",
]

SCRAPERS = {
    "instagram": scrape_instagram,
    "tiktok": scrape_tiktok,
    "linkedin": scrape_linkedin,
    "github": scrape_github,
    "youtube": scrape_youtube,
    "twitch": scrape_twitch,
    "linkbio": scrape_linkbio,
    "pinterest": scrape_pinterest,
}


class ScrapeRequest(BaseModel):
    platform: Platform
    identifier: str = Field(min_length=1, max_length=300)
    enrich: bool = True


def require_token(authorization: str | None) -> None:
    expected = os.environ.get("SCOUT_WORKER_TOKEN", "").strip()
    if not expected:
        return
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "scout-worker",
        "platforms": list(SCRAPERS.keys()),
    }


@app.post("/scrape")
def scrape(
    request: ScrapeRequest,
    authorization: str | None = Header(default=None),
):
    require_token(authorization)

    scraper = SCRAPERS[request.platform]

    try:
        lead = scraper(request.identifier.strip())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)[:500]) from exc

    if not lead:
        raise HTTPException(status_code=404, detail="Profile not found")

    if request.enrich:
        hunter_key = os.environ.get("HUNTER_API_KEY", "").strip() or None
        lead = LeadEnricher(hunter_api_key=hunter_key).enrich_lead(lead)

    return {
        "ok": True,
        "platform": request.platform,
        "lead": lead,
    }
