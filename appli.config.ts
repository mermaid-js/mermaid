export default {
  // Explicitly set the server URL to use Applitools cloud service
  serverUrl: 'https://eyes.applitools.com',

  // API key from environment variable
  apiKey: process.env.APPLITOOLS_API_KEY,

  // Batch configuration
  batch: {
    name: 'Cypress Tests',
    id: process.env.APPLITOOLS_BATCH_ID,
  },

  // Browser configuration for CI
  browser: [{ name: 'chrome', width: 1440, height: 1024 }],

  // Test concurrency (reduce for stability in CI)
  testConcurrency: 1,

  // Viewport size
  viewportSize: { width: 1440, height: 1024 },

  // Force full page screenshots
  forceFullPageScreenshot: true,

  // Don't fail tests on visual differences (optional)
  exitcode: false,

  // Additional settings for CI stability
  matchTimeout: 2000,

  // Disable local Eyes server
  // cspell:ignore dont
  dontCloseBatches: false,

  // Save debug screenshots on failure
  saveDebugScreenshots: process.env.CI ? false : true,
} as const;
