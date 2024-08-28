<script>
    export let anime;
    export let href;

	import AnimeCard from "./AnimeCard.svelte";
</script>

<li><a href={href}><AnimeCard anime={anime}/></a></li>

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