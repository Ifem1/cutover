#!/usr/bin/env python3
"""Compatibility wrapper for scripts/live/verify_source.mjs."""
import subprocess
import sys

raise SystemExit(subprocess.call(["node", "scripts/live/verify_source.mjs", *sys.argv[1:]]))
