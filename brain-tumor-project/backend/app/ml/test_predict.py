"""
Quick Inference Test
---------------------
Test the predictor on a single image without starting the API.

Usage:
    cd brain-tumor-project/backend
    python -m app.ml.test_predict path/to/mri.jpg
"""

import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.ml.predictor import predict


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else None

    if not path:
        # Create a tiny test image if none provided
        from PIL import Image
        import tempfile, random
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        img = Image.new("RGB", (224, 224), color=(20, 30, 60))
        img.save(tmp.name)
        path = tmp.name
        print(f"No image path provided — using synthetic image: {path}")

    print(f"\nRunning prediction on: {path}")
    result = predict(path)

    print("\n── Result ──────────────────────────────────")
    print(f"  Status:     {result['status']}")
    print(f"  Confidence: {result['confidence']}%")
    print(f"  Type:       {result['type']}")
    print(f"  Grade:      {result['grade']}")
    print(f"  Location:   {result['location']}")
    print(f"  Size:       {result['size']}")
    print(f"\n  Class Probabilities:")
    for cls, prob, _ in result["probabilities"]:
        bar = "█" * int(prob / 5)
        print(f"    {cls:<12} {prob:5.1f}%  {bar}")
    print(f"\n  Recommendation:\n  {result['recommendation']}")


if __name__ == "__main__":
    main()
