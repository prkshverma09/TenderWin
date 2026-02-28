# Word Add-in Manifest & Word on the web

## Manifest

**`manifest.xml`** is the Office Add-in manifest (traditional XML) for sideloading TenderWin into Word. It targets Word only (`Host Name="Document"`).

- **Local / Windows / Mac:** You can set `SourceLocation` to `https://localhost:3050/` if your environment allows it.
- **Word on the web:** Word on the web requires **HTTPS**. Use ngrok and point `SourceLocation` to your ngrok URL (e.g. `https://abc123.ngrok-free.app/`).

## Quick setup for Word on the web

1. Start the add-in: from repo root, `npm run dev --workspace=@tenderwin/word-addin`.
2. In another terminal, expose it over HTTPS: from repo root, **`npm run ngrok:addin`** (or `npx ngrok http 3050`). Copy the **HTTPS** URL.
3. Edit **`manifest.xml`** and set `<SourceLocation DefaultValue="https://YOUR-NGROK-URL/" />` (e.g. `https://abc123.ngrok-free.app/`). Save.
4. Go to [office.com](https://office.com), sign in with a free Microsoft account, open **Word**, create a document.
5. **Home → Add-ins → More Settings → Upload My Add-in** → choose **`apps/word-addin/manifest.xml`** → Upload.
6. Open the TenderWin task pane from **Home → Add-ins** and test **Draft Answers** (and optionally **Ping Expert**).

If you restart ngrok, the URL changes; update the manifest and re-upload it in Word.

Full steps and troubleshooting: [MANUAL_TESTING_AND_DEMO.md](../../MANUAL_TESTING_AND_DEMO.md) → “Test in Word on the web”.
