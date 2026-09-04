import logging
from typing import Dict, Any, List, Tuple
from PIL import Image
import torch
from transformers import pipeline, CLIPProcessor, CLIPModel
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Category definitions and zero-shot prompts
CATEGORIES: Dict[str, str] = {
    "pothole": "a photograph of a road with a pothole",
    "garbage": "a photograph of garbage or waste dumped on a street",
    "road_damage": "a photograph of a cracked or damaged road",
    "waterlogging": "a photograph of a waterlogged or flooded road",
    "infrastructure_damage": "a photo of damaged public infrastructure such as a broken sidewalk, cracked curb, broken pavement, or damaged drain cover",
    "electrical_streetlight_hazard": "a photo of a broken streetlight, damaged electrical pole, or exposed hanging electrical wires",
    "fallen_obstruction": "a photo of a fallen tree, large branch, or bulky debris blocking a road or path",
    "other": "a photograph that does not show a civic infrastructure problem or shows humans or animals in the image"
}

# Base Hazard Severity Weights (Scale 1 to 5)
CATEGORY_SEVERITY: Dict[str, int] = {
    "electrical_streetlight_hazard": 5,
    "fallen_obstruction": 4,
    "waterlogging": 4,
    "pothole": 3,
    "road_damage": 3,
    "infrastructure_damage": 3,
    "garbage": 2,
    "other": 0
}


class CivicAIDetector:
    _instance = None

    def __init__(self):
        self.model_name = settings.CLIP_MODEL_NAME
        logger.info(f"Loading lightweight CLIP Vision & Text Model ({self.model_name})...")
        
        # Disable gradients globally to save memory
        torch.set_grad_enabled(False)
        
        # Load single model instance in eval mode
        self.model = CLIPModel.from_pretrained(self.model_name)
        self.model.eval()
        self.processor = CLIPProcessor.from_pretrained(self.model_name)
        
        # Pre-compute and cache text embeddings for all categories
        self.candidate_labels = list(CATEGORIES.values())
        text_inputs = self.processor(text=self.candidate_labels, return_tensors="pt", padding=True)
        text_outputs = self.model.text_model(**text_inputs)
        pooled_text = text_outputs.pooler_output
        projected_text = self.model.text_projection(pooled_text)
        self.text_features = projected_text / projected_text.norm(dim=-1, keepdim=True)
        
        logger.info("CLIP models loaded and text features cached successfully.")

    @classmethod
    def get_instance(cls) -> "CivicAIDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def extract_embedding(self, image: Image.Image) -> List[float]:
        """
        Extracts a 512-dimensional normalized vector embedding from an image.
        """
        inputs = self.processor(images=image, return_tensors="pt")
        with torch.no_grad():
            vision_outputs = self.model.vision_model(**inputs)
            pooled_img = vision_outputs.pooler_output
            projected_img = self.model.visual_projection(pooled_img)
            embedding = projected_img / projected_img.norm(dim=-1, keepdim=True)
        return embedding.squeeze().tolist()

    def analyze_image(self, image: Image.Image) -> Dict[str, Any]:
        """
        Performs zero-shot classification and embedding extraction with cached embeddings.
        """
        inputs = self.processor(images=image, return_tensors="pt")
        with torch.no_grad():
            vision_outputs = self.model.vision_model(**inputs)
            pooled_img = vision_outputs.pooler_output
            projected_img = self.model.visual_projection(pooled_img)
            image_features = projected_img / projected_img.norm(dim=-1, keepdim=True)
            
            # Compute cosine similarity with cached text features
            similarity = (image_features @ self.text_features.T).squeeze(0)
            probs = torch.softmax(similarity * 100.0, dim=-1)
            
            top_probs, top_indices = torch.topk(probs, k=min(2, len(self.candidate_labels)))
            
            top_confidence = float(top_probs[0].item())
            second_confidence = float(top_probs[1].item()) if len(top_probs) > 1 else 0.0
            margin = top_confidence - second_confidence
            
            top_label = self.candidate_labels[top_indices[0].item()]

        # Map prompt back to category key
        category = "other"
        for cat_key, prompt in CATEGORIES.items():
            if prompt == top_label:
                category = cat_key
                break

        # Confidence & Margin gate
        if (
            top_confidence < settings.CONFIDENCE_THRESHOLD
            or margin < settings.MARGIN_THRESHOLD
        ):
            category = "other"

        # Generate embedding
        embedding = self.extract_embedding(image)
        severity = CATEGORY_SEVERITY.get(category, 1)

        return {
            "category": category,
            "confidence": round(top_confidence, 4),
            "margin": round(margin, 4),
            "is_civic_issue": category != "other",
            "base_severity": severity,
            "embedding": embedding
        }
