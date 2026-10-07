# MyHeal — звіт QA-тестування

Сайт: https://new.myheal.com.ua  
Дата: 07.10.2026  
Ручне тестування: Firefox, 1366x768  
Автоматизація: Cypress 16.1.1, Custom Chrome 154 headless, 1366x768  
Node.js: 24.18.0

Цей README є чистовим звітом, підготовленим для надсилання.

## Підхід до тестування

Ручне тестування використано для перевірки верстки, відступів, вирівнювання, візуальної консистентності, поведінки без JavaScript і питань дизайну, які потребують звірки з Figma або правилами design system.

Cypress використано для стабільної поведінки, яку можна перевіряти автоматично:
- assets локалізованих entry points;
- інтерактивність Sign in;
- критичні React runtime errors.

Фінальний запуск у Custom Chrome виконав 10 тестів: 4 passed, 6 failed.

`entrypoints.cy.js`: 8 тестів, 2 passed, 6 failed. Root `/` пройшов обидві перевірки. `/en`, `/uk` та `/ru` не пройшли обидві перевірки локалізованих entry points.

`runtime-errors.cy.js`: 2 тести, 2 passed. React error #321, зафіксований вручну у Firefox, не відтворився у фінальному запуску Custom Chrome.

Загальна тривалість запуску: 37m 26s.

Попередній Cypress-run у Firefox не використано як результат перевірки застосунку, оскільки сам Firefox runner не зміг підключитися, а пізніше завершився помилкою WebDriver BiDi/profile lock.

## 1. Головна сторінка з вимкненим JavaScript

Метод: ручна перевірка.

З вимкненим JavaScript корисного fallback немає. Користувач фактично отримує порожню сторінку.

Цю перевірку залишено ручною, оскільки сам Cypress залежить від JavaScript у браузері.

## 2. HTML validator

Метод: Nu Html Checker.

Info-повідомлення про trailing slash у void elements у цьому звіті не вважаються дефектами.

Релевантні результати validator:
- `title` з’являється в `head` у контексті, де ще один `title` уже не дозволений;
- перед `</body>` залишаються незакриті елементи;
- `<div class="wrapper home">` позначено як незакритий.

Останні два findings можуть мати одну й ту саму причину на рівні template.

## 3. Головна сторінка: first viewport і картка лікаря

Метод: ручна перевірка, потрібна звірка з Figma.

На 1366x768 картка лікаря лише частково видима в first viewport. Без цільової композиції це зафіксовано як design check, а не як підтверджений defect.

## 4. Головна сторінка: великі вертикальні відступи

Метод: ручна перевірка.

У кількох секціях є незвично великі вертикальні проміжки. Без Figma це залишається design check.

## 5. Locale і валюта

Метод: ручна перевірка, потрібне product/design rule.

Англійська locale може й надалі показувати UAH. Це може бути коректною продуктовою логікою, але правило має бути явним: валюта залежить від мови, геолокації чи вибору користувача.

## 6. UK locale

Метод: ручна перевірка + Cypress.

Після перемикання на українську сторінка перестає нормально працювати. Ручна перевірка console показала повторювані CORS failures для JavaScript chunks, завантажених із `https://dev.moniheal.com/spa/...`.

Сторінка також намагається завантажити `https://new.myheal.com.ua/spa/main.js-B1Td3_5L.js` як module, хоча відповідь повертається з `text/html`, тому browser блокує завантаження.

Ручний результат: кнопки стають неінтерактивними, reload не відновлює сторінку.

Cypress відтворив обидві regression checks:
- `/uk serves valid application assets` — FAIL, оскільки production HTML містить `dev.moniheal.com`;
- `/uk keeps the sign-in flow interactive` — FAIL, оскільки після дії Sign in не з’являється password input.

Тест: `cypress/e2e/entrypoints.cy.js`.

## 7. RU locale

Метод: ручна перевірка + Cypress.

Ручне тестування відтворило той самий базовий CORS/MIME failure pattern, що й для української locale, тому детальне RU-тестування було зупинено на етапі smoke test.

Результат Cypress:
- `/ru serves valid application assets` — FAIL, оскільки production HTML містить `dev.moniheal.com`;
- `/ru keeps the sign-in flow interactive` — FAIL, оскільки очікуваний control `Войти` не знайдено в межах timeout.

Другий failure є доказом проблеми selector/interaction, а не самостійним підтвердженням тієї самої першопричини; failure за asset origin безпосередньо підтверджує проблему production configuration.

Тест: `cypress/e2e/entrypoints.cy.js`.

## 8. Локалізований текст змінює геометрію першого екрана

Метод: ручна перевірка.

Довші UK/RU рядки помітно збільшують висоту hero/header і зміщують контент вниз по осі Y. Якщо важливий контент першого екрана має бути видимий одразу, wrapping локалізованого тексту та responsive spacing потрібно перевірити окремо.

## 9. Layout shift під час початкового завантаження

Метод: ручна перевірка.

Під час завантаження сторінка помітно змінює геометрію. Блоки «стрибають» у процесі початкового rendering.

Якщо продукт тестуватиметься далі, доречна окрема performance/CLS-перевірка.

## 10. Patient page

Сторінка: https://new.myheal.com.ua/en/patient  
Метод: ручна перевірка.

Є дуже великі вертикальні порожні зони.

## 11. FAQ та інтерактивний текстовий блок

Метод: ручна функціональна перевірка.

FAQ labels на кшталт "How to find out the doctor's working hours?" поводяться як звичайний selectable text. Це не обов’язково defect і потребує звірки з interaction design.

Окремий інтерактивний блок поводиться непослідовно: його текст оновлюється не після кожного перемикання і може змінитися лише під час наступної взаємодії.

Цей сценарій варто автоматизувати після появи стабільного selector або data attribute. Без нього Cypress-тест буде зайво крихким.

## 12. Панелі patient page і modal flows

Метод: ручна перевірка.

Підвибір, який завантажує відповідні панелі, працює коректно.

Водночас візуальна поведінка між сторінками непослідовна:
- відрізняється scrollbar styling;
- відрізняється button styling;
- Join має різні кольори;
- подібні modal flows мають різну структуру.

Ці відмінності слід звірити з design system, оскільки частина з них може бути навмисною.

## 13. Вирівнювання стрілок

Метод: ручна перевірка.

Стрілки в одній групі controls не вирівняні по осі Y. Це візуальний defect, який доцільніше перевіряти вручну, а не через E2E assertion.

## 14. Повернення на головну через logo

Метод: ручна перевірка + Cypress.

З внутрішньої сторінки logo веде на `https://new.myheal.com.ua/en`.

Локалізований root `/en` відтворює проблему із завантаженням assets, тоді як `https://new.myheal.com.ua/` працює значно стабільніше.

Результат Cypress:
- `/ serves valid application assets` — PASS;
- `/ keeps the sign-in flow interactive` — PASS;
- `/en serves valid application assets` — FAIL, оскільки production HTML містить `dev.moniheal.com`;
- `/en keeps the sign-in flow interactive` — FAIL, оскільки після натискання Sign in не з’являється password input.

Це корисна regression boundary: root і localized root зараз не виконують однаковий smoke contract.

Тест: `cypress/e2e/entrypoints.cy.js`.

## 15. Scrollbar і Join на головній

Метод: ручна перевірка.

Головна використовує scrollbar, схожий на browser default, тоді як на частині внутрішніх pages/panels використано зелене оформлення.

Join також відкриває структурно різний flow на різних сторінках. Щоб визначити, чи це навмисно, потрібне product/design rule.

## 16. Experts page

Сторінка:

`https://new.myheal.com.ua/en/experts?city=%D0%9A%D0%B8%D1%97%D0%B2&isOnlineService=false&isOfflineService=false&isWeekend=false&isChildrensDoctor=false&isEhealth=false&category=0`

Метод: ручна перевірка.

Сторінку й фільтри було відкрито, але повну filter matrix навмисно не покривали в цьому проході. Її варто винести в окремий функціональний test scope.

## 17. Doctor page

Сторінка: https://new.myheal.com.ua/en/doctor  
Метод: ручна перевірка + Cypress.

На 1366x768 кнопки first screen і великий content block візуально конфліктують.

Process block перемикається, але проблема відображення/content залишається видимою.

Сторінка використовує зелене scrollbar styling.

Під час ручної перевірки console у Firefox зафіксовано `Minified React error #321`.

У тому самому сеансі також зафіксовано 404 для:
- `commons-a75a27bf5a5850bfe5a2.js.map`;
- `framework-769ec8d02d6ad131a021.js.map`;
- `webpack-runtime-6d53396e9c0902ea319f.js.map`;
- `app-2752f556b56f03c7b08d.js.map`.

Також були font warnings для `material_ico.ttf` та `icon.ttf` з повідомленнями про incorrect glyph bbox.

Фінальний результат Cypress у Custom Chrome:
- `/en/doctor does not emit React error #321` — PASS.

Отже, React #321 зафіксовано вручну, але не відтворено у фінальному automated Chrome run. Проблема може залежати від browser, state або timing.

Тест: `cypress/e2e/runtime-errors.cy.js`.

## 18. Кольори сторінок і кнопок

Метод: ручна перевірка + звірка з design system.

Після порівняння patient, doctor та clinic pages частина колірних відмінностей, схоже, відповідає окремим product sections.

Controls з однаковою функцією все одно потребують документованого правила консистентності. Без design specification кожна відмінність кольору не фіксується як окремий bug.

## 19. Clinics page

Сторінка: https://new.myheal.com.ua/en/clinics  
Метод: ручна перевірка + Cypress.

На 1366x768 головний content block незручно вміщується у first viewport. Потрібна звірка з Figma та цільовими responsive rules.

Під час ручної перевірки console у Firefox зафіксовано `Minified React error #321`, ті самі source-map 404 та font warnings.

Фінальний результат Cypress у Custom Chrome:
- `/en/clinics does not emit React error #321` — PASS.

Отже, runtime error не відтворюється стабільно в перевірених browser/run conditions.

Тест: `cypress/e2e/runtime-errors.cy.js`.

## 20. Що навмисно залишено для ручної перевірки

No-JS fallback, точні відступи, вирівнювання, кольори, scrollbar styling, звірка з Figma та HTML validation залишені manual/tool-assisted checks.

Cypress використано там, де є чіткий machine-checkable contract: production asset origin, HTTP/MIME-коректність JS assets, доступність Sign in після завантаження localized entry point та наявність/відсутність критичного React runtime error.

Це залишає automated suite сфокусованим на відтворюваних regression cases замість дублювання visual review.

## 21. Накладання CTA на UK eHealth

Сторінка: https://new.myheal.com.ua/uk/ehealth  
Метод: ручна перевірка screenshot.

Зелений CTA `Приєднатись` візуально накладається/зливається із зеленою діагональною hero graphic. Кнопка втрачає відокремлення від декоративної форми і виглядає прикріпленою до неї, а не окремим control.

Рекомендація: залишити CTA у content flow з чітким відступом від діагонального елемента та повторно перевірити responsive breakpoint, на якому зроблено наданий screenshot.

## 22. Спостереження щодо SEO / індексації локалізованих SPA-сторінок

Сторінки: `/en`, `/uk`, `/ru`  
Статус: спостереження / потребує окремої SEO-перевірки.  
Метод: аналіз наданого HTML source + реалізації локалізованих entry points.

У наданому source для `/en` присутній `<html lang="en">`, тому відсутність атрибута `lang` для EN не підтверджується. Raw source для `/uk` та `/ru` окремо не перевірявся.

Початковий HTML уже містить `title`, meta description, canonical, Open Graph та JSON-LD. Водночас основний body-content у початковому HTML відсутній: сторінка містить порожній `<div id="spa-app"></div>`, а основний контент формується JavaScript.

У наданому `/en` head не видно посилань `rel="alternate" hreflang="..."`. Це не доводить повної відсутності hreflang, оскільки він також може бути заданий через HTTP headers або sitemap.

Це зафіксовано як спостереження щодо реалізації та SEO, а не як підтверджений defect індексації. Google може render JavaScript-сторінки, але фактичний контент залежить від успішного rendering. Оскільки CORS/MIME та asset-loading failures уже відтворено на localized entry points, варто окремо перевірити rendered HTML, який бачить Googlebot для `/en`, `/uk` та `/ru`, разом із self-canonical і взаємним hreflang coverage.

## 23. Перевірка текстів і локалізацій

Метод: порівняння screenshots EN / UK / RU.

Детальні рекомендації щодо wording зберігаються у звіті Google Docs. Основні findings:

- **TXT-01 — Семантика health slogan.** EN/UK/RU copy описує «health/здоров’я» як те, що лікують. Рекомендований напрям: здоров’я підтримують/зберігають; лікують illness/хворобу.
- **TXT-02 — Англійський About copy.** Сторінка читається як буквальний переклад і потребує native English rewrite замість окремих граматичних виправлень. Приклади: `HOW IT WORKS?`, `your user's office`, `The program will configure for you...`, `WHY DO YOU NEED TO USE THIS PLATFORM?`.
- **TXT-03 — Medical claims.** Абсолютні або майже абсолютні твердження про health outcomes слід пом’якшити та окремо перевірити з product/legal.
- **TXT-04 — UK/RU кальки.** User-facing copy містить технічні формулювання на кшталт `сконфігурує` / `сконфигурирует`; варто використовувати природніші відповідники.
- **TXT-05 — Prevention headline.** `Prevent - not just treat` та його UK/RU відповідники потребують семантичного й пунктуаційного виправлення. В UK `Запобігати` точніше за `Попереджати` в цьому контексті.
- **TXT-06 — Термінологія clinic/institution.** EN/UK/RU використовують кілька різних назв аудиторії в одному product area. Потрібен один канонічний термін для кожної locale.
- **TXT-07 — Розбіжність navigation label.** `FAQ` / `Довідка` / `Справочник` не є семантично еквівалентними.
- **TXT-08 — Англійський CTA/conversion wording.** Кілька фраз зрозумілі, але звучать неприродно й потребують native product copy.
- **TXT-09 — Editorial style.** Написання бренду, правила тире, capitalization, punctuation і CTA tone потребують одного copy style rule.
- **TXT-10 — Рік у footer.** Screenshots показують `© 2023-2025 MyHeal`, хоча поточний рік — 2026.
- **TXT-11 — Статистика на головній відрізняється між locale.** EN, UK і RU screenshots показують суттєво різні platform counters. Якщо це глобальні counters, вони мають походити з одного канонічного dataset; інакше scope слід явно пояснити.

## Файли Cypress

- `cypress/e2e/entrypoints.cy.js`
- `cypress/e2e/runtime-errors.cy.js`
- `cypress.config.js`
- `package.json`

Запуск:

```powershell
npm install
npm run cy:run
```

Для явно вибраного browser binary:

```powershell
npx cypress run --browser "C:\path\to\browser.exe"
```
