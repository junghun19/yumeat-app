import streamlit as st
import requests
import json
import os
from datetime import date, datetime
from deep_translator import GoogleTranslator

def clean_html(html_str):
    return "\n".join(line.strip() for line in html_str.strip().split("\n"))

def is_korean(text):
    return any(ord("가") <= ord(char) <= ord("힣") for char in text)

def translate_recipe(r):
    # Skip translating if the recipe is already in Korean
    if is_korean(r.get("name", "")):
        return r
        
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
        translated_str = GoogleTranslator(source='auto', target='ko').translate(combined_text)
        translated_texts = [t.strip() for t in translated_str.split("|||")]
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
    except Exception:
        pass
    return r

def translate_recipes(recipes, max_recipes=4):
    if not recipes:
        return []
    recipes_to_translate = recipes[:max_recipes]
    translated = []
    for r in recipes_to_translate:
        translated.append(translate_recipe(r))
    return translated

# Fallback high-quality Korean recipes for missing counts or errors
DEFAULT_KOREAN_RECIPES = [
    {
        "cuisine": "Korean",
        "difficulty": "easy",
        "name": "초간단 김치볶음밥",
        "description": "잘 익은 김치와 찬밥, 그리고 계란후라이 하나로 5분 만에 완성하는 한국인의 소울푸드 김치볶음밥입니다.",
        "cook_time": 10,
        "calories_per_serving": 450,
        "ingredients": [
            {"name": "김치", "quantity": "1", "unit": "컵", "optional": False},
            {"name": "밥", "quantity": "1", "unit": "공기", "optional": False},
            {"name": "계란", "quantity": "1", "unit": "개", "optional": False},
            {"name": "참기름", "quantity": "1", "unit": "큰술", "optional": True}
        ],
        "instructions": [
            "김치를 가위로 잘게 썰어줍니다.",
            "달군 팬에 식용유를 두르고 김치를 볶아줍니다.",
            "김치가 익으면 밥을 넣고 뭉치지 않게 잘 섞어가며 볶아줍니다.",
            "참기름을 둘러 마무리하고, 계란후라이를 부쳐 위에 올려줍니다."
        ]
    },
    {
        "cuisine": "Korean",
        "difficulty": "easy",
        "name": "보들보들 계란말이",
        "description": "자취생 필수 반찬! 계란과 소금만으로 만드는 부드럽고 든든한 계란말이입니다.",
        "cook_time": 10,
        "calories_per_serving": 250,
        "ingredients": [
            {"name": "계란", "quantity": "3", "unit": "개", "optional": False},
            {"name": "소금", "quantity": "0.5", "unit": "작은술", "optional": False},
            {"name": "파", "quantity": "약간", "unit": "", "optional": True}
        ],
        "instructions": [
            "그릇에 계란 3개를 깨뜨려 넣고 소금을 더해 잘 풀어줍니다.",
            "파가 있다면 잘게 다져 계란물에 섞어줍니다.",
            "팬에 기름을 얇게 두르고 계란물을 조금씩 부어가며 돌돌 말아줍니다.",
            "다 익은 계란말이를 한김 식힌 뒤 먹기 좋은 크기로 썰어냅니다."
        ]
    },
    {
        "cuisine": "Korean",
        "difficulty": "easy",
        "name": "얼큰한 뚝배기 라면",
        "description": "대파와 계란을 넣어 깊은 맛을 낸 얼큰하고 시원한 자취생 최고 인기 메뉴입니다.",
        "cook_time": 5,
        "calories_per_serving": 500,
        "ingredients": [
            {"name": "라면", "quantity": "1", "unit": "봉지", "optional": False},
            {"name": "물", "quantity": "550", "unit": "ml", "optional": False},
            {"name": "계란", "quantity": "1", "unit": "개", "optional": True},
            {"name": "대파", "quantity": "1/4", "unit": "대", "optional": True}
        ],
        "instructions": [
            "냄비에 물 550ml를 넣고 끓여줍니다.",
            "물이 끓으면 면, 분말스프, 건더기스프를 넣어줍니다.",
            "송송 썬 대파를 넣고 4분간 끓입니다.",
            "불을 끄기 1분 전에 계란을 넣고 저어주지 않고 익혀 완성합니다."
        ]
    },
    {
        "cuisine": "Korean",
        "difficulty": "easy",
        "name": "짭조름한 매콤 두부조림",
        "description": "단백질이 풍부한 두부를 간장 양념장에 자작하게 조려 밥반찬으로 훌륭한 요리입니다.",
        "cook_time": 15,
        "calories_per_serving": 180,
        "ingredients": [
            {"name": "두부", "quantity": "1", "unit": "모", "optional": False},
            {"name": "간장", "quantity": "3", "unit": "큰술", "optional": False},
            {"name": "설탕", "quantity": "1", "unit": "큰술", "optional": False},
            {"name": "고춧가루", "quantity": "1", "unit": "큰술", "optional": False},
            {"name": "마늘", "quantity": "0.5", "unit": "큰술", "optional": True}
        ],
        "instructions": [
            "두부를 먹기 좋은 크기로 썰어 물기를 제거합니다.",
            "간장, 설탕, 고춧가루, 다진 마늘, 물 3큰술을 섞어 양념장을 만듭니다.",
            "팬에 두부를 노릇하게 굽다가 양념장을 끼얹어 줍니다.",
            "중약불에서 국물이 자작해질 때까지 조려 완성합니다."
        ]
    }
]

# Scoring system to prioritize Korean/Asian recipes with minimal extra ingredients
def get_recipe_priority_score(recipe, fridge_set):
    cuisine = recipe.get("cuisine", "").lower()
    name = recipe.get("name", "").lower()
    desc = recipe.get("description", "").lower()
    
    score = 0
    # 1. Bias toward Korean / Asian cuisines
    if any(k in cuisine for k in ["korean", "asian"]):
        score += 50
    elif any(k in cuisine for k in ["japanese", "chinese", "thai", "vietnamese"]):
        score += 25
        
    if "korean" in name or "korean" in desc:
        score += 30
        
    # Check for common Asian ingredients or names
    asian_keywords = ["kimchi", "bulgogi", "bibimbap", "tofu", "rice", "sesame", "soy sauce", "garlic", "ginger", "gochujang", "miso", "ramen"]
    for kw in asian_keywords:
        if kw in name or kw in desc:
            score += 10

    # 2. Penalty for missed ingredients (additional purchases needed)
    # Basic seasoning ingredients that are likely already at home
    BASIC_PANTRY = {
        "salt", "sugar", "water", "pepper", "black pepper", "oil", "vegetable oil", 
        "olive oil", "soy sauce", "garlic", "sesame oil", "butter", "flour"
    }
    
    missed_count = 0
    for ing in recipe.get("ingredients", []):
        ing_name = ing.get("name", "").lower()
        if not any(f in ing_name for f in fridge_set):
            if not any(bp in ing_name for bp in BASIC_PANTRY):
                missed_count += 1
                
    # Penalize heavily for each extra ingredient needed
    score -= missed_count * 15
    
    # 3. Cook time penalty for complex dishes (> 20 mins)
    cook_time = recipe.get("cook_time", 0)
    if cook_time > 20:
        score -= (cook_time - 20) * 2
        
    return score

# Cached translation & API retrieval function (Hashable inputs)
@st.cache_data(ttl=3600, show_spinner=False)
def get_translated_recipes(ingredients_tuple, api_key):
    query_ingredients = ",".join(ingredients_tuple)
    url = f"https://recipeapi.io/api/v1/recipes?ingredients={query_ingredients}"
    headers = {
        'Authorization': f'Bearer {api_key}'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json().get("data", [])
            
            # Sort recipes by priority
            ingredients_set = set(ingredients_tuple)
            data.sort(key=lambda r: get_recipe_priority_score(r, ingredients_set), reverse=True)
            
            selected_recipes = data[:4]
            while len(selected_recipes) < 4:
                for fallback in DEFAULT_KOREAN_RECIPES:
                    if len(selected_recipes) >= 4:
                        break
                    if not any(f["name"] == fallback["name"] for f in selected_recipes):
                        selected_recipes.append(fallback)
            
            try:
                translated_recipes = translate_recipes(selected_recipes, max_recipes=4)
            except Exception:
                translated_recipes = selected_recipes[:4]
                
            return translated_recipes
    except Exception:
        pass
        
    return DEFAULT_KOREAN_RECIPES[:4]

# Page Configuration
st.set_page_config(page_title="얌잇 냉장고 백엔드", layout="wide")

# File-based persistence for fridge items
DATA_FILE = "fridge_items.json"

def get_item_user_id(item):
    return item.get("user_id") or item.get("username", "default_user")

def load_items(user_id: str):
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                items = json.load(f)
                items = [item for item in items if get_item_user_id(item) == st.session_state['user_id']]
                user_items = []
                for item in items:
                    if "put_in" in item and isinstance(item["put_in"], str):
                        item["put_in"] = datetime.strptime(item["put_in"], "%Y-%m-%d").date()
                    if "expiry" in item and isinstance(item["expiry"], str):
                        item["expiry"] = datetime.strptime(item["expiry"], "%Y-%m-%d").date()
                    user_items.append(item)
                return user_items
        except Exception:
            return []
    return []

def save_items(items, user_id: str):
    try:
        all_items = []
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    all_items = json.load(f)
            except Exception:
                pass
        
        # Keep other users' items intact
        all_items = [item for item in all_items if get_item_user_id(item) != st.session_state['user_id']]
        
        # Add current user's items
        for item in items:
            item_copy = item.copy()
            item_copy["user_id"] = st.session_state['user_id']
            item_copy["username"] = user_id
            if isinstance(item_copy.get("put_in"), (date, datetime)):
                item_copy["put_in"] = item_copy["put_in"].strftime("%Y-%m-%d")
            if isinstance(item_copy.get("expiry"), (date, datetime)):
                item_copy["expiry"] = item_copy["expiry"].strftime("%Y-%m-%d")
            all_items.append(item_copy)
            
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(all_items, f, ensure_ascii=False, indent=2)
    except Exception as e:
        st.error(f"저장 오류: {e}")

# Resolve username/session from query parameters
url_username = st.query_params.get("username")
if url_username:
    # Only update if user changed — don't reset on same-user re-renders
    if st.session_state.get('user_id') != url_username:
        st.session_state['user_id'] = url_username
        st.session_state['logged_in'] = True
        st.session_state['fridge_items'] = load_items(url_username)
        st.session_state['prev_user_id'] = url_username
        st.session_state['recommended_recipes'] = []
    else:
        st.session_state['logged_in'] = True
else:
    # No username param — initialize defaults without destroying existing state
    if 'user_id' not in st.session_state:
        st.session_state['user_id'] = 'default_user'
        st.session_state['logged_in'] = False

current_user = st.session_state.get('user_id', 'default_user')

# Initialize fridge items only if not already loaded for this user
if 'fridge_items' not in st.session_state:
    st.session_state['fridge_items'] = load_items(current_user)
    st.session_state['prev_user_id'] = current_user

if "recommended_recipes" not in st.session_state:
    st.session_state.recommended_recipes = []

# Callback function to handle deletion without full iframe reloads
def delete_item_callback(item_id):
    st.session_state.fridge_items = [item for item in st.session_state.fridge_items if item.get("id") != item_id]
    save_items(st.session_state.fridge_items, st.session_state.get('user_id', 'default_user'))

# Force dark text and clean contrast regardless of system light/dark theme
st.markdown(
    """
    <style>
    /* Hide default Streamlit styles to blend in iframe */
    #MainMenu {visibility: hidden;}
    header {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Global box-sizing lock to prevent padding overflow */
    *, *:before, *:after {
        box-sizing: border-box !important;
    }
    
    /* Overall Page Styling */
    html, body, [data-testid="stAppViewContainer"], [data-testid="stApp"] {
        color: #2c3a5c !important;
        background-color: #ffffff !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    .block-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        padding-bottom: 1.5rem !important;
    }
    
    /* Hide scrollbars visually while maintaining scroll functionality */
    html::-webkit-scrollbar, body::-webkit-scrollbar, [data-testid="stAppViewContainer"]::-webkit-scrollbar {
        display: none !important;
    }
    html, body, [data-testid="stAppViewContainer"] {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
    }
    
    /* Headings, text labels, and descriptions color styling */
    h1, h2, h3, h4, h5, h6, p, span, label, div {
        color: #2c3a5c !important;
    }
    
    /* Input Elements Force High Contrast */
    input, select, textarea, button {
        color: #2c3a5c !important;
        background-color: #ffffff !important;
        border: 1px solid #c8eadd !important;
    }
    div[data-baseweb="input"] input {
        color: #2c3a5c !important;
        background-color: #ffffff !important;
    }
    div[role="listbox"] {
        background-color: #ffffff !important;
    }
    
    /* Form Container Green Styling */
    [data-testid="stForm"] {
        background-color: #f1fcf8 !important;
        border: 1px solid #d0f0e4 !important;
        border-radius: 16px !important;
        padding: 18px !important;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.04) !important;
        margin-bottom: 20px !important;
    }
    
    /* Custom Green Section Box */
    .section-container {
        background-color: #f1fcf8 !important;
        border: 1px solid #d0f0e4 !important;
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 20px;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.04);
    }
    
    .section-title {
        font-size: 17px !important;
        font-weight: 700 !important;
        color: #1b5e20 !important;
        margin-bottom: 14px !important;
        border-left: 4px solid #2ecc71;
        padding-left: 10px;
    }
    
    /* Style the row block to look like a single unified card */
    div[data-testid="stHorizontalBlock"]:has(button) {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        justify-content: space-between !important;
        background-color: #ffffff !important;
        border: 1px solid #d8f3e5 !important;
        border-radius: 12px !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03) !important;
        margin-bottom: 10px !important;
        padding: 16px 16px 20px 16px !important; /* Increased padding-bottom to prevent overflow */
        width: 100% !important;
    }
    
    /* Ensure columns do not stack vertically on mobile/narrow screens */
    div[data-testid="stHorizontalBlock"]:has(button) div[data-testid="column"] {
        width: auto !important;
        min-width: 0 !important;
        flex-shrink: 1 !important;
    }
    
    /* Force first column (details) to take up 80% width */
    div[data-testid="stHorizontalBlock"]:has(button) div[data-testid="column"]:nth-child(1) {
        flex-grow: 1 !important;
        flex-basis: 80% !important;
        width: 80% !important;
    }
    
    /* Force second column (delete button) to take up 20% width and align right */
    div[data-testid="stHorizontalBlock"]:has(button) div[data-testid="column"]:nth-child(2) {
        flex-grow: 0 !important;
        flex-basis: 20% !important;
        width: 20% !important;
        display: flex !important;
        justify-content: flex-end !important;
        align-items: center !important;
        padding-right: 16px !important; /* Ensure the button stays completely inside the border */
    }

    /* Force any intermediate wrappers of stHorizontalBlock to stay side-by-side as a row */
    div[data-testid="stHorizontalBlock"]:has(button) > div {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        width: 100% !important;
    }
    
    /* Fridge Item Card inside Section Box */
    .fridge-item-card {
        padding: 0 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        margin-bottom: 0 !important;
        color: #2c3a5c !important;
    }
    
    .item-name {
        font-size: 15px !important;
        font-weight: 700 !important;
        color: #2c3a5c !important;
    }
    
    .item-details {
        font-size: 12px !important;
        color: #52607c !important;
        margin-top: 4px;
    }
    
    .dday-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        color: white !important;
        margin-top: 6px;
    }
    .dday-expired {
        background-color: #e74c3c !important;
    }
    .dday-soon {
        background-color: #f39c12 !important;
    }
    .dday-safe {
        background-color: #2ecc71 !important;
    }
    
    /* Style the native delete button inside the column container */
    div[data-testid="column"] button {
        background-color: transparent !important;
        border: none !important;
        color: #e74c3c !important;
        font-size: 18px !important;
        padding: 0 !important;
        margin: 0 !important;
        margin-right: 0px !important; /* Reset margin since column padding-right handles positioning */
        box-shadow: none !important;
        cursor: pointer;
        transition: transform 0.2s ease;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: auto !important;
        height: auto !important;
        min-height: 0 !important;
    }
    div[data-testid="column"] button p {
        margin: 0 !important;
        font-size: 18px !important;
        color: #e74c3c !important;
        line-height: 1 !important;
    }
    div[data-testid="column"] button:hover {
        color: #c0392b !important;
        transform: scale(1.2);
        background-color: transparent !important;
    }
    div[data-testid="column"] button:active {
        background-color: transparent !important;
    }

    /* Hide Streamlit status widget and connection banners */
    #ConnectionStatus { display: none !important; }
    [data-testid="stStatusWidget"] { display: none !important; }
    </style>
    """,
    unsafe_allow_html=True
)

# Korean to English translation for API queries
KO_TO_EN = {
    "계란": "egg",
    "달걀": "egg",
    "양파": "onion",
    "소금": "salt",
    "토마토": "tomato",
    "닭가슴살": "chicken",
    "닭고기": "chicken",
    "두부": "tofu",
    "시금치": "spinach",
    "라면": "noodle",
    "우유": "milk",
    "소고기": "beef",
    "돼지고기": "pork",
    "마늘": "garlic",
    "파": "scallion",
    "대파": "scallion",
    "당근": "carrot",
    "감자": "potato",
    "버섯": "mushroom",
    "고추": "pepper",
    "오이": "cucumber",
    "치즈": "cheese",
    "밥": "rice",
    "김치": "kimchi",
    "참치": "tuna",
    "식빵": "bread",
    "빵": "bread",
    "사과": "apple",
    "바나나": "banana",
    "버터": "butter",
    "간장": "soy sauce",
    "설탕": "sugar",
    "스팸": "spam",
    "햄": "ham",
    "소시지": "sausage",
    "고구마": "sweet potato",
    "양배추": "cabbage",
    "새우": "shrimp",
}

today = date.today()

# Section 1. Add Food Form
st.markdown('<div class="section-title">➕ 새 식재료 등록</div>', unsafe_allow_html=True)
with st.form("add_food_form", clear_on_submit=True):
    food_name = st.text_input("음식 이름", placeholder="예: 토마토, 계란, 두부, 닭가슴살")
    col_in, col_exp = st.columns(2)
    with col_in:
        put_in_date = st.date_input("냉장고에 언제 넣었는지 (보관 시작일)", value=today)
    with col_exp:
        expiry_date = st.date_input("유통기한 (연도. 월. 일)", value=today)
    
    submitted = st.form_submit_button("➕ 추가하기")
    if submitted:
        if food_name.strip():
            new_item = {
                "id": int(datetime.now().timestamp() * 1000),
                "name": food_name.strip(),
                "put_in": put_in_date,
                "expiry": expiry_date,
                "user_id": st.session_state['user_id'],
                "username": st.session_state.get('user_id', 'default_user')
            }
            st.session_state.fridge_items.append(new_item)
            save_items(st.session_state.fridge_items, st.session_state.get('user_id', 'default_user'))
            st.rerun()
        else:
            st.error("음식 이름을 입력해주세요.")

# Section 2. Food Item List (Custom styled Section Container)
if not st.session_state.fridge_items:
    st.markdown(
        clean_html("""
        <div class="section-container">
            <div class="section-title">🧊 현재 보관 중인 식재료</div>
            <div style="text-align: center; color: #666; padding: 20px; font-size: 14px;">
                냉장고가 비어있습니다. 새로운 식재료를 추가해보세요!
            </div>
        </div>
        """),
        unsafe_allow_html=True
    )
else:
    # Open section block
    st.markdown(
        clean_html("""
        <div class="section-container">
            <div class="section-title">🧊 현재 보관 중인 식재료</div>
        """),
        unsafe_allow_html=True
    )
    
    # Loop using native st.columns and st.button to prevent full-page iframe reloads
    for item in st.session_state.fridge_items:
        expiry_val = item["expiry"]
        put_in_val = item.get("put_in", today)
        
        delta = (expiry_val - today).days
        if delta < 0:
            badge = "만료"
            badge_class = "dday-expired"
        elif delta <= 3:
            badge = f"D-{delta}"
            badge_class = "dday-soon"
        else:
            badge = f"D-{delta}"
            badge_class = "dday-safe"
            
        col_card, col_del = st.columns([8, 2], vertical_alignment="center")
        with col_card:
            st.markdown(
                clean_html(f"""
                <div class="fridge-item-card">
                    <div class="item-name">{item['name']}</div>
                    <div class="item-details">보관시작일: {put_in_val.strftime('%Y-%m-%d')}</div>
                    <div class="item-details" style="margin-bottom: 6px;">유통기한: {expiry_val.strftime('%Y-%m-%d')}</div>
                    <span class="dday-badge {badge_class}">{badge}</span>
                </div>
                """),
                unsafe_allow_html=True
            )
        with col_del:
            st.button("🗑️", key=f"del_{item['id']}", on_click=delete_item_callback, args=(item['id'],))
            
    # Close section block
    st.markdown("</div>", unsafe_allow_html=True)

# Section 3. AI Recipe Suggestion
st.markdown(
    clean_html("""
    <div class="section-container">
        <div class="section-title">💡 실시간 AI 레시피 추천</div>
    """),
    unsafe_allow_html=True
)

if not st.session_state.fridge_items:
    st.warning("냉장고에 식재료가 등록되어 있어야 AI 레시피 추천이 가능합니다.")
    st.markdown("</div>", unsafe_allow_html=True)
else:
    st.markdown("</div>", unsafe_allow_html=True) # Close section-container to render button normally
    
    if st.button("🍳 현재 재료로 레시피 추천받기", key="get_recipe_btn"):
        ingredients_list = []
        for item in st.session_state.fridge_items:
            name = item["name"].strip()
            en_name = KO_TO_EN.get(name, name.lower())
            ingredients_list.append(en_name)
            
        ingredients_tuple = tuple(set(ingredients_list))
        api_key = 'sk_live_zPeO7Qfig68YMAULwJBpM44Qlt7aIDUcDQlmXwgn8c6251d0'
        
        with st.spinner("AI가 냉장고 재료와 초간단 한식 스타일 요리를 매칭 중입니다..."):
            recipes = get_translated_recipes(ingredients_tuple, api_key)
            st.session_state.recommended_recipes = recipes

    # Display recommended recipes from session state
    if st.session_state.recommended_recipes:
        st.success(f"총 {len(st.session_state.recommended_recipes)}개의 맞춤 자취생 한식 추천 레시피를 찾았습니다!")
        for recipe in st.session_state.recommended_recipes:
            st.markdown(
                clean_html(f"""
                <div style="padding: 16px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(55, 84, 143, 0.05); border: 1px solid #d0f0e4; margin-bottom: 12px;">
                    <div style="color: #1b5e20; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
                        {recipe.get('cuisine', 'Global')} · {recipe.get('difficulty', 'easy')}
                    </div>
                    <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #2c3a5c;">{recipe.get('name', '맛있는 요리')}</div>
                    <div style="color: #4f5d7d; line-height: 1.6; font-size: 13px; margin-bottom: 10px;">{recipe.get('description', '')}</div>
                    <div style="font-size: 12px; color: #4b6584;">
                        ⏱️ 조리시간: {recipe.get('cook_time', 0)}분 | 🔥 칼로리: {recipe.get('calories_per_serving', 0)} kcal
                    </div>
                </div>
                """),
                unsafe_allow_html=True
            )
            with st.expander("🔍 필요한 재료 보기"):
                for ing in recipe.get("ingredients", []):
                    opt = " (선택)" if ing.get("optional") else ""
                    st.write(f"- {ing.get('name')}: {ing.get('quantity', '')} {ing.get('unit', '')}{opt}")
            with st.expander("👨‍🍳 조리법 보기"):
                for i, inst in enumerate(recipe.get("instructions", [])):
                    st.write(f"{i+1}. {inst}")
