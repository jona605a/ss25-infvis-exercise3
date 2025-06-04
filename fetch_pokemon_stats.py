import requests
import json

BASE_URL = "https://pokeapi.co/api/v2/"
GENERATION_ID = 1

def get_pokemon():
    
    # get generation 1 pokenmon names
    generation_data = requests.get(f"{BASE_URL}/generation/{GENERATION_ID}").json()
    species = generation_data["pokemon_species"]
    
    # sort by url index
    names = [s["name"] for s in sorted(species, key=lambda x: int(x["url"].split("/")[-2]))] 
    
    pokemon = []
    
    for name in names:
        pokemon_data = get_pokemon_data(name)
        pokemon.append(pokemon_data)
        
    return pokemon
    
    


def get_pokemon_data(name):
    data = requests.get(f"{BASE_URL}/pokemon/{name}").json()
    
    # write to dictionary
    base_stats = {stat["stat"]["name"]: stat["base_stat"] for stat in data["stats"]}
    
    # extract types sorted by slot
    types = [t["type"]["name"] for t in sorted(data["types"], key=lambda x: x["slot"])]
    
    return {
        "id": data["id"],
        "name": data["name"],
        "types": types,
        "base_stats": base_stats,
        "sprite": data["sprites"]["front_default"], # default front picture
        "height": data["height"],
        "weight": data["weight"]
    }
    
    
if __name__ == "__main__":
    print("Fetching data ...")
    pokemon_data = get_pokemon()
    
    with open("static/kanto_pokemon_data.json", "w") as f:
        json.dump(pokemon_data, f, indent=2)
        
    print("Snapshot saved.")