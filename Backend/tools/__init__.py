"""
NeuroLearn AI - Multi-API Router
Logical  → Groq
Visual   → DeepSeek
Gaming   → Groq
Narrative → Mistral
Auditory → Groq + Web Speech API on frontend
"""
import os
from groq import Groq
from mistralai import Mistral
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


def ask_groq(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        temperature=0.5,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content.strip()


def ask_mistral(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
    client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))
    response = client.chat.complete(
        model="mistral-small-latest",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        temperature=0.5,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content.strip()


def ask_deepseek(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
    client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        temperature=0.5,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content.strip()


def ask_openrouter(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
    client = OpenAI(api_key=os.getenv("OPENROUTER_API_KEY"), base_url="https://openrouter.ai/api/v1")
    response = client.chat.completions.create(
        model="qwen/qwen3-coder:free",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        temperature=0.5,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content.strip()


def ask_ai(system_prompt: str, user_prompt: str, style: str = "logical", max_tokens: int = 2000) -> str:
    """
    Route to the correct API based on learning style.
    narrative → Mistral
    visual → OpenRouter Qwen Coder
    everything else → Groq
    """
    if style == "narrative":
        return ask_mistral(system_prompt, user_prompt, max_tokens)
    elif style == "visual":
        return ask_openrouter(system_prompt, user_prompt, max_tokens)
    else:
        return ask_groq(system_prompt, user_prompt, max_tokens)