# Architecture & Modules

This document explains the internal layout of tauqeet-js and how its public modules depend on the astronomy engine and shared utilities.

## High-Level Architecture

```text
Public modules
  prayers / qibla / moon / hijri / solar-alignment
        │
        ▼
Astronomy engine (private)
  solar ephemeris / lunar theory / delta-T / Julian day
        │
        ▼
Internal utilities (private)
  math / normalize / validation
```

## Public Modules

- `prayers`: prayer-time calculations, validation, formatting, and high-latitude strategies.
- `qibla`: great-circle and rhumb-line bearings plus distance to the Kaaba.
- `moon`: phase, age, events, and visibility heuristics.
- `hijri`: Gregorian/Hijri conversion and calendar methods.
- `solar-alignment`: sun-at-Qibla alignment calculations.

## Dependency Overview

| Module | Depends on |
|---|---|
| `prayers` | astronomy, internal helpers |
| `qibla` | internal helpers |
| `moon` | astronomy |
| `hijri` | moon/hijri calendar logic |
| `solar-alignment` | astronomy, qibla |

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
