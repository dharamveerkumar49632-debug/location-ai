import os
import hashlib
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app)

DB_URL = "https://kvdb.io/dharamveer_ai_db_2026_07/users"

# Helper: Hash password
def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

# Helper: Read cloud database
def get_cloud_users():
    try:
        response = requests.get(DB_URL, timeout=10)
        if response.status_code == 404:
            return {}
        return response.json()
    except Exception as e:
        print("Database read error:", e)
        return {}

# Helper: Save cloud database
def save_cloud_users(users):
    try:
        requests.post(DB_URL, json=users, timeout=10)
        return True
    except Exception as e:
        print("Database write error:", e)
        return False

# --- Static File Routing ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# --- Authentication APIs ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    users = get_cloud_users()
    if username in users:
        return jsonify({"error": "Username already exists"}), 400

    hashed = hash_password(password)
    users[username] = {
        "password": hashed,
        "geminiApiKey": "",
        "geminiModelName": "gemini-1.5-flash",
        "socialLinks": {
            "instagram": "https://instagram.com",
            "twitter": "https://twitter.com",
            "github": "https://github.com",
            "linkedin": "https://linkedin.com"
        }
    }

    if save_cloud_users(users):
        return jsonify({"success": True, "profile": users[username]})
    else:
        return jsonify({"error": "Failed to save user credentials"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    users = get_cloud_users()
    user_profile = users.get(username)

    if not user_profile:
        return jsonify({"error": "Invalid username or password"}), 401

    # Handle legacy string format passwords
    saved_hash = user_profile if isinstance(user_profile, str) else user_profile.get("password")
    entered_hash = hash_password(password)

    if saved_hash == entered_hash:
        # Standardize response profile format
        profile = {
            "username": username,
            "geminiApiKey": "" if isinstance(user_profile, str) else user_profile.get("geminiApiKey", ""),
            "geminiModelName": "gemini-1.5-flash" if isinstance(user_profile, str) else user_profile.get("geminiModelName", "gemini-1.5-flash"),
            "socialLinks": {
                "instagram": "https://instagram.com",
                "twitter": "https://twitter.com",
                "github": "https://github.com",
                "linkedin": "https://linkedin.com"
            } if isinstance(user_profile, str) else user_profile.get("socialLinks", {})
        }
        return jsonify({"success": True, "profile": profile})
    else:
        return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/sync', methods=['POST'])
def sync_profile():
    data = request.json
    username = data.get('username', '').strip()
    api_key = data.get('geminiApiKey', '')
    model_name = data.get('geminiModelName', 'gemini-1.5-flash')
    socials = data.get('socialLinks', {})

    if not username:
        return jsonify({"error": "Username required"}), 400

    users = get_cloud_users()
    if username not in users:
        return jsonify({"error": "User profile not found"}), 404

    # Keep password, update preferences
    user_profile = users[username]
    if isinstance(user_profile, str):
        users[username] = {
            "password": user_profile,
            "geminiApiKey": api_key,
            "geminiModelName": model_name,
            "socialLinks": socials
        }
    else:
        users[username]["geminiApiKey"] = api_key
        users[username]["geminiModelName"] = model_name
        users[username]["socialLinks"] = socials

    if save_cloud_users(users):
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to sync profile configuration"}), 500

# --- Gemini Chat Proxy API ---
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    prompt = data.get('prompt', '')
    api_key = data.get('apiKey', '')
    model_name = data.get('modelName', 'gemini-1.5-flash')

    if not prompt or not api_key:
        return jsonify({"error": "Prompt and API Key required"}), 400

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        response = requests.post(gemini_url, json=payload, headers=headers, timeout=30)
        result = response.json()
        if response.status_code == 200:
            return jsonify(result)
        else:
            return jsonify({"error": result.get("error", {}).get("message", "API request failed")}), response.status_code
    except Exception as e:
        return jsonify({"error": f"Failed to contact Gemini API: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(port=8000, debug=True)
