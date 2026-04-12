"""
Napkin AI Handler - Diagram Generation for Visual Slides
Generates professional diagrams, flowcharts, mind maps from text descriptions.
Downloads and caches images locally to bypass Napkin's auth issues.
"""

import os
import time
import uuid
import requests
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

NAPKIN_API_BASE = "https://api.napkin.ai/v1"

# Local cache directory
CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache", "napkin")
os.makedirs(CACHE_DIR, exist_ok=True)


def generate_napkin_visual(
    text: str, style: str = "colorful", visual_type: str = "auto", language: str = "en"
) -> Optional[dict]:
    """
    Generate a visual using Napkin AI API.
    Downloads and caches the image locally.
    """
    api_key = os.getenv("NAPKIN_API_KEY")
    if not api_key:
        return {"success": False, "error": "NAPKIN_API_KEY not configured"}

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    create_payload = {
        "content": text,
        "style": style,
        "visual_type": visual_type,
        "language": language,
        "num_variations": 1,
        "format": "png",
    }

    try:
        # Step 1: Create visual request
        create_resp = requests.post(
            f"{NAPKIN_API_BASE}/visual",
            headers=headers,
            json=create_payload,
            timeout=30,
        )

        if create_resp.status_code != 201:
            return {
                "success": False,
                "error": f"Create failed: {create_resp.status_code} - {create_resp.text[:200]}",
            }

        create_data = create_resp.json()
        if not isinstance(create_data, dict):
            return {
                "success": False,
                "error": f"Invalid response type: {type(create_data)}",
            }

        request_id = create_data.get("id") or create_data.get("request_id")
        if not request_id:
            return {"success": False, "error": f"No ID returned: {create_data}"}

        # Step 2: Poll for completion
        max_attempts = 30
        for attempt in range(max_attempts):
            time.sleep(3)
            status_resp = requests.get(
                f"{NAPKIN_API_BASE}/visual/{request_id}/status",
                headers=headers,
                timeout=30,
            )

            if status_resp.status_code != 200:
                continue

            status_data = status_resp.json()
            if not isinstance(status_data, dict):
                continue

            status = status_data.get("status")

            if status == "completed":
                files = status_data.get("generated_files", [])
                if isinstance(files, list) and len(files) > 0:
                    file_url = files[0].get("url")
                    if file_url:
                        # Step 3: Download and cache the image locally
                        local_path = _download_and_cache_image(
                            file_url, headers, request_id
                        )
                        if local_path:
                            return {
                                "success": True,
                                "request_id": request_id,
                                "image_url": f"/cache/napkin/{local_path}",
                                "format": "png",
                            }

                        # Fallback: return proxy URL if download fails
                        return {
                            "success": True,
                            "request_id": request_id,
                            "image_url": file_url,
                            "format": "png",
                        }
                return {"success": False, "error": "No files generated"}

            elif status in ["failed", "expired"]:
                return {"success": False, "error": f"Generation {status}"}

        return {"success": False, "error": "Timeout waiting for generation"}

    except requests.exceptions.Timeout:
        return {"success": False, "error": "Request timeout"}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Request error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}


def _download_and_cache_image(
    file_url: str, headers: dict, request_id: str
) -> Optional[str]:
    """Download image from Napkin and save locally."""
    try:
        resp = requests.get(file_url, headers=headers, timeout=30)
        if resp.status_code != 200:
            return None

        # Generate unique filename
        filename = f"{request_id}_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(CACHE_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(resp.content)

        return filename
    except Exception as e:
        print(f"[Napkin] Failed to cache image: {e}")
        return None


def generate_diagram_for_concept(
    concept: str, subject: str, style: str = "colorful"
) -> Optional[dict]:
    """Generate a diagram explaining a specific concept."""
    prompt = f"Explain {concept} in {subject}. Show the key steps, components, and how they connect."
    return generate_napkin_visual(prompt, style=style, visual_type="diagram")
