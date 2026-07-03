# V6 News Generator

Automated news extraction & content generation using **Blackbox CLI** as the LLM agent.

## What it does
- Fetches latest headlines from V6 Velugu (Telugu news)
- Uses Blackbox CLI to summarize and generate:
  - **Blog posts** (English, 200-300 words)
  - **LinkedIn posts** (English, 100-150 words with hashtags)
- Runs via GitHub Actions on schedule (6am/12pm/6pm UTC) or manually

## Pipeline
```
V6 Velugu → curl scrape → Blackbox CLI (LLM agent) → Blog Post + LinkedIn Post
```

## Project Structure
```
news-generator/
├── scripts/fetch-news.sh   # Main agent script
├── output/                  # Generated content artifacts
├── memory/processed.json    # Processing history (memory tool)
└── CLAUDE.md               # Agent instructions
.github/workflows/
└── news-generator.yml       # CI/CD automation
```

## Manual Run
```bash
echo "prompt with news data" | blackbox -p ""
```

## Memory & Skills
- `memory/` - Tracks processed items to avoid duplicates
- Blackbox CLI acts as the LLM agent for extraction + generation
