# pipeline-core

Public MCP server package for SDLC pipeline orchestration.

## Includes

- server/ (MCP runtime and tools)
- skills/, agents/, templates/ (generic SDLC content)
- platforms/<name>/ (platform-specific overlays, e.g. mobile)
- scripts/publish.sh (auto-bump + build + publish to npmjs)

## Publish

1. npm login
2. ./scripts/publish.sh

## Notes

This repo is designed to be consumed by the VS Code extension via npx package install.
