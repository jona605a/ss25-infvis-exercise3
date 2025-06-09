function drawPokemonSection(pokemon) {
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
    const container = d3.select("#pokemon_section");
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
        .attr("class", "encounter_wrapper");

    // Extract versions from encounters
    const versions = Array.from(new Set(pokemon.encounters.map(e => e.version))).sort();

    // Label + dropdown
    const versionLabel = encounter_wrapper.append("label")
        .attr("for", "version_select")
        .text("Select Game Version:");

    const versionSelect = encounter_wrapper.append("select")
        .attr("id", "version_select")
        .on("change", function () {
            const selectedVersion = this.value;
            drawStreamGraph(pokemon.name, window.selectedLocationName, selectedVersion);
        });

    versionSelect.selectAll("option")
        .data(versions)
        .join("option")
        .attr("value", d => d)
        .text(d => d.toUpperCase());

    // Add streamgraph container
    encounter_wrapper.append("div")
        .attr("id", "streamgraph_container")
        .attr("class", "streamgraph_container");

    // Draw initial streamgraph
    drawStreamGraph(pokemon.name, window.selectedLocationName, versions[0]);
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

function drawStreamGraph(pokemonName, locationName, version) {
    const container = d3.select("#streamgraph_container");
    container.html(""); // Clear previous chart

    // === CHART CONSTANTS ===
    const width = 700;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    // === FETCH DATA ===
    const url = `/bucket-encounters/${pokemonName}/${locationName}/${version}`;
    d3.json(url).then(rawData => {
        if (!rawData.length) {
            container.append("p").text("No encounter data available.");
            return;
        }

        // === PREPROCESS ===
        const tiers = Array.from(new Set(rawData.map(d => d.level_tier)));
        const methods = Array.from(new Set(rawData.map(d => d.method)));

        // Create a nested structure grouped by tier
        const stackedData = tiers.map(tier => {
            const tierEntries = rawData.filter(d => d.level_tier === tier);
            const row = { level_tier: tier };
            tierEntries.forEach(d => {
                row[d.method] = d.chance;
            });
            return row;
        });

        // === STACK LAYOUT ===
        const stack = d3.stack()
            .keys(methods)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetWiggle);

        const series = stack(stackedData);

        // === SCALES ===
        const x = d3.scalePoint()
            .domain(tiers)
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([
                d3.min(series, s => d3.min(s, d => d[0])),
                d3.max(series, s => d3.max(s, d => d[1]))
            ])
            .range([height - margin.bottom, margin.top]);

        const color = d3.scaleOrdinal()
            .domain(methods)
            .range(d3.schemeSet2);

        // === AREA GENERATOR ===
        const area = d3.area()
            .x(d => x(d.data.level_tier))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
            .curve(d3.curveBasis);

        // === SVG ===
        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "streamgraph_svg");

        // === DRAW STREAM PATHS ===
        svg.selectAll("path")
            .data(series)
            .join("path")
            .attr("d", area)
            .attr("fill", d => color(d.key))
            .attr("stroke", "var(--color-dark)")
            .attr("fill-opacity", 0.8)
            .append("title")
            .text(d => d.key);

        // === X AXIS ===
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        // === Y AXIS ===
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        // === LEGEND ===
        const legend = container.append("div")
            .attr("class", "streamgraph_legend");

        methods.forEach(method => {
            const item = legend.append("div").attr("class", "legend_item");
            item.append("span")
                .attr("class", "legend_color")
                .style("background-color", color(method));
            item.append("span").text(method);
        });
    });
}
