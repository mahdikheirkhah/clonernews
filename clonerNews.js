
let page = 1;
const loadMoreButton = document.getElementById('loadMore');

async function fetchData() {
    try {
        const response = await fetch("https://hacker-news.firebaseio.com/v0/item/8863.json");
        const data = await response.json();
        displayItems(data);
        page++;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function displayItems(items) {
    const container = document.getElementById('cards-container');
    console.log(items.title);
    console.log(items.type);
    console.log(items.by);
    console.log(items.time);
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <h2>${items.title}</h2>
            <p>Type: ${items.type}</p>
            <p>Created by: ${items.by}</p>
            <p>Date: ${new Date(items.time).toLocaleDateString()}</p>
        `;
        card.addEventListener('click', () => {
            window.location.href = `detail.html?id=${items.id}`;
        });
        container.appendChild(card);
}

loadMoreButton.addEventListener('click', fetchData);
fetchData();