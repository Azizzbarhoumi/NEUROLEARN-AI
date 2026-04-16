"""
AI Task 2 - Adaptive Content & Feedback Engine
Receives profile JSON from AI Task 1.
Generates explanation in the correct format per style.
Routes each style to the correct API.
"""

import json
import os
from tools import ask_groq, ask_mistral, ask_openrouter


def _get_language_instruction(language: str) -> str:
    """Get language instruction for LLM prompts."""
    lang_map = {
        "en": "Respond in English.",
        "fr": "Respond in French. All content must be in French.",
        "ar": "Respond in Arabic. All content must be in Arabic.",
    }
    return lang_map.get(language, "Respond in English.")


def explain_topic(
    topic: str, style: str, subject: str = "general", language: str = "en"
) -> dict:
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
    elif style == "visual":
        return _visual(topic, subject, language)
    elif style == "visual_interactive":
        return _interactive_simulation(topic, subject, language)
    elif style == "narrative":
        return _narrative(topic, subject, language)
    elif style == "auditory":
        return _auditory(topic, subject, language)
    # Fallback
    else:
        return _logical(topic, subject, language)


# ── Visual → Groq + Napkin (Presentation Slides) ────────────────


def _convert_slide_keys_to_list(result: dict, topic: str) -> dict:
    """Helper to convert dict with slide1, slide_1, etc. keys to slides array."""
    import re

    slide_keys = [
        k
        for k in result.keys()
        if k.lower().startswith("slide") and k.lower() != "slides"
    ]
    if slide_keys:
        slides_list = []

        def get_slide_num(k):
            match = re.search(r"(\d+)", k)
            return int(match.group(1)) if match else 999

        for key in sorted(slide_keys, key=get_slide_num):
            slides_list.append(result[key])
        return {
            "format": "slides",
            "title": topic,
            "slides": slides_list,
            "summary": f"Learn about {topic}",
            "key_takeaway": "Keep practicing!",
        }
    return {
        "format": "slides",
        "title": topic,
        "slides": [],
        "summary": "Failed to generate slides",
        "key_takeaway": "Please try again",
    }


def _visual(topic: str, subject: str, language: str = "en") -> dict:
    from tools.napkin_handler import generate_napkin_visual

    system = """You are NeuroLearn AI, creating fun slide presentations for students (ages 10-18).

RULES:
- Dark backgrounds (#1a1a2e, #16213e), light text (#ffffff)
- Use EMOJIS 🌟🔬📊💡🚀🎯📚 in titles
- html_content format: TITLE + EXPLANATION + optional EXAMPLE
- Structure EXACTLY like this:
  - Use <h3> for the main title
  - Use <p> for explanation (2-3 sentences)
  - Use <div class="example"> for optional examples with <div class="example-title">Example:</div>

**CRITICAL REQUIREMENT - diagram_prompt:**
For EVERY slide that explains a concept, process, or example, you MUST include a "diagram_prompt" field with a SPECIFIC description of what educational diagram to create.

GOOD diagram_prompt examples:
- "A visual array showing 3 rows of 4 boxes to illustrate 3×4=12"
- "A flowchart showing the steps: Sun energy → Water absorption → Chlorophyll reaction → Glucose + Oxygen"
- "A labeled diagram of a plant cell showing chloroplasts where photosynthesis occurs"
- "A simple number line from 0 to 12 showing how multiplication works"

BAD (empty or too vague):
- "diagram_prompt": "" - MUST describe the diagram
- "Draw something" - too vague

For each slide, decide:
- If slide explains a concept/process/example → include specific diagram_prompt
- If slide is just intro/title/conclusion → use empty string ""

Respond ONLY with JSON inside ```json code block."""

    lang_instruction = _get_language_instruction(language)

    prompt = f"""Create 8-10 fun educational slides about "{topic}" ({subject}) for {language} speakers.

IMPORTANT HTML STRUCTURE for each slide:
Use this exact format for html_content:

```html
<h3>🌟 Slide Title Here</h3>
<p>This is the explanation - 2-3 sentences describing the concept clearly.</p>
<div class="example">
  <div class="example-title">📝 Example:</div>
  Optional example content here - can be formula, step, or real-world application.
</div>
```

Each slide must have these exact fields:
- slide_number: (integer)
- title: "emoji + title" 
- html_content: the HTML with h3, p, and optional example div
- speaker_notes: "What to say about this slide"
- key_term: "One key term or phrase"
- diagram_prompt: SPECIFIC description of what diagram to create, or "" if not applicable

**DIAGRAM PROMPT REQUIREMENT:**
For slides that explain concepts, processes, or have examples - you MUST provide a specific diagram_prompt describing what the diagram should show.

Good diagram_prompt examples:
- "A 3x4 grid showing 3 rows and 4 columns to visualize 3×4=12"
- "A simple flowchart: Sun → Water roots → Leaf chlorophyll → Sugar + Oxygen"
- "A labeled cross-section of a leaf showing where photosynthesis happens"

Bad (too vague or missing):
- "" - only use for title/conclusion slides
- "Show a diagram" - describe what specifically to show

Wrap in ```json code block."""

    text = ask_groq(system, prompt, max_tokens=3000)

    # Try to extract JSON from markdown code block
    import re

    json_match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
    if json_match:
        text = json_match.group(1).strip()

    try:
        result = json.loads(text)

        # Handle case where result already has "slides" key with array
        if isinstance(result, dict) and "slides" in result:
            slides_data = result.get("slides")
            if isinstance(slides_data, list) and len(slides_data) > 0:
                # Good - slides already in correct format
                result["format"] = "slides"
                # Ensure title is set
                if "title" not in result:
                    result["title"] = topic
            else:
                # slides key exists but is empty or wrong format - try slide keys
                result = _convert_slide_keys_to_list(result, topic)

        # Handle case where LLM returns a dict with slide keys instead of list
        elif isinstance(result, dict) and "slides" not in result:
            result = _convert_slide_keys_to_list(result, topic)

        # Handle case where LLM returns a list (not wrapped in dict)
        if isinstance(result, list):
            result = {
                "format": "slides",
                "title": topic,
                "slides": result,
                "summary": f"Learn about {topic}",
                "key_takeaway": "Keep practicing!",
            }

        # Ensure format field is always present
        if "format" not in result:
            result["format"] = "slides"

        # Generate Napkin diagrams for slides that need them
        slides = result.get("slides", [])

        # Map language codes for Napkin
        lang_map = {"en": "English", "fr": "French", "ar": "Arabic"}
        lang_name = lang_map.get(language, "English")

        # DEBUG: Count slides with diagram_prompt
        diagram_count = 0
        if isinstance(slides, list) and slides:
            for s in slides:
                if isinstance(s, dict) and s.get("diagram_prompt"):
                    diagram_count += 1
        print(
            f"[Visual] Total slides: {len(slides)}, Slides with diagram_prompt: {diagram_count}"
        )

        if isinstance(slides, list) and slides and os.getenv("NAPKIN_API_KEY"):
            for slide in slides:
                if isinstance(slide, dict):
                    diagram_prompt = slide.get("diagram_prompt")
                    if diagram_prompt and diagram_prompt.strip():
                        try:
                            print(
                                f"[Napkin] Generating diagram for slide: {slide.get('title', 'Untitled')}"
                            )
                            # Create a clear, educational prompt for Napkin in the correct language
                            napkin_prompt = f"""Create an educational diagram for {subject} topic: {topic} (in {lang_name}).

Slide concept: {diagram_prompt}

Make it SIMPLE, CLEAR, and EDUCATIONAL for students ages 10-18.
Use labels in {lang_name} and clear visual hierarchy.
The entire diagram text and labels must be in {lang_name}."""

                            diagram_result = generate_napkin_visual(
                                text=napkin_prompt,
                                style="colorful",
                                visual_type="auto",
                            )
                            if diagram_result and diagram_result.get("success"):
                                slide["diagram_image_url"] = diagram_result.get(
                                    "image_url"
                                )
                                print(
                                    f"[Napkin] SUCCESS: {diagram_result.get('image_url')}"
                                )
                            else:
                                print(f"[Napkin] FAILED: {diagram_result}")
                        except Exception as e:
                            print(f"[Napkin] Skipping: {str(e)[:50]}")

        return result

    except json.JSONDecodeError as e:
        # Last resort: try to fix common issues
        clean_text = text.strip()
        # Try removing any markdown code blocks
        clean_text = re.sub(r"^```json?\s*", "", clean_text)
        clean_text = re.sub(r"\s*```$", "", clean_text)
        clean_text = re.sub(r"^```", "", clean_text).strip()

        # Try to find JSON array or object in the response
        json_match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", clean_text)
        if json_match:
            try:
                result = json.loads(json_match.group())
                if isinstance(result, list):
                    result = {
                        "format": "slides",
                        "title": topic,
                        "slides": result,
                        "summary": f"Learn about {topic}",
                        "key_takeaway": "Keep practicing!",
                    }
                return result
            except:
                pass

        return {
            "format": "slides",
            "title": topic,
            "slides": [],
            "summary": f"Failed to parse response: {str(e)[:100]}",
            "key_takeaway": "Please try again",
        }


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
        result = json.loads(text)
        
        # Track whether we could generate audio
        has_audio_components = False
        
        # Generate TTS audio for auditory format
        from tools.tts_handler import text_to_speech
        
        # Generate audio for greeting
        if result.get("greeting"):
            greeting_tts = text_to_speech(result["greeting"], language=language)
            if greeting_tts.get("success") and greeting_tts.get("audio_base64"):
                result["greeting_audio"] = greeting_tts.get("audio_base64")
                has_audio_components = True
        
        # Generate audio for each segment
        if result.get("segments"):
            for segment in result["segments"]:
                if segment.get("text"):
                    segment_tts = text_to_speech(segment["text"], language=language)
                    if segment_tts.get("success") and segment_tts.get("audio_base64"):
                        segment["audio_base64"] = segment_tts.get("audio_base64")
                        has_audio_components = True
        
        # Generate audio for analogy
        if result.get("analogy"):
            analogy_tts = text_to_speech(result["analogy"], language=language)
            if analogy_tts.get("success") and analogy_tts.get("audio_base64"):
                result["analogy_audio"] = analogy_tts.get("audio_base64")
                has_audio_components = True
        
        # Generate audio for memory trick
        if result.get("memory_trick"):
            trick_tts = text_to_speech(result["memory_trick"], language=language)
            if trick_tts.get("success") and trick_tts.get("audio_base64"):
                result["memory_trick_audio"] = trick_tts.get("audio_base64")
                has_audio_components = True
        
        # Generate audio for check-in
        if result.get("check_in"):
            checkin_tts = text_to_speech(result["check_in"], language=language)
            if checkin_tts.get("success") and checkin_tts.get("audio_base64"):
                result["check_in_audio"] = checkin_tts.get("audio_base64")
                has_audio_components = True
        
        # Generate audio for encouragement
        if result.get("encouragement"):
            enc_tts = text_to_speech(result["encouragement"], language=language)
            if enc_tts.get("success") and enc_tts.get("audio_base64"):
                result["encouragement_audio"] = enc_tts.get("audio_base64")
                has_audio_components = True
        
        result["language"] = language
        result["has_audio"] = has_audio_components
        
        # If no audio was generated, add a helpful note
        if not has_audio_components:
            result["note"] = "Audio generation currently unavailable. Text explanation provided."
        
        return result
        
    except json.JSONDecodeError:
        clean = text.replace("```json", "").replace("```", "").strip()
        try:
            result = json.loads(clean)
            result["language"] = language
            result["has_audio"] = False
            result["note"] = "Audio unavailable - text provided"
            return result
        except:
            # Ultimate fallback - return minimal valid response
            return {
                "format": "auditory",
                "title": topic,
                "greeting": f"Let me explain {topic} to you.",
                "segments": [{"segment": 1, "text": text[:500]}],
                "language": language,
                "has_audio": False,
                "note": "Explanation provided in text format"
            }
    except Exception as e:
        # Return text-only version without marking as error
        error_msg = str(e)[:100]
        return {
            "format": "auditory",
            "title": topic,
            "greeting": f"Let me explain {topic} to you.",
            "segments": [{"segment": 1, "text": text[:500] if text else "Please try again later."}],
            "language": language,
            "has_audio": False,
            "note": "Audio unavailable - text explanation provided"
        }


# ── Follow-up Chat ─────────────────────────────────────────────

from typing import Union, List


def chat_followup(
    topic: str,
    style: str,
    question: str,
    conversation_history: List[dict] = None,
    language: str = "en",
) -> Union[str, dict]:
    if conversation_history is None:
        conversation_history = []

    lang_instruction = _get_language_instruction(language)

    # Build conversation history for context
    history_text = ""
    last_messages = conversation_history[-6:] if conversation_history else []
    for msg in last_messages:
        role = "Student" if msg.get("role") == "user" else "NeuroLearn AI"
        history_text += f"{role}: {msg.get('content', '')}\n\n"

    # For auditory style, generate TTS response directly
    if style == "auditory":
        return _generate_auditory_response(
            topic, question, history_text, lang_instruction, language
        )

    # First, detect what type of response would be best
    detection_system = f"""You are NeuroLearn AI, analyzing a student question to determine the best response format.

Current topic: {topic}
Student learning style: {style}
{lang_instruction}

Analyze the question and return ONLY a JSON with:
{{
    "response_type": "text" | "steps" | "slides" | "story" | "diagram",
    "reason": "brief explanation why this format is best"
}}

Choose:
- "steps" if question asks "how", "steps", process, method, way to do something
- "slides" if question asks for overview, summary, or visual explanation of a concept
- "story" if question asks for explanation with analogy, real-world example, or narrative
- "diagram" if question asks for visual comparison, relationship, or simple diagram
- "text" for everything else (clarifications, yes/no, simple explanations)"""

    detection_prompt = f"""Question: {question}

Return only JSON with response_type and reason."""

    detection_result = ask_groq(detection_system, detection_prompt, max_tokens=300)

    # Parse detection result
    try:
        detection = json.loads(
            detection_result.replace("```json", "").replace("```", "").strip()
        )
        response_type = detection.get("response_type", "text")
    except:
        response_type = "text"

    # Now generate the appropriate response based on detected type
    if response_type == "steps":
        return _generate_steps_response(
            topic, style, question, history_text, lang_instruction, language
        )
    elif response_type == "slides":
        return _generate_slides_response(
            topic, style, question, history_text, lang_instruction, language
        )
    elif response_type == "story":
        return _generate_story_response(
            topic, style, question, history_text, lang_instruction, language
        )
    elif response_type == "diagram":
        return _generate_diagram_response(
            topic, style, question, history_text, lang_instruction, language
        )
    else:
        return _generate_text_response(
            topic, style, question, history_text, lang_instruction, language
        )


def _generate_text_response(
    topic: str, style: str, question: str, history_text: str, lang_instruction: str, language: str = "en"
) -> dict:
    """Generate a simple text response. For auditory style, also add TTS audio."""
    system = f"""You are NeuroLearn AI, a friendly STEM tutor.
Topic: {topic}
Student style: {style}
{lang_instruction}

Be clear, concise, and encouraging. Use simple language."""

    prompt = f"""Conversation:
{history_text if history_text else "Start of conversation"}

Student: {question}

Tutor:"""

    text = ask_groq(system, prompt, max_tokens=600)
    result = {"response": text, "format": "text"}
    
    # If auditory style, add TTS audio
    if style == "auditory":
        from tools.tts_handler import text_to_speech
        tts_result = text_to_speech(text, language=language)
        if tts_result.get("success") and tts_result.get("audio_base64"):
            result["audio_base64"] = tts_result.get("audio_base64")
            result["format"] = "auditory"
            result["audio_format"] = "audio/mpeg"
            result["voice"] = tts_result.get("voice")
    
    return result


def _generate_steps_response(
    topic: str, style: str, question: str, history_text: str, lang_instruction: str, language: str = "en"
) -> dict:
    """Generate a step-by-step response. For auditory style, also add TTS audio to each step."""
    system = f"""You are NeuroLearn AI, a STEM tutor.
Topic: {topic}
Student style: {style}
{lang_instruction}
CRITICAL: Respond ONLY with raw valid JSON."""

    prompt = f"""Conversation:
{history_text if history_text else "Start"}

Student asks: {question}

Return this exact JSON format for step-by-step explanation:
{{
    "format": "steps",
    "title": "Clear title for these steps",
    "steps": [
        {{
            "step": 1,
            "title": "Step title",
            "content": "Clear explanation of this step"
        }}
    ],
    "common_mistakes": ["mistake 1", "mistake 2"],
    "summary": "Brief summary"
}}

Generate 3-5 clear steps."""

    text = ask_groq(system, prompt, max_tokens=1200)
    try:
        result = json.loads(text.replace("```json", "").replace("```", "").strip())
        
        # If auditory style, generate TTS for title and summary
        if style == "auditory":
            from tools.tts_handler import text_to_speech
            result["format"] = "auditory"
            
            # Generate audio for title
            if result.get("title"):
                title_tts = text_to_speech(result["title"], language=language)
                if title_tts.get("success") and title_tts.get("audio_base64"):
                    result["title_audio"] = title_tts.get("audio_base64")
            
            # Generate audio for each step content
            if result.get("steps"):
                for step in result["steps"]:
                    if step.get("content"):
                        content_tts = text_to_speech(step["content"], language=language)
                        if content_tts.get("success") and content_tts.get("audio_base64"):
                            step["audio_base64"] = content_tts.get("audio_base64")
            
            # Generate audio for summary
            if result.get("summary"):
                summary_tts = text_to_speech(result["summary"], language=language)
                if summary_tts.get("success") and summary_tts.get("audio_base64"):
                    result["summary_audio"] = summary_tts.get("audio_base64")
        
        return result
    except:
        response_text = text[:500] if text else "Unable to generate steps"
        return {"response": response_text, "format": "text"}


def _generate_slides_response(
    topic: str, style: str, question: str, history_text: str, lang_instruction: str, language: str = "en"
) -> dict:
    """Generate a mini visual response with slides. For auditory style, also add TTS audio."""
    system = f"""You are NeuroLearn AI, creating visual explanations.
Topic: {topic}
{lang_instruction}
CRITICAL: Respond ONLY with raw valid JSON."""

    prompt = f"""Student asks: {question}

Create a quick 3-slide visual explanation:
{{
    "format": "slides",
    "title": "topic from question",
    "slides": [
        {{
            "slide_number": 1,
            "title": "slide title",
            "html_content": "<div style='background:#1a1a2e;color:#fff;padding:20px;'><h1>Title</h1><p>Content</p></div>",
            "key_term": "key term"
        }}
    ],
    "summary": "brief summary",
    "key_takeaway": "one takeaway"
}}

Make HTML self-contained with inline styles, dark backgrounds, emojis."""

    text = ask_groq(system, prompt, max_tokens=1500)
    try:
        result = json.loads(text.replace("```json", "").replace("```", "").strip())
        
        # If auditory style, generate TTS for slides content
        if style == "auditory":
            from tools.tts_handler import text_to_speech
            result["format"] = "auditory"
            
            if result.get("slides"):
                for slide in result["slides"]:
                    content_parts = []
                    if slide.get("title"):
                        content_parts.append(slide["title"])
                    if slide.get("key_term"):
                        content_parts.append(f"Key term: {slide['key_term']}")
                    
                    if content_parts:
                        slide_text = ". ".join(content_parts)
                        slide_tts = text_to_speech(slide_text, language=language)
                        if slide_tts.get("success") and slide_tts.get("audio_base64"):
                            slide["audio_base64"] = slide_tts.get("audio_base64")
            
            # Generate audio for summary
            if result.get("summary"):
                summary_tts = text_to_speech(result["summary"], language=language)
                if summary_tts.get("success") and summary_tts.get("audio_base64"):
                    result["summary_audio"] = summary_tts.get("audio_base64")
        
        return result
    except:
        return {"response": text, "format": "text"}


def _generate_story_response(
    topic: str, style: str, question: str, history_text: str, lang_instruction: str, language: str = "en"
) -> dict:
    """Generate a narrative/story response. For auditory style, also add TTS audio."""
    system = f"""You are NeuroLearn AI, explaining with stories.
Topic: {topic}
{lang_instruction}
CRITICAL: Respond ONLY with raw valid JSON."""

    prompt = f"""Student asks: {question}

Create an engaging story-based explanation:
{{
    "format": "narrative",
    "title": "catchy title",
    "hook": "attention-grabbing opening",
    "story": "short narrative story (2-3 sentences)",
    "analogy": "simple everyday comparison",
    "explanation": "clear explanation",
    "real_world_connection": "where this is used in real life",
    "key_takeaway": "one important point",
    "practice_question": "quick check question"
}}"""

    text = ask_mistral(system, prompt, max_tokens=1000)
    try:
        result = json.loads(text.replace("```json", "").replace("```", "").strip())
        
        # If auditory style, generate TTS for story segments
        if style == "auditory":
            from tools.tts_handler import text_to_speech
            result["format"] = "auditory"
            
            # Generate audio for each major segment
            for field in ["story", "analogy", "explanation", "key_takeaway"]:
                if result.get(field):
                    field_tts = text_to_speech(result[field], language=language)
                    if field_tts.get("success") and field_tts.get("audio_base64"):
                        result[f"{field}_audio"] = field_tts.get("audio_base64")
        
        return result
    except:
        return {"response": text, "format": "text"}


def _generate_diagram_response(
    topic: str, style: str, question: str, history_text: str, lang_instruction: str, language: str = "en"
) -> dict:
    """Generate a diagram response with Napkin. For auditory style, also add TTS audio."""
    system = f"""You are NeuroLearn AI, creating diagram descriptions.
Topic: {topic}
{lang_instruction}
CRITICAL: Respond ONLY with raw valid JSON."""

    prompt = f"""Student asks: {question}

Create a clear diagram description and text explanation:
{{
    "format": "diagram",
    "title": "diagram title",
    "description": "what the diagram shows",
    "diagram_prompt": "clear Napkin prompt for the diagram",
    "text": "brief explanation (2-3 sentences)"
}}"""

    text = ask_groq(system, prompt, max_tokens=600)
    try:
        result = json.loads(text.replace("```json", "").replace("```", "").strip())

        # If Napkin is available, generate the diagram
        if result.get("diagram_prompt") and os.getenv("NAPKIN_API_KEY"):
            from tools.napkin_handler import generate_napkin_visual

            diagram_result = generate_napkin_visual(
                text=f"{topic} - {result['diagram_prompt']}",
                style="colorful",
            )
            if diagram_result and diagram_result.get("success"):
                result["image_url"] = diagram_result.get("image_url")
        
        # If auditory style, generate TTS for text content
        if style == "auditory":
            from tools.tts_handler import text_to_speech
            result["format"] = "auditory"
            
            if result.get("description"):
                desc_tts = text_to_speech(result["description"], language=language)
                if desc_tts.get("success") and desc_tts.get("audio_base64"):
                    result["description_audio"] = desc_tts.get("audio_base64")
            
            if result.get("text"):
                text_tts = text_to_speech(result["text"], language=language)
                if text_tts.get("success") and text_tts.get("audio_base64"):
                    result["text_audio"] = text_tts.get("audio_base64")

        return result
    except:
        return {"response": text, "format": "text"}


def _generate_auditory_response(
    topic: str, question: str, history_text: str, lang_instruction: str, language: str = "en"
) -> dict:
    """Generate an auditory response with TTS audio. Falls back to text-only if TTS fails."""
    system = f"""You are NeuroLearn AI, a friendly STEM tutor speaking to a student.
Topic: {topic}
{lang_instruction}

Write in NATURAL SPOKEN LANGUAGE - as if talking directly to the student.
Short sentences. No bullet points. Warm, encouraging tone."""

    prompt = f"""Conversation:
{history_text if history_text else "Start of conversation"}

Student: {question}

Respond as a warm tutor speaking to the student. Keep it conversational and friendly. Answer the question clearly in 2-3 sentences."""

    try:
        response_text = ask_groq(system, prompt, max_tokens=500)
        
        if not response_text or not response_text.strip():
            return {
                "format": "auditory",
                "response": "I'm unable to process your question right now. Please try again.",
                "language": language
            }

        # Generate TTS audio for the response
        from tools.tts_handler import text_to_speech
        
        tts_result = text_to_speech(response_text, language=language)

        if tts_result.get("success") and tts_result.get("audio_base64"):
            return {
                "format": "auditory",
                "response": response_text,
                "audio_base64": tts_result.get("audio_base64"),
                "audio_format": "audio/mpeg",
                "language": language,
                "voice": tts_result.get("voice")
            }
        else:
            # Graceful fallback: return text response even if TTS fails
            return {
                "format": "auditory",
                "response": response_text,
                "language": language,
                "has_audio": False,
                "fallback_reason": tts_result.get("error", "Audio generation unavailable")
            }
    
    except Exception as e:
        # Emergency fallback
        error_message = str(e)[:100]
        return {
            "format": "auditory",
            "response": "I encountered an issue processing your question. Please try again.",
            "language": language,
            "has_audio": False,
            "fallback_reason": f"System error: {error_message}"
        }
