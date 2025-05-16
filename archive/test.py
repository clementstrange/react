import random
import os


my_pokemon = {"Latias" : {"HP": 100, "Attack": random.randint(1, 20)}}
  
enemy_pokemon = {"Charmander" : {"HP": 100, "Attack": random.randint(1, 20)}}

print("You wake up in the middle of a grassy field.")

print("You see magical creatures that look like Pokemon. Suddenly one attacks you!\nA battle begins!")

while True:
    # os.system('clear')
    print(f"Latias has {my_pokemon['Latias']['HP']} HP left and has {my_pokemon['Latias']['Attack']} attack power")
    print(f"Charmander has {enemy_pokemon['Charmander']['HP']} HP left and has {enemy_pokemon['Charmander']['Attack']} attack power")
    
    break
