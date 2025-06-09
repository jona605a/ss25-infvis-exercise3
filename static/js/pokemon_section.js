

function drawPokemonSection(pokemon) {
    if (!pokemon || !pokemon.base_stats) {
        console.warn("No stats found for", pokemon);
        return;
    }

    const data = pokemon.base_stats;
    const stats = Object.entries(data);

    // clear previous
    const container = d3.select("#pokemon_section");
    container.html("");

    // Wrapper div with background
    const wrapper = container.append("div")
        .attr("class", "base_stat_wrapper");

    // TOP ROW: Profile and Encounter
    const top_row = wrapper.append("div")
        .attr("class", "base_stat_top_row");

    // ============ PROFILE ==========
    drawProfile(top_row, pokemon);

    // ========= ENCOUNTER DATA =====
    drawEncounterSection(top_row, pokemon, window.selectedLocationName);

    // ============== BASE STAT RADAR CHART ======

    // chart constants
    drawRadarChart(stats, wrapper, data, pokemon);


    highlightPokemonRegions(pokemon.name);
}