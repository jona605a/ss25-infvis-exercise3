function drawRadarChart(pokemon) {
    if (!pokemon || !pokemon.base_stats) {
        console.warn("No stats found for", pokemon);
        return;
    }

    const data = pokemon.base_stats;
    const stats = Object.entries(data);

    // chart constants
    const width = 600;
    const height = 600;
    const levels = 5;
    const radius = 200;
    const angleSlice = (Math.PI * 2) / stats.length;

    // clear previous
    const container = d3.select("#radar_chart");
    container.html("");

    // Wrapper div with background
    const wrapper = container.append("div")
        .attr("class", "base_stat_wrapper");

    // TOP ROW: Profile and Encounter
    const top_row = wrapper.append("div")
        .attr("class", "base_stat_top_row");

    // ============ PROFILE ==========

    // Pokémon main info
    const info_container = top_row.append("div")
        .attr("class", "info_container")

    const profile = info_container.append("div")
        .attr("class", "base_stat_pokemon_profile")

    profile.append("span")
        .attr("class", "base_stat_pokemon_id")
        .text(`#${pokemon.id.toString().padStart(3, "0")}`)

    profile.append("h2")
        .attr("class", "base_stat_pokemon_name")
        .text(pokemon.name.toUpperCase())

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
    })

    // get height and weight
    type_bar.append("div")
        .attr("class", "physical_stats")
        .html(`Height: ${(pokemon.height / 10).toFixed(1)} m &nbsp; | &nbsp; Weight: ${(pokemon.weight / 10).toFixed(1)} kg`);

    
    // ========= ENCOUNTER DATA =====
    if (pokemon.encounters && pokemon.encounters.length > 0) {
        const encounter_wrapper = top_row.append("div")
            .attr("class", "encounter_wrapper")

        const grouped = d3.group(pokemon.encounters, d => d.version);
        grouped.forEach((entries, version) => {
            const block = encounter_wrapper.append("div")
                .attr("class", "version_encounter_block");

            block.append("h3")
                .attr("class", `version_label version_${version}`)
                .text(version.toUpperCase());

            entries.forEach(e => {
                block.append("div")
                    .attr("class", "encounter_entry")
                    .text(`${e.method} | ${e.chance}% | Lv ${e.min_level}–${e.max_level} | ${e.area}` +
                          (e.conditions.length ? ` | ${e.conditions.join(", ")}` : ""));
            })
        });
    }

    // ============== BASE STAT RADAR CHART ======

    const radarChartContainer = wrapper.append("div")
        .attr("class", "radar_chart_container");

    // Radar SVG
    const svg = radarChartContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "base_stat_radar_svg");
        
    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Radial grid
    for (let i = 1; i <= levels; i++) {
        const r = (radius / levels) * i;
        g.append("polygon")
            .attr("points", stats.map((_, j) => {
                const angle = angleSlice * j;
                return [Math.cos(angle) * r, Math.sin(angle) * r].join(",");
            }).join(" "))
            .attr("fill", "none")
            .attr("stroke", "var(--color-border)");
    }

    // Axes + labels
    stats.forEach(([stat, _], i) => {
        const angle = angleSlice * i;

        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", Math.cos(angle) * radius)
            .attr("y2", Math.sin(angle) * radius)
            .attr("stroke", "var(--color-dark)");

        g.append("text")
            .attr("x", Math.cos(angle) * (radius + 12))
            .attr("y", Math.sin(angle) * (radius + 12))
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "var(--color-text)")
            .attr("font-family", "var(--font-body)")
            .text(stat);
    });

    // Data polygon
    const maxValue = d3.max(stats, ([, value]) => +value);
    const points = stats.map(([_, value], i) => {
        const angle = angleSlice * i;
        const scaled = (+value) / maxValue * radius;
        return [Math.cos(angle) * scaled, Math.sin(angle) * scaled].join(",");
    }).join(" ");

    g.append("polygon")
        .attr("points", points)
        .attr("fill", "var(--color-button)")
        .attr("stroke", "var(--color-dark)")
        .attr("fill-opacity", 0.6);

    
    highlightPokemonRegions(pokemon.name);
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