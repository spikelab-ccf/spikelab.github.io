# Lab Website Template

A zero-dependency, JSON-driven static website template for research labs.

No framework. No build step. Edit one JSON file to update all content.

## Quick Start

1. Run a local server:

```bash
python3 -m http.server 8000
```

2. Open `http://localhost:8000/`

3. Edit `contents.json` to update your site content.

## How It Works

All site content lives in a single file: `contents.json`. The browser loads `index.html` and vanilla JS renders everything client-side from that file — no build step required.

```
index.html → js/render.js → contents.json
```

## `contents.json` Structure

```json
{
  "site": { "head", "meta", "hero", "main", "social", "footer" },
  "about": { "title", "body" },
  "research": { "title", "items[{image, name, description, alt}]" },
  "people": { "title", "groups[{groupTitle, members[{name, role, photo, email, description, links}]}]" },
  "publications": { "title", "groups[{year, items[{text, url}]}]" },
  "photos": { "title", "items[{image, caption, alt}]" },
  "contact": { "title", "body", "piEmail" }
}
```

Member `links` supports: `linkedin`, `scholar`, `github`, `x`, `website`

## Project Structure

```
index.html          # entry point
contents.json       # all site content
js/
  render.js         # core rendering engine
  ui.js             # scroll behaviors
css/
  styles.css        # all styling
assets/
  icons/            # social and member link icons
  branding/         # favicon, logos
  hero/             # hero banner
  sections/         # people photos, research art, gallery images
```

## Markdown Support

`render.js` includes a lightweight markdown parser. Supported syntax:

- Inline: `**bold**`, `*italic*`, `` `code` ``, `[text](url)`
- Block: `# Heading`, `- bullet list`, `1. ordered list`

## License

MIT License. See `LICENSE`.
