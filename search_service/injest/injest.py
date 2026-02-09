import pandas as pd
from elasticsearch import Elasticsearch

es = Elasticsearch("http://localhost:9200")

df = pd.read_csv("data/amazon_products.csv")

# ---- PRODUCTS ----
products = {}

for _, row in df.iterrows():
    asin = row["asins"]
    if asin not in products:
        products[asin] = {
            "asin": asin,
            "brand": row["brand"],
            "categories": str(row["categories"]).split(","),
            "dimensions": row["dimension"],
            "weight": row["weight"],
            "date_added": row["dateAdded"],
            "date_updated": row["dateUpdated"]
        }

for asin, product in products.items():
    es.index(
        index="products_index",
        id=asin,        # 👈 CRITICAL
        document=product
    )

# ---- REVIEWS ----
for _, row in df.iterrows():
    if pd.notna(row["reviews.text"]):
        review = {
            "asin": row["asins"],
            "rating": row["reviews.rating"],
            "title": row["reviews.title"],
            "text": row["reviews.text"],
            "username": row["reviews.username"],
            "source_url": row["reviews.sourceURLs"]
        }
        es.index(index="reviews_index", document=review)
