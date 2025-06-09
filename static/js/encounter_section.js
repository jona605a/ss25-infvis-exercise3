function drawEncounterSection(container, pokemon) {
    if (!pokemon.encounters || pokemon.encounters.length === 0) {
        container.append("p").text(`${capitalizeFirstLetter(pokemon.name)} does not appear in the wild.`);
        return;
    }

    const encounter_wrapper = container.append("div")
        .attr("class", "encounter_wrapper");

    // Step 1: Count levels per version
    const versions = ["red", "blue", "yellow"];
    const levelCounts = {}; // { level: { red: count, blue: count, yellow: count } }

    pokemon.encounters.forEach(encounter => {
        if (!versions.includes(encounter.version)) return;

        for (let level = encounter.min_level; level <= encounter.max_level; level++) {
            if (!levelCounts[level]) {
                levelCounts[level] = { red: 0, blue: 0, yellow: 0 };
            }
            levelCounts[level][encounter.version]++;
        }
    });

    // Step 2: Convert to array for D3
    const data = Object.keys(levelCounts).map(level => ({
        level: +level,
        red: levelCounts[level].red,
        blue: levelCounts[level].blue,
        yellow: levelCounts[level].yellow
    })).sort((a, b) => a.level - b.level);

    // Step 3: Set up dimensions and scales
    const margin = { top: 50, right: 20, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const allLevels = data.map(d => d.level);
    const x = d3.scaleLinear()
        .domain([d3.min(allLevels) - 1, d3.max(allLevels) + 1])
        .range([0, width])
        .nice();

    const barWidth = 10; // width per sub-bar per version
    const groupWidth = barWidth * versions.length;

    const svg = encounter_wrapper.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Level Distribution of Wild ${capitalizeFirstLetter(pokemon.name)}`);
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d.red, d.blue, d.yellow)) * 1.1])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(versions)
        .range(["#e74c3c", "#3498db", "#f1c40f"]); // Red, Blue, Yellow

    // Step 4: Draw axes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d => d));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5));

    // Step 5: Draw bars
    const levelGroups = svg.selectAll(".level-group")
        .data(data)
        .enter().append("g")
        .attr("class", "level-group")
        .attr("transform", d => `translate(${x(d.level) - groupWidth / 2},0)`);

    levelGroups.selectAll("rect")
        .data(d => versions.map((v, i) => ({
            version: v,
            count: d[v],
            xOffset: i * barWidth
        })))
        .enter().append("rect")
        .attr("x", d => d.xOffset)
        .attr("y", d => y(d.count))
        .attr("width", barWidth)
        .attr("height", d => height - y(d.count))
        .attr("fill", d => color(d.version));

    // Step 6: Add legend
    const legend = svg.selectAll(".legend")
        .data(versions)
        .enter().append("g")
        .attr("transform", (d, i) => `translate(${i * 100+50},-5)`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color(d));

    legend.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1))
        .style("font-size", "12px");
}
