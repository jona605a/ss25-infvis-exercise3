function drawProfile(top_row, pokemon) {
    const info_container = top_row.append("div")
        .attr("class", "info_container");

    const profile = info_container.append("div")
        .attr("class", "base_stat_pokemon_profile");

    profile.append("span")
        .attr("class", "base_stat_pokemon_id")
        .text(`#${pokemon.id.toString().padStart(3, "0")}`);

    profile.append("h2")
        .attr("class", "base_stat_pokemon_name")
        .text(pokemon.name.toUpperCase());

    // Pokémon sprite
    profile.append("img")
        .attr("src", pokemon.sprite)
        .attr("alt", pokemon.name)
        .attr("class", "base_stat_pokemon_sprite");

    // ============== ATTRIBUTES ============
    const type_bar = info_container.append("div")
        .attr("class", "base_stat_pokemon_type_bar");

    // get pokemon types
    pokemon.types.forEach(type => {
        type_bar.append("span")
            .attr("class", `base_stat_type_badge type_${type}`)
            .text(type.toUpperCase());
    });

    // get height and weight
    type_bar.append("div")
        .attr("class", "physical_stats")
        .html(`Height: ${(pokemon.height / 10).toFixed(1)} m &nbsp; | &nbsp; Weight: ${(pokemon.weight / 10).toFixed(1)} kg`);
}

function highlightPokemonRegions(pokemonName) {
    // Reset old highlights
    d3.selectAll(".highlighted-region").classed("highlighted-region", false);

    const matchedRegions = locationData.filter(region =>
        region.areas.some(area =>
            (area.pokemon_encounters || []).some(e => e.pokemon_name === pokemonName)
        )
    );

    matchedRegions.forEach(region => {
        const germanId = Object.keys(svgToEnglish).find(key => svgToEnglish[key] === region.name);
        if (germanId) {
            d3.select("#" + germanId).classed("highlighted-region", true);
        }
    });
}