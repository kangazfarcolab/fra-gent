#!/usr/bin/env python3
"""
Script to run database migrations.
"""

import os
import sys
import subprocess
from pathlib import Path

# Get the absolute path of the current script
script_path = Path(__file__).resolve()

# Get the parent directory of the script (backend directory)
backend_dir = script_path.parent

# Change to the backend directory
os.chdir(backend_dir)

# Run the migrations
try:
    # Create the database if it doesn't exist
    subprocess.run(
        ["alembic", "upgrade", "head"],
        check=True,
    )
    print("Migrations completed successfully.")
except subprocess.CalledProcessError as e:
    print(f"Error running migrations: {e}")
    sys.exit(1)
