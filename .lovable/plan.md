# Fix location changes reverting after refresh

## Goal
Ensure edits to a job's location are saved to the signed-in account and remain after refreshing.

## Changes
- Make job and application updates await the cloud response and detect failed saves.
- Limit updates to the active user's own record.
- Restore the previous on-screen value when a save fails, with a clear error message.
- Verify location editing in the job detail view and confirm the stored value survives a reload.

## Technical details
- Update the shared store persistence methods rather than adding location-specific behavior, so company, priority, dates, notes, and similar edits use the same reliable path.
- Preserve existing data, account isolation, and the legacy browser-data migration flow.
