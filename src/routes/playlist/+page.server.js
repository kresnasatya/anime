import data from '$lib/anime.json';

export function load() {
    const playlist = [];
    let total_anime = 0;
    for (const item of data) {
        if (item.hasOwnProperty('playlist')) {
            total_anime += 1;
            let anime_name = item.name;
            let anime_playlist = item.playlist;
            // @ts-ignore
            for (const ost of anime_playlist) {
                let ost_title = `${anime_name}: ${ost.title}`;
                playlist.push({
                    title: ost_title,
                    id: ost.id
                });
            }
        }
    }

    return {
        playlist,
        total_anime
    }
}