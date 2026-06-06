import streamlit as st
import json
import os
import time
from datetime import datetime

# Page Configuration
st.set_page_config(page_title="얌잇 실시간 쪽지함", layout="wide")

# File-based persistence for chat messages
CHAT_HISTORY_FILE = "chat_history.json"

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
    except Exception as e:
        pass

# Session state initialization
if "chat_history" not in st.session_state:
    st.session_state.chat_history = load_chat_history()

if "screen" not in st.session_state:
    st.session_state.screen = "list"

if "active_chat" not in st.session_state:
    st.session_state.active_chat = None

if "needs_reply" not in st.session_state:
    st.session_state.needs_reply = False

if "last_user_message" not in st.session_state:
    st.session_state.last_user_message = ""

# Handle query parameter to open or create chat from community section
# React passes ?create_chat=익명X&t=timestamp
create_chat = st.query_params.get("create_chat") or st.query_params.get("user")
t = st.query_params.get("t")

if create_chat and t:
    if st.session_state.get("last_processed_t") != t:
        if create_chat not in st.session_state.chat_history:
            st.session_state.chat_history[create_chat] = []
            save_chat_history(st.session_state.chat_history)
        st.session_state.active_chat = create_chat
        st.session_state.screen = "chatroom"
        st.session_state.last_processed_t = t
        if "back_clicked" in st.session_state:
            st.session_state.back_clicked = False
        st.rerun()

# Styling and Scroll prevention
st.markdown(
    """
    <style>
    /* Hide Streamlit default components */
    #MainMenu {visibility: hidden;}
    header {visibility: hidden;}
    footer {visibility: hidden;}
    #ConnectionStatus { display: none !important; }
    [data-testid="stStatusWidget"] { display: none !important; }

    /* Box-sizing lock to prevent padding overflow */
    *, *:before, *:after {
        box-sizing: border-box !important;
    }

    /* Prevent page scroll and set full width */
    html, body, [data-testid="stAppViewContainer"], [data-testid="stApp"] {
        color: #2c3a5c !important;
        background-color: #ffffff !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    
    .block-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 8px !important;
    }

    /* Hide scrollbars visually */
    ::-webkit-scrollbar {
        display: none !important;
    }

    /* Sidebar Title styling */
    .sidebar-title {
        font-size: 16px !important;
        font-weight: 800 !important;
        color: #2c3a5c !important;
        margin-bottom: 12px !important;
        padding-left: 4px;
        border-left: 3px solid #ff6b6b;
    }

    /* Custom Header inside right chat box */
    .chat-header {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        background-color: #ffffff;
        border-bottom: 1px solid #f1f3f5;
        width: 100%;
        position: sticky;
        top: 0;
        z-index: 10;
    }
    .chat-opponent {
        font-size: 13.5px;
        font-weight: bold;
        color: #2c3a5c;
        flex-grow: 1;
    }
    .chat-status {
        font-size: 10px;
        color: #2ecc71;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 3px;
    }

    /* Primary Accent buttons styling */
    button[kind="primary"] {
        background-color: #ff6b6b !important;
        color: #ffffff !important;
        border: 1px solid #ff6b6b !important;
    }

    /* Native chat input styling lock to bottom */
    [data-testid="stChatInput"] {
        position: sticky;
        bottom: 0;
        background-color: #ffffff !important;
        border-top: 1px solid #f1f3f5 !important;
        padding: 10px !important;
        z-index: 10;
    }

    /* KakaoTalk List Item Styling */
    .chat-list-container div.stButton > button {
        text-align: left !important;
        display: block !important;
        width: 100% !important;
        padding: 14px 16px !important;
        border-radius: 12px !important;
        border: 1px solid #e2e8f0 !important;
        background-color: #ffffff !important;
        margin-bottom: 10px !important;
        transition: all 0.2s ease !important;
        color: #2c3a5c !important;
        white-space: pre-line !important;
        line-height: 1.5 !important;
        font-size: 13px !important;
    }
    .chat-list-container div.stButton > button:hover {
        background-color: #fff8f8 !important;
        border-color: #ff6b6b !important;
        color: #ff6b6b !important;
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.1) !important;
    }

    /* Back Button Styling Wrapper */
    .back-btn-container div.stButton > button {
        background-color: #f1f3f5 !important;
        color: #4a5568 !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: bold !important;
        padding: 4px 10px !important;
        height: 38px !important;
    }
    .back-btn-container div.stButton > button:hover {
        background-color: #e2e8f0 !important;
        border-color: #cbd5e0 !important;
    }
    </style>
    """,
    unsafe_allow_html=True
)

if st.session_state.screen == "list":
    # 1. Chatroom List Screen
    st.markdown('<div class="sidebar-title">쪽지함 💬</div>', unsafe_allow_html=True)
    
    opponents = list(st.session_state.chat_history.keys())
    if not opponents:
        st.markdown(
            """
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px; color: #a0aec0; text-align: center; padding: 20px;">
                <span style="font-size: 48px; margin-bottom: 15px;">💬</span>
                <div style="font-size: 14px; font-weight: bold; color: #2c3a5c;">개설된 대화방이 없습니다</div>
                <div style="font-size: 11px; margin-top: 6px; color: #718096;">자유게시판 등에서 상대방에게 쪽지를 보내보세요.</div>
            </div>
            """,
            unsafe_allow_html=True
        )
    else:
        st.markdown('<div class="chat-list-container">', unsafe_allow_html=True)
        for opp in opponents:
            msgs = st.session_state.chat_history.get(opp, [])
            last_text = msgs[-1]["text"] if msgs else "대화 내용이 없습니다."
            last_time = msgs[-1]["timestamp"] if msgs else ""
            if len(last_text) > 30:
                last_text = last_text[:30] + "..."
            
            # Button label formatted nicely
            btn_label = f"👤 {opp}  •  {last_time}\n💬 {last_text}"
            
            if st.button(btn_label, key=f"room_{opp}", use_container_width=True):
                st.session_state.active_chat = opp
                st.session_state.screen = "chatroom"
                st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

else:
    # 2. 1:1 Chatroom Screen
    active_opp = st.session_state.active_chat
    if not active_opp:
        st.session_state.screen = "list"
        st.rerun()
        
    # Header with back button using st.columns
    h_col1, h_col2 = st.columns([2.5, 7.5])
    with h_col1:
        st.markdown('<div class="back-btn-container">', unsafe_allow_html=True)
        if st.button("◀ 목록", key="back_to_list_btn", use_container_width=True):
            st.session_state.screen = "list"
            st.session_state.active_chat = None
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)
            
    with h_col2:
        st.markdown(
            f"""
            <div style="display: flex; align-items: center; height: 100%; min-height: 40px; padding-left: 5px;">
                <span style="font-size: 14px; font-weight: bold; color: #2c3a5c;">{active_opp}님과의 쪽지</span>
                <span style="font-size: 10px; color: #2ecc71; font-weight: bold; margin-left: 8px; display: flex; align-items: center; gap: 3px;">
                    ● 온라인
                </span>
            </div>
            """,
            unsafe_allow_html=True
        )
        
    st.markdown("<hr style='margin: 8px 0; border: none; border-top: 1px solid #f1f3f5;'>", unsafe_allow_html=True)
    
    # Message History Container
    messages = st.session_state.chat_history.get(active_opp, [])
    
    for msg in messages:
        role = "user" if msg["author"] == "나" else "assistant"
        avatar = "🥑" if role == "user" else "🥕"
        with st.chat_message(role, avatar=avatar):
            st.write(msg["text"])
            
    # Chat Input Field
    chat_msg = st.chat_input("쪽지 메시지를 입력하세요...", key="chat_msg_input")
    if chat_msg:
        # Save user message
        new_msg = {
            "author": "나",
            "text": chat_msg.strip(),
            "timestamp": datetime.now().strftime("%H:%M")
        }
        st.session_state.chat_history[active_opp].append(new_msg)
        save_chat_history(st.session_state.chat_history)
        
        # Setup bot auto-reply parameters
        st.session_state.needs_reply = True
        st.session_state.last_user_message = chat_msg.strip()
        st.rerun()

# Bot reply simulation process (independent of screen rendering, runs in background)
if st.session_state.needs_reply and st.session_state.active_chat:
    time.sleep(1.0)
    opp = st.session_state.active_chat
    user_txt = st.session_state.last_user_message
    
    # Custom automated replies
    if any(k in user_txt for k in ["레시피", "요리", "추천"]):
        reply = f"반갑습니다! {opp}입니다. 자취 요리는 얌잇 추천 기능 쓰시면 아주 편리해요 🍳 냉장고 털 때 제격이죠!"
    elif any(k in user_txt for k in ["배고파", "밥"]):
        reply = "라면만 드시지 말고 계란말이나 볶음밥처럼 든든한 밥 요리 챙겨 드세요! 소금이 있어야 맛있습니다 ㅎㅎ"
    elif any(k in user_txt for k in ["안녕", "반가워", "하이"]):
        reply = f"안녕하세요! {opp}입니다. 쪽지 주셔서 감사해요. 식재료나 요리 관련 궁금한 점은 언제든 톡 주세요!"
    else:
        reply = f"쪽지 고마워요! 저도 오늘 저녁은 얌잇 앱 추천 식단으로 요리해 볼 생각이에요 👍"
        
    bot_msg = {
        "author": opp,
        "text": reply,
        "timestamp": datetime.now().strftime("%H:%M")
    }
    
    st.session_state.chat_history[opp].append(bot_msg)
    save_chat_history(st.session_state.chat_history)
    st.session_state.needs_reply = False
    st.rerun()
