# Gemini 3 Pro Image Studio

A professional UI for the Gemini 3 Pro Image API with real-time cost estimation, reference uploads, and prompt management.

![Gemini 3 Pro Image Studio](https://img.shields.io/badge/Gemini%203%20Pro-Image%20Studio-violet?style=for-the-badge)

## Features

- 🎨 **Image Generation** - Generate images using Gemini 3 Pro Image API
- 💰 **Real-time Cost Estimation** - See costs before you generate
- 📷 **Reference Image Uploads** - Use style, content, or composition references
- 💾 **Save Prompts** - Save and organize your favorite prompts
- ⚙️ **Customizable Settings** - Resolution, aspect ratio, thinking level, and more
- 🌙 **Dark/Light Mode** - Beautiful UI in both themes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Pricing (Based on Official Gemini 3 Pro Pricing)

| Type | Standard (≤200k tokens) | Long Context (>200k tokens) |
|------|-------------------------|----------------------------|
| Input | $2.00 / 1M tokens | $4.00 / 1M tokens |
| Output | $12.00 / 1M tokens | $18.00 / 1M tokens |

### Image Output Pricing
| Resolution | Tokens | Price per Image |
|-----------|--------|-----------------|
| 1K (1024×1024) | 1,290 | $0.039 |
| 2K (2048×2048) | 1,120 | $0.134 |
| 4K (4096×4096) | 2,000 | $0.240 |

## Quick Start

### Deploy to Vercel (Recommended)

1. **Clone or download this project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run locally (optional):**
   ```bash
   npm run dev
   ```

4. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

   Or push to GitHub and connect to Vercel for automatic deployments.

### Deploy via GitHub

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will auto-detect Vite and deploy

## Configuration

### API Key

1. Get your API key from [Google AI Studio](https://ai.google.dev)
2. Click "Set API Key" in the UI
3. Enter your key (stored locally in browser)

### Settings

| Setting | Description |
|---------|-------------|
| **Resolution** | Output image size (1K, 2K, or 4K) |
| **Aspect Ratio** | Image proportions (1:1, 16:9, 9:16, etc.) |
| **Thinking Level** | Model reasoning depth (Off, Low, Medium, High) |
| **Media Resolution** | Quality for reference image processing |
| **Number of Images** | Generate 1-4 images per request |
| **Guidance Scale** | How closely to follow the prompt |
| **Seed** | For reproducible results |

## Project Structure

```
gemini-image-ui/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    └── index.css
```

## Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling
- **Lucide React** - Icons

## API Integration Notes

To connect to the actual Gemini 3 Pro Image API:

1. The API endpoint is: `https://generativelanguage.googleapis.com/v1/models/gemini-3-pro-preview:generateContent`

2. For image generation, use the image generation specific model when available

3. Reference images should be sent as base64-encoded data

4. Example API call structure:
```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 8192,
      }
    })
  }
);
```

## License

MIT License - feel free to use and modify as needed.

## Credits

Built with ❤️ for the Gemini 3 Pro Image API community.
