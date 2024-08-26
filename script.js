// Конфигурация GitHub API
const API_KEY = 'API_KEY';
const REPO_OWNER = 'rpfozzy';
const REPO_NAME = 'data3';

// Функция для создания или обновления файла на GitHub
async function createFileOnGitHub(filename, content) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`;
    
    try {
        // Проверяем, существует ли файл
        const existingFile = await fetch(url, {
            headers: {
                'Authorization': `token ${API_KEY}`,
            },
        });
        
        if (existingFile.status === 404) {
            // Файл не существует, создаем новый
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Create file',
                    content: btoa(unescape(encodeURIComponent(content))),
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        } else {
            // Файл существует, обновляем его
            const fileData = await existingFile.json();
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Update file',
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: fileData.sha
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        }
    } catch (error) {
        console.error('Error in createFileOnGitHub:', error);
        throw error;
    }
}

// Функция для получения содержимого файла с GitHub
async function getFileFromGitHub(filename) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${API_KEY}`,
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return decodeURIComponent(escape(atob(data.content)));
    } catch (error) {
        console.error('Error in getFileFromGitHub:', error);
        throw error;
    }
}

// Функция для поиска пользователя
async function searchUser(query) {
    try {
        const files = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/`, {
            headers: {'Authorization': `token ${API_KEY}`},
        }).then(res => res.json());

        for (const file of files) {
            if (file.name.endsWith('.txt')) {
                const content = await getFileFromGitHub(file.name);
                if (content.includes(query)) {
                    return content;
                }
            }
        }
        return null;
    } catch (error) {
        console.error('Error in searchUser:', error);
        throw error;
    }
}

// Функции для управления интерфейсом
function showForm(formType) {
    const mainContent = document.getElementById('mainContent');
    mainContent.classList.add('slide-out-right');
    setTimeout(() => {
        mainContent.style.display = 'none';
        if (formType === 'register') {
            document.getElementById('registerForm').classList.add('active', 'slide-in-left');
        } else {
            document.getElementById('loginForm').classList.add('active', 'slide-in-left');
        }
    }, 300);
}

function showButtons() {
    const activeForm = document.querySelector('.form.active');
    activeForm.classList.remove('slide-in-left');
    activeForm.classList.add('slide-out-right');
    setTimeout(() => {
        activeForm.classList.remove('active', 'slide-out-right');
        const mainContent = document.getElementById('mainContent');
        mainContent.style.display = 'block';
        mainContent.classList.remove('slide-out-right');
        mainContent.classList.add('slide-in-left');
    }, 300);
}

function generateRandomNumbers() {
    const phoneInput = document.getElementById('phone');
    phoneInput.classList.add('shake');
    setTimeout(() => {
        const randomNumbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        phoneInput.value = `+68${randomNumbers}`;
        phoneInput.classList.remove('shake');
    }, 500);
}

// Функция для отображения главного меню
function showMainMenu() {
    document.body.innerHTML = `
        <div class="main-menu">
            <div class="top-bar">
<button id="settingsBtn" style="float: right;">⚙️ Настройки</button>
            </div>
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Поиск пользователя...">
                <button id="searchBtn">🔍</button>
            </div>
            <div class="content">
                <h1>Главное меню</h1>
                <p>Добро пожаловать, ${localStorage.getItem('username')}!</p>
            </div>
            <div id="searchResult"></div>
            <div id="chatList"></div>
        </div>
    `;

    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    loadChatList();
    checkForNewMessages();
}

// Функция для отображения настроек
function showSettings() {
    const settingsMenu = document.createElement('div');
    settingsMenu.className = 'settings-menu';
    settingsMenu.innerHTML = `
        <h2>Настройки</h2>
        <button id="logoutBtn">Выйти из аккаунта</button>
        <button id="closeSettingsBtn">Закрыть</button>
    `;
    document.body.appendChild(settingsMenu);

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsMenu.remove());
}

// Функция для выхода из аккаунта
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('currentChatId');
    localStorage.removeItem('currentChatPartner');
    location.reload();
}

// Функция для выполнения поиска
async function performSearch() {
    const query = document.getElementById('searchInput').value;
    try {
        const result = await searchUser(query);
        const searchResultDiv = document.getElementById('searchResult');
        
        if (result) {
            const [, nickname] = result.match(/Nickname: (.+)/);
            const [, username] = result.match(/Username: (.+)/);

            // Сохранение никнейма и имени пользователя
            localStorage.setItem('searchNickname', nickname);
            localStorage.setItem('searchUsername', username);

            searchResultDiv.innerHTML = `
                <h3>Результат поиска:</h3>
                <p>Никнейм: ${nickname}</p>
                <p>Имя пользователя: <a href="#" onclick="openChat('${username}')">@${username}</a></p>
                <button onclick="openChat('${username}')">Открыть чат</button>
            `;
        } else {
            searchResultDiv.innerHTML = '<p>Пользователь не найден</p>';
        }
    } catch (error) {
        console.error('Error in performSearch:', error);
        alert('Произошла ошибка при поиске. Попробуйте еще раз.');
    }
}

// Функция для открытия профиля пользователя
function openUserProfile(username) {
    alert(`Открыт профиль пользователя @${username}`);
}

// Функция для открытия чата
function openChat(username) {
    const currentUser = localStorage.getItem('username');
    const usersSorted = [currentUser, username].sort();
    const chatId = `@${usersSorted[0]}_@${usersSorted[1]}_messages.txt`;

    const nickname = localStorage.getItem('searchNickname'); // Получение никнейма

    document.body.innerHTML = `
        <div class="chat-container">
            <div class="chat-header">
<button onclick="showMainMenu()" style="float: right;">Назад</button>
                <h2>${nickname}</h2> <!-- Использование никнейма -->
            </div>
            <div class="messages-container" id="messagesContainer">
                <div id="messages"></div>
            </div>
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Введите сообщение...">
                <button id="sendButton" onclick="sendMessage('${username}')">
                    <img src="send_icon.png" alt="Отправить">
                </button>
            </div>
        </div>
    `;

    loadMessages(chatId);
    localStorage.setItem('currentChatId', chatId);
    localStorage.setItem('currentChatPartner', username);

    // Проверка на новые сообщения каждую секунду
    setInterval(() => checkForNewMessages(), 100);
}

// Функция для загрузки сообщений
async function loadMessages(chatId) {
    try {
        const messages = await getFileFromGitHub(chatId);
        const messagesContainer = document.getElementById('messages');
        const currentUser = localStorage.getItem('username');
        
        if (messagesContainer) {
            messagesContainer.innerHTML = '';

            messages.split('\n').forEach(message => {
                if (message.trim() === '') return;
                const [sender, text] = message.split(': ');
                const messageElement = document.createElement('div');
                messageElement.className = sender === currentUser ? 'message sent' : 'message received';
                messageElement.textContent = text;
                messagesContainer.appendChild(messageElement);
            });

            const container = document.getElementById('messagesContainer');
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Ошибка при загрузке сообщений:', error);
    }
}

// Функция для отправки сообщения
async function sendMessage(recipient) {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message.trim() === '') return;

    const sender = localStorage.getItem('username');
    const usersSorted = [sender, recipient].sort(); // Сортируем имена, чтобы всегда получать одинаковое имя файла
    const chatId = `@${usersSorted[0]}_@${usersSorted[1]}_messages.txt`;
    
    try {
        const newMessage = `${sender}: ${message}\n`;
        
        // Обновляем файл сообщений
        await updateMessageFile(chatId, newMessage);

        messageInput.value = '';
        await loadMessages(chatId);
        updateChatList(sender, recipient);
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        alert('Произошла ошибка при отправке сообщения. Попробуйте еще раз.');
    }
}

// Функция для проверки новых сообщений
async function checkForNewMessages() {
    const currentUser = localStorage.getItem('username');
    const currentChatId = localStorage.getItem('currentChatId');
    
    try {
        if (currentChatId) {
            const messages = await getFileFromGitHub(currentChatId);
            const messagesContainer = document.getElementById('messages');
            const currentMessages = messagesContainer ? messagesContainer.textContent : '';

            if (messages !== currentMessages) {
                await loadMessages(currentChatId);
            }
        }
    } catch (error) {
        console.error('Ошибка при проверке новых сообщений:', error);
    }
}

// Функция для загрузки списка чатов
async function loadChatList() {
    const currentUser = localStorage.getItem('username');
    try {
        const chatListContent = await getFileFromGitHub(`@${currentUser}_chats.txt`);
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '<h3>Ваши чаты:</h3>';
        
        chatListContent.split('\n').forEach(chat => {
            if (chat.trim() !== '') {
                const chatElement = document.createElement('p');
                chatElement.innerHTML = `<a href="#" onclick="openChat('${chat}')">Чат с @${chat}</a>`;
                chatList.appendChild(chatElement);
            }
        });
    } catch (error) {
        console.error('Ошибка при загрузке списка чатов:', error);
    }
}

// Функция для обновления файла сообщений
async function updateMessageFile(chatId, newMessage) {
    let existingMessages = '';
    try {
        existingMessages = await getFileFromGitHub(chatId);
    } catch (error) {
        // Файл не существует, создаем новый
    }
    await createFileOnGitHub(chatId, existingMessages + newMessage);
}

// Функция для обновления списка чатов
async function updateChatList(user, chatPartner) {
    try {
        let chatList = '';
        const chatListFile = `@${user}_chats.txt`;
        try {
            chatList = await getFileFromGitHub(chatListFile);
        } catch (error) {
            // Файл не существует, создаем новый
        }

        if (!chatList.includes(chatPartner)) {
            chatList += `${chatPartner}\n`;
            await createFileOnGitHub(chatListFile, chatList);
        }
    } catch (error) {
        console.error('Ошибка при обновлении списка чатов:', error);
    }
}

// Обработчик события отправки формы регистрации
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const nickname = document.getElementById('nickname').value;
    const username = document.getElementById('username').value.replace('@', '');
    const phone = document.getElementById('phone').value.replace('+', '');
    const password = document.getElementById('password').value;

    const userData = `Nickname: ${nickname}\nUsername: ${username}\nPhone: +${phone}\nPassword: ${password}`;
    
    try {
        await createFileOnGitHub(`${phone}.txt`, userData);
        localStorage.setItem('username', username);
        localStorage.setItem('isLoggedIn', 'true');
        alert('Регистрация успешна!');
        showMainMenu();
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        alert('Произошла ошибка при регистрации. Попробуйте еще раз.');
    }
});

// Обработчик события отправки формы входа
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value.replace('+', '');
    const password = document.getElementById('loginPassword').value;

    try {
        const userData = await getFileFromGitHub(`${phone}.txt`);
        const [, username] = userData.match(/Username: (.+)/);
        const [, storedPassword] = userData.match(/Password: (.+)/);

        if (password === storedPassword) {
            localStorage.setItem('username', username);
            localStorage.setItem('isLoggedIn', 'true');
            alert('Авторизация успешна!');
            showMainMenu();
        } else {
            alert('Неверный номер телефона или пароль');
        }
    } catch (error) {
        console.error('Ошибка при авторизации:', error);
        alert('Произошла ошибка при авторизации. Попробуйте еще раз.');
    }
});

// Обработчик события загрузки страницы
window.addEventListener('load', function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        showMainMenu();
        setInterval(checkForNewMessages, 100);
    }
});  
