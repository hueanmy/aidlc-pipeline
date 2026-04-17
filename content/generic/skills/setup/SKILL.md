---
name: setup
description: Set up the project on a new machine. Installs toolchain, resolves dependencies, and verifies build + tests. Stack-neutral — adapt commands to the project's stack in CLAUDE.md.
---

# Project Setup

Run all steps sequentially. Stop and report if any step fails — do not proceed past a failure.

## Step 1: Verify System Requirements

Check each, adapted to the stack in play. `CLAUDE.md` defines the exact versions.

| Requirement | Example check |
|-------------|---------------|
| OS / architecture | `uname -a`, `sw_vers`, `systeminfo` |
| Editor / IDE (if needed for simulators, debug) | Xcode / Android Studio / IntelliJ / VSCode |
| Language runtime(s) | `node -v`, `python --version`, `go version`, `java -version`, `swift --version`, `rustc --version` |
| Package manager(s) | `npm -v`, `pnpm -v`, `yarn -v`, `bun -v`, `pip --version`, `cargo --version`, `pod --version`, `gradle -v` |
| Build / task runner | `make -v`, project CLI (`./gradlew`, `xcodebuild`, etc.) |
| Container runtime (if used) | `docker --version`, `podman --version` |

**If missing**: point the user to the official install source. Never install things for them without asking.

## Step 2: Install CLI Tools

Install the linters, formatters, and auxiliary CLIs the project depends on. Examples:

- Linters / formatters: `eslint`, `prettier`, `ruff`, `black`, `golangci-lint`, `swiftlint`, `ktlint`, `clippy`
- Type checkers: `tsc`, `mypy`, `pyright`
- Mobile: `fastlane`, `pod`, `bundle`, platform SDK command-line tools
- Desktop signing: `codesign` (macOS), `signtool` (Windows)
- Infra: `aws` / `gcloud` / `az` CLIs, `terraform`, `kubectl` — only if the project uses them

After install:
```bash
{{VERIFY_TOOLS_COMMAND}}
```

## Step 3: Set Up Language Runtime (managed version)

If the project pins a runtime version (via `.nvmrc` / `.tool-versions` / `.python-version` / `rust-toolchain.toml` / etc.):

```bash
{{SETUP_LANGUAGE_RUNTIME_COMMAND}}
{{VERIFY_LANGUAGE_RUNTIME_COMMAND}}
```

Remind the user to add any version-manager init (`nvm`, `mise`, `asdf`, `rbenv`, `pyenv`) to their shell profile if not already there.

## Step 4: Install Project Dependencies

Use the project's package manager(s):

```bash
{{INSTALL_DEPENDENCIES_COMMAND}}
```

Verify:
```bash
{{VERIFY_DEPENDENCIES_COMMAND}}
```

## Step 5: Resolve Transitive / Platform Dependencies

- **iOS / React Native iOS**: `pod install` in `ios/`
- **Android / React Native Android**: `./gradlew assembleDebug` (first-run warm)
- **Rust / Cargo**: `cargo fetch`
- **Go**: `go mod download`
- **Python with lockfile**: `pip install -r requirements.lock` or `uv sync` / `poetry install`
- **Electron**: `electron-rebuild` for native modules if used

Skip the ones that don't apply.

## Step 6: Set Up Secrets / Env Vars

- Check for `.env.example` / `config.example.*` and copy to the expected runtime name
- List which secrets the user must provide (never commit, never print)
- Point at the project's secret store (1Password, Doppler, Vault, AWS Secrets Manager, etc.) if used

## Step 7: Verify Build

```bash
{{BUILD_COMMAND}}
```

Must see a successful build output. If it fails, show the error verbatim; don't try to auto-fix.

## Step 8: Verify Tests

```bash
{{TEST_COMMAND}}
```

Must see a successful test output. Tests that require real hardware / live services / specific environments may be marked as skipped in local setup — note those.

## Step 9: Output Summary

```markdown
## Setup Complete

| Step | Tool / Dependency | Status |
|------|-------------------|--------|
| 1 | OS / arch | OK / FAIL |
| 2 | IDE / editor (if required) | OK / FAIL |
| 3 | Language runtime(s) | OK / FAIL |
| 4 | Package manager(s) | OK / FAIL |
| 5 | Linters / formatters | OK / FAIL |
| 6 | Build tool | OK / FAIL |
| 7 | Dependencies | OK / FAIL |
| 8 | Secrets / env | OK / FAIL (skipped if none needed) |
| 9 | Build | OK / FAIL |
| 10 | Tests | OK / FAIL |

### Project Info
- Name: {{PROJECT_NAME}}
- Default branch: {{DEFAULT_BRANCH}}
- Stack: {{TECH_STACK}}

### Useful commands
- `make build`   — Build the project
- `make test`    — Run tests
- `make lint`    — Run linters
- `make check`   — Lint + test (pre-PR)
- `make help`    — Show all targets
(If the project doesn't use Make, list its equivalents.)
```

## If Any Step Fails

| Error | Fix |
|-------|-----|
| Runtime missing | Install via version manager or official installer |
| Package install fails | Check network / proxy; clear package-manager cache; retry |
| Native module build fails | Check compiler toolchain (Xcode CLT on macOS, build-tools on Windows, `build-essential` on Linux) |
| Build fails | Check IDE / SDK versions; clean build artifacts |
| Tests fail on hardware / live-service features | Those may be expected to fail locally — mark and continue if the project allows |
| Secrets missing | Point user at the project's secret source; do NOT proceed without them if the build depends on them |

Do NOT proceed past a failure. Show the error and suggest the fix.
