<script>
    import animeMap from '$lib/anime.js';
	import Anime from '$lib/Anime.svelte';

    const anime = Object.values(animeMap);

    let sortOptions = ["name", "released_year"];
    let sortBy = sortOptions[0];

    $: sorted = sort(sortBy);

    /**
	 * @param {string} sortBy
	 */
    function sort(sortBy) {
        return anime.sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1));
    }

    let search = "";

    $: filtered = sorted.filter((a) => {
        return a.name.toLowerCase().includes(search.toLowerCase());
    });

    function reset() {
        search = "";
        sortBy = sortOptions[0];
    }
</script>

<svelte:head>
    <title>anime.kresna.me - Home</title>
</svelte:head>

<div style="text-align: center;">
    <h1>anime.kresna.me</h1>
    <p><em>List of Anime that Kresna has watched. Made with SvelteKit.</em></p>
</div>

<div style="text-align: center; margin-bottom: 1rem;">
    <label for="search">Name</label>
    <input type="search" id="search" bind:value={search} />
    <label for="sort">Sort by</label>
    <select id="sort" bind:value={sortBy}>
        {#each sortOptions as opt}
            <option value="{opt}">{opt.replace("_", " ")}</option>
        {/each}
    </select>
    <button on:click={reset}>Reset</button>
</div>

<ul>
    {#each filtered as anime (anime.slug)}
        <li><a href="/anime/{anime.slug}">
            <Anime anime={anime}>
                <p style="font-weight: bold;">{anime.name}</p>
                <span>{anime.released_year}</span>
            </Anime>
            </a>
        </li>
    {/each}
</ul>

<style>
    ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: space-evenly;
    }

    li > a {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-decoration: none;
        color: black;
        font-weight: 400;
    }
</style>
