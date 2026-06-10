"""
🎯 SENTIMENT ANALYTICS SERVICE - KMG
Анализ переписки с Digital Buddy: тревога, негатив, вовлеченность
Динамика по неделям, тренды, рекомендации для HR
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import statistics
import re
from collections import defaultdict

from groq import Groq
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# ============================================================================
# ТИПЫ ДАННЫХ
# ============================================================================

class SentimentType(str, Enum):
    """Типы тональности"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    ANXIOUS = "anxious"
    ENGAGED = "engaged"

class EngagementLevel(str, Enum):
    """Уровень вовлеченности"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

@dataclass
class ChatMessage:
    """Сообщение в чате"""
    id: str
    role: str  # "user" | "assistant" | "system"
    content: str
    citations: Optional[List[Dict[str, str]]] = None
    createdAt: str = None
    
    def to_dict(self):
        return asdict(self)

@dataclass
class ChatSession:
    """Сессия чата"""
    id: str
    userId: str
    title: str
    messages: List[ChatMessage]
    createdAt: str
    updatedAt: str
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.userId,
            'title': self.title,
            'messages': [m.to_dict() if hasattr(m, 'to_dict') else m for m in self.messages],
            'createdAt': self.createdAt,
            'updatedAt': self.updatedAt
        }

@dataclass
class MessageSentiment:
    """Анализ тональности одного сообщения"""
    messageId: str
    sentiment: SentimentType
    confidence: float  # 0-1
    anxiety_score: float  # 0-1 (тревога)
    negativity_score: float  # 0-1 (негатив)
    engagement_score: float  # 0-1 (вовлеченность)
    keywords: List[str]
    emotion_tags: List[str]
    timestamp: str
    
    def to_dict(self):
        return {
            'messageId': self.messageId,
            'sentiment': self.sentiment.value,
            'confidence': self.confidence,
            'anxiety_score': self.anxiety_score,
            'negativity_score': self.negativity_score,
            'engagement_score': self.engagement_score,
            'keywords': self.keywords,
            'emotion_tags': self.emotion_tags,
            'timestamp': self.timestamp
        }

@dataclass
class WeeklyMetrics:
    """Метрики за неделю"""
    week_start: str
    week_end: str
    avg_sentiment: float  # -1 (negative) to 1 (positive)
    avg_anxiety: float
    avg_negativity: float
    avg_engagement: float
    message_count: int
    user_message_count: int
    assistant_message_count: int
    sentiment_distribution: Dict[str, int]
    engagement_trend: str  # "improving" | "declining" | "stable"
    anxiety_trend: str  # "increasing" | "decreasing" | "stable"
    top_emotions: List[str]
    top_keywords: List[str]
    
    def to_dict(self):
        return asdict(self)

@dataclass
class UserProfile:
    """Профиль пользователя на основе анализа"""
    userId: str
    totalMessages: int
    averageSentiment: float
    averageAnxiety: float
    averageNegativism: float
    averageEngagement: float
    engagementLevel: EngagementLevel
    riskFactors: List[str]  # Факторы риска
    strengths: List[str]  # Сильные стороны
    recommendations: List[str]  # Рекомендации для HR
    weeklyMetrics: List[WeeklyMetrics]
    lastAnalyzedAt: str
    
    def to_dict(self):
        return {
            'userId': self.userId,
            'totalMessages': self.totalMessages,
            'averageSentiment': self.averageSentiment,
            'averageAnxiety': self.averageAnxiety,
            'averageNegativism': self.averageNegativism,
            'averageEngagement': self.averageEngagement,
            'engagementLevel': self.engagementLevel.value,
            'riskFactors': self.riskFactors,
            'strengths': self.strengths,
            'recommendations': self.recommendations,
            'weeklyMetrics': [m.to_dict() for m in self.weeklyMetrics],
            'lastAnalyzedAt': self.lastAnalyzedAt
        }

# ============================================================================
# СЛОВАРИ ДЛЯ АНАЛИЗА
# ============================================================================

ANXIETY_KEYWORDS = {
    'тревога': 0.9, 'беспокой': 0.85, 'волнуюсь': 0.8, 'страх': 0.9,
    'паника': 0.95, 'ужас': 0.9, 'кошмар': 0.85, 'помощь': 0.6,
    'срочно': 0.7, 'срочная': 0.7, 'неуверен': 0.75, 'сомнева': 0.7,
    'ошибка': 0.65, 'проблема': 0.7, 'сложно': 0.6, 'трудно': 0.6,
    'не знаю': 0.65, 'не понимаю': 0.7, 'запутанно': 0.75, 'запутал': 0.75
}

NEGATIVITY_KEYWORDS = {
    'плохо': 0.8, 'ужасно': 0.9, 'отвратительно': 0.95, 'ненавижу': 0.95,
    'раздражает': 0.8, 'бесит': 0.85, 'надоело': 0.8, 'не нравится': 0.75,
    'ошибка': 0.6, 'неправильно': 0.7, 'неправильный': 0.7, 'неудача': 0.85,
    'провал': 0.9, 'катастрофа': 0.95, 'кошмар': 0.85, 'ужас': 0.9,
    'не могу': 0.7, 'невозможно': 0.8, 'никогда': 0.65, 'никто': 0.6
}

ENGAGEMENT_KEYWORDS = {
    'интересно': 0.85, 'увлекательно': 0.9, 'захватывающе': 0.9, 'классно': 0.8,
    'отлично': 0.85, 'замечательно': 0.85, 'восхитительно': 0.9, 'прекрасно': 0.85,
    'спасибо': 0.75, 'благодарю': 0.8, 'помогло': 0.8, 'полезно': 0.8,
    'вопрос': 0.7, 'хочу узнать': 0.8, 'интересует': 0.75, 'нужно разобраться': 0.75,
    'активно': 0.8, 'участвую': 0.85, 'предлагаю': 0.8, 'идея': 0.75
}

POSITIVE_KEYWORDS = {
    'спасибо': 0.8, 'благодарю': 0.85, 'отлично': 0.85, 'замечательно': 0.85,
    'прекрасно': 0.85, 'хорошо': 0.75, 'отлично': 0.85, 'классно': 0.8,
    'помогло': 0.8, 'полезно': 0.8, 'нравится': 0.8, 'люблю': 0.85,
    'восхитительно': 0.9, 'чудесно': 0.85, 'супер': 0.8, 'отлично': 0.85
}

# ============================================================================
# SENTIMENT ANALYTICS SERVICE
# ============================================================================

class SentimentAnalyticsService:
    """Сервис анализа тональности переписки"""
    
    def __init__(self, groq_api_key: str):
        """
        Инициализация сервиса
        
        Args:
            groq_api_key: API ключ Groq
        """
        self.groq_api_key = groq_api_key
        self.groq_client = Groq(api_key=groq_api_key)
        
        # Загрузка модели embeddings для семантического анализа
        print("🔄 Загрузка модели embeddings...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✓ Модель embeddings загружена")
        
        # Кэш анализов
        self.analysis_cache = {}
    
    def _extract_keywords(self, text: str, keyword_dict: Dict[str, float], top_k: int = 5) -> List[Tuple[str, float]]:
        """Извлечение ключевых слов из текста"""
        text_lower = text.lower()
        found_keywords = []
        
        for keyword, score in keyword_dict.items():
            if keyword in text_lower:
                found_keywords.append((keyword, score))
        
        # Сортировка по score и возврат топ K
        found_keywords.sort(key=lambda x: x[1], reverse=True)
        return found_keywords[:top_k]
    
    def _calculate_anxiety_score(self, text: str) -> float:
        """Расчет уровня тревоги (0-1)"""
        keywords = self._extract_keywords(text, ANXIETY_KEYWORDS)
        
        if not keywords:
            return 0.0
        
        # Средний score найденных ключевых слов
        avg_score = statistics.mean([score for _, score in keywords])
        
        # Бонус за множество тревожных слов
        multiplier = min(1.0, len(keywords) * 0.1)
        
        return min(1.0, avg_score * (1 + multiplier))
    
    def _calculate_negativity_score(self, text: str) -> float:
        """Расчет уровня негатива (0-1)"""
        keywords = self._extract_keywords(text, NEGATIVITY_KEYWORDS)
        
        if not keywords:
            return 0.0
        
        avg_score = statistics.mean([score for _, score in keywords])
        multiplier = min(1.0, len(keywords) * 0.1)
        
        return min(1.0, avg_score * (1 + multiplier))
    
    def _calculate_engagement_score(self, text: str) -> float:
        """Расчет уровня вовлеченности (0-1)"""
        keywords = self._extract_keywords(text, ENGAGEMENT_KEYWORDS)
        
        if not keywords:
            return 0.2  # Базовый уровень для нейтральных сообщений
        
        avg_score = statistics.mean([score for _, score in keywords])
        multiplier = min(1.0, len(keywords) * 0.1)
        
        return min(1.0, avg_score * (1 + multiplier))
    
    def _determine_sentiment_type(self, anxiety: float, negativity: float, engagement: float) -> SentimentType:
        """Определение типа тональности"""
        if anxiety > 0.6:
            return SentimentType.ANXIOUS
        elif negativity > 0.6:
            return SentimentType.NEGATIVE
        elif engagement > 0.7:
            return SentimentType.ENGAGED
        elif engagement > 0.5:
            return SentimentType.POSITIVE
        else:
            return SentimentType.NEUTRAL
    
    def _extract_emotion_tags(self, text: str, anxiety: float, negativity: float, engagement: float) -> List[str]:
        """Извлечение эмоциональных тегов"""
        tags = []
        
        if anxiety > 0.6:
            tags.append("тревожный")
        if negativity > 0.6:
            tags.append("негативный")
        if engagement > 0.7:
            tags.append("вовлеченный")
        if engagement > 0.5 and negativity < 0.4:
            tags.append("позитивный")
        if anxiety < 0.3 and negativity < 0.3 and engagement < 0.5:
            tags.append("нейтральный")
        
        # Дополнительные теги на основе текста
        text_lower = text.lower()
        if any(word in text_lower for word in ['спасибо', 'благодарю', 'помогло']):
            tags.append("благодарный")
        if any(word in text_lower for word in ['вопрос', 'как', 'почему', 'что']):
            tags.append("любознательный")
        if any(word in text_lower for word in ['предлагаю', 'идея', 'может быть']):
            tags.append("инициативный")
        
        return list(set(tags))
    
    def analyze_message(self, message: ChatMessage) -> MessageSentiment:
        """
        Анализ одного сообщения
        
        Args:
            message: Сообщение для анализа
        
        Returns:
            Анализ тональности сообщения
        """
        # Пропустить системные сообщения
        if message.role == "system":
            return None
        
        text = message.content
        
        # Расчет метрик
        anxiety_score = self._calculate_anxiety_score(text)
        negativity_score = self._calculate_negativity_score(text)
        engagement_score = self._calculate_engagement_score(text)
        
        # Определение типа тональности
        sentiment_type = self._determine_sentiment_type(anxiety_score, negativity_score, engagement_score)
        
        # Расчет confidence
        max_score = max(anxiety_score, negativity_score, engagement_score)
        confidence = min(1.0, max_score + 0.3)  # Базовый confidence + бонус
        
        # Извлечение ключевых слов
        all_keywords = []
        all_keywords.extend([kw for kw, _ in self._extract_keywords(text, ANXIETY_KEYWORDS, 2)])
        all_keywords.extend([kw for kw, _ in self._extract_keywords(text, NEGATIVITY_KEYWORDS, 2)])
        all_keywords.extend([kw for kw, _ in self._extract_keywords(text, ENGAGEMENT_KEYWORDS, 2)])
        all_keywords = list(set(all_keywords))
        
        # Извлечение эмоциональных тегов
        emotion_tags = self._extract_emotion_tags(text, anxiety_score, negativity_score, engagement_score)
        
        return MessageSentiment(
            messageId=message.id,
            sentiment=sentiment_type,
            confidence=confidence,
            anxiety_score=anxiety_score,
            negativity_score=negativity_score,
            engagement_score=engagement_score,
            keywords=all_keywords,
            emotion_tags=emotion_tags,
            timestamp=message.createdAt or datetime.now().isoformat()
        )
    
    def analyze_session(self, session: ChatSession) -> List[MessageSentiment]:
        """
        Анализ всей сессии
        
        Args:
            session: Сессия для анализа
        
        Returns:
            Список анализов сообщений
        """
        analyses = []
        
        for message in session.messages:
            if isinstance(message, dict):
                message = ChatMessage(**message)
            
            analysis = self.analyze_message(message)
            if analysis:
                analyses.append(analysis)
        
        return analyses
    
    def calculate_weekly_metrics(self, message_analyses: List[MessageSentiment], week_start: datetime) -> WeeklyMetrics:
        """
        Расчет метрик за неделю
        
        Args:
            message_analyses: Анализы сообщений
            week_start: Начало недели
        
        Returns:
            Метрики за неделю
        """
        week_end = week_start + timedelta(days=7)
        
        # Фильтрация сообщений за неделю
        week_messages = [
            m for m in message_analyses
            if week_start.isoformat() <= m.timestamp < week_end.isoformat()
        ]
        
        if not week_messages:
            return None
        
        # Расчет средних значений
        avg_anxiety = statistics.mean([m.anxiety_score for m in week_messages])
        avg_negativity = statistics.mean([m.negativity_score for m in week_messages])
        avg_engagement = statistics.mean([m.engagement_score for m in week_messages])
        
        # Расчет sentiment score (-1 to 1)
        sentiment_score = (avg_engagement - avg_negativity)
        
        # Распределение тональности
        sentiment_dist = defaultdict(int)
        for m in week_messages:
            sentiment_dist[m.sentiment.value] += 1
        
        # Определение тренда
        if len(week_messages) > 1:
            first_half = week_messages[:len(week_messages)//2]
            second_half = week_messages[len(week_messages)//2:]
            
            first_engagement = statistics.mean([m.engagement_score for m in first_half])
            second_engagement = statistics.mean([m.engagement_score for m in second_half])
            engagement_trend = "improving" if second_engagement > first_engagement else ("declining" if second_engagement < first_engagement else "stable")
            
            first_anxiety = statistics.mean([m.anxiety_score for m in first_half])
            second_anxiety = statistics.mean([m.anxiety_score for m in second_half])
            anxiety_trend = "increasing" if second_anxiety > first_anxiety else ("decreasing" if second_anxiety < first_anxiety else "stable")
        else:
            engagement_trend = "stable"
            anxiety_trend = "stable"
        
        # Топ эмоции и ключевые слова
        all_emotions = []
        all_keywords = []
        for m in week_messages:
            all_emotions.extend(m.emotion_tags)
            all_keywords.extend(m.keywords)
        
        emotion_counts = defaultdict(int)
        keyword_counts = defaultdict(int)
        for e in all_emotions:
            emotion_counts[e] += 1
        for k in all_keywords:
            keyword_counts[k] += 1
        
        top_emotions = sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return WeeklyMetrics(
            week_start=week_start.isoformat(),
            week_end=week_end.isoformat(),
            avg_sentiment=sentiment_score,
            avg_anxiety=avg_anxiety,
            avg_negativity=avg_negativity,
            avg_engagement=avg_engagement,
            message_count=len(week_messages),
            user_message_count=sum(1 for m in week_messages if m.sentiment),  # Приблизительно
            assistant_message_count=0,
            sentiment_distribution=dict(sentiment_dist),
            engagement_trend=engagement_trend,
            anxiety_trend=anxiety_trend,
            top_emotions=[e[0] for e in top_emotions],
            top_keywords=[k[0] for k in top_keywords]
        )
    
    def build_user_profile(self, sessions: List[ChatSession]) -> UserProfile:
        """
        Построение профиля пользователя на основе всех сессий
        
        Args:
            sessions: Список сессий пользователя
        
        Returns:
            Профиль пользователя
        """
        all_analyses = []
        
        for session in sessions:
            analyses = self.analyze_session(session)
            all_analyses.extend(analyses)
        
        if not all_analyses:
            return None
        
        # Общие метрики
        total_messages = len(all_analyses)
        avg_anxiety = statistics.mean([m.anxiety_score for m in all_analyses])
        avg_negativity = statistics.mean([m.negativity_score for m in all_analyses])
        avg_engagement = statistics.mean([m.engagement_score for m in all_analyses])
        avg_sentiment = (avg_engagement - avg_negativity)
        
        # Определение уровня вовлеченности
        if avg_engagement > 0.7:
            engagement_level = EngagementLevel.HIGH
        elif avg_engagement > 0.5:
            engagement_level = EngagementLevel.MEDIUM
        else:
            engagement_level = EngagementLevel.LOW
        
        # Факторы риска
        risk_factors = []
        if avg_anxiety > 0.6:
            risk_factors.append("Высокий уровень тревоги")
        if avg_negativity > 0.6:
            risk_factors.append("Выраженный негатив в общении")
        if avg_engagement < 0.3:
            risk_factors.append("Низкая вовлеченность")
        if avg_negativity > 0.5 and avg_anxiety > 0.5:
            risk_factors.append("Комбинированный стресс (тревога + негатив)")
        
        # Сильные стороны
        strengths = []
        if avg_engagement > 0.7:
            strengths.append("Высокая вовлеченность и интерес")
        if avg_anxiety < 0.3:
            strengths.append("Спокойствие и уверенность")
        if avg_negativity < 0.3:
            strengths.append("Позитивный настрой")
        if total_messages > 20:
            strengths.append("Активное использование сервиса")
        
        # Рекомендации для HR
        recommendations = []
        if avg_anxiety > 0.6:
            recommendations.append("Провести check-in с сотрудником, выяснить источники тревоги")
        if avg_negativity > 0.6:
            recommendations.append("Рассмотреть возможность переговора о рабочих условиях")
        if avg_engagement < 0.3:
            recommendations.append("Предложить дополнительное обучение или наставничество")
        if avg_anxiety > 0.5 and avg_engagement < 0.4:
            recommendations.append("Рекомендуется встреча с руководителем для поддержки")
        if avg_engagement > 0.7:
            recommendations.append("Рассмотреть возможность расширения ответственности")
        
        # Расчет недельных метрик
        weekly_metrics = []
        if all_analyses:
            first_date = datetime.fromisoformat(all_analyses[0].timestamp)
            current_week = first_date.replace(hour=0, minute=0, second=0, microsecond=0)
            current_week = current_week - timedelta(days=current_week.weekday())
            
            while current_week < datetime.now():
                weekly = self.calculate_weekly_metrics(all_analyses, current_week)
                if weekly:
                    weekly_metrics.append(weekly)
                current_week += timedelta(days=7)
        
        return UserProfile(
            userId=sessions[0].userId if sessions else "unknown",
            totalMessages=total_messages,
            averageSentiment=avg_sentiment,
            averageAnxiety=avg_anxiety,
            averageNegativism=avg_negativity,
            averageEngagement=avg_engagement,
            engagementLevel=engagement_level,
            riskFactors=risk_factors,
            strengths=strengths,
            recommendations=recommendations,
            weeklyMetrics=weekly_metrics,
            lastAnalyzedAt=datetime.now().isoformat()
        )
    
    def generate_hr_report(self, user_profile: UserProfile) -> str:
        """
        Генерация HR отчета на основе профиля
        
        Args:
            user_profile: Профиль пользователя
        
        Returns:
            Текстовый отчет
        """
        prompt = f"""Создай профессиональный HR отчет на основе следующих данных анализа переписки сотрудника:

ДАННЫЕ:
- Всего сообщений: {user_profile.totalMessages}
- Средний sentiment: {user_profile.averageSentiment:.2f}
- Уровень тревоги: {user_profile.averageAnxiety:.2f}
- Уровень негатива: {user_profile.averageNegativism:.2f}
- Уровень вовлеченности: {user_profile.averageEngagement:.2f}
- Уровень engagement: {user_profile.engagementLevel.value}

ФАКТОРЫ РИСКА:
{json.dumps(user_profile.riskFactors, ensure_ascii=False, indent=2)}

СИЛЬНЫЕ СТОРОНЫ:
{json.dumps(user_profile.strengths, ensure_ascii=False, indent=2)}

РЕКОМЕНДАЦИИ:
{json.dumps(user_profile.recommendations, ensure_ascii=False, indent=2)}

Создай краткий, профессиональный отчет (3-4 абзаца) с выводами и рекомендациями для HR."""
        
        message = self.groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=1024
        )
        
        return message.choices[0].message.content
    
    def get_weekly_comparison(self, user_profile: UserProfile) -> Dict[str, Any]:
        """
        Получить сравнение недель (динамика)
        
        Args:
            user_profile: Профиль пользователя
        
        Returns:
            Данные для графиков
        """
        if len(user_profile.weeklyMetrics) < 2:
            return None
        
        weeks = user_profile.weeklyMetrics[-12:]  # Последние 12 недель
        
        return {
            'weeks': [w.week_start for w in weeks],
            'sentiment': [w.avg_sentiment for w in weeks],
            'anxiety': [w.avg_anxiety for w in weeks],
            'negativity': [w.avg_negativity for w in weeks],
            'engagement': [w.avg_engagement for w in weeks],
            'message_count': [w.message_count for w in weeks],
            'trends': {
                'engagement': weeks[-1].engagement_trend if weeks else 'stable',
                'anxiety': weeks[-1].anxiety_trend if weeks else 'stable'
            }
        }

# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    # Инициализация
    GROQ_API_KEY = ""
    service = SentimentAnalyticsService(groq_api_key=GROQ_API_KEY)
    
    # Тестовые сообщения
    test_messages = [
        ChatMessage(
            id="msg1",
            role="user",
            content="Спасибо за помощь! Это очень интересно и полезно.",
            createdAt=datetime.now().isoformat()
        ),
        ChatMessage(
            id="msg2",
            role="assistant",
            content="Рад помочь! Это важная информация для вашего развития.",
            createdAt=datetime.now().isoformat()
        ),
        ChatMessage(
            id="msg3",
            role="user",
            content="Я беспокоюсь о сроках, это вызывает тревогу.",
            createdAt=datetime.now().isoformat()
        ),
        ChatMessage(
            id="msg4",
            role="user",
            content="Это просто ужасно! Ничего не работает как надо.",
            createdAt=datetime.now().isoformat()
        ),
        ChatMessage(
            id="msg5",
            role="user",
            content="Предлагаю новую идею для улучшения процесса.",
            createdAt=datetime.now().isoformat()
        ),
    ]
    
    print("\n" + "="*80)
    print("🎯 SENTIMENT ANALYTICS SERVICE - ТЕСТИРОВАНИЕ")
    print("="*80)
    
    # Анализ отдельных сообщений
    print("\n📊 АНАЛИЗ СООБЩЕНИЙ:")
    print("-" * 80)
    
    for msg in test_messages:
        analysis = service.analyze_message(msg)
        if analysis:
            print(f"\n💬 Сообщение: {msg.content[:50]}...")
            print(f"   Sentiment: {analysis.sentiment.value}")
            print(f"   Confidence: {analysis.confidence:.2f}")
            print(f"   Anxiety: {analysis.anxiety_score:.2f}")
            print(f"   Negativity: {analysis.negativity_score:.2f}")
            print(f"   Engagement: {analysis.engagement_score:.2f}")
            print(f"   Emotions: {', '.join(analysis.emotion_tags)}")
    
    # Создание тестовой сессии
    test_session = ChatSession(
        id="session1",
        userId="user123",
        title="Onboarding Chat",
        messages=test_messages,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    # Анализ сессии
    session_analyses = service.analyze_session(test_session)
    
    # Построение профиля
    print("\n\n👤 ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:")
    print("-" * 80)
    
    user_profile = service.build_user_profile([test_session])
    
    if user_profile:
        print(f"User ID: {user_profile.userId}")
        print(f"Total Messages: {user_profile.totalMessages}")
        print(f"Average Sentiment: {user_profile.averageSentiment:.2f}")
        print(f"Average Anxiety: {user_profile.averageAnxiety:.2f}")
        print(f"Average Negativity: {user_profile.averageNegativism:.2f}")
        print(f"Average Engagement: {user_profile.averageEngagement:.2f}")
        print(f"Engagement Level: {user_profile.engagementLevel.value}")
        
        print(f"\n⚠️  Risk Factors:")
        for rf in user_profile.riskFactors:
            print(f"   - {rf}")
        
        print(f"\n💪 Strengths:")
        for s in user_profile.strengths:
            print(f"   - {s}")
        
        print(f"\n📋 Recommendations:")
        for r in user_profile.recommendations:
            print(f"   - {r}")
        
        # HR Report
        print(f"\n\n📄 HR REPORT:")
        print("-" * 80)
        report = service.generate_hr_report(user_profile)
        print(report)
    
    print("\n" + "="*80)
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("="*80 + "\n")
