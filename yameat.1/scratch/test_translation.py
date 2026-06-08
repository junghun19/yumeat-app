from googletrans import Translator

translator = Translator()

def translate_recipes(recipes):
    if not recipes:
        return []
        
    texts_to_translate = []
    for r in recipes:
        texts_to_translate.append(r.get("cuisine", "Global"))
        texts_to_translate.append(r.get("difficulty", "easy"))
        texts_to_translate.append(r.get("name", "Tasty Dish"))
        texts_to_translate.append(r.get("description", ""))
        for ing in r.get("ingredients", []):
            texts_to_translate.append(ing.get("name", ""))
        for inst in r.get("instructions", []):
            texts_to_translate.append(inst)
            
    # Join with the unique delimiter
    cleaned_texts = [t if (t and str(t).strip()) else " " for t in texts_to_translate]
    combined_text = " ||| ".join(cleaned_texts)
    
    try:
        translated_res = translator.translate(combined_text, dest="ko")
        translated_texts = [t.strip() for t in translated_res.text.split("|||")]
        
        # If lengths match, we use them. If not, fallback to original texts.
        if len(translated_texts) != len(cleaned_texts):
            print(f"Length mismatch: {len(translated_texts)} vs {len(cleaned_texts)}")
            # Fallback to translating individual texts if combined translation fails
            translated_texts = []
            for t in cleaned_texts:
                if t.strip():
                    translated_texts.append(translator.translate(t, dest="ko").text)
                else:
                    translated_texts.append(t)
    except Exception as e:
        print(f"Translation error: {e}")
        translated_texts = cleaned_texts
        
    idx = 0
    translated_recipes = []
    for r in recipes:
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
        
        translated_recipes.append(r_copy)
    return translated_recipes

# Test sample
mock_recipes = [
    {
        "cuisine": "Italian",
        "difficulty": "medium",
        "name": "Spaghetti Carbonara",
        "description": "A classic Italian pasta dish from Rome made with egg, hard cheese, cured pork, and black pepper.",
        "ingredients": [
            {"name": "spaghetti", "quantity": "400", "unit": "g", "optional": False},
            {"name": "guanciale", "quantity": "150", "unit": "g", "optional": False}
        ],
        "instructions": [
            "Cook spaghetti in salted boiling water.",
            "Cook the guanciale until crispy."
        ]
    }
]

res = translate_recipes(mock_recipes)
print("Cuisine:", res[0]["cuisine"])
print("Name:", res[0]["name"])
print("Description:", res[0]["description"])
print("Ingredients:", [ing["name"] for ing in res[0]["ingredients"]])
print("Instructions:", res[0]["instructions"])
