from flask import Flask, jsonify, send_from_directory, request  # Flask's request
import os
from flask_cors import CORS
import shutil
import logging
import time
import requests  # For external API calls
from pathlib import Path

# Import your video analysis function
from EyeTracker import analyze_video  # Make sure this file has the updated code

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('video_upload')

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEOS_DIR = os.path.join(SCRIPT_DIR, "videos")

# OpenAI Configuration
OPENAI_API_MODEL = "gpt-4"  # Updated model name
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

@app.route('/openai', methods=['POST'])
def openai_chat():
    try:
        data = request.json
        messages = data.get('messages', [])
        
        if not messages:
            return jsonify({"error": "No messages provided"}), 400
        
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            logger.error("OpenAI API key not found")
            return jsonify({"error": "API key not configured"}), 500
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        payload = {
            "model": OPENAI_API_MODEL,  # Using configured model name
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.7
        }
        
        logger.info(f"Sending request to OpenAI API with model: {OPENAI_API_MODEL}")
        response = requests.post(
            OPENAI_API_URL,
            headers=headers,
            json=payload,
            timeout=30  # Add timeout
        )
        
        if response.status_code != 200:
            error_msg = response.json().get('error', {}).get('message', 'Unknown error')
            logger.error(f"OpenAI API error: {response.status_code} - {error_msg}")
            return jsonify({
                "error": f"OpenAI API error",
                "details": error_msg
            }), response.status_code
        
        response_data = response.json()
        ai_message = response_data['choices'][0]['message']['content']
        
        return jsonify({
            "response": ai_message,
            "model": OPENAI_API_MODEL
        })
    
    except requests.exceptions.Timeout:
        logger.error("OpenAI API request timed out")
        return jsonify({"error": "Request to OpenAI timed out"}), 504
    except Exception as e:
        logger.error(f"Error in OpenAI chat: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/upload_video', methods=['POST'])
def upload_video():
    try:
        if 'video' not in request.files:
            logger.error("No video file in request")
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        
        if video_file.filename == '':
            logger.error("Empty filename submitted")
            return jsonify({"error": "Empty filename"}), 400
        
        # Create videos directory if it doesn't exist
        os.makedirs(VIDEOS_DIR, exist_ok=True)
        
        # Save as session.mp4 in the videos directory
        video_path = os.path.join(VIDEOS_DIR, "session.mp4")
        
        logger.info(f"Saving video to: {video_path}")
        video_file.save(video_path)
        
        # Run analysis on the video, explicitly passing the output directory
        logger.info("Starting video analysis...")
        result = analyze_video(video_path, output_dir=VIDEOS_DIR)
        
        plot_filename = result["plot_filename"]
        stats = result["stats"]
        
        return jsonify({
            "success": True,
            "message": "Video uploaded and analyzed successfully",
            "filepath": video_path,
            "plot_url": f"/plots/{plot_filename}",
            "stats": stats
        })
    
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/plots/<filename>', methods=['GET'])
def serve_plot(filename):
    return send_from_directory(VIDEOS_DIR, filename)

@app.route('/analyze_latest', methods=['GET'])
def analyze_latest():
    try:
        video_path = os.path.join(VIDEOS_DIR, "session.mp4")
        if not os.path.exists(video_path):
            return jsonify({"error": "No video found for analysis"}), 404
            
        # Pass the output directory explicitly
        print("Before API call")
        result = analyze_video(video_path, output_dir=VIDEOS_DIR)
        plot_filename = result["plot_filename"]
        stats = result["stats"]
        print("After API call")
        
        return jsonify({
            "success": True,
            "message": "Video analyzed successfully",
            "plot_url": f"/plots/{plot_filename}",
            "stats": stats
        })
    except Exception as e:
        logger.error(f"Error analyzing video: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
def deleteFiles():
    # Clear out the contents of the videos directory if it exists
    if os.path.exists(VIDEOS_DIR):
        for filename in os.listdir(VIDEOS_DIR):
            file_path = os.path.join(VIDEOS_DIR, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)  # Remove file or link
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)  # Remove directory
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
    else:
        os.makedirs(VIDEOS_DIR)

if __name__ == '__main__':

    # Create videos directory at startup
    deleteFiles()
    os.makedirs(VIDEOS_DIR, exist_ok=True)
    
    logger.info(f"Server starting. Videos directory: {VIDEOS_DIR}")
    app.run(host='0.0.0.0', port=5000, debug=True)