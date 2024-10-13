import data from '$lib/anime.json';

export function load({ params }) {
    const list = [];
    for (let index = 0; index < data.length; index++) {
        if (data[index].hasOwnProperty('playlist')) {
            const playlist = data[index].playlist;
            for (let index = 0; index < playlist.length; index++) {
                list?.push(playlist[index]);
            }
        }
    }

    return {
        playlist: list,
        anime_count: data.length
    }
}