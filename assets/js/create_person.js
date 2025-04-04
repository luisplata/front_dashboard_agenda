let person = {
    id: null,
};

function create_person_init() {
    if (localStorage.getItem("stepsSolved") === null) {
        localStorage.setItem("stepsSolved", JSON.stringify([
            {solved: false},
            {solved: false},
            {solved: false},
            {solved: false},
            {solved: false},
        ]));
    }
    resetStepsSolved();
}

function getStepsSolved(index, key = "stepsSolved") {
    return JSON.parse(localStorage.getItem(key))[index];
}

function setStepsSolved(index, value, key = "stepsSolved") {
    let stepsSolved = JSON.parse(localStorage.getItem(key));
    stepsSolved[index] = {solved: value};
    localStorage.setItem(key, JSON.stringify(stepsSolved));
}

function resetStepsSolved(key = "stepsSolved") {
    localStorage.setItem(key, JSON.stringify([
        {solved: false},
        {solved: false},
        {solved: false},
        {solved: false},
        {solved: false},
    ]));
}

async function stepCreatePerson() {
    console.log(getStepsSolved(0), "getStepsSolved(0)");
    if (getStepsSolved(0).solved) {
        nextStep(2);
        return
    }
    showLoadingModal();
    const nombre = document.getElementById("nombre").value;
    const about = document.getElementById("about").value;
    const horario = document.getElementById("horario").value;
    const tarifa = document.getElementById("tarifa").value;
    const whatsapp = document.getElementById("whatsapp").value;
    const telegram = document.getElementById("telegram").value;
    const mapa = document.getElementById("mapa").value;
    const token = await getToken();

    if (!nombre || !about || !horario || !tarifa || !whatsapp || !telegram || !mapa || !token) {
        alert("Por favor, completa todos los campos.");
        return;
    }
    let ifCreated = await createPerson(nombre, about, horario, tarifa, whatsapp, telegram, mapa, token);
    if (ifCreated) {
        setStepsSolved(0, true);
        const modal = bootstrap.Modal.getInstance(document.getElementById("loadingModal"));
        modal.hide();
        nextStep(2);
    } else {
        console.log("Error al crear usuario");
    }
}

async function stepAdditionalInfo() {
    if (getStepsSolved(1).solved) {
        nextStep(3);
        return;
    }
    showLoadingModal();
    const fields = ["categoria", "edad", "estatura", "peso", "medidas", "nacionalidad", "cabello", "ojos", "piel", "depilacion", "cuerpo", "busto", "cola", "biotipo"];
    const data = {};

    fields.forEach(field => {
        data[field] = document.getElementById(field).value;
    });
    let token = await getToken();

    const totalTasks = Object.values(data).flat().length;
    let completedTasks = 0;

    const promises = Object.entries(data).map(([key, value]) => addTag(key, value, person.id, token).then(result => {
        completedTasks++;
        updateProgress((completedTasks / totalTasks) * 100);
        return result;
    }));

    const results = await Promise.all(promises);


    if (results.includes(false)) {
        alert("Error al agregar algún tag");
        return false;
    }
    const modal = bootstrap.Modal.getInstance(document.getElementById("loadingModal"));
    modal.hide();
    setStepsSolved(1, true);
    nextStep(3);
}

async function addTag(key, value, person, token) {
    let data = {
        "valor": value,
        "tipo": key,
        "token": token,
    }

    let requestOptions = {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow'
    };

    const response = await fetch(endpoint + "/add-tag/" + person, requestOptions);
    if (response.ok) {
        let dataResponse = await response.json();
        return true;
    } else {
        return false;
    }
}

async function createPerson(nombre, about, horario, tarifa, whatsapp, telegram, mapa, token) {

    let data = {
        "nombre": nombre,
        "about": about,
        "horario": horario,
        "tarifa": tarifa,
        "whatsapp": whatsapp,
        "telegram": telegram,
        "mapa": mapa,
        "token": token
    };

    let requestOptions = {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow'
    };

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

    const response = await fetch(endpoint + "/create", requestOptions);
    if (response.ok) {
        clearInterval(interval);
        progress = 100;
        progressBar.style.width = progress + "%";
        progressBar.setAttribute("aria-valuenow", progress);
        return new Promise(resolve => setTimeout(async () => {
            let dataResponse = await response.json();
            person.id = dataResponse.id;
            resolve(dataResponse.nombre === nombre);
        }, 1000));
    } else {
        return false;
    }
}


function showStep(step) {
    document.querySelectorAll('.step-pane').forEach(el => el.classList.add('d-none'));
    document.getElementById(`step-${step}`).classList.remove('d-none');

    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}-tab`).classList.add('active');
}

function nextStep(step) {
    showStep(step);
}

function prevStep(step) {
    showStep(step);
}

let categoryTree = {};

function addSubcategory(event) {
    event.preventDefault();
    const category = document.getElementById("category").value.trim();
    const subcategory = document.getElementById("subcategory").value.trim();

    if (!category || !subcategory) {
        alert("Debe ingresar una categoría y una subcategoría");
        return;
    }

    if (!categoryTree[category]) {
        categoryTree[category] = [];
    }
    categoryTree[category].push(subcategory);

    renderCategoryTree();
    document.getElementById("subcategory").value = ""; // Limpiar campo de subcategoría
}

function renderCategoryTree() {
    const listContainer = document.getElementById("subcategoryList");
    listContainer.innerHTML = "";

    Object.entries(categoryTree).forEach(([category, subcategories]) => {
        const categoryDiv = document.createElement("div");
        categoryDiv.classList.add("alert", "alert-primary", "mt-2");

        const categoryHeader = document.createElement("div");
        categoryHeader.innerHTML = `<strong>${category}</strong>`;

        const deleteCategoryBtn = document.createElement("button");
        deleteCategoryBtn.classList.add("btn", "btn-danger", "btn-sm", "ms-2");
        deleteCategoryBtn.textContent = "Eliminar Categoría";
        deleteCategoryBtn.onclick = function () {
            delete categoryTree[category];
            renderCategoryTree();
        };

        categoryHeader.appendChild(deleteCategoryBtn);
        categoryDiv.appendChild(categoryHeader);

        const subList = document.createElement("ul");
        subcategories.forEach((subcategory, index) => {
            const subItem = document.createElement("li");
            subItem.textContent = `${subcategory}`;

            const deleteSubBtn = document.createElement("button");
            deleteSubBtn.classList.add("btn", "btn-danger", "btn-sm", "ms-2");
            deleteSubBtn.textContent = "Eliminar";
            deleteSubBtn.onclick = function () {
                categoryTree[category].splice(index, 1);
                if (categoryTree[category].length === 0) {
                    delete categoryTree[category];
                }
                renderCategoryTree();
            };

            subItem.appendChild(deleteSubBtn);
            subList.appendChild(subItem);
        });

        categoryDiv.appendChild(subList);
        listContainer.appendChild(categoryDiv);
    });
}

async function stepServices() {
    if (getStepsSolved(2).solved) {
        nextStep(4);
        return;
    }

    const services = categoryTree;

    if (!services || Object.keys(services).length === 0) {
        alert("Debe ingresar al menos un servicio");
        return;
    }
    showLoadingModal();

    let token = await getToken();

    const totalTasks = Object.values(categoryTree).flat().length;
    let completedTasks = 0;

    const promises = Object.entries(categoryTree).flatMap(([key, value]) =>
        value.map(subcategory => addTag(key, subcategory, person.id, token).then(result => {
            completedTasks++;
            updateProgress((completedTasks / totalTasks) * 100);
            return result;
        }))
    );

    const results = await Promise.all(promises);
    if (results.includes(false)) {
        alert("Error al agregar algún tag");
        hideLoadingModal();
        return false;
    }
    hideLoadingModal();
    setStepsSolved(2, true);
    nextStep(4);
    categoryTree = {};
}

async function uploadAllPhotos() {
    const files = document.getElementById("photosInput").files;
    if (files.length === 0) {
        return;
    }
    showLoadingModal();

    const uploadedPhotosContainer = document.getElementById("uploadedPhotos");

    let token = await getToken();
    let personId = person.id;

    const totalFiles = files.length;
    let completedFiles = 0;

    const uploadPromises = Array.from(files).map(file => uploadSinglePhoto(file, personId, token).then(result => {
        completedFiles++;
        updateProgress((completedFiles / totalFiles) * 100);
        return result;
    }));

    await Promise.all(uploadPromises).then(results => {
        results.forEach(result => {
            if (result.success) {
                const photoItem = document.createElement("div");
                photoItem.classList.add("d-flex", "align-items-center", "mt-2");

                const imgElement = document.createElement("img");
                imgElement.src = base_url + "/" + result.url;
                imgElement.classList.add("img-thumbnail", "me-2");
                imgElement.style.width = "100px";
                imgElement.onclick = () => window.open(result.url, "_blank");

                const deleteButton = document.createElement("button");
                deleteButton.classList.add("btn", "btn-danger", "btn-sm");
                deleteButton.textContent = "Eliminar";
                deleteButton.onclick = () => {
                    //TODO: Send delete request
                    uploadedPhotosContainer.removeChild(photoItem);
                };

                photoItem.appendChild(imgElement);
                photoItem.appendChild(deleteButton);
                uploadedPhotosContainer.appendChild(photoItem);
            } else {
                const errorItem = document.createElement("p");
                errorItem.textContent = `Error al subir ${result.fileName}`;
                errorItem.classList.add("text-danger");
                uploadedPhotosContainer.appendChild(errorItem);
            }
        });
    });
    hideLoadingModal();
}

async function uploadSinglePhoto(file, personId, token) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", token);

    try {
        const response = await fetch(endpoint + "/upload/image/" + personId, {
            method: 'POST',
            body: formData,
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Error al subir la imagen: ${response.statusText}`);
        }

        const result = await response.json();
        return {success: true, url: result.media.file_path, fileName: file.name};
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        return {success: false, error: error, fileName: file.name};
    }
}

async function uploadAllVideos() {
    const files = document.getElementById("videosInput").files;

    showLoadingModal();

    const uploadedVideosContainer = document.getElementById("uploadedVideos");
    uploadedVideosContainer.innerHTML = "";

    let token = await getToken();
    let personId = person.id;

    const totalFiles = files.length;
    let completedFiles = 0;

    const uploadPromises = Array.from(files).map(file => uploadSingleVideo(file, personId, token).then(result => {
        completedFiles++;
        updateProgress((completedFiles / totalFiles) * 100);
        return result;
    }));

    const results = await Promise.all(uploadPromises);

    results.forEach(result => {
        if (result.success) {
            const videoItem = document.createElement("div");
            videoItem.classList.add("d-flex", "align-items-center", "mt-2");

            const videoLink = document.createElement("a");
            videoLink.href = base_url + "/" + result.url;
            videoLink.textContent = result.fileName;
            videoLink.target = "_blank";
            videoLink.classList.add("me-2");

            const deleteButton = document.createElement("button");
            deleteButton.classList.add("btn", "btn-danger", "btn-sm");
            deleteButton.textContent = "Eliminar";
            deleteButton.onclick = () => {
                uploadedVideosContainer.removeChild(videoItem);
            };

            videoItem.appendChild(videoLink);
            videoItem.appendChild(deleteButton);
            uploadedVideosContainer.appendChild(videoItem);
            setStepsSolved(4, true);
            loadContent(event, 'content/people.html');
        } else {
            const errorItem = document.createElement("p");
            errorItem.textContent = `Error al subir ${result.fileName}`;
            errorItem.classList.add("text-danger");
            uploadedVideosContainer.appendChild(errorItem);
            //limpiar el campo de videos
            document.getElementById("videosInput").value = "";
        }
    });
    hideLoadingModal();
}

async function uploadSingleVideo(file, personId, token) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", token);

    try {
        const response = await fetch(endpoint + "/upload/video/" + personId, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Error al subir el video: ${response.statusText}`);
        }

        const result = await response.json();
        return {success: true, url: result.media.file_path, fileName: file.name};
    } catch (error) {
        console.error("Error al subir el video:", error);
        return {success: false, error: error, fileName: file.name};
    }
}

function sendAllPhotos() {
    nextStep(5);
    setStepsSolved(3, true);
}