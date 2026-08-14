/* ============================================================================
   CRaWL — Theme Calendar
   THIS IS THE ONLY FILE YOU EVER EDIT.

   How it works
   ------------
   scripts/theme-engine.js reads this file, checks today's date (Asia/Kolkata),
   finds the matching event, and re-skins the site for that day.

   Date formats
   ------------
     on: "03-22"          -> fixed date, repeats EVERY year automatically
     on: "2026-11-08"     -> one specific date (used for lunar festivals)
     from / to            -> a multi-day window, same two formats

   Fields
   ------
     id        unique slug (also usable as ?theme=<id> to preview)
     name      shown in bold on the ribbon
     tagline   short line after the name (keep under ~90 characters)
     priority  higher wins when two events fall on the same date
     motif     ripple | drops | diyas | colours | snow | leaves | sun |
               tricolour | lamp | none
     vars      colours for this theme
     link      optional {href, label} button on the ribbon
     css       optional extra CSS applied only on this day

   Yearly upkeep — about 5 minutes, every December
   -----------------------------------------------
   Only THREE entries move: Holi, Diwali, and World Rivers Day (4th Sunday of
   September). Everything else is a fixed calendar date and repeats forever.
   Refresh the three from drikpanchang.com and you are done for the year.
   ========================================================================= */

window.THEME_CALENDAR = {

  settings: {
    showRibbon: true,
    placement: "top",        // "top" (pushes page down) or "bottom" (fixed strip)
    dismissible: true,
    tzAware: true,           // always evaluate the date in IST
    // Uncomment and rename to YOUR stylesheet's variables so every theme
    // recolours the whole site, not just the ribbon:
    // globalCss: ":root{--primary-color:var(--theme-accent)!important;" +
    //            "--link-color:var(--theme-accent)!important;}"
    globalCss: ""
  },

  events: [

    /* ==================================================================
       FIXED DATES — set once, repeat every year, never touch again
       ================================================================== */

    { id: "new-year", name: "Happy New Year", from: "01-01", to: "01-02", priority: 75,
      tagline: "New year, new datasets.",
      motif: "lamp",
      vars: { accent: "#7C3AED", accentSoft: "#EDE6FC", ink: "#2E1065" } },

    { id: "wetlands-day", name: "World Wetlands Day", on: "02-02", priority: 70,
      tagline: "Wetlands are the cheapest flood infrastructure we have.",
      motif: "leaves",
      vars: { accent: "#0F766E", accentSoft: "#CFE8E4", ink: "#06322E" } },

    { id: "rivers-action-day", name: "International Day of Action for Rivers", on: "03-14", priority: 75,
      tagline: "A river is a system, not a channel.",
      motif: "ripple",
      vars: { accent: "#1D6FA3", accentSoft: "#DCEEF9", ink: "#0A3350" } },

    { id: "glaciers-day", name: "World Day for Glaciers", on: "03-21", priority: 85,
      tagline: "Himalayan ice is the reservoir upstream of everything we model.",
      motif: "snow",
      vars: { accent: "#3E90C4", accentSoft: "#E6F3FB", ink: "#123B55" } },

    { id: "world-water-day", name: "World Water Day", on: "03-22", priority: 100,
      tagline: "The day this lab exists for.",
      motif: "ripple",
      vars: { accent: "#0B6FA4", accentSoft: "#D9EDF8", ink: "#062F47" },
      link: { href: "research.html", label: "Our work" } },

    { id: "meteorological-day", name: "World Meteorological Day", on: "03-23", priority: 75,
      tagline: "Every forecast is a hydrograph waiting to happen.",
      motif: "drops",
      vars: { accent: "#2E7FB8", accentSoft: "#DEEDF7", ink: "#0C3550" } },

    { id: "earth-day", name: "Earth Day", on: "04-22", priority: 80,
      tagline: "One planet, finite water.",
      motif: "leaves",
      vars: { accent: "#2E7D32", accentSoft: "#E3F1E4", ink: "#123315" } },

    { id: "environment-day", name: "World Environment Day", on: "06-05", priority: 100,
      tagline: "Research, teaching, and the catchment outside the window.",
      motif: "leaves",
      vars: { accent: "#1B7F3B", accentSoft: "#DFF2E4", ink: "#0B3319" },
      link: { href: "research.html", label: "Our work" } },

    { id: "desertification-day", name: "Desertification and Drought Day", on: "06-17", priority: 80,
      tagline: "Drought is a slow flood, run in reverse.",
      motif: "sun",
      vars: { accent: "#B7791F", accentSoft: "#FAEBD0", ink: "#4A3008" } },

    { id: "independence-day", name: "Independence Day", on: "08-15", priority: 95,
      tagline: "Jai Hind.",
      motif: "tricolour",
      vars: { accent: "#FF6D00", accentSoft: "#FFF0E0", ink: "#123B1E" } },

    { id: "engineers-day", name: "Engineer's Day", on: "09-15", priority: 85,
      tagline: "Honouring Sir M. Visvesvaraya — irrigation engineer first.",
      motif: "none",
      vars: { accent: "#B45309", accentSoft: "#FBEBD7", ink: "#3D1D03" } },

    { id: "drr-day", name: "International Day for Disaster Risk Reduction", on: "10-13", priority: 90,
      tagline: "Flood risk is a choice we make years before the water arrives.",
      motif: "drops",
      vars: { accent: "#C2410C", accentSoft: "#FBE4D8", ink: "#451A05" },
      link: { href: "research.html", label: "Flood research" } },

    { id: "christmas", name: "Merry Christmas", on: "12-25", priority: 75,
      tagline: "Season's greetings from the lab.",
      motif: "snow",
      vars: { accent: "#B3261E", accentSoft: "#F7E3E1", ink: "#3E0B07" } },

    /* ==================================================================
       MOVING DATES — refresh these three every December
       Source: drikpanchang.com
       ================================================================== */

    /* --- 2026 ------------------------------------------------------- */

    { id: "holi-2026", name: "Holi", from: "2026-03-03", to: "2026-03-04", priority: 95,
      tagline: "Holika Dahan on the 3rd, colours on the 4th.",
      motif: "colours",
      vars: { accent: "#D6336C", accentSoft: "#FCE4EE", ink: "#4A0C26" } },

    { id: "world-rivers-day-2026", name: "World Rivers Day", on: "2026-09-27", priority: 85,
      tagline: "For the Ganga, and for every unnamed tributary feeding it.",
      motif: "ripple",
      vars: { accent: "#1A6E8E", accentSoft: "#DBEEF4", ink: "#08313F" } },

    { id: "diwali-2026", name: "Diwali", from: "2026-11-06", to: "2026-11-11", priority: 100,
      tagline: "Dhanteras through Bhai Dooj — wishing you light and safety.",
      motif: "diyas",
      vars: { accent: "#F59E0B", accentSoft: "#FCEFD2", ink: "#5A2E05" } }

    /* --- 2027: paste the three below and fill in the verified dates ---

    ,{ id: "holi-2027", name: "Holi", from: "2027-MM-DD", to: "2027-MM-DD", priority: 95,
      tagline: "Holika Dahan on the eve, colours the next day.",
      motif: "colours",
      vars: { accent: "#D6336C", accentSoft: "#FCE4EE", ink: "#4A0C26" } },

    { id: "world-rivers-day-2027", name: "World Rivers Day", on: "2027-09-26", priority: 85,
      tagline: "For the Ganga, and for every unnamed tributary feeding it.",
      motif: "ripple",
      vars: { accent: "#1A6E8E", accentSoft: "#DBEEF4", ink: "#08313F" } },

    { id: "diwali-2027", name: "Diwali", from: "2027-MM-DD", to: "2027-MM-DD", priority: 100,
      tagline: "Wishing you light and safety.",
      motif: "diyas",
      vars: { accent: "#F59E0B", accentSoft: "#FCEFD2", ink: "#5A2E05" } }

    ------------------------------------------------------------------ */

  ]
};
