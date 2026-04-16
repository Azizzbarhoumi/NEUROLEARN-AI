"""
Text-to-Speech Handler - Voice Output Tool
Converts text to audio using OpenAI TTS API.
Supports multiple languages and voices.
"""
import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Language to voice mapping
# OpenAI TTS works best with specific voices for different languages
LANGUAGE_VOICE_MAP = {
    "en": "nova",      # Clear, natural English voice
    "fr": "echo",      # Works better with Romance languages
    "ar": "shimmer",   # Works better with Arabic/Semitic languages
}

# Language names for OpenAI
LANGUAGE_MODEL_MAP = {
    "en": "en",
    "fr": "fr", 
    "ar": "ar",
}


def text_to_speech(text: str, language: str = "en", voice: str = None) -> dict:
    """
    Convert text to audio (MP3) using OpenAI TTS API.

    Args:
        text: Text to convert to speech
        language: Language code (en, fr, ar)
        voice: Voice choice (nova, onyx, shimmer, etc.)

    Returns:
        dict with audio_base64 (for frontend playback) or file path
    """
    if not text or not text.strip():
        return {
            "success": False,
            "error": "Text cannot be empty"
        }

    # Select voice based on language if not specified
    if voice is None:
        voice = LANGUAGE_VOICE_MAP.get(language, "nova")

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    try:
        response = client.audio.speech.create(
            model="tts-1",  # Fast TTS
            voice=voice,
            input=text,
            speed=1.0,  # Normal speed for learning
            response_format="mp3"
        )

        # Convert to base64 for easy transmission
        audio_base64 = base64.b64encode(response.content).decode('utf-8')

        return {
            "success": True,
            "audio_base64": audio_base64,
            "language": language,
            "voice": voice,
            "format": "audio/mpeg",
            "size_bytes": len(response.content)
        }

    except Exception as e:
        error_msg = str(e)
        # Extract just the error message without Python dict syntax
        if "insufficient_quota" in error_msg or "429" in error_msg:
            error_msg = "OpenAI API quota exceeded. Please check your billing."
        elif "invalid_request_error" in error_msg:
            error_msg = "Invalid text input for TTS."
        else:
            # Clean error message - remove quotes and extra formatting
            error_msg = error_msg.replace("'", '"') if "'" in error_msg else error_msg[:200]
        
        return {
            "success": False,
            "error": error_msg
        }


def batch_text_to_speech(segments: list, language: str = "en") -> dict:
    """
    Convert multiple text segments to audio.

    Args:
        segments: List of text segments
        language: Language code

    Returns:
        dict with list of audio_base64 for each segment
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    voice = LANGUAGE_VOICE_MAP.get(language, "nova")
    audios = []

    try:
        for segment in segments:
            if not segment or not segment.strip():
                continue

            response = client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=segment,
                speed=1.0,
                response_format="mp3"
            )

            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            audios.append({
                "text": segment,
                "audio_base64": audio_base64
            })

        return {
            "success": True,
            "audios": audios,
            "language": language,
            "count": len(audios)
        }

    except Exception as e:
        error_msg = str(e)
        # Extract just the error message without Python dict syntax
        if "insufficient_quota" in error_msg or "429" in error_msg:
            error_msg = "OpenAI API quota exceeded. Please check your billing."
        else:
            error_msg = error_msg.replace("'", '"') if "'" in error_msg else error_msg[:200]
        
        return {
            "success": False,
            "error": error_msg,
            "audios": []
        }
