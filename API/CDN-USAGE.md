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
      import { calculatePrayerTimes } from 'https://esm.sh/tauqeet-js@1.1.3/prayers';
      import { getQiblaDirection } from 'https://esm.sh/tauqeet-js@1.1.3/qibla';

      const prayerTimes = calculatePrayerTimes({
        lat: 51.5074,
        long: -0.1278,
        timeZone: 'Europe/London',
      });

      console.log('Fajr:', prayerTimes.fajr.local);

      const qibla = getQiblaDirection({ latitude: 51.5074, longitude: -0.1278 });
      console.log('Qibla:', qibla.bearing);
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
- For production apps demanding uncompromising astronomical accuracy, always prefer subpath imports (e.g., `/prayers` or `/qibla`) to strictly limit payload size and take full advantage of tree-shaking.
