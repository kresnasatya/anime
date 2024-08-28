<script>
    import { page } from '$app/stores';
    import anime from '$lib/anime.json';
	import AnimeCard from '$lib/AnimeCard.svelte';

    export let data;

    $: currentSlug = $page.params.slug;
    $: currentIndex = anime.findIndex(item => item.slug === currentSlug);
    $: prevAnime = currentIndex > 0 ? anime[currentIndex - 1] : null;
    $: nextAnime = currentIndex < anime.length - 1 ? anime[currentIndex + 1] : null;
</script>

<svelte:head>
    <title>anime.kresna.me - {data.anime.name}</title>
</svelte:head>

<a href="/">Back</a>

<div style="display: flex; justify-content: space-around">
    {#if prevAnime}
        <a style="align-self: center; max-width: 120px;" href="/anime/{prevAnime.slug}">&#8249; {prevAnime.name}</a>
    {:else}
        <div style="align-self: center; max-width: 120px;">&nbsp;</div>
    {/if}
    <AnimeCard anime={data.anime}/>
    {#if nextAnime}
        <a style="align-self: center; max-width: 120px;" href="/anime/{nextAnime.slug}">{nextAnime.name} &#8250;</a>
    {:else}
        <div style="align-self: center; max-width: 120px;">&nbsp;</div>
    {/if}
</div>

{#if data.anime?.favorite_ost}
    <div style="display: flex; flex-direction: column; align-items: center;">
        <h2 style="margin-left: -320px;">Favorite Original soundtrack</h2>
        <ul>
        {#each data.anime.favorite_ost as ost}
            <li>
                <p>{ost.youtube_title}</p>
                <iframe style="aspect-ratio: 16 / 9; width: 100%;" title={ost.youtube_title} src=https://youtube.com/embed/{ost.youtube_id} frameborder="0" allowfullscreen></iframe>
            </li>
        {/each}
        </ul>
    </div>
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