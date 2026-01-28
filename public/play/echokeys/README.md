# 🎹 EchoKeys

**A lightweight, browser-based musical memory game**  
Part of the NoteLoop Series by Open Loop Apps

## Quick Start

1. **Play Now:** Open `index.html` in any modern browser
2. **Deploy:** Upload all files to your web host
3. **That's it!** No build step, no dependencies, no installation required.

## Files

- `index.html` - Main game page (2KB)
- `app.js` - Game logic and audio (14KB)
- `style.css` - Responsive styling (7KB)
- `TEST_REPORT.md` - Comprehensive test documentation

**Total size:** ~23KB (uncompressed)

## Features

✅ **Instant Play** - One click to start, no login required  
✅ **Progressive Difficulty** - 3→5→7 keys, 1→6 note sequences  
✅ **Smooth Audio** - Web Audio API with ADSR envelopes  
✅ **Mobile Optimized** - Works on all screen sizes  
✅ **Offline Ready** - No external dependencies  
✅ **Persistent Scores** - Best score saved in localStorage  

## How to Play

1. Click "Start Game" to enable audio
2. Listen to the musical sequence
3. Repeat it by tapping the keys
4. Progress through increasingly difficult levels
5. Beat your best score!

## Technical Details

- **Web Audio API** for synthesis
- **Pure JavaScript** (no frameworks)
- **CSS3** animations and responsive design
- **No build tools** required
- **Self-contained** (no CDN dependencies)

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## Deployment Options

### Static Hosting (Recommended)
Upload to any static host:
- Netlify: Drag & drop
- Vercel: Deploy from GitHub
- GitHub Pages: Push to gh-pages branch
- AWS S3: Upload to bucket with static hosting
- Any web server: Just copy the files

### Local Testing
Simply open `index.html` in your browser. Works immediately with no server required.

### Adding Ads (Optional)
The `#ad-slot` div is ready for your ad network code:

```html
<!-- In index.html, the ad-slot div is already present -->
<div id="ad-slot"></div>

<!-- Add your ad script, e.g.: -->
<script>
// Your ad network code here
</script>
```

## Customization

### Difficulty Scaling
Edit `generateLevel()` in `app.js` to adjust difficulty progression.

### Audio Synthesis
Modify `CONFIG` object in `app.js`:
- `NOTE_DURATION`: Length of each note
- `NOTE_GAP`: Spacing between notes
- `MASTER_VOLUME`: Overall volume (0-1)

### Visual Theme
Edit CSS variables in `style.css`:
```css
:root {
    --primary: #6366f1;
    --success: #10b981;
    --error: #ef4444;
    /* ... more colors */
}
```

## Testing

All features tested and validated. See `TEST_REPORT.md` for complete test results.

**Test Coverage:**
- ✅ Initial load and audio unlock
- ✅ Game start and playback
- ✅ Correct input progression
- ✅ Error handling and retry
- ✅ LocalStorage persistence
- ✅ Mobile responsiveness

## License

All rights reserved - Open Loop Apps

## Support

For issues or questions, refer to the comprehensive `TEST_REPORT.md` which includes:
- All test results
- Edge cases handled
- Known limitations
- Troubleshooting guide

---

**Built with:** Web Audio API, Vanilla JS, CSS3  
**No dependencies** • **No build step** • **Works offline**  
**Ready to ship** 🚀
