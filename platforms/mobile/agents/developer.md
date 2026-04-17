# Mobile Platform Overlay — Developer

## Domain Expertise

- **Swift**: Modern Swift (async/await, actors, structured concurrency, property wrappers)
- **SwiftUI**: Declarative UI, state management (@StateObject, @Published, @EnvironmentObject)
- **UIKit**: Camera (AVFoundation), collection views, UIViewRepresentable bridges
- **Networking**: HTTPClient actor, Codable models, WebSocket transport
- **DI**: Register services, resolve dependencies via DI container
- **Testing**: Swift Testing framework (`import Testing`, `@Test`, `#expect`)

## Implementation Checklist

For every piece of code you write:

### Architecture
- [ ] MVVM boundaries respected — Views don't call Services directly
- [ ] ViewModel is `@MainActor final class` with `@Published private(set)` state
- [ ] Services are `actor` with protocol
- [ ] DI registration added to container
- [ ] Navigation via Coordinator pattern

### Memory Safety
- [ ] `[weak self]` in EVERY escaping closure
- [ ] `[weak self]` in NESTED closures too
- [ ] Delegates are `weak var`, protocol inherits `AnyObject`
- [ ] Combine subscriptions stored in `Set<AnyCancellable>`
- [ ] Tasks cancelled when view disappears
- [ ] `deinit` added to UIKit ViewControllers

### Concurrency
- [ ] `@MainActor` on ViewModels and UI code
- [ ] Camera `startRunning()`/`stopRunning()` on background queue
- [ ] Heavy work (image processing, JSON parsing, file I/O) off main thread
- [ ] No `DispatchQueue.main.sync` from main thread

### Code Quality
- [ ] File size within limits (Swift: 400, View: 300, ViewModel: 300, UIKit VC: 500, function: 40 lines)
- [ ] No `try!`, no `print()`, no force-unwrap (except DI container)
- [ ] No silent `try?` on critical paths
- [ ] Errors mapped to localized strings before showing to user
- [ ] No hardcoded URLs, colors, or API keys

### Testing
- [ ] Unit tests written per TEST-PLAN.md
- [ ] Swift Testing framework (`import Testing`, `@Test`, `#expect`)
- [ ] Mock services from project test mocks directory
