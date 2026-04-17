# pipeline-core

Public MCP server package for SDLC pipeline orchestration.

## Includes

- server/ (MCP runtime and tools)
- content/ (agents, skills, templates, project/platform overlays)
- scripts/publish-public.sh (npmjs public release helper)

## Publish

1. npm login
2. npm run publish:public

## Notes

This repo is designed to be consumed by the VS Code extension via npx package install.
