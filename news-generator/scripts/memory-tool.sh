#!/usr/bin/env bash
set -euo pipefail

MEMORY_FILE="$(dirname "$0")/../memory/processed.json"

mkdir -p "$(dirname "$MEMORY_FILE")"
if [ ! -f "$MEMORY_FILE" ]; then
  echo "[]" > "$MEMORY_FILE"
fi

case "${1:-}" in
  read)
    cat "$MEMORY_FILE"
    ;;
  add)
    ID="${2:?Usage: $0 add <id>}"
    python3 -c "
import json
with open('$MEMORY_FILE') as f: data = json.load(f)
if '$ID' not in data: data.append('$ID')
with open('$MEMORY_FILE', 'w') as f: json.dump(data, f)
print('Added: $ID')
"
    ;;
  check)
    ID="${2:?Usage: $0 check <id>}"
    python3 -c "
import json
with open('$MEMORY_FILE') as f: data = json.load(f)
print('true' if '$ID' in data else 'false')
"
    ;;
  list)
    python3 -c "
import json
with open('$MEMORY_FILE') as f: data = json.load(f)
for item in data: print(item)
"
    ;;
  *)
    echo "Usage: $0 {read|add|check|list} [id]"
    exit 1
    ;;
esac
