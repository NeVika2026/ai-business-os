FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone --depth=1 https://github.com/kiryano/Scout.git /opt/scout \
    && pip install --no-cache-dir -r /opt/scout/requirements.txt

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

ENV SCOUT_ROOT=/opt/scout
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
