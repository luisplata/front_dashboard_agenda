let categoryTreeOriginal = {};
let categoryTreeEdited = {};
let personId = null;

const mapTags = {
    "categoria": "categoria",
    "edad": "edad",
    "estatura": "estatura",
    "peso": "peso",
    "medidas": "medidas",
    "nacionalidad": "nacionalidad",
    "cabello": "cabello",
    "ojos": "ojos",
    "piel": "piel",
    "depilacion": "depilacion",
    "cuerpo": "cuerpo",
    "busto": "busto",
    "cola": "cola",
    "biotipo": "biotipo"
};
let uploadedPhotosContainer = document.getElementById("uploadedPhotos");
let uploadedVideosContainer = document.getElementById("uploadedVideos");

function deleteMedia(id, token) {
    let data = {
        "token": token
    };

    let requestOptions = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // Algunos servidores no aceptan body en DELETE
    };

    fetch(endpoint + "/upload/image/" + id, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al eliminar la imagen: ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            console.log(result);
            alert("Imagen eliminada correctamente");
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Error al eliminar la imagen");
        });
}


async function person_edit_init() {
    showLoadingModal();
    uploadedPhotosContainer = document.getElementById("uploadedPhotos");
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
    personId = params.get("id");
    if (!personId) return;

    try {
        const response = await fetch(endpoint + `/people/${personId}`);
        if (!response.ok) throw new Error("Error al obtener la información");

        const data = await response.json();


        // Llenar información general
        document.getElementById("nombre").value = data.nombre;
        document.getElementById("about").value = data.about;
        document.getElementById("horario").value = data.horario;
        document.getElementById("tarifa").value = data.tarifa;
        document.getElementById("whatsapp").value = data.whatsapp;
        document.getElementById("telegram").value = data.telegram;
        document.getElementById("mapa").value = data.mapa;

        // Llenar información adicional con tags
        const tags = data.tags;


        tags.forEach(tag => {
            if (mapTags[tag.tipo]) {
                document.getElementById(mapTags[tag.tipo]).value = tag.valor;
                document.getElementById(mapTags[tag.tipo]).dataset.id = tag.id;
            }
        });
        categoryTreeOriginal = {};
        categoryTreeEdited = {};

        categoryTreeOriginal = tags;

        getMissingTags(mapTags, tags).forEach(tag => {
            addSubcategoryEdit(tag.tipo, tag.valor, tag.id);
        });


        // Cargar imágenes
        const photosContainer = document.getElementById("uploadedPhotos");
        photosContainer.innerHTML = ""; // Limpiar antes de cargar
        let token = await getToken();
        data.media.forEach(media => {
            renderMedia(media, token);
        });
    } catch (error) {
        console.error("Error al obtener la información:", error);
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

function createMediaElement(media, token) {
    const mediaContainer = document.createElement("div");
    mediaContainer.classList.add("d-flex", "align-items-center", "mt-2");

    let mediaElement;

    if (media.type === "image") {
        mediaElement = document.createElement("img");
        mediaElement.src = base_url + "/" + media.file_path;
        mediaElement.classList.add("img-thumbnail", "me-2");
        mediaElement.style.width = "100px";
    } else if (media.type === "video") {
        mediaElement = document.createElement("video");
        mediaElement.src = base_url + "/" + media.file_path;
        mediaElement.classList.add("me-2");
        mediaElement.style.width = "150px";
        mediaElement.controls = true; // Controles de reproducción
    }

    mediaElement.onclick = () => window.open(base_url + "/" + media.file_path, "_blank");

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("btn", "btn-danger", "btn-sm");
    deleteButton.textContent = "Eliminar";
    deleteButton.onclick = async () => {
        try {
            await deleteMedia(media.id, token);
            mediaContainer.remove(); // Eliminar solo si la petición fue exitosa
        } catch (error) {
            alert("No se pudo eliminar el archivo. Inténtalo de nuevo.");
            console.error(error);
        }
    };

    mediaContainer.appendChild(mediaElement);
    mediaContainer.appendChild(deleteButton);

    return mediaContainer;
}

function renderMedia(media, token) {
    const container = media.type === "image" ? document.getElementById("uploadedPhotos") : document.getElementById("uploadedVideos");

    if (!container) {
        console.error(`Error: El contenedor para ${media.type} no existe.`);
        return; // Salir de la función para evitar el error
    }

    container.appendChild(createMediaElement(media, token));
}


function getCommonTags(mapTags, tags) {
    const commonTags = [];

    tags.forEach(tag => {
        // Verificamos si el tipo del tag está en mapTags y si el valor también coincide
        if (mapTags.hasOwnProperty(tag.tipo)) {
            commonTags.push(tag);
        }
    });

    return commonTags;
}


function getMissingTags(mapTags, tags) {
    // Obtener las claves de mapTags (es decir, los tipos de tags permitidos)
    const allowedTypes = Object.keys(mapTags);

    // Filtrar los tags del segundo array que no están en el primer array
    const missingTags = tags.filter(tag => !allowedTypes.includes(tag.tipo));

    return missingTags;
}

function addSubcategoryEditOver(event) {
    event.preventDefault();
    const category = document.getElementById("category").value.trim();
    const subcategory = document.getElementById("subcategory").value.trim();

    if (!category || !subcategory) {
        alert("Debe ingresar una categoría y una subcategoría");
        return;
    }

    if (!categoryTreeEdited[category]) {
        categoryTreeEdited[category] = [];
    }
    categoryTreeEdited[category].push(
        {
            "subcateogory": subcategory,
            "id": null
        }
    );

    renderCategoryTreeEdit();
    document.getElementById("subcategory").value = ""; // Limpiar campo de subcategoría
}

function addSubcategoryEdit(category, subcategory, id) {
    if (!categoryTreeEdited[category]) {
        categoryTreeEdited[category] = [];
    }
    categoryTreeEdited[category].push(
        {
            "subcateogory": subcategory,
            "id": id
        }
    );

    renderCategoryTreeEdit();
    document.getElementById("subcategory").value = "";
}

function renderCategoryTreeEdit() {
    const listContainer = document.getElementById("subcategoryList");
    listContainer.innerHTML = "";

    Object.entries(categoryTreeEdited).forEach(([category, subcategories]) => {
        const categoryDiv = document.createElement("div");
        categoryDiv.classList.add("alert", "alert-primary", "mt-2");

        const categoryHeader = document.createElement("div");
        categoryHeader.innerHTML = `<strong>${category}</strong>`;

        const deleteCategoryBtn = document.createElement("button");
        deleteCategoryBtn.classList.add("btn", "btn-danger", "btn-sm", "ms-2");
        deleteCategoryBtn.textContent = "Eliminar Categoría";
        deleteCategoryBtn.onclick = function () {
            delete categoryTreeEdited[category];
            renderCategoryTreeEdit();
        };

        categoryHeader.appendChild(deleteCategoryBtn);
        categoryDiv.appendChild(categoryHeader);

        const subList = document.createElement("ul");
        subcategories.forEach((subcategory, index) => {
            const subItem = document.createElement("li");
            subItem.textContent = `${subcategory.subcateogory}`; // Aquí accedemos a la propiedad "subcateogory"

            const deleteSubBtn = document.createElement("button");
            deleteSubBtn.classList.add("btn", "btn-danger", "btn-sm", "ms-2");
            deleteSubBtn.textContent = "Eliminar";
            deleteSubBtn.onclick = function () {
                categoryTreeEdited[category].splice(index, 1);
                if (categoryTreeEdited[category].length === 0) {
                    delete categoryTreeEdited[category];
                }
                renderCategoryTreeEdit();
            };

            subItem.appendChild(deleteSubBtn);
            subList.appendChild(subItem);
        });

        categoryDiv.appendChild(subList);
        listContainer.appendChild(categoryDiv);
    });
}


async function stepCreatePersonEdited() {
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
    let ifCreated = await editPerson(nombre, about, horario, tarifa, whatsapp, telegram, mapa, token, personId);
    if (ifCreated) {
        const modal = bootstrap.Modal.getInstance(document.getElementById("loadingModal"));
        modal.hide();
        nextStep(2);
    } else {
        console.log("Error al crear usuario");
    }
}


async function editPerson(nombre, about, horario, tarifa, whatsapp, telegram, mapa, token, person_id) {

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
        method: 'PUT',
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

    const response = await fetch(endpoint + "/update/" + person_id, requestOptions);
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

async function editTag(key, value, person, token, tag_id) {
    let data = {
        "valor": value,
        "tipo": key,
        "token": token,
    }

    console.log(data);

    let requestOptions = {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow'
    };

    const response = await fetch(endpoint + "/update-tag/" + tag_id, requestOptions);
    if (response.ok) {
        let dataResponse = await response.json();
        return true;
    } else {
        return false;
    }
}

async function stepAdditionalInfoEdited() {
    showLoadingModal();
    const fields = ["categoria", "edad", "estatura", "peso", "medidas", "nacionalidad", "cabello", "ojos", "piel", "depilacion", "cuerpo", "busto", "cola", "biotipo"];
    const data = {};

    fields.forEach(field => {
        data[field] = {
            "valor": document.getElementById(field).value,
            "id": document.getElementById(field).dataset.id
        };
    });
    let token = await getToken();

    const totalTasks = Object.values(data).flat().length;
    let completedTasks = 0;

    const promises = Object.entries(data).map(([key, value]) => editTag(key, value.valor, person.id, token, value.id).then(result => {
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
    nextStep(3);
}

async function stepServicesEdit() {
    const services = categoryTreeEdited;

    if (!services || Object.keys(services).length === 0) {
        alert("Debe ingresar al menos un servicio");
        return;
    }
    showLoadingModal(); // Muestra el modal de carga

    let token = await getToken();

    const invalidTags = categoryTreeOriginal.filter(tag => !mapTags.hasOwnProperty(tag.tipo));
    console.log("Tags inválidos (deben considerarse):", invalidTags);

    const categoryTreeOriginall = {};

    invalidTags.forEach(tag => {
        if (!categoryTreeOriginall[tag.tipo]) {
            categoryTreeOriginall[tag.tipo] = [];
        }
        categoryTreeOriginall[tag.tipo].push({
            id: tag.id,
            subcateogory: tag.valor
        });
    });


    // Obtener los cambios de los tags (nuevos, eliminados y actualizados)
    console.log(categoryTreeOriginall, "Original Before");
    console.log(categoryTreeEdited, "Edited before");
    const {
        nuevos: newTags,
        eliminados: deletedTags,
        editados: updatedTags
    } = compareCategories(categoryTreeOriginall, categoryTreeEdited);

    console.log("Nuevos tags:", newTags);
    console.log("Tags eliminados:", deletedTags);
    console.log("Tags actualizados:", updatedTags);

    const totalTasks = newTags.length + deletedTags.length + updatedTags.length;
    let completedTasks = 0;

// Promesas para los nuevos tags (crear)
    const newTagPromises = newTags.map(tag =>
        addTag(tag.tipo, tag.valor, person.id, token).then(result => {
            completedTasks++;
            updateProgress((completedTasks / totalTasks) * 100);
            return result;
        })
    );

// Promesas para los tags eliminados (eliminar)
    const deletedTagPromises = deletedTags.map(tag =>
        deleteTag(tag.id, token).then(result => {
            completedTasks++;
            updateProgress((completedTasks / totalTasks) * 100);
            return result;
        })
    );

// Promesas para los tags actualizados (actualizar)
    const updatedTagPromises = updatedTags.map(tagChange =>
        editTag(tagChange.original.tipo, tagChange.updated.valor, person.id, token, tagChange.updated.id).then(result => {
            completedTasks++;
            updateProgress((completedTasks / totalTasks) * 100);
            return result;
        })
    );

    // Combine todas las promesas
    const allPromises = [...newTagPromises, ...deletedTagPromises, ...updatedTagPromises];

    // Ejecutar todas las promesas
    const results = await Promise.all(allPromises);

    // Si algún resultado fue falso, significa que hubo un error
    if (results.includes(false)) {
        alert("Hubo un error al procesar algunos cambios de los servicios.");
    }

    // Ocultar el modal de carga
    hideLoadingModal();

    // Ir al siguiente paso, ya sea con éxito o error
    nextStep(4);

    // Limpiar la información de los servicios
    categoryTreeOriginal = {};
    categoryTreeEdited = {};
}

function compareCategories(original, edited) {
    const nuevos = [];
    const eliminados = [];
    const editados = [];

    // 1. Revisar los tags editados y nuevos
    for (const category in edited) {
        edited[category].forEach(editItem => {
            if (editItem.id === null) {
                nuevos.push({
                    tipo: category,
                    valor: editItem.subcateogory
                });
            } else {
                // Buscar el original para ver si ha cambiado
                const originalItem = (original[category] || []).find(o => o.id === editItem.id);
                if (originalItem && originalItem.subcateogory !== editItem.subcateogory) {
                    editados.push({
                        id: editItem.id,
                        tipo: category,
                        valorAnterior: originalItem.subcateogory,
                        valorNuevo: editItem.subcateogory
                    });
                }
            }
        });
    }

    // 2. Revisar los tags eliminados
    for (const category in original) {
        original[category].forEach(originalItem => {
            const existsInEdited = (edited[category] || []).some(e => e.id === originalItem.id);
            if (!existsInEdited) {
                eliminados.push({
                    id: originalItem.id,
                    tipo: category,
                    valor: originalItem.subcateogory
                });
            }
        });
    }

    return {nuevos, eliminados, editados};
}


async function deleteTag(tagId, token) {
    const requestOptions = {
        method: 'DELETE',
        body: JSON.stringify({token: token}), // Enviar el token en el cuerpo
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(`${endpoint}/delete-tag/${tagId}`, requestOptions);
    return !!(response.ok);
}




async function uploadAllVideosEdited() {
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
    loadContent(event, 'content/people.html');
}