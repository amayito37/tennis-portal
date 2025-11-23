# Use slim Python image
FROM python:3.12-slim

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Create the app directory
WORKDIR /app/backend

# Install system deps
RUN apt-get update && apt-get install -y build-essential && apt-get clean

# Copy backend folder
COPY backend /app/backend

# Install requirements
RUN pip install --no-cache-dir -r requirements.txt

# Expose Fly.io port
EXPOSE 1000

# Run FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "1000"]
