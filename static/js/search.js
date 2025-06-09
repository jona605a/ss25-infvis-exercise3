function setupSearchInput() {
    const searchInput = document.getElementById("searchInput");
    const suggestions = document.getElementById("suggestions");

    searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim().length < 2) {
            showStarters();
        }
    });

    searchInput.addEventListener("input", () => {
        const input = searchInput.value.trim().toLowerCase();
        suggestions.innerHTML = "";

        if (input.length < 2) return;

        const matches = Object.keys(pokemonData)
            .filter(name => name.startsWith(input))
            .slice(0, 10);

        matches.forEach(name => {
            const li = document.createElement("li");
            li.textContent = name;
            li.onclick = () => {
                searchInput.value = name;
                suggestions.innerHTML = "";
                searchPokemon();
            };
            suggestions.appendChild(li);
        });
    });

    document.addEventListener("click", function (e) {
        if (!e.target.closest(".search-container")) {
            suggestions.innerHTML = "";
        }
    });
}

function searchPokemon() {
    const input = document.getElementById("searchInput");
    const name = input.value.trim().toLowerCase();
    const suggestions = document.getElementById("suggestions");

    if (!name) {
        loadSVG("kantomap.svg", "large");
        drawHistogram();
        drawPokemonSection(null);
        d3.selectAll(".highlighted-region").classed("highlighted-region", false);
        input.value = "";
        suggestions.innerHTML = "";
        return;
    }

    const p = pokemonData[name];
    if (!p) {
        alert("Pokémon nicht gefunden!");
        return;
    }

    drawPokemonSection(p);
    highlightPokemonRegions(name);
    suggestions.innerHTML = "";
}

function showStarters() {
    const starters = ["bulbasaur", "charmander", "squirtle"];
    const suggestions = document.getElementById("suggestions");
    suggestions.innerHTML = "";

    starters.forEach(name => {
        const li = document.createElement("li");
        li.textContent = name;
        li.onclick = () => {
            document.getElementById("searchInput").value = name;
            suggestions.innerHTML = "";
            searchPokemon();
        };
        suggestions.appendChild(li);
    });
}
