const API_URL = 'http://127.0.0.1:8000';

function updateUI() {
    const accessToken = localStorage.getItem('accessToken');
    const username = localStorage.getItem('username');

    if (accessToken) {
        $('#login-link').addClass('hidden');
        $('#profile-link, #user-info, #logout-btn').removeClass('hidden');
        $('#user-info').text(`Привіт, ${username}!`);
    } else {
        $('#login-link').removeClass('hidden');
        $('#profile-link, #user-info, #logout-btn').addClass('hidden');
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    updateUI();
    window.location.href = '/';
}


function authenticatedRequest(url, method, data, successCallback) {
    $.ajax({
        url: url,
        method: method,
        data: JSON.stringify(data),
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        success: successCallback,
        error: function(error) {
            console.error('Помилка запита:', error);
            if (error.status === 401) {
                alert('Ваша сесія вичерпалася. Будь ласка, увійдіть знову.');
                logout();
            }
        }
    });
}


$(document).ready(function() {
    updateUI();
    const currentPage = window.location.pathname;


    if (currentPage.includes('profile.html') && !localStorage.getItem('accessToken')) {
        window.location.href = 'login.html'; // if non auth user tries to access profile
    }
    if (currentPage.includes('login.html') && localStorage.getItem('accessToken')) {
        window.location.href = 'profile.html'; // if auth user tries to access login
    }


    $('#logout-btn').on('click', logout);


    $('#register-form').on('submit', function(e) {
        e.preventDefault();
        const userData = {
            username: $('#username').val(),
            first_name: $('#first_name').val(),
            last_name: $('#last_name').val(),
            email: $('#email').val(),
            password: $('#password').val(),
            password_check: $('#password_check').val()
        };
        $.ajax({
            url: `${API_URL}/auth/register/`,
            type: 'POST',
            data: JSON.stringify(userData),
            contentType: 'application/json',
            success: function(response) {
                alert('Реєстрація пройшла успішно! Тепер ви можете війти.');
                window.location.href = 'login.html';
            },
            error: function(error) {
                $('#error-message').text(JSON.stringify(error.responseJSON));
            }
        });
    });

    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        const loginData = {
            email: $('#email').val(),
            password: $('#password').val()
        };
        $.ajax({
            url: `${API_URL}/auth/token/`,
            type: 'POST',
            data: JSON.stringify(loginData),
            contentType: 'application/json',
            success: function(response) {
                localStorage.setItem('accessToken', response.access);
                localStorage.setItem('refreshToken', response.refresh);
                authenticatedRequest(`${API_URL}/auth/profile/`, 'GET', null, function(profile) {
                    localStorage.setItem('username', profile.username);
                    window.location.href = 'profile.html';
                });
            },
            error: function(error) {
                $('#error-message').text('Невірний email або пароль.');
            }
        });
    });


    if (currentPage.includes('profile.html')) {
        authenticatedRequest(`${API_URL}/auth/profile/`, 'GET', null, function(profile) {
            $('#profile-data').html(`
                <p><strong>Username:</strong> ${profile.username}</p>
                <p><strong>Email:</strong> ${profile.email}</p>
                <p><strong>Ім'я:</strong> ${profile.first_name || 'не вказано'}</p>
                <p><strong>Прізвище:</strong> ${profile.last_name || 'не вказано'}</p>
            `);
        });
    }

    // main page
    $('#load-products').click(function() {
        $.ajax({
            url: `${API_URL}/products/`,
            type: 'GET',
            success: function(data) {
                $('#products-list').empty();
                if (data.length === 0) {
                    $('#products-list').append('<p>Продуктів поки нема.</p>');
                } else {
                    $.each(data, function(index, product) {
                        $('#products-list').append(
                            `<div class="product"><strong>${product.name}</strong><p>${product.short_descr}</p></div>`
                        );
                    });
                }
            },
            error: function(error) {
                $('#products-list').html('<p>Не вдалося загрузити продукти.</p>');
            }
        });
    });
});