<script>
    export let anime;
    
    import { onMount } from "svelte";
    /**
	 * @type {Element}
	 */
    let imgRef;
    let loading = 'lazy';

    onMount(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    loading = 'eager';
                    observer.disconnect(); // Stop observing once it's in the viewport
                }
            },
            { threshold: 0.1 }
        );

        if (imgRef) {
            observer.observe(imgRef);
        }

        return () => {
            if (imgRef) {
                observer.unobserve(imgRef);
            }
        }
    })
</script>

<div class="anime-card">
    {#if anime?.thumbnail}
        <img bind:this={imgRef} {loading} src={anime.thumbnail} alt={`Thumbnail of ${anime.name}`}/>
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