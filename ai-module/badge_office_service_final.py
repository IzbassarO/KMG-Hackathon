#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Badge Office Automation Service
Полнофункциональный сервис для автоматической генерации корпоративных бейджей

Использование:
    from badge_office_service_final import BadgeOfficeService
    
    service = BadgeOfficeService(groq_api_key="your_key")
    result = service.process_documents(
        memo_pdf="path/to/memo.pdf",
        photo_image="path/to/photo.jpg",
        id_copy="path/to/id.jpg",
        output_dir="./output"
    )
"""

import os
import base64
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from io import BytesIO

# Импорт библиотек
from groq import Groq
from docling.document_converter import DocumentConverter
from PIL import Image, ImageDraw, ImageFont
from pdf2image import convert_from_path
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

# ============================================================================
# ЛОГИРОВАНИЕ
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# ПОИСК ШРИФТОВ С ПОДДЕРЖКОЙ РУССКОГО ЯЗЫКА
# ============================================================================

def find_cyrillic_font(size: int = 24) -> ImageFont.FreeTypeFont:
    """Поиск шрифта с поддержкой кириллицы"""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except:
                continue
    
    return ImageFont.load_default()

def find_cyrillic_font_bold(size: int = 24) -> ImageFont.FreeTypeFont:
    """Поиск жирного шрифта с поддержкой кириллицы"""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ]
    
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except:
                continue
    
    return find_cyrillic_font(size)

# ============================================================================
# КЛАСС СЕРВИСА
# ============================================================================

class BadgeOfficeService:
    """Сервис для автоматической генерации корпоративных бейджей"""
    
    BADGE_WIDTH_MM = 85
    BADGE_HEIGHT_MM = 54
    DPI = 300
    
    def __init__(self, groq_api_key: str, temp_dir: str = "/tmp/badge_office"):
        """
        Инициализация сервиса
        
        Args:
            groq_api_key: API ключ для Groq
            temp_dir: Директория для временных файлов
        """
        self.groq_client = Groq(api_key=groq_api_key)
        self.groq_model = "meta-llama/llama-4-scout-17b-16e-instruct"
        self.converter = DocumentConverter()
        
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(exist_ok=True, parents=True)
        
        self.processing_history: List[Dict[str, Any]] = []
        
        logger.info("Badge Office Service инициализирован")
        logger.info(f"  - Groq Model: {self.groq_model}")
        logger.info(f"  - Badge Size: {self.BADGE_WIDTH_MM}×{self.BADGE_HEIGHT_MM} мм")
        logger.info(f"  - DPI: {self.DPI}")
    
    def _encode_image_to_base64(self, image_path: str) -> str:
        """Кодирование изображения в base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def _get_image_media_type(self, image_path: str) -> str:
        """Определение MIME типа изображения"""
        ext = Path(image_path).suffix.lower()
        media_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        return media_types.get(ext, 'image/jpeg')
    
    def extract_text_from_pdf_docling(self, pdf_path: str) -> str:
        """Извлечение текста из PDF с помощью Docling"""
        try:
            logger.info(f"Обработка PDF: {pdf_path}")
            result = self.converter.convert(pdf_path)
            markdown_text = result.document.export_to_markdown()
            logger.info(f"Текст из PDF извлечен ({len(markdown_text)} символов)")
            return markdown_text
        except Exception as e:
            logger.error(f"Ошибка при обработке PDF: {e}")
            return ""
    
    def extract_fio_from_image_groq(self, image_path: str) -> Optional[str]:
        """Извлечение ФИО из изображения удостоверения через Groq Vision API"""
        try:
            logger.info(f"Извлечение ФИО из изображения: {image_path}")
            
            base64_image = self._encode_image_to_base64(image_path)
            media_type = self._get_image_media_type(image_path)
            
            prompt_text = "Пожалуйста, извлеки полное имя (ФИО) человека из этого документа удостоверения личности. Ответь ТОЛЬКО полным именем на русском языке в формате: Фамилия Имя Отчество. Если отчество не видно, напиши только Фамилия Имя. Не добавляй никакие другие символы или объяснения."
            
            response = self.groq_client.chat.completions.create(
                model=self.groq_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt_text
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{media_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.3,
                max_completion_tokens=100,
            )
            
            fio = response.choices[0].message.content.strip()
            logger.info(f"ФИО извлечено: {fio}")
            return fio if fio else None
        except Exception as e:
            logger.error(f"Ошибка при извлечении ФИО из изображения: {e}")
            return None
    
    def extract_fio_from_pdf_memo(self, pdf_path: str) -> Optional[str]:
        """Извлечение ФИО из служебной записки"""
        try:
            logger.info(f"Извлечение ФИО из служебной записки: {pdf_path}")
            
            text = self.extract_text_from_pdf_docling(pdf_path)
            
            if not text:
                logger.warning("Текст из PDF не извлечен")
                return None
            
            prompt_text = f"Из следующего текста служебной записки извлеки полное имя (ФИО) сотрудника. Ответь ТОЛЬКО полным именем на русском языке в формате: Фамилия Имя Отчество. Если отчество не указано, напиши только Фамилия Имя. Не добавляй никакие другие символы или объяснения.\n\nТекст:\n{text[:2000]}"
            
            response = self.groq_client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[
                    {
                        "role": "user",
                        "content": prompt_text
                    }
                ],
                temperature=0.3,
                max_completion_tokens=100,
            )
            
            fio = response.choices[0].message.content.strip()
            logger.info(f"ФИО из служебной записки: {fio}")
            return fio if fio else None
        except Exception as e:
            logger.error(f"Ошибка при извлечении ФИО: {e}")
            return None
    
    def extract_photo_from_image(self, image_path: str) -> Optional[Image.Image]:
        """Обработка и оптимизация фотографии"""
        try:
            logger.info(f"Обработка фотографии: {image_path}")
            
            img = Image.open(image_path)
            
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img.thumbnail((300, 400), Image.Resampling.LANCZOS)
            
            logger.info(f"Фотография обработана: {img.size}")
            return img
        except Exception as e:
            logger.error(f"Ошибка при обработке фотографии: {e}")
            return None
    
    def extract_photo_from_pdf(self, pdf_path: str) -> Optional[Image.Image]:
        """Извлечение фотографии из PDF"""
        try:
            logger.info(f"Извлечение фотографии из PDF: {pdf_path}")
            
            images = convert_from_path(pdf_path, first_page=1, last_page=1, dpi=150)
            
            if images:
                img = images[0]
                img.thumbnail((300, 400), Image.Resampling.LANCZOS)
                logger.info(f"Фотография из PDF извлечена: {img.size}")
                return img
            
            logger.warning("Не удалось извлечь фотографию из PDF")
            return None
        except Exception as e:
            logger.error(f"Ошибка при извлечении фотографии из PDF: {e}")
            return None
    
    def generate_badge_image(self, fio: str, photo: Image.Image) -> Image.Image:
        """Генерация изображения бейджа"""
        logger.info(f"Генерация изображения бейджа для: {fio}")
        
        width_px = int(self.BADGE_WIDTH_MM * self.DPI / 25.4)
        height_px = int(self.BADGE_HEIGHT_MM * self.DPI / 25.4)
        
        # Создание бейджа с корпоративным цветом
        badge = Image.new('RGB', (width_px, height_px), color=(26, 58, 82))
        draw = ImageDraw.Draw(badge)
        
        # Верхняя полоса (голубая)
        stripe_height = int(height_px * 0.12)
        draw.rectangle(
            [(0, 0), (width_px, stripe_height)],
            fill=(0, 153, 204)
        )
        
        # Вставка фотографии
        if photo:
            photo_width = int(width_px * 0.35)
            photo_height = int(height_px * 0.75)
            photo_resized = photo.resize((photo_width, photo_height), Image.Resampling.LANCZOS)
            
            photo_x = int(width_px * 0.04)
            photo_y = int(stripe_height + (height_px - stripe_height - photo_height) / 2)
            badge.paste(photo_resized, (photo_x, photo_y))
        
        # Позиция текста (справа от фото)
        text_x = int(width_px * 0.42)
        text_y_start = int(stripe_height + height_px * 0.08)
        
        # Загрузка шрифта для ФИО (большой размер) - с поддержкой русского
        font_size = int(height_px * 0.18)
        font_bold = find_cyrillic_font_bold(font_size)
        
        # Разбиение ФИО на две строки если оно длинное
        fio_parts = fio.split()
        if len(fio_parts) == 3:
            # Фамилия Имя на первой строке, Отчество на второй
            line1 = f"{fio_parts[0]} {fio_parts[1]}"
            line2 = fio_parts[2]
        elif len(fio_parts) == 2:
            line1 = fio
            line2 = ""
        else:
            line1 = fio
            line2 = ""
        
        # Вывод первой строки ФИО
        draw.text(
            (text_x, text_y_start),
            line1,
            fill=(255, 255, 255),
            font=font_bold,
            anchor="lm"
        )
        
        # Вывод второй строки ФИО если есть
        if line2:
            draw.text(
                (text_x, text_y_start + int(height_px * 0.20)),
                line2,
                fill=(255, 255, 255),
                font=font_bold,
                anchor="lm"
            )
        
        # Загрузка шрифта для должности (меньший размер) - с поддержкой русского
        small_font_size = int(height_px * 0.09)
        small_font = find_cyrillic_font(small_font_size)
        
        # Вывод должности
        position_y = text_y_start + int(height_px * 0.48)
        draw.text(
            (text_x, position_y),
            "Сотрудник",
            fill=(204, 204, 204),
            font=small_font,
            anchor="lm"
        )
        
        logger.info(f"Изображение бейджа создано: {badge.size}")
        return badge
    
    def generate_badge_pdf(self, fio: str, photo: Image.Image, output_path: str) -> bool:
        """Генерация PDF бейджа"""
        try:
            logger.info(f"Генерация PDF бейджа: {output_path}")
            
            badge_img = self.generate_badge_image(fio, photo)
            
            temp_img_path = str(self.temp_dir / "badge_temp.png")
            badge_img.save(temp_img_path, 'PNG', dpi=(self.DPI, self.DPI))
            
            page_width = self.BADGE_WIDTH_MM * mm
            page_height = self.BADGE_HEIGHT_MM * mm
            
            c = canvas.Canvas(output_path, pagesize=(page_width, page_height))
            c.drawImage(temp_img_path, 0, 0, width=page_width, height=page_height)
            c.save()
            
            os.remove(temp_img_path)
            
            logger.info(f"PDF бейдж создан успешно")
            return True
        except Exception as e:
            logger.error(f"Ошибка при генерации PDF: {e}")
            return False
    
    def generate_badge_png(self, fio: str, photo: Image.Image, output_path: str) -> bool:
        """Генерация PNG бейджа"""
        try:
            logger.info(f"Генерация PNG бейджа: {output_path}")
            
            badge_img = self.generate_badge_image(fio, photo)
            badge_img.save(output_path, 'PNG', dpi=(self.DPI, self.DPI))
            
            logger.info(f"PNG бейдж создан успешно")
            return True
        except Exception as e:
            logger.error(f"Ошибка при генерации PNG: {e}")
            return False
    
    def process_documents(self,
                         memo_pdf: str,
                         photo_image: str,
                         id_copy: Optional[str] = None,
                         consent_pdf: Optional[str] = None,
                         output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Полная обработка документов и генерация бейджа
        
        Args:
            memo_pdf: Путь к служебной записке (PDF)
            photo_image: Путь к фотографии 3×4 (JPG/PNG)
            id_copy: Путь к копии удостоверения (JPG/PNG)
            consent_pdf: Путь к согласию на ПДн (PDF)
            output_dir: Директория для сохранения результатов
            
        Returns:
            Словарь с результатами обработки
        """
        result = {
            'success': False,
            'fio': None,
            'photo': None,
            'badge_png': None,
            'badge_pdf': None,
            'errors': [],
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            logger.info("=" * 60)
            logger.info("НАЧАЛО ОБРАБОТКИ ДОКУМЕНТОВ")
            logger.info("=" * 60)
            
            fio = None
            
            if id_copy and os.path.exists(id_copy):
                logger.info("Извлечение ФИО из копии удостоверения...")
                fio = self.extract_fio_from_image_groq(id_copy)
                if fio:
                    logger.info(f"ФИО извлечено из удостоверения: {fio}")
            
            if not fio:
                logger.info("Извлечение ФИО из служебной записки...")
                fio = self.extract_fio_from_pdf_memo(memo_pdf)
                if fio:
                    logger.info(f"ФИО извлечено из служебной записки: {fio}")
            
            if not fio:
                error_msg = "Не удалось извлечь ФИО из документов"
                logger.error(error_msg)
                result['errors'].append(error_msg)
                return result
            
            result['fio'] = fio
            
            logger.info("Извлечение фотографии...")
            photo = self.extract_photo_from_image(photo_image)
            
            if not photo:
                error_msg = "Не удалось обработать фотографию"
                logger.error(error_msg)
                result['errors'].append(error_msg)
                return result
            
            logger.info("Фотография обработана успешно")
            
            logger.info("Генерация бейджей...")
            
            if output_dir is None:
                output_dir = str(self.temp_dir)
            else:
                Path(output_dir).mkdir(exist_ok=True, parents=True)
            
            png_filename = f"badge_{fio.replace(' ', '_')}_{int(datetime.now().timestamp())}.png"
            png_path = os.path.join(output_dir, png_filename)
            if self.generate_badge_png(fio, photo, png_path):
                result['badge_png'] = png_path
                logger.info(f"PNG бейдж создан: {png_path}")
            
            pdf_filename = f"badge_{fio.replace(' ', '_')}_{int(datetime.now().timestamp())}.pdf"
            pdf_path = os.path.join(output_dir, pdf_filename)
            if self.generate_badge_pdf(fio, photo, pdf_path):
                result['badge_pdf'] = pdf_path
                logger.info(f"PDF бейдж создан: {pdf_path}")
            
            result['success'] = True
            result['photo'] = photo
            
            self.processing_history.append(result)
            
            logger.info("=" * 60)
            logger.info("ОБРАБОТКА ДОКУМЕНТОВ ЗАВЕРШЕНА УСПЕШНО!")
            logger.info("=" * 60)
            
        except Exception as e:
            error_msg = f"Ошибка обработки: {str(e)}"
            logger.error(error_msg)
            result['errors'].append(error_msg)
        
        return result
    
    def get_statistics(self) -> Dict[str, Any]:
        """Получение статистики обработки"""
        total = len(self.processing_history)
        successful = sum(1 for r in self.processing_history if r['success'])
        failed = total - successful
        
        stats = {
            'total_processed': total,
            'successful': successful,
            'failed': failed,
            'success_rate': (successful / total * 100) if total > 0 else 0,
            'processed_names': [r['fio'] for r in self.processing_history if r['success']],
            'errors': [r['errors'] for r in self.processing_history if r['errors']]
        }
        
        return stats


if __name__ == "__main__":
    print("Badge Office Automation Service")
    print("Импортируй этот модуль в свой проект:")
    print("  from badge_office_service_final import BadgeOfficeService")
