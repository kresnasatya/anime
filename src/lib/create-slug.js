import * as fs from 'node:fs';

/**
 * @param {string} title
 */
function createSlug(title) {
    return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hypens
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}

const fileName = 'anime.json';
fs.readFile(fileName, 'utf-8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        // Parse the JSON data
        let jsonData = JSON.parse(data);
        // Iterate through the array of objects
        jsonData = jsonData.map((/** @type {{ slug: void; title: string; }} */ obj) => {
            // Create a slug from the title and add it to the object
            obj.slug = createSlug(obj.name);
            return obj;
        });

        // Convert the updated data back to JSON
        const updatedData = JSON.stringify(jsonData, null, 2);

        // Write the updated data back to the title
        fs.writeFile(fileName, updatedData, 'utf-8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('File updated successfully');
            }
        })
    } catch (error) {
        console.log('Error parsing JSON: ', error);
    }
});

