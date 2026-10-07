const { defineConfig } = require("cypress");

function isPortableFirefox(browser = {}) {
  if (browser.family !== "firefox") {
    return true;
  }

  const browserPath = String(browser.path || "");
  return /[\\/]Portable[\\/]/i.test(browserPath);
}

module.exports = defineConfig({
  viewportWidth: 1366,
  viewportHeight: 768,
  chromeWebSecurity: true,
  screenshotOnRunFailure: true,
  video: false,
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 60000,
  e2e: {
    baseUrl: "https://new.myheal.com.ua",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: false,
    setupNodeEvents(on) {
      on("before:browser:launch", (browser, launchOptions) => {
        if (!isPortableFirefox(browser)) {
          throw new Error(
            [
              "QA browser safety policy blocked the system Firefox installation.",
              `Detected: ${browser.displayName || browser.name || "Firefox"}`,
              `Path: ${browser.path || "unknown"}`,
              "Use a portable Firefox binary under a Portable directory,",
              "or run the suite in the explicitly selected portable Chromium browser."
            ].join("\n")
          );
        }

        return launchOptions;
      });
    }
  }
});
