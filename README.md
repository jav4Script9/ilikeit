# I Like It — Пошаговая инструкция запуска

## Что нужно установить
- Node.js (https://nodejs.org) — скачай LTS версию
- VS Code (https://code.visualstudio.com) — редактор кода

## Шаг 1 — Установить зависимости проекта

Открой папку ilikeit в командной строке (или в VS Code → Terminal) и выполни:

```
npm install
```

## Шаг 2 — Настроить Supabase

1. Зайди на https://supabase.com и войди через GitHub
2. Нажми "New project", назови его "ilikeit"
3. Придумай пароль базы данных (запомни его)
4. Дождись создания проекта (~1-2 минуты)

### Создать таблицы:
5. Зайди в раздел "SQL Editor" в левом меню
6. Нажми "New query"
7. Открой файл `supabase_setup.sql` из этой папки, скопируй всё содержимое
8. Вставь в SQL Editor и нажми "Run"

### Получить ключи:
9. Зайди в Settings → API
10. Скопируй:
    - "Project URL" (выглядит как https://XXXXX.supabase.co)
    - "anon public" ключ (длинная строка)

### Вставить ключи в проект:
11. Открой файл `src/lib/supabase.js`
12. Замени:
    - `https://ТВОЙ_ПРОЕКТ.supabase.co` → твой Project URL
    - `ТВОЙ_ANON_KEY` → твой anon ключ

## Шаг 3 — Запустить локально

```
npm run dev
```

Открой в браузере: http://localhost:5173

Проверь что всё работает — можно зарегистрироваться и добавить запись.

## Шаг 4 — Задеплоить на Vercel

1. Загрузи проект на GitHub:
   - Создай новый репозиторий на https://github.com
   - Выполни в папке проекта:
     ```
     git init
     git add .
     git commit -m "init"
     git remote add origin https://github.com/ТВОЙ_НИК/ilikeit.git
     git push -u origin main
     ```

2. Зайди на https://vercel.com и войди через GitHub
3. Нажми "Add New Project"
4. Выбери репозиторий ilikeit
5. Нажми "Deploy"

Через ~1 минуту сайт будет доступен по адресу https://ilikeit.vercel.app

## Шаг 5 — Установить как PWA на Android

1. Открой сайт в Chrome на телефоне
2. Нажми три точки (меню) → "Добавить на главный экран"
3. Готово! Иконка появится на рабочем столе как обычное приложение

---

## Структура проекта

```
src/
  lib/
    supabase.js       — подключение к Supabase
    AuthContext.jsx   — глобальный контекст авторизации
  components/
    Layout.jsx        — шапка + нижняя навигация
    ItemCard.jsx      — карточка блюда в ленте
  pages/
    HomePage.jsx      — главная лента с фильтрацией
    ItemPage.jsx      — страница блюда + голосование
    AddItemPage.jsx   — добавление новой записи
    ProfilePage.jsx   — профиль пользователя
    AuthPage.jsx      — вход и регистрация
```
