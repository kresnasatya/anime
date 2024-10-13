import { read } from "$app/server";
import matter from "gray-matter";
import markdownit from 'markdown-it';
import about from './about.md';

export async function load() {
    let content = await read(about).text();
    let metadata = matter(content);
    const md = markdownit();
    return {
        metadata: metadata.data,
        content: md.render(metadata.content)
    }
}