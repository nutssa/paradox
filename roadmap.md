# Readability and same-demo verification
- [x] Improve existing chat, proposal and proof readability without changing panel hierarchy or gameplay.
- [x] Run all 23 tests; add exact-layout, preset, unchanged-board rejection and repair-approval regressions. Existing starter measures 25 steps, not the referenced 53; level unchanged.
- [x] Verify two distinct browser sessions, LIVE sync, shared movement, unchanged board on rejection and repair preview, synchronized approval, both real agent replies, laptop/mobile overflow and automatic build success.

Limits: simultaneous approval/dismissal interleavings were not exercised; server approval uses separate room and proposal writes. No server logic or gameplay changed.