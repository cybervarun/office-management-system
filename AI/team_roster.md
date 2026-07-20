# AI Team Roster

Manager/Orchestrator: Oversees assignments, token budgets, and consolidation.
Frontend Agent: Handles React/Vite frontend tasks; receives minimal context (component paths, small snippets).
Backend Agent: Handles Node/Express backend tasks; receives route/controller/service snippets and schema references.
DevOps/Infra Agent: Handles scripts, package.json, and environment configuration tasks.
QA Agent: Creates and runs tests for backend and frontend; focuses on API contracts and smoke tests.
Docs Agent: Maintains `/AI` docs, changelog, and token efficiency logs; enforces concise updates.

Guideline: Pass only required file paths or tiny code slices to sub-agents to minimize tokens.

Agent files location: `AI/agents/` contains concrete `.agent.md` files for each sub-agent.

Created agents:
- `AI/agents/frontend.agent.md`
- `AI/agents/backend.agent.md`
- `AI/agents/devops.agent.md`
- `AI/agents/qa.agent.md`
- `AI/agents/docs.agent.md`
