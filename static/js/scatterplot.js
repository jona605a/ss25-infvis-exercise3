let scatterPlotWidth = 800;
let scatterPlotHeight = 500;
let scatterPlot = null;
let scatterPlotData = null;

// set styling
let pointradius = 5;
let pointfill = "purple";
let pointstroke = "black";


function initScatterPlot() {
    // fetch data from server
    d3.json("/pokemon-data").then(function (data) {
        // prep data
        scatterPlotData = data.coordinates.map((coordinate, i) => ({
            x: coordinate[0],
            y: coordinate[1],
            country: data.countries[i]
        }));

        // set margins
        let margin = { top: 20, right: 10, bottom: 20, left: 10 };
        let width = scatterPlotWidth - margin.left - margin.right;
        let height = scatterPlotHeight - margin.top - margin.bottom;

        // set scaling
        let xExtent = d3.extent(scatterPlotData, d => d.x);
        let yExtent = d3.extent(scatterPlotData, d => d.y);

        let xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([0, width]);

        let yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([height, 0])

        
        // configure SVG element
        let scat = d3.select("#svg_scatterplot")
                        .attr("width", scatterPlotWidth)
                        .attr("height", scatterPlotHeight);
        
        // Linking to the world map
        let map = d3.select("#svg_map");

        // draw circles
        scatterPlot = scat.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .selectAll("circle")
            .data(scatterPlotData)
            .enter().append("circle")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", pointradius)
            .attr("fill", pointfill)
            .attr("stroke", pointstroke)
            .attr('id', d => d.country)
            .on('mouseover', function (event, d) {
                let countryName = d.country
                d3.select(this)
                    .attr('fill', colHighlight)
                    .attr("r", pointradius*2);
                map.select("#"+countryName)
                    .attr('fill', colHighlight);

                console.log("Hovered over: " + d.country);
                // console.log(event);
            })
            .on('mouseout', function (event, d) {
                let countryName = d.country
                d3.select(this)
                    .attr('fill', pointfill)
                    .attr("r", pointradius);
                map.select("#"+countryName)
                    .attr('fill', colRelevant);
            })
            ;
    });
}