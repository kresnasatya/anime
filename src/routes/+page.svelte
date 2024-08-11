<script>
    import anime from '$lib/anime.json';
</script>

<div style="text-align: center;">
    <h1>anime.kresna.me</h1>
    <p><em>List of Anime that Kresna has watched. Made with SvelteKit.</em></p>
</div>

<ul>
    {#each anime as item}
        <li><a href="/anime/{item.slug}">
            <div class="anime-card">
                <div class="anime-thumbnail"></div>
                <div class="anime-information">
                    <p>{item.name}</p>
                    <span>{item.released_year}</span>
                </div>
            </div>
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
    
    .anime-card {
        width: 240px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .anime-thumbnail {
        width: 200px;
        max-width: 200px;
        height: 360px;
        max-height: 360px;
        background-color: orange;
        align-self: center;
    }

    .anime-information {
        width: 100%;
        padding: 0 20px;
    }
</style>
