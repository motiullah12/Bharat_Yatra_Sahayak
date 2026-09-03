from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # needed for session cookies (profile storage)
CORS(app, supports_credentials=True)

# ---------------- Mock data for demonstration ----------------
DESTINATIONS = {
    "jaipur": {"name": "Jaipur", "timings": "9 AM - 6 PM", "price": "₹500",
               "image": "https://images.unsplash.com/photo-1599661046289-e318978567c4?q=80&w=500&auto=format&fit=crop"},
    "spiti": {"name": "Spiti Valley", "timings": "Always Open", "price": "Free Entry",
              "image": "https://images.unsplash.com/photo-1581430873902-8616110f081d?q=80&w=500&auto=format&fit=crop"},
    "kerala": {"name": "Kerala Backwaters", "timings": "6 AM - 8 PM", "price": "₹800",
               "image": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=500&auto=format&fit=crop"},
    "varanasi": {"name": "Varanasi Ghats", "timings": "Always Open", "price": "Free Entry",
                 "image": "https://images.unsplash.com/photo-1561361058-c24cecae35ca?q=80&w=500&auto=format&fit=crop"},
    "ladakh": {"name": "Ladakh", "timings": "May - Sept (Best Season)", "price": "₹400 (Permit)",
               "image": "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=500&auto=format&fit=crop"},
}

TRANSLATIONS = {
    "hindi": {"I need help": "मुझे मदद चाहिए", "Call police": "पुलिस को बुलाओ", "How much?": "कितना हुआ?",
              "Where is the nearest train station?": "नज़दीकी रेलवे स्टेशन कहाँ है?"},
    "tamil": {"I need help": "எனக்கு உதவி தேவை", "Call police": "காவல்துறையை அழைக்கவும்", "How much?": "எவ்வளவு?"}
}

# ---------------- Frontend routes (serve HTML pages) ----------------
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/assistant')
def assistant_page():
    return render_template('assistant.html')

@app.route('/emergency')
def emergency_page():
    return render_template('emergency.html')

@app.route('/translate')
def translate_page():
    return render_template('translate.html')

@app.route('/profile')
def profile_page():
    return render_template('profile.html')

# ---------------- API routes ----------------
@app.route('/api/travel-assistant', methods=['POST'])
def travel_assistant():
    data = request.json or {}
    query = data.get('query', '').lower()

    for key in DESTINATIONS:
        if key in query:
            return jsonify({"success": True, "result": DESTINATIONS[key]})

    if "offbeat" in query or "hidden" in query:
        return jsonify({"success": True, "result": DESTINATIONS["spiti"]})

    return jsonify({
        "success": True,
        "result": {
            "info": "I can help with destinations like Jaipur, Kerala, Varanasi, Spiti, or Ladakh. Try asking about one of them!"
        }
    })

@app.route('/api/translate', methods=['POST'])
def translate():
    data = request.json or {}
    text = data.get('text', '')
    target = data.get('target', 'hindi').lower()

    lang_dict = TRANSLATIONS.get(target, {})
    # Case-insensitive phrase matching
    translated = None
    for phrase, value in lang_dict.items():
        if phrase.lower() == text.lower().strip():
            translated = value
            break
    if translated is None:
        translated = f"[No pre-set translation for '{text}' in {target} — this is a demo dictionary, not a real translation API]"
    return jsonify({"success": True, "translated_text": translated})

@app.route('/api/emergency', methods=['GET'])
def emergency():
    return jsonify({
        "success": True,
        "nearest_police": "Central Park Police Station (0.5km)",
        "nearest_hospital": "Apollo Speciality Hospital (1.2km)",
        "contacts": ["112", "100", "108"]
    })

@app.route('/api/profile', methods=['GET'])
def get_profile():
    profile = session.get('profile')
    if profile:
        return jsonify({"success": True, "exists": True, "profile": profile})
    return jsonify({"success": True, "exists": False, "profile": None})

@app.route('/api/profile', methods=['POST'])
def save_profile():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    emergency_name = (data.get('emergency_name') or '').strip()
    emergency_relation = (data.get('emergency_relation') or '').strip()

    if not name:
        return jsonify({"success": False, "error": "Name is required"}), 400

    profile = {
        "name": name,
        "email": email,
        "emergency_name": emergency_name,
        "emergency_relation": emergency_relation
    }
    session['profile'] = profile
    return jsonify({"success": True, "profile": profile})

@app.route('/api/profile', methods=['DELETE'])
def delete_profile():
    session.pop('profile', None)
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)