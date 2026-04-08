"""
PDF Converter Tool
Extracts text from student PDF and converts it to their learning style.
Routes to correct API based on style.
"""
import fitz
from tools import ask_groq, ask_mistral

STYLE_GUIDES = {
    "visual": """Convert into VISUAL format:
- Organize with clear headers and subheaders
- Use bullet points and numbered lists throughout
- Create ASCII tables for any comparisons
- Describe exactly what diagrams the student should draw
- Use visual separators between sections
- End with a text-based mind map""",

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


def convert_pdf(pdf_bytes: bytes, style: str, focus: str = "full summary") -> dict:
    raw_text, page_count = extract_text(pdf_bytes)

    if not raw_text:
        return {
            "success": False,
            "error": "Could not extract text. The PDF may be a scanned image. Please use a text-based PDF."
        }

    original_length = len(raw_text)

    if len(raw_text) > 8000:
        raw_text = raw_text[:8000] + "\n\n[Content truncated — first 8000 characters shown]"

    style_guide = STYLE_GUIDES.get(style, STYLE_GUIDES["logical"])

    system = f"""You are NeuroLearn AI.
Convert academic course material into personalized learning content.
Student learning style: {style.upper()}
Always produce content that perfectly matches their learning style."""

    prompt = f"""Here is the content from the student's PDF:

{raw_text}

Convert this into personalized learning material.
Style: {style.upper()}
Focus: {focus}

Style requirements:
{style_guide}

Structure your response with exactly these 3 sections:

## Quick Summary
3 to 4 sentences summarizing the main topic and key points.

## {style.title()} Learning Content
The full converted content following all style requirements above.

## Key Points to Remember
Exactly 5 bullet points of the most important things from this document."""

    if style == "narrative":
        converted = ask_mistral(system, prompt, max_tokens=2000)
    else:
        converted = ask_groq(system, prompt, max_tokens=2000)

    return {
        "success": True,
        "style": style,
        "focus": focus,
        "pages_processed": page_count,
        "original_length": original_length,
        "converted_content": converted
    }