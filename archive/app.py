from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory
import random
import os

app = Flask(__name__, static_folder='static')
app.secret_key = 'your_secret_key_here'  # Change this in production

# Ensure static directory exists
os.makedirs('static', exist_ok=True)

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# Pokemon data
pokemon_data = {
    'Latias': {
        'HP': 100,
        'Attack': 15,
        'Defense': 12,
        'type': 'dragon',
        'Attacks': {
            'Dragon Pulse': {'power': 20, 'type': 'dragon'},
            'Psychic': {'power': 18, 'type': 'psychic'},
            'Mist Ball': {'power': 25, 'type': 'dragon'},
            'Recover': {'power': 0, 'type': 'normal', 'heal': 25}
        }
    },
    'Charmander': {
        'HP': 100,
        'Attack': 18,
        'Defense': 15,
        'type': 'fire',
        'Attacks': {
            'Flamethrower': {'power': 25, 'type': 'fire'},
            'Dragon Claw': {'power': 28, 'type': 'dragon'},
            'Scratch': {'power': 18, 'type': 'normal'},
            'Ember': {'power': 20, 'type': 'fire'}
        }
    }
}

def calculate_damage(attacker, defender, attack):
    base_damage = attack['power']
    critical_hit = random.random() < 0.1  # 10% chance for critical hit
    if critical_hit:
        base_damage *= 1.5
    
    # Improved type effectiveness
    type_multiplier = 1.0
    if attack['type'] == 'fire' and defender['type'] == 'dragon':
        type_multiplier = 1.5
    elif attack['type'] == 'dragon' and defender['type'] == 'dragon':
        type_multiplier = 1.5
    elif attack['type'] == 'psychic' and defender['type'] == 'fire':
        type_multiplier = 1.2
    
    # More balanced damage calculation
    attack_stat = attacker['Attack']
    defense_stat = defender['Defense']
    level_factor = 1.0  # Can be adjusted for difficulty
    
    damage = int((base_damage * type_multiplier * level_factor) * (attack_stat / defense_stat))
    
    # Add some randomness to damage
    damage = int(damage * random.uniform(0.85, 1.15))
    
    if critical_hit:
        return damage, True
    return damage, False

@app.route('/')
def home():
    try:
        # Initialize session data
        session.clear()
        session['player_pokemon'] = pokemon_data['Latias'].copy()
        session['enemy_pokemon'] = pokemon_data['Charmander'].copy()
        session['player_turn'] = True
        session['battle_log'] = []
        return render_template('index.html')
    except Exception as e:
        print(f"Error in home route: {str(e)}")
        return "An error occurred. Please try again."

@app.route('/battle', methods=['GET', 'POST'])
def battle():
    try:
        if request.method == 'POST':
            if session['player_turn']:
                attack_name = request.form.get('attack')
                if not attack_name:
                    return redirect(url_for('battle'))
                
                # Ensure session data exists
                if 'player_pokemon' not in session or 'enemy_pokemon' not in session:
                    return redirect(url_for('home'))
                
                player_attack = session['player_pokemon']['Attacks'].get(attack_name)
                if not player_attack:
                    return redirect(url_for('battle'))
                
                # Handle healing attacks
                if 'heal' in player_attack:
                    heal_amount = player_attack['heal']
                    current_hp = session['player_pokemon']['HP']
                    max_hp = 100
                    new_hp = min(max_hp, current_hp + heal_amount)
                    session['player_pokemon']['HP'] = new_hp
                    session['battle_log'].append(f"Latias used {attack_name} and healed {heal_amount} HP!")
                else:
                    # Handle damaging attacks
                    damage, is_critical = calculate_damage(
                        session['player_pokemon'],
                        session['enemy_pokemon'],
                        player_attack
                    )
                    session['enemy_pokemon']['HP'] = max(0, session['enemy_pokemon']['HP'] - damage)
                    crit_msg = " It's a critical hit!" if is_critical else ""
                    session['battle_log'].append(f"Latias used {attack_name} and dealt {damage} damage!{crit_msg}")
                
                if session['enemy_pokemon']['HP'] <= 0:
                    return redirect(url_for('result', winner='player'))
                
                session['player_turn'] = False
                
                # Enemy's turn
                enemy_attacks = list(session['enemy_pokemon']['Attacks'].keys())
                enemy_attack_name = random.choice(enemy_attacks)
                enemy_attack = session['enemy_pokemon']['Attacks'][enemy_attack_name]
                
                # Enemy can't use healing moves
                while 'heal' in enemy_attack:
                    enemy_attack_name = random.choice(enemy_attacks)
                    enemy_attack = session['enemy_pokemon']['Attacks'][enemy_attack_name]
                
                damage, is_critical = calculate_damage(
                    session['enemy_pokemon'],
                    session['player_pokemon'],
                    enemy_attack
                )
                
                session['player_pokemon']['HP'] = max(0, session['player_pokemon']['HP'] - damage)
                crit_msg = " It's a critical hit!" if is_critical else ""
                session['battle_log'].append(f"Charmander used {enemy_attack_name} and dealt {damage} damage!{crit_msg}")
                
                if session['player_pokemon']['HP'] <= 0:
                    return redirect(url_for('result', winner='enemy'))
                
                session['player_turn'] = True
        
        # Ensure session data exists for GET requests
        if 'player_pokemon' not in session or 'enemy_pokemon' not in session:
            return redirect(url_for('home'))
        
        # Get two random attacks for the player to choose from
        available_attacks = list(session['player_pokemon']['Attacks'].keys())
        random_attacks = random.sample(available_attacks, 2)
        
        return render_template('battle.html',
                            player_pokemon=session['player_pokemon'],
                            enemy_pokemon=session['enemy_pokemon'],
                            available_attacks=random_attacks,
                            battle_log=session.get('battle_log', []))
    except Exception as e:
        print(f"Error in battle route: {str(e)}")
        return redirect(url_for('home'))

@app.route('/result/<winner>')
def result(winner):
    return render_template('result.html', winner=winner)

if __name__ == '__main__':
    app.run(debug=True) 