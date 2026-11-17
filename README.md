<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1El-Mh5HthEglzSizAw8o79nL0gYI5wWN

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and add your own keys:
   - `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey)
   - `MAPBOX_ACCESS_TOKEN` (a public `pk.` token) from [Mapbox](https://account.mapbox.com/access-tokens/)
3. Run the app:
   `npm run dev`

`.env.local` is listed in `.gitignore`. Do not commit it, `node_modules`, `dist`, or the `chroma` folder.
