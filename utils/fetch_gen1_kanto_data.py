import requests
import json
from collections import defaultdict

BASE_URL = "https://pokeapi.co/api/v2/"
GENERATION_ID = 1
GEN1_VERSIONS = {"red", "blue", "yellow"}

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

def get_location_data():
    region = requests.get(f"{BASE_URL}/region/kanto").json()
    locations = []

    for location in region["locations"]:
        location_data = requests.get(location["url"]).json()
        loc_entry = {
            "id": location_data["id"],
            "name": location_data["name"],
            "areas": []
        }

        for area in location_data.get("areas", []):
            area_data = requests.get(area["url"]).json()
            pokemon_encounters = get_pokemon_encounters(area_data["pokemon_encounters"])

            loc_entry["areas"].append({
                "id": area_data["id"],
                "name": area_data["name"],
                "pokemon_encounters": pokemon_encounters
            })

        locations.append(loc_entry)

    return locations

def get_pokemon_encounters(pokemon_encounter):
    encounters = []
    for entry in pokemon_encounter:
        id = int(entry["pokemon"]["url"].rstrip("/").split("/")[-1])
        name = entry["pokemon"]["name"]

        for version_detail in entry["version_details"]:
            version_name = version_detail["version"]["name"]
            
            if version_name not in GEN1_VERSIONS:
                continue

            for encounter in version_detail["encounter_details"]:
                encounters.append({
                    "pokemon_id": id,
                    "pokemon_name": name,
                    "version": version_name,
                    "method": encounter["method"]["name"],
                    "chance": encounter["chance"],
                    "min_level": encounter["min_level"],
                    "max_level": encounter["max_level"],
                    "conditions": [c["name"] for c in encounter["condition_values"]]
                })

    return encounters

def get_encounter_methods(encounter_method):
    """
    groups encounter methods into:
    - 'walk': list of {version, rate}
    - 'surf': list of {version, rate}
    - 'fish': list of {rod, versions: ["old-rod", "good-rod", "super-rod"]}
    
    note that other encounter methods are ignored since they do not appear in gen1 games
    """
    
    # initialize output containers for encounter methods
    walk = []
    surf = []
    fish = []

    for m in encounter_method:
        method_name = m["encounter_method"]["name"]
        version_details = m["version_details"]
        
        # build version rate entries
        version_rates = []
        for detail in version_details:
            version_name = detail["version"]["name"]
            rate = detail["rate"]
            version_rates.append({
                "version": version_name,
                "rate": rate
            })
            
        # group based on methods
        if method_name == "walk":
            walk.extend(version_rates)
        elif method_name == "surf":
            surf.extend(version_rates)
        elif method_name in ["old-rod", "good-rod", "super-rod"]:
            fish.append({
                "rod": method_name,
                "version": version_rates
            })
            
    # assemble non-empty methods
    result = {}
    if walk:
        result["walk"] = walk
    if surf:
        result["surf"] = surf
    if fish:
        result["fish"] = fish

    return result

def merge_pokemon_with_encounters(pokemon_list, location_data):
    print("Merging encounter data with Pokémon...")
    encounter_lookup = defaultdict(list)

    for location in location_data:
        for area in location["areas"]:
            for encounter in area["pokemon_encounters"]:
                key = encounter["pokemon_id"]
                encounter_lookup[key].append({
                    "version": encounter["version"],
                    "method": encounter["method"],
                    "area": area["name"],
                    "location": location["name"],
                    "chance": encounter["chance"],
                    "min_level": encounter["min_level"],
                    "max_level": encounter["max_level"],
                    "conditions": encounter["conditions"]
                })

    for p in pokemon_list:
        p["encounters"] = remove_duplicate_encounters(encounter_lookup.get(p["id"], []))

    return pokemon_list

def remove_duplicate_encounters(encounters):
    
    # group all entries that only differ in conditions
    grouped_entries = defaultdict(list)
    for entry in encounters:
        key = (
            entry["version"], entry["method"], entry["area"], entry["location"], entry["chance"], entry["min_level"], entry["max_level"]
        )
        grouped_entries[key].append(entry["conditions"])
    
    # merge the conditions, create a list of unique conditions per entry
    result = []
    for (version, method, area, location, chance, min_level, max_level), conditions in grouped_entries.items():
        all_conditions = []
        for condition in conditions:
            all_conditions.extend(condition)
            
        merged_conditions = sorted(set(all_conditions))
        
        result.append({
            "version": version,
            "method": method,
            "area": area,
            "location": location,
            "chance": chance,
            "min_level": min_level,
            "max_level": max_level,
            "conditions": merged_conditions
        })
        
    return result

if __name__ == "__main__":
    print("Fetching data ...")
    pokemon_data = get_pokemon()
    location_data = get_location_data()
    merged = merge_pokemon_with_encounters(pokemon_data, location_data)
    
    with open("static/kanto_location_data.json", "w") as f:
        json.dump(location_data, f, indent=2)
    with open("static/kanto_pokemon_data.json", "w") as f:
        json.dump(merged, f, indent=2)
        
    # also dump to notebooks for data validation/exploration
    with open("notebooks/kanto_location_data.json", "w") as f:
        json.dump(location_data, f, indent=2)
    with open("notebooks/kanto_pokemon_data.json", "w") as f:
        json.dump(merged, f, indent=2)
        
    print("Snapshot saved.")