document.addEventListener('DOMContentLoaded', function () {
    //get the form element
    const form = document.querySelector('form');
    //sreach for remember me checkbox
    const remember = localStorage.getItem('remember');
    //if the user has checked the remember me checkbox
    if (remember) {
        //check the checkbox
        form.remember.checked = true;
    }
    //Search if user token is stored
    const token = localStorage.getItem('token');
    //send to the home page if the token is stored
    if (token) {
        ValidateToken(token).then(isValid => {
            if (isValid) {
                window.location.href = "dashboard.html";
            }
        });
    }
    //add an event listener to the form
    form.addEventListener('submit', function (event) {
        //prevent the default form submission
        event.preventDefault();
        //get the form data
        const formData = new FormData(form);
        //create an object to store the form data
        const data = {};
        //iterate over the form data
        for (const [key, value] of formData.entries()) {
            //add the form data to the object
            data[key] = value;
        }
        //log the form data
        console.log(data);
        Login(data.email, data.password);
    });
});

function Login(user, password) {

    //get the form element
    const form = document.querySelector('form');

    var raw = JSON.stringify({
        email: user, password: password
    });

    var requestOptions = {
        method: 'POST', headers: {
            "Content-Type": "application/json"
        }, body: raw, redirect: 'follow'
    };

    fetch(endpoint + "/login", requestOptions)
        .then(response => response.text())
        .then(result => {

            //convert string to json
            const data = JSON.parse(result);
            //store the token in the local storage
            console.log(data.token);

            //ask if him want remember the user
            localStorage.setItem('remember', form.remember.checked);
            if (form.remember.checked) {
                //store the user in the local storage
                localStorage.setItem('token', data.token);
            } else {
                //store the user in the session storage
                sessionStorage.setItem('token', data.token);
            }

            ValidateToken(data.token).then(isValid => {
                if (isValid) {
                    switch (data.profile) {
                        case "Admin":
                            window.location.href = "dashboard.html";
                            break;
                        case "Model":
                            window.location.href = "model_dashboard.html";
                            break;
                        default:
                            alert("Credenciales invalidas");
                            break;
                    }
                } else {
                    alert("Credenciales invalidas");
                }
            });
        })
        .catch(error => console.log('error', error));
}