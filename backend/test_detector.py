import os

from backend.detector_static import detect_issue


TEST_FOLDER = "test_images2"

from collections import defaultdict


def calculate_duplicate_priority(results):
    """
    Calculate priority based ONLY on image duplicity.

    Every unique image represents one underlying complaint.
    If the same image is submitted multiple times,
    that complaint gets higher priority.

    results format:

    {
        "image": "image1.jpg",
        "is_duplicate": False,
        "duplicate_of": None
    }

    or

    {
        "image": "image2.jpg",
        "is_duplicate": True,
        "duplicate_of": "image1.jpg"
    }
    """

    complaint_groups = defaultdict(list)

    for result in results:

        image = result["image"]

        if result["is_duplicate"]:
            original = result["duplicate_of"]

            complaint_groups[original].append(image)

        else:
            complaint_groups[image].append(image)

    # Calculate number of reports for each underlying complaint
    priority_results = []

    for original_image, reports in complaint_groups.items():

        duplicate_count = len(reports)

        # 1 report = no duplicate
        # 2 reports = 1 duplicate
        # 3 reports = 2 duplicates
        actual_duplicates = duplicate_count - 1

        # Convert duplicate count into a 0-100 score.
        # Maximum score is capped at 100.

        if duplicate_count == 1:
            priority_score = 0

        elif duplicate_count == 2:
            priority_score = 40

        elif duplicate_count == 3:
            priority_score = 60

        elif duplicate_count == 4:
            priority_score = 75

        elif duplicate_count == 5:
            priority_score = 85

        else:
            priority_score = 90

        priority_results.append({
            "complaint_image": original_image,
            "total_reports": duplicate_count,
            "duplicate_count": actual_duplicates,
            "priority_score": priority_score
        })

    # Highest priority first
    priority_results.sort(
        key=lambda x: x["priority_score"],
        reverse=True
    )

    return priority_results

def display_priority(priority_results):

    print("\n")
    print("=" * 60)
    print("           CIVIC ISSUE PRIORITY")
    print("=" * 60)

    if not priority_results:
        print("No complaints found.")
        return

    for rank, result in enumerate(priority_results, start=1):

        print(
            f"\n{rank}. {result['complaint_image']}"
        )

        print(
            f"   Total reports: "
            f"{result['total_reports']}"
        )

        print(
            f"   Duplicate reports: "
            f"{result['duplicate_count']}"
        )

        print(
            f"   Priority score: "
            f"{result['priority_score']}/100"
        )

    print("\n" + "=" * 60)

    highest = priority_results[0]

    print(
        f"\nHIGHEST PRIORITY:"
        f" {highest['complaint_image']}"
    )

    print(
        f"Reports: {highest['total_reports']}"
    )

    print(
        f"Priority: {highest['priority_score']}/100"
    )

    print("=" * 60)

def process_complaint(complaint):
    image_path = complaint["image"]
    user_id = complaint.get("user_id", "anonymous")
    description = complaint.get("description", "")
    latitude = complaint.get("latitude", 0.0)
    longitude = complaint.get("longitude", 0.0)
    timestamp = complaint.get("timestamp")

    detection_result = detect_issue(image_path)
    info = detection_result.get("info", [])
    priority_results = calculate_duplicate_priority(info) if info else []
    
    is_duplicate = info[-1].get("is_duplicate", False) if info else False
    priority_score = priority_results[0]["priority_score"] if priority_results else 0

    return {
        "user_id": user_id,
        "category": detection_result["category"],
        "confidence": detection_result["confidence"],
        "description": description,
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": timestamp,
        "is_duplicate": is_duplicate,
        "priority": priority_score
    }


def main():
    if not os.path.exists(TEST_FOLDER):
        print(f"Folder '{TEST_FOLDER}' does not exist.")
        return

    images = [
        f for f in os.listdir(TEST_FOLDER)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ]

    if not images:
        print(f"No test images found in {TEST_FOLDER}/")
        return

    print(f"Processing {len(images)} images in {TEST_FOLDER}...")
    for img_name in images:
        path = os.path.join(TEST_FOLDER, img_name)
        res = process_complaint({
            "image": path,
            "user_id": "test_user",
            "description": f"Test report for {img_name}",
            "latitude": 28.6139,
            "longitude": 77.2090
        })
        print(f"Image: {img_name:20} -> Category: {res['category']:25} | Priority: {res['priority']}")


if __name__ == "__main__":
    main()

