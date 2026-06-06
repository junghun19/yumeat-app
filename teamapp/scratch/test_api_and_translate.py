import requests
from googletrans import Translator

translator = Translator()

def translate_recipe(r):
    texts_to_translate = [
        r.get("cuisine", "Global"),
        r.get("difficulty", "easy"),
        r.get("name", "Tasty Dish"),
        r.get("description", "")
    ]
    for ing in r.get("ingredients", []):
        texts_to_translate.append(ing.get("name", ""))
    for inst in r.get("instructions", []):
        texts_to_translate.append(inst)
        
    cleaned_texts = [t if (t and str(t).strip()) else " " for t in texts_to_translate]
    combined_text = " ||| ".join(cleaned_texts)
    
    try:
        translated_res = translator.translate(combined_text, dest="ko")
        translated_texts = [t.strip() for t in translated_res.text.split("|||")]
        if len(translated_texts) == len(cleaned_texts):
            idx = 0
            r_copy = r.copy()
            r_copy["cuisine"] = translated_texts[idx]; idx += 1
            r_copy["difficulty"] = translated_texts[idx]; idx += 1
            r_copy["name"] = translated_texts[idx]; idx += 1
            r_copy["description"] = translated_texts[idx]; idx += 1
            
            translated_ingredients = []
            for ing in r.get("ingredients", []):
                ing_copy = ing.copy()
                ing_copy["name"] = translated_texts[idx]; idx += 1
                translated_ingredients.append(ing_copy)
            r_copy["ingredients"] = translated_ingredients
            
            translated_instructions = []
            for inst in r.get("instructions", []):
                translated_instructions.append(translated_texts[idx]); idx += 1
            r_copy["instructions"] = translated_instructions
            return r_copy
        else:
            print(f"Length mismatch: {len(translated_texts)} vs {len(cleaned_texts)}")
    except Exception as e:
        print(f"Error translating recipe {r.get('name')}: {e}")
    return r

def translate_recipes(recipes, max_recipes=3):
    recipes_to_translate = recipes[:max_recipes]
    translated = []
    for r in recipes_to_translate:
        translated.append(translate_recipe(r))
    return translated

# Query for tomato
query_ingredients = "tomato"
api_key = 'sk_live_zPeO7Qfig68YMAULwJBpM44Qlt7aIDUcDQlmXwgn8c6251d0'
url = f"https://recipeapi.io/api/v1/recipes?ingredients={query_ingredients}"
headers = {
    'Authorization': f'Bearer {api_key}'
}

print("Querying API...")
response = requests.get(url, headers=headers, timeout=10)
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json().get("data", [])
    print(f"Found {len(data)} recipes.")
    if data:
        translated_data = translate_recipes(data, max_recipes=3)
        print("\n--- First Translated Recipe ---")
        print(f"Cuisine: {translated_data[0]['cuisine']}")
        print(f"Difficulty: {translated_data[0]['difficulty']}")
        print(f"Name: {translated_data[0]['name']}")
        print(f"Description: {translated_data[0]['description']}")
        print("Ingredients:", [ing["name"] for ing in translated_data[0]["ingredients"]])
        print("Instructions:", translated_data[0]["instructions"])
