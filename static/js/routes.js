// mapping svg id with ids in jsons TODO not done yet
const svgToEnglish = {
    "alabastia": "pallet-town",
    "azuria": "cerulean-city",
    "fuchsania": "fuchsia-city",
    "marmoria": "pewter-city",
    "prismania": "celadon-city",
    "saffronia": "saffron-city",
    "vertania": "viridian-city",
    "zinnober": "cinnabar-island",
    "orania": "vermilion-city",
    "lavandia": "lavender-town",
    "zinnoberinsel": "cinnabar-island",
    "route1": "kanto-route-1",
    "route2": "kanto-route-2",
    "route3": "kanto-route-3",
    "route4": "kanto-route-4",
    "route5": "kanto-route-5",
    "route6": "kanto-route-6",
    "route7": "kanto-route-7",
    "route8": "kanto-route-8",
    "route9": "kanto-route-9",
    "route10": "kanto-route-10",
    "route11": "kanto-route-11",
    "route12": "kanto-route-12",
    "route13": "kanto-route-13",
    "route14": "kanto-route-14",
    "route15": "kanto-route-15",
    "route16": "kanto-route-16",
    "route17": "kanto-route-17",
    "route18": "kanto-route-18",
    "route19": "kanto-sea-route-19",
    "route20": "kanto-sea-route-20",
    "route21": "kanto-sea-route-21",
    "route22": "kanto-route-22",
    "route23": "kanto-route-23",
    "route24": "kanto-route-24",
    "route25": "kanto-route-25",
    "route26": "kanto-route-26",
    "route27": "kanto-route-27",
    "route28": "kanto-route-28",
};

let locationData = {};
let pokemonData = {};

Promise.all([
    d3.json("/merged-kanto-locations"),
    d3.json("/pokemon-api-data")
]).then(([loc, poke]) => {
    locationData = loc;

    pokemonData = poke.reduce((acc, p) => {
        acc[p.name] = p;
        return acc;
    }, {});
    setupSearchInput();
});

function showPokemonList(englishName) {
    const listDiv = d3.select("#location_pokemon_list");
    listDiv.html("");

    const regionData = locationData.find(r => r.name === englishName);


    if (!regionData || !regionData.areas || regionData.areas.length === 0) {
        listDiv.append("p").text("No data for the region.");
        console.warn("no data for this region", englishName, regionData);
        return;
    }

    const allEncounters = regionData.areas.flatMap(area => area.pokemon_encounters || []);
    const uniquePokemon = [...new Set(
        allEncounters
            .map(e => e.pokemon_name)
            .filter(name => pokemonData[name])  // only if data exists
    )];


    if (uniquePokemon.length === 0) {
        listDiv.append("p").text("No Pokemon found in this region.");
        console.warn("No pokemon in pokemon_encounters:", regionData);
        return;
    }

    listDiv.append("h3").text("Pokémon in " + englishName.replace("-", " "));

    const ul = listDiv.append("ul")
        .style("list-style", "none")
        .style("padding", "0")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "10px");

    uniquePokemon.forEach(name => {
        const p = pokemonData[name];
        const li = ul.append("li")
            .style("background", "#f0f0f0")
            .style("padding", "8px")
            .style("border-radius", "8px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "6px")
            .style("font-family", "monospace");

        if (p && p.sprite) {
            li.html(`<img src="${p.sprite}" width="32" height="32"> ${p.name}`);
            li.style("cursor", "pointer")
                // on click show pokemon section
                .on("click", () => {
                    window.selectedLocationName = englishName;
                    drawPokemonSection(p, englishName)
                });
        } else {
            li.text(name);
        }
    });

    console.log("Found pokemon: ", uniquePokemon);
}


// load svg
function loadSVG(filename, sizeClass) {
    d3.xml("/static/" + filename)
        .then(data => {
            const svgHost = d3.select("#svg_kanto_map");
            svgHost.html("");
            svgHost.attr("class", "svg_wrapper " + sizeClass);

            const imported = document.importNode(data.documentElement, true);
            svgHost.node().appendChild(imported);

            if (filename === "world.svg") {
                d3.select("#mapNotice").style("display", "block");
                d3.select("#backButton").style("display", "none");
                d3.select("#exploreText").style("display", "none");

                // remove for back button pokemon input
                d3.select("#location_pokemon_list").html("");
                d3.select("#pokemon_section").html("");
                d3.select("#svg_line_plot").html("");


                d3.select(svgHost.node())
                    .select("#rect1")
                    .style("cursor", "pointer")
                    .on("click", () => loadSVG("kantomap.svg", "large"));
            }

            const rect = d3.select(svgHost.node()).select("#rect1");

            if (!rect.empty()) {
                const bbox = rect.node().getBBox();
                const s = 10;

                // 4 corners: [x, y, dx, dy] for horizontal and vertical lines
                const cornerDefs = [
                    // top-left: right (horizontal), down (vertical)
                    { x: bbox.x, y: bbox.y, dxH: 1, dyH: 0, dxV: 0, dyV: 1 },
                    // top-right: left (horizontal), down (vertical)
                    { x: bbox.x + bbox.width, y: bbox.y, dxH: -1, dyH: 0, dxV: 0, dyV: 1 },
                    // bottom-left:right (horizontal), up (vertical)
                    { x: bbox.x, y: bbox.y + bbox.height, dxH: 1, dyH: 0, dxV: 0, dyV: -1 },
                    // bottom-right:left (horizontal), up (vertical)
                    { x: bbox.x + bbox.width, y: bbox.y + bbox.height, dxH: -1, dyH: 0, dxV: 0, dyV: -1 },
                ];

                const group = d3.select(rect.node().parentNode)
                    .append("g")
                    .attr("class", "corner-markers");

                function animateLine(line, x1, y1, dx, dy) {
                    d3.interval((elapsed) => {
                        const t = Math.sin(elapsed / 400);
                        const x2 = x1 + dx * s * (1 + 0.3 * t);
                        const y2 = y1 + dy * s * (1 + 0.3 * t);
                        line.attr("x2", x2).attr("y2", y2);
                    }, 40);
                }

                cornerDefs.forEach(c => {
                    // horicontal line
                    const h = group.append("line")
                        .attr("x1", c.x)
                        .attr("y1", c.y)
                        .attr("x2", c.x + c.dxH * s)
                        .attr("y2", c.y + c.dyH * s)
                        .attr("class", "corner-marker");

                    // vertical line
                    const v = group.append("line")
                        .attr("x1", c.x)
                        .attr("y1", c.y)
                        .attr("x2", c.x + c.dxV * s)
                        .attr("y2", c.y + c.dyV * s)
                        .attr("class", "corner-marker");

                    animateLine(h, c.x, c.y, c.dxH, c.dyH);
                    animateLine(v, c.x, c.y, c.dxV, c.dyV);
                });

                rect.style("cursor", "pointer")
                    .on("click", () => loadSVG("kantomap.svg", "large"));
            }

            if (filename === "kantomap.svg") {
                d3.select("#mapNotice").style("display", "none");
                d3.select("#backButton").style("display", "inline-block");
                d3.select("#exploreText").style("display", "inline-block");

                d3.select("#backButton").on("click", () => {
                    loadSVG("world.svg", "small");
                    d3.select("#backButton").style("display", "none");
                    d3.select("#exploreText").style("display", "none");
                });

                Object.keys(svgToEnglish).forEach(svgId => {
                    const svgRoot = d3.select(svgHost.node()).select("svg");
                    const region = d3.select(svgHost.node()).select("#" + svgId);

                    if (!region.empty()) {
                        region
                            .classed("clickable-region", true)
                            .style("cursor", "pointer")
                            .on("click", () => {
                                const englishName = svgToEnglish[svgId];
                                console.log("svg id", svgId);
                                console.log("name in dataset", englishName);

                                const regionData = locationData.find(r => r.name === englishName);


                                if (!regionData) {
                                    console.warn("No data in locationData for ", englishName);
                                } else {
                                    console.log("Found Pokémon: ", regionData.pokemon);
                                }

                                showPokemonList(englishName);
                            });
                    } else {
                        console.warn("Region with the ID ", svgId, "no in svg");
                    }
                });
            }

        })
        .catch(error => console.error("Error while loading svg:", error));
}