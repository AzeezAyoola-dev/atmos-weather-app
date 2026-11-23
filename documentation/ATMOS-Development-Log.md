# ATMOS — Development Log

This file holds the detailed implementation and QA records for ATMOS, moved out
of `README.md` so the main README can stay concise. It preserves the full
Phase 5–10 records and the Phase 11 deployment verification without changing
any of the findings, counts, decisions or limitations.

Main documentation: [README.md](../README.md).

## Phase 5 search behaviour

- Typing in the dashboard search field opens Search Locations.
- Searches start only after at least two non-space characters.
- Requests are debounced by 350ms; newer input cancels pending or in-flight work.
- Results show city names, available administrative regions and country names.
- Loading, no-results and network-error states use the existing hint element and
  are announced through the existing live region.
- Selecting a result stores `name`, `region`, `country`, `latitude`, `longitude`
  and `timezone` in `js/state.js`. Recent-search persistence is handled
  separately in Phase 8.

## Phase 6 current weather behaviour

- Selecting a result returns to the dashboard and loads current weather.
- Requests use the selected city's coordinates and timezone, with Celsius
  temperatures and km/h wind speed requested explicitly.
- The city heading, country, local date/time, temperature, WMO condition icon
  and description, feels-like value, humidity, wind speed and visibility are
  updated from the API response.
- Visibility is converted from metres to kilometres when the API reports metres.
- Loading and API/network errors are shown in the existing dashboard components
  and announced through the existing live region.

## Phase 7 five-day forecast behaviour

- A separate daily request asks for `weather_code`, `temperature_2m_max` and
  `temperature_2m_min`, with `forecast_days=5` and the selected city's
  coordinates and timezone.
- The five existing forecast rows are reused: weekday labels come from the
  API's local dates, WMO codes drive the existing icon and condition text, and
  high/low temperatures are rendered in Celsius.
- The first row is the selected city's local today, followed by the next four
  days. Weekday labels are derived without applying the browser's timezone.
- Missing or incomplete daily entries become `—` placeholders while the
  five-row structure is preserved.
- Forecast loading and errors use the existing rows and are announced through
  the live region without preventing the current weather from rendering.

## Phase 8 recent-search behaviour

- Selecting a city from search results saves it only after a successful
  selection.
- Each saved city stores `name`, `country`, `latitude`, `longitude` and
  `timezone` under the `atmos.recentCities.v1` LocalStorage key.
- The five most recent unique cities are shown newest first; reselecting a city
  moves it to the front rather than creating a duplicate.
- Recent chips are loaded on startup, rendered in the existing chip list, and
  selectable without running another geocoding search.
- Malformed stored data, empty storage and unavailable LocalStorage are handled
  without errors; a valid in-memory list is retained for the current session.
- The hardcoded Lagos, Abuja and Ibadan chips are no longer part of the app
  markup.

## Phase 9 state behaviour

- HOME uses a fixed Lagos location. Loading, current-weather failure,
  forecast-only failure and retry can never replace it with a searched city.
- Search uses the existing hint element for its prompt, two-character hint,
  searching feedback, no-results message and network/API error. Failed searches
  expose a retry action; successful searches hide it.
- An empty recent-search list shows a helpful message instead of fake sample
  cities. Existing recent chips, ordering and persistence are unchanged.
- SELECTED WEATHER renders from its own city/weather slice. Current weather and
  forecast failures are tracked separately, so a forecast-only failure keeps
  valid current weather visible and offers a forecast-only retry.
- Weather retries reload the active screen's own state. Forecast retries fetch
  only the daily forecast, preserving current weather and the selected city.
- Retry buttons reuse existing warm-palette surfaces and tokens, have 44px
  minimum hit targets, and keep the global visible focus style.
- Stale responses are guarded so a result for a previous city cannot overwrite
  the current selection.
- Navigation remains `HOME → SEARCH → SELECTED WEATHER` forwards and
  `SELECTED WEATHER → SEARCH → HOME` backwards. Search query, results and
  selected-row state are restored when returning from SELECTED WEATHER.

### Verification

- Phase 9 browser suite: **294/294 checks passed** at 320px, 375px, 390px and
  1440px, covering slow networks, failed geocoding, invalid/no-result
  searches, HOME current and forecast failures, selected-city current and
  forecast failures, all retry paths, empty recents, refresh, navigation, and
  per-day forecast icons on both weather screens.
- Regressions: Phase 5 **45/45**, Phase 6 **56/56**, Phase 7 **58/58**,
  Phase 8 **37/37**, state separation **164/164**, forecast icons **129/129**.
- JavaScript module syntax checks and `git diff --check` pass.

### Remaining limitations

- Weather and recent-search data are still in-memory or LocalStorage only;
  there is no offline cache or service worker, so a refresh requires a working
  connection to repopulate weather.
- Error and loading states are intentionally session-local and are not
  persisted across refresh. A refresh returns to HOME with Lagos.
- Open-Meteo rate limits and upstream outages remain outside the app's control;
  the app reports them and offers retry rather than caching stale forecasts.
- City search still requires at least two characters and relies on the
  geocoding provider's available names and spelling.

## Phase 10 accessibility and responsive QA

### Findings and corrections

- **Verified contrast issue fixed.** The search error hint used
  `--app-accent-strong` (`#A97A2F`), which is only 3.34:1 on the warm background
  and failed axe-core's normal-text contrast rule. It now uses `--app-text`
  (`#252923`, 12.99:1 on `#F3F0E9`). The amber token remains for non-text
  forecast icons (3.78:1) and the retry hover border, as approved.
- **Verified touch-target issues fixed.** The skip link and recent-search chips
  were 36px high. Both now have `min-height: 44px`. After the change, every
  visible control in HOME, SEARCH, SELECTED WEATHER and the error states meets
  the 44×44px target goal.
- **No redesign or new desktop components.** Only `css/style.css` changed in
  the application; existing tokens and layout rules were reused.
- **No unnecessary ARIA was added.** The existing semantic buttons, labelled
  search inputs, headings, decorative `aria-hidden` icons, screen-reader-only
  condition labels and live region remain intact and passed axe-core.
- **Keyboard and focus verified.** Tab order starts with the skip link, then
  the visible search/input and action controls. Focus is visible on every
  control, including the HOME retry button: its `#252923` outline has 6.57:1
  contrast on the amber retry surface. Focus moves to the dashboard search
  after selecting a city and to the city search when SEARCH opens; initial page
  load does not steal focus.
- **Reduced motion verified.** With `prefers-reduced-motion: reduce`, CSS
  transitions resolve to 0.01ms and scrolling is immediate.

### Viewport results

Chrome device-metric emulation was used at all six required widths. The full
audit produced **182/182 passing checks** across 26 viewport/state snapshots,
with **0 axe-core violations**, **0 console errors** and **0 uncaught
exceptions**.

| Width | Result |
| --- | --- |
| 320px | No overflow or overlap; controls, rows and arrows usable; navigation works. |
| 375px | No overflow or overlap; controls, rows and arrows usable; navigation works. |
| 390px | No overflow or overlap; search error state also passes axe-core. |
| 768px | No overflow or overlap; 720px shell centred within the content area. |
| 1024px | No overflow or overlap; 720px shell centred within the content area. |
| 1440px | No overflow or overlap; 720px shell centred within the content area. |

Desktop centring was measured against `documentElement.clientWidth`, so the
15px classic scrollbar on tall HOME/SELECTED pages is accounted for rather than
reported as a layout offset.

### Functional regression and real-API smoke test

- Phase 5 **45/45**, Phase 6 **56/56**, Phase 7 **58/58**, Phase 8 **37/37**,
  Phase 9 **294/294**, state separation **164/164**, forecast icons **129/129**.
  Phase 6 was rerun in a clean browser session to avoid stacked mock scripts;
  it then passed in full.
- Real Open-Meteo smoke test: HOME showed Lagos, Nigeria with a live
  temperature, condition and five forecast rows; selecting Abuja showed the
  correct selected city with its own live weather and WMO icons; back
  navigation returned HOME to Lagos; the recent list updated; no console
  errors or exceptions occurred.
- JavaScript syntax checks pass for all six ES modules, and `git diff --check`
  passes.

### Accessibility note

The approved warm secondary text colour `#85847D` measures 3.72:1 on the
`#FFFEFA` surface. For normal-size text, `--app-text-secondary` uses `#6D6C64`
instead, which measures 5.23:1 on `#FFFEFA` and 4.64:1 on `#F3F0E9`. Phase 2
added `--app-accent-strong: #A97A2F` for forecast icons on light surfaces
(3.78:1 on `#FFFEFA`). Phase 10 keeps that token for non-text decoration only;
normal error text uses `--app-text` and is also exposed through the existing
live region. No other approved colours have changed.

### Remaining limitations

- **No physical phone was available.** Testing used Chrome browser emulation,
  not an actual phone. Touch, viewport and reduced-motion checks are therefore
  emulation results, not real-device results.
- axe-core 4.10.2 and scripted keyboard checks do not replace manual testing
  with NVDA, VoiceOver or another screen reader; no screen reader was available
  in this environment.
- Live API values change over time. The real-API smoke-test values are a
  point-in-time check, not fixed expected data.
- There is still no offline cache/service worker, and upstream outages or rate
  limits remain outside the app's control.
- Deployment was completed in Phase 11; see the
  [Deployment section in the README](../README.md#deployment).

## Phase 11 deployment verification

### Publication

- Public repository: <https://github.com/AzeezAyoola-dev/atmos-weather-app>
- Live site: <https://azeezayoola-dev.github.io/atmos-weather-app/>
- Platform: GitHub Pages, from `main`, site root (`/`), status built.
- All 16 commits and the approved Phase 10 files were pushed unchanged; only
  README presentation and ignore rules were added for delivery. The count was
  verified with `git rev-list --count HEAD` (16 commits on `main`).

### Live checks

- The deployed HTML, CSS and six ES modules all return HTTP 200 with correct
  content types.
- Real Open-Meteo smoke test on the deployed origin: HOME showed Lagos, Nigeria
  with live current weather and five forecast rows; searching Abuja showed the
  selected city with its own live weather and WMO icons; back navigation
  returned HOME to Lagos; the recent list updated; no console errors or
  uncaught exceptions.
- Full Phase 10 audit against the deployed origin: **182/182 checks passed**
  across 320px, 375px, 390px, 768px, 1024px and 1440px, with 26 viewport/state
  snapshots, **0 axe-core violations**, **0 console errors** and **0 uncaught
  exceptions**.
- Loading state on the deployed origin: card and forecast list were busy, five
  placeholder forecast rows were shown, then the same page resolved to live
  data with no retry visible.
- Error states on the deployed origin: HOME current-weather failure showed a
  friendly message and retry; forecast-only failure kept current weather and
  showed a forecast-specific message, unavailable rows and a retry. Search
  failure was covered by the Phase 10 accessibility audit.
- Recent-search persistence on the deployed origin: a city selected through
  real geocoding remained in storage and reappeared as a recent chip after a
  full page refresh.

### Delivery limitations

- No physical phone or screen reader was available; responsive and focus checks
  used Chrome emulation and axe-core, not real-device or NVDA/VoiceOver testing.
- Live weather values vary with Open-Meteo results and are point-in-time checks,
  not fixed expected values.
- Open-Meteo rate limits and upstream outages remain outside the app's control;
  the app reports them and offers retry rather than caching stale forecasts.
