import requests
import json
import time

BASE_URL = "https://pokeapi.co/api/v2/"

def get_locations(generation_id=1, region_name="kanto"):

    # fetch generation data (endpoint: /generation/{id})
    generation = requests.get(f"{BASE_URL}/generation/{generation_id}").json()

    # check if region exists in generation data
    region = generation["main_region"]
    if region["name"] != region_name:
        raise ValueError(f"{region_name} not found in generation {generation_id}.")
    
    # get region data (endpoint: /region/{region_name})
    region_data = requests.get(region["url"]).json()

    locations = []
    for location in region_data["locations"]:
        location_data = requests.get(location["url"]).json()

        loc_res = {
            "id": location_data["id"],
            "name": location_data["name"],
            "areas": []
        }

        # get area data for each location
        for area in location_data.get("areas", []):
            area_data = requests.get(area["url"]).json()

            # get encounter methods for each area
            encounter_methods = get_encounter_methods(area_data["encounter_method_rates"])

            # get pokemon encounters for each area
            pokemon_encounters = get_pokemon_encounters(area_data["pokemon_encounters"])
            available_conditions = get_area_conditions(pokemon_encounters)
            
            # build area dictionary
            area_res = {
                "id": area_data["id"],
                "name": area_data["name"],
                "encounter_methods": encounter_methods,
                "pokemon_encounters": pokemon_encounters,
                "available_conditions": available_conditions 
            }
            
            # add to location dictionary
            loc_res["areas"].append(area_res)
        
        # add full location entry to top level dictionary
        locations.append(loc_res)
    
    return locations


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


def get_pokemon_encounters(pokemon_encounter):
    encounters = []
    
    for entry in pokemon_encounter:
        id = int(entry["pokemon"]["url"].rstrip("/").split("/")[-1]) # get pokemon id from url
        name = entry["pokemon"]["name"]
        
        for version_detail in entry["version_details"]:
            version_name = version_detail["version"]["name"]
            
            for encounter in version_detail["encounter_details"]:
                method = encounter["method"]["name"]
                chance = encounter["chance"]
                min_level = encounter["min_level"]
                max_level = encounter["max_level"]
                conditions = [condition["name"] for condition in encounter["condition_values"]]
                
                # build dictionary
                encounters.append({
                    "pokemon_id": id,
                    "pokemon_name": name,
                    "version": version_name,
                    "method": method,
                    "chance": chance,
                    "min_level": min_level,
                    "max_level": max_level,
                    "conditions": conditions
                })
    
    return encounters


def get_area_conditions(pokemon_encounters):
    """
    Returns a list of all unique condition values (e.g. time-day, rain, ...) per area
    """
    conditions = set()
    
    for encounter in pokemon_encounters:
        for condition in encounter["conditions"]:
            conditions.add(condition)
            
    return sorted(conditions) 


if __name__ == "__main__":
    print("Fetching data ...")
    kanto_data = get_locations()
    
    with open("static/kanto_location_data.json", "w") as f:
        json.dump(kanto_data, f, indent=2)
        
    print("Snapshot saved.")