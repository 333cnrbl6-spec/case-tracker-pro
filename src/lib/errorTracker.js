import { base44 } from '@/api/base44Client';

export const trackError = async (error, context = {}) => {
  try {
    const user = await base44.auth.me().catch(() => null);
    
    await base44.functions.invoke('logErrorEvent', {
      error_type: error.name || 'Error',
      message: error.message,
      stack_trace: error.stack,
      user_email: user?.email,
      page: window.location.pathname,
      severity: context.severity || 'error'
    }).catch(err => {
      // Fallback: log to console if function fails
      console.error('Failed to track error:', error, err);
    });
  } catch (err) {
    console.error('Error tracking failed:', err);
  }
};

export const setupErrorBoundary = () => {
  window.addEventListener('error', (event) => {
    trackError(event.error, { severity: 'error' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason || new Error('Unhandled rejection'), { severity: 'warning' });
  });
};