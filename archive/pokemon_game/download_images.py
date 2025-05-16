import requests
import os
from PIL import Image
from io import BytesIO

# Create static/images directory if it doesn't exist
os.makedirs('static/images', exist_ok=True)

# Pokemon image URLs (using official Pokemon images)
POKEMON_IMAGES = {
    'charizard.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
    'blastoise.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png',
    'venusaur.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png',
    'pikachu.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    'arcanine.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/59.png',
    'gyarados.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png',
    'victreebel.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/71.png',
    'raichu.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png',
    'ninetales.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/38.png',
    'vaporeon.png': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png'
}

def download_and_save_image(url, filename):
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Open the image and convert to RGBA if needed
        img = Image.open(BytesIO(response.content))
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Save the image
        img.save(f'static/images/{filename}')
        print(f'Successfully downloaded {filename}')
    except Exception as e:
        print(f'Error downloading {filename}: {str(e)}')

def main():
    print('Starting Pokemon image downloads...')
    for filename, url in POKEMON_IMAGES.items():
        download_and_save_image(url, filename)
    print('Download complete!')

if __name__ == '__main__':
    main() 