let maxID;
fetch_maxID().then(maxID => {
    console.log(typeof maxID);  // Should log 'number' if successful
    console.log(maxID);         // Should log the actual max item ID
  }).catch(error => {
    console.error("Error:", error);  // Handle any errors that occur
  });
let startId = maxID // Start from ID 1
const batchSize = 10; // Load 10 items per request
const container = document.getElementById("cards-container");
const loadMoreButton = document.getElementById("loadMore");

// Set to store IDs of failed fetches (unique values)
let failedIds = new Set();
let allFetchedItems = []; // Store all fetched items

// Throttle fetchItems to be called at most once every 1000ms (1 second)
const throttledFetchItems = throttle(fetchItems, 1000);
async function fetch_maxID(){
    try {
    const response = await fetch("https://hacker-news.firebaseio.com/v0/maxitem.json");
    if (!response.ok) throw new Error("Failed to fetch data");
    result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null; // Return an empty array in case of an error
  }
}
async function fetchItems() {
    let fetchPromises = [];
    //let startId = fetch_maxID();
    let lastMaxID = await fetch_maxID();
    if (maxID !== lastMaxID){
        for (let i = maxID + 1; i <= lastMaxID ; i++ ){
            const url = `https://hacker-news.firebaseio.com/v0/item/${i}.json?print=pretty`;
            fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));            
        }
        maxID = lastMaxID;
    }
    console.log(maxID);
    
    let finalID = startId - batchSize;
    // Fetch items up to the current `finalID`
    for (let i = startId; i > 0 && i > finalID ; i--) {
        const url = `https://hacker-news.firebaseio.com/v0/item/${i}.json?print=pretty`;
        fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));
    }

    // Retry failed IDs
    failedIds.forEach(value => {
        const url = `https://hacker-news.firebaseio.com/v0/item/${value}.json?print=pretty`;
        fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));
    });

    // Fetch all in parallel and handle both successful and failed promises
    const results = await Promise.allSettled(fetchPromises);

    // Process results
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            const item = result.value;
            if (!item.deleted && !item.dead ) {

                allFetchedItems.push(item); // Add valid items
                failedIds.delete(item.id); // Remove successful items from failedIds
            } else{
                console.log("here");
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

    // Update the `startId` for the next batch
    startId -= batchSize;
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
loadMoreButton.addEventListener("click", throttledFetchItems);

// Throttle the scroll event to avoid excessive calls
window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 5) {
        throttledFetchItems();
    }
});
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
// Initial load
fetchItems();



