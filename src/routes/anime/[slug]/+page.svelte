<script>
	import { page } from '$app/stores';
	import anime from '$lib/anime.json';
	import { afterNavigate } from '$app/navigation';
	import { formatTime, LOOP_CURRENT_VIDEO, LOOP_PLAYLIST, NO_LOOP } from '$lib/util.js';
	import Nav from '$lib/Nav.svelte';

	let { data } = $props();

	let currentSlug = $derived($page.params.slug);
	let currentIndex = $derived(anime.findIndex((item) => item.slug === currentSlug));
	let prevAnime = $derived(currentIndex > 0 ? anime[currentIndex - 1] : null);
	let nextAnime = $derived(currentIndex < anime.length - 1 ? anime[currentIndex + 1] : null);
	let playlist = $derived(data.anime.playlist);

	let youtubeAPIReady = $state(false);
	/** @type {YT.Player | undefined} */
	let player = $state();
	/** @type {number} */
	let ostIndex = $state(0);
	let progressCurrentTime = $state(0);
	let videoCurrentTime = $state('0:00');
	let videoDuration = $state('0:00');
	let currentSpeed = $state(1);
	// 0: No looping, 1: loop current video, 2: loop entire playlist
	let loopMode = $state(0);
	/** @type {number | undefined } */
	let intervalId;
	
	let toggleVideoPlaybackText = $state('Play');
	let toggleLoopText = $state('No Looping');

	/**
	 * @type {HTMLUListElement}
	 */
	let playlistContainer;

	/**
	 * @type {HTMLLIElement[]}
	 */
	let ostRefs = $state([]);

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

	function createPlayer(ostIndex = 0) {
		if (!youtubeAPIReady || !playlist || playlist?.length === 0) return;

		if (!player) {
			player = new YT.Player('player', {
				height: '320',
				width: '640',
				host: 'https://www.youtube-nocookie.com',
				videoId: playlist[ostIndex].id,
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

	$effect(() => {
		if (playlist?.length > 0) {
			loadYouTubeAPI().then(() => {
				if ($page.url.searchParams.get('v')) {
					let videoId = $page.url.searchParams.get('v');
					ostIndex = playlist?.findIndex((video) => {
						return videoId === video.id;
					});
					ostIndex = ostIndex == -1 ? 0 : ostIndex;
				}
				createPlayer(ostIndex);
			});
			youtubeAPIReady = true;
		}
	});

	afterNavigate(() => {
		ostIndex = 0;
		if (playlist?.length > 0) {
			if (player) {
				videoDuration = '0:00';
				player.cueVideoById(playlist[ostIndex].id);
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
				if (loopMode === LOOP_CURRENT_VIDEO) {
					player.playVideo();
				} else if (loopMode === LOOP_PLAYLIST) {
					if (ostIndex === playlist.length - 1) {
						ostIndex = 0;
						player.loadVideoById(playlist[ostIndex].id);	
					} else {
						nextVideo();
					}
				} else if (loopMode === NO_LOOP) {
					if (ostIndex === playlist.length - 1) {
						console.log('Playlist ended, no looping');
					} else {
						nextVideo();
					}
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

		if (loopMode === NO_LOOP) {
			toggleLoopText = 'No Looping';	
		} else if (loopMode === LOOP_CURRENT_VIDEO) {
			toggleLoopText = 'Loop current video';
		} else if (loopMode === LOOP_PLAYLIST) {
			toggleLoopText = 'Loop playlist';
		}
	}

	function changeSpeed() {
		currentSpeed = (currentSpeed === 1) ? 1.5 : 1;
		player.setPlaybackRate(currentSpeed);
	}

	function prevVideo() {
		ostIndex = (ostIndex - 1 + playlist?.length) % playlist?.length;
		player.loadVideoById(playlist[ostIndex].id);
		clearInterval(intervalId);
		progressCurrentTime = 0;
		videoCurrentTime = '0:00';
		videoDuration = formatTime(player.getDuration());
		scrollToCurrentOst();
	}

	function nextVideo() {
		if (ostIndex < playlist.length  - 1) {
			clearInterval(intervalId);
			progressCurrentTime = 0;
			videoCurrentTime = '0:00';
			ostIndex = (ostIndex + 1) % playlist?.length;
			player.loadVideoById(playlist[ostIndex].id);
			videoDuration = formatTime(player.getDuration());
			scrollToCurrentOst();
		} else {
			console.log('Reached the last video, no further progression in No Loop mode');
		}
	}

	function playOst(event) {
		event.preventDefault();
		const searchParams = new URLSearchParams(event.target.getAttribute('href'));
		const videoId = searchParams.get('v');
		ostIndex = playlist?.findIndex(video => {
			return video.id === videoId
		});
		if (intervalId) {
			clearInterval(intervalId);
		}
		videoDuration = '0:00';
		player.cueVideoById(playlist[ostIndex].id);
	}

	function scrollToCurrentOst() {
		if (!playlistContainer || !ostRefs[ostIndex]) return;

		const container = playlistContainer;
		const element = ostRefs[ostIndex];

		const containerRect = container.getBoundingClientRect();
		const elementRect = element.getBoundingClientRect();

		// Calculate the scroll position to center the element
		const scrollTop = 
			element.offsetTop -
			container.offsetTop -
			(containerRect.height - elementRect.height) / 2;

		// Smooth scroll to position
		container.scrollTo({
			top: scrollTop,
			behavior: 'smooth'
		});
	}
</script>

<svelte:head>
	<title>{data.anime.name} - anime.kresna.me</title>
</svelte:head>

<Nav />

<div style="text-align: center;">
    <h1>{data.anime.name}</h1>
	<p>{data.anime.name} released on {data.anime.released_year}</p>
	<img src="/images/anime/{data.anime.thumbnail}" alt={`Thumbnail of ${data.anime.name}`}/>
</div>

{#if playlist}
	<div style="display: flex; flex-direction: column; align-items: center;">
		<h2>Playlist</h2>
		<div id="player"></div>
		<div class="controls my-4">
			<div>
				<button onclick={toggleVideoPlayback}>{toggleVideoPlaybackText}</button>
				<button onclick={toggleLoop}>{toggleLoopText}</button>
				<button onclick={changeSpeed}>Speed {currentSpeed.toString()}x</button>
			</div>
			<div>
				<input type="range" bind:value={progressCurrentTime} onmouseup={seekVideo} min="0" max="100" step="1" />
				<span>{videoCurrentTime}</span>/<span>{videoDuration}</span>
			</div>
			<div>
				<button onclick={prevVideo}>Previous</button>
				<button onclick={nextVideo}>Next</button>
			</div>
		</div>
		<ul id="playlist" bind:this={playlistContainer} style="list-style-type: none; margin: 0; padding: 0; height: 360px; overflow: hidden; overflow-y: scroll;">
			{#each playlist as ost, index}
				<li class="ost-item" bind:this={ostRefs[index]} class:active={index === ostIndex}><a onclick={playOst} href="?v={ost.id}">{ost.title}</a></li>
			{/each}
		</ul>
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
	img {
        object-fit: cover; 
        width: 240px;
        max-width: 240px;
        height: 360px;
        max-height: 360px; 
        align-self: center;
    }

	#player {
		width: 100%;
		height: 320px;
	}

	@media screen and (min-width: 1280px) {
		#player {
			max-width: 640px;
		}
	}

	.ost-item {
		padding: 1rem;
		width: 100%;
	}

	.ost-item > a {
		text-decoration: none;
		color: black;
	}

	@media screen and (min-width: 1280px) {
		.ost-item {
			width: 575px;
		}
	}

	.ost-item:hover {
		background-color: #f0f0f0;
	}

	.ost-item:hover a {
		color: #747bff;
	}

	.ost-item.active {
		background-color: #e0e0e0;
		font-weight: bold;
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
