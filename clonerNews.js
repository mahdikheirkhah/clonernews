let startIndex = 0;
let firstID = 0;
let lastID = 0;
let pollPageNumber = 0;
let pollMaxPageNumber = 1; 
let jobPageNumber = 0;
let jobMaxPageNumber = 1; 
const batchSize = 10;
const url = "https://hacker-news.firebaseio.com/v0/";
const container = document.getElementById("cards-container");
const loadMoreButton = document.getElementById("loadMore");


// Set to store IDs of failed fetches (unique values)
let failedIds = new Set();
let addedID = new Set();
let allFetchedItems = [];
let allFetchedPolls = [];
let allFetchedJobs = [];


async function fetchingData(url){
    return fetch(url).then(res => res.ok ? res.json() : null).catch(() => null);
}

async function fetchPolls() {
    let fetchPromises = [];
    if (pollPageNumber <= pollMaxPageNumber){
        const polls = await fetchingData(`https://hn.algolia.com/api/v1/search_by_date?page=${pollPageNumber}&tags=poll`)
        const objectIDs = polls.hits.map(hit => hit.objectID);
        pollMaxPageNumber = polls.nbPages;
        pollPageNumber++;
        for(let id of objectIDs){
            fetchPromises.push(fetch(url+`item/${id}.json`).then(res => res.ok ? res.json() : null).catch(() => null));
        }
    
    const results = await Promise.allSettled(fetchPromises);
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            const item = result.value;
            if (!item.deleted && !item.dead && item.type === "poll") {
                allFetchedPolls.push(item); 
            }
        }
    });
    allFetchedPolls.sort((a, b) => b.time - a.time);


    renderItems(allFetchedPolls);
    }
}

async function fetchJobs() {
    let fetchPromises = [];
    if (jobPageNumber <= jobMaxPageNumber){
        const jobs = await fetchingData(`https://hn.algolia.com/api/v1/search_by_date?page=${jobPageNumber}&tags=job`)
        const objectIDs = jobs.hits.map(hit => hit.objectID);
       jobMaxPageNumber = jobs.nbPages;
        jobPageNumber++;
        for(let id of objectIDs){
            fetchPromises.push(fetch(url+`item/${id}.json`).then(res => res.ok ? res.json() : null).catch(() => null));
        }
    
    const results = await Promise.allSettled(fetchPromises);
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            const item = result.value;
            if (!item.deleted && !item.dead && item.type === "job") {
                allFetchedJobs.push(item); 
            }
        }
    });
    allFetchedJobs.sort((a, b) => b.time - a.time);

    renderItems(allFetchedJobs);
    }
}

async function fetchStories() {
    let fetchPromises = [];
    let newID = await fetchingData(url + "newstories.json");
    let size = newID.length;
    let flagnewID = false;
    if (firstID !== newID[0] && lastID !== 0){
        flagnewID = true;
    }
    firstID = newID[0];
    if (lastID === 0){
        lastID = newID[size - 1];
    }
    
    failedIds.forEach(value => {
        const url = `https://hacker-news.firebaseio.com/v0/item/${value}.json`;
        fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));
    });

    if (size > startIndex){
        let finalID = startIndex + batchSize;
        for (let i = startIndex; i < finalID; i++) {
            if(!addedID.has(newID[i])){
                const url = `https://hacker-news.firebaseio.com/v0/item/${newID[i]}.json`;
                fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));
            }
        }
    } else {
        let finalID = Math.max(1, lastID - batchSize);
        for (let i = lastID; i > finalID && i > 0; i--) {
            console.log("i am here");
            if(!addedID.has(i)){
                console.log("hello");
                const url = `https://hacker-news.firebaseio.com/v0/item/${i}.json`;
                fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));
            }
        }
        lastID -= batchSize;
    }
    if (flagnewID){
        let i = 0;
        while(!addedID.has(newID[i]) && i < size){
            const url = `https://hacker-news.firebaseio.com/v0/item/${newID[i]}.json`;
            fetchPromises.push(fetch(url).then(res => res.ok ? res.json() : null).catch(() => null));
            i++;
        }
    }

    const results = await Promise.allSettled(fetchPromises);

    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            const item = result.value;
            if (!item.deleted && !item.dead && item.type === "story") {
                allFetchedItems.push(item);
                failedIds.delete(item.id); 
            }else{
                console.log(item.type);
                console.log(item.delete);
                console.log(item.dead);
            }
            addedID.add(item.id);
        } else {

            const failedId = result.reason ? result.reason.id : null;
            if (failedId) {
                failedIds.add(failedId);
            }
        }
    });

    allFetchedItems.sort((a, b) => b.time - a.time);

    renderItems(allFetchedItems);

    startIndex += batchSize;
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
            <p>Date: ${new Date(item.time * 1000).toLocaleString()}</p>
        `;
        card.addEventListener('click', () => {
            window.location.href = `detail.html?id=${item.id}`;
        });
        fragment.appendChild(card);
    });

    container.appendChild(fragment); // Add all at once
}

// Load more when the user clicks the button
loadMoreButton.addEventListener("click", ()=>{
    changeContent(getURL());
});
window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1) {
        changeContent(getURL());
    }
});


window.addEventListener('popstate', () => {
    changeContent(getURL(),true);
});


function changeContent(type , isToggeld = false) {
    // Update the URL query parameter without reloading
    history.pushState({}, '', `?type=${type}`);
    

    // Load new content based on type
    if (type === 'stories') {
        if(isToggeld){
            startIndex = 0;
            firstID = 0;
            lastID = 0;
            allFetchedItems = [];
            failedIds = new Set();
            addedID = new Set();
        }
        fetchStories();
    } else if (type === 'jobs') {
        if(isToggeld){
            jobPageNumber = 0;
            jobMaxPageNumber = 1;
            allFetchedJobs = [];
        }
        fetchJobs(); 
    } else if (type === 'polls') {
        if(isToggeld){
            pollPageNumber = 0;
            pollMaxPageNumber = 1;
            allFetchedPolls = [];
        }
        fetchPolls();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const updatesUrl = "https://hacker-news.firebaseio.com/v0/updates.json";
    let freshUpdates = [];

async function fetchUpdates() {
    try {
        const response = await fetch(updatesUrl);
        const data = await response.json();
        freshUpdates = data.items;
        
        const updatesWithProfiles = freshUpdates.map((updateId, index) => {
            console.log(updateId, index);

            return {
                updateId,
                profile: data.profiles[index]  // Get the corresponding profile for the update
            };

        });

        renderUpdates(updatesWithProfiles);
        console.log(updatesWithProfiles)
    }
    catch (error) {
        console.error(error);
    }
}
function renderUpdates(idsAndProfiles){
    const updatesContainer = document.getElementById("updates-list");

    updatesContainer.innerHTML = "";

    idsAndProfiles.forEach(update => {
        if (update.updateId !== undefined){
            const li = document.createElement("li");
            li.textContent = `Item ID: ${update.updateId}`; 
            updatesContainer.appendChild(li);
        }
    })
    idsAndProfiles.forEach(update => {
        if (update.profile !== undefined){
            const li = document.createElement("li");
            li.textContent = `Profile: ${update.profile}`; 
            updatesContainer.appendChild(li);
        }
    })
}

setInterval(fetchUpdates, 50000); 
fetchUpdates();
    type = getURL();
    changeContent(type);

});

function getURL(){
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'stories';
    return type;
}