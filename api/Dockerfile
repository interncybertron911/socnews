FROM node:20-bookworm

# ติดตั้ง python3 + venv + pip
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Python deps (ติดตั้งใน venv เพื่อเลี่ยง PEP 668) ---
COPY requirements.txt ./requirements.txt
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# --- Node deps + build ---
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV PYTHON_BIN=python3
EXPOSE 3000

CMD ["npm", "start"]