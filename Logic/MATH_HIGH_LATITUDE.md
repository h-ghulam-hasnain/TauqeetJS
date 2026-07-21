# High Latitude Mathematics & Boundary Resolution

At extreme latitudes (generally above 48° and especially beyond the Arctic/Antarctic circles at 66.5°), traditional astronomical definitions of twilight break down. TauqeetJS includes a robust mathematical boundary resolver to detect and handle these edge cases without crashing or returning `NaN`.

---

## 1. The Astronomical Boundaries

### Continuous Twilight
Occurs when the sun sets below the horizon but does not dip low enough to reach the Fajr/Isha twilight angle (e.g., -18°). The sky remains in a state of twilight throughout the night.
- **Engine Logic:** The iterative root-finder detects that the minimum solar altitude during the night is mathematically greater than the target angle.

### Polar Day (Midnight Sun)
Occurs when the sun never sets below the geometric horizon (0°).
- **Engine Logic:** The root-finder detects that the solar altitude remains > 0° for a full 24-hour cycle. Sunrise and Sunset do not exist.

### Polar Night
Occurs when the sun never rises above the geometric horizon.
- **Engine Logic:** The root-finder detects that the solar altitude remains < 0° for a full 24-hour cycle. Sunrise, Sunset, and Dhuhr (sun at highest point) do not occur geometrically.

---

## 2. Fallback Strategies (The Resolution Engine)

When the engine detects one of the boundaries above, it intercepts the calculation and applies a mathematical fallback strategy. 

### `AngleBased` (Recommended for ~48° to 60°)
Computes the percentage of the night that *should* be dark based on the angle's proportion to the total night length.
- $T_{night} = T_{sunrise} - T_{sunset}$
- $Offset = T_{night} \times \frac{Angle}{60}$

### `MiddleOfNight`
Strictly divides the night duration by two. Fajr and Isha are symmetrically pinned to this exact middle point.

### `SeventhOfNight`
Splits the night duration into seven equal segments. Fajr begins at the last seventh of the night, and Isha begins at the end of the first seventh.
- $Offset = \frac{T_{night}}{7}$

### `NearestLatitude` (Required for > 66.5°)
When no sunrise/sunset exists (Polar boundaries), time-based offsets mathematically fail. The engine clones the time configurations from a stable fallback latitude (usually 45°) sharing the same longitude, preserving the 24-hour prayer cycle for inhabitants in polar zones.
