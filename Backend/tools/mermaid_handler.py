"""
Mermaid Handler - Mermaid Diagram Code Generation for Visual Slides
Generates Mermaid diagram code when Napkin API fails.
The frontend renders the SVG using the mermaid npm package.
"""

import re
import sys
from dotenv import load_dotenv
from tools import ask_groq

load_dotenv()


def generate_mermaid_svg(diagram_prompt: str, language: str = "en") -> dict:
    """Generate Mermaid diagram code from educational prompt."""
    try:
        mermaid_code = _generate_mermaid_code(diagram_prompt, language)
        if not mermaid_code:
            print(
                f"[Mermaid] Failed to generate code for: {diagram_prompt[:50]}...",
                file=sys.stderr,
            )
            return {"success": False, "error": "Failed to generate code"}

        print(f"[Mermaid] Generated: {mermaid_code[:100]}...", file=sys.stderr)
        return {"success": True, "mermaid_code": mermaid_code}

    except Exception as e:
        print(f"[Mermaid] Exception: {e}", file=sys.stderr)
        return {"success": False, "error": str(e)}


def _generate_mermaid_code(diagram_prompt: str, language: str = "en") -> str:
    """Use Groq to generate valid Mermaid flowchart DSL."""

    lang_map = {"en": "English", "fr": "French", "ar": "Arabic"}
    lang_display = lang_map.get(language, "English")

    prompt = f"""Write ONE simple Mermaid flowchart for: {diagram_prompt}

Use ONLY this exact format:

flowchart TD
    A["🌟 Start"] --> B["Step 1"]
    B --> C["Step 2"]
    C --> D["🎯 End"]

Rules:
- Start with flowchart TD
- Use IDs: A, B, C, D 
- Format: ID["Emoji Label"]
- Simple arrow: -->
- Add one emoji at START of each label
- ONE diagram only
- NO extra text before or after"""

    system = (
        "You generate valid Mermaid flowchart code. Output raw code only, no markdown."
    )

    try:
        code = ask_groq(system, prompt, max_tokens=400)
    except Exception as e:
        print(f"[Mermaid] ask_groq error: {e}", file=sys.stderr)
        return None

    if not code:
        print("[Mermaid] Empty response from LLM", file=sys.stderr)
        return None

    code = code.strip()
    code = re.sub(r"^```mermaid\s*\n?", "", code)
    code = re.sub(r"^```\s*\n?", "", code)
    code = re.sub(r"^```\s*", "", code)
    code = re.sub(r"```$", "", code)
    code = code.strip()

    # Validate
    if not code.startswith("flowchart"):
        if code.startswith("graph "):
            code = "flowchart TD\n" + "\n".join(code.split("\n")[1:])
        else:
            print(f"[Mermaid] Invalid start: {code[:50]}", file=sys.stderr)
            return None

    return code
