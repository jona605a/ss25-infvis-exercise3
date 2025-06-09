function drawEncounterSection(container, pokemon, locationName) {
    if (!pokemon.encounters || pokemon.encounters.length === 0) {
        container.append("p").text("No encounter data available.");
        return;
    }

    const encounter_wrapper = container.append("div")
        .attr("class", "encounter_wrapper");

    const versions = Array.from(new Set(pokemon.encounters.map(e => e.version))).sort();

    encounter_wrapper.append("label")
        .attr("for", "version_select")
        .text("Select Game Version:");

    const versionSelect = encounter_wrapper.append("select")
        .attr("id", "version_select")
        .on("change", function () {
            const selectedVersion = this.value;
            drawStreamGraph(pokemon.name, locationName, selectedVersion);
        });

    versionSelect.selectAll("option")
        .data(versions)
        .join("option")
        .attr("value", d => d)
        .text(d => d.toUpperCase());

    encounter_wrapper.append("div")
        .attr("id", "streamgraph_container")
        .attr("class", "streamgraph_container");

    drawStreamGraph(pokemon.name, locationName, versions[0]);
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
