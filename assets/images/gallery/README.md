# Gallery — how to add photos

Drop the file in this folder. That's the whole procedure.
No HTML editing, no caption, no description.

## Naming

| Prefix    | Appears under          | Page                              |
|-----------|------------------------|-----------------------------------|
| `conf-`   | Conferences & Training | gallery-conferences-training.html |
| `lab-`    | Lab Life               | gallery-lab-life.html             |
| `field-`  | Field Campaigns        | gallery-field-campaigns.html      |

Examples: `conf-23.jpg`, `lab-9.jpg`, `field-2.jpg`

## Rules

1. Numbers start at **1** and run upward. Use the next free number.
2. Don't leave a gap of more than 8 numbers — the scanner stops after
   8 consecutive misses. (Deleting one or two photos is fine.)
3. Extensions accepted: `.jpg .JPG .jpeg .JPEG .png .PNG .webp`
   Lowercase `.jpg` is preferred.
4. Photos are shown in numeric order on the category pages.
   The Gallery landing page shows the **4 highest numbers** in each
   category, so the newest photos feature automatically.
5. Roughly 1600 px on the long edge is plenty; keep files under ~600 KB.

The scanning logic lives in `assets/js/gallery-auto.js`.
