# Taskewr — Claude bootstrap

## Memory
- Memory files live at `/Users/razva/Code/taskewr/.claude/memory/`
- Read `MEMORY.md` there first, then the files it points to, before doing anything
- To save a session: write/update memory files, then `cd .claude && git add . && git commit -m "..." && git push`

## Context repo
- `.claude/` inside the project root is its own git repo: `https://github.com/Razva/taskewr-claude`
- To set up on a new machine: `git clone https://github.com/Razva/taskewr-claude.git .claude` from project root

## Dev startup
1. Start Docker Desktop
2. `docker compose -f docker-compose.dev.yml --env-file .env.dev up -d` — starts the DB
3. `npm run dev` (use `dangerouslyDisableSandbox: true`) — starts Next.js at http://localhost:3000

## Key rules
- Always use `dangerouslyDisableSandbox: true` for Bash commands that need npm/node (nvm not on sandboxed PATH)
- Never push to GitHub without explicit user approval
- Never add `Co-Authored-By` or any Claude signature to commits
