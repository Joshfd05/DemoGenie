# DemoGenie
DemoGenie – “Your AI assistant for seamless demo scheduling and prep.”

## Running the Frontend Locally

This section explains how to run the frontend for testing and development.

### Prerequisites
- Node.js installed
- pnpm package manager installed

### Steps

1. **Navigate to the frontend folder**  
- cd /path/to/DemoGenie/Frontend

2. **Install dependencies**
- pnpm install

3. **Start the development server**
- pnpm dev

4. **View the app**
- Open your browser and go to http://localhost:3000
 to see the frontend in action.


## Running the Backend Locally

This section explains how to run the backend using FastAPI.

### Prerequisites

* Python 3 installed
* `pip` available

### Steps

1. **Navigate to the backend folder**

bash
cd /path/to/DemoGenie/Backend

2. **Create and activate a virtual environment**
- python3 -m venv .venv
- source .venv/bin/activate

3. **Install dependencies**
- pip install fastapi uvicorn pydantic
- pip install "pydantic[email]"

4 **Run the development server**
- cd /home/joshua/DemoGenie
- uvicorn Backend.main:app --host 0.0.0.0 --port 8000 --reload

5. **View the backend**
- Open your browser and go to http://localhost:8000
