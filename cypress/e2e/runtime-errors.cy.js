const pages = [
  "/en/doctor",
  "/en/clinics"
];

describe("Runtime-стан MyHeal", () => {
  pages.forEach((path) => {
    it(`${path} не видає React error #321`, () => {
      const consoleErrors = [];

      cy.visit(path, {
        onBeforeLoad(win) {
          const originalConsoleError = win.console.error.bind(win.console);

          win.console.error = (...args) => {
            consoleErrors.push(args.map(String).join(" "));
            originalConsoleError(...args);
          };
        }
      });

      cy.document().its("readyState").should("eq", "complete");
      cy.wait(1000);

      cy.then(() => {
        expect(consoleErrors.join("\n")).not.to.match(/Minified React error #321/i);
      });
    });
  });
});
