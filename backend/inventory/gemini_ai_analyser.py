# inventory/utils/gemini_analyzer.py
from google import genai
from google.genai import types
from django.conf import settings
import json
import os

# ----------------------------------------------------------------------
# Initialize Gemini Client
# ----------------------------------------------------------------------

GEMINI_API_KEY = getattr(settings, 'GEMINI_API_KEY', None)
if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not configured in Django settings or environment variables.")

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"⚠️ Error initializing Gemini Client: {e}")
    client = None


# ----------------------------------------------------------------------
# Core Analysis Function
# ----------------------------------------------------------------------

def analyze_inventory(products_data):
    """
    Analyze inventory data using Gemini and return a structured JSON report.

    Args:
        products_data (list): List of dicts with fields like
                              [{'id':1, 'name':'Laptop', 'quantity':5, 'price':1000,
                                'min_stock':10, 'category':'Electronics'}, ...]

    Returns:
        dict: Structured analysis JSON.
    """
    if not client:
        return {"error": "Gemini Client failed to initialize. Check API Key."}

    # --- Aggregate & Prepare Data ---
    low_stock = len([p for p in products_data if p['quantity'] <= p['min_stock']])
    total_value = sum(p['quantity'] * p['price'] for p in products_data)
    categories = {}

    for p in products_data:
        cat = p.get('category', 'Uncategorized')
        if cat not in categories:
            categories[cat] = {'count': 0, 'value': 0}
        categories[cat]['count'] += 1
        categories[cat]['value'] += p['quantity'] * p['price']

    sample_products = products_data[:5]  # concise preview

    # --- Define Schema ---
    inventory_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "summary": types.Schema(
                type=types.Type.STRING,
                description="Brief overview of inventory health and key insights (1-2 sentences)."
            ),
            "low_stock_items": types.Schema(
                type=types.Type.INTEGER,
                description="Number of products below minimum stock threshold."
            ),
            "total_value": types.Schema(
                type=types.Type.NUMBER,
                description="Total inventory value as a numeric field."
            ),
            "reorder_recommendations": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "product_id": types.Schema(type=types.Type.INTEGER),
                        "suggested_qty": types.Schema(type=types.Type.INTEGER),
                        "urgency": types.Schema(
                            type=types.Type.STRING,
                            enum=['low', 'medium', 'high']
                        ),
                    },
                ),
                description="List of 3-5 reorder suggestions with urgency."
            ),
            "trends": types.Schema(
                type=types.Type.STRING,
                description="Key patterns or insights, e.g. 'Accessories stock turnover faster than Electronics.'"
            ),
            "risk_level": types.Schema(
                type=types.Type.STRING,
                enum=['low', 'medium', 'high'],
                description="Overall inventory risk rating."
            ),
            "action_items": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(type=types.Type.STRING),
                description="3-5 recommended actions to improve stock management."
            ),
        },
        required=[
            "summary",
            "low_stock_items",
            "total_value",
            "reorder_recommendations",
            "trends",
            "risk_level",
            "action_items",
        ],
    )

    # --- Define Prompt ---
    prompt_text = f"""
    You are an AI inventory analyst.
    Analyze this dataset and return a concise, structured report.

    - Total products: {len(products_data)}
    - Low stock items: {low_stock}
    - Total value: ₹{total_value:,.2f}
    - Categories summary: {json.dumps(categories, indent=2)}
    - Sample products: {json.dumps(sample_products, indent=2)}

    Generate:
    1. A short summary of overall inventory health.
    2. 3–5 reorder recommendations with urgency.
    3. Key trends and insights.
    4. A single overall risk level (low/medium/high).
    5. 3–5 action items to improve efficiency.

    Respond strictly in JSON format as per the schema.
    """

    # --- Configure Response ---
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=inventory_schema,
    )

    # --- Call Gemini API ---
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt_text],
            config=config,
        )
    except Exception as e:
        print(f"⚠️ Gemini API call failed: {e}")
        return {"error": f"Gemini API call failed: {e}"}

    # --- Parse and Return JSON ---
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        print("⚠️ Failed to decode Gemini response as JSON. Returning raw text.")
        return {"raw_response_error": response.text}


# ----------------------------------------------------------------------
# Example Usage (for standalone testing)
# ----------------------------------------------------------------------

if __name__ == "__main__":
    mock_products = [
        {"id": 1, "name": "Laptop", "quantity": 5, "price": 1000, "min_stock": 10, "category": "Electronics"},
        {"id": 2, "name": "Mouse", "quantity": 50, "price": 20, "min_stock": 100, "category": "Accessories"},
        {"id": 3, "name": "Keyboard", "quantity": 10, "price": 40, "min_stock": 20, "category": "Accessories"},
    ]
    report = analyze_inventory(mock_products)
    print(json.dumps(report, indent=2))
