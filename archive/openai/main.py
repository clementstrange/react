import requests, json
from anthropic import Anthropic
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

#newsapi
newsapi = os.getenv('NEWS_API_KEY')
country = "us"
url = f"https://newsapi.org/v2/top-headlines?country={country}&apiKey={newsapi}"

response = requests.get(url)
data = response.json()
# print(json.dumps(data,indent=2))


#claude
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

response = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=100,
    messages=[
        {"role": "user", "content": f"Summarize and print the 5 news headlines from this json dump {data}"}
    ]
)

print(response.content[0].text)


# import openai

# openai.organization = os.environ['organizationID']
# openai.api_key = os.environ['openai']
# openai.Model.list()

# prompt = "Who is the most handsome bald man?"

# response = openai.Completion.create(model="text-davinci-002", prompt=prompt, temperature=0, max_tokens=6)

# print(response["choices"][0]["text"].strip())