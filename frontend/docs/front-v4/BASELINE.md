# frontV4: исходное состояние

Исторический снимок до переноса: указанные здесь пути и ошибки могут отсутствовать в текущем коде. [Текущее состояние](MIGRATION.md).

Зафиксировано 2026-11-12 на ветке `frontV4`, commit `17e259f`. До начала работы рабочее дерево было чистым. Исследован только frontend; backend не изучался и не менялся.

Это инвентаризация клиентского кода, а не подтверждение работы сервера или ручного прохождения сценариев. Ниже перечислено поведение, которое нужно сохранить и проверить при переносе.

## Исходные проверки

Окружение: Node v24.16.0, npm 11.13.0; использованы установленные зависимости без обновления lock-файлов.

| Команда | Результат |
| --- | --- |
| `npm --prefix frontend run typecheck` | 50 диагностик TypeScript, код 2. Полный вывод: [typecheck-baseline.txt](typecheck-baseline.txt). |
| `npm --prefix frontend run build` | Успех, код 0, Vite 7.1.3; 2346 модулей. |

Build создаёт JS 1282.14 kB (gzip 381.32 kB), CSS 59.84 kB (gzip 10.89 kB). Предупреждения: JS chunk больше 500 kB, устаревшая база caniuse-lite. Vite build не запускает TypeScript-проверку, поэтому успешная сборка не означает отсутствие ошибок типов.

Группы исходных ошибок: отсутствующие `useUI`, `useEventsNav`, barrel-export `useSocketStore`; отсутствующие старые helpers/config/FormModal; implicit any; nullable payload модалок; `objectFit` в локальном объявлении CropperProps; поля secondaryAction и nullable duration уведомлений; отсутствующие anchor-поля игровых popup; рекурсивный `shortJson`; типы qrcode. Ошибки есть и в используемых экранах, и в старых недостижимых модулях.

## Маршруты и сценарии

Источник регистрации маршрутов — `src/App.tsx`; разделы кабинета выбираются внутри `src/pages/LkPage.tsx`.

| Маршрут | Сценарий |
| --- | --- |
| `/` | Главная |
| `/auth` | Вход по email/паролю; начало и подтверждение регистрации |
| `/forgot_pass`, `/new_pass` | Начало и подтверждение сброса пароля |
| `/lk` | Redirect на `/lk/me` |
| `/lk/me` | Профиль, редактирование персональных данных |
| `/lk/my_team` | Свои команды, редактирование, проверка оплаты, документы |
| `/lk/reg_team` | Регистрация команды на доступное мероприятие |
| `/lk/users` | Список пользователей, редактирование, удаление/восстановление, права |
| `/lk/mailings` | Создание/редактирование рассылок, получатели, вложения, запуск и повторная отправка |
| `/lk/*` с прочим суффиксом | По умолчанию профиль |
| `/logs` | Журнал коллекции |
| `/logs/teams/:teamId`, `/logs/users/:userId` | История объекта |
| `/logs/users/:userId/actions` | Действия пользователя |
| `/events`, `/events/:eventId` | Мероприятия: карточки/таблица, создание, изменение, удаление, восстановление, фото |
| `/events/:eventId/history`, `/events/:eventId/teams` | История и команды мероприятия |
| `/events/:eventId/location`, `/events/:eventId/location/:locationId` | Площадки: карточки/таблица, CRUD, восстановление, фотографии |
| `/events/:eventId/location/:locationId/history`, `/events/:eventId/location/:locationId/teams` | История и команды площадки |
| `/events/:eventId/location/:locationId/league`, `/events/:eventId/location/:locationId/league/:leagueId` | Лиги: карточки/таблица, CRUD, восстановление, статус, PDF-презентация |
| `L/history`, `L/teams` | История и команды лиги |
| `L/results/kvartaly`, `L/results/fudzi` | Realtime-результаты и редактирование ответов, штрафов, карточки/бонусов по правам |
| `L/results/overall` | Итоги, дипломы, специальные номинации, скачивание документов |
| `L/show` | Redirect на `/show/:leagueId` |
| `L/show-control`, `/showcontroller/:leagueId` | Управление показом |
| `/show/:leagueId` | Полноэкранный показ таблиц, презентации, заставки и таймера |
| `L/accounts`, `L/tables`, `L/fudzi-presentation` | Заглушки; не считать готовыми разделами |
| `/qr` | QR из query-параметров `data`, `title` |
| `/scanner` | Камера/ручной ввод UUID или URL с `data`; команды пользователя; отметка ARRIVED |
| `/read_qr` | Redirect на `/scanner` |
| `/locations`, `/leagues`, `/results` | Redirect на `/events` |
| `/indev`, `/example`, `*` | Заглушка, пример, 404 |

Здесь `L` = `/events/:eventId/location/:locationId/league/:leagueId`.

Режимы коллекций задаются URL-параметрами `events_view`, `locations_view`, `leagues_view`; table разрешён при наличии create/update/delete в любой группе прав сущности. По умолчанию cards. Права проверяются глобально, по id и по event/location/league scope. Не заменять эти правила простой проверкой роли.

## HTTP-инвентаризация

Все пути ниже относительно `/api/`. DTO и тела запросов пока определены непосредственно в страницах и компонентах; это клиентский инвентарь используемых адресов, не серверная спецификация.

| Метод | Пути | Владельцы |
| --- | --- | --- |
| POST | `auth/login`, `auth/register/start`, `auth/register/confirm` | AuthPage |
| POST | `auth/password-reset/start`, `auth/password-reset/confirm` | ForgotPassPage, NewPassPage |
| GET | `auth/me?include=user`, `auth/permissions` | useUserStore |
| POST | `auth/logout` | useUserStore |
| GET | `events`, `events/deleted`, `events/:id`, `events/registration` | EventPage, EventsRootPage, EventsSidebar, LkPage |
| POST/PATCH/DELETE | `events` (POST), `events/:id` (PATCH/DELETE), `events/:id/restore` (POST) | EventPage |
| GET | `events/:id/photo` (включая `?ts=`) | BaseImage, карточки мероприятия |
| GET | `locations/event/:eventId`, `locations/event/:eventId/deleted`, `locations/:id`, `photos/location/:id`, `photos/:id/file` (ветка фото без зарегистрированного маршрута) | LocationPage, LkPage, навигация |
| POST/PATCH/DELETE | `locations` (POST), `locations/:id` (PATCH/DELETE), `locations/:id/restore` (POST) | LocationPage |
| GET | `leagues/location/:locationId`, `leagues/location/:locationId/deleted`, `leagues/:id` | LeaguesPage, LkPage, навигация |
| POST/PATCH/DELETE | `leagues` (POST), `leagues/:id` (PATCH/DELETE), `leagues/:id/restore`, `leagues/:id/status` (POST) | LeaguesPage |
| GET | `teams/event/:id`, `teams/location/:id`, `teams/league/:id`, `teams/:id`, `teams/my` | EventTeamsPage, LkPage |
| POST/PATCH/DELETE | `teams` (POST), `teams/:id` (PATCH/DELETE), `teams/:id/check-payment` (POST) | EventTeamsPage, LkPage |
| GET | `teams/user/uuid/:uuid` | ReadQrPage |
| PATCH | `teams/:id` со status ARRIVED | ReadQrPage |
| GET | `leagues/:id/final-table` | ResultPage |
| GET | `teams/:id/appreciation`, `teams/:id/diploma`, `teams/:id/special-nominations` | ResultPage, LkPage, blob-download |
| GET | `leagues/:id/print_teams_names`, `teams_excel`, `awards-script`, `awarding-presentation`, `fudzi_presentation` (последние четыре с тем же префиксом `leagues/:id/`) | EventsSidebar, blob-download; fudzi_presentation также прямой fetch в ShowPage |
| GET | `users`, `users/deleted`, `users/:id` | UsersSection, LkPage |
| PATCH/DELETE/POST | `users/:id` (PATCH/DELETE), `users/:id/restore` (POST) | UsersSection |
| GET | `permissions/user/:userId`; `events/:id`, `locations/:id`, `leagues/:id`, `teams/:id`, `users/:id` для проверки scope | UserRightsModal, PermissionsCard |
| POST/PATCH/DELETE | `permissions` (POST), `permissions/:id` (PATCH/DELETE) | PermissionsCard |
| GET | `mailings`, `mailings/:id`; динамические `:entity/:id` для проверки получателей | MailingsSection |
| POST/PATCH/DELETE | `mailings` (POST), `mailings/:id` (PATCH/DELETE), `mailings/:id/start`, `mailings/recipients/:id/resend` (POST) | MailingsSection |
| GET | `logs/object/:entity?current_page=:page&include=user`, `logs/object/:entity/:id?current_page=:page&include=user`, `logs/user/:id?current_page=:page&include=user` | LogsPage |

В недостижимых старых модулях дополнительно встречаются `auth/tg-login`, фото пользователей, старые варианты запросов журналов/списка пользователей. Они не являются подтверждёнными активными сценариями.

Особенности, которые необходимо сохранить при выделении транспорта:

- JSON-тело и Bearer-токен; blob для файлов; image/webp для изображений. Фото/презентация передаются также в JSON-полях PATCH.
- Перед запросом ожидается инициализация токена из localStorage `auth_token`.
- При 401 с INVALID_TOKEN/INVALID_SESSION/SESSION_NOT_FOUND и существующим токеном сессия очищается. Другие ошибки не должны автоматически разлогинивать.
- `getImage`: HTTP 400 даёт null; остальные ошибки также преобразуются в null с опциональным уведомлением.
- `apiDelete`: связанные объекты вызывают уведомление с отложенным принудительным DELETE `?force=true`; успешное удаление может предложить POST `:path/restore`. Promise первого удаления завершается и при предложении force-delete — это важно для обновления списка.
- request, images и delete имеют отдельные fetch-реализации и дублируют проверку сессии. request → store → useUserStore → api образует цикл; errorHelper зависит от уведомлений.

## Socket.IO

Источники: `store/useTableSocket.ts`, `store/useShowSocket.ts`. Только websocket. URL: для localhost:5173 порт 3000, иначе текущий origin. Query: `league_id`, `type`, опциональный `token`.

| Поток | Входящие события | Исходящие команды и payload |
| --- | --- | --- |
| Таблица, type=fudzi/kvartaly | connect, connect_error, disconnect, data, table_data, error_response | `get_table` без payload |
| Фудзи | Общие события таблицы | `fudzi_set_answer` {team_id, question_num, status}; `fudzi_set_card` {team_id, has_card}; `fudzi_set_penalty` {team_id, penalty} |
| Кварталы | Общие события таблицы | `kvartaly_add_answer` {team_id, question_num, delta_correct, delta_incorrect}; `kvartaly_finish` {team_id, kvartal, finished}; `kvartaly_set_penalty` {team_id, penalty} |
| Показ, type=show | connect, connection_error, data, error_response | `show_set_status` {status}; `show_set_slide_num` {slide_num}; `show_set_timer_is_enabled` {enabled, minutes?}; `show_set_color_scheme` {color_scheme} |

Статусы показа: WALLPAPER, KVARTALY-RESULTS, FUDZI-PRESENTATION, FUDZI-RESULTS. Статусы ответа Фудзи: correct, incorrect, not_submitted.

Табличный store принимает явные type/leagueId, но имеет fallback на pathname. Закрывает предыдущее соединение и защищает от запоздавшей инициализации счётчиком версий. Show-store читает leagueId из pathname, повторное connect при существующем socket игнорирует; аналогичной защиты от позднего connect нет. Для показа слушается `connection_error`, для таблицы `connect_error` — сохранить как факт клиента, корректность отдельно проверить.

LeagueStageResultsPage владеет connect/disconnect таблицы; ShowPage использует оба глобальных store и переключает табличное подключение по состоянию показа; ShowControlPage подключает показ и отключает таблицу. Совместное использование singleton-соединений и смена leagueId требуют отдельной проверки на этапе 6. Входящие данные пока any; транспорт показывает уведомления.

## Использование компонентов и известные пробелы

[Статическая достижимость](module-reachability.md) перечисляет кандидатов на проверку. Проверен граф локальных импортов от index.tsx; типовые файлы и ambient declarations не считаются мусором по этому признаку. Ничего не удалено.

Активные таблицы сущностей: EntityTable/EntityTableRow и TeamTable/TeamTableRow. DataTable и его вспомогательные модули не достигаются от точки входа. Старые FudziRow/KvartalRow/TablePage не путать с используемыми FudziTable/KvartalyTable и LeagueStageResultsPage.

ModalContainer реально обрабатывает rights, final-nominations, team-members, team-info, crop. Варианты login, profile, log, user-log, photos, table-log, league-accounts объявлены в store, но их рендер закомментирован. store импортирует типы строк TeamTableRow — зависимость данных от UI для устранения на этапе 5.

В LocationPage есть ветка pathname с `/photos`, но соответствующего Route в App нет. Это существующий пробел, а не основание добавлять маршрут без решения.

## Проверки при последующих переносах

Ручные проверки пока не выполнены; доступность тестового API и учётных записей не предполагалась.

- Гость, вход, перезагрузка с токеном, выход, истёкшая сессия, регистрация и восстановление пароля.
- CRUD мероприятия/площадки/лиги, карточки и таблица через URL, удалённые записи, force-delete и restore, фото и презентации.
- Глобальные права и права по id/event/location/league; отсутствие прав на действия.
- Профиль, регистрация/редактирование своей команды, оплата, пользователи и права, рассылки.
- Результаты обоих этапов, ответы/штрафы/карточки/бонусы, итоговые дипломы/номинации и файлы.
- Показ и контроллер: статусы, слайды, таймер, смена лиги/маршрута, разрыв связи и очистка socket.
- QR: query, камера, UUID/URL, неверный ввод, отметка прибытия; журналы и пагинация.

Следующий шаг — этап 2: независимый HTTP-транспорт, нормализованные ошибки, подключение сессии/уведомлений из app и чистая проверка прав. Выбор TanStack Query оставить до этапа 3, как предусмотрено планом.
