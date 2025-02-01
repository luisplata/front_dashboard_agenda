async function person_details_init() {
    showLoadingModal();
    await new Promise(resolve => setTimeout(resolve, 1000));

    let progress = 0;
    const progressBar = document.getElementById("progressBar");

    const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = progress + "%";
        progressBar.setAttribute("aria-valuenow", progress);
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 500);
    const params = new URLSearchParams(window.location.search);
    const personId = params.get("id");
    if (!personId) return;

    try {
        const response = await fetch(endpoint + `/people/${personId}`);
        if (!response.ok) throw new Error("Error al obtener la información");

        const person = await response.json();
        document.getElementById("personName").textContent = person.nombre;
        document.getElementById("personId").textContent = person.id;
        document.getElementById("about").textContent = person.about;
        document.getElementById("horario").textContent = person.horario;
        document.getElementById("tarifa").textContent = person.tarifa;
        document.getElementById("whatsapp").textContent = person.whatsapp;
        document.getElementById("telegram").textContent = person.telegram;
        document.getElementById("mapa").textContent = person.mapa;

        // Cargar etiquetas
        const tagsList = document.getElementById("tagsList");
        tagsList.innerHTML = "";
        person.tags.forEach(tag => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item");
            listItem.textContent = `${tag.tipo}: ${tag.valor}`;
            tagsList.appendChild(listItem);
        });

        // Cargar multimedia
        const mediaContainer = document.getElementById("mediaContainer");
        mediaContainer.innerHTML = "";
        person.media.forEach(media => {
            const mediaElement = document.createElement(media.type === "image" ? "img" : "video");
            mediaElement.src = base_url + "/" + media.file_path;
            mediaElement.classList.add("rounded", "shadow-sm");
            mediaElement.style.width = "150px";
            mediaElement.style.cursor = "pointer";
            mediaElement.onclick = () => window.open(media.file_path, "_blank");
            if (media.type === "video") mediaElement.controls = true;
            mediaContainer.appendChild(mediaElement);
        });
    } catch (error) {
        alert("Error al obtener la información");
    }
    clearInterval(interval);
    progress = 100;
    progressBar.style.width = progress + "%";
    progressBar.setAttribute("aria-valuenow", progress);
    return new Promise(resolve => setTimeout(async () => {
        hideLoadingModal();
        resolve();
    }, 1000));
}