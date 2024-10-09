<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import anime from '$lib/anime.json';
	import AnimeCard from '$lib/AnimeCard.svelte';
	import { afterNavigate } from '$app/navigation';
	import { formatTime } from '$lib/util.js';

	export let data;

	$: currentSlug = $page.params.slug;
	$: currentIndex = anime.findIndex((item) => item.slug === currentSlug);
	$: prevAnime = currentIndex > 0 ? anime[currentIndex - 1] : null;
	$: nextAnime = currentIndex < anime.length - 1 ? anime[currentIndex + 1] : null;

	let youtubeAPIReady = false;
	/** @type {YT.Player | undefined} */
	let player;
	$: playlist = data.anime.playlist;
	/** @type {number | undefined} */
	let playlistIndex = 0;
	let progressCurrentTime = 0;
	let videoCurrentTime = '0:00';
	let videoDuration = '0:00';
	let currentSpeed = 1;
	// 0: No looping, 1: loop current video, 2: loop entire playlist
	let loopMode = 0;
	/** @type {number | undefined } */
	let intervalId;
	
	let toggleVideoPlaybackText = 'Play';
	let toggleLoopText = 'No Looping';

	function loadYouTubeAPI() {
		return new Promise((resolve) => {
			if (window.YT && window.YT.Player) {
				youtubeAPIReady = true;
				resolve();
				return;
			}

			const tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";
			
			const target = document.body;
			target.parentNode?.insertBefore(tag, target);

			window.onYouTubeIframeAPIReady = () => {
				youtubeAPIReady = true;
				resolve();
			}
		})
	}

	function createPlayer() {
		if (!youtubeAPIReady || !playlist || playlist?.length === 0) return;

		if (!player) {
			player = new YT.Player('player', {
				height: '320',
				width: '640',
				videoId: playlist[playlistIndex].id,
				playerVars: {
					controls: 0, // Hide the default YouTube player controls.
				},
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange,
				}
			});
		}
	}

	onMount(() => {
		if (playlist?.length > 0) {
			loadYouTubeAPI().then(() => {
				createPlayer();
			});
			youtubeAPIReady = true;
		}
	});

	afterNavigate(({ from, to }) => {
		if (from?.url.pathname === to?.url.pathname) {
			const searchParams = to?.url.searchParams;
			const videoId = searchParams?.get('v');

			if (videoId) {
				playlistIndex = playlist?.findIndex(video => {
					return video.id === videoId
				});
				if (intervalId) {
					clearInterval(intervalId);
				}
				videoDuration = '0:00';
				player.cueVideoById(playlist[playlistIndex].id);
				window.scrollTo(0, document.documentElement.scrollHeight);
			}
		} else {
			playlistIndex = 0;
			if (playlist?.length > 0) {
				if (player) {
					videoDuration = '0:00';
					player.cueVideoById(playlist[playlistIndex].id);
				}
				
				if (!youtubeAPIReady) {
					loadYouTubeAPI().then(() => {
						createPlayer();
					});
				}
			} else {
				player.destroy();
				player = undefined;
				youtubeAPIReady = false;
			}
		}
	});

	function onPlayerReady() {
		if (player) {
			const currentTime = player.getCurrentTime();
			const duration = player.getDuration();
			videoCurrentTime = formatTime(currentTime);
			videoDuration = formatTime(duration);
		}
	}

	/**
	 * @param {{ data: any; }} event
	 */
	function onPlayerStateChange(event) {
		switch (event.data) {
			case YT.PlayerState.UNSTARTED:
				videoCurrentTime = '0:00';
				videoDuration = formatTime(player.getDuration());
				break;
			case YT.PlayerState.PLAYING:
				// Clear any existing interval
				if (intervalId) {
					clearInterval(intervalId);
				}

				// Set new interval
				intervalId = setInterval(updateSeekBar, 1000);
				toggleVideoPlaybackText = 'Pause';
				videoDuration = formatTime(player.getDuration());
				break;
			case YT.PlayerState.PAUSED:
				toggleVideoPlaybackText = 'Play';
				break;
			case YT.PlayerState.ENDED:
				toggleVideoPlaybackText = 'Play';
				if (loopMode === 1) {
					// Loop the current video
					player.playVideo();
				} else if (loopMode === 2 && playlistIndex < playlist.length - 1) {
					// Loop the entire playlist if not at the last video
					nextVideo();
				} else if (loopMode === 2 && playlistIndex === playlist.length - 1) {
					// Loop back to the first video when the last video ends
					playlistIndex = 0;
					player.loadVideoById(playlist[playlistIndex].id);
				} else if (loopMode === 0 && playlistIndex < playlist.length - 1) {
					// No looping, but move to the next video in the playlist
					nextVideo();
				} else if (loopMode === 0 && playlistIndex === playlist.length - 1) {
					console.log('Playlist ended, no looping');
				}
				break;
		}
	}

	function updateSeekBar() {
		if (player) {
			const currentTime = player.getCurrentTime();
			const duration = player.getDuration();
			
			progressCurrentTime = (currentTime / duration) * 100;
			videoCurrentTime = formatTime(currentTime);
		}
	}

	/**
	 * 
	 * @param {Event} event
	 */
	function seekVideo(event) {
		if (player) {
			const seekTo = parseInt((/** @type {HTMLInputElement} */ (event.target)).value) / 100;
			const duration = player.getDuration();
			player.seekTo(seekTo * duration);
		}
	}

	function toggleVideoPlayback() {
		if (player && player.getPlayerState()) {
			if (player.getPlayerState() === YT.PlayerState.PLAYING) {
				player.pauseVideo();
				toggleVideoPlaybackText = 'Play';
			} else {
				player.playVideo();
				toggleVideoPlaybackText = 'Pause';
			}
		}
	}

	function toggleLoop() {
		loopMode = (loopMode + 1) % 3;

		if (loopMode === 0) {
			toggleLoopText = 'No Looping';	
		} else if (loopMode === 1) {
			toggleLoopText = 'Loop current video';
		} else if (loopMode === 2) {
			toggleLoopText = 'Loop playlist';
		}
	}

	function changeSpeed() {
		currentSpeed = (currentSpeed === 1) ? 1.5 : 1;
		player.setPlaybackRate(currentSpeed);
	}

	function prevVideo() {
		playlistIndex = (playlistIndex - 1 + playlist?.length) % playlist?.length;
		player.loadVideoById(playlist[playlistIndex].id);
		clearInterval(intervalId);
		progressCurrentTime = 0;
		videoCurrentTime = '0:00';
		videoDuration = formatTime(player.getDuration());
	}

	function nextVideo() {
		if (loopMode !== 0 || playlistIndex < playlist.length  - 1) {
			clearInterval(intervalId);
			progressCurrentTime = 0;
			videoCurrentTime = '0:00';
			playlistIndex = (playlistIndex + 1) % playlist?.length;
			player.loadVideoById(playlist[playlistIndex].id);
			videoDuration = formatTime(player.getDuration());
		} else {
			console.log('Reached the last video, no further progression in No Loop mode');
		}
	}
</script>

<svelte:head>
	<title>anime.kresna.me - {data.anime.name}</title>
</svelte:head>

<a href="/">Back</a>

<div style="display: flex; justify-content: space-around">
	<AnimeCard anime={data.anime} />
</div>

{#if playlist}
	<div style="display: flex; flex-direction: column; align-items: center;">
		<h2>Playlist</h2>
		<div id="player"></div>
		<div class="controls my-4">
			<div>
				<button on:click={toggleVideoPlayback}>{toggleVideoPlaybackText}</button>
				<button on:click={toggleLoop}>{toggleLoopText}</button>
				<button on:click={changeSpeed}>Speed {currentSpeed.toString()}x</button>
			</div>
			<div>
				<input type="range" bind:value={progressCurrentTime} on:mouseup={seekVideo} min="0" max="100" step="1" />
				<span>{videoCurrentTime}</span>/<span>{videoDuration}</span>
			</div>
			<div>
				<button on:click={prevVideo}>Previous</button>
				<button on:click={nextVideo}>Next</button>
			</div>
		</div>
		<div id="playlist" style="display: flex; flex-direction: column; gap: .5rem;" data-sveltekit-preload-data="false">
			{#each playlist as ost}
				<!-- svelte-ignore a11y-invalid-attribute -->
				<a style="text-decoration: none;" href="?v={ost.id}">{ost.title}</a>
			{/each}
		</div>
	</div>
{/if}

<div class="prev-next">
	{#if prevAnime}
		<div class="pager">
			<a href="/anime/{prevAnime.slug}" style="text-decoration: none;">
				<span style="display: block; font-size: small; color: dimgray;">Previous</span>
				<span style="display: block; color: black;">{prevAnime.name}</span>
			</a>
		</div>
	{:else}
		<div>&nbsp;</div>
	{/if}
	{#if nextAnime}
		<div class="pager">
			<a href="/anime/{nextAnime.slug}" style="text-decoration: none;">
				<span style="display: block; font-size: small; color: dimgray; text-align: right;">Next</span>
				<span style="display: block; color: black; text-align: right;">{nextAnime.name}</span>
			</a>
		</div>
	{:else}
		<div>&nbsp;</div>
	{/if}
</div>

<style>
	#player {
		width: 100%;
		height: 320px;
	}

	@media screen and (min-width: 1280px) {
		#player {
			max-width: 640px;
		}
	}

	.controls {
		display: flex; 
		justify-content: space-between;
		gap: 1rem;
	}

	.prev-next {
		margin-top: 1rem;
		display: grid;
		gap: 16px;
	}

	@media screen and (min-width: 1280px) {
		.prev-next {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.pager {
		border: 1px solid gainsboro;
		border-radius: 0.25rem;
		padding: 1rem;
	}
</style>
