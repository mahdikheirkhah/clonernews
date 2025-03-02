const startUrl = "https://hacker-news.firebaseio.com/v0/";

let startId = 1; // Start from ID 10 (or any number you want initially)
const batchSize = 10; // Load 10 items per request
const container = document.getElementById("cards-container");
const loadMoreButton = document.getElementById("loadMore");

// Set to store IDs of failed fetches (unique values)
let failedIds = new Set();
let allFetchedItems = []; // Store all fetched items

async function fetchItems() {
    let fetchPromises = [];
    let finalID = startId + batchSize;

    // Fetch items up to the current `lastFetchedId`
    for (let i= startId; i < finalID ; i++) {
        // Only fetch the items that are not already fetched
        const url = `${startUrl}item/${i}.json?print=pretty`;
        fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));
    }
    failedIds.forEach(value => {
        const url = `${startUrl}item/${value}.json?print=pretty`;
        fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));
    });

    // Fetch all in parallel and handle both successful and failed promises
    const results = await Promise.allSettled(fetchPromises);

    // Process results
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            const item = result.value;
            if (!item.deleted && !item.dead && item.type !== "comment") {
                allFetchedItems.push(item); // Add valid items
                failedIds.delete(item.id); // Remove successful items from failedIds
            }
        } else {
            // Failed request, store the failed ID for next time
            const failedId = result.reason ? result.reason.id : null;
            if (failedId) {
                failedIds.add(failedId);
            }
        }
    });

    // Sort all items by time (newest first)
    allFetchedItems.sort((a, b) => b.time - a.time);

    // Render the sorted items
    renderItems(allFetchedItems);

    // Update the `lastFetchedId` for the next batch
    startId += batchSize;
}

function renderItems(items) {
    container.innerHTML = ""; // Clear the container before re-rendering

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <h2>${item.title}</h2>
            <p>Type: ${item.type}</p>
            <p>Created by: ${item.by}</p>
            <p>Date: ${new Date(item.time * 1000)}</p>
        `;
        card.addEventListener('click', () => {
            window.location.href = `detail.html?id=${item.id}`;
        });
        fragment.appendChild(card);
    });

    container.appendChild(fragment); // Add all at once
}

// Load more when the user clicks the button
loadMoreButton.addEventListener("click", fetchItems);
window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1) {
        fetchItems();
    }
});
// Initial load
fetchItems();
