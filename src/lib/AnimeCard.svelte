<script>
    export let anime;
    import AnimeThumbnail from "./AnimeThumbnail.svelte";
</script>

<div class="anime-card">
    <AnimeThumbnail thumbnail={anime.thumbnail} name={anime.name} />
    <div class="anime-information">
        <p style="font-weight: bold;">{anime.name}</p>
        <span>{anime.released_year}</span>
    </div>
</div>

<style>
    .anime-card {
        width: 240px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .anime-information {
        width: 100%;
    }
</style>