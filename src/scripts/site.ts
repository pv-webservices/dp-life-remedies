import { initNavigation } from './modules/nav';
import { initMotion, initRail, initTabs, initLightbox } from './modules/ui';
import { initExplorer } from './modules/explorer';
import { initEnquiryForms } from './modules/forms';

declare global {
  interface Window {
    dpReady?: boolean;
  }
}

window.dpReady = true;
initNavigation();
initMotion();
initRail();
initTabs();
initLightbox();
initExplorer();
initEnquiryForms();
