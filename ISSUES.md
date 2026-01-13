# Known Issues

## High Priority
- [ ] Build Error: `convex/auth.ts` property 'store' does not exist on type 'auth'.
- [ ] UI Inconsistency: Most pages (Vocabulary, Kanji, Grammar, Reading, Listening) do not use the new `Container`, `Toggle`, and `Chip` components.
- [ ] Missing Animations: Transition animations (character entry, floating background) are missing on internal pages.

## Medium Priority
- [ ] Ad-hoc Styling: Hardcoded styles found in `Kanji`, `Grammar`, and `Reading` pages for buttons and text.
- [ ] Component Usage: `Text` and `Card` components are underutilized in favor of plain `div`s.
- [ ] Listening Data: Exercises are hardcoded in the component instead of being externalized to JSON.

## Low Priority
- [ ] Furigana Replacement: Reading page uses regex replacement for Furigana which might be fragile.
- [ ] Duplicate Styles: Local `.module.css` files contain redundant styles already defined in `globals.css`.
