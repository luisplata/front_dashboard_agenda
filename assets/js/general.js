let base_url = 'https://lobasvip.com.ve';
let base_url_front = 'https://lobasvip.com.ve/dashboard';
//let base_url = 'http://localhost:8000';
let endpoint = base_url + '/index.php/api';

async function getToken() {
    let token = localStorage.getItem("token");
    if (token) {
        let tokenValid = await ValidateToken(token);
        if (tokenValid) {
            return token;
        } else {
            window.location.href = "login.html";
            return null;
        }
    } else {
        window.location.href = "login.html";
        return null;
    }
}

async function ValidateToken(token) {
    let requestOptions = {
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        },
        redirect: 'follow'
    };

    let response = await fetch(endpoint + "/me?token=" + token, requestOptions);
    let dataResponse = await response.json();
    return dataResponse.id !== undefined;
}