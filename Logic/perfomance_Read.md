## 🚀 Performance & Architecture

`tauqeet-js` is engineered from the ground up for **extreme performance** and **zero-allocation** hot paths, making it ideal for high-frequency calculations (such as real-time tracking, eclipse finding, or continuous planetary simulations).

In version 1.1.5, the underlying astronomical computation engine (including the highly accurate ELP-2000 and VSOP87 theories) underwent a massive architectural rewrite to prioritize V8 engine optimizations.

### Why is it so fast?

- **Flat `Float64Array` Memory Layout**: Rather than parsing massive JSON objects with millions of properties, the engine inflates compressed Base64 strings into contiguous binary buffers at runtime. Calculation loops process 11-element strides sequentially, completely eliminating object property lookups and maximizing CPU cache hits.
- **Zero-Allocation Hot Paths**: The inner `for`-loops are stripped of memory allocations. During millions of iterations, the Garbage Collector (GC) remains entirely idle, preventing micro-stutters and drastically reducing latency tail-ends.
- **Horner's Method Integration**: Complex Julian century ($T$) polynomials are solved using an $O(n)$ algorithmic accumulation (Horner's Method) instead of iterative $O(n^2)$ recursive `Math.pow()` chains.
- **Aggressive Tree-Shaking**: The final bundled architecture has been slimmed down to 24 pure ESM modules, meaning you only ever load the exact logic you import.

### 📊 Before vs. After (v1.1.4 ➡️ v1.1.5)

| Metric | Legacy Engine | **TauqeetJS Optimized** | Improvement |
| :--- | :--- | :--- | :--- |
| **NPM Unpacked Size** | 10.6 MB | **5.6 MB** | `-47%` 📉 |
| **NPM Packed Tarball** | ~3.5 MB | **1.4 MB** | `-60%` 📉 |
| **Total Files Shipped** | 435 files | **24 files** | `-94%` 📉 |
| **Memory Allocation (10k ops)** | High (Constant GC Pauses) | **Negligible (Zero-Alloc Hot paths)** | 🏆 |
| **Performance (Ops/sec)** | ~12k ops/sec | **~85k+ ops/sec** | `~7x Faster` ⚡ |

*(Note: Exact ops/sec may vary based on CPU hardware, benchmarked via Node `performance.now()` utilizing V8 TurboFan)*
