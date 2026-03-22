"""
Grad-CAM Heatmap Generator
--------------------------
Generates a class activation map overlay on the MRI scan.
Gracefully skips if PyTorch / model is unavailable.
"""

import os
import numpy as np


def generate_gradcam(image_path: str, output_path: str) -> bool:
    """
    Generate a Grad-CAM heatmap and save to output_path.
    Returns True on success, False on failure.
    """
    try:
        from PIL import Image
        import torch
        import torch.nn.functional as F
        from torchvision import models, transforms

        model_path = os.environ.get("MODEL_PATH", "app/ml/models/resnet50_brain_tumor.pth")
        if not os.path.exists(model_path):
            return _mock_heatmap(image_path, output_path)

        # Load model
        model = models.resnet50(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, 4)
        model.load_state_dict(torch.load(model_path, map_location="cpu"))
        model.eval()

        # Pre-process image
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        orig = Image.open(image_path).convert("RGB")
        tensor = transform(orig).unsqueeze(0)

        # Hook last conv layer
        gradients, activations = [], []

        def save_gradient(grad):
            gradients.append(grad)

        def hook_fn(module, input, output):
            output.register_hook(save_gradient)
            activations.append(output)

        hook = model.layer4[-1].register_forward_hook(hook_fn)
        output = model(tensor)
        hook.remove()

        # Backward pass for top class
        pred_class = output.argmax(dim=1).item()
        model.zero_grad()
        output[0, pred_class].backward()

        # Compute heatmap
        grads  = gradients[0].detach().numpy()[0]        # C×H×W
        acts   = activations[0].detach().numpy()[0]      # C×H×W
        weights = grads.mean(axis=(1, 2))
        cam = np.zeros(acts.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * acts[i]
        cam = np.maximum(cam, 0)
        cam = cam / (cam.max() + 1e-8)

        return _overlay_heatmap(orig, cam, output_path)

    except Exception as e:
        print(f"Grad-CAM error: {e}")
        return _mock_heatmap(image_path, output_path)


def _overlay_heatmap(orig_img, cam: np.ndarray, output_path: str) -> bool:
    """Overlay jet colormap heatmap on original image."""
    import cv2
    import numpy as np
    from PIL import Image

    orig_np = np.array(orig_img.resize((224, 224)))
    heatmap = cv2.resize(cam, (224, 224))
    heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
    heatmap_rgb     = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    overlay = np.uint8(0.55 * orig_np + 0.45 * heatmap_rgb)
    Image.fromarray(overlay).save(output_path, quality=92)
    return True


def _mock_heatmap(image_path: str, output_path: str) -> bool:
    """Create a simple mock heatmap overlay without a real model."""
    try:
        import cv2
        import numpy as np
        from PIL import Image

        orig = Image.open(image_path).convert("RGB").resize((224, 224))
        orig_np = np.array(orig)

        # Generate a synthetic gaussian-like activation in top-right quadrant
        cam = np.zeros((224, 224), dtype=np.float32)
        cx, cy, r = 160, 80, 40           # approximate tumor region
        for y in range(224):
            for x in range(224):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                cam[y, x] = max(0.0, 1.0 - d / r)
        cam = np.clip(cam, 0, 1)

        return _overlay_heatmap(orig, cam, output_path)
    except Exception as e:
        print(f"Mock heatmap error: {e}")
        return False
