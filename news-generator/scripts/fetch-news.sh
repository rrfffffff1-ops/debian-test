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

echo "STEP 2: Fetch V6 Velugu homepage..."
HTML=$(curl -s --max-time 30 "https://www.v6velugu.com/")
echo "OK ($(echo "$HTML" | wc -c) bytes)"

echo "STEP 3: Extract articles via Python..."
python3 -c '
import re, sys, signal
signal.signal(signal.SIGPIPE, signal.SIG_DFL)
html = sys.stdin.read()
p = r"href=\"(https://www\.v6velugu\.com/([a-z][a-z0-9-]+))\"[^>]*>([^<]{10,})"
skip = {"hyderabad-news","national-news","telangana-latest-news-updates","international-news","andhra-pradesh-news","sports","teenmar-news","film-news","business-news","crime-news","education","life","latest","css","img","favicon","warangal","karimnagar","mahabubnagar","adilabad","khammam","nalgonda","nizamabad","medak","ranga-reddy","search","contact-us","privacy-policy","grievance-redressal","telangana"}
seen = set()
n = 0
for m in re.finditer(p, html):
    slug = m.group(2)
    text = m.group(3).strip()
    if slug not in skip and text not in seen and len(text) > 5:
        seen.add(text)
        print(f"{m.group(1)}\x1f{text}")
        n += 1
        if n >= 10:
            break
' <<< "$HTML" > "$OUTPUT_DIR/articles-raw-$DATE_TAG.txt"

echo "Found $(wc -l < "$OUTPUT_DIR/articles-raw-$DATE_TAG.txt") articles"

echo "STEP 4: Fetch dates for each article..."
> "$OUTPUT_DIR/articles-data-$DATE_TAG.txt"
while IFS=$'\x1f' read -r url headline; do
  [ -z "$url" ] && continue
  slug=$(echo "$url" | sed 's|https://www.v6velugu.com/||')
  echo -n "  $slug ... "
  PAGE=$(curl -s --max-time 15 "$url" 2>/dev/null)
  DATE=$(echo "$PAGE" | grep -oP 'article:published_time" content="\K[^"]+' | head -1)
  [ -z "$DATE" ] && DATE=$(echo "$PAGE" | grep -oP '[A-Z][a-z]+ \d+, \d{4}' | head -1)
  [ -z "$DATE" ] && DATE="$DATE_TAG"
  echo "$DATE"
  echo -e "${url}\x1f${headline}\x1f${DATE}" >> "$OUTPUT_DIR/articles-data-$DATE_TAG.txt"
done < "$OUTPUT_DIR/articles-raw-$DATE_TAG.txt"

echo ""
echo "STEP 5: Select top 3 articles (AI/Tech prioritized)..."
python3 -c "
import sys, re
lines = [l.strip() for l in open('$OUTPUT_DIR/articles-data-$DATE_TAG.txt') if l.strip()]
skip = ['murder','theft','rape','suicide','kill','arrest','crime','corrupt','fraud','dacoity','ganja','drug','horrific']
ai_tags = ['ai','tech','google','apple','meta','instagram','digital','gps','cyber','app','remote','e-rickshaw']
selected = []
for l in lines:
    parts = l.split('\x1f')
    if len(parts) < 3: continue
    url, headline, date = parts[0], parts[1], parts[2]
    slug = url.split('/')[-1].lower()
    h = headline.lower()
    combined = h + ' ' + slug
    if any(k in combined for k in skip): continue
    score = sum(1 for k in ai_tags if k in combined)
    selected.append((-score, date, url, headline))
selected.sort()
for _, date, url, headline in selected[:3]:
    print(f'{url}\x1f{headline}\x1f{date}')
" > "$OUTPUT_DIR/top3-$DATE_TAG.txt"

echo "=== Selected Articles ==="
cat "$OUTPUT_DIR/top3-$DATE_TAG.txt"
echo ""

echo "STEP 6: Generate HTML blog..."
BLOG_HTML="$OUTPUT_DIR/blog-$DATE_TAG.html"

cat > "$BLOG_HTML" << 'HTMLHEAD'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
HTMLHEAD
echo "<title>V6 Velugu News Digest - $DATE_TAG</title>" >> "$BLOG_HTML"
cat >> "$BLOG_HTML" << 'HTMLSTYLE'
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:40px auto;padding:20px;background:#f9f9f9;color:#333;line-height:1.6}
h1{color:#c00;border-bottom:3px solid #c00;padding-bottom:10px}
.article{background:#fff;border-radius:8px;padding:20px;margin:16px 0;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.article h2{margin:0 0 8px;font-size:1.2em}
.article h2 a{color:#1a73e8;text-decoration:none}
.article h2 a:hover{text-decoration:underline}
.meta{font-size:0.85em;color:#666;margin-bottom:8px}
.meta .date{color:#c00;font-weight:600}
.desc{font-size:0.95em;color:#444}
.footer{margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:0.85em;color:#888;text-align:center}
.verify{background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:10px 16px;margin:16px 0;font-size:0.9em}
.verify strong{color:#856404}
</style>
</head>
<body>
<h1>V6 Velugu News Digest</h1>
HTMLSTYLE
echo "<p style=\"color:#666;margin-top:-10px\">Latest news from V6 Velugu &mdash; $DATE_TAG</p>" >> "$BLOG_HTML"

N=0
while IFS=$'\x1f' read -r url headline date; do
  [ -z "$url" ] && continue
  N=$((N+1))
  cat >> "$BLOG_HTML" << ARTICLE
<div class="article">
  <h2><a href="$url" target="_blank">$headline</a></h2>
  <div class="meta">
    <span class="date">$date</span> &middot; <a href="$url" target="_blank">Read original on V6 Velugu</a>
  </div>
  <div class="desc">Article #$N from V6 Velugu — click the headline above to read the full story. Published $date.</div>
</div>
ARTICLE
done < "$OUTPUT_DIR/top3-$DATE_TAG.txt"

cat >> "$BLOG_HTML" << 'HTMLFOOT'
<div class="verify">
  <strong>Verification:</strong> Click any headline or "Read original" link to view the full article on V6 Velugu. Published dates are shown for each article.
</div>
<div class="footer">
  Generated by Blackbox CLI &middot; <a href="https://www.v6velugu.com/">V6 Velugu</a>
</div>
</body>
</html>
HTMLFOOT

echo "=== Blog HTML ==="
cat "$BLOG_HTML"
echo ""
echo "=== Complete: $BLOG_HTML ==="
