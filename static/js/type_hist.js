// function initHistogram() {
//     d3.json("/pokemon-data").then(function (data) {
//         console.log("Fetched Pokémon data:", data);

//         const typeCounts = {};

//         data.forEach(pokemon => {
//             [pokemon.type1, pokemon.type2].forEach(type => {
//                 if (type && type !== 'nan') {
//                     typeCounts[type] = (typeCounts[type] || 0) + 1;
//                 }
//             });
//         });

//         const histogramData = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

//         console.log("Histogram data:", histogramData);

//         drawHistogram(histogramData);
//     });
// }

function drawHistogram() {
    d3.json("/pokemon-types").then(function (typeData) {
        const histogramData = Object.entries(typeData).map(([type, count]) => ({ type, count }));

        const margin = { top: 40, right: 30, bottom: 70, left: 60 },
            width = 800 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        const svg = d3.select("#histogram")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(histogramData.map(d => d.type))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(histogramData, d => d.count)])
            .nice()
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.selectAll("rect")
            .data(histogramData)
            .enter()
            .append("rect")
            .attr("x", d => x(d.type))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.count))
            .attr("fill", "#69b3a2");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Distribution of Pokémon Types");
    });
}

