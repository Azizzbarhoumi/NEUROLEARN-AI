"""
NeuroLearn AI Backend Server v3.0
Multi-API Architecture:
  Logical   → Groq
  Visual    → Groq (slides JSON)
  Narrative → Mistral
  Auditory  → Groq + Web Speech API on frontend
  Voice     → OpenAI Whisper
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from tools.style_analyzer import analyze_style, get_quiz_questions
from tools.chatbot import explain_topic, chat_followup
from tools.pdf_converter import convert_pdf
from tools.whisper_handler import transcribe_audio

load_dotenv()

app = Flask(__name__)
CORS(app)

VALID_STYLES = ["visual", "narrative", "logical", "auditory", "visual_interactive"]


# ── Health Check ───────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "service": "NeuroLearn AI Backend",
        "status": "online",
        "version": "3.0",
        "architecture": {
            "logical":    "Groq llama-3.1-8b-instant",
            "visual":     "Groq llama-3.1-8b-instant (slides JSON)",
            "narrative":  "Mistral mistral-small-latest",
            "auditory":   "Groq llama-3.1-8b-instant + Web Speech API",
            "voice_input": "OpenAI Whisper"
        },
        "endpoints": {
            "GET  /api/quiz-questions": "Groq generates diagnostic quiz",
            "POST /api/analyze-style":  "AI Task 1 - Detect learning style",
            "POST /api/explain":        "AI Task 2 - Generate explanation",
            "POST /api/chat":           "AI Task 2 - Follow-up question",
            "POST /api/convert-pdf":    "Convert PDF to student style",
            "POST /api/transcribe":     "Whisper - Voice to text"
        }
    })


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
        return jsonify({
            "success": True,
            "data": questions
        })
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
            return jsonify({
                "success": False,
                "error": "quiz_answers is required"
            }), 400

        if not isinstance(data["quiz_answers"], list):
            return jsonify({
                "success": False,
                "error": "quiz_answers must be a list"
            }), 400

        if len(data["quiz_answers"]) == 0:
            return jsonify({
                "success": False,
                "error": "quiz_answers cannot be empty"
            }), 400

        language = data.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        result = analyze_style(data["quiz_answers"], language=language)

        return jsonify({
            "success": True,
            "data": result
        })

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
            return jsonify({
                "success": False,
                "error": "Request body is required"
            }), 400

        if "topic" not in data:
            return jsonify({
                "success": False,
                "error": "topic is required"
            }), 400

        if "style" not in data:
            return jsonify({
                "success": False,
                "error": "style is required"
            }), 400

        if data["style"] not in VALID_STYLES:
            return jsonify({
                "success": False,
                "error": f"style must be one of: {VALID_STYLES}"
            }), 400

        language = data.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        result = explain_topic(
            topic=data["topic"],
            style=data["style"],
            subject=data.get("subject", "general"),
            language=language
        )

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


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
            return jsonify({
                "success": False,
                "error": "Request body is required"
            }), 400

        required = ["topic", "style", "question"]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {missing}"
            }), 400

        if data["style"] not in VALID_STYLES:
            return jsonify({
                "success": False,
                "error": f"style must be one of: {VALID_STYLES}"
            }), 400

        language = data.get("language", "en")
        if language not in ["en", "fr", "ar"]:
            language = "en"

        result = chat_followup(
            topic=data["topic"],
            style=data["style"],
            question=data["question"],
            conversation_history=data.get("conversation_history", []),
            language=language
        )

        return jsonify({
            "success": True,
            "data": {
                "question": data["question"],
                "response": result,
                "style": data["style"]
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── PDF Converter ──────────────────────────────────────────────
@app.route("/api/convert-pdf", methods=["POST"])
def convert_pdf_route():
    """
    Convert student PDF to their learning style.
    Form data:
        file  : PDF file (required)
        style : learning style (required)
        focus : full summary | key concepts | formulas only | examples only (optional)
    """
    try:
        if "file" not in request.files:
            return jsonify({
                "success": False,
                "error": "PDF file is required. Send as form-data with key 'file'"
            }), 400

        style = request.form.get("style")
        if not style:
            return jsonify({
                "success": False,
                "error": "style is required as a form field"
            }), 400

        if style not in VALID_STYLES:
            return jsonify({
                "success": False,
                "error": f"style must be one of: {VALID_STYLES}"
            }), 400

        pdf_file = request.files["file"]

        if pdf_file.filename == "":
            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400

        if not pdf_file.filename.lower().endswith(".pdf"):
            return jsonify({
                "success": False,
                "error": "File must be a .pdf"
            }), 400

        pdf_bytes = pdf_file.read()

        if len(pdf_bytes) == 0:
            return jsonify({
                "success": False,
                "error": "PDF file is empty"
            }), 400

        focus = request.form.get("focus", "full summary")

        result = convert_pdf(pdf_bytes, style, focus)

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


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
            return jsonify({
                "success": False,
                "error": "Audio file is required. Send as form-data with key 'file'"
            }), 400

        audio_file = request.files["file"]

        if audio_file.filename == "":
            return jsonify({
                "success": False,
                "error": "No audio file selected"
            }), 400

        audio_bytes = audio_file.read()

        if len(audio_bytes) == 0:
            return jsonify({
                "success": False,
                "error": "Audio file is empty"
            }), 400

        result = transcribe_audio(audio_bytes, audio_file.filename)

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


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