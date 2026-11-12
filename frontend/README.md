# Frontend frontV4

React + TypeScript + Vite. Установка зависимостей выполняется из корня npm-workspace:

```sh
npm ci
npm --prefix frontend run dev
```

Единственный lock-файл — корневой `package-lock.json`. Backend не нужен для сборки и клиентских тестов frontend; для реальных пользовательских операций нужен совместимый API.

## Проверки

```sh
npm --prefix frontend run check
```

Команда проверяет границы импортов, TypeScript, клиентские тесты и production build. Отдельно доступны `typecheck`, `check:imports`, `test:client`, `test:api`, `build`. Результат сборки — `frontend/dist`.

## Структура

- `src/app` — запуск, маршруты, подключение API, кеша и уведомлений.
- `src/pages` — композиция экранов, модели сценариев, формы и представления.
- `src/entities` — предметные модели, DTO, адаптеры, API и предметные таблицы/карточки.
- `src/shared/api` — общий HTTP-транспорт и ошибки; без React, Zustand и доступа к сессии.
- `src/shared/realtime` — транспорт Socket.IO и жизненный цикл подключений.
- `src/shared/lib`, `model`, `ui`, `styles` — общие функции, уведомления, UI, токены и стили.

Направление зависимостей: `app → pages → entities → shared`. Представления получают данные и действия через props; HTTP-запросы находятся в API сущностей. Статические правила применяются при production build.

[Итоги переноса и ограничения проверки](docs/front-v4/MIGRATION.md). [Исходное состояние](docs/front-v4/BASELINE.md). [План](FRONTEND_V4_PLAN.md).

Текущее подключение к новой Python dev API и ограничения опубликованного контракта описаны в [DEV_API.md](docs/front-v4/DEV_API.md).
