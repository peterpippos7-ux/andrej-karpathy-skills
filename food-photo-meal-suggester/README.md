# Food Photo Meal Suggester

A small web app: upload a photo of food (fridge contents, a grocery bag, ingredients on the counter), and Claude identifies what's there and suggests meals you can make from it.

## How it works

- **Backend** (`server.js`): Express server with a single `POST /analyze` endpoint. Accepts an image upload, sends it to the Claude API with vision, and returns a structured JSON response (ingredients + meal ideas) using `output_config.format` with a JSON schema.
- **Frontend** (`public/index.html`): Single-page UI with drag-and-drop upload and a preview before sending.
- **Model**: `claude-opus-4-7`.

## Running it

Requires Node 18+.

```bash
cd food-photo-meal-suggester
npm install
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

Then open <http://localhost:3000>.

## Project layout

```
food-photo-meal-suggester/
├── package.json
├── server.js              # Express + Anthropic SDK
└── public/
    └── index.html         # UI (vanilla HTML/CSS/JS)
```
