# GRADIENCE Web

React + TypeScript map-centric shell for the City Intelligence interface.

## Development

1. Start the API on port `8000`.
2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8000`.

## Data integrity

The UI always renders metric provenance (`real`, `derived`, `modeled`, `synthetic`, `unavailable`) and never presents unavailable metrics as observed values.
