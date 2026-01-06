document.addEventListener('DOMContentLoaded', () => {
    
    const ctx = document.getElementById('weeklyPerformanceChart');
    
    if (ctx) {
    
        fetch('/get_chart_data')
            .then(response => response.json())
            .then(grafikVerisi => {
                
                new Chart(ctx, {
                    type: 'line', 
                    data: {
                        labels: grafikVerisi.labels, 
                        datasets: [{
                            label: 'Genel Dikkat Başarısı (%)',
                            data: grafikVerisi.data, 
                            borderColor: '#007bff', 
                            backgroundColor: 'rgba(0, 123, 255, 0.1)', 
                            borderWidth: 3,
                            tension: 0.3, 
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#007bff',
                            pointRadius: 5,
                            fill: true 
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100, 
                                title: {
                                    display: true,
                                    text: 'Başarı Puanı'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Tarih (Gün.Ay)'
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => console.error("Grafik yüklenirken hata:", error));
    }
});
