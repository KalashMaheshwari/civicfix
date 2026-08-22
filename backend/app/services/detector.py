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
        logger.info(f"Loading CLIP Zero-Shot Classifier & Vision Model ({self.model_name})...")
        self.classifier = pipeline(
            "zero-shot-image-classification",
            model=self.model_name
        )
        self.similarity_model = CLIPModel.from_pretrained(self.model_name)
        self.similarity_processor = CLIPProcessor.from_pretrained(self.model_name)
        logger.info("CLIP models loaded successfully.")

    @classmethod
    def get_instance(cls) -> "CivicAIDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def extract_embedding(self, image: Image.Image) -> List[float]:
        """
        Extracts a 512-dimensional normalized vector embedding from an image.
        """
        inputs = self.similarity_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            vision_outputs = self.similarity_model.vision_model(**inputs)
            pooled = vision_outputs.pooler_output
            projected = self.similarity_model.visual_projection(pooled)
            embedding = projected / projected.norm(dim=-1, keepdim=True)
        return embedding.squeeze().tolist()

    def analyze_image(self, image: Image.Image) -> Dict[str, Any]:
        """
        Performs zero-shot classification and embedding extraction.
        """
        labels = list(CATEGORIES.values())
        results = self.classifier(image, candidate_labels=labels)

        top_result = results[0]
        second_result = results[1] if len(results) > 1 else {"score": 0.0}

        top_label = top_result["label"]
        top_confidence = float(top_result["score"])
        second_confidence = float(second_result["score"])
        margin = top_confidence - second_confidence

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
