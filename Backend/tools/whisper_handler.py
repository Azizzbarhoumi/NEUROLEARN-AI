"""
Whisper Handler - Voice Input Tool
Converts student voice recording to text using OpenAI Whisper API.
This handles INPUT only. Audio OUTPUT is handled by Web Speech API on frontend.
Free tier: 10 hours/month — more than enough for a prototype.
"""
import os
import tempfile
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Convert student voice recording to text.

    Args:
        audio_bytes: Raw audio bytes (webm, mp3, wav, m4a supported)
        filename: Original filename with extension

    Returns:
        dict with transcribed text
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    extension = filename.split(".")[-1] if "." in filename else "webm"

    with tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=False) as f:
        f.write(audio_bytes)
        temp_path = f.name

    try:
        with open(temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
        return {
            "success": True,
            "text": transcript.text
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        os.unlink(temp_path)