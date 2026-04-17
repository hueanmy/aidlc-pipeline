# SDLC Pipeline — Make targets
# Customize paths and commands for your project

EPICS_DIR := docs/sdlc/epics

## Epic management
epic: ## Scaffold a new epic (make epic KEY=XXX-1234)
	@mkdir -p $(EPICS_DIR)/$(KEY)
	@for f in EPIC.md PRD.md TECH-DESIGN.md TEST-PLAN.md UAT-SCRIPT.md APPROVAL.md DOC-REVERSE-SYNC.md; do \
		cp docs/sdlc/templates/$$(echo $$f | sed 's/EPIC.md/EPIC-TEMPLATE.md/;s/DOC-REVERSE-SYNC.md/DOC-REVERSE-SYNC-TEMPLATE.md/') $(EPICS_DIR)/$(KEY)/$$f 2>/dev/null || touch $(EPICS_DIR)/$(KEY)/$$f; \
	done
	@mv $(EPICS_DIR)/$(KEY)/EPIC.md $(EPICS_DIR)/$(KEY)/$(KEY).md 2>/dev/null || true
	@echo "Epic $(KEY) created at $(EPICS_DIR)/$(KEY)/"

## Quality
check: ## Lint + test (pre-PR)
	@echo "Running lint and tests..."
	# TODO: Add your lint and test commands

## Release
release-checklist: ## Create release checklist (make release-checklist VER=1.0.0)
	@echo "Creating release checklist for v$(VER)..."
	# TODO: Add your release checklist logic

## Publish
publish: ## Auto-bump + build + commit + publish to CodeArtifact
	@./scripts/publish.sh

.PHONY: epic check release-checklist publish
