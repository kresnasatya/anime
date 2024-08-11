<script>
    import { page } from '$app/stores';
    import anime from '$lib/anime.json';
	import Anime from '$lib/Anime.svelte';

    export let data;

    $: currentSlug = $page.params.slug;
    $: currentIndex = anime.findIndex(item => item.slug === currentSlug);
    $: prevAnime = currentIndex > 0 ? anime[currentIndex - 1] : null;
    $: nextAnime = currentIndex < anime.length - 1 ? anime[currentIndex + 1] : null;
</script>

<a href="/">Back</a>

<div style="display: flex; justify-content: space-around">
    {#if prevAnime}
        <a style="align-self: center; max-width: 120px;" href="/anime/{prevAnime.slug}">&#8249; {prevAnime.name}</a>
    {/if}
    <Anime anime={data.anime}>
        <h1 style="font-size: 1rem;">{data.anime.name}</h1>
        <span>{data.anime.released_year}</span>
    </Anime>
    {#if nextAnime}
        <a style="align-self: center; max-width: 120px;" href="/anime/{nextAnime.slug}">{nextAnime.name} &#8250;</a>
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