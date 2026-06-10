# Badge Office Automation Service

Полнофункциональный сервис для автоматической генерации корпоративных бейджей с извлечением ФИО из документов и фотографий.

## 📦 Содержимое

### 1. **badge_office_service_final.py** (Основной модуль)
Готовый Python модуль с классом `BadgeOfficeService` для использования в своих проектах.

**Возможности:**
- Извлечение ФИО из удостоверения личности через Groq Vision API
- Извлечение ФИО из служебной записки через Docling + LLM
- Обработка фотографий (оптимизация размера и формата)
- Генерация бейджей в PNG и PDF форматах
- Корпоративный дизайн (85×54 мм, 300 DPI)
- Поддержка русского текста (кириллица)
- Логирование всех операций
- История обработки и статистика

### 2. **badge_office_api_server.py** (REST API сервер)
FastAPI сервер с REST API эндпоинтами для обработки документов.

**Эндпоинты:**
- `POST /api/v1/badges/process` - Обработка документов
- `GET /api/v1/badges/statistics` - Статистика
- `GET /api/v1/badges/list` - Список бейджей
- `GET /api/v1/badges/download/{file_type}/{file_name}` - Скачивание
- `DELETE /api/v1/badges/cleanup` - Очистка старых файлов
- `GET /api/v1/health` - Проверка здоровья

---

## 🚀 Быстрый старт

### Вариант 1: Использование как Python модуля

```python
from badge_office_service_final import BadgeOfficeService

# Инициализация
service = BadgeOfficeService(
    groq_api_key="скрыто"
)

# Обработка документов
result = service.process_documents(
    memo_pdf="path/to/memo.pdf",
    photo_image="path/to/photo.jpg",
    id_copy="path/to/id.jpg",
    consent_pdf="path/to/consent.pdf",
    output_dir="./output"
)

# Результаты
if result['success']:
    print(f"✓ Бейдж создан для: {result['fio']}")
    print(f"  PNG: {result['badge_png']}")
    print(f"  PDF: {result['badge_pdf']}")
else:
    print(f"✗ Ошибка: {result['errors']}")

# Статистика
stats = service.get_statistics()
print(f"Обработано: {stats['total_processed']}")
print(f"Успешно: {stats['successful']}")
print(f"Процент успеха: {stats['success_rate']:.1f}%")
```

### Вариант 2: Запуск как REST API сервер

```bash
# Установка зависимостей
pip install fastapi uvicorn groq docling pillow reportlab pdf2image

# Запуск сервера
python3 badge_office_api_server.py

# Сервер будет доступен на http://localhost:8000
# Документация: http://localhost:8000/docs
```

---

## 📋 API Документация

### POST /api/v1/badges/process

**Описание:** Обработка документов и генерация бейджа

**Параметры (multipart/form-data):**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|---------|
| memo_pdf | File | Да | Служебная записка (PDF) |
| photo_image | File | Да | Фотография 3×4 (JPG/PNG) |
| id_copy | File | Нет | Копия удостоверения (JPG/PNG) |
| consent_pdf | File | Нет | Согласие на ПДн (PDF) |

**Пример запроса (curl):**
```bash
curl -X POST "http://localhost:8000/api/v1/badges/process" \
  -F "memo_pdf=@memo.pdf" \
  -F "photo_image=@photo.jpg" \
  -F "id_copy=@id.jpg" \
  -F "consent_pdf=@consent.pdf"
```

**Пример ответа:**
```json
{
  "success": true,
  "fio": "Гизатов Асылбек Серикулы",
  "badge_png": "/tmp/badge_office_output/badges_1781034498/badge_Гизатов_Асылбек_Серикулы_1781034498.png",
  "badge_pdf": "/tmp/badge_office_output/badges_1781034498/badge_Гизатов_Асылбек_Серикулы_1781034498.pdf",
  "errors": [],
  "timestamp": "2025-06-10T12:34:56.789123"
}
```

### GET /api/v1/badges/statistics

**Описание:** Получение статистики обработки

**Пример запроса:**
```bash
curl "http://localhost:8000/api/v1/badges/statistics"
```

**Пример ответа:**
```json
{
  "total_processed": 10,
  "successful": 10,
  "failed": 0,
  "success_rate": 100.0,
  "processed_names": [
    "Гизатов Асылбек Серикулы",
    "Иванов Иван Иванович",
    "Петров Петр Петрович"
  ]
}
```

### GET /api/v1/badges/list

**Описание:** Получение списка всех сгенерированных бейджей

**Пример запроса:**
```bash
curl "http://localhost:8000/api/v1/badges/list"
```

**Пример ответа:**
```json
{
  "total": 2,
  "badges": [
    {
      "filename": "badge_Гизатов_Асылбек_Серикулы_1781034498.png",
      "size": 245678,
      "created": "2025-06-10T12:34:56.789123",
      "type": "png"
    },
    {
      "filename": "badge_Гизатов_Асылбек_Серикулы_1781034498.pdf",
      "size": 156789,
      "created": "2025-06-10T12:34:56.789123",
      "type": "pdf"
    }
  ]
}
```

### GET /api/v1/badges/download/{file_type}/{file_name}

**Описание:** Скачивание сгенерированного бейджа

**Параметры:**
- `file_type`: `png` или `pdf`
- `file_name`: Имя файла

**Пример запроса:**
```bash
curl -O "http://localhost:8000/api/v1/badges/download/png/badge_Гизатов_Асылбек_Серикулы_1781034498.png"
```

### DELETE /api/v1/badges/cleanup

**Описание:** Очистка старых файлов

**Параметры:**
- `days`: Удалять файлы старше N дней (по умолчанию 7)

**Пример запроса:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/badges/cleanup?days=7"
```

---

## 🔧 Установка зависимостей

```bash
# Основные зависимости
pip install groq docling pillow reportlab pdf2image

# Для API сервера
pip install fastapi uvicorn

# Опционально (для лучшей поддержки PDF)
pip install python-dotenv requests
```

---

## 📊 Характеристики бейджа

| Параметр | Значение |
|----------|----------|
| **Размер** | 85 × 54 мм (кредитная карта) |
| **DPI** | 300 (высокое качество для печати) |
| **Формат цвета** | RGB |
| **Поддерживаемые форматы вывода** | PNG, PDF |
| **Шрифт** | DejaVuSans (поддержка русского языка) |
| **Макет** | Фото слева + ФИО справа + голубая полоса сверху |

---

## 🎨 Дизайн бейджа

```
┌─────────────────────────────────────────────┐
│  ГОЛУБАЯ ПОЛОСА (0-153-204)                 │
├──────────────┬──────────────────────────────┤
│              │ ФАМИЛИЯ ИМЯ                  │
│   ФОТО       │ ОТЧЕСТВО                     │
│   3×4        │                              │
│              │ Сотрудник                    │
│              │                              │
└──────────────┴──────────────────────────────┘
```

**Цвета:**
- Фон: RGB(26, 58, 82) - Темно-синий
- Полоса: RGB(0, 153, 204) - Голубой
- Текст ФИО: RGB(255, 255, 255) - Белый
- Текст должности: RGB(204, 204, 204) - Светло-серый

---

## 🔐 Переменные окружения

```bash
# Для API сервера
export GROQ_API_KEY="скрыто"
```

---

## 📝 Примеры использования

### Пример 1: Обработка одного документа

```python
from badge_office_service_final import BadgeOfficeService

service = BadgeOfficeService(groq_api_key="your_key")

result = service.process_documents(
    memo_pdf="employee_memo.pdf",
    photo_image="employee_photo.jpg",
    id_copy="employee_id.jpg",
    output_dir="./badges"
)

if result['success']:
    print(f"Бейдж создан: {result['fio']}")
    print(f"Файлы сохранены в {result['badge_png']} и {result['badge_pdf']}")
```

### Пример 2: Пакетная обработка

```python
from pathlib import Path
from badge_office_service_final import BadgeOfficeService

service = BadgeOfficeService(groq_api_key="your_key")

documents_dir = Path("./documents")
output_dir = Path("./badges")

for employee_dir in documents_dir.iterdir():
    if not employee_dir.is_dir():
        continue
    
    memo = employee_dir / "memo.pdf"
    photo = employee_dir / "photo.jpg"
    id_copy = employee_dir / "id.jpg"
    
    if memo.exists() and photo.exists():
        result = service.process_documents(
            memo_pdf=str(memo),
            photo_image=str(photo),
            id_copy=str(id_copy) if id_copy.exists() else None,
            output_dir=str(output_dir)
        )
        
        if result['success']:
            print(f"✓ {result['fio']}")
        else:
            print(f"✗ Ошибка: {result['errors']}")

# Статистика
stats = service.get_statistics()
print(f"\nВсего обработано: {stats['total_processed']}")
print(f"Успешно: {stats['successful']}")
print(f"Процент успеха: {stats['success_rate']:.1f}%")
```

### Пример 3: Использование через HTTP API

```python
import requests

# Обработка документов
with open("memo.pdf", "rb") as memo, \
     open("photo.jpg", "rb") as photo, \
     open("id.jpg", "rb") as id_copy:
    
    files = {
        "memo_pdf": memo,
        "photo_image": photo,
        "id_copy": id_copy
    }
    
    response = requests.post(
        "http://localhost:8000/api/v1/badges/process",
        files=files
    )
    
    result = response.json()
    
    if result['success']:
        print(f"Бейдж создан для: {result['fio']}")
        
        # Скачивание PNG
        png_response = requests.get(
            f"http://localhost:8000/api/v1/badges/download/png/{Path(result['badge_png']).name}"
        )
        with open("badge.png", "wb") as f:
            f.write(png_response.content)
```

---

## 🐛 Логирование

Все операции логируются в консоль. Примеры логов:

```
2025-06-10 12:34:56 - INFO - Badge Office Service инициализирован
2025-06-10 12:34:56 - INFO -   - Groq Model: meta-llama/llama-4-scout-17b-16e-instruct
2025-06-10 12:34:56 - INFO - ============================================================
2025-06-10 12:34:56 - INFO - НАЧАЛО ОБРАБОТКИ ДОКУМЕНТОВ
2025-06-10 12:34:56 - INFO - Извлечение ФИО из изображения: /tmp/id.jpg
2025-06-10 12:34:57 - INFO - ФИО извлечено: Гизатов Асылбек Серикулы
2025-06-10 12:34:57 - INFO - Обработка фотографии: /tmp/photo.jpg
2025-06-10 12:34:57 - INFO - Генерация изображения бейджа для: Гизатов Асылбек Серикулы
2025-06-10 12:34:57 - INFO - Генерация PNG бейджа: /tmp/badge.png
2025-06-10 12:34:57 - INFO - PNG бейдж создан успешно
2025-06-10 12:34:57 - INFO - ============================================================
2025-06-10 12:34:57 - INFO - ОБРАБОТКА ДОКУМЕНТОВ ЗАВЕРШЕНА УСПЕШНО!
```

---

## ⚠️ Обработка ошибок

### Возможные ошибки:

1. **"Не удалось извлечь ФИО из документов"**
   - Проверь качество изображения удостоверения
   - Убедись, что ФИО видно в служебной записке

2. **"Не удалось обработать фотографию"**
   - Проверь формат файла (JPG или PNG)
   - Убедись, что файл не поврежден

3. **"Ошибка при обработке PDF"**
   - Проверь, что PDF файл не защищен паролем
   - Убедись, что файл не поврежден

---

## 📞 Поддержка

Для вопросов и проблем:
1. Проверь логи сервиса
2. Убедись, что все зависимости установлены
3. Проверь API ключ Groq
4. Убедись, что файлы имеют правильный формат

---

## 📄 Лицензия

MIT License

---

## 🎯 Следующие шаги

1. Установи зависимости: `pip install -r requirements.txt`
2. Запусти сервис как модуль или как API сервер
3. Протестируй на своих документах
4. Интегрируй в свою систему

Удачи! 🚀
