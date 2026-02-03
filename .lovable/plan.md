

# Fix Working Hours Settings on Salon Dashboard

## Problem Identified
The working hours toggle and time selectors aren't working correctly because of a **time format mismatch**:
- Database returns: `09:00:00` (with seconds)
- Select component expects: `09:00` (without seconds)

This causes the dropdown values not to match, breaking the display and making toggling appear broken.

---

## Solution Overview

Normalize the time format by trimming the seconds from database values before displaying them, ensuring the Select component values match the options.

---

## Changes Required

### 1. Update WorkingHoursManager.tsx

**Fix time format normalization:**
- Add a helper function to strip seconds from time strings
- Apply the normalization when reading `open_time` and `close_time` from the database

```text
Before: "09:00:00" from database → doesn't match "09:00" option
After:  "09:00:00" → normalized to "09:00" → matches option
```

**Changes:**
- Add `normalizeTime()` function that takes `"HH:MM:SS"` and returns `"HH:MM"`
- Update the Select value props to use normalized times
- Ensure consistent formatting between stored values and UI options

### 2. Add Success Feedback

When toggling or changing times, add visual feedback:
- Show a brief toast on successful save
- Add subtle animation on toggle change

---

## Implementation Details

### Helper Function
```typescript
// Normalize time from "HH:MM:SS" to "HH:MM"
const normalizeTime = (time: string): string => {
  if (!time) return "09:00";
  const parts = time.split(":");
  return `${parts[0]}:${parts[1]}`;
};
```

### Updated Select Components
- Use `normalizeTime(openTime)` for Select value prop
- Use `normalizeTime(closeTime)` for Select value prop
- This ensures the displayed value matches one of the TIME_OPTIONS

### Success Feedback
- Add toast notification: "Hours updated!" on successful save
- This confirms to users their changes were saved

---

## Files to Modify

1. **`src/components/salon/WorkingHoursManager.tsx`**
   - Add `normalizeTime()` helper function
   - Update Select value props to use normalized times
   - Add success toast feedback

---

## Testing Points

After implementation:
- Toggle a day closed/open → toggle should update immediately
- Change opening time → dropdown should show new value
- Change closing time → dropdown should show new value
- Toast should appear confirming "Hours updated!"

