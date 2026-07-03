#!/usr/bin/env bash
set -euo pipefail

NEWS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$NEWS_DIR/output"
mkdir -p "$OUTPUT_DIR"
DATE_TAG=$(date -u +"%Y-%m-%d")

echo "STEP 1: Install blackbox if needed..."
if ! command -v blackbox &>/dev/null; then
  curl -fsSL https://blackbox.ai/install.sh | bash
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "STEP 2: Fetch V6 Velugu..."
HTML=$(curl -s --max-time 30 "https://www.v6velugu.com/")
echo "OK ($(echo "$HTML" | wc -c) bytes)"

echo "STEP 3: Extract headlines..."
NEWS_CLEAN=$(echo "$HTML" | python3 -c '
import re, sys
html = sys.stdin.read()
p = r"href=\"https://www\.v6velugu\.com/([a-z][a-z0-9-]+)\"[^>]*>([^<]{10,})"
skip = {"hyderabad-news","national-news","telangana-latest-news-updates","international-news","andhra-pradesh-news","sports","teenmar-news","film-news","business-news","crime-news","education","life","latest","css","img","favicon","warangal","karimnagar","mahabubnagar","adilabad","khammam","nalgonda","nizamabad","medak","ranga-reddy"}
seen = set()
n = 0
for m in re.finditer(p, html):
    if m.group(1) not in skip and m.group(2).strip() not in seen and len(m.group(2).strip()) > 5:
        seen.add(m.group(2).strip())
        print(m.group(2).strip())
        n += 1
        if n >= 8:
            break
')

echo "$NEWS_CLEAN"
echo "$NEWS_CLEAN" > "$OUTPUT_DIR/news-raw-$DATE_TAG.txt"

echo "STEP 4: Generate content..."
HEADLINES=$(echo "$NEWS_CLEAN" | tr '\n' ';' | sed 's/;$//')
[ -z "$HEADLINES" ] && HEADLINES="V6 Velugu Telugu news"

blackbox -p "Summarize these Telugu news headlines. Text only. Date: $DATE_TAG. Headlines: $HEADLINES. Format: BLOG:[3 sentences] LINKEDIN:[2 sentences with hashtags]" > "$OUTPUT_DIR/generated-$DATE_TAG.txt" 2>/dev/null

echo "=== Output ==="
cat "$OUTPUT_DIR/generated-$DATE_TAG.txt"
echo ""
echo "=== Complete: $OUTPUT_DIR/generated-$DATE_TAG.txt ==="
