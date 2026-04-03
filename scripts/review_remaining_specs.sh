#!/usr/bin/env bash
set -euo pipefail
cd /home/ubuntu/upload
for f in \
  luminary_github_integration.html \
  luminary_manus_prompts.html \
  luminary_content_system.html \
  luminary_ideas.html \
  luminary_admin_map.html; do
  echo "===== FILE: $f ====="
  sed -n '1,260p' "$f"
  echo
  echo "===== END: $f ====="
  echo
 done
