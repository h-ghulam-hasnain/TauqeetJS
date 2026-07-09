# Limitations of tauqeet-js

tauqeet-js is designed for practical Islamic astronomical calculations such as prayer times, lunar events, Hijri conversion, and Qibla direction. It uses high-precision internal models, but it is still scoped to Earth-bound observational use cases.

## Scope Limitations

### 1. Solar and lunar focus only
The library focuses on the Sun and Moon. It does not provide planetary ephemerides, satellite tracking, or star-catalog functionality.

### 2. Time range and model fidelity
The internal astronomical models are highly accurate for ordinary historical and near-future use cases, but they are not intended for geological timescales or long-range space navigation.

### 3. Observer environment
The calculations assume standard atmospheric conditions and a clear horizon. Local terrain, weather, and elevation can change the observed times noticeably.

### 4. Real-time Earth orientation
The solver does not fetch live IERS Earth-orientation data, so there may be small residual errors for absolute coordinate work.

### 5. Not a spacecraft navigation toolkit
The library is not suitable for deep-space navigation, orbital mechanics, or JPL-grade ephemeris work.

## Practical Guidance

For most app integrations, the default models are appropriate. For high-precision field use, users should still validate results against local observations and any official timetable source.
