<script>
    export let thumbnail;
    export let name;

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

{#if thumbnail}
    <img bind:this={imgRef} {loading} src="/images/anime/{thumbnail}" alt={`Thumbnail of ${name}`}/>
{:else}
    <div class="anime-thumbnail"></div>
{/if}

<style>
    img {
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
</style>