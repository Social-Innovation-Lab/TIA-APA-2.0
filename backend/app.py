from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import openai
import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import base64

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Initialize sentence transformer model for semantic search
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# Load datasets
datasets = {}
dataset_embeddings = {}

def load_datasets():
    """Load all CSV files from the data directory"""
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    for filename in os.listdir(data_dir):
        if filename.endswith('.csv'):
            df = pd.read_csv(os.path.join(data_dir, filename))
            datasets[filename] = df
            # Create embeddings for semantic search
            text_columns = df.select_dtypes(include=['object']).columns
            combined_text = df[text_columns].apply(lambda x: ' '.join(x.astype(str)), axis=1)
            embeddings = model.encode(combined_text.tolist())
            dataset_embeddings[filename] = embeddings

def semantic_search(query, threshold=0.5):
    """Search for relevant information in datasets using semantic similarity"""
    query_embedding = model.encode([query])[0]
    results = []
    
    for filename, embeddings in dataset_embeddings.items():
        similarities = cosine_similarity([query_embedding], embeddings)[0]
        max_sim_idx = np.argmax(similarities)
        max_similarity = similarities[max_sim_idx]
        
        if max_similarity >= threshold:
            results.append({
                'dataset': filename,
                'row': datasets[filename].iloc[max_sim_idx].to_dict(),
                'similarity': float(max_similarity)
            })
    
    return [r for r in sorted(results, key=lambda x: x['similarity'], reverse=True) if r['similarity'] >= 0.6]

def extract_relevant_columns(query, row):
    query_lower = query.lower()
    if 'solution' in query_lower or 'সমাধান' in query_lower or 'advice' in query_lower:
        return row.get('Probable Solution') or row.get('Advice/ solution given')
    if 'symptom' in query_lower or 'লক্ষণ' in query_lower:
        return row.get('Symptoms')
    if 'date' in query_lower or 'তারিখ' in query_lower:
        return row.get('Date')
    # Add more rules as needed
    # Fallback: return the most important column, or a default message
    return next(iter(row.values()), 'No relevant answer found')

@app.route('/api/query', methods=['POST'])
def handle_query():
    """Handle text queries"""
    data = request.json
    query = data.get('query', '')
    language = data.get('language', 'en')  # 'en' or 'bn'
    
    # Search in datasets
    dataset_results = semantic_search(query)
    
    if dataset_results:
        # Use dataset information
        filtered_results = []
        for result in dataset_results:
            filtered_row = extract_relevant_columns(query, result['row'])
            filtered_results.append(filtered_row)
        response = {
            'source': 'dataset',
            'data': filtered_results,
            'confidence': dataset_results[0]['similarity']
        }
    else:
        # Fallback to OpenAI API
        try:
            completion = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are Tia Apa, a helpful AI assistant for Bangladeshi farmers. Provide clear, simple answers in the specified language."},
                    {"role": "user", "content": f"Language: {language}\nQuery: {query}"}
                ]
            )
            response = {
                'source': 'openai',
                'data': completion.choices[0].message.content,
                'confidence': 1.0
            }
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify(response)

@app.route('/api/transcribe', methods=['POST'])
def handle_voice():
    """Handle voice input"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    language = request.form.get('language', 'en')
    
    try:
        # Transcribe audio using OpenAI Whisper API
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language
        )
        
        return jsonify({
            'transcript': transcript.text
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-image', methods=['POST'])
def handle_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']
    prompt = request.form.get('prompt', '')
    language = request.form.get('language', 'en')

    image_bytes = image_file.read()

    try:
        # 1. Use OpenAI Vision to get a description of the image
        vision_response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe the agricultural problem or disease in this image."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64.b64encode(image_bytes).decode()}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        image_description = vision_response.choices[0].message.content

        # 2. Combine image description and user prompt for semantic search
        combined_query = f"{image_description}\n{prompt}"

        # 3. Search your CSVs for a solution
        dataset_results = semantic_search(combined_query)
        if dataset_results:
            filtered_results = []
            for result in dataset_results:
                filtered_row = extract_relevant_columns(prompt, result['row'])
                filtered_results.append(filtered_row)
            return jsonify({
                'source': 'dataset',
                'data': filtered_results,
                'confidence': dataset_results[0]['similarity']
            })

        # 4. Fallback: Use OpenAI to answer the question based on the image and prompt
        fallback_response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Language: {language}\nPrompt: {prompt}\nBased on this image, answer the question or provide a solution."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64.b64encode(image_bytes).decode()}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        return jsonify({
            'source': 'openai',
            'analysis': fallback_response.choices[0].message.content
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_datasets()
    app.run(debug=True) 