// import { fetchStoryDetail } from "./detail.js";

document.addEventListener("DOMContentLoaded", function() {
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
});