# Seasonal Seiyuu agent guidance

## Start-of-task flow

Before making material changes:

1. Clarify the requested outcome, affected surface, constraints, and likely risk.
2. Inspect the repository state and read the relevant project instructions, specs, and existing `SKILL.md` files.
3. Reuse an applicable local or already-installed skill before looking for another one.
4. For specialized or non-trivial work, check whether a well-maintained external skill already covers the workflow. Search by user goal and stack, not just by a broad technology name.
5. Inspect promising candidates before using them. Evaluate task fit, framework compatibility, repository provenance/activity, popularity signals, audit status, and any scripts or external resources they invoke. Popularity is evidence of adoption, not proof of quality or safety.
6. Choose the smallest useful set of skills and MCP tools, state the choice briefly, then plan and execute the work.
7. Validate the result with the repository's relevant tests, browser checks, build checks, and documentation/spec updates.

### Discovery gate

Run external skill discovery for UI/UX, architecture, testing, deployment, security, integrations, migrations, or unfamiliar domains when an applicable local skill is not already available. For trivial edits, read-only questions, or tasks already covered by a known skill, skip the catalog search.

The preferred discovery/install tools are:

```bash
# Search the public catalog by objective or keyword
npx skills find "<task objective>"

# Inspect a repository's available skills without installing
npx skills add <owner>/<repo> --list

# Try a skill without adding it to the project
npx skills use <owner>/<repo> --skill <skill-name>

# Install a reviewed skill for Codex in this project
npx skills add <owner>/<repo> --skill <skill-name> --agent codex --yes
```

Use [skills.sh](https://skills.sh/) for catalog discovery and popularity/trending signals, and the [skills CLI](https://github.com/vercel-labs/skills) for searching, trial use, and installation. The public catalog is not an authoritative quality ranking. Review the skill source and `SKILL.md` before installation; do not install an arbitrary top result silently. Project-scoped skills belong under `.agents/skills/` and may affect the whole team, so summarize the candidate and get confirmation when installation materially changes repository or global state. After installing a new project skill, start a fresh Codex session so it is discovered reliably.

Skills provide reusable workflow instructions; MCP servers provide live information, authentication, and controlled actions. Use both when appropriate—for example, a UI skill for design and accessibility workflow plus Playwright MCP for browser inspection and validation.

The official skill model is documented in [OpenAI Docs](https://developers.openai.com/plugins/concepts/skills).

## Project-specific workflow

- Read [`openspec/config.yaml`](openspec/config.yaml) and the relevant spec before feature, architecture, security, data, or deployment work.
- Use OpenSpec proposals/specs/design/tasks when the change warrants them; keep requirements normative and scenario-based.
- Preserve the `/seiyuu` context path, API contracts, Tenrai rate limits, resumable refresh behavior, and API-key secrecy unless an approved change explicitly revises them.
- Keep upstream anime-data access behind provider-neutral types and configuration; honor valid `Retry-After` guidance for Tenrai 429 responses and do not add Tenrai credentials unless an approved change demonstrates they are needed.
- Frontend changes should include relevant Vitest coverage and Playwright smoke-test updates when user flows change.
- Keep changes scoped, run relevant validation, and report any skipped checks or newly required external setup.
