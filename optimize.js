import fs from 'fs';
import sharp from 'sharp';

fs.readdir('./static/images/anime', (err, files) => {
    for (const file of files) {
        fs.stat(`./static/images/anime/${file}`, (err, fileInfo) => {
            if (err) {
                console.log(err);
            } else {
                if (fileInfo.size > 100 * 1024) {
                    sharp(`./static/images/anime/${file}`)
                        .resize(360)
                        .jpeg({ quality: 80 })
                        .toFile(`./static/images/anime/opt/${file}`);
                }
            }
        })
    }
})