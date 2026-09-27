"""
Thin Supabase client wrapper.

For the hackathon, the whole app must be able to start and run purely off
the in-memory simulation even if Supabase is not configured yet. So this
module never raises on import/startup - it just returns None from
get_supabase() if credentials are missing, and callers are expected to
handle that (fall back to in-memory data).
"""

import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

_client = None
_attempted = False


def get_supabase():
    """
    Return a cached Supabase client, or None if it isn't configured / the
    supabase package isn't usable in this environment. Never raises.
    """
    global _client, _attempted

    if _client is not None:
        return _client

    if _attempted:
        return None
    _attempted = True

    if not SUPABASE_URL or not SUPABASE_KEY:
        return None

    try:
        from supabase import create_client
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _client
    except Exception as exc:  # pragma: no cover - defensive, hackathon mode
        print(f"[supabase] could not initialize client, falling back to in-memory mode: {exc}")
        return None


def is_connected() -> bool:
    return get_supabase() is not None
