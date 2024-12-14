<script>
    import animeMap from '$lib/anime.js';
	import AnimeItem from '$lib/AnimeItem.svelte';
	import Nav from '$lib/Nav.svelte';
    
    const sortByOptions = ["name", "released_year"];
    const sortOrderOptions = ['ASC', 'DESC'];
    
    let anime = $state(Object.values(animeMap));
    let sortBy = $state(sortByOptions[0]);
    let sortOrder = $state(sortOrderOptions[0]);
    let search = $state('');

    function handleSort() {
        anime.sort((a, b) => {
            if (sortOrder === 'ASC') {
                return a[sortBy] > b[sortBy] ? 1 : -1;
            } else {
                return a[sortBy] < b[sortBy] ? 1 : -1;
            }
        });
    }

    let filtered = $derived(anime.filter((item) => {
        return item.name.toLowerCase().includes(search.toLowerCase()); 
    }))

    function reset() {
        search = '';
        sortBy = sortByOptions[0];
        sortOrder = sortOrderOptions[0];
        handleSort();
    }
</script>

<svelte:head>
    <title>Home - anime.kresna.me</title>
    <meta name="title" content="anime.kresna.me">
    <meta name="description" content="List of Anime that I have watched. Let's nostalgia together!">
    <meta name="og:type" content="website">
    <meta name="og:title" content="anime.kresna.me">
    <meta name="og:description" content="List of Anime that I have watched. Let's nostalgia together!">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="anime.kresna.me">
    <meta name="twitter:description" content="List of Anime that I have watched. Let's nostalgia together!">
</svelte:head>

<div style="text-align: center;">
    <h1><a href="/">anime.kresna.me</a></h1>
    <Nav />
    <p>List of Anime that I have watched.</p>
    <p>I have watched {anime.length} anime series and still counting. How about you?</p>
    <p>Let's nostalgia together! 📻🎼🎼</p>
</div>

<div style="text-align: center; margin-bottom: 1rem;">
    <label for="search">Name</label>
    <input type="search" id="search" bind:value={search} />
    <label for="sort">Sort by</label>
    <select id="sort" bind:value={sortBy} onchange={handleSort}>
        {#each sortByOptions as opt}
            <option value="{opt}">{opt.replace("_", " ")}</option>
        {/each}
    </select>
    <select name="" id="" bind:value={sortOrder} onchange={handleSort}>
        {#each sortOrderOptions as opt}
            <option value="{opt}">{opt}</option>
        {/each}
    </select>
    <button onclick={reset}>Reset</button>
</div>

<ul>
    {#each filtered as anime (anime.slug)}
        <AnimeItem anime={anime} />
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
