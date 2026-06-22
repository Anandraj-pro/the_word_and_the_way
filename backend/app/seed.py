"""Seed the room with a little real testimony so every station shows something on day one."""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Encounter, Season, Stage


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(Season).limit(1)) is not None:
        return  # already inhabited — leave it alone

    rebuilding = Season(
        name="Season of Rebuilding",
        opening_scripture="Nehemiah 2:18",
        opening_declaration="I am entering a season of rebuilding.",
        opened_on=date(2026, 1, 6),
    )
    wilderness = Season(
        name="Wilderness 2024",
        opening_scripture="Hosea 2:14",
        epitaph="This was my Wilderness — and He spoke tenderly there.",
        opened_on=date(2024, 3, 1),
        closed_on=date(2024, 11, 20),
    )
    db.add_all([rebuilding, wilderness])
    db.flush()  # assign ids

    encounters = [
        # A cornerstone — carried across three seasons, lives on the Altar.
        Encounter(
            scripture="Jeremiah 29:11",
            scripture_text="For I know the plans I have for you, declares the LORD.",
            words="He keeps saying this over every new assignment.",
            stage=Stage.carried,
            season_id=rebuilding.id,
            received_on=date(2024, 4, 12),
            carry_count=3,
            themes="calling,plans,assurance",
        ),
        Encounter(
            scripture="Isaiah 43:19",
            scripture_text="Behold, I am doing a new thing; now it springs forth.",
            words="Spoken on the morning the rebuilding began.",
            stage=Stage.carried,
            season_id=rebuilding.id,
            received_on=date(2026, 1, 6),
            carry_count=4,
            themes="newness,breakthrough",
        ),
        # A fresh rhema word — Receive stage, on the Desk today.
        Encounter(
            scripture="Psalm 27:14",
            scripture_text="Wait for the LORD; be strong, and let your heart take courage.",
            words="",
            stage=Stage.received,
            season_id=rebuilding.id,
            received_on=date.today(),
            carry_count=0,
            themes="waiting,courage",
        ),
        # A declaration — on the Wall.
        Encounter(
            scripture="Romans 8:37",
            scripture_text="In all these things we are more than conquerors.",
            words="More than a conqueror through Him who loved me.",
            stage=Stage.declared,
            season_id=rebuilding.id,
            received_on=date(2026, 1, 20),
            carry_count=1,
            themes="victory,identity",
        ),
        # A testimony — Witness stage, at the Window.
        Encounter(
            scripture="Hosea 2:14",
            scripture_text="I will allure her and bring her into the wilderness.",
            words="What felt like exile was where He spoke most tenderly. He kept me.",
            stage=Stage.witnessed,
            season_id=wilderness.id,
            received_on=date(2024, 11, 20),
            carry_count=2,
            themes="faithfulness,tenderness",
        ),
    ]
    db.add_all(encounters)
    db.commit()
