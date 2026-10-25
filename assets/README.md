# Owner media

Put approved original/licensed project assets into subdirectories such as athr/.
Register relative public URLs in media.json. Empty catalog intentionally uses labelled
generated concept visuals; no owner footage is invented.

```json
{
  "athr": {
    "poster": "/assets/athr/poster.webp",
    "video": "/assets/athr/reel.mp4",
    "credit": "Owner supplied; source and usage terms recorded in project docs"
  }
}
```

The example is not active. Supported posters: PNG/JPG/WebP/AVIF. Video: MP4/WebM/OGV
(actual codec support depends on browser). Start with approximately 16:9 posters and
short compressed video loops. Only the selected/nearby project's registered video is
played; it pauses on About, leaving proximity and hidden tabs. Audio defaults muted.

Do not put secrets or private documents here: these files are served by the local site.
Run `pnpm run check:media`, then build and test the actual file in Edge.
