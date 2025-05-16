from flask import Flask, render_template, request, jsonify
import random
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Pokemon class to store pokemon attributes
class Pokemon:
    def __init__(self, name: str, type: str, hp: int, attack: int, defense: int, current_hp: int = None, image: str = None):
        self.name = name
        self.pokemon_type = type
        self.hp = hp
        self.attack = attack
        self.defense = defense
        self.max_hp = hp
        self.current_hp = current_hp if current_hp is not None else hp
        self.image = image
        self.special_moves = self._get_special_moves()

    def _get_special_moves(self) -> List[Dict]:
        """Get special moves based on Pokemon type"""
        moves = {
            'fire': [
                {'name': 'Flame Thrower', 'power': 90, 'accuracy': 0.9},
                {'name': 'Fire Blast', 'power': 110, 'accuracy': 0.85},
                {'name': 'Inferno', 'power': 100, 'accuracy': 0.8}
            ],
            'water': [
                {'name': 'Hydro Pump', 'power': 110, 'accuracy': 0.8},
                {'name': 'Surf', 'power': 90, 'accuracy': 0.9},
                {'name': 'Aqua Jet', 'power': 40, 'accuracy': 1.0}
            ],
            'grass': [
                {'name': 'Solar Beam', 'power': 120, 'accuracy': 0.75},
                {'name': 'Leaf Storm', 'power': 130, 'accuracy': 0.7},
                {'name': 'Razor Leaf', 'power': 55, 'accuracy': 0.95}
            ],
            'electric': [
                {'name': 'Thunder', 'power': 110, 'accuracy': 0.7},
                {'name': 'Thunderbolt', 'power': 90, 'accuracy': 0.9},
                {'name': 'Volt Tackle', 'power': 120, 'accuracy': 0.8}
            ]
        }
        return moves.get(self.pokemon_type, [])

    def to_dict(self) -> Dict:
        """Convert Pokemon instance to dictionary"""
        return {
            'name': self.name,
            'type': self.pokemon_type,
            'hp': self.hp,
            'current_hp': self.current_hp,
            'attack': self.attack,
            'defense': self.defense,
            'special_moves': self.special_moves,
            'image': self.image
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'Pokemon':
        """Create a Pokemon instance from a dictionary"""
        return cls(
            name=data['name'],
            type=data['type'],
            hp=data['hp'],
            attack=data['attack'],
            defense=data['defense'],
            current_hp=data.get('current_hp'),
            image=data.get('image')
        )

# Type effectiveness dictionary
TYPE_EFFECTIVENESS = {
    'fire': {'water': 0.5, 'grass': 2.0, 'electric': 1.0},
    'water': {'fire': 2.0, 'grass': 0.5, 'electric': 0.5},
    'grass': {'fire': 0.5, 'water': 2.0, 'electric': 1.0},
    'electric': {'fire': 1.0, 'water': 2.0, 'grass': 0.5}
}

# Available Pokemon pool
POKEMON_POOL = [
    {'name': 'Blaze', 'type': 'fire', 'hp': 1000, 'attack': 80, 'defense': 60, 'image': 'charizard.png'},
    {'name': 'Aqua', 'type': 'water', 'hp': 1200, 'attack': 70, 'defense': 70, 'image': 'blastoise.png'},
    {'name': 'Leaf', 'type': 'grass', 'hp': 2000, 'attack': 75, 'defense': 65, 'image': 'venusaur.png'},
    {'name': 'Spark', 'type': 'electric', 'hp': 1200, 'attack': 90, 'defense': 55, 'image': 'pikachu.png'},
    {'name': 'Inferno', 'type': 'fire', 'hp': 1500, 'attack': 85, 'defense': 65, 'image': 'arcanine.png'},
    {'name': 'Tidal', 'type': 'water', 'hp': 1799, 'attack': 75, 'defense': 75, 'image': 'gyarados.png'},
    {'name': 'Vine', 'type': 'grass', 'hp': 2400, 'attack': 70, 'defense': 70, 'image': 'victreebel.png'},
    {'name': 'Volt', 'type': 'electric', 'hp': 1950, 'attack': 85, 'defense': 60, 'image': 'raichu.png'},
    {'name': 'Flame', 'type': 'fire', 'hp': 1000, 'attack': 75, 'defense': 70, 'image': 'ninetales.png'},
    {'name': 'Wave', 'type': 'water', 'hp': 1902, 'attack': 65, 'defense': 80, 'image': 'vaporeon.png'}
]

def calculate_damage(attacker: Pokemon, defender: Pokemon, move: Dict) -> int:
    """Calculate damage based on attacker, defender, and move"""
    # Base damage calculation
    base_damage = (attacker.attack * move['power']) / defender.defense
    
    # Apply type effectiveness
    type_multiplier = TYPE_EFFECTIVENESS[attacker.pokemon_type].get(defender.pokemon_type, 1.0)
    
    # Apply random variation (0.85 to 1.0)
    random_multiplier = random.uniform(0.85, 1.0)
    
    # Calculate final damage
    final_damage = int(base_damage * type_multiplier * random_multiplier)
    
    return max(1, final_damage)  # Ensure minimum damage of 1

def execute_move(attacker: Pokemon, defender: Pokemon, move: Dict) -> Dict:
    """Execute a move and return the result"""
    if random.random() > move['accuracy']:
        return {
            'success': False,
            'message': f"{attacker.name}'s {move['name']} missed!"
        }
    
    damage = calculate_damage(attacker, defender, move)
    defender.current_hp = max(0, defender.current_hp - damage)
    
    return {
        'success': True,
        'message': f"{attacker.name} used {move['name']} and dealt {damage} damage!",
        'damage': damage,
        'remaining_hp': defender.current_hp
    }

@app.route('/')
def home():
    """Render the home page with available Pokemon"""
    return render_template('index.html', pokemon_list=POKEMON_POOL)

@app.route('/battle', methods=['POST'])
def battle():
    """Handle the battle logic"""
    try:
        logger.debug("Received battle request")
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        
        if not data:
            logger.error("No data received in request")
            return jsonify({'error': 'No data received'}), 400
            
        if 'player1_pokemon' not in data:
            logger.error("player1_pokemon not found in request data")
            return jsonify({'error': 'player1_pokemon is required'}), 400

        try:
            player1_pokemon_data = next(p for p in POKEMON_POOL if p['name'] == data['player1_pokemon'])
        except StopIteration:
            logger.error(f"Pokemon not found: {data['player1_pokemon']}")
            return jsonify({'error': f"Pokemon {data['player1_pokemon']} not found"}), 404
        
        # Randomly select a different Pokemon for player 2
        available_pokemon = [p for p in POKEMON_POOL if p['name'] != player1_pokemon_data['name']]
        player2_pokemon_data = random.choice(available_pokemon)
        
        # Create Pokemon instances
        player1 = Pokemon(**player1_pokemon_data)
        player2 = Pokemon(**player2_pokemon_data)
        
        response_data = {
            'player1': player1.to_dict(),
            'player2': player2.to_dict()
        }
        logger.debug(f"Sending response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.exception("Error in battle route")
        return jsonify({'error': str(e)}), 500

@app.route('/execute_move', methods=['POST'])
def execute_move_route():
    """Execute a move and return the result"""
    try:
        logger.debug("Received execute_move request")
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        
        if not data:
            logger.error("No data received in request")
            return jsonify({'error': 'No data received'}), 400
            
        required_fields = ['player1', 'player2', 'move']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Create Pokemon instances using the from_dict method
        player1 = Pokemon.from_dict(data['player1'])
        player2 = Pokemon.from_dict(data['player2'])
        move = data['move']
        
        # Execute the move
        result = execute_move(player1, player2, move)
        
        # Check if the battle is over
        if player2.current_hp <= 0:
            result['battle_over'] = True
            result['winner'] = player1.name
        else:
            # AI opponent's turn
            ai_move = random.choice(player2.special_moves)
            ai_result = execute_move(player2, player1, ai_move)
            result['ai_move'] = ai_result
            
            if player1.current_hp <= 0:
                result['battle_over'] = True
                result['winner'] = player2.name
        
        # Include updated Pokemon states
        result['player1'] = player1.to_dict()
        result['player2'] = player2.to_dict()
        
        logger.debug(f"Sending response: {result}")
        return jsonify(result)
        
    except Exception as e:
        logger.exception("Error in execute_move route")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5002, debug=True)
