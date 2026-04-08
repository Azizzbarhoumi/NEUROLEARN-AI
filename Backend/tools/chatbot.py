"""
AI Task 2 - Adaptive Content & Feedback Engine
Receives profile JSON from AI Task 1.
Generates explanation in the correct format per style.
Routes each style to the correct API.
"""
import json
from tools import ask_groq, ask_mistral, ask_openrouter


def _get_language_instruction(language: str) -> str:
    """Get language instruction for LLM prompts."""
    lang_map = {
        "en": "Respond in English.",
        "fr": "Respond in French. All content must be in French.",
        "ar": "Respond in Arabic. All content must be in Arabic."
    }
    return lang_map.get(language, "Respond in English.")


def explain_topic(topic: str, style: str, subject: str = "general", language: str = "en") -> dict:
    """
    AI Task 2 - Generate explanation matched to student's style.

    Args:
        topic: What the student wants to learn
        style: From AI Task 1 profile["style"]
        subject: Math, Physics, Biology, etc.
        language: Language code (en, fr, ar)

    Returns:
        Structured dict with format field telling frontend how to render
    """
    if style == "logical":
        return _logical(topic, subject, language)
    elif style == "visual_interactive":
        return _interactive_simulation(topic, subject, language)
    elif style == "narrative":
        return _narrative(topic, subject, language)
    elif style == "auditory":
        return _auditory(topic, subject, language)
    # Fallback
    else:
        return _logical(topic, subject, language)


# ── Logical → Groq ─────────────────────────────────────────────

def _logical(topic: str, subject: str, language: str = "en") -> dict:
    system = """You are NeuroLearn AI, an adaptive STEM tutor.
Generate step-by-step logical explanations for students.
CRITICAL: Respond ONLY with raw valid JSON. No markdown. No backticks. No extra text."""

    lang_instruction = _get_language_instruction(language)

    prompt = f"""Explain "{topic}" ({subject}) using clear logical structure.
{lang_instruction}

Return this exact JSON:
{{
    "format": "logical",
    "title": "{topic}",
    "introduction": "one clear sentence introducing the concept",
    "steps": [
        {{
            "step": 1,
            "title": "step title",
            "content": "clear detailed explanation of this step",
            "formula": "formula if applicable, null otherwise",
            "question": "a multiple choice question testing understanding of this step",
            "options": ["option 1", "option 2", "option 3", "option 4"],
            "correct_answer": "the exact string of the correct option from the options array"
        }}
    ],
    "common_mistakes": [
        {{
            "mistake": "description of the mistake",
            "correction": "how to avoid or fix it"
        }}
    ],
    "summary": "one line recap of the full concept",
    "practice_question": "one practice question to test understanding"
}}

Generate 3 to 5 steps. Be thorough and clear."""

    text = ask_groq(system, prompt, max_tokens=1500)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)


# ── Interactive Simulation → OpenRouter ────────────────────────────

def _generate_design_prompt(topic: str, subject: str, language: str = "en") -> str:
    """Step 1: Generate a detailed design prompt for the simulation."""
    system = """You are NeuroLearn AI, an adaptive STEM tutor.
Create detailed visual learning designs for interactive simulations.
CRITICAL: Respond ONLY with raw valid JSON. No markdown. No backticks."""

    lang_instruction = _get_language_instruction(language)

    prompt = f"""Create a detailed visual learning design for an interactive simulation on "{topic}" ({subject}).
{lang_instruction}

Return this exact JSON:
{{
    "format": "design",
    "title": "{topic}",
    "concept_overview": "2-3 sentence overview of the core concept",
    "visual_elements": [
        {{"element": "main object", "description": "what it is and how it animates"}},
        {{"element": "secondary", "description": "supporting visuals"}}
    ],
    "animation_sequence": ["step1", "step2", "step3"],
    "interactions": ["mouse hover does X", "click does Y"],
    "controls": ["slider for speed", "button to reset"],
    "color_usage": {{"primary": "purple for main objects", "accent": "blue for highlights"}},
    "learning_moments": ["moment1", "moment2", "moment3"]
}}"""

    text = ask_openrouter(system, prompt, max_tokens=2000)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        clean = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
    
    return json.dumps(data)


def _interactive_simulation(topic: str, subject: str, language: str = "en") -> dict:
    """Step 2: Generate simulation code from the design prompt."""
    design_prompt = _generate_design_prompt(topic, subject, language)
    
    system = """You are NeuroLearn AI, an adaptive STEM tutor.
Create high-performance interactive HTML5 Canvas simulations.
CRITICAL: Respond ONLY with raw valid JSON. No markdown. No backticks. No extra text."""

    lang_instruction = _get_language_instruction(language)

    prompt = f"""Generate a live interactive simulation based on this design:

{design_prompt}

{lang_instruction}

Return this exact JSON:
{{
    "format": "interactive",
    "title": "{topic}",
    "explanation": "2-3 sentences explaining the science/math shown here",
    "canvas_code": "the complete JavaScript code for the simulation",
    "controls": ["label1", "label2"],
    "key_takeaway": "the most important concept this sim reveals"
}}

Rules for canvas_code:
1. It must be a self-contained string that defines a function: `function init(canvas, colors) {{ ... }}`.
2. The function `init` will be called with the canvas element and a dictionary of colors.
3. Handle window resizing internally or assume canvas.width/height are set.
4. Use `requestAnimationFrame` for a smooth 60fps loop.
5. Use the provided color palette: {{purple: '#7C6FF7', blue: '#60B8FF', green: '#7CF7B5', coral: '#FF8B8B', yellow: '#FFD700'}}.
6. Make it interactive (mouse move or click) if possible.
7. DO NOT use any external libraries.
8. The code MUST include a way to clean up (e.g., return a cleanup function or handle clearing the previous frame).
"""

    text = ask_openrouter(system, prompt, max_tokens=4000)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        clean = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
    
    return data


# ── Narrative → Mistral ────────────────────────────────────────

def _narrative(topic: str, subject: str, language: str = "en") -> dict:
    system = """You are NeuroLearn AI, an adaptive STEM tutor.
Explain topics through engaging stories and real-world analogies.
CRITICAL: Respond ONLY with raw valid JSON. No markdown. No backticks. No extra text."""

    lang_instruction = _get_language_instruction(language)

    prompt = f"""Explain "{topic}" ({subject}) through a compelling story and analogy.
{lang_instruction}

Return this exact JSON:
{{
    "format": "narrative",
    "title": "{topic}",
    "hook": "one exciting opening sentence that immediately grabs the student's attention",
    "story": "a short engaging real-world story or scenario that introduces the concept naturally, 3 to 4 sentences",
    "analogy": "a simple powerful everyday analogy that makes the concept click instantly",
    "explanation": "the actual concept explained naturally through the story context, 3 to 4 sentences",
    "real_world_connection": "how this concept appears and matters in the real world today",
    "key_takeaway": "the single most important thing to remember",
    "practice_question": "a story-based question that tests understanding"
}}"""

    text = ask_mistral(system, prompt, max_tokens=1500)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)


# ── Auditory → Groq ────────────────────────────────────────────

def _auditory(topic: str, subject: str, language: str = "en") -> dict:
    system = """You are NeuroLearn AI, an adaptive STEM tutor.
Explain topics as a warm friendly teacher speaking directly to the student.
Write everything as natural flowing spoken language.
CRITICAL: Respond ONLY with raw valid JSON. No markdown. No backticks. No extra text."""

    lang_instruction = _get_language_instruction(language)

    prompt = f"""Explain "{topic}" ({subject}) as if speaking out loud to a student.
{lang_instruction}

Return this exact JSON:
{{
    "format": "auditory",
    "title": "{topic}",
    "greeting": "warm friendly opening line like a teacher greeting a student",
    "segments": [
        {{
            "segment": 1,
            "title": "segment topic",
            "text": "conversational spoken text. Short flowing sentences. No bullet points. Explain everything verbally as if talking directly to the student face to face."
        }}
    ],
    "analogy": "a simple verbal analogy the student can repeat to themselves out loud",
    "memory_trick": "a catchy verbal trick or short rhyme to remember the key concept",
    "check_in": "a warm friendly spoken question to check if the student understood",
    "encouragement": "a motivating closing message for the student"
}}

Generate exactly 3 segments. Write ALL text as natural spoken language. No bullet points anywhere."""

    text = ask_groq(system, prompt, max_tokens=1500)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)


# ── Follow-up Chat ─────────────────────────────────────────────

from typing import Union, List

def chat_followup(
    topic: str,
    style: str,
    question: str,
    conversation_history: List[dict] = None,
    language: str = "en"
) -> Union[str, dict]:
    if conversation_history is None:
        conversation_history = []

    lang_instruction = _get_language_instruction(language)

    system = f"""You are NeuroLearn AI, an adaptive STEM tutor.
Topic: {topic}
Student learning style: {style}
Answer follow-up questions clearly and concisely in the {style} style.
Be warm, helpful, and encouraging.
{lang_instruction}"""

    history_text = ""
    last_messages = conversation_history[-6:] if conversation_history else []
    for msg in last_messages:
        role = "Student" if msg.get("role") == "user" else "NeuroLearn AI"
        history_text += f"{role}: {msg.get('content', '')}\n\n"

    prompt = f"""Conversation so far:
{history_text if history_text else "This is the first message."}

Student question: {question}

Answer clearly in the {style} learning style. Keep it concise and helpful.
{lang_instruction}"""

    if style == "visual":
        system = f"""You are NeuroLearn AI, an adaptive STEM tutor.
Topic: {topic}
Student learning style: {style}
Answer follow-up questions for visual learners.
{lang_instruction}
CRITICAL: Respond ONLY with raw valid JSON. No markdown. No backticks. No extra text."""
        
        prompt = f"""Conversation so far:
{history_text if history_text else "This is the first message."}

Student question: {question}

Return this exact JSON:
{{
    "response": "clear and concise answer",
    "visual_hint": "description of a diagram or image to help understand the answer",
    "key_term": "the most important term to highlight"
}}
{lang_instruction}"""
        text = ask_groq(system, prompt, max_tokens=800)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            clean = text.replace("```json", "").replace("```", "").strip()
            try:
                return json.loads(clean)
            except:
                return {"response": text, "visual_hint": None, "key_term": None}

    if style == "narrative":
        return ask_mistral(system, prompt, max_tokens=800)
    else:
        return ask_groq(system, prompt, max_tokens=800)