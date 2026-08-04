from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)


def ask_groq(prompt: str):

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3
    )

    text = response.choices[0].message.content

    # Remove Markdown code fences if present
    text = text.replace("```json", "")
    text = text.replace("```", "")
    text = text.strip()

    return text