
function drawRadarChart(pokemon) {

    // check
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

    // Create wrapper div for layout TODO @kho: styling in css?
    const wrapper = container.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "20px");

    // Add sprite image TODO @kho constants
    wrapper.append("img")
        .attr("src", pokemon.sprite)
        .attr("width", 96)
        .attr("height", 96)
        .attr("alt", pokemon.name);

    // Add SVG inside the wrapper
    const svg = wrapper.append("svg")
        .attr("width", width)
        .attr("height", height);


    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // set up radial grid using d3-polygon 
    for (let i = 1; i <= levels; i++) {
        const r = (radius / levels) * i;
        g.append("polygon")
            .attr("points", stats.map((_, j) => {
                const angle = angleSlice * j;
                return [ Math.cos(angle) * r, Math.sin(angle) * r].join(",");
            }).join(" "))
            .attr("fill", "none")
            .attr("stroke", "#ccc");
    }

    // set up axes for each base stat
    stats.forEach(([stat, _], i) => {
        const angle = angleSlice * i;

        // draw axis
        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", Math.cos(angle) * radius)
            .attr("y2", Math.sin(angle) * radius)
            .attr("stroke", "#999")

        // draw stat name text
        g.append("text")
            .attr("x", Math.cos(angle) * (radius + 10))
            .attr("y", Math.sin(angle) * (radius + 10))
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .text(stat)
    })

    // data polygon
    points = stats.map(([_, value], i) => {
        const angle = angleSlice * i;
        const maxValue = d3.max(stats, ([, value]) => +value); // find max stat value TODO @kho this is based on max stat of one pokemon -> global?
        const v = (+value) / maxValue * radius; // scale based on max stat
        return [
            Math.cos(angle) * v,
            Math.sin(angle) * v
        ].join(",");
    }).join(" ");

    g.append("polygon")
        .attr("points", points)
        .attr("fill", "steelblue")
        .attr("stroke", "black")
        .attr("fill-opacity", 0.6);
}

