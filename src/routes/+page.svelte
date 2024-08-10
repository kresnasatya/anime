<script>
    import anime from '$lib/anime.json';
</script>

<div style="text-align: center;">
    <h1>anime.kresna.me</h1>
    <p><em>List of Anime that Kresna has watched. Made with SvelteKit.</em></p>
</div>

<ul>
    {#each anime as item}
        <li><a href="/anime/{item.slug}"><span>{item.name}</span><span>{item.released_year}</span></a></li>
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
