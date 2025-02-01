function loadContent(event, page) {
    event.preventDefault();

    const [url, query] = page.split("?");
    fetch(base_url_front + "/" + url)
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;

            const initFunctionName = url.split('/').pop().split('.').shift() + '_init';
            if (typeof window[initFunctionName] === 'function') {
                window[initFunctionName]();
            }

            if (query) {
                history.pushState({}, '', '?' + query);
            }
        })
        .catch(error => console.error('Error al cargar la página:', error));
}


function Logout() {
    localStorage.removeItem('token');
    window.location.href = "login.html";
}

function showLoadingModal() {
    const modalElement = document.getElementById("loadingModal");
    const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });
    modal.show();
    updateProgress(0); // Iniciar en 0%
}

function updateProgress(progress) {
    const progressBar = document.getElementById("progressBar");
    progressBar.style.width = progress + "%";
    progressBar.setAttribute("aria-valuenow", progress);
}

function hideLoadingModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById("loadingModal"));
    modal.hide();
}