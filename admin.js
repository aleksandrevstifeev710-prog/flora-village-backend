document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const adminContent = document.getElementById('adminContent');
    const passInput = document.getElementById('adminPassword');
    const loginBtn = document.getElementById('adminLoginBtn');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutAdmin');

    // Проверяем, есть ли активная сессия админа
    if (sessionStorage.getItem('isAdminLogged') === 'true') {
        showAdminPanel();
    } else {
        loginForm.style.display = 'block';
        adminContent.style.display = 'none';
    }

    // Нажатие на кнопку "Войти"
    loginBtn.addEventListener('click', async () => {
        const password = passInput.value.trim();
        if (!password) {
            loginError.textContent = 'Введите пароль.';
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });
            const result = await response.json();

            if (result.success) {
                sessionStorage.setItem('isAdminLogged', 'true');
                loginError.textContent = '';
                showAdminPanel();
            } else {
                loginError.textContent = result.message || 'Неверный пароль';
            }
        } catch (error) {
            loginError.textContent = 'Ошибка соединения с сервером.';
            console.error(error);
        }
    });

    // Выход из админки
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isAdminLogged');
        loginForm.style.display = 'block';
        adminContent.style.display = 'none';
        passInput.value = '';
        loginError.textContent = '';
    });

    // Логика отображения админ-панели и загрузки заказов
    async function showAdminPanel() {
        loginForm.style.display = 'none';
        adminContent.style.display = 'block';
        await loadOrders();
    }

    async function loadOrders() {
        const tableBody = document.getElementById('ordersTable');
        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/orders');
            const orders = await response.json();
            
            const totalOrdersEl = document.getElementById('totalOrders');
            const totalRevenueEl = document.getElementById('totalRevenue');
            const newOrdersEl = document.getElementById('newOrders');

            if (!orders || orders.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted);">Заказов пока нет</td></tr>`;
                return;
            }

            let totalSum = 0;
            let newOrdersCount = 0;
            let html = '';

            orders.forEach(order => {
                totalSum += order.total;
                if (order.status === 'new') newOrdersCount++;

                const itemsList = order.items.map(item => 
                    `${item.title} (${item.qty} шт.)`
                ).join(', ');

                // ===== ЭСТЕТИЧНЫЕ ИКОНКИ И СТАТУСЫ =====
                let statusClass = 'status-new';
                let statusIcon = '<i class="fa-regular fa-clock"></i>'; // Иконка часов
                let statusText = 'Новый';
                let nextStatus = 'done';

                if (order.status === 'done') { 
                    statusClass = 'status-done'; 
                    statusIcon = '<i class="fa-regular fa-circle-check"></i>'; // Иконка галочки
                    statusText = 'Выполнен';
                    nextStatus = 'new'; 
                }

                html += `
                    <tr>
                        <td><b>${order.id}</b></td>
                        <td>
                            <b>${order.name}</b><br>
                            <small style="color:var(--muted);">${order.phone}</small>
                        </td>
                        <td class="order-items">${itemsList}</td>
                        <td><b>${new Intl.NumberFormat('ru-RU').format(order.total)} ₽</b></td>
                        <td><small>${order.address}</small></td>
                        <td>
                            <button class="status-btn ${statusClass}" data-id="${order.id}" data-status="${nextStatus}">
                                ${statusIcon}
                                <span>${statusText}</span>
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableBody.innerHTML = html;

            // Обработчик кликов на кнопки статусов
            tableBody.querySelectorAll('.status-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    const newStatus = e.currentTarget.dataset.status;
                    
                    try {
                        const res = await fetch(`http://127.0.0.1:5000/api/admin/orders/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                        });
                        const result = await res.json();
                        if (result.success) {
                            await loadOrders(); // Перезагружаем таблицу после обновления
                        } else {
                            alert('Ошибка обновления статуса');
                        }
                    } catch (error) {
                        console.error('Ошибка обновления статуса:', error);
                    }
                });
            });

            totalOrdersEl.textContent = orders.length;
            totalRevenueEl.textContent = `${new Intl.NumberFormat('ru-RU').format(totalSum)} ₽`;
            newOrdersEl.textContent = newOrdersCount;

        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Ошибка загрузки заказов. Проверьте, запущен ли Python-сервер.</td></tr>`;
        }
    }
});