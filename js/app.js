/**
 * Atmos application entry point.
 *
 * Phase 1: boot the module graph and mark the shell as ready.
 * State management, view switching and feature orchestration arrive in
 * later phases.
 */

import './api.js';
import './weather.js';
import './search.js';
import './storage.js';

document.documentElement.dataset.atmosReady = 'true';
