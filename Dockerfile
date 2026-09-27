FROM python:3.11-slim

WORKDIR /app

# System deps kept minimal - scikit-learn/pandas wheels are precompiled,
# so we don't need build-essential etc.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
