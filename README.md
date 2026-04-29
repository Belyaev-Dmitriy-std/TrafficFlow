# 🚦 Traffic AI Simulation

Веб-симуляция городского трафика с интеллектуальным управлением светофорами.

Проект моделирует мини-город из 4 связанных перекрёстков, машинный поток, двухполосное движение, остановку машин на красный сигнал, повороты на перекрёстках и работу AI-агента, который регулирует фазы светофоров.

---

## 📌 Описание проекта

**Traffic AI Simulation** — это fullstack-приложение, состоящее из:

- **Frontend:** React + Vite
- **Backend:** Go
- **AI Agent:** Rule-based алгоритм + Gemini API
- **Simulation:** визуальная модель движения машин по карте города

Главная идея проекта — показать, как агент может анализировать состояние дорожной сети и управлять светофорами для уменьшения очередей.

---

## 🧠 Как работает агент

В проекте есть два режима управления:

### 1. Rule-based mode

Классический алгоритм, который работает локально и быстро.

Он сравнивает загруженность направлений:

```txt
Север-Юг = northQueue + southQueue
Восток-Запад = eastQueue + westQueue
```

Если Север-Юг загружен сильнее — включается:

```txt
NS_GREEN
```

Если Восток-Запад загружен сильнее — включается:

```txt
EW_GREEN
```

---

### 2. Gemini mode

AI-режим, в котором состояние всего города отправляется в Gemini одним batch-запросом.

```txt
Frontend
  ↓
POST /api/decision-batch
  ↓
Go Backend
  ↓
Gemini API
  ↓
Решения для 4 перекрёстков
```

Gemini возвращает JSON:

```json
{
  "decisions": [
    {
      "id": "A1",
      "nextPhase": "NS_GREEN"
    },
    {
      "id": "A2",
      "nextPhase": "EW_GREEN"
    }
  ]
}
```

Если Gemini недоступен, backend автоматически переключается на rule-based fallback.

---

## 🏙️ Возможности симуляции

- Карта мини-города
- 4 перекрёстка
- Дороги в две полосы в каждую сторону
- Правостороннее движение
- Машины двигаются по дорогам
- Машины останавливаются на красный сигнал
- Машины поворачивают на перекрёстках
- Разные тайминги у светофоров
- Переключение режимов Rule / Gemini в интерфейсе
- Кнопки Старт / Стоп / Перезапуск
- Batch-запросы к AI-агенту
- Fallback на rule-based при ошибках Gemini

---

## 🗂️ Структура проекта

```txt
traffic-ai-simulation/
├─ backend/
│  ├─ main.go
│  ├─ go.mod
│  ├─ .env
│  └─ internal/
│     └─ agent/
│        ├─ rule_agent.go
│        └─ gemini_agent.go
│
├─ frontend/
│  ├─ package.json
│  ├─ index.html
│  └─ src/
│     ├─ api/
│     │  └─ trafficApi.js
│     │
│     ├─ logic/
│     │  └─ trafficEngine.js
│     │
│     ├─ components/
│     │  └─ TrafficSimulation/
│     │     ├─ TrafficSimulation.jsx
│     │     ├─ TrafficSimulation.css
│     │     └─ components/
│     │        ├─ AgentPanel/
│     │        ├─ CityMap/
│     │        ├─ IntersectionNode/
│     │        ├─ MovingTraffic/
│     │        ├─ Queue/
│     │        └─ TrafficLight/
│     │
│     ├─ App.jsx
│     └─ main.jsx
│
├─ package.json
├─ .gitignore
└─ README.md
```

---

## ⚙️ Установка

### 1. Клонировать проект

```bash
git clone <your-repository-url>
cd traffic-ai-simulation
```

---

### 2. Установить frontend-зависимости

```bash
cd frontend
npm install
cd ..
```

---

### 3. Установить Go-зависимости

```bash
cd backend
go mod tidy
cd ..
```

---

### 4. Установить зависимости корневого проекта

```bash
npm install
```

---

## 🔐 Настройка переменных окружения

Создай файл:

```txt
backend/.env
```

Пример:

```env
GEMINI_API_KEY=your_gemini_api_key_here
AGENT_MODE=rule
GEMINI_MODEL=gemini-3.1-flash-lite-preview
```

### Переменные

| Переменная | Описание |
|---|---|
| `GEMINI_API_KEY` | API-ключ Gemini |
| `AGENT_MODE` | Режим агента: `rule` или `gemini` |
| `GEMINI_MODEL` | Модель Gemini |

Для обычного запуска без Gemini:

```env
AGENT_MODE=rule
```

Для AI-режима:

```env
AGENT_MODE=gemini
```

---

## 🚀 Запуск проекта

Проект запускается одной командой из корня:

```bash
npm run dev
```

Она одновременно запускает:

```txt
Go backend  → http://localhost:8080
React app   → http://localhost:5173
```

---

## 📡 API

### `POST /api/decision`

Решение для одного перекрёстка.

#### Request

```json
{
  "id": "A1",
  "northQueue": 5,
  "southQueue": 3,
  "eastQueue": 2,
  "westQueue": 7,
  "currentPhase": "NS_GREEN"
}
```

#### Response

```json
{
  "id": "A1",
  "nextPhase": "EW_GREEN",
  "reason": "Восток-Запад перегружен",
  "source": "rule"
}
```

---

### `POST /api/decision-batch`

Решения для всего города одним запросом.

#### Request

```json
{
  "intersections": [
    {
      "id": "A1",
      "northQueue": 3,
      "southQueue": 5,
      "eastQueue": 4,
      "westQueue": 2,
      "currentPhase": "NS_GREEN"
    },
    {
      "id": "A2",
      "northQueue": 7,
      "southQueue": 1,
      "eastQueue": 5,
      "westQueue": 6,
      "currentPhase": "EW_GREEN"
    }
  ]
}
```

#### Response

```json
{
  "source": "gemini",
  "reason": "Gemini обновил фазы города",
  "decisions": [
    {
      "id": "A1",
      "nextPhase": "NS_GREEN",
      "reason": "",
      "source": "gemini"
    },
    {
      "id": "A2",
      "nextPhase": "EW_GREEN",
      "reason": "",
      "source": "gemini"
    }
  ]
}
```

---

### `POST /api/mode`

Переключение режима агента.

#### Request

```json
{
  "mode": "gemini"
}
```

#### Response

```json
{
  "mode": "gemini"
}
```

---

## 🧩 Основные компоненты frontend

### `TrafficSimulation.jsx`

Главный контейнер симуляции.

Отвечает за:

- состояние города;
- запуск simulation loop;
- переключение режимов агента;
- вызов batch API;
- управление паузой и перезапуском.

---

### `CityMap.jsx`

Отвечает за визуальную карту города:

- дороги;
- здания;
- сетку;
- перекрёстки;
- движущийся трафик.

---

### `MovingTraffic.jsx`

Визуальная модель машин.

Отвечает за:

- движение машин;
- остановку у красного сигнала;
- дистанцию между машинами;
- повороты на перекрёстках;
- замедление в Gemini-режиме.

---

### `AgentPanel.jsx`

Правая панель управления.

Содержит:

- переключение Rule / Gemini;
- кнопку Старт / Стоп;
- кнопку Перезапуск;
- текущий статус;
- количество перекрёстков;
- общую очередь;
- последнее решение агента.

---

## 🧠 Почему используется batch-запрос

Изначально каждый перекрёсток мог отправлять отдельный запрос к Gemini:

```txt
4 перекрёстка = 4 запроса
```

Это быстро упирается в лимиты Gemini.

Поэтому используется batch-подход:

```txt
4 перекрёстка = 1 запрос
```

Преимущества:

- меньше запросов;
- меньше расход лимитов;
- Gemini видит весь город целиком;
- решения становятся согласованнее;
- backend проще контролировать.

---

## ⚠️ Ограничения Gemini

Gemini API может возвращать:

```txt
429 RESOURCE_EXHAUSTED
503 UNAVAILABLE
504 DEADLINE_EXCEEDED
```

Это нормальные ситуации для бесплатного тарифа или preview-моделей.

В проекте предусмотрен fallback:

```txt
Gemini недоступен → rule-based агент продолжает работу
```

---

## 🧪 Режимы тестирования

### Быстрое тестирование

```env
AGENT_MODE=rule
```

Плюсы:

- быстро;
- стабильно;
- не расходует Gemini API;
- подходит для разработки визуальной части.

---

### AI-демонстрация

```env
AGENT_MODE=gemini
GEMINI_MODEL=gemini-3.1-flash-lite-preview
```

Плюсы:

- показывает AI-режим;
- Gemini принимает решения по всему городу;
- можно демонстрировать работу интеллектуального агента.

---

## 🛡️ Безопасность

Gemini API key хранится только на backend:

```txt
backend/.env
```

Frontend не имеет доступа к ключу.

Файлы `.env` должны быть добавлены в `.gitignore`.

---

## 🌍 Деплой

### Frontend

Frontend можно задеплоить на Vercel.

Для этого желательно использовать переменную:

```env
VITE_API_URL=https://your-backend-url.com
```

---

### Backend

Go backend лучше вынести отдельно:

- Render
- Railway
- Fly.io
- VPS
- Docker/VPS

Рекомендуемая схема:

```txt
Vercel      → frontend
Render/VPS  → Go backend
```

---

## 🧾 Скрипты

В корне проекта:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run backend\" \"npm run frontend\"",
    "backend": "cd backend && go run main.go",
    "frontend": "cd frontend && npm run dev"
  }
}
```

Запуск:

```bash
npm run dev
```

---

## 🔮 Что можно улучшить дальше

- WebSocket вместо polling
- Больше перекрёстков
- Настоящие маршруты машин
- Пешеходные переходы
- Аварии и заторы
- Приоритет главных дорог
- История решений агента
- Графики загруженности
- Обучаемый агент
- Reinforcement Learning
- Сохранение статистики в базу данных
- Docker-сборка

---

## 📚 Технологии

- React
- Vite
- JavaScript
- Go
- Gemini API
- CSS Modules-style structure
- REST API
- Rule-based AI logic

---

## 👨‍💻 

Проект разработан как учебная fullstack-симуляция интеллектуального управления дорожным движением.

---

## 🧠 Кратко

```txt
React рисует город
Go принимает запросы
Rule-based агент работает быстро
Gemini агент анализирует весь город
Машины ездят, останавливаются и поворачивают
Светофоры управляются автоматически
```