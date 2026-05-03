# Taskewr Design System

This document is the source of truth for styling new Taskewr UI modules. Prefer existing shared components in `src/components/app/ui.tsx` before adding local styles.

## Principles

- Build quiet operational screens, not marketing pages.
- Keep information dense, structured, and easy to scan.
- Use restrained color, predictable controls, and consistent spacing.
- Use icons for repeated actions when the meaning is clear, with tooltips for icon-only controls.
- Do not add decorative gradients, blobs, or purely ornamental cards to app surfaces.

## Layout

- App pages use the shared app shell with a fixed sidebar and a content header.
- Page headers should pair a clear title with an optional search or primary action.
- Main content surfaces on Dashboard, Projects, Workspaces, Users, and project detail pages use full-width sections or cards.
- Main page sections and primary cards use `rounded-2xl`.
- Smaller controls and elements inside those sections use `rounded-lg`.
- Avoid nested decorative cards. Use nested cards only when they represent a real repeated item, table frame, modal section, or tool surface.

## Typography

- Page titles use large, high-contrast type with tight tracking.
- Section labels use uppercase green text with wide tracking.
- Field labels, table headers, and metadata labels use uppercase muted text with wide tracking.
- Field labels that sit directly above an input, textarea, date field, checkbox row, or app dropdown use the shared spacing pattern `mb-1.5 block`.
- Body and helper text should be plain, direct, and muted when secondary.
- Do not use visible text to explain obvious controls or visual styling.
- Keep labels short enough to scan in dense admin and task screens.

## Radius

- Main modal shells and main page/section containers use `rounded-2xl`.
- Controls, pills, badges, tooltips, icon buttons, checkboxes, table frames, menus, dropdowns, alerts, and modal internals use `rounded-lg`.
- Spinners, avatars, profile photos, and logo marks remain circular with `rounded-full`.
- Do not use arbitrary radius classes such as `rounded-[18px]`.
- Do not introduce `rounded-md`, `rounded-xl`, or one-off radius variants without first updating this document.

## Controls

- Primary actions use the green accent button style.
- Secondary actions use white or subtle surface buttons with soft borders.
- Destructive actions use the red accent treatment and should be visually quieter than primary actions unless they are the only action in a confirmation modal.
- Icon buttons use a square `rounded-lg` shape, soft border, and an explanatory tooltip.
- Filters use compact toolbar-style controls with uppercase labels and readable selected values.
- Inputs, app dropdown triggers, textareas, and checkboxes use `rounded-lg`.
- Non-date app dropdowns use the shared searchable dropdown pattern from `src/components/app/ui.tsx`; do not use native `<select>` for app UI choices.
- App dropdown triggers do not show a down chevron. When searchable dropdown text is cleared, the clear control is the app-owned green `×`, not the browser-native blue search clear button.
- Date fields remain native date inputs until a dedicated date picker is designed.
- Alerts and inline helper panels use `rounded-lg`, soft borders, and restrained background tints.

## Content Patterns

- Tables should stay as raw table layouts when column sizing matters.
- Apply `rounded-lg` only to the smallest safe table frame or visual table area.
- Avoid `overflow-hidden` on table frames when it would clip menus or tooltips.
- Metadata pills use white or lightly tinted backgrounds, soft borders, uppercase labels, and `rounded-lg`.
- Status and priority pills use consistent token colors and `rounded-lg`.
- Empty states should be short, muted, and framed only when the surrounding section needs a visible body.
- Task-modal relationship sections such as Subtasks, Links, and Attachments use compact Plane-like rows under the Description area. Keep them collapsible, low-height, and row-driven rather than adding bulky nested cards.

## Modals

- Main modal shells use `rounded-2xl`.
- Modal internals use `rounded-lg`.
- Modal headers use a compact metadata pill plus an uppercase context label when useful.
- Modal body layout should match the task: single-column for simple forms, split layout only when it improves scanning.
- Modal footers use a stable action row with secondary actions before primary actions.

## Tooltips And Popovers

- Tooltips use black background, white text, compact padding, and `rounded-lg`.
- Before adding hover or focus tooltips, check parent containers for `overflow-hidden`, `overflow-x-auto`, or other clipping.
- Prefer an unclipped wrapper, `overflow-visible` on the relevant card, or an existing tooltip pattern that intentionally escapes table edges.
- Dropdowns, menus, and popovers use `rounded-lg` and must not be clipped by table or card containers.
- Dropdown panels should measure available modal or viewport space before scrolling so short option sets expand naturally and long option sets scroll only when needed.

## Implementation

- Reuse shared primitives from `src/components/app/ui.tsx` whenever possible.
- If a new module needs a new reusable pattern, add it to the shared component layer instead of duplicating local class strings.
- Keep app-specific display labels and formatting in shared helpers when they appear in more than one place.
- When a design rule changes, update this document first, then update shared components and page-specific code.
