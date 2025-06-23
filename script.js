// Data from the images
const locationData = [
    { location: "NYC", order_count: 123, total_revenue: 389576.55 },
    { location: "Madrid", order_count: 120, total_revenue: 385029.86 },
    { location: "Brickhaven", order_count: 74, total_revenue: 253444.62 },
    { location: "Singapore", order_count: 75, total_revenue: 252667.64 },
    { location: "Auckland", order_count: 72, total_revenue: 230397.11 },
    { location: "Paris", order_count: 74, total_revenue: 230191.16 },
    { location: "Philadelphia", order_count: 68, total_revenue: 230000 }
];

const customerData = [
    { name: "Rachel Ashworth", spent: 106480.33 },
    { name: "Frédérique Citeaux", spent: 97352.2 },
    { name: "Jeff Young", spent: 96387.7 },
    { name: "Mike Gao", spent: 93479.34 },
    { name: "Daniel Tonini", spent: 93157.66 },
    { name: "Jean King", spent: 92665.16 },
    { name: "Brydey Walker", spent: 92364.27 },
    { name: "Bradley Schuyler", spent: 92264.14 }
];

const monthlyData = [
    { month: "2003-01", actual: 116692.77, target: null },
    { month: "2003-02", actual: 128403.64, target: 175039.155 },
    { month: "2003-03", actual: 169517.14, target: 175039.155 },
    { month: "2003-04", actual: 185848.59, target: 175039.155 },
    { month: "2003-05", actual: 179435.55, target: 278772.885 },
    { month: "2003-06", actual: 150470.77, target: 278772.885 },
    { month: "2003-07", actual: 201940.36, target: 278772.885 }
];

const productData = [
    { name: "1952 Alpine Renault 1300", revenue: 9000, inventory: 7305, price: 98.58, category: "Classic Cars" },
    { name: "1957 Corvette Convertible", revenue: 8500, inventory: 1249, price: 69.93, category: "Classic Cars" },
    { name: "American Airlines: MD-11S", revenue: 8200, inventory: 8820, price: 74.03, category: "Planes" },
    { name: "Boeing X-32A JSF", revenue: 8100, inventory: 6484, price: 32.77, category: "Planes" },
    { name: "1969 Harley Davidson Ultimate Chopper", revenue: 8000, inventory: 5582, price: 48.81, category: "Motorcycles" },
    { name: "2002 Suzuki XREO", revenue: 7800, inventory: 9772, price: 66.27, category: "Motorcycles" },
    { name: "1999 Honda Civic", revenue: 7500, inventory: 9772, price: 64.50, category: "Modern Cars" },
    { name: "1937 Lincoln Berline", revenue: 7200, inventory: 8693, price: 60.62, category: "Classic Cars" },
    { name: "1912 Ford Model T Delivery Wagon", revenue: 7000, inventory: 9173, price: 46.91, category: "Vintage Cars" },
    { name: "1968 Dodge Charger", revenue: 6800, inventory: 9123, price: 75.16, category: "Muscle Cars" }
];

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

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Monthly Sales Chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.month.substr(5)),
            datasets: [{
                label: 'Actual Sales',
                data: monthlyData.map(d => d.actual),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Target Sales',
                data: monthlyData.map(d => d.target),
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
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
    new Chart(locationCtx, {
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

    // Customers Chart
    const customersCtx = document.getElementById('customersChart').getContext('2d');
    new Chart(customersCtx, {
        type: 'bar',
        data: {
            labels: customerData.map(d => d.name.split(' ')[0]),
            datasets: [{
                label: 'Total Spending',
                data: customerData.map(d => d.spent),
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
    new Chart(customerDistCtx, {
        type: 'pie',
        data: {
            labels: customerData.map(d => d.name.split(' ')[0]),
            datasets: [{
                data: customerData.map(d => d.spent),
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
    new Chart(locationOrdersCtx, {
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
    new Chart(locationRevenueCtx, {
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
    new Chart(productRevenueCtx, {
        type: 'bar',
        data: {
            labels: productData.slice(0, 5).map(d => d.name.split(' ').slice(0, 3).join(' ')),
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
    new Chart(productInventoryCtx, {
        type: 'bar',
        data: {
            labels: productData.map(d => d.name.split(' ').slice(0, 2).join(' ')),
            datasets: [{
                label: 'Inventory Level',
                data: productData.map(d => d.inventory),
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
    new Chart(priceInventoryCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Products',
                data: productData.map(d => ({
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
                            const product = productData[context.dataIndex];
                            return product.name + ' - Price: $' + context.parsed.x + ', Inventory: ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Product Category Distribution Chart
    const categoryData = productData.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
    }, {});

    const productCategoryCtx = document.getElementById('productCategoryChart').getContext('2d');
    new Chart(productCategoryCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'
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
});
