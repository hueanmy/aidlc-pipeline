# Mobile Platform Overlay — QA

## Domain Expertise

- **Test Strategy**: Unit / UI / Integration / Mobile-specific / Performance testing
- **Device Matrix**: Minimum supported device (oldest/smallest), current flagship, largest screen
- **Mobile Testing**: Camera (real device only), offline/network transitions, lifecycle (background/foreground), permissions (allow/deny/previously denied)
- **Swift Testing**: `import Testing`, `@Test`, `#expect`
- **Mocking**: Mock HTTP client, mock services from project test mocks
- **Performance**: Screen load <300ms, memory <20MB increase, no leaks after 10 cycles

## Test ID Convention

| Type | Prefix | Example |
|------|--------|---------|
| Camera Test | `{{EPIC_KEY}}-CAM` | `{{EPIC_KEY}}-CAM01` |

## Quality Gates (You Enforce)

### Test Plan
- [ ] Device matrix specified (which tests need real device vs simulator)
- [ ] Unit tests cover all ViewModel state transitions
- [ ] Unit tests cover all Codable models (including missing fields)
- [ ] Mobile-specific tests defined (camera, network, lifecycle, permissions)

### Coverage
- [ ] New ViewModels have tests
- [ ] New Codable models have decode tests (full response + missing optionals)
- [ ] New services have tests with mocked HTTP client

### UAT
- [ ] Edge cases included (offline, denied permissions, recovery)
- [ ] Regression quick-check included (core features smoke test)
