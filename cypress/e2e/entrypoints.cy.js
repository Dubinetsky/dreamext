const localeEntryPoints = [
  { path: "/", signIn: /Sign in/i },
  { path: "/en", signIn: /Sign in/i },
  { path: "/uk", signIn: /Увійдіть|Увійти/i },
  { path: "/ru", signIn: /Войти/i }
];

function checkDocumentAssets(path) {
  cy.request({
    url: path,
    failOnStatusCode: false,
    followRedirect: true
  }).then((response) => {
    expect(response.status, `${path} HTML status`).to.eq(200);
    expect(String(response.headers["content-type"] || ""), `${path} HTML MIME`)
      .to.include("text/html");

    const html = String(response.body);

    // Production-сторінки не повинні залежати від JavaScript bundles із dev host.
    expect(html, `${path} production HTML`).not.to.include("dev.moniheal.com");

    const document = new DOMParser().parseFromString(html, "text/html");
    const baseUrl = Cypress.config("baseUrl");
    const scripts = [...document.querySelectorAll("script[src]")]
      .map((script) => new URL(script.getAttribute("src"), baseUrl).href)
      .filter((url) => url.startsWith(baseUrl));

    expect(scripts.length, `${path} same-origin script count`).to.be.greaterThan(0);

    cy.wrap(scripts, { log: false }).each((url) => {
      cy.request({
        url,
        failOnStatusCode: false
      }).then((assetResponse) => {
        expect(assetResponse.status, `${url} status`).to.eq(200);
        expect(
          String(assetResponse.headers["content-type"] || ""),
          `${url} MIME`
        ).to.match(/javascript|ecmascript/i);
      });
    });
  });
}

describe("Локалізовані entry points MyHeal", () => {
  localeEntryPoints.forEach(({ path, signIn }) => {
    it(`${path} віддає коректні application assets`, () => {
      checkDocumentAssets(path);
    });

    it(`${path} зберігає інтерактивність Sign in`, () => {
      cy.visit(path);
      cy.contains(signIn).first().should("be.visible").click();
      cy.get('input[type="password"]').should("be.visible");
    });
  });
});
