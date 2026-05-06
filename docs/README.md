# HookScore Public Pages

This folder is a standalone static site for GitHub Pages. It is intentionally kept outside `apps/mobile`.

Expected production URLs:

```text
https://32penkin.github.io/hook-score/privacy/
https://32penkin.github.io/hook-score/account-deletion/
```

The workflow in `.github/workflows/deploy-docs.yml` publishes this folder with GitHub Pages. In the repository settings, configure Pages to use GitHub Actions.
