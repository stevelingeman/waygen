# Feature: KMZ Upload/Download Enhancements
**Status:** [PROPOSED]

## Overview
Enhance the KMZ import/export workflow with mission filename tracking, configurable mission end behavior, and smart filename defaults.

---

## 1. Mission Filename Display

### 1.1 Header Display
When a user loads a KMZ file, the filename (without extension) shall be displayed prominently in the sidebar header.

**Location:** Below the "Waygen" title in the sidebar header

**Visual Design:**
```
┌─────────────────────────┐
│  Waygen        [🗑️ ↶ ↷] │
│  mission_alpha_v2       │  ← Filename displayed here
└─────────────────────────┘
```

**Styling:**
- Font: Regular weight, slightly smaller than "Waygen" title
- Color: Muted gray (`text-gray-500`)
- Max width: Truncate with ellipsis if exceeds sidebar width
- Tooltip: Show full filename on hover if truncated

**Behavior:**
- Shows only when a KMZ has been loaded
- Updates when a new KMZ is loaded
- Persists until mission is reset or new file is loaded
- Hidden when mission is created from scratch (no KMZ loaded)

---

## 2. Download KMZ Dialog

### 2.1 Dialog Trigger
Clicking "Download KMZ" button shall open a modal dialog instead of immediately downloading.

### 2.2 Dialog Layout

```
┌──────────────────────────────────────┐
│  Export Mission                    ✕ │
├──────────────────────────────────────┤
│                                      │
│  Mission End Action                  │
│  ┌────────────────────────────────┐ │
│  │ ▼ Return to Home              │ │
│  └────────────────────────────────┘ │
│      • Hover                         │
│      • Return to Home                │
│                                      │
│  ─────────────────────────────────  │
│                                      │
│  File Name                           │
│  ┌────────────────────────────────┐ │
│  │ mission_alpha_v2               │ │
│  └────────────────────────────────┘ │
│  .kmz                                │
│                                      │
├──────────────────────────────────────┤
│              [Cancel]  [Download]    │
└──────────────────────────────────────┘
```

### 2.3 Mission End Action Selector

**Control Type:** Dropdown select

**Options:**
1. **Hover** - Drone hovers at final waypoint
2. **Return to Home (RTH)** - Drone returns to launch point

**Default:** Return to Home

**DJI KMZ Integration:**
- Maps to `finishedAction` parameter in WPML template
- Hover: `autoLand` value
- RTH: `goHome` value

### 2.4 Filename Input

**Control Type:** Text input

**Prepopulation Logic:**

| Scenario | Filename Value | Example |
|----------|---------------|---------|
| Loaded from KMZ | Original filename (no ext) | `mission_alpha_v2` |
| Created from scratch | `waygen_[timestamp]` | `waygen_20251124_072054` |
| After editing loaded file | Keeps original filename | `mission_alpha_v2` |

**Timestamp Format:** `YYYYMMDD_HHMMSS` (local time)

**Validation Rules:**
- Min length: 1 character
- Max length: 100 characters
- Allowed characters: `a-z A-Z 0-9 _ -`
- Invalid characters: Auto-replace with underscore
- Extension: Always `.kmz` (displayed separately, not editable)

**User Interactions:**
- Click to edit/select all
- Clear button (✕) to reset to default
- Real-time validation feedback
- Error state if invalid characters entered

### 2.5 Dialog Actions

**Cancel Button:**
- Closes dialog without downloading
- No state changes
- ESC key also closes

**Download Button:**
- Validates filename
- Generates KMZ with selected mission end action
- Closes dialog on success
- Shows error if filename invalid or generation fails

---

## 3. State Management

### 3.1 New Store Properties

```javascript
settings: {
  // ... existing settings
  missionEndAction: 'goHome', // 'goHome' | 'autoLand'
  currentMissionFilename: null // string | null
}
```

### 3.2 State Updates

**On KMZ Import:**
- Extract filename from `file.name`
- Remove extension
- Store in `currentMissionFilename`

**On Mission Reset:**
- Clear `currentMissionFilename` to `null`

**On Download:**
- Use current `currentMissionFilename` if exists
- Otherwise generate timestamp-based name
- Update `missionEndAction` from dialog selection

---

## 4. Technical Implementation Notes

### 4.1 DJI WPML Integration

The mission end action maps to the WPML `finishedAction` parameter:

```xml
<wpml:finishedAction>goHome</wpml:finishedAction>
<!-- or -->
<wpml:finishedAction>autoLand</wpml:finishedAction>
```

Current implementation in `djiExporter.js` likely hardcodes one option - this needs to be made configurable.

### 4.2 Dialog Component

**Framework:** React with modal overlay  
**Styling:** Tailwind CSS matching existing design  
**Accessibility:**
- Focus trap within dialog
- ESC to close
- ARIA labels for screen readers

### 4.3 Filename Sanitization

Implement helper function:
```javascript
const sanitizeFilename = (name) => {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100)
    .trim();
};
```

---

## 5. User Experience Flow

### 5.1 Import Flow
```
User clicks "Import KML/KMZ"
  → User selects file
    → Waypoints loaded
      → Filename extracted and displayed in header
        → User sees "mission_v2" below "Waygen"
```

### 5.2 Export Flow
```
User clicks "Download KMZ"
  → Dialog opens
    → Filename prepopulated (from import or auto-generated)
      → User optionally edits filename
        → User selects mission end action
          → User clicks "Download"
            → KMZ generated with custom settings
              → File downloads as "mission_v2.kmz"
```

---

## 6. Edge Cases & Error Handling

### 6.1 Invalid Filenames
- **Empty name:** Show error, disable Download button
- **Special characters:** Auto-sanitize on blur
- **Duplicate name:** Allow (browser handles download naming)

### 6.2 Very Long Filenames
- **Import:** Truncate display with ellipsis, show full in tooltip
- **Export:** Truncate to 100 chars if user enters more

### 6.3 Mission State Changes
- **After import then edit:** Keep original filename
- **After reset:** Clear filename, use timestamp on next download

---

## 7. Future Enhancements (Out of Scope)

- Recent missions list
- Favorite/template missions
- Auto-save drafts
- Version history
- Custom mission metadata (author, description, etc.)
