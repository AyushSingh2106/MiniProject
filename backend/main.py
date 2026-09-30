from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import torch.nn.functional as F
import io

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the pretrained CLIP model
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Temporary threshold for development
THRESHOLD = 0.25


@app.get("/")
def home():
    return {"message": "Image Correctness Marketplace API is running"}


@app.post("/verify")
async def verify_product(
    title: str = Form(...),
    description: str = Form(...),
    image: UploadFile = File(...)
):
    # Read uploaded image
    image_data = await image.read()
    product_image = Image.open(io.BytesIO(image_data)).convert("RGB")

    # Combine title and description
    product_text = title + ". " + description

    # Prepare image and text for CLIP
    inputs = processor(
        text=[product_text],
        images=product_image,
        return_tensors="pt",
        padding=True
    )

    # Generate embeddings
    with torch.no_grad():
        outputs = model(**inputs)

    image_embedding = outputs.image_embeds
    text_embedding = outputs.text_embeds

    # Normalize embeddings
    image_embedding = F.normalize(image_embedding, p=2, dim=1)
    text_embedding = F.normalize(text_embedding, p=2, dim=1)

    # Calculate cosine similarity
    similarity = torch.sum(
        image_embedding * text_embedding, dim=1
    ).item()

    # Classify the product
    if similarity >= THRESHOLD:
        result = "Correct"
    else:
        result = "Incorrect"

    return {
        "title": title,
        "description": description,
        "cosine_similarity": round(similarity, 4),
        "threshold": THRESHOLD,
        "verification_result": result
    }
@app.post("/verify-batch")
async def verify_batch(
    titles: list[str] = Form(...),
    descriptions: list[str] = Form(...),
    images: list[UploadFile] = File(...)
):
    # Make sure every listing has all three pieces of information
    if not (
        len(titles) == len(descriptions) == len(images)
    ):
        return {
            "error": "Number of titles, descriptions, and images must be the same."
        }

    product_images = []

    # Read all uploaded images
    for image in images:
        image_data = await image.read()
        product_image = Image.open(
            io.BytesIO(image_data)
        ).convert("RGB")
        product_images.append(product_image)

    # Combine title and description for every product
    product_texts = [
        title + ". " + description
        for title, description in zip(titles, descriptions)
    ]

    # Process all images and texts as one CLIP batch
    inputs = processor(
        text=product_texts,
        images=product_images,
        return_tensors="pt",
        padding=True
    )

    with torch.no_grad():
        outputs = model(**inputs)

    image_embeddings = F.normalize(
        outputs.image_embeds,
        p=2,
        dim=1
    )

    text_embeddings = F.normalize(
        outputs.text_embeds,
        p=2,
        dim=1
    )

    # Compare each image with its corresponding text
    similarities = torch.sum(
        image_embeddings * text_embeddings,
        dim=1
    ).tolist()

    results = []

    for i, similarity in enumerate(similarities):
        similarity = round(similarity, 4)

        if similarity >= THRESHOLD:
            result = "Correct"
        else:
            result = "Incorrect"

        results.append({
            "title": titles[i],
            "description": descriptions[i],
            "cosine_similarity": similarity,
            "threshold": THRESHOLD,
            "verification_result": result
        })

    return {
        "total_products": len(results),
        "results": results
    }