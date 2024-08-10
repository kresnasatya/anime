<script>
    export let data;
</script>

<a href="/">Back</a>
<h1>{data.anime.name}</h1>
<p>Release year: {data.anime.released_year}</p>

{#if data.anime?.favorite_ost}
    <ul>
    {#each data.anime.favorite_ost as ost}
        <li>
            <iframe width="640" height="320" title={ost.youtube_title} src=https://youtube.com/embed/{ost.youtube_id} frameborder="0" allowfullscreen></iframe>
        </li>
    {/each}
    </ul>
{/if}

<style>
    ul {
        list-style-type: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
</style>