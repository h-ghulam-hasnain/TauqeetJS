# Using `tauqeet-js` from a Browser CDN

This package is built as a pure ESM library and can be used directly in browsers without installation.

## Recommended CDN URLs

### esm.sh
- Main import: `https://esm.sh/tauqeet-js@1.1.2`
- Subpath import: `https://esm.sh/tauqeet-js@1.1.2/prayers`

### jsDelivr
- Main import: `https://cdn.jsdelivr.net/npm/tauqeet-js@1.1.2/+esm`
- Subpath import: `https://cdn.jsdelivr.net/npm/tauqeet-js@1.1.2/prayers/+esm`

> Note: `Skypack` currently returns 404 for `tauqeet-js`, so it is not reliable until the package is indexed there.

## Example HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>TauqeetJS CDN Example</title>
</head>
<body>
  <script type="module">
    import {
      calculatePrayerTimes,
      getQiblaDirection,
      getMoonPhase,
      getMoonAge,
      toHijri,
      HijriMethod
    } from 'https://esm.sh/tauqeet-js@1.1.2';

    console.log('calculatePrayerTimes', calculatePrayerTimes);
    console.log('getQiblaDirection', getQiblaDirection);
    console.log('getMoonPhase', getMoonPhase);
    console.log('toHijri', toHijri);
  </script>
</body>
</html>
```

## Subpath example

```html
<script type="module">
  import * as prayers from 'https://esm.sh/tauqeet-js@1.1.2/prayers';
  console.log(prayers.calculatePrayerTimes);
</script>
```

## Notes

- `esm.sh` is the best-supported ESM CDN for this package today.
- `jsDelivr` works for the bundled `dist` ESM build with `+esm`.
- `Skypack` is currently unavailable for this package and may require waiting for indexing or requesting package support.
