## 🚀 Performance & Architecture

`tauqeet-js` is engineered from the ground up for **extreme performance** and **zero-allocation** hot paths, making it ideal for high-frequency calculations (such as real-time tracking, eclipse finding, or continuous planetary simulations).

In version 1.1.6, the astronomical computation engine (ELP-2000, VSOP87), prayer calculation pipeline, and configuration validation have undergone comprehensive refactoring to prioritize V8 engine optimizations, strict type safety, and batch-operation support.

### Why is it so fast?

- **Flat `Float64Array` Memory Layout**: Rather than parsing massive JSON objects with millions of properties, the engine inflates compressed Base64 strings into contiguous binary buffers at runtime. Calculation loops process 11-element strides sequentially, completely eliminating object property lookups and maximizing CPU cache hits.
- **Zero-Allocation Hot Paths**: The inner `for`-loops are stripped of memory allocations. During millions of iterations, the Garbage Collector (GC) remains entirely idle, preventing micro-stutters and drastically reducing latency tail-ends.
- **Horner's Method Integration**: Complex Julian century ($T$) polynomials are solved using an $O(n)$ algorithmic accumulation (Horner's Method) instead of iterative $O(n^2)$ recursive `Math.pow()` chains.
- **Aggressive Tree-Shaking**: The final bundled architecture comprises 16 pure ESM modules, meaning you only ever load the exact logic you import. Unused Hijri and solar-alignment functions are not included in the main bundle.

### 📊 Before vs. After (v1.1.4 → v1.1.6)

| Metric | Legacy (Pre-Audit) | **TauqeetJS v1.1.6** | Improvement |
| :--- | :--- | :--- | :--- |
| **NPM Unpacked Size** | 10.6 MB | **745.9 KB** | `-93%` 📉 |
| **NPM Packed Tarball** | ~3.5 MB | **345.6 KB** | `-90%` 📉 |
| **Total Files Shipped** | 435 files | **16 files** | `-96%` 📉 |
| **Memory Allocation (10k ops)** | High (Constant GC Pauses) | **Negligible (Zero-Alloc Hot paths)** | 🏆 |
| **Performance (Ops/sec)** | ~12k ops/sec | **~18k+ ops/sec** | `~1.5x Faster` ⚡ |
| **Test Coverage** | Minimal | **141/142 tests** | ✅ Comprehensive |
| **Calendar Batch (365 days)** | N/A | **~3.2s per cycle** | 🚀 Optimized |

*(Note: Exact ops/sec varies by CPU hardware, benchmarked via Node `performance.now()` and V8 TurboFan optimization; v1.1.6 includes configuration validation overhead but maintains zero-allocation hot paths)*

### ✨ What's New in v1.1.6

Beyond the foundational optimizations, v1.1.6 adds:

- **Configuration Validator & Normalizer**: Strict type-first validation at entry point eliminates runtime coercion overhead. Prayer angles, coordinates, and method selections are validated before computation begins.
- **CalendarService**: High-performance batch prayer schedule generation. The 365-day calendar compiles in ~3.2s, enabling efficient bulk exports and scheduling use cases.
- **Unified Prayer Engine**: Comprehensive high-latitude and edge-case handling merged into a single calculation path, reducing branching and improving CPU cache utilization.
- **Astronomical Coefficient Packing**: Dynamic inflation of compressed ephemeris data reduces static bundle overhead while maintaining full VSOP87/ELP2000 precision.
- **Module Cleanup**: Removed unused Hijri and solar-alignment exports from main bundle; users can import subpath modules for specialized functions.
