<script>
    import anime from '$lib/anime.json';
	import Anime from '$lib/Anime.svelte';
</script>

<div style="text-align: center;">
    <h1>anime.kresna.me</h1>
    <p><em>List of Anime that Kresna has watched. Made with SvelteKit.</em></p>
</div>

<ul>
    {#each anime as item}
        <li><a href="/anime/{item.slug}">
            <Anime anime={item}>
                <p style="font-weight: bold;">{item.name}</p>
                <span>{item.released_year}</span>
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
