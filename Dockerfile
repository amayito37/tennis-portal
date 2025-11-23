# Dockerfile

FROM python:3.11-slim

# Prevent Python from buffering output
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /backend/app

# Install system dependencies (psycopg2 needs this)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy your whole backend into the container
COPY . .

# Expose port for Uvicorn
EXPOSE 1000

# Default command to run your app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "1000"]
