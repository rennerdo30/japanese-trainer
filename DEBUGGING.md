# Debugging Mobile Multiple Choice Feature

## Quick Start: Enable Debug Mode

Open the browser console and run:
```javascript
window.DEBUG_MOBILE = true;
location.reload();
```

This will enable detailed logging for:
- Mobile detection (user agent, touch, screen width)
- Multiple choice option generation
- Button click events
- UI initialization

## Testing Methods

### 1. Browser DevTools Mobile Emulation

**Chrome/Edge:**
1. Open DevTools (F12 or Cmd+Option+I)
2. Click the device toolbar icon (or Cmd+Shift+M)
3. Select a mobile device (iPhone, Android, etc.)
4. Refresh the page
5. Check console for debug logs

**Firefox:**
1. Open DevTools (F12)
2. Click Responsive Design Mode (Cmd+Shift+M)
3. Select a mobile device
4. Refresh the page

**Safari:**
1. Enable Develop menu: Preferences → Advanced → "Show Develop menu"
2. Develop → Enter Responsive Design Mode
3. Select a device

### 2. Force Mobile Mode (Desktop Testing)

In the browser console, you can temporarily force mobile mode:
```javascript
// Force mobile detection
window.isMobile = true;
location.reload();
```

Or manually trigger the mobile UI:
```javascript
// After page loads, manually switch to mobile mode
const container = document.getElementById('multiple-choice-container');
const input = document.getElementById('romaji-input');
if (container && input) {
    input.style.display = 'none';
    container.style.display = 'grid';
}
```

### 3. Test on Actual Mobile Device

**Local Network Testing:**
1. Find your local IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
2. Start a local server: `python3 -m http.server 8000` (or use VS Code Live Server)
3. Access from mobile: `http://YOUR_IP:8000/learn_alphabet.html`

**Or use ngrok/tunneling:**
```bash
ngrok http 8000
# Use the provided URL on your mobile device
```

### 4. Manual Testing Checklist

- [ ] Mobile detection works (check console logs)
- [ ] Text input is hidden on mobile
- [ ] Multiple choice buttons appear (4 buttons in 2x2 grid)
- [ ] Buttons show correct romaji options
- [ ] Correct answer highlights in green
- [ ] Wrong answer shows correct answer in green
- [ ] Buttons disable after selection
- [ ] Timer still works
- [ ] Stats update correctly
- [ ] Next character generates new options

### 5. Console Commands for Testing

```javascript
// Check current mobile detection
isMobileDevice()

// Check if mobile mode is active
isMobile

// Check available characters
getAvailableCharacters()

// Check current character
character

// Check generated options
multipleChoiceOptions

// Force next character (useful for testing)
next()

// Check DOM elements
elements.multipleChoiceContainer
elements.romajiInput.style.display
```

### 6. Common Issues to Check

**Buttons not showing:**
- Check if `elements.multipleChoiceContainer` exists
- Verify `isMobile` is `true`
- Check CSS: `display: grid` should be set

**Wrong options generated:**
- Check `getAvailableCharacters()` returns expected characters
- Verify character filters (gojuon, yoon, dakuten) are checked
- Check console logs for generated options

**Click handlers not working:**
- Verify buttons have `data-romaji` attributes
- Check if `isProcessing` is blocking clicks
- Look for JavaScript errors in console

**Mobile detection not working:**
- Check user agent in console: `navigator.userAgent`
- Verify screen width: `window.innerWidth`
- Check touch support: `'ontouchstart' in window`

## Disable Debug Mode

```javascript
window.DEBUG_MOBILE = false;
location.reload();
```

Or simply refresh the page (debug flag doesn't persist).
