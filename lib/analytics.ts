declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      eventParams?: Record<string, any>
    ) => void;
  }
}

export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

export const analytics = {
  // Track when a user clicks on a background card preview
  cardPreview: (backgroundId: number, backgroundName: string) => {
    trackEvent('background_preview', {
      background_id: backgroundId,
      background_name: backgroundName,
      event_category: 'engagement',
    });
  },

  // Track when a user clicks the Code button
  cardCode: (backgroundId: number, backgroundName: string) => {
    trackEvent('background_code_view', {
      background_id: backgroundId,
      background_name: backgroundName,
      event_category: 'engagement',
    });
  },

  // Track when a user copies code
  codeCopy: (
    backgroundId: number | undefined,
    backgroundName: string | undefined,
    codeType: 'usage' | 'tsx' | 'jsx'
  ) => {
    trackEvent('code_copy', {
      background_id: backgroundId || 'unknown',
      background_name: backgroundName || 'unknown',
      code_type: codeType,
      event_category: 'conversion',
    });
  },

  // Track when a user toggles favorite
  toggleFavorite: (backgroundId: number, backgroundName: string, action: 'add' | 'remove') => {
    trackEvent('favorite_toggle', {
      background_id: backgroundId,
      background_name: backgroundName,
      action,
      event_category: 'engagement',
    });
  },
};
