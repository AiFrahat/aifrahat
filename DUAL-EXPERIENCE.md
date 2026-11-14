# Dual Experience validation and release

Source: GitHub AiFrahat/aifrahat main 68f46e6f85e97da3f75927b8767817b3d9545dee.
Classic source: original AiFRAHAT-RELEASE.zip, SHA256 ac0fc0f2fd698d79f89335deff28686f6ce24bdbaaf34fa1162d182c9f8668d3.

The cinematic entry adds two dark/gold links. Its existing bundles and media are unchanged. Classic retains its original assets and adds an in-flow bilingual return link on ten pages.

Run npm test. Run node tests/validate-dual-release.mjs in a Git checkout for reference and baseline validation. Run node tests/e2e-dual-experience.mjs with Playwright installed, or set PLAYWRIGHT_MODULE to its index.mjs and PLAYWRIGHT_BROWSERS_PATH to the browser installation. The E2E runner starts its own loopback static server. E2E_OUTPUT selects the evidence folder.

Browser checks exercise ten classic pages in Arabic/English, light/dark, desktop/tablet/mobile, real settings controls, directory redirects, keyboard navigation, return links, images and cinematic WebGL readiness, About, Works, language, day/night, and both Classic links. Hidden carousel images are explicitly loaded during image validation. Settings inside the mobile menu are opened before use. Focus-visible is checked after keyboard input.

Limits: Chromium only, software WebGL; no Safari/Firefox certification. The static server emulates directory redirects, not production hosting. External contact links are not submitted. Google Fonts remains an external dependency; one initial certificate failure was observed, with no TLS bypass applied. Original cinematic bundler source is absent, so no reproducible rebuild can be claimed. Existing hosting security-header gaps and public-only hosting access are documented in the supplied audit. Git comparison respects checkout newline conversion.

Production remains on main. This branch is for review only; do not merge or deploy without owner authorization. CNAME and DNS are unchanged. Restore the supplied baseline ZIP to recover the original static site; the Git bundle preserves repository history.
