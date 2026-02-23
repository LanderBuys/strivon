# Assets Directory

This directory uses a single image for all Expo assets:

- **`logoStrivon.png`** – Used for app icon, splash screen, Android adaptive icon, web favicon, and notification icon.

Place `logoStrivon.png` here before building. For best results use **1024×1024px** (Expo will resize for each use). Square works best for icon and adaptive icon.

For CI or placeholder-only builds, run `npm run create-assets` in `apps/mobile` to generate a minimal placeholder `logoStrivon.png`. Replace it with your real logo before production.

