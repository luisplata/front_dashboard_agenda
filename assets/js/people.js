async function people_init() {
    console.log('listarPersonas_init');
    try {
        const response = await fetch(endpoint + '/people');
        if (!response.ok) {
            throw new Error('Error al obtener la lista de personas');
        }

        let token = await getToken();

        const people = await response.json();
        const tableBody = document.getElementById('peopleTableBody');
        tableBody.innerHTML = '';

        people.forEach(person => {
            const row = document.createElement('tr');
            row.innerHTML = `
                        <td>${person.id}</td>
                        <td>${person.nombre}</td>
                        <td>
                            <button class="btn btn-success btn-sm" onclick="loadContent(event, 'content/person_details.html?id=${person.id}')">Ver</button>
                            <button class="btn btn-info btn-sm" onclick="loadContent(event, 'content/person_edit.html?id=${person.id}')">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="eliminarPersona(${person.id}, '${token}')">Eliminar</button>
                        </td>
                    `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error(error);
    }
}

async function eliminarPersona(id, token) {
    if (confirm('¿Estás seguro de que deseas eliminar esta persona?')) {
        try {
            const response = await fetch(`${endpoint}/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({token: token})
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la persona');
            }

            people_init(); // Recargar la lista después de eliminar
        } catch (error) {
            console.error(error);
        }
    }
}