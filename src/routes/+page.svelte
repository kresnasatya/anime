<script>
    import animeMap from '$lib/anime.js';
	import AnimeItem from '$lib/AnimeItem.svelte';

    const anime = Object.values(animeMap);

    let sortByOptions = ["name", "released_year"];
    let sortBy = sortByOptions[0];
    let sortOrderOptions = ['ASC', 'DESC'];
    let sortOrder = sortOrderOptions[0];

    $: sorted = sort(sortBy, sortOrder);

    /**
	 * @param {string} sortBy
     * @param {string} sortOrder
	 */
    function sort(sortBy, sortOrder) {
        return anime.sort((a, b) => {
            if (sortOrder === 'ASC') {
                return a[sortBy] > b[sortBy] ? 1 : -1;
            } else {
                return a[sortBy] < b[sortBy] ? 1 : -1;
            }
        });
    }

    let search = "";

    $: filtered = sorted.filter((a) => {
        return a.name.toLowerCase().includes(search.toLowerCase());
    });

    function reset() {
        search = "";
        sortBy = sortByOptions[0];
        sortOrder = sortOrderOptions[0];
    }
</script>

<svelte:head>
    <title>anime.kresna.me - Home</title>
    <meta name="description" content="List of Anime that I have watched. Let's nostalgia together!">
</svelte:head>

<div style="text-align: center;">
    <h1><a href="/">anime.kresna.me</a></h1>
    <nav>
        <a href="/">Home</a>
        <a href="/playlist">Playlist</a>
    </nav>
    <p>List of Anime that I have watched.</p>
    <p>I have watched {anime.length} anime series and still counting. How about you?</p>
    <p>Let's nostalgia together! 📻🎼🎼</p>
</div>

<div style="text-align: center; margin-bottom: 1rem;">
    <label for="search">Name</label>
    <input type="search" id="search" bind:value={search} />
    <label for="sort">Sort by</label>
    <select id="sort" bind:value={sortBy}>
        {#each sortByOptions as opt}
            <option value="{opt}">{opt.replace("_", " ")}</option>
        {/each}
    </select>
    <select name="" id="" bind:value={sortOrder}>
        {#each sortOrderOptions as opt}
            <option value="{opt}">{opt}</option>
        {/each}
    </select>
    <button on:click={reset}>Reset</button>
</div>

<ul>
    {#each filtered as anime (anime.slug)}
        <AnimeItem href="/anime/{anime.slug}" anime={anime}/>
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
</style>
