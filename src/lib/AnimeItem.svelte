<script>
    let { anime } = $props();

	import AnimeCard from "./AnimeCard.svelte";
</script>

<li><a href="/anime/{anime.slug}"><AnimeCard anime={anime}/></a></li>

<style>
    li > a {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-decoration: none;
        color: black;
        font-weight: 400;
    }
</style>