import anime from './anime.json';

/** @type {Record<number, typeof anime[0]>} */
let animeMap = {};
for (const _anime of anime) {
    animeMap[_anime.slug] = _anime;
}

export default animeMap;