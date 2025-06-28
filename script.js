// Global variables to store data
let locationData = [];
let customerData = [];
let monthlyData = [];
let productData = [];
let chartInstances = {};
let productInventoryData = [];
let refreshInterval;
let isAutoRefreshEnabled = false;
const REFRESH_INTERVAL_MS = 30000; // 30 seconds

// Fetch data from PHP endpoints
async function fetchData() {
    try {
        showLoadingIndicator();
        
        const [
            locationResponse,
            customerResponse,
            monthlyResponse,
            productResponse,
            inventoryResponse
        ] = await Promise.all([
            fetch('get_data.php?action=location_sales'),
            fetch('get_data.php?action=top_customers'),
            fetch('get_data.php?action=revenue_target'),
            fetch('get_data.php?action=product_sales'),
            fetch('get_data.php?action=product_inventory')
        ]);

        // Check if all responses are OK
        if (!locationResponse.ok) throw new Error(`Location data failed: ${locationResponse.status}`);
        if (!customerResponse.ok) throw new Error(`Customer data failed: ${customerResponse.status}`);
        if (!monthlyResponse.ok) throw new Error(`Monthly data failed: ${monthlyResponse.status}`);
        if (!productResponse.ok) throw new Error(`Product data failed: ${productResponse.status}`);
        if (!inventoryResponse.ok) throw new Error(`Inventory data failed: ${inventoryResponse.status}`);

        locationData = await locationResponse.json();
        customerData = await customerResponse.json();
        monthlyData = await monthlyResponse.json();
        productData = await productResponse.json();
        productInventoryData = await inventoryResponse.json();

        // Update stats with real data
        updateStats();

        // Initialize all charts with real data (this will destroy old charts first)
        initializeCharts();
        
        // Hide loading indicator
        hideLoadingIndicator();
        
        // Update last refresh time
        updateLastRefreshTime();
        
        // Clear any error messages
        hideErrorMessage();

    } catch (error) {
        console.error('Error fetching data:', error);
        hideLoadingIndicator();
        
        // Only show canvas error if it's not a fetch error
        if (error.message.includes('Canvas is already in use')) {
            showErrorMessage('Chart refresh error - trying to fix...');
            // Try to destroy charts and retry
            destroyAllCharts();
            setTimeout(() => {
                if (locationData.length > 0) { // Only if we have data
                    initializeCharts();
                    hideErrorMessage();
                }
            }, 100);
        } else {
            showErrorMessage('Failed to fetch data. Retrying in next refresh cycle...');
        }
    }
}


// Update dashboard stats with real data
function updateStats() {
    // Calculate total revenue
    const totalRevenue = locationData.reduce((sum, loc) => sum + loc.total_revenue, 0);
    document.querySelector('.stat-card .stat-value').textContent = '$' + (totalRevenue / 1000000).toFixed(2) + 'M';

    // Active locations
    document.querySelectorAll('.stat-card')[1].querySelector('.stat-value').textContent = locationData.length;

    // Top customers count
    document.querySelectorAll('.stat-card')[2].querySelector('.stat-value').textContent = customerData.length;

    // Calculate target achievement for latest month
    const latestMonth = monthlyData[monthlyData.length - 1];
    if (latestMonth && latestMonth.target_sales) {
        const achievement = ((latestMonth.actual_sales / latestMonth.target_sales) * 100).toFixed(1);
        document.querySelectorAll('.stat-card')[3].querySelector('.stat-value').textContent = achievement + '%';
    }

    // Update customer stats
    if (customerData.length > 0) {
        const topCustomer = customerData[0];
        const avgSpend = customerData.reduce((sum, c) => sum + c.total_spent, 0) / customerData.length;

        // Update customer view stats
        setTimeout(() => {
            const customerStats = document.querySelectorAll('#customers-view .stat-card');
            if (customerStats.length > 0) {
                customerStats[0].querySelector('.stat-value').textContent = '$' + (topCustomer.total_spent / 1000).toFixed(1) + 'K';
                customerStats[1].querySelector('.stat-value').textContent = '$' + (avgSpend / 1000).toFixed(1) + 'K';
                customerStats[2].querySelector('.stat-value').textContent = topCustomer.full_name.split(' ')[0];

                const topCustomerShare = ((topCustomer.total_spent / totalRevenue) * 100).toFixed(1);
                customerStats[3].querySelector('.stat-value').textContent = topCustomerShare + '%';
            }
        }, 100);
    }

    // Update location stats
    if (locationData.length > 0) {
        const topLocation = locationData[0];
        const avgOrders = locationData.reduce((sum, loc) => sum + loc.order_count, 0) / locationData.length;

        setTimeout(() => {
            const locationStats = document.querySelectorAll('#locations-view .stat-card');
            if (locationStats.length > 0) {
                locationStats[0].querySelector('.stat-value').textContent = topLocation.location;
                locationStats[1].querySelector('.stat-value').textContent = '$' + (topLocation.total_revenue / 1000).toFixed(1) + 'K';
                locationStats[2].querySelector('.stat-value').textContent = Math.round(avgOrders);

                const marketShare = ((topLocation.total_revenue / totalRevenue) * 100).toFixed(1);
                locationStats[3].querySelector('.stat-value').textContent = marketShare + '%';
            }
        }, 100);
    }

    // Update product stats
    if (productData.length > 0 && productInventoryData.length > 0) {
        const topProduct = productData[0];
        const avgPrice = productInventoryData.reduce((sum, p) => sum + p.price, 0) / productInventoryData.length;
        const maxInventory = Math.max(...productInventoryData.map(p => p.inventory));

        setTimeout(() => {
            const productStats = document.querySelectorAll('#products-view .stat-card');
            if (productStats.length > 0) {
                productStats[0].querySelector('.stat-value').textContent = productInventoryData.length;
                productStats[1].querySelector('.stat-value').textContent = topProduct.product;
                productStats[2].querySelector('.stat-value').textContent = maxInventory.toLocaleString();
                productStats[3].querySelector('.stat-value').textContent = '$' + avgPrice.toFixed(0);
            }
        }, 100);
    }
}

// Tab switching function
function showView(viewName, event) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected view
    document.getElementById(viewName + '-view').classList.add('active');

    // Mark clicked tab as active
    event.target.classList.add('active');
}

// Chart configurations
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 20,
                usePointStyle: true
            }
        }
    }
};

// Initialize charts with real data
function initializeCharts() {
    // Destroy existing charts first
    destroyAllCharts();
    
    // DEV2 Step 1: Revenue vs Target Chart (replaces Monthly Sales Performance)
    const revenueTargetCtx = document.getElementById('monthlyChart').getContext('2d');
    chartInstances.monthlyChart = new Chart(revenueTargetCtx, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => new Date(d.month + '-01').toLocaleDateString('en-US', {month: 'short'})),
            datasets: [{
                label: 'Actual Sales',
                data: monthlyData.map(d => d.actual_sales),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Target Sales (50% Growth)',
                data: monthlyData.map(d => d.target_sales),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                borderDash: [5, 5]
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });

    // Location Revenue Chart
    const locationCtx = document.getElementById('locationChart').getContext('2d');
    chartInstances.locationChart = new Chart(locationCtx, {
        type: 'doughnut',
        data: {
            labels: locationData.map(d => d.location),
            datasets: [{
                data: locationData.map(d => d.total_revenue),
                backgroundColor: [
                    '#007bff', '#28a745', '#ffc107', '#dc3545',
                    '#6f42c1', '#fd7e14', '#20c997'
                ]
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': $' + context.parsed.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // DEV3 Step 2: Top Customers Chart
    const customersCtx = document.getElementById('customersChart').getContext('2d');
    chartInstances.customersChart = new Chart(customersCtx, {
        type: 'bar',
        data: {
            labels: customerData.map(d => d.full_name),
            datasets: [{
                label: 'Total Spending',
                data: customerData.map(d => d.total_spent),
                backgroundColor: 'rgba(0, 123, 255, 0.8)',
                borderColor: '#007bff',
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });

    // Customer Distribution Chart
    const customerDistCtx = document.getElementById('customerDistChart').getContext('2d');
    chartInstances.customerDistChart = new Chart(customerDistCtx, {
        type: 'pie',
        data: {
            labels: customerData.map(d => d.full_name.split(' ')[0]),
            datasets: [{
                data: customerData.map(d => d.total_spent),
                backgroundColor: [
                    '#007bff', '#28a745', '#ffc107', '#dc3545',
                    '#6f42c1', '#fd7e14', '#20c997', '#6c757d'
                ]
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': $' + context.parsed.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Location Orders Chart
    const locationOrdersCtx = document.getElementById('locationOrdersChart').getContext('2d');
    chartInstances.locationOrdersChart = new Chart(locationOrdersCtx, {
        type: 'bar',
        data: {
            labels: locationData.map(d => d.location),
            datasets: [{
                label: 'Order Count',
                data: locationData.map(d => d.order_count),
                backgroundColor: 'rgba(40, 167, 69, 0.8)',
                borderColor: '#28a745',
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Location Revenue Distribution Chart
    const locationRevenueCtx = document.getElementById('locationRevenueChart').getContext('2d');
    chartInstances.locationRevenueChart = new Chart(locationRevenueCtx, {
        type: 'polarArea',
        data: {
            labels: locationData.map(d => d.location),
            datasets: [{
                data: locationData.map(d => d.total_revenue),
                backgroundColor: [
                    'rgba(0, 123, 255, 0.7)', 'rgba(40, 167, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)', 'rgba(220, 53, 69, 0.7)',
                    'rgba(111, 66, 193, 0.7)', 'rgba(253, 126, 20, 0.7)',
                    'rgba(32, 201, 151, 0.7)'
                ]
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': $' + context.parsed.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Product Revenue Chart
    const productRevenueCtx = document.getElementById('productRevenueChart').getContext('2d');
    chartInstances.productRevenueChart = new Chart(productRevenueCtx, {
        type: 'bar',
        data: {
            labels: productData.slice(0, 5).map(d => d.product.split(' ').slice(0, 3).join(' ')),
            datasets: [{
                label: 'Revenue ($)',
                data: productData.slice(0, 5).map(d => d.revenue),
                backgroundColor: [
                    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'
                ],
                borderColor: [
                    '#0056b3', '#1e7e34', '#e0a800', '#c82333', '#5a2d91'
                ],
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });

    // Product Inventory Chart
    const productInventoryCtx = document.getElementById('productInventoryChart').getContext('2d');
    chartInstances.productInventoryChart = new Chart(productInventoryCtx, {
        type: 'bar',
        data: {
            labels: productInventoryData.map(d => d.product.split(' ').slice(0, 2).join(' ')),
            datasets: [{
                label: 'Inventory Level',
                data: productInventoryData.map(d => d.inventory),
                backgroundColor: 'rgba(111, 66, 193, 0.8)',
                borderColor: '#6f42c1',
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Price vs Inventory Scatter Chart
    const priceInventoryCtx = document.getElementById('priceInventoryChart').getContext('2d');
    chartInstances.priceInventoryChart = new Chart(priceInventoryCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Products',
                data: productInventoryData.map(d => ({
                    x: d.price,
                    y: d.inventory
                })),
                backgroundColor: 'rgba(253, 126, 20, 0.6)',
                borderColor: '#fd7e14',
                borderWidth: 2,
                pointRadius: 8,
                pointHoverRadius: 10
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Inventory Level'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const product = productInventoryData[context.dataIndex];
                            return product.product + ' - Price: $' + context.parsed.x + ', Inventory: ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Product Category Distribution Chart (simplified since we don't have category data)
    const productCategoryCtx = document.getElementById('productCategoryChart').getContext('2d');
    chartInstances.productCategoryChart = new Chart(productCategoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['High Value', 'Medium Value', 'Low Value'],
            datasets: [{
                data: [
                    productInventoryData.filter(p => p.price > 80).length,
                    productInventoryData.filter(p => p.price >= 50 && p.price <= 80).length,
                    productInventoryData.filter(p => p.price < 50).length
                ],
                backgroundColor: [
                    '#007bff', '#28a745', '#ffc107'
                ]
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' products';
                        }
                    }
                }
            }
        }
    });
}

function destroyAllCharts() {
    // Destroy all existing chart instances
    Object.keys(chartInstances).forEach(chartId => {
        if (chartInstances[chartId] && typeof chartInstances[chartId].destroy === 'function') {
            try {
                chartInstances[chartId].destroy();
            } catch (error) {
                console.warn(`Error destroying chart ${chartId}:`, error);
            }
        }
    });
    
    // Clear the instances object
    chartInstances = {};
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    fetchData();
    
    // Start auto-refresh by default
    startAutoRefresh();
    
    // Add event listeners for refresh buttons
    const autoRefreshBtn = document.getElementById('autoRefreshBtn');
    const manualRefreshBtn = document.getElementById('manualRefreshBtn');
    
    if (autoRefreshBtn) {
        autoRefreshBtn.addEventListener('click', toggleAutoRefresh);
    }
    
    if (manualRefreshBtn) {
        manualRefreshBtn.addEventListener('click', manualRefresh);
    }
});

// Auto-refresh functions
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
        fetchData();
    }, REFRESH_INTERVAL_MS);
    
    isAutoRefreshEnabled = true;
    updateRefreshButton();
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    isAutoRefreshEnabled = false;
    updateRefreshButton();
}

function toggleAutoRefresh() {
    if (isAutoRefreshEnabled) {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
    }
}

function manualRefresh() {
    fetchData();
}

function updateRefreshButton() {
    const autoRefreshBtn = document.getElementById('autoRefreshBtn');
    const manualRefreshBtn = document.getElementById('manualRefreshBtn');
    
    if (autoRefreshBtn) {
        autoRefreshBtn.textContent = isAutoRefreshEnabled ? 'Stop Auto-Refresh' : 'Start Auto-Refresh';
        autoRefreshBtn.className = isAutoRefreshEnabled ? 'refresh-btn active' : 'refresh-btn';
    }
}

function updateLastRefreshTime() {
    const lastRefreshEl = document.getElementById('lastRefresh');
    if (lastRefreshEl) {
        const now = new Date();
        lastRefreshEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

function showLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
    }
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function showErrorMessage(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

function hideErrorMessage() {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
}

window.addEventListener('beforeunload', function() {
    destroyAllCharts();
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});