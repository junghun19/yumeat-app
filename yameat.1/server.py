import json
import os
import asyncio
import uuid
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

POSTS_FILE = "posts.json"
CHAT_HISTORY_FILE = "chat_history.json"

def load_posts():
    if os.path.exists(POSTS_FILE):
        try:
            with open(POSTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_posts(posts):
    try:
        with open(POSTS_FILE, "w", encoding="utf-8") as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def load_chat_history():
    if os.path.exists(CHAT_HISTORY_FILE):
        try:
            with open(CHAT_HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_chat_history(history):
    try:
        with open(CHAT_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def has_message_id(messages, message_id):
    if not message_id:
        return False
    return any(msg.get("id") == message_id for msg in messages)

USERS_FILE = "users.json"

def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_users(users):
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def get_user_points(nickname: str) -> int:
    posts = load_posts()
    hearts = 0
    
    # Calculate top recipe post ID dynamically
    recipe_posts = [p for p in posts if p.get("category") == "추천 식단"]
    top_recipe_id = None
    if recipe_posts:
        sorted_recipes = sorted(
            recipe_posts,
            key=lambda p: (p.get("emotions", {}).get("like", 0) + p.get("emotions", {}).get("happy", 0)),
            reverse=True
        )
        top_recipe_id = sorted_recipes[0]["id"]
        
    for post in posts:
        if post.get("author") == nickname:
            cat = post.get("category")
            if cat == "추천 식단":
                hearts += 5
                # Recommendation adoption (+20 points)
                if post["id"] == top_recipe_id:
                    hearts += 20
            elif cat == "냉털":
                hearts += 3
            elif cat == "배달 더치페이":
                hearts += 10
                
            # Hearts points: sum of all received emotion actions (+1 point each)
            emotions = post.get("emotions", {})
            total_likes = sum(emotions.values()) if emotions else 0
            hearts += total_likes
            
    return hearts

class ConnectionManager:
    def __init__(self):
        # Maps nickname (str) to a list of active WebSockets (multiple tabs/sessions)
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, nickname: str, websocket: WebSocket):
        await websocket.accept()
        if nickname not in self.active_connections:
            self.active_connections[nickname] = []
        self.active_connections[nickname].append(websocket)

    def disconnect(self, nickname: str, websocket: WebSocket):
        if nickname in self.active_connections:
            if websocket in self.active_connections[nickname]:
                self.active_connections[nickname].remove(websocket)
            if not self.active_connections[nickname]:
                del self.active_connections[nickname]

    async def send_to_user(self, nickname: str, message: dict):
        if nickname in self.active_connections:
            for connection in self.active_connections[nickname]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

# --- Profile API Endpoints ---

@app.post("/api/login")
async def login(data: dict):
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username:
        return {"error": "아이디를 입력해 주세요."}
    if not password:
        return {"error": "비밀번호를 입력해 주세요."}

    users = load_users()

    # 아이디 존재 여부 검증
    if username not in users:
        return {"error": "잘못된 아이디입니다. 먼저 회원가입을 진행해 주세요."}

    # 비밀번호 검증
    stored_password = users[username].get("password", "")
    if stored_password != password:
        return {"error": "비밀번호가 틀렸습니다."}

    return {"status": "success", "username": username, "nickname": users[username]["nickname"]}


@app.post("/api/register")
async def register(data: dict):
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    school = data.get("school", "").strip()
    student_id = data.get("student_id", "").strip()

    if not username:
        return {"error": "아이디를 입력해 주세요."}
    if not password:
        return {"error": "비밀번호를 입력해 주세요."}
    if not school:
        return {"error": "재학 중인 학교를 입력해 주세요."}
    if not student_id:
        return {"error": "학번을 입력해 주세요."}

    users = load_users()

    if username in users:
        return {"error": "이미 사용 중인 아이디입니다. 다른 아이디를 선택해 주세요."}

    users[username] = {
        "username": username,
        "nickname": username,
        "password": password,
        "school": school,
        "student_id": student_id
    }
    save_users(users)

    return {"status": "success", "message": "회원가입이 성공적으로 완료되었습니다."}

@app.post("/api/profile/nickname")
async def update_nickname(data: dict):
    username = data.get("username", "").strip()
    new_nickname = data.get("new_nickname", "").strip()
    
    if not username or not new_nickname:
        return {"error": "아이디와 새 닉네임을 모두 입력해 주세요."}
        
    users = load_users()
    if username not in users:
        return {"error": "사용자를 찾을 수 없습니다."}
        
    old_nickname = users[username]["nickname"]
    users[username]["nickname"] = new_nickname
    save_users(users)
    
    # Also update author in posts.json to keep points calculation aligned!
    posts = load_posts()
    updated = False
    for post in posts:
        if post.get("author") == old_nickname:
            post["author"] = new_nickname
            updated = True
    if updated:
        save_posts(posts)
        
    return {"status": "success", "username": username, "nickname": new_nickname}

@app.get("/api/profile/user/{username}")
async def get_profile_by_user(username: str):
    users = load_users()
    if username in users:
        nickname = users[username]["nickname"]
        points = get_user_points(nickname)
        return {"username": username, "nickname": nickname, "hearts": points}
    else:
        # Fallback if not found in db
        points = get_user_points(username)
        return {"username": username, "nickname": username, "hearts": points}

@app.get("/api/profile/{nickname}")
async def get_profile(nickname: str):
    points = get_user_points(nickname)
    return {"nickname": nickname, "hearts": points}

# --- Fridge API Endpoints ---

@app.get("/api/fridge/expiring-dates")
async def get_expiring_dates(user_id: str = "default_user"):
    import json
    from datetime import date, datetime
    import os
    
    FRIDGE_FILE = "fridge_items.json"
    if not os.path.exists(FRIDGE_FILE):
        return []
        
    try:
        with open(FRIDGE_FILE, "r", encoding="utf-8") as f:
            items = json.load(f)
    except Exception:
        return []

    items = [
        item for item in items
        if (item.get("user_id") or item.get("username", "default_user")) == user_id
    ]
        
    today = date.today()
    expiring_dates = []
    
    for item in items:
        expiry_str = item.get("expiry")
        if not expiry_str:
            continue
        try:
            # Parse expiry date (format is YYYY-MM-DD)
            expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d").date()
            delta = (expiry_date - today).days
            if delta <= 3:
                expiring_dates.append(expiry_str)
        except Exception:
            continue
            
    return list(set(expiring_dates))

# --- Posts API Endpoints ---

@app.get("/api/posts")
async def get_posts():
    return load_posts()

@app.post("/api/posts")
async def create_post(post_data: dict):
    title = post_data.get("title", "")
    content = post_data.get("content", "")
    author = post_data.get("author", "익명")
    category = post_data.get("category", "자유게시판")
    
    posts = load_posts()
    new_post = {
        "id": int(datetime.now().timestamp() * 1000),
        "title": title,
        "content": content,
        "author": author,
        "category": category,
        "emotions": {k: 0 for k in ["like", "dislike", "sad", "happy", "angry"]}
    }
    posts.insert(0, new_post)
    save_posts(posts)
    return new_post

@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: int):
    posts = load_posts()
    original_len = len(posts)
    posts = [post for post in posts if post["id"] != post_id]
    if len(posts) < original_len:
        save_posts(posts)
        return {"status": "success", "deleted_id": post_id}
    return {"error": "Post not found"}

@app.post("/api/posts/{post_id}/emotion")
async def update_emotion(post_id: int, data: dict):
    emotion = data.get("emotion")
    action = data.get("action")
    prev_emotion = data.get("prev_emotion")
    
    posts = load_posts()
    for post in posts:
        if post["id"] == post_id:
            if "emotions" not in post or not post["emotions"]:
                post["emotions"] = {k: 0 for k in ["like", "dislike", "sad", "happy", "angry"]}
            
            if action == "add":
                post["emotions"][emotion] = post["emotions"].get(emotion, 0) + 1
            elif action == "cancel":
                post["emotions"][emotion] = max(0, post["emotions"].get(emotion, 0) - 1)
            elif action == "change" and prev_emotion:
                post["emotions"][prev_emotion] = max(0, post["emotions"].get(prev_emotion, 0) - 1)
                post["emotions"][emotion] = post["emotions"].get(emotion, 0) + 1
                
            save_posts(posts)
            return post
    return {"error": "Post not found"}

# --- WebSocket Real-Time Chat ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, nickname: str = "익명"):
    await manager.connect(nickname, websocket)
    
    # Load and send user-specific chat history
    history = load_chat_history()
    user_history = history.get(nickname, {})
    await websocket.send_json({"type": "init", "chat_history": user_history})
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # 1. Handle sending message
            if data.get("type") == "message":
                opponent = data.get("opponent")  # Recipient's real nickname
                sender = nickname                # Sender's real nickname
                text = data.get("text")
                message_id = data.get("client_message_id") or str(uuid.uuid4())
                
                if opponent and text:
                    history = load_chat_history()
                    
                    if sender not in history:
                        history[sender] = {}
                    if opponent not in history[sender]:
                        history[sender][opponent] = []

                    if has_message_id(history[sender][opponent], message_id):
                        continue
                        
                    timestamp = datetime.now().strftime("%H:%M")
                    sender_points = get_user_points(sender)
                    badge = sender_points >= 80  # Star badge for level 5 (80+ points)
                    
                    sender_msg = {
                        "id": message_id,
                        "author": "나",
                        "text": text.strip(),
                        "timestamp": timestamp,
                        "badge": badge
                    }
                    
                    if sender == opponent:
                        # Self-chat: only append one and send one to prevent echo duplication
                        history[sender][opponent].append(sender_msg)
                        save_chat_history(history)
                        await manager.send_to_user(sender, {
                            "type": "message",
                            "opponent": opponent,
                            "message": sender_msg
                        })
                    else:
                        if opponent not in history:
                            history[opponent] = {}
                        if sender not in history[opponent]:
                            history[opponent][sender] = []
                            
                        recipient_msg = {
                            "id": message_id,
                            "author": sender,
                            "text": text.strip(),
                            "timestamp": timestamp,
                            "badge": badge
                        }
                        
                        history[sender][opponent].append(sender_msg)
                        history[opponent][sender].append(recipient_msg)
                        save_chat_history(history)
                        
                        # Direct message to opponent (if online)
                        await manager.send_to_user(opponent, {
                            "type": "message",
                            "opponent": sender,
                            "message": recipient_msg
                        })
                        
                        # Echo message back to sender's active connections
                        await manager.send_to_user(sender, {
                            "type": "message",
                            "opponent": opponent,
                            "message": sender_msg
                        })
                    
            # 2. Handle room creation
            elif data.get("type") == "create_room":
                opponent = data.get("opponent")
                sender = nickname
                
                if opponent:
                    history = load_chat_history()
                    
                    if sender not in history:
                        history[sender] = {}
                    if opponent not in history[sender]:
                        history[sender][opponent] = []
                        
                    if opponent not in history:
                        history[opponent] = {}
                    if sender not in history[opponent]:
                        history[opponent][sender] = []
                        
                    save_chat_history(history)
                    
                    # Notify sender
                    await manager.send_to_user(sender, {
                        "type": "room_created",
                        "opponent": opponent
                    })
                    # Notify recipient
                    await manager.send_to_user(opponent, {
                        "type": "room_created",
                        "opponent": sender
                    })
                    
            # 3. Handle room deletion (leaving)
            elif data.get("type") == "delete_room":
                opponent = data.get("opponent")
                sender = nickname
                
                if opponent:
                    history = load_chat_history()
                    
                    # Remove room for the leaving sender
                    if sender in history and opponent in history[sender]:
                      del history[sender][opponent]
                      
                    # Add a system warning to the recipient
                    if opponent in history and sender in history[opponent]:
                        timestamp = datetime.now().strftime("%H:%M")
                        system_msg = {
                            "id": str(uuid.uuid4()),
                            "author": "시스템",
                            "text": "상대방이 대화방을 나갔습니다.",
                            "timestamp": timestamp,
                            "badge": False
                        }
                        history[opponent][sender].append(system_msg)
                        
                        # Notify recipient of exit event
                        await manager.send_to_user(opponent, {
                            "type": "message",
                            "opponent": sender,
                            "message": system_msg
                        })
                        
                    save_chat_history(history)
                    
                    # Sync sender
                    await manager.send_to_user(sender, {
                        "type": "init",
                        "chat_history": history.get(sender, {})
                    })
                    
    except WebSocketDisconnect:
        manager.disconnect(nickname, websocket)
    except Exception:
        manager.disconnect(nickname, websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8010, reload=True)
