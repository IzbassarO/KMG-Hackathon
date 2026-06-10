# ai-module — AI-сервисы Digital Buddy

ИИ-составляющая платформы: RAG-ассистент по ВНД КМГ и автоматическая генерация бейджей.

## Состав

- **`digital_buddy.py`** — RAG-сервис: 23 карточки ВНД + эмбеддинги + **Groq LLM**
  (`llama-3.3-70b-versatile`). Поиск релевантных документов и генерация ответа Digital Buddy
  со ссылками на источники.
- **`badge_office_service_final.py`** + **`Badge Office Automation Service.md`** — сервис
  генерации корпоративных бейджей: извлечение ФИО из документов, обработка фото и сборка
  бейджа в PNG/PDF (85×54 мм, 300 DPI).
- **`data/culture_fit_nudges.md`** — 23 карточки корпоративной культуры (по секциям) для
  загрузки в векторную базу.
- **`db/nudge_cards.sql`** — схема и данные таблицы `nudge_cards` для PostgreSQL.

## Запуск

```bash
pip install groq sentence-transformers scikit-learn numpy
cp .env.example .env             # впишите GROQ_API_KEY (https://console.groq.com/keys)
export $(grep -v '^#' .env | xargs)
python3 digital_buddy.py
```

Ключ Groq берётся из окружения (`.env`) и в код не зашивается.

> Портал общается с ассистентом через серверный маршрут `app/api/chat` (Groq), поэтому
> для чата отдельный Python-процесс не требуется — логика Digital Buddy едина.
