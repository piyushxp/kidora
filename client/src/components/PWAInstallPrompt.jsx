import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check if running in PWA mode on iOS
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }

      // Check for installation prompt availability
      const isPromptAvailable = localStorage.getItem('pwa-install-dismissed');
      if (!isPromptAvailable) {
        setTimeout(() => setShowInstallPrompt(true), 3000); // Show after 3 seconds
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      // Fallback for browsers that don't support the install prompt
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = 'To install this app on iOS:\n1. Tap the Share button in Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
    } else if (isAndroid) {
      instructions = 'To install this app on Android:\n1. Tap the menu button (⋮) in your browser\n2. Tap "Add to Home screen" or "Install app"\n3. Tap "Add" to confirm';
    } else {
      instructions = 'To install this app:\n1. Look for the install icon in your browser\'s address bar\n2. Click it and follow the prompts\n3. Or use your browser\'s menu to "Install" or "Add to Home Screen"';
    }
    
    alert(instructions);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-strong">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <DevicePhoneMobileIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Install Kidora
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Add to your home screen for quick access and offline use
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="btn btn-primary btn-sm flex-1"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="btn btn-outline btn-sm px-3"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Banner */}
      <div className="hidden lg:block fixed top-0 inset-x-0 z-50">
        <div className="bg-primary-600 dark:bg-primary-700">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <ArrowDownTrayIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Install Kidora for quick access and offline use
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white p-1"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PWAInstallPrompt; 