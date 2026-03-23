# Jobs Module - Design System Guide

## 🎨 Complete Design Specification

---

## Color Palette

### Primary Colors
```
Blue Primary:        #0c5ccc
Blue Hover:          #0a4fa8
Blue Light:          #e7f5ff (backgrounds)
Blue Border:         #339af0
```

### Semantic Colors
```
Success/Green:       #2f9e44
Success Light:       #d3f9d8
Warning/Orange:      #f59f00
Warning Light:       #fff3bf
Error/Red:           #c92a2a
Danger Red:          #dc2626
Danger Light:        #ffe0e0
Danger Border:       #ff8787
```

### Neutral Colors
```
White:               #ffffff
Page Background:     #f8f9fa
Card Background:     #f8f9fa
Border Color:        #e9ecef
Light Gray:          #dee2e6
Medium Gray:         #6c757d
Dark Gray:           #495057
Text Dark:           #212529
```

---

## Typography

### Font Family
```
Primary:  System fonts (Arial, Helvetica, sans-serif)
Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI"
Monospace: 'Courier New', monospace (for code/technical)
```

### Font Sizes & Weights

| Usage | Size | Weight | Line-Height | Example |
|-------|------|--------|-------------|---------|
| Page Title | 28px | 700 | 1.2 | "Create New Job" |
| Section Title | 15px | 700 | 1.3 | "Job Information" |
| Subsection | 14px | 600 | 1.4 | Field groups |
| Button/Input | 13px | 600 | 1.5 | Form fields |
| Label | 12px | 600 | 1.4 | UPPERCASE labels |
| Body Text | 14px | 400 | 1.6 | Descriptions |
| Helper Text | 12px | 400 | 1.4 | Hints/errors |

---

## Spacing System

### Base Unit: 4px

| Scale | Value | Use Case |
|-------|-------|----------|
| xs | 4px | Micro spacing |
| sm | 8px | Small gaps |
| md | 12px | Button padding |
| lg | 16px | Standard gap |
| xl | 20px | Element gap |
| 2xl | 24px | Section padding |
| 3xl | 32px | Page padding |
| 4xl | 40px | Large sections |

### Applied Spacing
```
Page Padding:        20px
Section Padding:     24px
Label Margin:        6px bottom
Field Margin:        20px bottom
Section Gap:         20px
Element Gap:         20px
Button Padding:      10px 16px
Button Padding (lg): 10px 24px
```

---

## Border System

### Border Radius
```
Input Fields:   6px
Buttons:        6px
Cards/Sections: 12px
Modals:         12px
Badges:         6px
```

### Border Styles
```
Standard:  1.5px solid #e9ecef
Focus:     1.5px solid #0c5ccc
Accent:    2px solid #339af0
Error:     1.5px solid #ff8787
Success:   1.5px solid #51cf66
```

---

## Shadow System

### Elevation Levels

```
Elevation 0 (None):
  box-shadow: none

Elevation 1 (Subtle):
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08)

Elevation 2 (Default Card):
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)

Elevation 3 (Raised):
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)

Elevation 4 (Floating):
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12)

Elevation 5 (Modal/Overlay):
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

### Usage
- **Elevation 2:** Standard cards, form sections, tables
- **Elevation 3:** Hover states, emphasized cards
- **Elevation 4:** Dropdown menus, expanded components
- **Elevation 5:** Modal dialogs, overlays

---

## Button System

### Button States

#### Primary Action (Blue)
```
State      Background  Color     Border           Cursor
Normal     #0c5ccc     white     1.5px #0c5ccc   pointer
Hover      #0a4fa8     white     1.5px #0a4fa8   pointer
Active     #0a4fa8     white     1.5px #0a4fa8   pointer
Disabled   #adb5bd     white     1.5px #adb5bd   not-allowed
```

#### Secondary Action (Outline Blue)
```
State      Background  Color     Border           Cursor
Normal     #f8f9fa     #0c5ccc   1.5px #0c5ccc   pointer
Hover      #0c5ccc     white     1.5px #0c5ccc   pointer
Active     #0a4fa8     white     1.5px #0a4fa8   pointer
Disabled   #f0f0f0     #9ca3af   1.5px #e5e7eb   not-allowed
```

#### Danger Action (Red)
```
State      Background  Color     Border           Cursor
Normal     #fff5f5     #dc2626   1.5px #dc2626   pointer
Hover      #dc2626     white     1.5px #dc2626   pointer
Active     #c92a2a     white     1.5px #c92a2a   pointer
Disabled   #f0f0f0     #9ca3af   1.5px #e5e7eb   not-allowed
```

#### Tertiary Action (Outline Gray)
```
State      Background  Color     Border           Cursor
Normal     #f8f9fa     #6c757d   1.5px #e9ecef   pointer
Hover      #ffffff     #6c757d   1.5px #dee2e6   pointer
Active     #e9ecef     #6c757d   1.5px #dee2e6   pointer
Disabled   #f0f0f0     #9ca3af   1.5px #e5e7eb   not-allowed
```

### Button Sizes

#### Large (Primary action)
```
Padding:     10px 24px
Font Size:   13px
Font Weight: 600
Min Width:   100px
Height:      40px
```

#### Medium (Standard)
```
Padding:     10px 16px
Font Size:   13px
Font Weight: 600
Min Width:   80px
Height:      36px
```

#### Small (Compact)
```
Padding:     6px 12px
Font Size:   12px
Font Weight: 600
Min Width:   60px
Height:      28px
```

---

## Form Elements

### Input Fields
```
Background:     #f8f9fa
Border:         1.5px solid #e9ecef
Border Radius:  6px
Padding:        10px 12px
Font Size:      13px
Color:          #212529
Placeholder:    #adb5bd

Focus State:
  Border Color: #0c5ccc
  Background:   #ffffff
  Box Shadow:   0 0 0 3px rgba(12, 92, 204, 0.1)
  Outline:      none

Disabled State:
  Background:   #f0f0f0
  Color:        #9ca3af
  Cursor:       not-allowed
```

### Text Areas
```
Same as Input Fields
Min Height:     80px
Resize:         vertical
Line Height:    1.5
```

### Select Dropdowns
```
Same as Input Fields
Appearance:     none (custom styling)
Option Styling: Standard browser defaults
```

### Labels
```
Font Size:      12px
Font Weight:    600
Color:          #6c757d
Text Transform: UPPERCASE
Letter Spacing: 0.5px
Margin Bottom:  6px
Display:        block
```

### Checkboxes
```
Size:           18px
Border:         1.5px solid #e9ecef
Border Radius:  4px
Background:     #ffffff
Checked:        #0c5ccc background with white checkmark
```

### Error Messages
```
Color:          #c92a2a
Font Size:      12px
Font Weight:    500
Margin Top:     6px
Icon:           ⚠️ emoji
```

### Success Messages
```
Background:     #d3f9d8
Border:         1.5px solid #51cf66
Color:          #2f9e44
Padding:        14px
Border Radius:  8px
Font Size:      13px
Font Weight:    500
Icon:           ✓ emoji
```

---

## Card & Section Styling

### Section Container
```
Background:     #ffffff
Border:         1px solid #e9ecef
Border Radius:  12px
Padding:        24px
Margin Bottom:  20px
Box Shadow:     0 2px 8px rgba(0,0,0,0.05)
```

### Section Title
```
Font Size:      15px
Font Weight:    700
Color:          #212529
Margin Bottom:  16px
Padding Bottom: 12px
Border Bottom:  2px solid #e9ecef
```

### Section Content
```
Spacing:        20px between elements
Line Height:    1.6
Color:          #495057
```

---

## Modal/Overlay System

### Backdrop Overlay
```
Background:     rgba(0, 0, 0, 0.5)
Position:       fixed
Inset:          0
Z Index:        1000
```

### Modal Card
```
Background:     #ffffff
Border Radius:  12px
Padding:        24px
Max Width:      400px (confirm dialogs)
Box Shadow:     0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

### Modal Header
```
Font Size:      18px
Font Weight:    700
Color:          #212529
Margin Bottom:  12px
```

### Modal Body
```
Font Size:      14px
Color:          #6c757d
Margin Bottom:  24px
Line Height:    1.6
```

### Modal Actions
```
Display:        flex
Gap:            12px
Justify:        flex-end
Margin Top:     24px
```

---

## Table Styling

### Table Container
```
Background:     #ffffff
Border Radius:  12px
Box Shadow:     0 2px 8px rgba(0,0,0,0.08)
Overflow:       auto
```

### Table Header
```
Background:     #f8f9fa
Border Bottom:  2px solid #e9ecef
```

### Table Header Cell
```
Padding:        14px 16px
Font Size:      11px
Font Weight:    700
Color:          #495057
Text Transform: UPPERCASE
Letter Spacing: 0.5px
Text Align:     left
```

### Table Body Row
```
Border Bottom:  1px solid #e9ecef
Alternate:      #ffffff & #f8f9fa (for readability)
Hover:          #e7f5ff background
Transition:     background 0.3s ease
```

### Table Cell
```
Padding:        14px 16px
Font Size:      14px
Color:          #212529
```

---

## Responsive Breakpoints

```
Mobile:    < 640px   (40px padding)
Tablet:    640-1024  (50px padding)
Desktop:   > 1024    (60px padding)
Wide:      > 1280    (centered, max-width 1200px)
```

---

## Animation & Transitions

### Standard Transition
```
transition: all 0.3s ease;
```

### Fast Transition
```
transition: background 0.2s ease;
```

### Slow Transition
```
transition: all 0.5s ease;
```

### Common Animations
- Button hover: color/background change (0.3s)
- Input focus: border/shadow (0.3s)
- Modal appear: fade in (0.3s)
- Hover effects: color invert (0.3s)

---

## Usage Examples

### Primary Button
```tsx
<button style={{
  padding: '10px 24px',
  background: '#0c5ccc',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
}}
onMouseOver={(e) => e.currentTarget.style.background = '#0a4fa8'}
onMouseOut={(e) => e.currentTarget.style.background = '#0c5ccc'}
>
  Create Job
</button>
```

### Danger Button
```tsx
<button style={{
  padding: '10px 16px',
  background: '#fff5f5',
  color: '#dc2626',
  border: '1.5px solid #dc2626',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
}}
onMouseOver={(e) => e.currentTarget.style.background = '#dc2626', e.currentTarget.style.color = 'white'}
onMouseOut={(e) => e.currentTarget.style.background = '#fff5f5', e.currentTarget.style.color = '#dc2626'}
>
  Delete
</button>
```

### Form Input
```tsx
<input style={{
  width: '100%',
  padding: '10px 12px',
  background: '#f8f9fa',
  color: '#212529',
  border: '1.5px solid #e9ecef',
  borderRadius: 6,
  fontSize: 13
}}
onFocus={(e) => {
  e.currentTarget.style.borderColor = '#0c5ccc'
  e.currentTarget.style.background = 'white'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(12, 92, 204, 0.1)'
}}
onBlur={(e) => {
  e.currentTarget.style.borderColor = '#e9ecef'
  e.currentTarget.style.background = '#f8f9fa'
  e.currentTarget.style.boxShadow = 'none'
}}
/>
```

---

## Accessibility Guidelines

### Color Contrast
- Text on backgrounds: minimum 4.5:1 contrast ratio
- Large text (18px+): minimum 3:1 contrast ratio

### Touch Targets
- Minimum button size: 36x36px (comfortable on mobile)
- Minimum padding around clickable: 8px

### Focus Indicators
- All interactive elements have visible focus state
- Focus ring is 3px with 0.1 opacity blue box-shadow

### ARIA Labels
```tsx
<button aria-label="Delete job 'Senior Engineer'">
  Delete
</button>
```

---

## Implementation Checklist

- [x] Color system defined and applied
- [x] Typography system documented
- [x] Spacing system standardized
- [x] Border system unified
- [x] Shadow system implemented
- [x] Button system complete
- [x] Form elements styled
- [x] Cards/sections designed
- [x] Modal system designed
- [x] Table styling applied
- [x] Responsive breakpoints set
- [x] Animations/transitions defined
- [x] Accessibility verified

---

*Design System Version: 1.0*  
*Last Updated: January 21, 2026*  
*Status: ✅ ACTIVE*
