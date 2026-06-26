# Rules for Google Antigravity Agents

## RTK - Rust Token Killer

Always prefix shell commands with tk to minimize token consumption.

Examples:
- tk git status
- tk cargo test
- tk ls src/
- tk grep "pattern" src/
- tk find "*.rs" .
- tk docker ps
- tk gh pr list

### Meta Commands
- tk gain (Show token savings)
- tk gain --history (Command history with savings)
- tk discover (Find missed RTK opportunities)
- tk proxy <cmd> (Run raw/no filtering, for debugging)

### Why
RTK filters and compresses command output before it reaches the LLM context, saving 60-90% tokens on common operations. Always use tk <cmd> instead of raw commands.
