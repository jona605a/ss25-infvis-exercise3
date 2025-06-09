const statAbbreviations = {
    "hp": "HP",
    "attack": "Atk",
    "defense": "Def",
    "special-attack": "Sp.Atk",
    "special-defense": "Sp.Def",
    "speed": "Speed"
};

function drawRadarChart(stats, wrapper, data, pokemon) {
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

    const tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(d => d);

    svg.call(tip);

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

        // labels
        const labelOffset = 20;
        const labelX = Math.cos(angle) * (radius + labelOffset);
        const labelY = Math.sin(angle) * (radius + labelOffset);

        g.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", angle > Math.PI * 0.25 && angle < Math.PI * 1.9
                ? "start" : "end") // left vs right horizontal spacing
            .attr("alignment-baseline", angle < Math.PI
                ? "hanging" : "baseline") // top vs bottom
            .style("font-size", "12px")
            .style("font-family", "var(--font-body)")
            .style("fill", "var(--color-dark)")
            .style("pointer-events", "none")
            .text(statLabels[stat.toLowerCase()] || stat) // use stat abbreviations as label
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
        label: statLabels[stat.toLowerCase()] || stat,
        value: value
    }));

    const polygon = g.append("polygon")
        .attr("points", points)
        .attr("fill", getTypeColor(pokemon.types[0]))
        .attr("stroke", "var(--color-dark)")
        .attr("fill-opacity", 0.8)
        .style("cursor", "pointer")
        .on("mouseover", (event) => {
            d3.select(event.target)
                .attr("fill-opacity", 1.0);

            const html = statValues.map(s => `<strong>${s.label}</strong>: ${s.value}`).join("<br>");
            tip.show(html, event.target);
        })
        .on("mouseout", (event) => {
            d3.select(event.target)
                .attr("fill-opacity", 0.8);
            tip.hide();
        });
}

function getTypeColor(type) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(`--type-${type.toLowerCase()}`)
        .trim() || "var(--color-button)";
}