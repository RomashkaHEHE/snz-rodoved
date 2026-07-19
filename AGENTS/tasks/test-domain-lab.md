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
- Individual questionnaire deletion is a soft-delete backed by `responses.deleted_at`. The active repository query is the shared boundary for lists, filters, analytics, and CSV. The data-page secondary menu opens a recoverable trash view; immediate undo and per-row restore return the original row. Real rows cannot be permanently deleted from the UI, while fake-only cleanup physically removes active and trashed rows only when `isFake=true`.
- The primary CSV export is the current filtered slice without `contactName`/`contactPhone`. A separate confirmed menu action requests `includeContacts=true` and downloads a clearly named contacts file. Column selection is enforced in `apps/api/src/csv.ts`, not inferred from the UI privacy toggle.
- Current flows use the isolated test backend:
  - public online survey starts with demographics, then shows one Q4-Q16 question at a time in the paper questionnaire's order. The experimental interface consumes the shared `answerQuestions` catalog instead of maintaining a second question copy. Deliberate `yes`/`no` answers advance automatically except when Q11 opens its war selector, and an unanswered question moves on only through `Пропустить`; Q16 routes to review for `no`/blank or into its conditional continuation for `yes`;
  - the public review records required processing-answer consent and a separate optional invitation consent from the original paper form. Invitation consent remains available regardless of Q16 and survives changes to the help request. These choices have distinct visible status, while the review states that answers and contacts are not published. Contact phone input accepts common punctuation but requires 10-15 digits before the review can open;
  - the final online check is four compact collapsed summaries for demographics, experience, interests, and help. Each summary exposes full answers and the relevant edit action only when opened;
  - versioned browser draft navigation preserves current question positions and migrates legacy five-step and version-2 focused drafts to the matching question or review step;
  - the first online step starts with no selected demographics and blocks later steps until gender, age group, and residence have each been chosen deliberately;
  - single-choice segmented controls expose one tab stop per field/question. Arrow keys select adjacent options, including wrap-around, while `Home` and `End` jump to the boundaries. This reduces keyboard paper entry without adding visible shortcut instructions or changing touch controls;
  - online draft persistence expires after 24 hours and redacts name/phone; restored q16 help requests reopen the dedicated contact step with empty contact fields while retaining non-contact search context;
  - resetting a non-empty online survey requires confirmation, and missing restored contacts return focus to the name input instead of leaving the visitor on review;
  - the rare full-survey reset is placed after the review/navigation actions and does not compete with progress or submission. The submit action uses a send symbol and remains the only filled action on the final screen;
  - the online survey follows the paper form through Q16. A `yes` answer to Q16 opens one required name/phone step and then one optional territory/period/free-text step; changing Q16 away from `yes` skips both and clears every dependent value. The period control keeps quick presets, two range sliders, exact year inputs, and the same data contract;
  - Q11 war details follow the paper form's condition: the selector appears only for a `yes` answer and resets to `—` when that answer changes;
  - public online survey submits to the server after the review step, shows a completion screen, and stores a browser-local draft until successful submit;
  - public survey and workspace are separate shells without links between them. `/` has no workspace entry; `/entry`, `/data`, and `/pdf` have no survey entry;
  - operator entry, data, and PDF archive are behind workspace password login; authenticated workspace navigation contains only `Ввод`, `Данные`, and `PDF`;
  - desktop operator entry remains one continuous form with explicit demographic confirmation, answered/remaining progress, a next-missing-answer action, one section selector, temporary question highlighting, and grouped paper-form sections;
  - at widths up to 720px, operator entry becomes a 14-step guided flow: three explicit demographic choices first, then one Q4-Q16 question at a time. The first step blocks and focuses the first missing choice; ordinary answers auto-advance, Q11/Q16 positive answers wait for dependent fields, back/next retain state, and the final step can cycle through unanswered questions before saving;
  - paper rows can be entered as a tab-scoped series: the selected survey date, API-confirmed count, and last confirmed response ID survive route reloads in the same tab. The authoritative mutation response updates the workspace collection directly, avoiding duplicate retries when a follow-up list request fails. Each successful save clears respondent answers and demographic confirmation before returning focus to the start; `Проверить последнюю` opens that exact row in the shared editor, while a new date or `Завершить` resets the reference. Empty series do not show a finish action, and mobile active-series controls keep visible compact labels;
  - unfinished paper entry has a separate 24-hour tab-scoped recovery draft. It restores explicit demographic confirmation, date, Q4-Q16, Q11 war detail, consent marks, and mobile step after reload, while excluding name, phone, search context, free text, and internal workflow fields. A legacy draft without confirmation markers returns to questions 1-3;
  - entry submission is locked while the request is in flight so a repeated mobile tap cannot create duplicate rows;
  - data filters include date range, source, gender, age group, residence, help-only, contact-only, contact workflow status, next-contact date, missing next-contact date, and free text search;
  - active data filters are shown as removable chips so the operator can clear one constraint without resetting the whole slice;
  - data filter controls start collapsed and the open/collapsed state is stored locally in the browser;
  - data filters are mirrored into `/data` URL query, so current slices survive reload/back-forward and can be copied as links;
  - data filters can be saved as workspace-wide server presets for repeated reviews. Presets are shared across devices, update by normalized name, and import legacy browser-local values once;
  - the data screen has task modes for `Обращения`, `Анкеты`, `PDF`, and `Графики`; desktop uses low-chrome tabs and phone layouts use one select. The selected mode is stored in the `view` URL parameter and survives reload/back-forward together with the filter slice;
  - contact and questionnaire lists mount 20 rows at first and continue in explicit 20-row batches. The full filtered array remains authoritative for counts, analytics, PDF coverage, CSV, and contact planning;
  - the data row inspector shows consent as `Да`/`Нет`/`Не зафиксировано` and full Q4-Q16 answers with `Да`/`Нет`/`Нет ответа` chips, not only the positive answers;
  - on widths up to 720px, opening a contact or questionnaire row uses an opaque full-viewport modal detail screen with a sticky header, locks the background list, traps/restores keyboard focus, keeps contacts masked until explicitly shown, collapses Q4-Q16 by default, and performs inline editing in that same screen; desktop retains the side inspector;
  - mobile contact workflow uses one status select instead of four status buttons, while desktop retains the faster segmented control;
  - mobile selected-row editing uses the same one-question focus as paper entry, plus one native jump select and save from any step; desktop retains the complete inline form;
  - online search/contact fields are grouped under Q16 in every editor. Online help requests require name/phone, while paper rows allow absent contacts; changed editors confirm before closing without save;
  - the `PDF` data mode compares paper-row dates in the current slice with matching PDF dates and highlights missing scans or scans without entered paper rows;
  - `Графики` combines current-slice totals with an interactive chronological date series split into paper and online rows. It shows the eight most recent active dates first, can reveal the full history, and opens `Анкеты` with exact URL-backed filters when a date is selected;
  - demographic and Q4-Q16 breakdowns in `Графики` are collapsed by default; the redundant standalone source chart was removed because source counts are visible in the summary and each date row;
  - row inspector, inline row editing/deletion, demo-row generation, fake-only deletion, and CSV export use server rows;
  - CSV export is generated by the API and uses the current date/source/demographic/help/contact/status/search filters;
  - the protected data screen has a contact/help queue for rows where q16 is `yes`, with compact status and next-contact selects, open-work-first sorting, persisted next-contact dates, status, and operator notes. Queue cards show date urgency without repeating long free text. In this mode the inspector starts with contact reveal/call and workflow; search details and the full questionnaire are collapsed until requested. Desktop selects the first row only once for a new queue slice and respects an explicit close;
  - on phone widths, the data mode select and one filter icon form a single sticky row. The icon exposes the complete filters and shows an active-filter count, while contact status and plan remain compact two-column controls in the queue;
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
2. Keep reviewing both guided entry and the mobile data workspace on real iPhone/Safari.
3. Consider a safer operator workflow for merging duplicated paper/online rows.
4. Consider whether the online survey needs a shorter mode for people who only want help with one narrow topic.

## Last Verification

- Independent invitation-consent iteration:
  - public review shows the optional invitation choice even when Q16 is `no`;
  - a checked invitation choice survived `Q16: no -> yes -> no`, while contact/search fields still disappeared with the help branch;
  - desktop paper entry renders both processing and invitation choices after Q16 regardless of its answer;
  - repository and public API tests prove that `consentToEvents=true` is stored for `q16=no` and remains after an existing help request changes to `no`;
  - the public review at iPhone 12 mini `375x812` had no horizontal overflow and browser warning/error logs were empty.
- Last-saved paper response iteration:
  - state and collection tests cover restoring a valid response ID, rejecting it with an invalid series date, preserving/replacing it after confirmed saves, clearing it for a new date, and inserting/updating authoritative mutation results without duplicate rows;
  - a local paper create increased the confirmed series count and exposed `Проверить последнюю` only after the API response completed;
  - tab reload retained the response link, opening it showed `Изменение анкеты` for the exact saved date, and saving the edit returned to the next blank form with the same link;
  - `Завершить` reset the counter and removed the last-response action without deleting the stored response;
  - iPhone 12 mini `375x812` kept the receipt, guided first step, next action, and fixed workspace navigation inside the viewport with no horizontal overflow; browser warnings/errors were empty.
- Date-analytics iteration:
  - unit tests cover chronological paper/online grouping and recent-date selection;
  - an isolated 17-row database with 12 active dates showed the latest eight dates first and revealed all 12 through one action;
  - selecting `16 мар. 2026` opened `Анкеты`, reduced the slice to two matching rows, and wrote `dateFrom`, `dateTo`, and `view=rows` to the URL;
  - iPhone 12 mini `375x812` showed a two-column metric strip and three useful date rows in the first viewport with no horizontal overflow; desktop `1280x720` retained the four-column summary and compact horizontal bars;
  - demographic breakdowns stayed collapsed on first open and revealed age, residence, and gender counts on demand.
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
  - protected API tests cover list, create, same-name update, and deletion;
  - repository tests cover newest-first listing, upsert by name, and deletion;
  - two local browser tabs loaded the same server preset, a same-name save kept one row, and deletion was visible after the second tab refreshed;
  - legacy `rodoved-test-data-filter-presets-v1` values are removed only after successful server import;
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
- Local browser smoke for the compact contact queue confirmed:
  - eight q16 help rows with mixed statuses and next-contact dates kept the first two complete cards visible at iPhone 12 mini `375x812`; the page had no horizontal overflow;
  - the filter icon opened the full filter panel, reported one active filter, and status/plan quick filters updated their own URL-backed criteria without adding a hidden help-only filter;
  - queue cards distinguish overdue, today, future, and missing contact dates while leaving long free text in the full-screen inspector;
  - the mobile inspector retained contacts, workflow, notes, and the complete Q4-Q16 review; desktop `1280x720` retained the two-column queue/inspector layout;
  - browser console logs contained no warnings or errors.
- Local browser smoke for the calmer survey completion confirmed:
  - the original demographics and Q4-Q16 order remained unchanged, and Q16 `Да` still revealed name, phone, territory, period, and free text before review;
  - the review at iPhone 12 mini `375x812` showed four collapsed factual sections, distinct required/optional consent text, one primary send action, and a subordinate `Начать заново` action without horizontal overflow;
  - submitting without processing consent focused `consentToDataProcessing` and showed the existing validation status; the invitation checkbox remained explicitly optional;
  - desktop `1280x720` retained the centered 680px review column and the same action hierarchy without horizontal overflow;
  - the reset confirmation names the data loss before clearing the draft.
- Local browser smoke for explicit paper demographics confirmed:
  - a fresh paper row showed no selected gender, age, or residence on iPhone 12 mini `375x812` and desktop `1280x720`;
  - attempting to continue or save focused `Ж`, retained the current step, showed restrained missing-field markers, and did not increase the server-confirmed series count;
  - selecting only `Ж` created a safe tab draft; reload restored that choice, left age/residence neutral, and returned to step 1 rather than trusting defaults;
  - completing all three choices opened Q4, and a 13-question local save increased the series count to one before resetting the next respondent to neutral demographics;
  - `Проверить последнюю` reopened the saved row with `Ж`, `18-40 лет`, and `другое` selected; returning to a new row cleared those selections;
  - the empty mobile series omitted its finish action, while an active series showed non-overlapping `В серии` and `Готово` labels. Desktop retained full labels; neither viewport had horizontal overflow.
- Local browser smoke after connecting the experimental UI to the shared paper catalog confirmed:
  - questions 1-3 opened first, followed by the exact Q4-Q15 order from the paper form and Q16 last;
  - name, phone, territory, period, and free text were absent on the unanswered Q16 screen and appeared only after `Да`;
  - the browser reported no warnings or errors during the full focused flow.
- Local browser smoke for the contact-first queue confirmed:
  - an isolated 12-row queue with mixed statuses and next-contact dates opened the first priority row automatically at desktop `1280x720`, while phone `375x812` stayed on the list until the operator chose a row;
  - mobile detail showed contact reveal, contact tiles, search disclosure, status, date, quick dates, note, and save in the first viewport; demographic data and Q4-Q16 moved into a separate collapsed disclosure;
  - revealing a contact exposed the `tel:` number and one clear `Позвонить` action; the default state kept both name and phone hidden;
  - saving `В работе` persisted the status, updated the queue counts and re-sorted the row; closing the inspector after that did not auto-open the next row.
- Local browser smoke for segmented-control keyboard entry confirmed:
  - every one of the 17 single-choice groups in desktop paper entry exposed exactly one tabbable option rather than one tab stop per button;
  - `ArrowLeft` changed Q4 from `—` to `Нет`, moved focus to the selected option, and updated the roving tab stop;
  - the public survey accepted `ArrowRight` on Q4, recorded `Нет`, and followed the existing automatic advance to Q5;
  - at `375x812`, a demographic option remained touch-selectable and the entry page had no horizontal overflow.
- Local browser/API smoke for recoverable questionnaire deletion confirmed:
  - a deleted demo questionnaire disappeared from all active mode counts and appeared under `Ещё` as `Корзина · 1`;
  - the trash screen showed source, demo marker, survey date, demographics, and deletion time without exposing contact data;
  - restoring returned the same row to `Анкеты` and `Графики`, changed the trash count to zero, and left no browser warning/error logs;
  - the complete trash screen fit at iPhone 12 mini `375x812`, the restore action remained full-width, and both `375x812` and `1280x720` had no horizontal overflow;
  - repository/API tests prove deleted rows stay out of filters, analytics, and CSV, updates reject deleted rows, repeated restore returns `404`, and fake-only cleanup cannot remove an active or trashed real row.
- Verification after response-trash implementation:
  - `npm run typecheck`;
  - `npm run lint`;
  - `npm run test` (`73` tests);
  - `VITE_APP_ENV=test npm run build`;
  - `git diff --check`.
- Local API/browser smoke for privacy-aware CSV export confirmed:
  - the default filtered export omitted both contact headers and the seeded test name/phone values;
  - `includeContacts=true` preserved the same slice, included both values, and returned the `with-contacts` filename;
  - the default file and UI action explicitly say `without-name-phone` / `без имени и телефона` rather than claiming the remaining data is anonymous;
  - at `375x812`, the primary action stayed icon-sized with an exact accessible name and the explicit contact export fit inside `Ещё`; at `1280x720`, the full primary label fit without horizontal overflow;
  - the primary action completed with visible status, screen contacts remained masked, and browser warning/error logs were empty.
- Local browser smoke for the progressive Q16 continuation confirmed:
  - demographics opened first, followed by the exact Q4-Q16 paper order; unanswered Q16 contained no contact or search controls;
  - Q16 `Нет` went directly to review, while Q16 `Да` opened `Как с вами связаться` and then the optional `Что вы ищете?` step;
  - empty contacts kept the respondent on the contact step, focused `Имя`, and produced the existing validation status; valid name/phone opened the search step;
  - back navigation followed `review -> search -> contacts -> Q16`; changing Q16 to `Нет` removed all dependent values from review;
  - reloading from the search step retained non-contact context, redacted name/phone, returned to the contact step, and explicitly asked for both values again;
  - a live version-2 draft already answered `Q16: Да` migrated directly to contacts rather than showing a contact warning on the Q16 screen;
  - the contact and search steps had no horizontal overflow at `375x812`; the contact panel and its actions fit at `1280x720`; browser warning/error logs were empty.
- Verification after the progressive Q16 continuation:
  - `npm run typecheck`;
  - `npm run lint`;
  - `npm run test` (`74` tests);
  - `VITE_APP_ENV=test npm run build`;
  - `git diff --check`.
