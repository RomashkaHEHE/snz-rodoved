# Test Domain

## Status

ACTIVE

## Priority

High

## Goal

`test.snz-rodoved.ru` is a separate experimental version of the Rodoved product.

The main task of the test domain is to check from scratch how to best organize:

1. public online survey completion;
2. manual entry of paper questionnaires by the operator;
3. work with data, filters, PDF archive, and visualizations;
4. the mobile work scenario;
5. safe handling of contact data and scanned paper questionnaires.

The test domain must have its own interface, its own UX decisions, and may use new approaches that differ from the main site.

`test.snz-rodoved.ru` is used to search for better solutions.

## Current Implementation

- `apps/web/src/App.tsx` renders the experimental product app.
- Experimental UI lives under `apps/web/src/experiment`.
- The visible test site opens as a product UI with working task screens.
- Current flows use the isolated test backend:
  - public online survey starts with demographics, then shows one Q4-Q16 question at a time in the paper questionnaire's order. Deliberate `yes`/`no` answers advance automatically, Q11/Q16 wait when follow-up fields open, and an unanswered question moves on only through `Пропустить`;
  - the public review records required processing-answer consent and optional invitation consent. Contact phone input accepts common punctuation but requires 10-15 digits before the review can open;
  - the final online check is four compact collapsed summaries for demographics, experience, interests, and help. Each summary exposes full answers and the relevant edit action only when opened;
  - versioned browser draft navigation preserves current question positions and migrates legacy five-step drafts to the matching focused-flow section;
  - the first online step starts with no selected demographics and blocks later steps until gender, age group, and residence have each been chosen deliberately;
  - online draft persistence expires after 24 hours and redacts name/phone; restored q16 help requests reopen the help step with empty contact fields;
  - resetting a non-empty online survey requires confirmation, and missing restored contacts return focus to the name input instead of leaving the visitor on review;
  - the online survey follows the paper form through Q16. A `yes` answer to Q16 reveals required name/phone fields and optional territory, period, and free-text fields; changing Q16 away from `yes` hides and clears every dependent value. The period control keeps quick presets, two range sliders, exact year inputs, and the same data contract;
  - Q11 war details follow the paper form's condition: the selector appears only for a `yes` answer and resets to `—` when that answer changes;
  - public online survey submits to the server after the review step, shows a completion screen, and stores a browser-local draft until successful submit;
  - public survey and workspace are separate shells without links between them. `/` has no workspace entry; `/entry`, `/data`, and `/pdf` have no survey entry;
  - operator entry, data, and PDF archive are behind workspace password login; authenticated workspace navigation contains only `Ввод`, `Данные`, and `PDF`;
  - desktop operator entry remains one continuous form with answered/remaining progress, a next-missing-answer action, one section selector, temporary question highlighting, and grouped paper-form sections;
  - at widths up to 720px, operator entry becomes a 14-step guided flow: demographics first, then one Q4-Q16 question at a time. Ordinary answers auto-advance, Q11/Q16 positive answers wait for dependent fields, back/next retain state, and the final step can cycle through unanswered questions before saving;
  - paper rows can be entered as a tab-scoped series: the selected survey date and API-confirmed count survive route reloads in the same tab, each successful save clears respondent answers and returns focus to the start, and `Завершить` resets the series;
  - unfinished paper entry has a separate 24-hour tab-scoped recovery draft. It restores the date, demographics, Q4-Q16, Q11 war detail, consent marks, and mobile step after reload, while excluding name, phone, search context, free text, and internal workflow fields;
  - entry submission is locked while the request is in flight so a repeated mobile tap cannot create duplicate rows;
  - data filters include date range, source, gender, age group, residence, help-only, contact-only, contact workflow status, next-contact date, missing next-contact date, and free text search;
  - active data filters are shown as removable chips so the operator can clear one constraint without resetting the whole slice;
  - data filter controls start collapsed and the open/collapsed state is stored locally in the browser;
  - data filters are mirrored into `/data` URL query, so current slices survive reload/back-forward and can be copied as links;
  - data filters can be saved as local browser presets for repeated reviews;
  - the data screen has task modes for `Обращения`, `Анкеты`, `PDF`, and `Графики`; desktop uses low-chrome tabs and phone layouts use one select. The selected mode is stored in the `view` URL parameter and survives reload/back-forward together with the filter slice;
  - contact and questionnaire lists mount 20 rows at first and continue in explicit 20-row batches. The full filtered array remains authoritative for counts, analytics, PDF coverage, CSV, and contact planning;
  - the data row inspector shows consent as `Да`/`Нет`/`Не зафиксировано` and full Q4-Q16 answers with `Да`/`Нет`/`Нет ответа` chips, not only the positive answers;
  - on widths up to 720px, opening a contact or questionnaire row uses an opaque full-viewport modal detail screen with a sticky header, locks the background list, traps/restores keyboard focus, keeps contacts masked until explicitly shown, collapses Q4-Q16 by default, and performs inline editing in that same screen; desktop retains the side inspector;
  - mobile contact workflow uses one status select instead of four status buttons, while desktop retains the faster segmented control;
  - mobile selected-row editing uses the same one-question focus as paper entry, plus one native jump select and save from any step; desktop retains the complete inline form;
  - online search/contact fields are grouped under Q16 in every editor. Online help requests require name/phone, while paper rows allow absent contacts; changed editors confirm before closing without save;
  - the `PDF` data mode compares paper-row dates in the current slice with matching PDF dates and highlights missing scans or scans without entered paper rows;
  - data summary, demographic/source bars, row inspector, inline row editing/deletion, demo-row generation, fake-only deletion, and CSV export use server rows;
  - CSV export is generated by the API and uses the current date/source/demographic/help/contact/status/search filters;
  - the protected data screen has a contact/help queue for rows where q16 is `yes`, with compact status and next-contact selects, open-work-first sorting, persisted next-contact dates, status, and operator notes;
  - CSV stays visible on the data page; privacy and demo-data controls live in a secondary action menu. Each row exposes one `Открыть` action, with editing and deletion in the inspector;
  - `/data` has a browser-local contact privacy mode, enabled by default, that masks contact names and phone numbers in lists and read-only inspectors until the operator explicitly shows them;
  - collapsible question breakdown shows yes/no/unknown counts and can focus on all questions, experience, interests, or help;
  - PDF upload/list/download/deletion use server PDF storage;
  - PDF selection is staged locally and needs an explicit `Добавить в архив` action; the review shows the source name, size, survey date, and derived `YYYYMMDD_анкеты.pdf` name;
  - a duplicate survey date blocks upload and exposes the existing download instead of replacing a scan silently;
  - PDF deletion uses an inline second confirmation and states that structured questionnaire rows remain.

## Product Direction

- Keep the first screen useful as a product surface.
- Avoid visible meta-copy explaining that this is an experiment.
- Prefer mobile-first controls and dense-but-readable work screens.
- Use progressive disclosure: current work and primary actions stay visible; rare, destructive, and configuration actions do not compete with them.
- Keep respondent and operator zones independent. Do not reintroduce a shared survey/workspace navigation.
- Keep contact data and scanned questionnaires behind the workspace flow.
- Keep fake/demo rows visibly marked and removable only through fake-only API deletion.

## Next Product Steps

1. Review whether contact workflow needs assignee-like markers or a separate compact call screen.
2. Review whether saved filter presets should remain local-only or become account-level server data.
3. Keep reviewing both guided entry and the mobile data workspace on real iPhone/Safari.
4. Consider a safer operator workflow for merging duplicated paper/online rows.
5. Consider whether the online survey needs a shorter mode for people who only want help with one narrow topic.

## Last Verification

- Mobile row-detail layering iteration:
  - iPhone 12 mini `375x812` showed an opaque `rgb(243, 244, 242)` dialog over the full viewport, a white sticky header, locked body scroll, and no horizontal overflow;
  - initial focus landed on the close action; `Shift+Tab` wrapped to the final action, `Tab` wrapped back, and close/Escape restored focus to the originating `Открыть` button;
  - mobile inline editing retained the same opaque surface and bottom action background; desktop `1280x720` retained the sticky side inspector and text close action.
- Consent/contact-quality iteration:
  - shared, database, API, and web targeted suites passed: 56 tests total;
  - public mobile/browser smoke confirmed the original 1-16 order, Q16-only help fields, invalid-phone focus, required processing consent, optional invitation consent, successful submit, and persisted inspector values;
  - paper entry shows tri-state consent controls on Q16 in both continuous desktop and 14-step phone layouts;
  - iPhone 12 mini `375x812` and desktop `1280x720` checks had no horizontal overflow.
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `VITE_APP_ENV=test npm run build`
- Local browser smoke for device-specific paper entry confirmed:
  - at iPhone 12 mini `375x812`, entry renders one 14-step flow and no desktop toolbar; the initial document height is about 836px rather than the former 3064px continuous form, with no horizontal overflow;
  - an ordinary Q4 answer advances to Q5, `Назад` retains the selected answer, and manual `Далее` still allows an intentional `Нет ответа`;
  - Q11 `Да` stays on the current step and reveals the full war selector; Q16 `Да` stays on the final step and reveals name/phone fields;
  - saving a mobile questionnaire increments the API-confirmed series counter and returns to demographics for the next row;
  - at `1280x720`, the mobile flow is absent and the continuous desktop toolbar plus all 13 question rows remain available;
  - browser console contains no warnings or errors.
- Local browser smoke for focused mobile data rows confirmed:
  - before the change, opening the first help row at `375x812` appended the inspector below the list, expanded the page from about 1208px to 5027px, and left the inspector at the viewport's lower edge;
  - the selected row now opens at the top of a `375x812` full-viewport dialog, locks background scrolling, has no horizontal overflow, and closes back to the preserved list position;
  - names and phone numbers remain masked until the explicit privacy action is used; the full Q4-Q16 review is collapsed initially and expands to all 13 answer rows;
  - inline edit remains available inside the focused screen, while `1280x720` still uses the sticky two-column inspector.
- Local browser/API smoke for guided selected-row editing confirmed:
  - at `375x812`, edit mode starts with demographics and renders zero question cards; jumping to Q16 renders exactly one question, two contact inputs, and the online search details without horizontal overflow;
  - saving an online help row with a whitespace-only phone returns to Q16, shows a validation message, and focuses the phone input even when save was pressed from another step;
  - restoring the phone and changing free text persisted both values through the API; a paper Q16 help row saved with no contact and showed no online search block;
  - at `1280x720`, editing still uses the two-column sticky inspector with all 13 question rows, and search details stay nested inside Q16;
  - explicit cancel restored the stored age value, and dismissing the unsaved-close confirmation kept the editor open; browser console had no warnings or errors.
- Local browser smoke for the calmer interface confirmed:
  - public survey at `1280x720` and iPhone 12 mini `375x812` has no horizontal overflow; only the current title and progress are visible, and research fields stay closed until requested;
  - mobile bottom navigation is fixed to the viewport rather than the blurred header containing block;
  - paper entry replaces the former button toolbar with one progress indicator, `Найти пропуск`, and one section select; toolbar height is 65px on desktop and the mobile layout remains usable without horizontal overflow;
  - data filters are closed on first open, summary metrics only appear in `Графики`, desktop uses low-chrome mode tabs, and mobile uses one mode select;
  - one demo row exposed one `Открыть` action; the inspector retained edit, open-in-entry, delete, contact workflow, and all 13 answer rows;
  - the initial empty data screen had 14 visible buttons including global navigation, compared with the previous always-open filters and metric dashboard.
- Local browser smoke for respondent/workspace separation confirmed:
  - `/` has no `nav`, workspace entry, or survey step button rail; its first step shows only required demographics and the primary action;
  - unauthenticated `/entry` has no survey link or navigation; authenticated workspace navigation is exactly `Ввод`, `Данные`, `PDF`;
  - at `1280x720`, the public form is constrained to a 680px reading column with unused space around it rather than spreading controls across the viewport;
  - at iPhone 12 mini `375x812`, the complete first survey step fits in the viewport and has no horizontal overflow;
  - mobile authenticated workspace navigation has three equal items, stays fixed at the viewport bottom, and contains no survey transition.
- Local browser smoke for the Q16-dependent online continuation confirmed:
  - steps 1-3 contain demographics and paper questions Q4-Q15 without contact or research fields;
  - Q11 initially has no war selector; `Да` reveals the full-name options, and changing the answer hides the selector and resets it to `—`;
  - the help step initially contains only Q16; choosing `Да` reveals name, phone, territory, period, and free text directly below it;
  - changing Q16 to `Нет` removes and clears every dependent value, and choosing `Да` again opens empty fields;
  - the review step keeps the dependent values inside `Помощь` rather than showing a separate early search section;
  - at iPhone 12 mini `375x812`, the continuation uses one column and has no horizontal overflow.
- HTTP/asset smoke against a temporary local server confirmed:
  - `/api/health` responds;
  - `/data` serves the built test app;
  - the built JS contains `Есть контакт`, `Сбросить`, `Проживание`, `Источник`, and `Контакты`;
  - the built CSS contains `filter-choice-grid` and `filter-title-row`.
- HTTP/asset smoke for the public survey confirmed:
  - the built JS contains `Проверка`, `Поиск`, `Опыт`, `Интересы`, `Нет ответа`, `Отправить`, `Анкета отправлена`, and `Новая анкета`;
  - the built CSS contains `survey-review`, `review-question-row`, `answer-chip`, and `survey-success`.
- HTTP/API smoke for the contact workflow confirmed:
  - a response can be created;
  - workspace PATCH can save `contactStatus` and `contactNote`;
  - the built UI bundle contains contact workflow controls and labels.
- HTTP/API smoke for server CSV export confirmed:
  - `/api/responses` filters rows by `contactOnly`, `contactStatus`, and `query`;
  - `/api/responses/export.csv` uses the same filters and excludes rows outside the current slice.
- HTTP/asset smoke for URL-backed data filters confirmed:
  - the built JS contains data filter query keys and `replaceState`;
  - the built JS still uses `/api/responses/export.csv`;
  - forbidden meta-copy about the test domain is absent.
- HTTP/asset smoke for active filter chips confirmed:
  - the built JS contains `Активные фильтры`, `Дата с`, and `Статус:`;
  - the built CSS contains `active-filter-chips`.
- HTTP/asset smoke for saved filter presets confirmed:
  - the built JS contains `Сохранить срез`, `Сохранённые срезы`, and `rodoved-test-data-filter-presets-v1`;
  - the built CSS contains `filter-presets` and `preset-row`.
- HTTP/asset smoke for operator entry confirmed:
  - the built JS contains `Навигация по анкете`, `Заполнено`, `Найти пропуск`, `Данные анкеты`, and `Быстрый ввод`;
  - the built CSS contains `entry-toolbar`, `entry-progress`, `entry-jump-row`, and `entry-section-title`.
- HTTP/asset smoke for data task modes confirmed:
  - the built JS contains `Рабочий режим`, `Обращения`, `Анкеты`, and `Открыть архив`;
  - the built CSS contains `data-mode-tabs`, `contact-mode-panel`, and `pdf-slice-panel`;
  - forbidden meta-copy about the test domain is absent.
- HTTP/asset smoke for contact privacy mode confirmed:
  - the built JS contains `Показать контакты`, `Телефон скрыт`, and `rodoved-test-hide-contacts-v1`;
  - the built CSS contains `privacy-button` and `masked-contact`;
  - data task modes are still present and forbidden meta-copy about the test domain is absent.
- HTTP/asset smoke for online survey research period control confirmed:
  - the built JS contains `Период поиска`, `1700-е`, `1941-1945`, and `не ограничен`;
  - the built CSS contains `period-control`, `period-presets`, and `period-sliders`;
  - data task modes, contact privacy mode, and the absence of forbidden meta-copy are still confirmed.
- HTTP/asset smoke for PDF coverage confirmed:
  - the built JS contains `Бумажные строки без PDF`, `PDF без бумажных строк`, and `Бумажные даты закрыты PDF`;
  - the built CSS contains `pdf-coverage`, `pdf-date-checklist`, and `pdf-coverage-stat`;
  - data modes, contact privacy mode, period control, and the absence of forbidden meta-copy are still confirmed.
- HTTP/asset smoke for mobile operator entry helper confirmed:
  - the built JS contains `Найти пропуск`, `Ответов «Нет ответа» сейчас нет.`, and `entry-question-`;
  - the built CSS contains `entry-next-unknown` and `question-card.is-highlighted`;
  - PDF coverage, period control, contact privacy mode, and the absence of forbidden meta-copy are still confirmed.
- HTTP/asset smoke for collapsible data filters confirmed:
  - the built JS contains `rodoved-test-data-filter-panel-open-v2`, `Свернуть`, and `Фильтры`;
  - the built CSS contains `filter-title-actions`, `filter-body`, and `filter-panel.is-collapsed`;
  - entry helper, PDF coverage, period control, contact privacy mode, and the absence of forbidden meta-copy are still confirmed.
- HTTP/asset smoke for full row-inspector answers confirmed:
  - the built JS contains `answer-review-list`, `answer-review-row`, and `Q4-Q16`;
  - the built CSS contains `answer-review-grid` and `answer-review-row`;
  - collapsible data filters and the absence of forbidden meta-copy are still confirmed.
- HTTP/asset smoke for contact queue controls confirmed:
  - the built JS contains `Статус`, `Не дозвонились`, and `Следующий контакт`;
  - the built CSS contains `contact-filter-row` and `contact-filter-select`;
  - full row-inspector answers and the absence of forbidden meta-copy are still confirmed.
- HTTP/asset smoke for next-contact planning confirmed:
  - the built JS contains `Следующий контакт`, `+7 дней`, and `contactNextDate`;
  - the built CSS contains `quick-date-row`;
  - the built API CSV code contains `Следующий контакт`;
  - the built DB migration code contains `contact_next_date`;
  - forbidden meta-copy about the test domain is absent.
- Live server check for next-contact planning confirmed:
  - `test.snz-rodoved.ru` serves the new JS/CSS bundle;
  - the user service `snz-rodoved-test.service` is active on release `655d615`;
  - the SQLite `responses` table on the test server contains `contact_next_date`.
- HTTP/asset smoke for next-contact plan filters confirmed:
  - the built JS contains `Следующий контакт`, `Просрочено`, `Без даты`, and `contactNextMissing`;
  - the built CSS contains `contact-filter-row` and `contact-filter-select`;
  - the built API filter code contains `contactNextFrom`, `contactNextTo`, and `contactNextMissing`;
  - the built DB repository code contains `contactNextDate` and `contactNextMissing`;
  - the built UI uses local date formatting through `getTimezoneOffset`;
  - forbidden meta-copy about the test domain is absent.
- Local browser smoke:
  - public `/` has no workspace navigation or entry link;
  - unauthenticated `/entry` has no survey link; after workspace login, navigation shows only `Ввод`, `Данные`, `PDF`;
  - protected data screen shows q16 help rows in `Обращения` with a `tel:` link;
  - iPhone-width checks had no horizontal overflow.
- Local browser smoke for paper-entry series confirmed:
  - changing the series date to `2026-07-11`, changing q4, and saving retained that date while resetting q4 to `Нет ответа`;
  - the confirmed series count changed from `0` to `1` only after the success response;
  - a page reload restored the date and count from tab-scoped storage;
  - `Завершить` reset the series to the local current date and count `0`;
  - desktop `1280x720` and iPhone 12 mini `375x812` had no horizontal overflow; the date, counter, navigation, and sticky save action remained usable.
- Local browser smoke for deliberate public answers and draft privacy confirmed:
  - a fresh survey showed zero selected demographics; trying `Далее` marked all three groups, stayed on `О себе`, and focused the first missing choice;
  - selecting `М`, `18-40 лет`, and `другое` cleared validation and allowed later steps;
  - a q16 help draft showed contacts on review in memory, but reload reopened `Помощь` with both contact inputs empty while retaining the demographic choices;
  - trying to submit that restored review returned to `Помощь` and focused the name input without issuing a create request;
  - iPhone 12 mini `375x812` had no horizontal overflow and each demographic group retained a stable full-width layout.
- Local browser/API smoke for the safer PDF archive confirmed:
  - an empty archive at `375x812` shows one date, one file picker, and one disabled upload action with no horizontal overflow;
  - API-seeded files render newest survey date first, and the derived-name notice blocks a duplicate date while keeping the existing PDF downloadable;
  - opening deletion replaces the row actions with `Отмена` and `Удалить PDF`; cancel keeps the file and confirmation deletes only the temporary test PDF;
  - the confirmation fits between `27px` and `348px` at a `375px` viewport, desktop retains a three-column file row, and browser console warnings/errors are empty.
- Local browser smoke for paper-entry recovery confirmed:
  - at `375x812`, answering Q4 advanced to Q5; reload restored Q5 and kept the Q4 `yes` answer without horizontal overflow;
  - a Q16 `yes` draft restored the final step but cleared a test name and phone, with an explicit message asking the operator to enter them again;
  - successful creation increased the server-confirmed series count, cleared the recovery draft, and a later reload started at demographics without a restore notice;
  - at `1280x720`, the continuous 13-question form remained active with no horizontal overflow, and browser console warnings/errors were empty.
- Local browser smoke for the focused online survey confirmed:
  - at `375x812`, the first screen fits without horizontal overflow; Q4 renders exactly one question and two answer buttons, while the blank state exposes `Пропустить` instead of a preselected third answer;
  - Q4 `Да` advanced to Q5, `Назад` retained the answer, Q11 `Да` stayed in place for the full war selector, and the selected war survived draft reload;
  - Q16 `Да` opened contacts and search context, blocked forward navigation with empty required contacts, and focused the name field; changing the same answer to `Нет` auto-advanced and removed every dependent value;
  - the collapsed final check reduced the mobile document from about 2616px of fully expanded answers to one 812px viewport with four factual summaries; opening `Интересы` exposed all nine answer rows and its edit action;
  - at `1280x720`, the survey remains a centered 680px reading column with one question, two answer buttons, no horizontal overflow, and no browser console warnings or errors;
  - submitting the local questionnaire reached the `Анкета отправлена` completion screen.
- Local browser smoke for progressive data lists and calmer mobile data controls confirmed:
  - an isolated database with 75 demo rows rendered 20 questionnaire rows first, then 40 and 45 after successive continuation actions; the action disappeared when every matching row was mounted;
  - `?view=rows` appeared after selecting `Анкеты` and restored that mode after reload while resetting the mounted batch to 20;
  - a queue with 25 help requests also mounted 20 cards first, while its counts and plan selectors continued to show all 25;
  - at iPhone 12 mini `375x812`, CSV and secondary actions are stable icon buttons, the selected mode precedes the collapsed filter summary, duplicate panel headings are hidden, and the action popover stays inside the viewport;
  - at `1280x720`, desktop tabs, filters, list/inspector columns, and 20-row continuation remain intact; neither viewport had horizontal overflow and browser console logs were empty.
