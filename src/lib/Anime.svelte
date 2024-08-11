<script>
    export let anime;
</script>

<div class="anime-card">
    {#if anime?.thumbnail}
        <img src={anime.thumbnail} alt={`Thumbnail of ${anime.name}`}/>
    {:else}
        <div class="anime-thumbnail"></div>
    {/if}
    <div class="anime-information">
        <slot/>
    </div>
</div>

<style>
.anime-card {
        width: 240px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .anime-card img {
        object-fit: cover; 
        width: 240px;
        max-width: 240px;
        height: 360px;
        max-height: 360px; 
        align-self: center;
    }

    .anime-thumbnail {
        width: 240px;
        max-width: 240px;
        height: 360px;
        max-height: 360px;
        background-color: orange;
        align-self: center;
    }

    .anime-information {
        width: 100%;
    }
</style>