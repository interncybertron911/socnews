FROM node:20-bookworm

# ติดตั้ง python3 + pip
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Python deps (cache-friendly) ---
COPY requirements.txt ./requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# --- Node deps + build ---
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Render จะส่ง PORT มาให้
ENV PYTHON_BIN=python3
EXPOSE 3000

CMD ["npm", "start"]