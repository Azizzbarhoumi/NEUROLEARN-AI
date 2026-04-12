"""Test the full _auditory function including TTS handling."""
import sys, json
sys.path.insert(0, '.')

print("Testing full _auditory function...")
try:
    from tools.chatbot import explain_topic
    result = explain_topic("equations", "auditory", "Math", "en")
    
    print(f"Success! Format: {result.get('format')}")
    print(f"Title: {result.get('title')}")
    print(f"Greeting: {result.get('greeting', 'MISSING')[:80]}")
    print(f"Segments: {len(result.get('segments', []))}")
    if result.get('segments'):
        for i, s in enumerate(result['segments']):
            print(f"  Segment {i+1}: title='{s.get('title', 'MISSING')}', text_len={len(s.get('text', ''))}")
    print(f"Analogy: {result.get('analogy', 'MISSING')[:60]}")
    print(f"Memory trick: {result.get('memory_trick', 'MISSING')[:60]}")
    print(f"Has audio: {result.get('has_audio')}")
    print(f"Note: {result.get('note', 'none')}")
    
except Exception as e:
    print(f"FAILED: {type(e).__name__}: {e}")
