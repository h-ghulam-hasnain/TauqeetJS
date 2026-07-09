# Using tauqeet-js from a Browser CDN

tauqeet-js can be used directly in browser applications via modern ESM CDNs. The package is published as an ESM-first library and exposes subpath imports for tree-shakable module loading.

## Recommended CDN URLs

### esm.sh
- Main entry: `https://esm.sh/tauqeet-js@1.1.3`
- Subpath entry: `https://esm.sh/tauqeet-js@1.1.3/prayers`

### jsDelivr
- Main entry: `https://cdn.jsdelivr.net/npm/tauqeet-js@1.1.3/+esm`
- Subpath entry: `https://cdn.jsdelivr.net/npm/tauqeet-js@1.1.3/prayers/+esm`

## Example HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>tauqeet-js CDN Example</title>
  </head>
  <body>
    <script type="module">
      import {
        calculatePrayerTimes,
        getQiblaDirection,
        getMoonPhase,
        toHijri,
        HijriMethod,
      } from 'https://esm.sh/tauqeet-js@1.1.3';

      const prayerTimes = calculatePrayerTimes({
        lat: 51.5074,
        long: -0.1278,
        timeZone: 'Europe/London',
      });

      console.log(prayerTimes.fajr.local);
    </script>
  </body>
</html>
```

## Subpath Example

```html
<script type="module">
  import * as prayers from 'https://esm.sh/tauqeet-js@1.1.3/prayers';
  console.log(typeof prayers.calculatePrayerTimes);
</script>
```

## Notes

- `esm.sh` is the most reliable ESM CDN for this package.
- `jsDelivr` works well for the published ESM build.
- For production apps that need low startup overhead, prefer subpath imports and cache the computed results where appropriate.
