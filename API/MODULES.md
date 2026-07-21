# Architecture & Modules

This document explains the internal layout of tauqeet-js and how its public modules depend on the astronomy engine and shared utilities.

## High-Level Architecture

```text
Public modules
  prayers / qibla
        │
        ▼
Astronomy engine (private)
  solar ephemeris / VSOP87 / Julian day
        │
        ▼
Internal utilities (private)
  math / validation
```

## Public Modules

- `prayers`: high-precision prayer-time calculations, dynamic atmospheric corrections, boundary validation, formatting, and high-latitude management.
- `qibla`: great-circle and rhumb-line bearings plus highly accurate distances to the Kaaba.

## Dependency Overview

| Module | Depends on |
|---|---|
| `prayers` | VSOP87 astronomy, internal validation |
| `qibla` | internal math and validation |

## Tree-Shaking

The package uses named exports and subpath exports, so bundlers can include only the parts required by the application.

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';
import { getQiblaDirection } from 'tauqeet-js/qibla';
```

## Design Notes

- The astronomy layer is private and not part of the public API contract.
- Public functions are typed and documented for direct use from Node.js or browser applications.
- The library is intentionally modular so that larger apps can import only the relevant feature set.
