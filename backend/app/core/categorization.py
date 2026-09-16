CATEGORY_KEYWORDS = {
    "Groceries": ["grocery", "supermarket", "walmart", "carrefour"],
    "Transport": ["uber", "lyft", "taxi", "transport", "fuel", "gas station"],
    "Dining Out": ["restaurant", "starbucks", "coffee", "mcdonald", "kfc"],
    "Utilities": ["electricity", "water bill", "internet", "phone bill"],
    "Rent": ["rent"],
    "Entertainment": ["netflix", "spotify", "cinema", "movie"],
    "Health": ["pharmacy", "doctor", "hospital", "clinic"],
    "Salary": ["salary", "payroll", "deposit"],
}


def categorize_transaction(description: str) -> str:
    """Return the matching category name based on keywords found in the description.
    Falls back to 'Uncategorized' if no keyword matches.
    """
    normalized = description.lower()
    for category_name, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return category_name
    return "Uncategorized"