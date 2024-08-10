import { error } from "@sveltejs/kit";
import data from '$lib/anime.json';

export function load({ params }) {
    const anime = data.find((item) => item.slug === params.slug);

    if (!anime) throw error(404);

    return { anime };
}