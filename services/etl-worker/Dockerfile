FROM python:3.12-slim

WORKDIR /app

COPY services/etl-worker/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY services/etl-worker ./
COPY database/seeds ./database/seeds

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
