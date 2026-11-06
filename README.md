# dxtnn.site

Website portfolio pribadi Ibnu Dexton: profil, projek, dan pengalaman. Ada chatbot kecil bernama Ibnu's Virtual Assistant yang cuma menjawab pertanyaan tentang saya.

Live di https://dxtnn.site

## Stack

- React
- OpenAI API (gpt-4o-mini) untuk chatbot
- Vercel untuk hosting

## Jalankan di lokal

```bash
git clone <url-repo>
cd <folder-repo>
npm install
npm start
```

Chatbot butuh API key OpenAI. Taruh di `.env`:

```
OPENAI_API_KEY=...
```

## Chatbot

Asistennya dibatasi lewat system prompt supaya hanya menjawab hal seputar saya, dan panjang jawabannya dibatasi biar hemat token.

## Deploy

Push ke GitHub, import ke Vercel, lalu isi `OPENAI_API_KEY` di Environment Variables.

