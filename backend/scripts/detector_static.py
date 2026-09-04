from transformers import pipeline
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import torch

# ============================================================
# CONFIGURATION
# ============================================================

CONFIDENCE_THRESHOLD = 0.70
MARGIN_THRESHOLD = 0.15


# ============================================================
# CIVIC ISSUE CATEGORIES
# ============================================================

CATEGORIES = {
    "pothole": "a photograph of a road with a pothole",

    "garbage": "a photograph of garbage or waste dumped on a street",

    "road_damage": "a photograph of a cracked or damaged road",

    "waterlogging": "a photograph of a waterlogged or flooded road",

    "infrastructure_damage": "a photo of damaged public infrastructure such as a broken sidewalk, cracked curb, broken pavement, or damaged drain cover",
    "electrical_streetlight_hazard": "a photo of a broken streetlight, damaged electrical pole, or exposed hanging electrical wires",
    "fallen_obstruction": "a photo of a fallen tree, large branch, or bulky debris blocking a road or path",

    "other": "a photograph that does not show a civic infrastructure problem or shows humans or animals in the image"
}


# ============================================================
# LOAD MODEL
# ============================================================

classifier = pipeline(
    "zero-shot-image-classification",
    model="openai/clip-vit-base-patch32"
)

# NEW: model for image similarity
similarity_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
similarity_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# NEW: temporary storage only
image_embeddings = []

SIMILARITY_THRESHOLD = 0.90


# ============================================================
# DETECTION FUNCTION
# ============================================================
total_complaints = 0
duplicate_count = 0
def detect_issue(image_path):
    info = []
    # Open image
    image = Image.open(image_path).convert("RGB")

    # Candidate labels
    labels = list(CATEGORIES.values())

    # Run model
    results = classifier(
        image,
        candidate_labels=labels
    )
    duplicate_of = None

    # Results are sorted from highest to lowest score
    top_result = results[0]
    second_result = results[1]

    top_label = top_result["label"]
    top_confidence = top_result["score"]

    second_confidence = second_result["score"]

    # Calculate difference between top prediction
    # and second-best prediction
    margin = top_confidence - second_confidence

    # Find our category name from the model's text label
    category = "other"
    
    for category_name, description in CATEGORIES.items():
        if description == top_label:
            category = category_name
            # NEW: count complaint
            global total_complaints, duplicate_count
            total_complaints += 1

            # NEW: generate image embedding
            embedding = get_image_embedding(image)

            # NEW: check similarity with previous images
            is_duplicate = False

            for previous in image_embeddings:
                previous_embedding = previous["embedding"]
                previous_image = previous["image"]

                similarity = torch.cosine_similarity(
                    embedding,
                    previous_embedding
                ).item()

                if similarity >= SIMILARITY_THRESHOLD:
                    is_duplicate = True
                    duplicate_of = previous_image
                    break

            if is_duplicate:
                duplicate_count += 1

            # Store embedding temporarily
            image_embeddings.append({
                "image": image_path,
                "embedding": embedding
            })
            info.append({
                "image": image_path,
                "is_duplicate": is_duplicate,
                "duplicate_of": duplicate_of
            })            

    # ========================================================
    # CONFIDENCE + MARGIN CHECK
    # ========================================================

    if (
        top_confidence < CONFIDENCE_THRESHOLD
        or margin < MARGIN_THRESHOLD
    ):
        category = "other"

    return {
    "category": category,
    "confidence": round(top_confidence, 4),
    "margin": round(margin, 4),
    "total_complaints": total_complaints,
    "duplicate_count": duplicate_count,
    "unique_complaints": total_complaints - duplicate_count,
    "info": info
}

# NEW: create an embedding for an image
def get_image_embedding(image):
    inputs = similarity_processor(
        images=image,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = similarity_model.vision_model(**inputs)

    embedding = outputs.pooler_output

    embedding = embedding / embedding.norm(dim=-1, keepdim=True)

    return embedding