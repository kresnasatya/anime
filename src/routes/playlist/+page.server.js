import data from '$lib/anime.json';

export function load() {
    const anime = [];
    let total_ost = 0;
    for (let index = 0; index < data.length; index++) {
        if (data[index].hasOwnProperty('playlist')) {
            anime?.push(data[index]);
        }
    }

    for (let index = 0; index < anime.length; index++) {
        const element = anime[index];
        total_ost += element.playlist?.length;
    }

    return {
        anime,
        total_ost
    }
}