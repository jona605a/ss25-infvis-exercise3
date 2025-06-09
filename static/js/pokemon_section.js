function drawPokemonSection(pokemon) {
    if (!pokemon || !pokemon.base_stats) {
        console.warn("No stats found for", pokemon);
        return;
    }

    // clear previous
    const container = d3.select("#pokemon_section").html("");

    // Wrapper div with background
    const wrapper = container.append("div")
        .attr("class", "base_stat_wrapper");

    const top_row = wrapper.append("div")
        .attr("class", "base_stat_top_row");

    drawProfile(top_row, pokemon);
    drawRadarChart(top_row, pokemon);

    const bottom_row = wrapper.append("div")
        .attr("class", "base_stat_bottom_row");
    drawEncounterSection(bottom_row, pokemon);

    highlightPokemonRegions(pokemon.name);
}

const statLabels = {
    "hp": { short: "HP", full: "Hit Points" },
    "attack": { short: "Atk", full: "Attack" },
    "defense": { short: "Def", full: "Defense" },
    "special-attack": { short: "SpAtk", full: "Special Attack" },
    "special-defense": { short: "SpDef", full: "Special Defense" },
    "speed": { short: "Speed", full: "Speed" }
};

function drawProfile(wrapper, pokemon) {
    const info_container = wrapper.append("div")
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

    // ============== COMPARISON ============

    const compare_container = info_container.append("div")
        .attr("class", "compare_section");

    compare_container.append("label")
        .text("Compare with another Pokémon:");

    const searchInput = compare_container.append("input")
        .attr("type", "text")
        .attr("placeholder", "Enter name…")
        .on("input", function () {
            const name = this.value.toLowerCase();
            const match = pokemonData[name];
            if (match) {
                drawMiniProfile(compare_container, match);
                updateRadarChartWithComparison(pokemon, match);
            }
        });
}

function drawMiniProfile(container, pokemon) {
    container.selectAll(".mini_profile").remove(); // clear previous

    const card = container.append("div").attr("class", "mini_profile");

    card.append("img")
        .attr("src", pokemon.sprite)
        .attr("alt", pokemon.name)
        .attr("width", 48)
        .attr("height", 48);

    card.append("span")
        .attr("class", "mini_profile_name")
        .text(pokemon.name.toUpperCase());
}

function drawRadarChart(wrapper, pokemon, compare = null) {
    const data = pokemon.base_stats;
    const stats = Object.entries(data);
    console.log("Stats:", stats);

    const width = 600;
    const height = 600;
    const levels = 5;
    const radius = 200;
    const angleSlice = (Math.PI * 2) / stats.length;

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
            .attr("stroke", "var(--color-border)")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("opacity", i % 2 === 0 ? 0.3 : 0.6); // alternating ring opacities
    }

    // Axes + labels
    stats.forEach(([stat, _], i) => {
        const angle = angleSlice * i;

        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", Math.cos(angle) * radius)
            .attr("y2", Math.sin(angle) * radius)
            .attr("stroke", "var(--color-dark)")
            .attr("stroke-dasharray", "2,2")
            .attr("stroke-width", 1);

        // labels
        const labelOffset = 32;
        const labelX = Math.cos(angle) * (radius + labelOffset);
        const labelY = Math.sin(angle) * (radius + labelOffset);

        g.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", angle > Math.PI * 0.25 && angle < Math.PI * 1.9
                ? "start" : "end") // left vs right horizontal spacing
            .attr("alignment-baseline", angle < Math.PI
                ? "hanging" : "baseline") // top vs bottom
            .style("font-size", "10px")
            .style("font-family", "var(--font-heading)")
            .style("font-weight", "bold")
            .style("fill", "var(--color-dark)")
            .style("text-shadow", "1px 1px var(--color-muted)")
            .style("pointer-events", "none")
            .text(statLabels[stat.toLowerCase()]?.short || stat) // use stat abbreviations as label
            .append("title")
            .text(`${stat}: ${data[stat]}`);
    });

    // Data polygon
    const maxValue = d3.max(stats, ([, value]) => +value);
    const points = stats.map(([_, value], i) => {
        const angle = angleSlice * i;
        const scaled = (+value) / maxValue * radius;
        return [Math.cos(angle) * scaled, Math.sin(angle) * scaled].join(",");
    }).join(" ");

    const statValues = stats.map(([stat, value]) => ({
        label: statLabels[stat.toLowerCase()]?.full || stat,
        value: value
    }));

    const polygon = g.append("polygon")
        .attr("points", points)
        .attr("fill", getTypeColor(pokemon.types[0]))
        .attr("stroke", "#2B2B2B")
        .attr("stroke-width", 2)
        .attr("fill-opacity", 0.8)
        .style("cursor", "pointer")
        .on("mouseover", function (event) {
            d3.select(this)
                .attr("fill-opacity", 1.0)
                .attr("stroke-width", 3);

            // add tooltip
            const tooltip = d3.select("#tooltip");
            const html = statValues.map(s =>
                `<strong>${s.label}</strong>: ${s.value}`).join("<br>"
                );
            tooltip.html(html)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 28}px`)
                .style("opacity", 1)
                .style("display", "block");
        })
        .on("mousemove", function (event) {
            // Update position while moving
            d3.select("#tooltip")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill-opacity", 0.8);
            d3.select("#tooltip")
                .style("opacity", 0)
                .attr("stroke-width", 2)
                .style("display", "none");
        });

    if (compare) {
        const compareStats = Object.entries(compare.base_stats);
        const maxValue = d3.max([...stats, ...compareStats], ([, v]) => +v);
        const comparePoints = compareStats.map(([_, value], i) => {
            const angle = angleSlice * i;
            const scaled = (+value) / maxValue * radius;
            return [Math.cos(angle) * scaled, Math.sin(angle) * scaled].join(",");
        }).join(" ");

        const statValuesCompare = compareStats.map(([stat, value]) => ({
            label: statLabels[stat.toLowerCase()]?.full || stat,
            value: value,
            source: compare.name
        }));

        g.append("polygon")
            .attr("points", comparePoints)
            .attr("fill", getTypeColor(compare.types[0]))
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#222")
            .attr("class", "polygon-compare")
            .on("mouseover", function (event) {
                const tooltip = d3.select("#tooltip");
                const html = statValuesCompare.map(s =>
                    `<div><strong>${s.label}</strong>: ${s.value} (${s.source})</div>`).join("");
                tooltip.html(html)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .style("opacity", 1)
                    .style("display", "block");
            })
            .on("mouseout", function () {
                d3.select("#tooltip").style("opacity", 0).style("display", "none");
            });
    }
}

function updateRadarChartWithComparison(primary, compare) {
    // Remove existing radar chart SVG
    d3.select(".base_stat_radar_svg").remove();

    // Redraw chart with comparison
    const container = d3.select(".radar_chart_container").node().parentNode;
    drawRadarChart(d3.select(container), primary, compare);
}

function getTypeColor(type) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(`--type-${type.toLowerCase()}`)
        .trim() || "var(--color-button)";
}

function highlightPokemonRegions(pokemonName) {
    // Clear previous highlights
    d3.selectAll(".highlighted-region")
        .classed("highlighted-region", false)
        .style("fill-opacity", null); // Reset any custom opacity

    const matchedRegions = locationData.filter(region =>
        region.areas.some(area =>
            (area.pokemon_encounters || []).some(e => e.pokemon_name === pokemonName)
        )
    );

    matchedRegions.forEach(region => {
        const englishName = region.name;
        const germanId = Object.keys(svgToEnglish).find(key => svgToEnglish[key] === englishName);

        if (germanId) {
            let maxChance = 0;

            region.areas.forEach(area => {
                const encounters = area.pokemon_encounters || [];
                encounters
                    .filter(e => e.pokemon_name === pokemonName)
                    .forEach(e => {
                        if (e.chance != null) {
                            maxChance = Math.max(maxChance, e.chance);
                        }
                    });
            });

            // Cap the opacity to a [0.2, 0.8] range so it's always visible
            const opacity = Math.max(0.2, Math.min(0.8, maxChance / 100));

            // console.log(`Highlighting ${englishName} (${germanId}) with opacity ${opacity}. Max chance: ${maxChance}`);

            d3.select("#" + germanId)
                .classed("highlighted-region", true)
                .each(function () {
                    this.style.setProperty("fill-opacity", opacity, "important");
                });
        }
    });
}