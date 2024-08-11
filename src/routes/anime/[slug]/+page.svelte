<script>
    import { page } from '$app/stores';
    import anime from '$lib/anime.json';

    export let data;

    $: currentSlug = $page.params.slug;
    $: currentIndex = anime.findIndex(item => item.slug === currentSlug);
    $: prevAnime = currentIndex > 0 ? anime[currentIndex - 1] : null;
    $: nextAnime = currentIndex < anime.length - 1 ? anime[currentIndex + 1] : null;
</script>

<a href="/">Back</a>

<div style="display: flex; justify-content: space-around">
    {#if prevAnime}
        <a style="align-self: center;" href="/anime/{prevAnime.slug}">&#8249; {prevAnime.name}</a>
    {/if}
    <div class="anime-card">
        <div class="anime-thumbnail"></div>
        <div class="anime-information">
            <h1>{data.anime.name}</h1>
            <span>{data.anime.released_year}</span>
        </div>
    </div>
    {#if nextAnime}
        <a style="align-self: center;" href="/anime/{nextAnime.slug}">{nextAnime.name} &#8250;</a>
    {/if}
</div>

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