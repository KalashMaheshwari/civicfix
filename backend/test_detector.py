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
    total_complaints = 0
    duplicate_count = 0

    results = []
    image = complaint["image"]
    user_id = complaint["user_id"]
    description = complaint["description"]
    latitude = complaint["latitude"]
    longitude = complaint["longitude"]
    timestamp = complaint["timestamp"]
    location = complaint["location"]

    detection_result = detect_issue(image)

    duplicate_result = calculate_duplicate_priority(image, latitude, longitude)

    priority_result = calculate_priority(
        detection_result,
        description,
        latitude,
        longitude,
        duplicate_result
    )
    result = detect_issue(image_path)
    
    return {
    "user_id": user_id,
    "category": ...,
    "confidence": ...,
    "description": description,
    "latitude": latitude,
    "longitude": longitude,
    "timestamp": timestamp,
    "is_duplicate": ...,
    "severity": ...,
    "priority": ...
}

