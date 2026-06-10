"""
🎯 DIGITAL BUDDY - RAG СЕРВИС ДЛЯ ОНБОРДИНГА КМГ
23 встроенные ВНД карточки + Groq LLM + Embeddings
"""

import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from groq import Groq

# ============================================================================
# 1. ЗАГРУЗКА И ПОДГОТОВКА 23 ВНД КАРТОЧЕК
# ============================================================================

VND_CARDS = [
    {
        "day": 1,
        "title": "Деловой внешний вид",
        "source": "Правила дресс-кода",
        "text": "Соблюдайте корпоративный дресс-код: аккуратность, сдержанность, деловой стиль."
    },
    {
        "day": 2,
        "title": "Корректность и уважение",
        "source": "Кодекс этики",
        "text": "Общайтесь профессионально, уважительно, избегайте фамильярности."
    },
    {
        "day": 3,
        "title": "Дисциплина и рабочее время",
        "source": "ПВТР",
        "text": "Приходите вовремя, соблюдайте график, эффективно используйте рабочее время."
    },
    {
        "day": 4,
        "title": "Уведомление руководителя",
        "source": "ПВТР",
        "text": "Сообщайте о планируемом отсутствии или опоздании заранее."
    },
    {
        "day": 5,
        "title": "Уточнение поручений",
        "source": "ПВТР",
        "text": "Если поручение неясно — задайте вопрос сразу."
    },
    {
        "day": 6,
        "title": "Корпоративная переписка",
        "source": "Кодекс этики",
        "text": "Пишите кратко, корректно, уважительно. Соблюдайте деловой стиль."
    },
    {
        "day": 7,
        "title": "Конфиденциальность информации",
        "source": "Политика безопасности",
        "text": "Не разглашайте служебную информацию. Соблюдайте NDA."
    },
    {
        "day": 8,
        "title": "Умение слушать",
        "source": "Soft Skills",
        "text": "Слушайте внимательно, не перебивайте, проявляйте интерес к мнению коллег."
    },
    {
        "day": 9,
        "title": "Работа с документами",
        "source": "Процессы",
        "text": "Ведите документацию аккуратно, своевременно заполняйте отчеты."
    },
    {
        "day": 10,
        "title": "Конфиденциальность",
        "source": "Политика безопасности",
        "text": "Защищайте персональные данные, соблюдайте GDPR и локальные законы."
    },
    {
        "day": 11,
        "title": "Командная работа",
        "source": "Корпоративная культура",
        "text": "Работайте в команде, поддерживайте коллег, делитесь знаниями."
    },
    {
        "day": 12,
        "title": "Инициативность",
        "source": "Корпоративная культура",
        "text": "Предлагайте идеи, не ждите указаний, проявляйте инициативу."
    },
    {
        "day": 13,
        "title": "Обучение и развитие",
        "source": "HR политика",
        "text": "Используйте возможности обучения, развивайте навыки, инвестируйте в себя."
    },
    {
        "day": 14,
        "title": "Представительство от КМГ",
        "source": "Бренд гайдлайны",
        "text": "Представляйте компанию достойно, соблюдайте имидж КМГ."
    },
    {
        "day": 15,
        "title": "Инструктажи и безопасность",
        "source": "ТБ/ПБ/ИБ",
        "text": "Соблюдайте правила техники безопасности, производственной и информационной безопасности."
    },
    {
        "day": 16,
        "title": "Управление временем",
        "source": "Productivity",
        "text": "Планируйте день, приоритизируйте задачи, избегайте прокрастинации."
    },
    {
        "day": 17,
        "title": "Решение конфликтов",
        "source": "Soft Skills",
        "text": "Решайте конфликты конструктивно, обращайтесь к руководителю при необходимости."
    },
    {
        "day": 18,
        "title": "Обратная связь",
        "source": "Корпоративная культура",
        "text": "Давайте и принимайте обратную связь конструктивно, развивайтесь."
    },
    {
        "day": 19,
        "title": "Здоровье и благополучие",
        "source": "HR политика",
        "text": "Заботьтесь о здоровье, используйте программы wellness, поддерживайте баланс."
    },
    {
        "day": 20,
        "title": "Социальная ответственность",
        "source": "Корпоративная культика",
        "text": "Участвуйте в социальных проектах, поддерживайте инициативы компании."
    },
    {
        "day": 21,
        "title": "Инновации и улучшения",
        "source": "Стратегия развития",
        "text": "Предлагайте улучшения, экспериментируйте, внедряйте инновации."
    },
    {
        "day": 22,
        "title": "Карьерный рост",
        "source": "HR политика",
        "text": "Планируйте карьеру, обсуждайте цели с руководителем, развивайтесь."
    },
    {
        "day": 23,
        "title": "Заключение и ценности КМГ",
        "source": "Миссия компании",
        "text": "Помните о ценностях КМГ: честность, профессионализм, инновации, командная работа."
    }
]

# ============================================================================
# 2. RAG СЕРВИС
# ============================================================================

class RAGService:
    """RAG сервис для онбординга КМГ"""
    
    def __init__(self, groq_api_key: str = None):
        """
        Инициализация RAG сервиса
        
        Args:
            groq_api_key: API ключ Groq
        """
        self.groq_api_key = groq_api_key
        self.groq_client = Groq(api_key=groq_api_key)
        
        # Загрузка модели embeddings
        print("🔄 Загрузка модели embeddings...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Создание embeddings для всех ВНД карточек
        print("🔄 Создание embeddings для 23 ВНД...")
        self.vnd_cards = VND_CARDS
        self.embeddings = self.embedding_model.encode(
            [card['text'] for card in self.vnd_cards],
            convert_to_numpy=True
        )
        print(f"✓ Готово! Загружено {len(self.vnd_cards)} ВНД карточек")
    
    def search_relevant_documents(self, question: str, top_k: int = 3) -> list:
        """
        Поиск релевантных ВНД документов
        
        Args:
            question: Вопрос пользователя
            top_k: Количество топ результатов
        
        Returns:
            Список релевантных документов с relevance score
        """
        # Создать embedding для вопроса
        question_embedding = self.embedding_model.encode([question], convert_to_numpy=True)
        
        # Вычислить similarity
        similarities = cosine_similarity(question_embedding, self.embeddings)[0]
        
        # Получить топ K результатов
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            results.append({
                'day': self.vnd_cards[idx]['day'],
                'title': self.vnd_cards[idx]['title'],
                'text': self.vnd_cards[idx]['text'],
                'source': self.vnd_cards[idx]['source'],
                'relevance': float(similarities[idx])
            })
        
        return results
    
    def generate_response(self, question: str) -> dict:
        """
        Генерация ответа на вопрос
        
        Args:
            question: Вопрос пользователя
        
        Returns:
            Словарь с ответом и источниками
        """
        # Поиск релевантных документов
        relevant_docs = self.search_relevant_documents(question, top_k=3)
        
        # Подготовка контекста
        context = "\n\n".join([
            f"День {doc['day']}: {doc['title']}\n{doc['text']}"
            for doc in relevant_docs
        ])
        
        # Создание промпта
        prompt = f"""Ты - Digital Buddy, помощник по онбордингу в компании КМГ.
Ответь на вопрос сотрудника, используя информацию из внутренних нормативных документов (ВНД).

КОНТЕКСТ ИЗ ВНД:
{context}

ВОПРОС СОТРУДНИКА:
{question}

ТРЕБОВАНИЯ К ОТВЕТУ:
- Ответь на русском языке
- Будь дружелюбным и профессиональным
- Используй информацию из контекста
- Если информации недостаточно, предложи обратиться к руководителю
- Ответ должен быть понятным и полезным

ОТВЕТ:"""
        
        # Запрос к Groq LLM
        message = self.groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024
        )
        
        answer = message.choices[0].message.content
        
        return {
            'answer': answer,
            'sources': relevant_docs,
            'question': question
        }
    
    def analyze_sentiment(self, text: str) -> str:
        """
        Анализ тональности текста
        
        Args:
            text: Текст для анализа
        
        Returns:
            Тональность (positive/negative/neutral)
        """
        prompt = f"""Определи тональность следующего текста.
Ответь одним словом: positive, negative или neutral.

Текст: {text}

Тональность:"""
        
        message = self.groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=10
        )
        
        sentiment = message.choices[0].message.content.strip().lower()
        
        # Нормализация
        if 'positive' in sentiment or 'позитив' in sentiment:
            return 'positive'
        elif 'negative' in sentiment or 'негатив' in sentiment:
            return 'negative'
        else:
            return 'neutral'
    
    def add_document(self, day: int, title: str, text: str, source: str = "Custom"):
        """
        Добавить новый документ в базу
        
        Args:
            day: День онбординга
            title: Название документа
            text: Содержимое
            source: Источник
        """
        new_card = {
            'day': day,
            'title': title,
            'text': text,
            'source': source
        }
        
        self.vnd_cards.append(new_card)
        
        # Пересчитать embeddings
        new_embedding = self.embedding_model.encode([text], convert_to_numpy=True)
        self.embeddings = np.vstack([self.embeddings, new_embedding])
    
    def get_documents(self) -> list:
        """
        Получить все документы
        
        Returns:
            Список всех ВНД карточек
        """
        return self.vnd_cards
    
    def get_document_by_day(self, day: int) -> dict:
        """
        Получить документ по дню
        
        Args:
            day: День онбординга
        
        Returns:
            Документ или None
        """
        for card in self.vnd_cards:
            if card['day'] == day:
                return card
        return None

# ============================================================================
# 3. ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    # Ключ берём ТОЛЬКО из окружения (например, ai-module/.env) — не хардкодим в коде.
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise SystemExit("Задайте GROQ_API_KEY в окружении (см. ai-module/.env.example)")
    rag = RAGService(groq_api_key=GROQ_API_KEY)
    
    # Тестовые вопросы
    test_questions = [
        "Как одеваться на работу?",
        "Что делать если я опаздываю?",
        "Как правильно писать письма коллегам?",
        "Какие правила безопасности нужно соблюдать?"
    ]
    
    print("\n" + "="*80)
    print("🤖 ТЕСТИРОВАНИЕ RAG СЕРВИСА")
    print("="*80)
    
    for question in test_questions:
        print(f"\n❓ Вопрос: {question}")
        print("-" * 80)
        
        result = rag.generate_response(question)
        
        print(f"✓ Ответ:")
        print(f"{result['answer']}")
        
        print(f"\n📚 Источники:")
        for source in result['sources']:
            print(f"  - День {source['day']}: {source['title']} (релевантность: {source['relevance']:.2f})")
