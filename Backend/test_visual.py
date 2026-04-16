"""Test the visual/slides generation."""
import sys
import json
sys.path.insert(0, '.')

print("Testing visual/slides generation...")
try:
    from tools.chatbot import explain_topic
    
    result = explain_topic("photosynthesis", "visual", "Biology", "en")
    
    print(f"\n✅ API Call Successful!")
    print(f"Format: {result.get('format')}")
    print(f"Title: {result.get('title')}")
    
    slides = result.get('slides', [])
    print(f"\nTotal Slides: {len(slides)}")
    
    if slides:
        print("\nSlide Details:")
        for i, slide in enumerate(slides):
            print(f"\n  Slide {i+1}:")
            print(f"    Title: {slide.get('title', 'MISSING')[:60]}")
            print(f"    slide_number: {slide.get('slide_number', 'MISSING')}")
            print(f"    HTML content length: {len(slide.get('html_content', ''))}")
            print(f"    Has diagram_prompt: {bool(slide.get('diagram_prompt'))}")
            if slide.get('diagram_prompt'):
                print(f"    diagram_prompt: {slide.get('diagram_prompt')[:80]}")
            print(f"    Has diagram_image_url: {bool(slide.get('diagram_image_url'))}")
            if slide.get('diagram_image_url'):
                print(f"    Image URL: {slide.get('diagram_image_url')[:60]}")
            print(f"    Key term: {slide.get('key_term', 'NONE')}")
    else:
        print("\n❌ No slides generated!")
        print(f"Full response: {json.dumps(result, indent=2)[:500]}")
        
except Exception as e:
    import traceback
    print(f"\n❌ FAILED: {type(e).__name__}: {e}")
    traceback.print_exc()
