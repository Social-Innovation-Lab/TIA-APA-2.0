# Tia Apa - AI Assistant for Bangladeshi Farmers

A multimodal generative AI assistant that helps Bangladeshi farmers by providing information through text, voice, and image inputs in both Bangla and English.

## Features

- Multimodal Input Support:
  - Text input with auto-suggestions
  - Voice input with transcription
  - Image upload with text prompts
- Bilingual Support (Bangla and English)
- Dataset-based responses with web fallback
- User-friendly interface optimized for farmers

## Tech Stack

- Frontend: Next.js
- Backend: Flask
- APIs: OpenAI (Assistant, Voice, Vision)

## Project Structure

```
tia-apa/
├── frontend/           # Next.js frontend application
├── backend/           # Flask backend server
├── data/             # CSV datasets
└── docs/             # Documentation
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- OpenAI API key

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```bash
   python app.py
   ```

## Environment Variables

Create `.env` files in both frontend and backend directories with the following variables:

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```
OPENAI_API_KEY=your_api_key_here
FLASK_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 