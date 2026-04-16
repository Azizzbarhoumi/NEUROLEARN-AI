"""
PDF Converter Tool
Extracts text from student PDF and converts it to their learning style.
Routes to correct API based on style.
"""
import fitz
from tools import ask_groq, ask_mistral, ask_openrouter

STYLE_GUIDES = {
    "visual": """Convert into VISUAL format:
- Structure the content STRICTLY as a sequence of SLIDES
- Use clear bullet points and numbered lists
- STRICTLY LIMIT text: use very few words, maximum 3 short bullet points per slide
- Use visual separators like `---` between slides
- Use emojis for bullet points and slide titles
- Very crisp and concise explanations""",

    "narrative": """Convert into NARRATIVE format:
- Rewrite as an engaging story-like explanation
- Open with a real-world scenario introducing the main concept
- Use analogies connecting to familiar everyday things
- Build from concrete examples to abstract rules
- Make it read like an interesting article not a textbook
- End with a real-world connection""",

    "logical": """Convert into LOGICAL format:
- Start with a clear overview of all key concepts
- Break every concept into numbered step-by-step breakdowns
- State all rules and formulas explicitly and clearly
- Show worked examples for every procedure
- Build from simple to complex in strict order
- End with a structured summary of all key rules and formulas""",

    "auditory": """Convert into AUDITORY format:
- Rewrite as if a friendly teacher speaks directly to the student
- Use short natural sentences that flow when read aloud
- Repeat and reinforce key ideas in different words
- Avoid heavy bullet points — use flowing paragraphs
- Include verbal memory tricks and mnemonics
- End with a verbal summary the student can repeat"""
}


def extract_text(pdf_bytes: bytes) -> tuple:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    page_count = len(doc)
    for i, page in enumerate(doc):
        content = page.get_text()
        if content.strip():
            text += f"\n--- Page {i + 1} ---\n{content}"
    doc.close()
    return text.strip(), page_count


def convert_pdf(pdf_bytes: bytes, style: str, focus: str = "full summary", language: str = "en") -> dict:
    raw_text, page_count = extract_text(pdf_bytes)

    if not raw_text:
        return {
            "success": False,
            "error": "Could not extract text. The PDF may be a scanned image. Please use a text-based PDF."
        }

    # Ensure proper UTF-8 encoding, especially for Arabic
    try:
        raw_text = raw_text.encode('utf-8', errors='replace').decode('utf-8')
    except Exception:
        pass

    original_length = len(raw_text)

    if len(raw_text) > 8000:
        raw_text = raw_text[:8000] + "\n\n[Content truncated — first 8000 characters shown]"

    style_guide = STYLE_GUIDES.get(style, STYLE_GUIDES["logical"])
    
    # Language-specific instruction (simpler format for API compatibility)
    lang_map = {
        "en": "en",
        "fr": "fr",
        "ar": "ar"
    }
    target_lang = lang_map.get(language, "en")
    
    lang_prompt_suffix = {
        "en": "",
        "fr": "\n\nIMPORTANT: Respond in French (Francais). All content must be in French.",
        "ar": "\n\nIMPORTANT: Respond in Arabic. All content must be written in Arabic language."
    }.get(language, "")

    system = f"""You are NeuroLearn AI, an educational assistant.
Convert academic course material into personalized learning content.
Student learning style: {style.upper()}
Always produce content that perfectly matches their learning style.
CRITICAL: Preserve all mathematical equations, formulas, and special notation exactly as-is.
CRITICAL: For Arabic content with mathematics: Keep equations in their original format (use LaTeX or plain math notation).
{lang_prompt_suffix}"""

    prompt = f"""Here is the content from the student's PDF:

{raw_text}

Convert this into personalized learning material for a student.
Style: {style.upper()}
Focus: {focus}

IMPORTANT INSTRUCTIONS:
1. Preserve ALL mathematical equations, formulas, and symbols EXACTLY as they appear
2. For equations, use LaTeX notation when possible or keep mathematical symbols intact
3. Maintain all numerical references and citations
4. Keep technical terminology in the original language when appropriate

Style requirements:
{style_guide}

Structure your response with exactly these 3 sections:

## Quick Summary
3 to 4 sentences summarizing the main topic and key points. Include any key mathematical concepts.

## {style.title()} Learning Content
The full converted content following all style requirements above.
REMEMBER: Do NOT simplify or change mathematical equations - preserve them exactly.
{ "CRITICAL: For 'visual' style, format the content as distinct slides (e.g., '### 🌟 Slide 1: Title'). Keep text extremely short." if style == 'visual' else "" }
{ "CRITICAL: You MUST include EXACTLY ONE diagram prompt. Use this EXACT format on a new line: [DIAGRAM_PROMPT: description of the diagram] (e.g. [DIAGRAM_PROMPT: Flowchart of photosynthesis])" if style == 'visual' else "" }

## Key Points to Remember
Exactly 5 bullet points of the most important things from this document. Include key equations or formulas."""

    converted = None
    
    # for Arabic, prioritize providers that handle it better
    if language == "ar":
        # Try OpenRouter first for Arabic (better multilingual support)
        try:
            converted = ask_openrouter(system, prompt, max_tokens=2000)
        except Exception as e:
            # Fallback to Mistral
            try:
                converted = ask_mistral(system, prompt, max_tokens=2000)
            except Exception as e2:
                # Final fallback to Groq
                try:
                    converted = ask_groq(system, prompt, max_tokens=2000)
                except Exception as e3:
                    return {
                        "success": False,
                        "error": f"Failed to convert PDF in Arabic: {str(e3)}"
                    }
    else:
        # For other languages, use standard priority
        try:
            if style == "narrative":
                converted = ask_mistral(system, prompt, max_tokens=2000)
            else:
                converted = ask_groq(system, prompt, max_tokens=2000)
        except Exception as e:
            # Fallback to alternative LLM
            try:
                converted = ask_openrouter(system, prompt, max_tokens=2000)
            except Exception as e2:
                return {
                    "success": False,
                    "error": f"Failed to convert PDF: {str(e2)}"
                }
    
    if not converted:
        return {
            "success": False,
            "error": "Failed to generate content from PDF"
        }

    if style == "visual":
        import re
        import urllib.parse
        from tools.napkin_handler import generate_napkin_visual
        from tools.mermaid_handler import generate_mermaid_svg

        match = re.search(r'\[DIAGRAM_PROMPT:\s*(.*?)\]', converted, re.DOTALL | re.IGNORECASE)
        diagram_prompt = match.group(1).strip() if match else "A general flowchart or mind map explaining the main concepts."
        
        # 1. Try Napkin
        res = generate_napkin_visual(diagram_prompt, "colorful", "auto", "en")
        if res and res.get("success") and res.get("image_url"):
            img_md = f"\n![Educational Diagram]({res['image_url']})\n"
            if match: converted = converted.replace(match.group(0), img_md)
            else: converted += img_md
        else:
            # 2. Fallback to Mermaid
            m_res = generate_mermaid_svg(diagram_prompt, "en")
            if m_res and m_res.get("success") and m_res.get("mermaid_code"):
                m_md = f"\n```mermaid\n{m_res['mermaid_code']}\n```\n"
                if match: converted = converted.replace(match.group(0), m_md)
                else: converted += m_md
            else:
                # 3. Fallback Pollinations / text
                encoded = urllib.parse.quote(diagram_prompt)
                default_img = f"\n![Diagram](https://image.pollinations.ai/prompt/{encoded}?width=800&height=400&nologo=true)\n"
                if match: converted = converted.replace(match.group(0), default_img)
                else: converted += default_img

    return {
        "success": True,
        "style": style,
        "focus": focus,
        "pages_processed": page_count,
        "original_length": original_length,
        "converted_content": converted
    }