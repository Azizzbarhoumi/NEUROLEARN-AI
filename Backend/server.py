"""
NeuroLearn AI Backend Server v3.0
Multi-API Architecture:
  Logical   → Groq
  Visual    → Groq (slides JSON)
  Narrative → Mistral
  Auditory  → Groq + OpenAI TTS (Audio)
  Voice     → OpenAI Whisper (Input) + TTS (Output)
"""

import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from tools.style_analyzer import analyze_style, get_quiz_questions
from tools.chatbot import explain_topic, chat_followup
from tools.pdf_converter import convert_pdf
from tools.whisper_handler import transcribe_audio
from tools.tts_handler import text_to_speech

load_dotenv()

app = Flask(__name__)
CORS(app)

VALID_STYLES = ["visual", "narrative", "logical", "auditory", "visual_interactive"]


# ── Health Check ───────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify(
        {
            "service": "NeuroLearn AI Backend",
            "status": "online",
            "version": "3.0",
            "architecture": {
                "logical": "Groq llama-3.1-8b-instant",
                "visual": "Groq llama-3.1-8b-instant (slides JSON)",
                "narrative": "Mistral mistral-small-latest",
                "auditory": "Groq llama-3.1-8b-instant + OpenAI TTS",
                "voice_input": "OpenAI Whisper",
                "voice_output": "OpenAI TTS",
            },
            "endpoints": {
                "GET  /api/quiz-questions": "Groq generates diagnostic quiz",
                "POST /api/analyze-style": "AI Task 1 - Detect learning style",
                "POST /api/explain": "AI Task 2 - Generate explanation",
                "POST /api/chat": "AI Task 2 - Follow-up question (with audio for auditory)",
                "POST /api/tts": "Text-to-Speech - Convert text to audio",
                "POST /api/convert-pdf": "Convert PDF to student style",
                "POST /api/transcribe": "Whisper - Voice to text",
            },
            "languages_supported": ["en", "fr", "ar"],
            "learning_styles": ["visual", "logical", "narrative", "auditory", "visual_interactive"],
        }
    )


# ── GET Quiz Questions (AI Generated) ─────────────────────────
@app.route("/api/quiz-questions", methods=["GET"])
def quiz_questions_route():
    """
    Groq generates 7 fresh diagnostic quiz questions dynamically.
    Query params:
        language: 'en', 'fr', 'ar' (default: 'en')
    """
    try:
        language = request.args.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        questions = get_quiz_questions(language=language)
        return jsonify({"success": True, "data": questions})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── AI Task 1: Analyze Learning Style ─────────────────────────
@app.route("/api/analyze-style", methods=["POST"])
def analyze_style_route():
    """
    AI Task 1 - Cognitive Profiling Engine
    Input:  { "quiz_answers": [...], "language": "en|fr|ar" }
    Output: { "style": "...", "confidence": 0.87, "description": "...", ... }
    This JSON output is consumed directly by AI Task 2.
    """
    try:
        data = request.get_json()

        if not data or "quiz_answers" not in data:
            return jsonify({"success": False, "error": "quiz_answers is required"}), 400

        if not isinstance(data["quiz_answers"], list):
            return jsonify(
                {"success": False, "error": "quiz_answers must be a list"}
            ), 400

        if len(data["quiz_answers"]) == 0:
            return jsonify(
                {"success": False, "error": "quiz_answers cannot be empty"}
            ), 400

        language = data.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        result = analyze_style(data["quiz_answers"], language=language)

        return jsonify({"success": True, "data": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── AI Task 2: Generate Explanation ───────────────────────────
@app.route("/api/explain", methods=["POST"])
def explain_route():
    """
    AI Task 2 - Adaptive Content Engine
    Input:  { "topic": "...", "style": "...", "subject": "...", "language": "en|fr|ar" }
    Output: { "format": "logical|slides|narrative|auditory", ... }
    Routes to correct API based on style.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "Request body is required"}), 400

        if "topic" not in data:
            return jsonify({"success": False, "error": "topic is required"}), 400

        if "style" not in data:
            return jsonify({"success": False, "error": "style is required"}), 400

        if data["style"] not in VALID_STYLES:
            return jsonify(
                {"success": False, "error": f"style must be one of: {VALID_STYLES}"}
            ), 400

        language = data.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        result = explain_topic(
            topic=data["topic"],
            style=data["style"],
            subject=data.get("subject", "general"),
            language=language,
        )

        return jsonify({"success": True, "data": result})

    except Exception as e:
        error_str = str(e)[:200]  # Truncate long errors to avoid serialization issues
        return jsonify({"success": False, "error": error_str}), 500


# ── AI Task 2: Follow-up Chat ──────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat_route():
    """
    AI Task 2 - Follow-up conversation handler
    Input:  {
        "topic": "...",
        "style": "...",
        "question": "...",
        "conversation_history": [...],
        "language": "en|fr|ar"
    }
    Output: { "response": "..." }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "Request body is required"}), 400

        required = ["topic", "style", "question"]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify(
                {"success": False, "error": f"Missing required fields: {missing}"}
            ), 400

        if data["style"] not in VALID_STYLES:
            return jsonify(
                {"success": False, "error": f"style must be one of: {VALID_STYLES}"}
            ), 400

        language = data.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        result = chat_followup(
            topic=data["topic"],
            style=data["style"],
            question=data["question"],
            conversation_history=data.get("conversation_history", []),
            language=language,
        )

        # Handle both dict and string responses
        if isinstance(result, dict):
            # For complex responses (like auditory with audio)
            response_data = result
        else:
            # For simple string responses
            response_data = {"response": result}

        response_data["question"] = data["question"]
        response_data["style"] = data["style"]

        return jsonify(
            {
                "success": True,
                "data": response_data,
            }
        )

    except Exception as e:
        error_str = str(e)[:200]  # Truncate long errors
        return jsonify({"success": False, "error": error_str}), 500


# ── PDF Converter ──────────────────────────────────────────────
@app.route("/api/convert-pdf", methods=["POST"])
def convert_pdf_route():
    """
    Convert student PDF to their learning style.
    Form data:
        file     : PDF file (required)
        style    : learning style (required)
        focus    : full summary | key concepts | formulas only | examples only (optional)
        language : en, fr, ar (optional, defaults to en)
    """
    try:
        if "file" not in request.files:
            return jsonify(
                {
                    "success": False,
                    "error": "PDF file is required. Send as form-data with key 'file'",
                }
            ), 400

        style = request.form.get("style")
        if not style:
            return jsonify(
                {"success": False, "error": "style is required as a form field"}
            ), 400

        if style not in VALID_STYLES:
            return jsonify(
                {"success": False, "error": f"style must be one of: {VALID_STYLES}"}
            ), 400

        pdf_file = request.files["file"]

        if pdf_file.filename == "":
            return jsonify({"success": False, "error": "No file selected"}), 400

        if not pdf_file.filename.lower().endswith(".pdf"):
            return jsonify({"success": False, "error": "File must be a .pdf"}), 400

        pdf_bytes = pdf_file.read()

        if len(pdf_bytes) == 0:
            return jsonify({"success": False, "error": "PDF file is empty"}), 400

        focus = request.form.get("focus", "full summary")
        language = request.form.get("language", "en")
        
        if language not in ["en", "fr", "ar"]:
            language = "en"

        result = convert_pdf(pdf_bytes, style, focus, language)
        
        if not result.get("success", True):
            return jsonify({
                "success": False,
                "error": result.get("error", "Failed to convert PDF")
            }), 400

        return jsonify({"success": True, "data": result})

    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback.print_exc()
        return jsonify({"success": False, "error": error_msg}), 500


# ── Whisper Voice Input ────────────────────────────────────────
@app.route("/api/transcribe", methods=["POST"])
def transcribe_route():
    """
    Convert student voice recording to text using OpenAI Whisper.
    Form data:
        file : audio file (webm, mp3, wav, m4a)
    Returns transcribed text sent back to chatbot as a question.
    """
    try:
        if "file" not in request.files:
            return jsonify(
                {
                    "success": False,
                    "error": "Audio file is required. Send as form-data with key 'file'",
                }
            ), 400

        audio_file = request.files["file"]

        if audio_file.filename == "":
            return jsonify({"success": False, "error": "No audio file selected"}), 400

        audio_bytes = audio_file.read()

        if len(audio_bytes) == 0:
            return jsonify({"success": False, "error": "Audio file is empty"}), 400

        language = request.form.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        result = transcribe_audio(audio_bytes, audio_file.filename, language=language)

        return jsonify({"success": True, "data": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Text-to-Speech (TTS) ────────────────────────────────────────
@app.route("/api/tts", methods=["POST"])
def tts_route():
    """
    Convert text to speech for auditory learners.
    Input: {
        "text": "text to convert",
        "language": "en|fr|ar",
        "voice": "nova|onyx|shimmer" (optional)
    }
    Output: { "success": true, "data": { "audio_base64": "...", ... } }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "Request body is required"}), 400

        if "text" not in data:
            return jsonify({"success": False, "error": "text is required"}), 400

        if not data["text"].strip():
            return jsonify({"success": False, "error": "text cannot be empty"}), 400

        language = data.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        voice = data.get("voice", None)

        from tools.tts_handler import text_to_speech

        result = text_to_speech(data["text"], language=language, voice=voice)

        if result.get("success"):
            return jsonify({"success": True, "data": result})
        else:
            return jsonify(
                {"success": False, "error": result.get("error", "TTS failed")}
            ), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Image Proxy ─────────────────────────────────────────────────
@app.route("/api/proxy-image", methods=["GET"])
def proxy_image():
    """Proxy to fetch Napkin images that require auth."""
    from urllib.parse import unquote

    url = request.args.get("url")
    if not url:
        return jsonify({"success": False, "error": "No URL provided"}), 400

    url = unquote(url)

    try:
        napkin_key = os.getenv("NAPKIN_API_KEY")
        if not napkin_key:
            return jsonify(
                {"success": False, "error": "NAPKIN_API_KEY not configured"}
            ), 500

        headers = {
            "Authorization": f"Bearer {napkin_key}",
            "Accept": "image/png,image/jpeg,*/*",
        }

        resp = requests.get(url, headers=headers, timeout=30)

        if resp.status_code == 403:
            return jsonify({"success": False, "error": "Napkin auth failed"}), 500
        elif resp.status_code != 200:
            return jsonify(
                {"success": False, "error": f"Napkin error: {resp.status_code}"}
            ), resp.status_code

        content_type = resp.headers.get("Content-Type", "image/png")
        return resp.content, 200, {"Content-Type": content_type}

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Serve Cached Images ─────────────────────────────────────────
@app.route("/cache/napkin/<filename>")
def serve_cached_napkin(filename):
    """Serve locally cached Napkin images."""
    from flask import send_from_directory

    cache_dir = os.path.join(os.path.dirname(__file__), "cache", "napkin")
    return send_from_directory(cache_dir, filename)


# ── Run Server ─────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"""
==============================================
      NeuroLearn AI Backend v3.0
----------------------------------------------
Port      : {port}
Logical   : Groq llama-3.1-8b-instant
Visual    : Groq llama-3.1-8b-instant (slides)
Narrative : Mistral mistral-small-latest
Auditory  : Groq llama-3.1-8b-instant
Voice In  : OpenAI Whisper
Voice Out : Web Speech API (frontend)
----------------------------------------------
http://localhost:{port}/
==============================================
    """)
    app.run(host="0.0.0.0", port=port, debug=True)
